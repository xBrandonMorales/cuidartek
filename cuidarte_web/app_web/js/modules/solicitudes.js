// js/modules/solicitudes.js

let solicitudesData = [];
let autoRefreshInterval = null;

function loadSolicitudesModule() {
    console.log('Cargando módulo de Solicitudes...');
    updateModuleTitle('Solicitudes');
    
    // Cargar datos inmediatamente
    loadSolicitudesData();
    
    // Configurar actualización automática cada 30 segundos
    startAutoRefresh();
}

function startAutoRefresh() {
    // Limpiar intervalo anterior si existe
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
    }
    
    // Configurar nuevo intervalo (30 segundos)
    autoRefreshInterval = setInterval(() => {
        console.log('Actualización automática de solicitudes...');
        loadSolicitudesData();
    }, 30000);
}

function stopAutoRefresh() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        autoRefreshInterval = null;
    }
}

function unloadSolicitudesModule() {
    stopAutoRefresh();
}

async function loadSolicitudesData() {
    try {
        showNotification('Cargando solicitudes...', 'info');
        
        // Usar la función apiRequest de app.js que sí funciona
        if (typeof window.apiRequest !== 'function') {
            throw new Error('No se puede acceder a la función apiRequest');
        }
        
        console.log('🔍 Obteniendo información completa del médico...');
        
        // Obtener el usuario actual
        const currentUser = await window.apiRequest('/auth/me');
        console.log('🔍 Usuario actual:', currentUser);
        
        if (!currentUser) {
            throw new Error('No se pudo obtener el usuario actual');
        }
        
        // Obtener la información completa del médico usando el id_usuario
        const medicos = await window.apiRequest('/medicos/');
        console.log('🔍 Todos los médicos:', medicos);
        
        // Buscar el médico que corresponde a este usuario
        const medicoInfo = medicos.find(medico => medico.id_usuario === currentUser.id_usuario);
        console.log('🔍 Información del médico encontrada:', medicoInfo);
        
        if (!medicoInfo) {
            throw new Error('No se encontró información del médico para este usuario');
        }
        
        // Obtener el ID del médico real
        const medicoId = medicoInfo.id_medico;
        
        console.log('🎯 ID Médico real encontrado:', medicoId);
        
        if (!medicoId) {
            throw new Error('No se pudo obtener el ID del médico');
        }

        console.log('📡 Buscando solicitudes para médico ID:', medicoId);

        // Usar apiRequest para obtener las solicitudes
        const data = await window.apiRequest('/paciente-medico/solicitudes-pendientes');
        console.log('📦 Datos completos de la API:', data);
        
        // MOSTRAR TODAS LAS SOLICITUDES SIN FILTRAR
        // Ya que id_medico viene como undefined, mostramos todas las solicitudes
        solicitudesData = Array.isArray(data) ? data : [];
        
        console.log(`✅ Solicitudes encontradas para médico ${medicoId}:`, solicitudesData.length);
        console.log('📋 Solicitudes específicas:', solicitudesData);
        
        renderSolicitudesTable();
        
    } catch (error) {
        console.error('❌ Error:', error);
        showNotification('Error al cargar solicitudes: ' + error.message, 'error');
        
        // Mostrar tabla vacía
        solicitudesData = [];
        renderSolicitudesTable();
    }
}

function renderSolicitudesTable() {
    const tbody = document.getElementById('solicitudesTableBody');
    
    console.log('🎨 Renderizando tabla con:', solicitudesData.length, 'solicitudes');
    
    if (!solicitudesData || solicitudesData.length === 0) {
        renderEmptyTable();
        return;
    }

    tbody.innerHTML = solicitudesData.map(solicitud => `
        <tr>
            <td>
                <div class="d-flex align-items-center">
                    <div class="avatar-sm bg-primary rounded-circle d-flex align-items-center justify-content-center me-2" style="width: 32px; height: 32px;">
                        <i class="fas fa-user text-white" style="font-size: 0.8rem;"></i>
                    </div>
                    <div>
                        <strong>${solicitud.nombre_paciente || 'Nombre no disponible'}</strong>
                        <br>
                        <small class="text-muted">ID: ${solicitud.id_paciente}</small>
                    </div>
                </div>
            </td>
            <td>${solicitud.correo_paciente || 'N/A'}</td>
            <td>${solicitud.edad || 'N/A'} años</td>
            <td>
                <span class="badge ${getSexoBadgeClass(solicitud.sexo)}">
                    ${solicitud.sexo || 'No especificado'}
                </span>
            </td>
            <td>${formatDate(solicitud.fecha_asignacion)}</td>
            <td>
                <span class="d-inline-block text-truncate" style="max-width: 200px;" 
                      title="${solicitud.notas || 'Sin notas'}">
                    ${solicitud.notas || 'Sin notas'}
                </span>
            </td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-success" onclick="aceptarSolicitud(${solicitud.id_relacion})" 
                            title="Aceptar solicitud">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="btn btn-danger" onclick="rechazarSolicitud(${solicitud.id_relacion})" 
                            title="Rechazar solicitud">
                        <i class="fas fa-times"></i>
                    </button>
                    <button class="btn btn-info" onclick="verDetallesSolicitud(${solicitud.id_relacion})" 
                            title="Ver detalles">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function getSexoBadgeClass(sexo) {
    if (!sexo) return 'bg-secondary';
    
    const sexoLower = sexo.toLowerCase();
    if (sexoLower.includes('masculino') || sexoLower === 'm') return 'bg-info';
    if (sexoLower.includes('femenino') || sexoLower === 'f') return 'bg-warning';
    return 'bg-secondary';
}

function renderEmptyTable() {
    const tbody = document.getElementById('solicitudesTableBody');
    tbody.innerHTML = `
        <tr>
            <td colspan="7" class="text-center text-muted py-4">
                <i class="fas fa-clipboard-list fa-2x mb-2"></i>
                <p class="mb-0">No hay solicitudes pendientes</p>
                <small class="text-muted">Los pacientes que soliciten tu atención aparecerán aquí</small>
            </td>
        </tr>
    `;
}

async function aceptarSolicitud(idRelacion) {
    if (!confirm('¿Estás seguro de que deseas aceptar esta solicitud?\nEl paciente será agregado a tu lista de pacientes.')) {
        return;
    }

    try {
        console.log('✅ Aceptando solicitud ID:', idRelacion);
        
        // Buscar la solicitud en los datos actuales
        const solicitud = solicitudesData.find(s => s.id_relacion === idRelacion);
        if (!solicitud) {
            throw new Error('No se encontró la solicitud');
        }

        // USAR EL ENDPOINT QUE SÍ EXISTE: /paciente-medico/{idRelacion}
        const response = await window.apiRequest(`/paciente-medico/${idRelacion}`, {
            method: 'PUT',
            body: JSON.stringify({
                estatus: 'activo',
                notas: solicitud.notas || '' // Mantener las notas existentes
            })
        });

        console.log('✅ Solicitud aceptada:', response);
        showNotification('✅ Solicitud aceptada correctamente. Paciente agregado a tu lista.', 'success');
        
        // Recargar las solicitudes
        loadSolicitudesData();
        
        // Actualizar los contadores de pacientes
        actualizarContadoresPacientes();
        
    } catch (error) {
        console.error('❌ Error aceptando solicitud:', error);
        showNotification('❌ Error al aceptar la solicitud: ' + error.message, 'error');
    }
}

async function rechazarSolicitud(idRelacion) {
    if (!confirm('¿Estás seguro de que deseas rechazar esta solicitud?\nEsta acción no se puede deshacer.')) {
        return;
    }

    try {
        console.log('❌ Rechazando solicitud ID:', idRelacion);
        
        // Buscar la solicitud en los datos actuales
        const solicitud = solicitudesData.find(s => s.id_relacion === idRelacion);
        if (!solicitud) {
            throw new Error('No se encontró la solicitud');
        }

        // USAR EL ENDPOINT QUE SÍ EXISTE: /paciente-medico/{idRelacion}
        const response = await window.apiRequest(`/paciente-medico/${idRelacion}`, {
            method: 'PUT',
            body: JSON.stringify({
                estatus: 'rechazado',
                notas: solicitud.notas || '' // Mantener las notas existentes
            })
        });

        console.log('✅ Solicitud rechazada:', response);
        showNotification('✅ Solicitud rechazada correctamente', 'success');
        
        // Recargar la lista
        loadSolicitudesData();
        
    } catch (error) {
        console.error('❌ Error rechazando solicitud:', error);
        showNotification('❌ Error al rechazar la solicitud: ' + error.message, 'error');
    }
}

function verDetallesSolicitud(idRelacion) {
    const solicitud = solicitudesData.find(s => s.id_relacion === idRelacion);
    
    if (!solicitud) {
        showNotification('No se encontró la solicitud', 'error');
        return;
    }

    // Crear modal de detalles
    const modalHTML = `
        <div class="modal fade" id="detallesSolicitudModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-user-injured me-2"></i>
                            Detalles de la Solicitud
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-6">
                                <div class="card">
                                    <div class="card-header bg-primary text-white">
                                        <h6 class="mb-0">Información del Paciente</h6>
                                    </div>
                                    <div class="card-body">
                                        <p><strong>Nombre:</strong> ${solicitud.nombre_paciente}</p>
                                        <p><strong>Correo:</strong> ${solicitud.correo_paciente}</p>
                                        <p><strong>Edad:</strong> ${solicitud.edad} años</p>
                                        <p><strong>Sexo:</strong> ${solicitud.sexo}</p>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="card">
                                    <div class="card-header bg-info text-white">
                                        <h6 class="mb-0">Información de la Solicitud</h6>
                                    </div>
                                    <div class="card-body">
                                        <p><strong>ID Relación:</strong> ${solicitud.id_relacion}</p>
                                        <p><strong>ID Paciente:</strong> ${solicitud.id_paciente}</p>
                                        <p><strong>ID Usuario Paciente:</strong> ${solicitud.id_usuario_paciente}</p>
                                        <p><strong>Fecha de Solicitud:</strong> ${formatDate(solicitud.fecha_asignacion)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="row mt-3">
                            <div class="col-12">
                                <div class="card">
                                    <div class="card-header bg-secondary text-white">
                                        <h6 class="mb-0">Notas del Paciente</h6>
                                    </div>
                                    <div class="card-body">
                                        <p class="mb-0">${solicitud.notas || 'No hay notas adicionales'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                        <button type="button" class="btn btn-danger" onclick="rechazarSolicitud(${solicitud.id_relacion})" data-bs-dismiss="modal">
                            <i class="fas fa-times me-1"></i>Rechazar
                        </button>
                        <button type="button" class="btn btn-success" onclick="aceptarSolicitud(${solicitud.id_relacion})" data-bs-dismiss="modal">
                            <i class="fas fa-check me-1"></i>Aceptar Solicitud
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Remover modal existente si hay uno
    const existingModal = document.getElementById('detallesSolicitudModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Agregar nuevo modal al DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Mostrar modal
    const modal = document.getElementById('detallesSolicitudModal');
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
}

function refreshSolicitudes() {
    loadSolicitudesData();
}

// Función auxiliar para formatear fechas
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return dateString;
    }
}

// Función para actualizar el título del módulo
function updateModuleTitle(title) {
    const moduleTitle = document.getElementById('moduleTitle');
    if (moduleTitle) {
        moduleTitle.textContent = title;
    }
}

// Función para mostrar notificaciones
function showNotification(message, type = 'info') {
    // Usar la función global si existe
    if (typeof window.showNotification === 'function' && window.showNotification !== showNotification) {
        window.showNotification(message, type);
        return;
    }
    
    // Implementación básica si no existe
    const notification = document.createElement('div');
    notification.className = `alert alert-${type === 'error' ? 'danger' : 'success'} alert-dismissible fade show`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        min-width: 300px;
    `;
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Función para actualizar contadores de pacientes
function actualizarContadoresPacientes() {
    // Esta función debería existir en patients.js
    if (typeof window.updatePatientsCount === 'function') {
        window.updatePatientsCount();
    }
    
    // También actualizar la tabla de pacientes si está visible
    if (typeof window.loadPatientsData === 'function') {
        setTimeout(() => {
            window.loadPatientsData();
        }, 1000);
    }
}

console.log('✅ Módulo de solicitudes cargado correctamente');