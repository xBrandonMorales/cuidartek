// Módulo de Perfil de Usuario
let userProfileData = null;
let medicoProfileData = null;

// Función para mostrar el perfil
async function showProfile() {
    try {
        console.log('👤 Cargando perfil del usuario...');
        
        // Cargar datos del perfil
        await loadProfileData();
        
        // Cargar datos específicos del médico
        await loadMedicoProfileData();
        
        // Cargar estadísticas
        await loadProfileStatistics();
        
        // Mostrar el modal
        const modal = new bootstrap.Modal(document.getElementById('profileModal'));
        modal.show();
        
    } catch (error) {
        console.error('❌ Error cargando perfil:', error);
        showNotification('Error al cargar el perfil', 'error');
    }
}

// Función para cargar datos del perfil base
async function loadProfileData() {
    try {
        // El usuario actual ya está en currentUser
        userProfileData = currentUser;
        
        console.log('📋 Datos del perfil base:', userProfileData);
        
        // Llenar el formulario con los datos base
        document.getElementById('profileName').textContent = userProfileData.nombre;
        document.getElementById('profileStatus').textContent = userProfileData.estatus || 'Activo';
        document.getElementById('profileUserId').value = userProfileData.id_usuario;
        document.getElementById('profileEmail').value = userProfileData.correo;
        document.getElementById('profileRole').value = userProfileData.rol === 'medico' ? 'Médico' : 
                                                     userProfileData.rol === 'admin' ? 'Administrador' : 'Paciente';
        
        // Aplicar clases según el estado
        const statusBadge = document.getElementById('profileStatus');
        statusBadge.className = userProfileData.estatus === 'Activo' ? 
            'badge bg-success' : 'badge bg-secondary';
            
    } catch (error) {
        console.error('❌ Error cargando datos del perfil base:', error);
        throw error;
    }
}

// Función para cargar datos específicos del médico
async function loadMedicoProfileData() {
    try {
        // Intentar obtener datos del médico de diferentes formas
        medicoProfileData = await getMedicoData();
        console.log('🏥 Datos del médico:', medicoProfileData);
        
        if (medicoProfileData) {
            // Llenar los campos específicos del médico
            document.getElementById('profileSpecialty').value = medicoProfileData.especialidad || 'No especificada';
            document.getElementById('profilePhone').value = medicoProfileData.telefono_consultorio || 'No especificado';
            document.getElementById('profileBio').value = medicoProfileData.universidad || 'No especificada';
            document.getElementById('profileAddress').value = medicoProfileData.direccion_consultorio || 'No especificada';
            
            // Actualizar la información de la tarjeta lateral con datos del médico
            updateMedicoCardInfo();
        } else {
            // Si no hay datos del médico, usar datos del usuario
            setDefaultMedicoValues();
        }
        
    } catch (error) {
        console.error('❌ Error cargando datos del médico:', error);
        setDefaultMedicoValues();
        showNotification('No se pudieron cargar los datos profesionales del médico', 'warning');
    }
}

// Función para obtener datos del médico (múltiples intentos)
async function getMedicoData() {
    try {
        // Intento 1: Buscar en la lista de médicos si está disponible
        const medicos = await apiRequest('/medicos/');
        const medico = medicos.find(m => m.id_usuario === currentUser.id_usuario);
        if (medico) return medico;
        
        // Intento 2: Buscar por ID directo si tenemos el id_medico
        if (currentUser.id_medico) {
            return await apiRequest(`/medicos/${currentUser.id_medico}`);
        }
        
        // Intento 3: Buscar por usuario ID (si el endpoint existe)
        try {
            return await apiRequest(`/medicos/usuario/${currentUser.id_usuario}`);
        } catch (e) {
            console.log('Endpoint /medicos/usuario/ no disponible');
        }
        
        return null;
    } catch (error) {
        console.error('Error en getMedicoData:', error);
        return null;
    }
}

// Función para establecer valores por defecto
function setDefaultMedicoValues() {
    document.getElementById('profileSpecialty').value = 'Medicina General';
    document.getElementById('profilePhone').value = 'No especificado';
    document.getElementById('profileBio').value = 'No especificada';
    document.getElementById('profileAddress').value = 'No especificada';
    
    // Actualizar tarjeta con valores por defecto
    const medicoCard = document.querySelector('#profileModal .col-md-4 .card');
    if (medicoCard) {
        medicoCard.innerHTML = `
            <div class="card-body">
                <h6 class="card-title">Información Profesional</h6>
                <div class="small text-muted">
                    <p>No se encontraron datos profesionales específicos.</p>
                    <p class="mb-0">Contacte al administrador para completar su perfil médico.</p>
                </div>
            </div>
        `;
    }
}

// Función para actualizar la tarjeta lateral con información del médico
function updateMedicoCardInfo() {
    const medicoCard = document.querySelector('#profileModal .col-md-4 .card');
    
    if (medicoCard && medicoProfileData) {
        medicoCard.innerHTML = `
            <div class="card-body">
                <h6 class="card-title">Información Profesional</h6>
                <div class="small">
                    <div class="mb-2">
                        <strong class="d-block">Cédula Profesional</strong>
                        <span class="text-muted">${medicoProfileData.cedula_profesional || 'No registrada'}</span>
                    </div>
                    <div class="mb-2">
                        <strong class="d-block">Especialidad</strong>
                        <span class="text-muted">${medicoProfileData.especialidad || 'No especificada'}</span>
                    </div>
                    <div class="mb-2">
                        <strong class="d-block">Años de Experiencia</strong>
                        <span class="text-muted">${medicoProfileData.anos_experiencia || '0'} años</span>
                    </div>
                    <div class="mb-2">
                        <strong class="d-block">Universidad</strong>
                        <span class="text-muted">${medicoProfileData.universidad || 'No especificada'}</span>
                    </div>
                    <div class="mb-2">
                        <strong class="d-block">Horario</strong>
                        <span class="text-muted">${medicoProfileData.horario_consultorio || 'No especificado'}</span>
                    </div>
                </div>
            </div>
        `;
    }
}

// Función para cargar estadísticas del perfil
async function loadProfileStatistics() {
    try {
        // Contar pacientes asignados
        const pacientesAsignados = myPatients.length;
        document.getElementById('statsPatients').textContent = pacientesAsignados;
        
        // Contar reportes generados por este médico
        const reportesMedico = reports.filter(report => report.id_medico === currentUser.id_usuario);
        document.getElementById('statsReports').textContent = reportesMedico.length;
        
        // Contar mensajes recibidos
        const mensajesRecibidos = await apiRequest('/mensajes/recibidos');
        document.getElementById('statsMessages').textContent = mensajesRecibidos.length;
        
    } catch (error) {
        console.error('❌ Error cargando estadísticas:', error);
        // En caso de error, mostrar ceros
        document.getElementById('statsPatients').textContent = '0';
        document.getElementById('statsReports').textContent = '0';
        document.getElementById('statsMessages').textContent = '0';
    }
}

// Función para actualizar el perfil
async function updateProfile() {
    try {
        const profileData = {
            nombre: userProfileData.nombre, // Mantener el nombre original por ahora
            correo: document.getElementById('profileEmail').value,
            especialidad: document.getElementById('profileSpecialty').value,
            telefono_consultorio: document.getElementById('profilePhone').value,
            universidad: document.getElementById('profileBio').value,
            direccion_consultorio: document.getElementById('profileAddress').value
        };

        console.log('📝 Actualizando perfil con datos:', profileData);

        // Validar email
        if (!profileData.correo || !isValidEmail(profileData.correo)) {
            showNotification('Por favor ingrese un correo electrónico válido', 'error');
            return;
        }

        // Actualizar datos del usuario
        const updatedUser = await apiRequest(`/usuarios/${currentUser.id_usuario}`, {
            method: 'PUT',
            body: JSON.stringify({
                nombre: profileData.nombre,
                correo: profileData.correo
            })
        });

        // Intentar actualizar datos del médico si existen
        if (medicoProfileData && medicoProfileData.id_medico) {
            try {
                const medicoData = {
                    especialidad: profileData.especialidad,
                    telefono_consultorio: profileData.telefono_consultorio,
                    direccion_consultorio: profileData.direccion_consultorio,
                    universidad: profileData.universidad
                };
                
                await apiRequest(`/medicos/${medicoProfileData.id_medico}`, {
                    method: 'PUT',
                    body: JSON.stringify(medicoData)
                });
            } catch (error) {
                console.error('❌ Error actualizando datos del médico:', error);
                showNotification('Datos del usuario actualizados, pero no se pudieron actualizar los datos profesionales', 'warning');
            }
        }

        // Actualizar datos locales
        currentUser = { ...currentUser, ...updatedUser };
        userProfileData = currentUser;
        
        // Actualizar nombre en la interfaz
        userName.textContent = currentUser.nombre;

        showNotification('✅ Perfil actualizado exitosamente', 'success');
        
        // Recargar datos del médico para actualizar la tarjeta
        await loadMedicoProfileData();
        
    } catch (error) {
        console.error('❌ Error actualizando perfil:', error);
        showNotification('❌ Error al actualizar el perfil: ' + error.message, 'error');
    }
}

// Función para cambiar contraseña
async function changePassword() {
    try {
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Validaciones
        if (!currentPassword || !newPassword || !confirmPassword) {
            showNotification('Por favor complete todos los campos de contraseña', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            showNotification('Las contraseñas nuevas no coinciden', 'error');
            return;
        }

        if (newPassword.length < 6) {
            showNotification('La contraseña debe tener al menos 6 caracteres', 'error');
            return;
        }

        const passwordData = {
            current_password: currentPassword,
            new_password: newPassword
        };

        console.log('🔐 Cambiando contraseña...');

        // Intentar cambiar contraseña
        await apiRequest('/auth/change-password', {
            method: 'POST',
            body: JSON.stringify(passwordData)
        });

        // Limpiar formulario
        document.getElementById('passwordForm').reset();

        showNotification('✅ Contraseña cambiada exitosamente', 'success');
        
    } catch (error) {
        console.error('❌ Error cambiando contraseña:', error);
        
        // Si el endpoint no existe, mostrar mensaje específico
        if (error.message.includes('404') || error.message.includes('Not Found')) {
            showNotification('La función de cambio de contraseña no está disponible actualmente', 'warning');
        } else {
            showNotification('❌ Error al cambiar la contraseña: ' + error.message, 'error');
        }
    }
}

// Función auxiliar para validar email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Exportar funciones globales
window.showProfile = showProfile;
window.updateProfile = updateProfile;
window.changePassword = changePassword;