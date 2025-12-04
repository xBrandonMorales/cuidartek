// Funciones del módulo de comunicación
let currentChatPatientId = null;
let chatInterval = null;

async function loadChats() {
    try {
        console.log('🔄 Cargando chats...');
        
        // Obtener mensajes recibidos (conversaciones con pacientes)
        const mensajesRecibidos = await apiRequest('/mensajes/recibidos');
        console.log('📨 Mensajes recibidos:', mensajesRecibidos);
        
        // Crear lista de chats únicos basados en los remitentes
        const chatsUnicos = {};
        
        mensajesRecibidos.forEach(mensaje => {
            const pacienteId = mensaje.id_remitente;
            const pacienteNombre = mensaje.nombre_remitente || `Paciente ${pacienteId}`;
            
            if (!chatsUnicos[pacienteId]) {
                chatsUnicos[pacienteId] = {
                    id: pacienteId,
                    patientName: pacienteNombre,
                    lastMessage: mensaje.contenido,
                    unread: mensaje.leido ? 0 : 1,
                    lastMessageTime: mensaje.fecha_envio
                };
            } else {
                // Mantener el mensaje más reciente
                const currentTime = new Date(chatsUnicos[pacienteId].lastMessageTime);
                const newTime = new Date(mensaje.fecha_envio);
                
                if (newTime > currentTime) {
                    chatsUnicos[pacienteId].lastMessage = mensaje.contenido;
                    chatsUnicos[pacienteId].lastMessageTime = mensaje.fecha_envio;
                }
                
                // Sumar no leídos
                if (!mensaje.leido) {
                    chatsUnicos[pacienteId].unread++;
                }
            }
        });

        // Convertir objeto a array y ordenar por fecha más reciente
        chats = Object.values(chatsUnicos).sort((a, b) => 
            new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
        );

        console.log('💬 Chats procesados:', chats);
        renderChatList();
        
    } catch (error) {
        console.error('❌ Error cargando chats:', error);
        showNotification('Error al cargar los chats', 'error');
        
        // Datos de ejemplo en caso de error
        chats = [
            { id: 1, patientName: 'Paciente Femenina 1', lastMessage: 'Hola doctor, tengo una pregunta...', unread: 2 },
            { id: 2, patientName: 'Paciente Masculino 2', lastMessage: 'Gracias por la receta', unread: 0 },
            { id: 3, patientName: 'Paciente Femenina 3', lastMessage: '¿Puedo cambiar la cita?', unread: 1 }
        ];
        renderChatList();
    }
}

function renderChatList() {
    chatList.innerHTML = '';
    
    if (chats.length === 0) {
        chatList.innerHTML = `
            <div class="text-center p-4 text-muted">
                <i class="fas fa-comments fa-2x mb-3"></i>
                <p>No hay conversaciones activas</p>
            </div>
        `;
        return;
    }
    
    chats.forEach(chat => {
        const item = document.createElement('a');
        item.href = '#';
        item.className = `list-group-item list-group-item-action ${currentChatPatientId === chat.id ? 'active' : ''}`;
        
        // Formatear fecha del último mensaje
        const lastMessageTime = chat.lastMessageTime ? 
            new Date(chat.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 
            '';
        
        // Acortar mensaje largo
        const shortMessage = chat.lastMessage.length > 50 ? 
            chat.lastMessage.substring(0, 50) + '...' : 
            chat.lastMessage;
        
        item.innerHTML = `
            <div class="d-flex w-100 justify-content-between align-items-start">
                <div class="flex-grow-1">
                    <h6 class="mb-1">${chat.patientName}</h6>
                    <p class="mb-1 text-muted small">${shortMessage}</p>
                </div>
                <div class="d-flex flex-column align-items-end">
                    ${chat.unread > 0 ? `<span class="badge bg-primary rounded-pill mb-1">${chat.unread}</span>` : ''}
                    <small class="text-muted">${lastMessageTime}</small>
                </div>
            </div>
        `;
        item.addEventListener('click', () => openChat(chat.id, chat.patientName));
        chatList.appendChild(item);
    });
}

async function openChat(patientId, patientName) {
    try {
        console.log(`💬 Abriendo chat con paciente ID: ${patientId}`);
        
        currentChatPatientId = patientId;
        chatTitle.textContent = `Chat con ${patientName}`;
        
        // Limpiar intervalo anterior si existe
        if (chatInterval) {
            clearInterval(chatInterval);
        }
        
        // Cargar conversación
        await loadConversation(patientId);
        
        // Iniciar polling para nuevos mensajes cada 5 segundos
        chatInterval = setInterval(async () => {
            if (currentChatPatientId === patientId) {
                await loadConversation(patientId);
            }
        }, 5000);
        
        // Actualizar lista de chats para resaltar el activo
        renderChatList();
        
    } catch (error) {
        console.error('❌ Error abriendo chat:', error);
        showNotification('Error al cargar la conversación', 'error');
    }
}

async function loadConversation(patientId) {
    try {
        const conversacion = await apiRequest(`/mensajes/conversacion/${patientId}`);
        console.log('📝 Conversación cargada:', conversacion);
        
        renderMessages(conversacion.conversacion);
        
        // Marcar mensajes como leídos
        await markMessagesAsRead(patientId);
        
    } catch (error) {
        console.error('❌ Error cargando conversación:', error);
        
        // Ignorar errores de logs y continuar
        if (error.message.includes('Data truncated for column') || error.message.includes('accion')) {
            console.log('⚠️ Error de log ignorado, continuando...');
            // Intentar obtener la conversación directamente
            try {
                const response = await fetch(`${API_BASE_URL}/mensajes/conversacion/${patientId}`, {
                    headers: {
                        'Authorization': `Bearer ${authToken}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.ok) {
                    const conversacion = await response.json();
                    renderMessages(conversacion.conversacion);
                    await markMessagesAsRead(patientId);
                    return;
                }
            } catch (secondError) {
                console.error('❌ Error en segundo intento:', secondError);
            }
        }
        
        // En caso de error real, mostrar mensaje de error
        chatMessages.innerHTML = `
            <div class="text-center p-4 text-muted">
                <i class="fas fa-exclamation-triangle fa-2x mb-3"></i>
                <p>Error al cargar la conversación</p>
                <small>${error.message}</small>
            </div>
        `;
    }
}

function renderMessages(mensajes) {
    chatMessages.innerHTML = '';
    
    if (!mensajes || mensajes.length === 0) {
        chatMessages.innerHTML = `
            <div class="text-center p-4 text-muted">
                <i class="fas fa-comments fa-2x mb-3"></i>
                <p>No hay mensajes en esta conversación</p>
                <small>Envía el primer mensaje</small>
            </div>
        `;
        return;
    }
    
    // Ordenar mensajes por fecha (más antiguos primero)
    mensajes.sort((a, b) => new Date(a.fecha_envio) - new Date(b.fecha_envio));
    
    mensajes.forEach(mensaje => {
        const messageDiv = document.createElement('div');
        const isDoctor = mensaje.id_remitente === currentUser.id_usuario;
        
        messageDiv.className = `d-flex mb-4 ${isDoctor ? 'justify-content-end' : 'justify-content-start'}`;
        
        const messageTime = new Date(mensaje.fecha_envio).toLocaleTimeString([], { 
            hour: '2-digit', minute: '2-digit' 
        });
        
        const messageDate = new Date(mensaje.fecha_envio).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short'
        });
        
        // Indicadores de estado de lectura
        let statusIndicator = '';
        if (isDoctor) {
            if (mensaje.leido) {
                statusIndicator = '<small class="text-primary ms-2"><i class="fas fa-check-double" title="Leído"></i></small>';
            } else {
                statusIndicator = '<small class="text-muted ms-2"><i class="fas fa-check" title="Enviado"></i></small>';
            }
        }
        
        // Determinar clase CSS según el remitente
        const messageClass = isDoctor ? 
            'doctor-message bg-primary text-white' : 
            'patient-message bg-light border';
        
        messageDiv.innerHTML = `
            <div class="${messageClass} rounded-3 p-3 message-bubble position-relative shadow-sm">
                <div class="message-content">
                    <div class="message-text mb-2" style="font-size: 1.1rem; line-height: 1.4;">
                        ${mensaje.contenido}
                    </div>
                    <div class="message-meta d-flex justify-content-between align-items-center">
                        <small class="${isDoctor ? 'text-white-50' : 'text-muted'}">
                            ${messageTime}
                        </small>
                        ${statusIndicator}
                    </div>
                </div>
                ${!isDoctor && !mensaje.leido ? 
                    '<div class="position-absolute top-0 start-0 translate-middle p-1 bg-danger border border-light rounded-circle" title="No leído"></div>' : 
                    ''
                }
            </div>
        `;
        
        chatMessages.appendChild(messageDiv);
    });
    
    // Scroll al final
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function markMessagesAsRead(patientId) {
    try {
        // Obtener mensajes no leídos de este paciente
        const mensajesRecibidos = await apiRequest('/mensajes/recibidos');
        const mensajesNoLeidos = mensajesRecibidos.filter(mensaje => 
            mensaje.id_remitente === patientId && !mensaje.leido
        );
        
        // Marcar cada mensaje como leído
        for (const mensaje of mensajesNoLeidos) {
            await apiRequest(`/mensajes/${mensaje.id_mensaje}/leer`, {
                method: 'PUT'
            });
        }
        
        // Recargar lista de chats para actualizar contadores
        if (mensajesNoLeidos.length > 0) {
            await loadChats();
        }
        
    } catch (error) {
        console.error('❌ Error marcando mensajes como leídos:', error);
    }
}

async function sendMessage() {
    const text = messageInput.value.trim();
    
    if (!text) {
        showNotification('Por favor escribe un mensaje', 'error');
        return;
    }
    
    if (!currentChatPatientId) {
        showNotification('Selecciona una conversación primero', 'error');
        return;
    }
    
    try {
        const messageData = {
            id_remitente: currentUser.id_usuario,
            id_destinatario: currentChatPatientId,
            contenido: text,
            leido: false
        };

        console.log('📤 Enviando mensaje:', messageData);

        await apiRequest('/mensajes/', {
            method: 'POST',
            body: JSON.stringify(messageData)
        });

        // Limpiar input
        messageInput.value = '';
        
        // Recargar conversación
        await loadConversation(currentChatPatientId);
        
        // Recargar lista de chats para actualizar último mensaje
        await loadChats();
        
    } catch (error) {
        console.error('❌ Error enviando mensaje:', error);
        showNotification('Error al enviar el mensaje: ' + error.message, 'error');
    }
}

// Función para limpiar el intervalo cuando se cambia de módulo
function cleanupChats() {
    if (chatInterval) {
        clearInterval(chatInterval);
        chatInterval = null;
    }
    currentChatPatientId = null;
}

// Función para exportar conversación
async function exportConversation() {
    if (!currentChatPatientId) {
        showNotification('Selecciona una conversación primero', 'error');
        return;
    }
    
    try {
        const conversacion = await apiRequest(`/mensajes/conversacion/${currentChatPatientId}`);
        
        // Crear contenido para exportar
        let contenido = `Conversación con ${chatTitle.textContent.replace('Chat con ', '')}\n`;
        contenido += `Exportado: ${new Date().toLocaleString()}\n\n`;
        
        conversacion.conversacion.forEach(mensaje => {
            const remitente = mensaje.id_remitente === currentUser.id_usuario ? 'Tú' : mensaje.nombre_remitente;
            const fecha = new Date(mensaje.fecha_envio).toLocaleString();
            contenido += `[${fecha}] ${remitente}: ${mensaje.contenido}\n`;
        });
        
        // Crear y descargar archivo
        const blob = new Blob([contenido], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `conversacion_${currentChatPatientId}_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showNotification('Conversación exportada correctamente', 'success');
        
    } catch (error) {
        console.error('❌ Error exportando conversación:', error);
        showNotification('Error al exportar la conversación', 'error');
    }
}

// Función para limpiar chat (solo visual)
function clearChat() {
    if (!currentChatPatientId) {
        showNotification('Selecciona una conversación primero', 'error');
        return;
    }
    
    if (confirm('¿Estás seguro de que quieres limpiar esta conversación? Esto solo la limpiará de tu vista.')) {
        chatMessages.innerHTML = `
            <div class="text-center p-4 text-muted">
                <i class="fas fa-comments fa-2x mb-3"></i>
                <p>Conversación limpiada</p>
                <small>Los mensajes siguen guardados en el sistema</small>
            </div>
        `;
        showNotification('Conversación limpiada', 'info');
    }
}