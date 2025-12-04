// Configuración de la API
const API_BASE_URL = 'https://cuidartekapi-production.up.railway.app'; 
let authToken = '';
let currentUser = null;
let currentModule = 'patients';
let patients = [];
let indicators = [];
let reports = [];
let chats = [];

// Elementos DOM
const loginScreen = document.getElementById('loginScreen');
const app = document.getElementById('app');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');
const refreshBtn = document.getElementById('refreshBtn');
const moduleLinks = document.querySelectorAll('[data-module]');
const moduleContents = document.querySelectorAll('.module-content');
const moduleTitle = document.getElementById('moduleTitle');
const userName = document.getElementById('userName');

// Elementos del módulo de pacientes
const patientsModule = document.getElementById('patientsModule');
const totalPatients = document.getElementById('totalPatients');
const activePatients = document.getElementById('activePatients');
const totalMedications = document.getElementById('totalMedications');
const totalConditions = document.getElementById('totalConditions');
const patientsTableBody = document.getElementById('patientsTableBody');

// Elementos del módulo de indicadores
const indicatorsModule = document.getElementById('indicatorsModule');
const patientSelector = document.getElementById('patientSelector');
const latestIndicators = document.getElementById('latestIndicators');
let healthChart = null;

// Elementos del módulo de comunicación
const communicationModule = document.getElementById('communicationModule');
const chatList = document.getElementById('chatList');
const chatTitle = document.getElementById('chatTitle');
const chatMessages = document.getElementById('chatMessages');
const messageInput = document.getElementById('messageInput');
const sendMessageBtn = document.getElementById('sendMessageBtn');

// Elementos del módulo de reportes
const reportsModule = document.getElementById('reportsModule');
const reportsTableBody = document.getElementById('reportsTableBody');
const reportPatientFilter = document.getElementById('reportPatientFilter');

// Elementos del módulo de solicitudes
const solicitudesModule = document.getElementById('solicitudesModule');
const solicitudesTableBody = document.getElementById('solicitudesTableBody');

// Elementos adicionales para pacientes asignados
const myPatientsTableBody = document.getElementById('myPatientsTableBody');
const myPatientsCount = document.getElementById('myPatientsCount');
let myPatients = [];

// Variables para solicitudes
let solicitudesData = [];
let autoRefreshInterval = null;

// Funciones de la API
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        },
        ...options
    };

    try {
        console.log(`🔄 Haciendo request a: ${url}`);
        
        const response = await fetch(url, config);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('❌ API request failed:', error);
        throw error;
    }
}

// Funciones de autenticación
async function login(email, password) {
    try {
        const data = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({
                correo: email,
                password: password
            })
        });

        authToken = data.access_token;
        currentUser = await apiRequest('/auth/me');
        userName.textContent = currentUser.nombre;

        loginScreen.classList.add('d-none');
        app.classList.remove('d-none');

        loadPatients();
        loadReports();
    } catch (error) {
        loginError.classList.remove('d-none');
        console.error('Login failed:', error);
    }
}

function logout() {
    authToken = '';
    currentUser = null;
    app.classList.add('d-none');
    loginScreen.classList.remove('d-none');
    loginForm.reset();
    loginError.classList.add('d-none');
}

// Funciones de gestión de módulos
function switchModule(module) {
    currentModule = module;
    
    moduleLinks.forEach(link => {
        if (link.getAttribute('data-module') === module) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    moduleContents.forEach(content => {
        if (content.id === `${module}Module`) {
            content.classList.remove('d-none');
        } else {
            content.classList.add('d-none');
        }
    });

    const titles = {
        patients: 'Gestión de Pacientes',
        indicators: 'Indicadores de Salud',
        solicitudes: 'Solicitudes de Pacientes',
        communication: 'Comunicación con Pacientes',
        reports: 'Reportes Médicos'
    };
    moduleTitle.textContent = titles[module];

    if (module === 'indicators') {
        loadPatientSelector();
    } else if (module === 'solicitudes') {
        loadSolicitudesModule();
    } else if (module === 'communication') {
        loadChats();
    } else if (module === 'reports') {
        loadReports();
    }
}

// =============================================
// MÓDULO DE SOLICITUDES - NUEVO CÓDIGO
// =============================================

function loadSolicitudesModule() {
    console.log('Cargando módulo de Solicitudes...');
    
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

async function loadSolicitudesData() {
    try {
        showNotification('Cargando solicitudes...', 'info');
        
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        console.log('Usuario actual:', currentUser);
        
        let medicoId = currentUser?.id_medico || currentUser?.id || currentUser?.user?.id_medico;
        
        console.log('ID Médico encontrado:', medicoId);
        
        if (!medicoId) {
            throw new Error('No se pudo obtener el ID del médico.');
        }

        const response = await fetch(`https://cuidartekapi-production.up.railway.app/paciente-medico/solicitudes-pendientes`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.status === 401) {
            throw new Error('Token inválido o expirado');
        }

        if (!response.ok) {
            throw new Error(`Error ${response.status} al cargar las solicitudes`);
        }

        const data = await response.json();
        solicitudesData = Array.isArray(data) ? data : [];
        
        console.log('Solicitudes cargadas:', solicitudesData.length);
        renderSolicitudesTable();
        
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error: ' + error.message, 'error');
        useTestData();
    }
}

function useTestData() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const medicoId = currentUser?.id_medico || currentUser?.id || 1;
    
    console.log('Usando datos de prueba para médico ID:', medicoId);
    
    solicitudesData = [{
        "id_relacion": 1,
        "id_paciente": 3,
        "id_medico": medicoId,
        "id_usuario_paciente": 2,
        "nombre_paciente": "Fernando Antonio Vargas Velasquez",
        "correo_paciente": "fer@gmail.com",
        "edad": 34,
        "sexo": "Masculino",
        "fecha_asignacion": "2025-11-27T02:19:26",
        "notas": "Quiero que me pueda ayudar con mi salud",
        "estatus": "pendiente"
    }];
    
    renderSolicitudesTable();
    showNotification('Modo demo: Mostrando datos de prueba', 'info');
}

function renderSolicitudesTable() {
    const tbody = document.getElementById('solicitudesTableBody');
    
    console.log('Renderizando tabla con:', solicitudesData.length, 'solicitudes');
    
    if (!solicitudesData || solicitudesData.length === 0) {
        renderEmptySolicitudesTable();
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

function renderEmptySolicitudesTable() {
    const tbody = document.getElementById('solicitudesTableBody');
    tbody.innerHTML = `
        <tr>
            <td colspan="7" class="text-center text-muted py-4">
                <i class="fas fa-clipboard-list fa-2x mb-2"></i>
                <p class="mb-0">No hay solicitudes pendientes</p>
                <small class="text-muted">Las nuevas solicitudes de pacientes aparecerán aquí</small>
            </td>
        </tr>
    `;
}

async function aceptarSolicitud(idRelacion) {
    if (!confirm('¿Estás seguro de que deseas aceptar esta solicitud?\nEl paciente será agregado a tu lista de pacientes.')) {
        return;
    }

    try {
        const response = await fetch(`https://cuidartekapi-production.up.railway.app/paciente-medico/relaciones/${idRelacion}/aceptar`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                estatus: 'activo'
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al aceptar la solicitud');
        }

        showNotification('✅ Solicitud aceptada correctamente. Paciente agregado a tu lista.', 'success');
        
        // Buscar la solicitud aceptada
        const solicitudAceptada = solicitudesData.find(s => s.id_relacion === idRelacion);
        
        if (solicitudAceptada) {
            // Agregar el paciente a la lista local
            agregarPacienteALista(solicitudAceptada);
        }
        
        // Recargar solicitudes y actualizar pacientes
        loadSolicitudesData();
        actualizarContadoresPacientes();
        
    } catch (error) {
        console.error('Error:', error);
        showNotification('❌ Error al aceptar la solicitud: ' + error.message, 'error');
    }
}

function agregarPacienteALista(solicitud) {
    try {
        let pacientes = JSON.parse(localStorage.getItem('pacientes')) || [];
        const pacienteExistente = pacientes.find(p => p.id_paciente === solicitud.id_paciente);
        
        if (!pacienteExistente) {
            const nuevoPaciente = {
                id_paciente: solicitud.id_paciente,
                id_usuario: solicitud.id_usuario_paciente,
                nombre: solicitud.nombre_paciente,
                correo: solicitud.correo_paciente,
                edad: solicitud.edad,
                sexo: solicitud.sexo,
                peso: null,
                altura: null,
                enfermedades: [],
                medicamentos: [],
                fecha_registro: new Date().toISOString(),
                estatus: 'activo'
            };
            
            pacientes.push(nuevoPaciente);
            localStorage.setItem('pacientes', JSON.stringify(pacientes));
            console.log('Paciente agregado a lista local:', nuevoPaciente);
        }
        
    } catch (error) {
        console.error('Error al agregar paciente a lista local:', error);
    }
}

function actualizarContadoresPacientes() {
    // Actualizar contadores
    if (typeof updatePatientsCount === 'function') {
        updatePatientsCount();
    }
    
    // Actualizar tabla de pacientes
    if (typeof loadPatientsData === 'function') {
        setTimeout(() => {
            loadPatientsData();
        }, 1000);
    }
}

async function rechazarSolicitud(idRelacion) {
    if (!confirm('¿Estás seguro de que deseas rechazar esta solicitud?\nEsta acción no se puede deshacer.')) {
        return;
    }

    try {
        const response = await fetch(`https://cuidartekapi-production.up.railway.app/paciente-medico/relaciones/${idRelacion}/rechazar`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                estatus: 'rechazado'
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al rechazar la solicitud');
        }

        showNotification('✅ Solicitud rechazada correctamente', 'success');
        
        // Recargar la lista después de un breve delay
        setTimeout(() => {
            loadSolicitudesData();
        }, 1000);
        
    } catch (error) {
        console.error('Error:', error);
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
                                        <p><strong>ID Usuario:</strong> ${solicitud.id_usuario_paciente}</p>
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
                        <button type="button" class="btn btn-danger" onclick="rechazarSolicitud(${solicitud.id_relacion})">
                            <i class="fas fa-times me-1"></i>Rechazar
                        </button>
                        <button type="button" class="btn btn-success" onclick="aceptarSolicitud(${solicitud.id_relacion})">
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

// =============================================
// FIN MÓDULO DE SOLICITUDES
// =============================================

// Funciones del módulo de pacientes
async function loadPatients() {
    try {
        console.log('🔄 Cargando pacientes...');
        
        // Cargar pacientes directamente desde tu API
        const pacientesData = await apiRequest('/pacientes/');
        console.log('✅ Datos recibidos de pacientes:', pacientesData);
        
        // Procesar pacientes con datos reales
        patients = pacientesData.map(paciente => {
            const nombre = paciente.nombre || 
                (paciente.sexo === 'Femenino' ? 
                    `Paciente Femenina ${paciente.id_paciente}` : 
                    `Paciente Masculino ${paciente.id_paciente}`);
            
            return {
                id_paciente: paciente.id_paciente,
                id_usuario: paciente.id_usuario,
                nombre: nombre,
                edad: paciente.edad,
                sexo: paciente.sexo,
                peso_actual: paciente.peso_actual,
                altura: paciente.altura,
                enfermedades_cronicas: paciente.enfermedades_cronicas,
                medicamentos: paciente.medicamentos,
                doctor_asignado: paciente.doctor_asignado
            };
        });
        
        console.log(`📊 Total de pacientes: ${patients.length}`);
        
        // Filtrar pacientes asignados al médico actual
        myPatients = patients.filter(patient => {
            return patient.doctor_asignado === currentUser.id_usuario;
        });
        
        console.log(`🎯 Mis pacientes asignados: ${myPatients.length}`);
        
        // Actualizar estadísticas
        totalPatients.textContent = patients.length;
        activePatients.textContent = patients.length;
        
        // CORREGIDO: Contar pacientes con medicamentos y enfermedades REALES
        const conMedicamentos = patients.filter(p => {
            const meds = (p.medicamentos || '').toLowerCase().trim();
            return meds && meds !== 'nada' && meds !== 'ninguno' && meds !== '';
        }).length;
        
        const conEnfermedades = patients.filter(p => {
            const enfermedades = (p.enfermedades_cronicas || '').toLowerCase().trim();
            return enfermedades && enfermedades !== 'nada' && enfermedades !== 'ninguna' && enfermedades !== '';
        }).length;
        
        totalMedications.textContent = conMedicamentos;
        totalConditions.textContent = conEnfermedades;

        console.log(`💊 Pacientes con medicamentos: ${conMedicamentos}`);
        console.log(`🏥 Pacientes con enfermedades: ${conEnfermedades}`);

        // Actualizar tablas
        renderPatientsTable();
        renderMyPatientsTable();
        
    } catch (error) {
        console.error('❌ Error cargando pacientes:', error);
        showNotification('Error al cargar los pacientes', 'error');
        
        // Mostrar estado vacío
        patients = [];
        myPatients = [];
        renderPatientsTable();
        renderMyPatientsTable();
    }
}

function renderPatientsTable() {
    patientsTableBody.innerHTML = '';
    
    if (patients.length === 0) {
        patientsTableBody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-4">
                    <div class="empty-state">
                        <i class="fas fa-users fa-3x mb-3"></i>
                        <h5>No hay pacientes registrados</h5>
                        <p class="text-muted">No se pudieron cargar los datos de pacientes.</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    patients.forEach(patient => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <strong>${patient.nombre}</strong>
            </td>
            <td>${patient.edad} años</td>
            <td>${patient.sexo}</td>
            <td>${patient.peso_actual} kg</td>
            <td>${patient.altura} m</td>
            <td>${patient.enfermedades_cronicas}</td>
            <td>${patient.medicamentos}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1" onclick="viewPatient(${patient.id_paciente})">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-outline-secondary me-1" onclick="editPatient(${patient.id_paciente})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deletePatient(${patient.id_paciente})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        patientsTableBody.appendChild(row);
    });
}

function renderMyPatientsTable() {
    myPatientsTableBody.innerHTML = '';
    myPatientsCount.textContent = `${myPatients.length} paciente${myPatients.length !== 1 ? 's' : ''}`;
    
    if (myPatients.length === 0) {
        myPatientsTableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4">
                    <div class="empty-state">
                        <i class="fas fa-user-md fa-3x mb-3"></i>
                        <h5>No tienes pacientes asignados</h5>
                        <p class="text-muted">Los pacientes que te asignen aparecerán aquí.</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    myPatients.forEach(patient => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <strong>${patient.nombre}</strong>
                <span class="doctor-badge ms-2">Mi Paciente</span>
            </td>
            <td>${patient.edad} años</td>
            <td>${patient.sexo}</td>
            <td>${patient.peso_actual} kg</td>
            <td>${patient.altura} m</td>
            <td>${patient.enfermedades_cronicas}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1" onclick="viewPatient(${patient.id_paciente})">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-outline-secondary me-1" onclick="editPatient(${patient.id_paciente})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deletePatient(${patient.id_paciente})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        myPatientsTableBody.appendChild(row);
    });
}

// Función para mostrar notificaciones
function showNotification(message, type = 'info') {
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

// Función para ver paciente
async function viewPatient(patientId) {
    try {
        console.log(`👁️ Viendo paciente ID: ${patientId}`);
        const patient = await apiRequest(`/pacientes/${patientId}`);
        showPatientModal(patient, false);
    } catch (error) {
        console.error('Error loading patient:', error);
        showNotification('Error al cargar los datos del paciente', 'error');
    }
}

// Función para editar paciente
async function editPatient(patientId) {
    try {
        console.log(`✏️ Editando paciente ID: ${patientId}`);
        const patient = await apiRequest(`/pacientes/${patientId}`);
        showPatientModal(patient, true);
    } catch (error) {
        console.error('Error loading patient:', error);
        showNotification('Error al cargar los datos del paciente', 'error');
    }
}

// Función para mostrar modal de paciente (vista/edición)
function showPatientModal(patient, isEditMode = false) {
    const modal = document.getElementById('patientViewModal');
    const modalTitle = document.getElementById('patientViewModalLabel');
    const modalBody = document.getElementById('patientViewModalBody');
    const modalFooter = document.getElementById('patientViewModalFooter');
    
    modalTitle.textContent = isEditMode ? 'Editar Paciente' : 'Ver Paciente';
    
    const nombreMostrar = patient.nombre || (patient.sexo === 'Femenino' ? 
        `Paciente Femenina ${patient.id_paciente}` : 
        `Paciente Masculino ${patient.id_paciente}`);
    
    modalBody.innerHTML = `
        <form id="patientViewForm">
            <div class="row">
                <div class="col-md-6">
                    <div class="mb-3">
                        <label class="form-label">ID del Paciente</label>
                        <input type="text" class="form-control" value="${patient.id_paciente}" readonly>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="mb-3">
                        <label class="form-label">Nombre</label>
                        <input type="text" class="form-control" id="viewPatientName" value="${nombreMostrar}" ${!isEditMode ? 'readonly' : ''}>
                    </div>
                </div>
            </div>
            <div class="row">
                <div class="col-md-4">
                    <div class="mb-3">
                        <label class="form-label">Edad</label>
                        <input type="number" class="form-control" id="viewPatientAge" value="${patient.edad || ''}" ${!isEditMode ? 'readonly' : ''}>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="mb-3">
                        <label class="form-label">Sexo</label>
                        <select class="form-select" id="viewPatientGender" ${!isEditMode ? 'disabled' : ''}>
                            <option value="">Seleccione</option>
                            <option value="Masculino" ${patient.sexo === 'Masculino' ? 'selected' : ''}>Masculino</option>
                            <option value="Femenino" ${patient.sexo === 'Femenino' ? 'selected' : ''}>Femenino</option>
                            <option value="Otro" ${patient.sexo === 'Otro' ? 'selected' : ''}>Otro</option>
                        </select>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="mb-3">
                        <label class="form-label">Médico Asignado</label>
                        <input type="text" class="form-control" value="${patient.doctor_asignado || 'No asignado'}" readonly>
                    </div>
                </div>
            </div>
            <div class="row">
                <div class="col-md-6">
                    <div class="mb-3">
                        <label class="form-label">Peso (kg)</label>
                        <input type="number" step="0.1" class="form-control" id="viewPatientWeight" value="${patient.peso_actual || ''}" ${!isEditMode ? 'readonly' : ''}>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="mb-3">
                        <label class="form-label">Altura (m)</label>
                        <input type="number" step="0.01" class="form-control" id="viewPatientHeight" value="${patient.altura || ''}" ${!isEditMode ? 'readonly' : ''}>
                    </div>
                </div>
            </div>
            <div class="mb-3">
                <label class="form-label">Enfermedades Crónicas</label>
                <textarea class="form-control" id="viewPatientConditions" rows="2" ${!isEditMode ? 'readonly' : ''}>${patient.enfermedades_cronicas || ''}</textarea>
            </div>
            <div class="mb-3">
                <label class="form-label">Medicamentos</label>
                <textarea class="form-control" id="viewPatientMedications" rows="2" ${!isEditMode ? 'readonly' : ''}>${patient.medicamentos || ''}</textarea>
            </div>
        </form>
    `;
    
    if (isEditMode) {
        modalFooter.innerHTML = `
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button type="button" class="btn btn-primary" onclick="updatePatient(${patient.id_paciente})">Guardar Cambios</button>
        `;
    } else {
        modalFooter.innerHTML = `
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
            <button type="button" class="btn btn-primary" onclick="editPatient(${patient.id_paciente})">Editar</button>
        `;
    }
    
    const bootstrapModal = new bootstrap.Modal(modal);
    bootstrapModal.show();
}

// Función para actualizar paciente
async function updatePatient(patientId) {
    try {
        const patientData = {
            nombre: document.getElementById('viewPatientName').value,
            edad: parseInt(document.getElementById('viewPatientAge').value) || null,
            sexo: document.getElementById('viewPatientGender').value,
            peso_actual: parseFloat(document.getElementById('viewPatientWeight').value) || null,
            altura: parseFloat(document.getElementById('viewPatientHeight').value) || null,
            enfermedades_cronicas: document.getElementById('viewPatientConditions').value,
            medicamentos: document.getElementById('viewPatientMedications').value
        };

        console.log('📝 Actualizando paciente con datos:', patientData);

        await apiRequest(`/pacientes/${patientId}`, {
            method: 'PUT',
            body: JSON.stringify(patientData)
        });

        // Recargar lista de pacientes
        await loadPatients();
        
        // Cerrar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('patientViewModal'));
        modal.hide();
        
        showNotification('✅ Paciente actualizado exitosamente', 'success');
        
    } catch (error) {
        console.error('❌ Error updating patient:', error);
        showNotification('❌ Error al actualizar el paciente: ' + error.message, 'error');
    }
}

// Función para eliminar paciente
async function deletePatient(patientId) {
    if (confirm('¿Está seguro de que desea eliminar este paciente?')) {
        try {
            await apiRequest(`/pacientes/${patientId}`, {
                method: 'DELETE'
            });
            
            // Recargar lista de pacientes
            await loadPatients();
            showNotification('✅ Paciente eliminado exitosamente', 'success');
        } catch (error) {
            console.error('Error deleting patient:', error);
            showNotification('❌ Error al eliminar el paciente', 'error');
        }
    }
}

// Funciones del módulo de indicadores
function loadPatientSelector() {
    patientSelector.innerHTML = '<option value="">Seleccione un paciente</option>';
    const indicatorPatient = document.getElementById('indicatorPatient');
    indicatorPatient.innerHTML = '<option value="">Seleccione un paciente</option>';
    
    // Solo mostrar pacientes asignados al médico actual
    myPatients.forEach(patient => {
        const option = document.createElement('option');
        option.value = patient.id_paciente;
        option.textContent = patient.nombre;
        patientSelector.appendChild(option);
        
        const option2 = document.createElement('option');
        option2.value = patient.id_paciente;
        option2.textContent = patient.nombre;
        indicatorPatient.appendChild(option2);
    });

    patientSelector.addEventListener('change', function() {
        const patientId = this.value;
        if (patientId) {
            loadPatientIndicators(patientId);
        } else {
            clearIndicators();
        }
    });
}

// Función para agregar indicadores
async function addIndicator() {
    try {
        const patientId = document.getElementById('indicatorPatient').value;
        const fechaRegistro = document.getElementById('indicatorDate').value;
        
        if (!patientId) {
            showNotification('Por favor seleccione un paciente', 'error');
            return;
        }

        // Obtener valores o usar valores por defecto más realistas
        const presionSistolica = document.getElementById('presionSistolica').value;
        const presionDiastolica = document.getElementById('presionDiastolica').value;
        const glucosa = document.getElementById('glucosa').value;
        const peso = document.getElementById('peso').value;
        const frecuenciaCardiaca = document.getElementById('frecuenciaCardiaca').value;

        const indicatorData = {
            id_paciente: parseInt(patientId),
            fecha_registro: fechaRegistro || new Date().toISOString(),
            presion_sistolica: presionSistolica ? parseInt(presionSistolica) : null,
            presion_diastolica: presionDiastolica ? parseInt(presionDiastolica) : null,
            glucosa: glucosa ? parseFloat(glucosa) : null,
            peso: peso ? parseFloat(peso) : null,
            frecuencia_cardiaca: frecuenciaCardiaca ? parseInt(frecuenciaCardiaca) : null,
            estado_animo: document.getElementById('estadoAnimo').value || null,
            actividad_fisica: document.getElementById('actividadFisica').value || null,
            fuente_dato: document.getElementById('fuenteDato').value
        };

        console.log('📝 Enviando indicadores:', indicatorData);

        await apiRequest('/indicadores-salud/', {
            method: 'POST',
            body: JSON.stringify(indicatorData)
        });

        // Cerrar modal y limpiar formulario
        const modal = bootstrap.Modal.getInstance(document.getElementById('addIndicatorModal'));
        modal.hide();
        document.getElementById('addIndicatorForm').reset();

        showNotification('✅ Indicadores agregados exitosamente', 'success');

        // Recargar indicadores si el paciente está seleccionado
        if (patientSelector.value === patientId) {
            loadPatientIndicators(patientId);
        } else {
            // Si no está seleccionado, seleccionarlo automáticamente
            patientSelector.value = patientId;
            loadPatientIndicators(patientId);
        }
        
    } catch (error) {
        console.error('❌ Error agregando indicadores:', error);
        showNotification('❌ Error al agregar los indicadores: ' + error.message, 'error');
    }
}

// Función para cargar indicadores de un paciente
async function loadPatientIndicators(patientId) {
    try {
        indicators = await apiRequest(`/indicadores-salud/paciente/${patientId}`);
        console.log('📊 Indicadores cargados:', indicators);
        
        // Ordenar por fecha más reciente primero
        indicators.sort((a, b) => new Date(b.fecha_registro) - new Date(a.fecha_registro));
        
        renderLatestIndicators();
        renderHealthChart();
    } catch (error) {
        console.error('Error loading indicators:', error);
        showNotification('Error al cargar los indicadores del paciente', 'error');
        indicators = [];
        renderLatestIndicators();
        renderHealthChart();
    }
}

// Función para renderizar los últimos indicadores
function renderLatestIndicators() {
    latestIndicators.innerHTML = '';
    
    if (indicators.length === 0) {
        latestIndicators.innerHTML = '<li class="list-group-item text-muted">No hay indicadores registrados</li>';
        return;
    }

    const latest = indicators[0];
    const items = [
        { 
            label: 'Presión arterial', 
            value: latest.presion_sistolica && latest.presion_diastolica ? 
                `${latest.presion_sistolica}/${latest.presion_diastolica} mmHg` : 'No registrada' 
        },
        { 
            label: 'Glucosa', 
            value: latest.glucosa ? `${latest.glucosa} mg/dL` : 'No registrada' 
        },
        { 
            label: 'Peso', 
            value: latest.peso ? `${latest.peso} kg` : 'No registrado' 
        },
        { 
            label: 'Frecuencia cardíaca', 
            value: latest.frecuencia_cardiaca ? `${latest.frecuencia_cardiaca} lpm` : 'No registrada' 
        },
        { 
            label: 'Estado de ánimo', 
            value: latest.estado_animo || 'No registrado' 
        },
        { 
            label: 'Actividad física', 
            value: latest.actividad_fisica || 'No registrada' 
        },
        { 
            label: 'Fuente del dato', 
            value: latest.fuente_dato === 'wearable' ? 'Wearable' : 'Manual' 
        }
    ];

    items.forEach(item => {
        const li = document.createElement('li');
        li.className = 'list-group-item d-flex justify-content-between align-items-center';
        li.innerHTML = `
            <span class="small">${item.label}</span>
            <span class="fw-bold">${item.value}</span>
        `;
        latestIndicators.appendChild(li);
    });
}

// Función para renderizar el gráfico de salud
function renderHealthChart() {
    const ctx = document.getElementById('healthIndicatorsChart').getContext('2d');
    
    if (healthChart) {
        healthChart.destroy();
    }

    // Si no hay indicadores, mostrar gráfico vacío con mensaje
    if (indicators.length === 0) {
        healthChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['No hay datos'],
                datasets: [
                    {
                        label: 'Presión Sistólica',
                        data: [0],
                        borderColor: 'rgb(255, 99, 132)',
                        backgroundColor: 'rgba(255, 99, 132, 0.1)',
                        tension: 0.4,
                        spanGaps: true
                    },
                    {
                        label: 'Presión Diastólica',
                        data: [0],
                        borderColor: 'rgb(54, 162, 235)',
                        backgroundColor: 'rgba(54, 162, 235, 0.1)',
                        tension: 0.4,
                        spanGaps: true
                    },
                    {
                        label: 'Glucosa (mg/dL)',
                        data: [0],
                        borderColor: 'rgb(75, 192, 192)',
                        backgroundColor: 'rgba(75, 192, 192, 0.1)',
                        tension: 0.4,
                        spanGaps: true
                    },
                    {
                        label: 'Frecuencia Cardíaca',
                        data: [0],
                        borderColor: 'rgb(153, 102, 255)',
                        backgroundColor: 'rgba(153, 102, 255, 0.1)',
                        tension: 0.4,
                        spanGaps: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Evolución de Indicadores de Salud - No hay datos'
                    },
                    tooltip: {
                        enabled: false
                    }
                }
            }
        });
        return;
    }

    // Preparar datos para el gráfico con valores reales
    const labels = indicators.map(i => new Date(i.fecha_registro).toLocaleDateString()).reverse();
    
    // Usar valores reales o 0 si son null/undefined
    const pressureSystolic = indicators.map(i => i.presion_sistolica || 0).reverse();
    const pressureDiastolic = indicators.map(i => i.presion_diastolica || 0).reverse();
    const glucose = indicators.map(i => i.glucosa || 0).reverse();
    const heartRate = indicators.map(i => i.frecuencia_cardiaca || 0).reverse();

    healthChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Presión Sistólica (mmHg)',
                    data: pressureSystolic,
                    borderColor: 'rgb(255, 99, 132)',
                    backgroundColor: 'rgba(255, 99, 132, 0.1)',
                    tension: 0.4,
                    spanGaps: true,
                    borderWidth: 2
                },
                {
                    label: 'Presión Diastólica (mmHg)',
                    data: pressureDiastolic,
                    borderColor: 'rgb(54, 162, 235)',
                    backgroundColor: 'rgba(54, 162, 235, 0.1)',
                    tension: 0.4,
                    spanGaps: true,
                    borderWidth: 2
                },
                {
                    label: 'Glucosa (mg/dL)',
                    data: glucose,
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.1)',
                    tension: 0.4,
                    spanGaps: true,
                    borderWidth: 2
                },
                {
                    label: 'Frecuencia Cardíaca (lpm)',
                    data: heartRate,
                    borderColor: 'rgb(153, 102, 255)',
                    backgroundColor: 'rgba(153, 102, 255, 0.1)',
                    tension: 0.4,
                    spanGaps: true,
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'Valores'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Fecha'
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 20
                    }
                },
                title: {
                    display: true,
                    text: 'Evolución de Indicadores de Salud',
                    font: {
                        size: 16
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 10,
                    cornerRadius: 4
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            },
            elements: {
                point: {
                    radius: 4,
                    hoverRadius: 6
                }
            }
        }
    });
}

function clearIndicators() {
    latestIndicators.innerHTML = '<li class="list-group-item text-muted">Seleccione un paciente para ver sus indicadores</li>';
    
    if (healthChart) {
        healthChart.destroy();
        healthChart = null;
    }
}

// Funciones del módulo de reportes
async function loadReports() {
    try {
        reports = await apiRequest('/reportes-medicos/');
        console.log('📋 Reportes cargados:', reports);
        
        // Cargar selector de pacientes para reportes
        loadReportPatientSelector();
        
        renderReportsTable();
    } catch (error) {
        console.error('Error loading reports:', error);
        showNotification('Error al cargar los reportes médicos', 'error');
        reports = [];
        renderReportsTable();
    }
}

function loadReportPatientSelector() {
    const reportPatient = document.getElementById('reportPatient');
    reportPatient.innerHTML = '<option value="">Seleccione un paciente</option>';
    reportPatientFilter.innerHTML = '<option value="">Todos los pacientes</option>';
    
    // Solo mostrar pacientes asignados al médico actual
    myPatients.forEach(patient => {
        const option = document.createElement('option');
        option.value = patient.id_paciente;
        option.textContent = patient.nombre;
        reportPatient.appendChild(option);
        
        const option2 = document.createElement('option');
        option2.value = patient.id_paciente;
        option2.textContent = patient.nombre;
        reportPatientFilter.appendChild(option2);
    });

    // Agregar event listener para filtrar reportes
    reportPatientFilter.addEventListener('change', function() {
        renderReportsTable();
    });
}

function renderReportsTable() {
    reportsTableBody.innerHTML = '';
    
    const patientFilter = reportPatientFilter.value;
    
    // Filtrar reportes si se seleccionó un paciente
    let filteredReports = reports;
    if (patientFilter) {
        filteredReports = reports.filter(report => report.id_paciente == patientFilter);
    }
    
    if (filteredReports.length === 0) {
        reportsTableBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-4">
                    <div class="empty-state">
                        <i class="fas fa-file-medical fa-3x mb-3"></i>
                        <h5>No hay reportes médicos</h5>
                        <p class="text-muted">${patientFilter ? 'No hay reportes para este paciente' : 'No hay reportes médicos registrados'}</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    filteredReports.forEach(report => {
        // Encontrar el nombre del paciente
        const paciente = patients.find(p => p.id_paciente == report.id_paciente);
        const pacienteNombre = paciente ? paciente.nombre : `Paciente ${report.id_paciente}`;
        
        // Acortar texto para la tabla
        const diagnosticoCorto = report.diagnostico ? 
            (report.diagnostico.length > 50 ? report.diagnostico.substring(0, 50) + '...' : report.diagnostico) : 
            'No especificado';
            
        const recomendacionesCorto = report.recomendaciones_medicas ? 
            (report.recomendaciones_medicas.length > 50 ? report.recomendaciones_medicas.substring(0, 50) + '...' : report.recomendaciones_medicas) : 
            'No especificadas';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <strong>${pacienteNombre}</strong>
            </td>
            <td>${new Date(report.fecha_reporte).toLocaleDateString()}</td>
            <td>${diagnosticoCorto}</td>
            <td>${recomendacionesCorto}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1" onclick="viewReport(${report.id_reporte})">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-outline-secondary me-1" onclick="editReport(${report.id_reporte})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteReport(${report.id_reporte})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        reportsTableBody.appendChild(row);
    });
}

// Función para agregar reporte médico
async function addReport() {
    try {
        const patientId = document.getElementById('reportPatient').value;
        
        if (!patientId) {
            showNotification('Por favor seleccione un paciente', 'error');
            return;
        }

        const reportData = {
            id_paciente: parseInt(patientId),
            id_medico: currentUser.id_usuario,
            fecha_reporte: document.getElementById('reportDate').value || new Date().toISOString(),
            descripcion_general: document.getElementById('descripcionGeneral').value || null,
            diagnostico: document.getElementById('diagnostico').value,
            recomendaciones_medicas: document.getElementById('recomendacionesMedicas').value
        };

        console.log('📝 Enviando reporte:', reportData);

        await apiRequest('/reportes-medicos/', {
            method: 'POST',
            body: JSON.stringify(reportData)
        });

        // Cerrar modal y limpiar formulario
        const modal = bootstrap.Modal.getInstance(document.getElementById('addReportModal'));
        modal.hide();
        document.getElementById('addReportForm').reset();

        showNotification('✅ Reporte médico generado exitosamente', 'success');

        // Recargar reportes
        await loadReports();
        
    } catch (error) {
        console.error('❌ Error agregando reporte:', error);
        showNotification('❌ Error al generar el reporte: ' + error.message, 'error');
    }
}

// Función para ver reporte
async function viewReport(reportId) {
    try {
        const report = await apiRequest(`/reportes-medicos/${reportId}`);
        showReportModal(report, false);
    } catch (error) {
        console.error('Error loading report:', error);
        showNotification('Error al cargar el reporte médico', 'error');
    }
}

// Función para editar reporte
async function editReport(reportId) {
    try {
        const report = await apiRequest(`/reportes-medicos/${reportId}`);
        showReportModal(report, true);
    } catch (error) {
        console.error('Error loading report:', error);
        showNotification('Error al cargar el reporte médico', 'error');
    }
}

// Función para mostrar modal de reporte (vista/edición)
function showReportModal(report, isEditMode = false) {
    const modal = document.getElementById('viewReportModal');
    const modalTitle = document.getElementById('viewReportModalLabel');
    const modalBody = document.getElementById('viewReportModalBody');
    const modalFooter = document.getElementById('viewReportModalFooter');
    
    modalTitle.textContent = isEditMode ? 'Editar Reporte Médico' : 'Ver Reporte Médico';
    
    // Encontrar el nombre del paciente
    const paciente = patients.find(p => p.id_paciente == report.id_paciente);
    const pacienteNombre = paciente ? paciente.nombre : `Paciente ${report.id_paciente}`;
    
    modalBody.innerHTML = `
        <form id="reportViewForm">
            <div class="row">
                <div class="col-md-6">
                    <div class="mb-3">
                        <label class="form-label">Paciente</label>
                        <input type="text" class="form-control" value="${pacienteNombre}" readonly>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="mb-3">
                        <label class="form-label">Fecha del Reporte</label>
                        <input type="datetime-local" class="form-control" id="reportViewDate" value="${report.fecha_reporte ? report.fecha_reporte.replace('Z', '') : ''}" ${!isEditMode ? 'readonly' : ''}>
                    </div>
                </div>
            </div>
            
            <div class="mb-3">
                <label class="form-label">Descripción General</label>
                <textarea class="form-control" id="reportViewDescripcion" rows="3" ${!isEditMode ? 'readonly' : ''}>${report.descripcion_general || ''}</textarea>
            </div>
            
            <div class="mb-3">
                <label class="form-label">Diagnóstico</label>
                <textarea class="form-control" id="reportViewDiagnostico" rows="3" ${!isEditMode ? 'readonly' : ''} required>${report.diagnostico || ''}</textarea>
            </div>
            
            <div class="mb-3">
                <label class="form-label">Recomendaciones Médicas</label>
                <textarea class="form-control" id="reportViewRecomendaciones" rows="3" ${!isEditMode ? 'readonly' : ''} required>${report.recomendaciones_medicas || ''}</textarea>
            </div>
        </form>
    `;
    
    if (isEditMode) {
        modalFooter.innerHTML = `
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button type="button" class="btn btn-primary" onclick="updateReport(${report.id_reporte})">Guardar Cambios</button>
        `;
    } else {
        modalFooter.innerHTML = `
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
            <button type="button" class="btn btn-primary" onclick="editReport(${report.id_reporte})">Editar</button>
        `;
    }
    
    const bootstrapModal = new bootstrap.Modal(modal);
    bootstrapModal.show();
}

// Función para actualizar reporte
async function updateReport(reportId) {
    try {
        const reportData = {
            fecha_reporte: document.getElementById('reportViewDate').value,
            descripcion_general: document.getElementById('reportViewDescripcion').value || null,
            diagnostico: document.getElementById('reportViewDiagnostico').value,
            recomendaciones_medicas: document.getElementById('reportViewRecomendaciones').value
        };

        console.log('📝 Actualizando reporte:', reportData);

        await apiRequest(`/reportes-medicos/${reportId}`, {
            method: 'PUT',
            body: JSON.stringify(reportData)
        });

        // Recargar reportes
        await loadReports();
        
        // Cerrar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('viewReportModal'));
        modal.hide();
        
        showNotification('✅ Reporte médico actualizado exitosamente', 'success');
        
    } catch (error) {
        console.error('❌ Error updating report:', error);
        showNotification('❌ Error al actualizar el reporte: ' + error.message, 'error');
    }
}

// Función para eliminar reporte
async function deleteReport(reportId) {
    if (confirm('¿Está seguro de que desea eliminar este reporte médico?')) {
        try {
            await apiRequest(`/reportes-medicos/${reportId}`, {
                method: 'DELETE'
            });
            
            // Recargar reportes
            await loadReports();
            showNotification('✅ Reporte médico eliminado exitosamente', 'success');
        } catch (error) {
            console.error('Error deleting report:', error);
            showNotification('❌ Error al eliminar el reporte médico', 'error');
        }
    }
}

// Funciones del módulo de comunicación
function loadChats() {
    chats = [
        { id: 1, patientName: 'Paciente Femenina 1', lastMessage: 'Hola doctor, tengo una pregunta...', unread: 2 },
        { id: 2, patientName: 'Paciente Masculino 2', lastMessage: 'Gracias por la receta', unread: 0 },
        { id: 3, patientName: 'Paciente Femenina 3', lastMessage: '¿Puedo cambiar la cita?', unread: 1 }
    ];

    renderChatList();
}

function renderChatList() {
    chatList.innerHTML = '';
    
    chats.forEach(chat => {
        const item = document.createElement('a');
        item.href = '#';
        item.className = 'list-group-item list-group-item-action';
        item.innerHTML = `
            <div class="d-flex w-100 justify-content-between">
                <h6 class="mb-1">${chat.patientName}</h6>
                ${chat.unread > 0 ? `<span class="badge bg-primary rounded-pill">${chat.unread}</span>` : ''}
            </div>
            <p class="mb-1 text-muted small">${chat.lastMessage}</p>
        `;
        item.addEventListener('click', () => openChat(chat.id));
        chatList.appendChild(item);
    });
}

function openChat(chatId) {
    const chat = chats.find(c => c.id === chatId);
    chatTitle.textContent = `Chat con ${chat.patientName}`;
    
    const messages = [
        { sender: 'patient', text: 'Hola doctor, tengo una pregunta sobre mi medicación', time: '10:30 AM' },
        { sender: 'doctor', text: 'Buenos días, ¿en qué puedo ayudarle?', time: '10:32 AM' },
        { sender: 'patient', text: '¿Debo tomar el medicamento antes o después de las comidas?', time: '10:33 AM' },
        { sender: 'doctor', text: 'Debe tomarlo después de las comidas para evitar malestar estomacal', time: '10:35 AM' }
    ];

    renderMessages(messages);
}

function renderMessages(messages) {
    chatMessages.innerHTML = '';
    
    messages.forEach(msg => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `d-flex mb-3 ${msg.sender === 'doctor' ? 'justify-content-end' : ''}`;
        
        messageDiv.innerHTML = `
            <div class="${msg.sender === 'doctor' ? 'bg-primary text-white' : 'bg-light'} rounded p-3 max-width-75">
                <div class="mb-1">${msg.text}</div>
                <div class="small text-end ${msg.sender === 'doctor' ? 'text-white-50' : 'text-muted'}">${msg.time}</div>
            </div>
        `;
        
        chatMessages.appendChild(messageDiv);
    });
    
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function sendMessage() {
    const text = messageInput.value.trim();
    if (text) {
        const newMessage = {
            sender: 'doctor',
            text: text,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        
        const messageDiv = document.createElement('div');
        messageDiv.className = 'd-flex mb-3 justify-content-end';
        messageDiv.innerHTML = `
            <div class="bg-primary text-white rounded p-3 max-width-75">
                <div class="mb-1">${text}</div>
                <div class="small text-end text-white-50">${newMessage.time}</div>
            </div>
        `;
        
        chatMessages.appendChild(messageDiv);
        messageInput.value = '';
        
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

// Event Listeners
loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
});

logoutBtn.addEventListener('click', logout);

refreshBtn.addEventListener('click', function() {
    if (currentModule === 'patients') {
        loadPatients();
    } else if (currentModule === 'indicators') {
        if (patientSelector.value) {
            loadPatientIndicators(patientSelector.value);
        }
    } else if (currentModule === 'solicitudes') {
        refreshSolicitudes();
    } else if (currentModule === 'reports') {
        loadReports();
    }
});

moduleLinks.forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        const module = this.getAttribute('data-module');
        switchModule(module);
    });
});

sendMessageBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    // Por ahora, mostramos directamente el login
});

// =============================================
// FUNCIONES PARA GENERACIÓN DE PDF (al final, porque es lo nuego de la app)
// =============================================

// =============================================
// FUNCIONES PARA GENERACIÓN DE PDF CORREGIDAS
// =============================================

// Función para generar PDF de reporte médico
async function generateReportPDF(reportId) {
    try {
        console.log(`📄 Generando PDF para reporte ID: ${reportId}`);
        
        // Obtener datos del reporte
        const report = await apiRequest(`/reportes-medicos/${reportId}`);
        
        // Encontrar el paciente asociado
        const paciente = patients.find(p => p.id_paciente == report.id_paciente);
        const pacienteNombre = paciente ? paciente.nombre : `Paciente ${report.id_paciente}`;
        
        // Crear PDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Configuración inicial
        const pageWidth = doc.internal.pageSize.getWidth();
        let yPosition = 20;
        
        // Logo y encabezado
        doc.setFillColor(74, 111, 255);
        doc.rect(0, 0, pageWidth, 60, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('CuidarTek', 20, 25);
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text('bienestar digital', 20, 32);
        
        // Fecha del reporte
        doc.setFontSize(10);
        doc.text(`Generado: ${new Date().toLocaleDateString()}`, pageWidth - 60, 25);
        
        // Título del reporte
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text('REPORTE MÉDICO', pageWidth / 2, 80, { align: 'center' });
        
        yPosition = 100;
        
        // Información del paciente
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('INFORMACIÓN DEL PACIENTE', 20, yPosition);
        yPosition += 10;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Nombre: ${pacienteNombre}`, 20, yPosition);
        yPosition += 6;
        doc.text(`ID Paciente: ${report.id_paciente}`, 20, yPosition);
        yPosition += 6;
        doc.text(`Fecha del Reporte: ${new Date(report.fecha_reporte).toLocaleDateString()}`, 20, yPosition);
        yPosition += 15;
        
        // Descripción general
        if (report.descripcion_general) {
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('DESCRIPCIÓN GENERAL', 20, yPosition);
            yPosition += 8;
            
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            const descLines = doc.splitTextToSize(report.descripcion_general, pageWidth - 40);
            doc.text(descLines, 20, yPosition);
            yPosition += (descLines.length * 6) + 10;
        }
        
        // Diagnóstico
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('DIAGNÓSTICO', 20, yPosition);
        yPosition += 8;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const diagLines = doc.splitTextToSize(report.diagnostico, pageWidth - 40);
        doc.text(diagLines, 20, yPosition);
        yPosition += (diagLines.length * 6) + 10;
        
        // Recomendaciones médicas
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('RECOMENDACIONES MÉDICAS', 20, yPosition);
        yPosition += 8;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const recLines = doc.splitTextToSize(report.recomendaciones_medicas, pageWidth - 40);
        doc.text(recLines, 20, yPosition);
        
        // Si el contenido es muy largo, agregar nueva página
        if (yPosition + (recLines.length * 6) > 250) {
            doc.addPage();
            yPosition = 20;
        }
        
        // Información del médico
        yPosition += (recLines.length * 6) + 15;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('MÉDICO RESPONSABLE:', 20, yPosition);
        yPosition += 6;
        
        doc.setFont('helvetica', 'normal');
        doc.text(`Dr. ${currentUser.nombre}`, 20, yPosition);
        yPosition += 6;
        doc.text(`ID Médico: ${currentUser.id_usuario}`, 20, yPosition);
        
        // Pie de página
        const footerY = doc.internal.pageSize.getHeight() - 10;
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text('Reporte generado por CuidarTek - Sistema de Bienestar Digital', pageWidth / 2, footerY, { align: 'center' });
        
        // Guardar PDF
        const fileName = `Reporte_${pacienteNombre.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
        
        showNotification('✅ PDF generado exitosamente', 'success');
        
    } catch (error) {
        console.error('❌ Error generando PDF:', error);
        showNotification('❌ Error al generar el PDF', 'error');
    }
}

// Función para generar PDF de indicadores de salud
async function generateIndicatorsPDF(patientId) {
    try {
        console.log(`📊 Generando PDF de indicadores para paciente ID: ${patientId}`);
        
        // Obtener datos del paciente
        const patient = patients.find(p => p.id_paciente == patientId);
        if (!patient) {
            throw new Error('Paciente no encontrado');
        }
        
        // Obtener indicadores del paciente
        const patientIndicators = await apiRequest(`/indicadores-salud/paciente/${patientId}`);
        
        // Crear PDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Configuración inicial
        const pageWidth = doc.internal.pageSize.getWidth();
        let yPosition = 20;
        
        // Logo y encabezado
        doc.setFillColor(74, 111, 255);
        doc.rect(0, 0, pageWidth, 60, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('CuidarTek', 20, 25);
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text('bienestar digital', 20, 32);
        
        // Fecha del reporte
        doc.setFontSize(10);
        doc.text(`Generado: ${new Date().toLocaleDateString()}`, pageWidth - 60, 25);
        
        // Título del reporte
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('REPORTE DE INDICADORES DE SALUD', pageWidth / 2, 80, { align: 'center' });
        
        yPosition = 100;
        
        // Información del paciente
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('INFORMACIÓN DEL PACIENTE', 20, yPosition);
        yPosition += 10;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Nombre: ${patient.nombre}`, 20, yPosition);
        yPosition += 6;
        doc.text(`Edad: ${patient.edad} años`, 20, yPosition);
        yPosition += 6;
        doc.text(`Sexo: ${patient.sexo}`, 20, yPosition);
        yPosition += 6;
        doc.text(`Peso: ${patient.peso_actual || 'N/A'} kg`, 20, yPosition);
        yPosition += 6;
        doc.text(`Altura: ${patient.altura || 'N/A'} m`, 20, yPosition);
        yPosition += 15;
        
        // Últimos indicadores
        if (patientIndicators.length > 0) {
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('ÚLTIMOS INDICADORES REGISTRADOS', 20, yPosition);
            yPosition += 10;
            
            const latest = patientIndicators[0];
            const indicatorsData = [
                { label: 'Fecha Registro', value: new Date(latest.fecha_registro).toLocaleDateString() },
                { label: 'Presión Arterial', value: latest.presion_sistolica && latest.presion_diastolica ? 
                    `${latest.presion_sistolica}/${latest.presion_diastolica} mmHg` : 'No registrada' },
                { label: 'Glucosa', value: latest.glucosa ? `${latest.glucosa} mg/dL` : 'No registrada' },
                { label: 'Peso', value: latest.peso ? `${latest.peso} kg` : 'No registrado' },
                { label: 'Frecuencia Cardíaca', value: latest.frecuencia_cardiaca ? `${latest.frecuencia_cardiaca} lpm` : 'No registrada' },
                { label: 'Estado de Ánimo', value: latest.estado_animo || 'No registrado' },
                { label: 'Actividad Física', value: latest.actividad_fisica || 'No registrada' },
                { label: 'Fuente del Dato', value: latest.fuente_dato === 'wearable' ? 'Wearable' : 'Manual' }
            ];
            
            indicatorsData.forEach(item => {
                doc.setFontSize(10);
                doc.setFont('helvetica', 'bold');
                doc.text(`${item.label}:`, 20, yPosition);
                
                doc.setFont('helvetica', 'normal');
                doc.text(item.value, 80, yPosition);
                yPosition += 6;
            });
            
            yPosition += 10;
            
            // Historial de indicadores (últimos 5 registros)
            if (patientIndicators.length > 1) {
                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                doc.text('HISTORIAL RECIENTE (Últimos 5 registros)', 20, yPosition);
                yPosition += 10;
                
                // Crear tabla
                const tableHeaders = ['Fecha', 'Presión', 'Glucosa', 'Peso', 'FC'];
                let tableX = 20;
                
                // Encabezados de tabla
                doc.setFontSize(8);
                doc.setFont('helvetica', 'bold');
                tableHeaders.forEach((header, index) => {
                    doc.text(header, tableX + (index * 35), yPosition);
                });
                yPosition += 6;
                
                // Línea separadora
                doc.setDrawColor(200, 200, 200);
                doc.line(20, yPosition, pageWidth - 20, yPosition);
                yPosition += 4;
                
                // Datos de la tabla
                doc.setFont('helvetica', 'normal');
                const recentIndicators = patientIndicators.slice(0, 5);
                
                recentIndicators.forEach(indicator => {
                    if (yPosition > 250) {
                        doc.addPage();
                        yPosition = 20;
                    }
                    
                    doc.text(new Date(indicator.fecha_registro).toLocaleDateString(), tableX, yPosition);
                    doc.text(indicator.presion_sistolica && indicator.presion_diastolica ? 
                        `${indicator.presion_sistolica}/${indicator.presion_diastolica}` : 'N/A', tableX + 35, yPosition);
                    doc.text(indicator.glucosa ? indicator.glucosa.toString() : 'N/A', tableX + 70, yPosition);
                    doc.text(indicator.peso ? indicator.peso.toString() : 'N/A', tableX + 105, yPosition);
                    doc.text(indicator.frecuencia_cardiaca ? indicator.frecuencia_cardiaca.toString() : 'N/A', tableX + 140, yPosition);
                    
                    yPosition += 6;
                });
            }
        } else {
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text('No hay indicadores registrados para este paciente.', 20, yPosition);
            yPosition += 10;
        }
        
        // Información del médico
        yPosition += 10;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('MÉDICO RESPONSABLE:', 20, yPosition);
        yPosition += 6;
        
        doc.setFont('helvetica', 'normal');
        doc.text(`Dr. ${currentUser.nombre}`, 20, yPosition);
        
        // Pie de página
        const footerY = doc.internal.pageSize.getHeight() - 10;
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text('Reporte generado por CuidarTek - Sistema de Bienestar Digital', pageWidth / 2, footerY, { align: 'center' });
        
        // Guardar PDF
        const fileName = `Indicadores_${patient.nombre.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
        
        showNotification('✅ PDF de indicadores generado exitosamente', 'success');
        
    } catch (error) {
        console.error('❌ Error generando PDF de indicadores:', error);
        showNotification('❌ Error al generar el PDF de indicadores', 'error');
    }
}

// Variable global para controlar si ya se agregaron los botones PDF
let pdfButtonsAdded = {
    reportsTable: false,
    indicatorsModule: false
};

// Función para agregar botones de PDF en la tabla de reportes (SOLO UNA VEZ)
function addPDFButtonsToReports() {
    if (pdfButtonsAdded.reportsTable) return;
    
    const reportsTable = document.getElementById('reportsTableBody');
    if (!reportsTable) return;
    
    const rows = reportsTable.getElementsByTagName('tr');
    
    for (let row of rows) {
        const cells = row.getElementsByTagName('td');
        if (cells.length >= 5) {
            const actionsCell = cells[4];
            
            // Verificar si ya existe un botón PDF en esta fila
            const existingPdfButton = actionsCell.querySelector('.btn-pdf-report');
            if (existingPdfButton) continue;
            
            const viewButton = actionsCell.querySelector('button[onclick*="viewReport"]');
            
            if (viewButton) {
                // Extraer el ID del reporte del onclick
                const onclickContent = viewButton.getAttribute('onclick');
                const reportIdMatch = onclickContent.match(/viewReport\((\d+)\)/);
                
                if (reportIdMatch) {
                    const reportId = reportIdMatch[1];
                    
                    // Crear botón de PDF
                    const pdfButton = document.createElement('button');
                    pdfButton.className = 'btn btn-sm btn-danger ms-1 btn-pdf-report';
                    pdfButton.innerHTML = '<i class="fas fa-file-pdf"></i>';
                    pdfButton.title = 'Descargar PDF';
                    pdfButton.onclick = function(e) {
                        e.stopPropagation();
                        generateReportPDF(reportId);
                    };
                    
                    // Insertar después del botón de ver
                    viewButton.parentNode.insertBefore(pdfButton, viewButton.nextSibling);
                }
            }
        }
    }
    
    pdfButtonsAdded.reportsTable = true;
}

// Función para agregar botón de PDF en el módulo de indicadores (SOLO UNA VEZ)
function addPDFButtonToIndicators() {
    if (pdfButtonsAdded.indicatorsModule) return;
    
    const patientSelector = document.getElementById('patientSelector');
    if (patientSelector && patientSelector.value) {
        const cardBody = document.querySelector('#indicatorsModule .card-body');
        if (cardBody) {
            // Buscar el contenedor del selector de pacientes
            const selectorContainer = document.querySelector('#patientSelector').parentNode;
            
            // Verificar si ya existe el botón
            let existingButton = selectorContainer.querySelector('.btn-pdf-indicators');
            
            if (!existingButton) {
                const pdfButton = document.createElement('button');
                pdfButton.className = 'btn btn-danger btn-sm mt-3 btn-pdf-indicators';
                pdfButton.innerHTML = '<i class="fas fa-file-pdf me-1"></i> Descargar Reporte de Indicadores';
                pdfButton.onclick = function() {
                    generateIndicatorsPDF(patientSelector.value);
                };
                
                selectorContainer.appendChild(pdfButton);
                pdfButtonsAdded.indicatorsModule = true;
            }
        }
    }
}

// Función para resetear los flags cuando se cambia de módulo
function resetPDFButtonsFlags() {
    pdfButtonsAdded.reportsTable = false;
    pdfButtonsAdded.indicatorsModule = false;
}

// Modificar la función renderReportsTable para agregar botones PDF (SOLO UNA VEZ)
const originalRenderReportsTable = renderReportsTable;
renderReportsTable = function() {
    originalRenderReportsTable();
    // Agregar botones de PDF después de renderizar la tabla (con delay para asegurar que se renderizó)
    setTimeout(() => {
        addPDFButtonsToReports();
    }, 100);
};

// Modificar la función loadPatientIndicators para agregar botón PDF (SOLO UNA VEZ)
const originalLoadPatientIndicators = loadPatientIndicators;
loadPatientIndicators = function(patientId) {
    originalLoadPatientIndicators(patientId);
    // Agregar botón de PDF después de cargar indicadores
    setTimeout(() => {
        addPDFButtonToIndicators();
    }, 100);
};

// Modificar la función switchModule para resetear flags
const originalSwitchModule = switchModule;
switchModule = function(module) {
    originalSwitchModule(module);
    resetPDFButtonsFlags();
};

// Agregar botón de PDF en el modal de ver reporte (SOLO CUANDO SE ABRE EL MODAL)
const originalShowReportModal = showReportModal;
showReportModal = function(report, isEditMode) {
    originalShowReportModal(report, isEditMode);
    
    // Agregar botón de PDF en el footer del modal (solo en modo vista)
    setTimeout(() => {
        const modalFooter = document.getElementById('viewReportModalFooter');
        if (modalFooter && !isEditMode) {
            // Verificar si ya existe el botón PDF
            const existingPdfButton = modalFooter.querySelector('.btn-pdf-modal');
            if (existingPdfButton) return;
            
            const pdfButton = document.createElement('button');
            pdfButton.type = 'button';
            pdfButton.className = 'btn btn-danger me-2 btn-pdf-modal';
            pdfButton.innerHTML = '<i class="fas fa-file-pdf me-1"></i> Descargar PDF';
            pdfButton.onclick = function() {
                generateReportPDF(report.id_reporte);
                const modal = bootstrap.Modal.getInstance(document.getElementById('viewReportModal'));
                modal.hide();
            };
            
            modalFooter.insertBefore(pdfButton, modalFooter.firstChild);
        }
    }, 100);
};

console.log('✅ Funciones de PDF corregidas - Botones únicos');

//NUEVOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO///

// =============================================
// SISTEMA DE ADMINISTRACIÓN - CORREGIDO
// =============================================

// Variable global para controlar si es admin
let isAdmin = false;

// Modificar la función login existente para detectar admin
const originalLogin = login;
login = async function(email, password) {
    try {
        const data = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({
                correo: email,
                password: password
            })
        });

        authToken = data.access_token;
        currentUser = await apiRequest('/auth/me');
        
        // VERIFICAR SI ES ADMIN basado en el campo "rol"
        console.log('🔍 Verificando rol de usuario:', currentUser);
        
        // Manejar diferentes estructuras de respuesta
        const userRol = currentUser.rol || currentUser.tipo_usuario;
        
        if (userRol === 'admin') {
            isAdmin = true;
            console.log('🎯 Usuario identificado como ADMIN');
            
            // Ocultar todo y mostrar panel de admin
            loginScreen.classList.add('d-none');
            app.classList.add('d-none');
            showAdminPanel();
            
        } else {
            // Usuario normal (médico)
            isAdmin = false;
            console.log('🎯 Usuario identificado como MÉDICO');
            
            userName.textContent = currentUser.nombre;
            loginScreen.classList.add('d-none');
            app.classList.remove('d-none');

            // Cargar datos normales del médico
            loadPatients();
            loadReports();
        }

    } catch (error) {
        loginError.classList.remove('d-none');
        console.error('Login failed:', error);
    }
};

// Función para mostrar el panel de administración
function showAdminPanel() {
    // Crear el HTML del panel de admin si no existe
    if (!document.getElementById('adminPanel')) {
        const adminHTML = `
        <div id="adminPanel">
            <nav class="navbar navbar-dark bg-dark">
                <div class="container-fluid">
                    <span class="navbar-brand mb-0 h1">
                        <i class="fas fa-cogs me-2"></i>
                        CuidarTek - Panel de Administración
                    </span>
                    <div class="d-flex">
                        <span class="navbar-text me-3">
                            <i class="fas fa-user-shield me-1"></i>
                            <span id="adminName">${currentUser.nombre}</span>
                        </span>
                        <button class="btn btn-outline-light btn-sm" id="adminLogoutBtn">
                            <i class="fas fa-sign-out-alt me-1"></i>Cerrar Sesión
                        </button>
                    </div>
                </div>
            </nav>

            <div class="container-fluid mt-4">
                <ul class="nav nav-tabs" id="adminTabs" role="tablist">
                    <li class="nav-item" role="presentation">
                        <button class="nav-link active" id="users-tab" data-bs-toggle="tab" data-bs-target="#users" type="button" role="tab" aria-controls="users" aria-selected="true">
                            <i class="fas fa-users me-1"></i>Usuarios
                        </button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link" id="patients-tab" data-bs-toggle="tab" data-bs-target="#patients" type="button" role="tab" aria-controls="patients" aria-selected="false">
                            <i class="fas fa-user-injured me-1"></i>Pacientes
                        </button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link" id="doctors-tab" data-bs-toggle="tab" data-bs-target="#doctors" type="button" role="tab" aria-controls="doctors" aria-selected="false">
                            <i class="fas fa-user-md me-1"></i>Médicos
                        </button>
                    </li>
                </ul>

                <div class="tab-content" id="adminTabContent">
                    <div class="tab-pane fade show active" id="users" role="tabpanel" aria-labelledby="users-tab">
                        <div class="card mt-3">
                            <div class="card-header d-flex justify-content-between align-items-center">
                                <h5 class="mb-0">Gestión de Usuarios</h5>
                                <button class="btn btn-primary btn-sm" data-bs-toggle="modal" data-bs-target="#addUserModal">
                                    <i class="fas fa-plus me-1"></i> Agregar Usuario
                                </button>
                            </div>
                            <div class="card-body">
                                <div class="table-responsive">
                                    <table class="table table-hover">
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Nombre</th>
                                                <th>Email</th>
                                                <th>Rol</th>
                                                <th>Estado</th>
                                                <th>Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody id="usersTableBody">
                                            <!-- Los usuarios se cargarán aquí -->
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="tab-pane fade" id="patients" role="tabpanel" aria-labelledby="patients-tab">
                        <div class="card mt-3">
                            <div class="card-header d-flex justify-content-between align-items-center">
                                <h5 class="mb-0">Gestión de Pacientes</h5>
                            </div>
                            <div class="card-body">
                                <div class="table-responsive">
                                    <table class="table table-hover">
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Nombre</th>
                                                <th>Edad</th>
                                                <th>Sexo</th>
                                                <th>Médico Asignado</th>
                                                <th>Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody id="adminPatientsTableBody">
                                            <!-- Los pacientes se cargarán aquí -->
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="tab-pane fade" id="doctors" role="tabpanel" aria-labelledby="doctors-tab">
                        <div class="card mt-3">
                            <div class="card-header d-flex justify-content-between align-items-center">
                                <h5 class="mb-0">Gestión de Médicos</h5>
                                <button class="btn btn-primary btn-sm" data-bs-toggle="modal" data-bs-target="#addDoctorModal">
                                    <i class="fas fa-plus me-1"></i> Agregar Médico
                                </button>
                            </div>
                            <div class="card-body">
                                <div class="table-responsive">
                                    <table class="table table-hover">
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Nombre</th>
                                                <th>Email</th>
                                                <th>Especialidad</th>
                                                <th>Estado</th>
                                                <th>Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody id="doctorsTableBody">
                                            <!-- Los médicos se cargarán aquí -->
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modales para administración -->
        <div class="modal fade" id="addUserModal" tabindex="-1" aria-labelledby="addUserModalLabel" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="addUserModalLabel">Agregar Nuevo Usuario</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <form id="addUserForm">
                            <div class="mb-3">
                                <label for="userName" class="form-label">Nombre</label>
                                <input type="text" class="form-control" id="userName" required>
                            </div>
                            <div class="mb-3">
                                <label for="userEmail" class="form-label">Email</label>
                                <input type="email" class="form-control" id="userEmail" required>
                            </div>
                            <div class="mb-3">
                                <label for="userPassword" class="form-label">Contraseña</label>
                                <input type="password" class="form-control" id="userPassword" required>
                            </div>
                            <div class="mb-3">
                                <label for="userType" class="form-label">Rol de Usuario</label>
                                <select class="form-select" id="userType" required>
                                    <option value="">Seleccione un rol</option>
                                    <option value="medico">Médico</option>
                                    <option value="admin">Administrador</option>
                                </select>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-primary" onclick="addUser()">Guardar Usuario</button>
                    </div>
                </div>
            </div>
        </div>

        <div class="modal fade" id="addDoctorModal" tabindex="-1" aria-labelledby="addDoctorModalLabel" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="addDoctorModalLabel">Agregar Nuevo Médico</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <form id="addDoctorForm">
                            <div class="mb-3">
                                <label for="doctorName" class="form-label">Nombre</label>
                                <input type="text" class="form-control" id="doctorName" required>
                            </div>
                            <div class="mb-3">
                                <label for="doctorEmail" class="form-label">Email</label>
                                <input type="email" class="form-control" id="doctorEmail" required>
                            </div>
                            <div class="mb-3">
                                <label for="doctorPassword" class="form-label">Contraseña</label>
                                <input type="password" class="form-control" id="doctorPassword" required>
                            </div>
                            <div class="mb-3">
                                <label for="doctorSpecialty" class="form-label">Especialidad</label>
                                <input type="text" class="form-control" id="doctorSpecialty" placeholder="Ej: Cardiología, Pediatría, etc." required>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-primary" onclick="addDoctor()">Guardar Médico</button>
                    </div>
                </div>
            </div>
        </div>

        <div class="modal fade" id="editUserModal" tabindex="-1" aria-labelledby="editUserModalLabel" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="editUserModalLabel">Editar Usuario</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <form id="editUserForm">
                            <input type="hidden" id="editUserId">
                            <div class="mb-3">
                                <label for="editUserName" class="form-label">Nombre</label>
                                <input type="text" class="form-control" id="editUserName" required>
                            </div>
                            <div class="mb-3">
                                <label for="editUserEmail" class="form-label">Email</label>
                                <input type="email" class="form-control" id="editUserEmail" required>
                            </div>
                            <div class="mb-3">
                                <label for="editUserType" class="form-label">Rol de Usuario</label>
                                <select class="form-select" id="editUserType" required>
                                    <option value="medico">Médico</option>
                                    <option value="admin">Administrador</option>
                                </select>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-primary" onclick="updateUser()">Actualizar Usuario</button>
                    </div>
                </div>
            </div>
        </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', adminHTML);
        
        // Agregar event listener para el logout de admin
        document.getElementById('adminLogoutBtn').addEventListener('click', logout);
    }
    
    // Mostrar el panel de admin
    document.getElementById('adminPanel').classList.remove('d-none');
    
    // Cargar datos de administración
    loadAdminData();
}

// Función para cargar todos los datos del admin
async function loadAdminData() {
    await loadUsers();
    await loadAllPatients();
    await loadDoctors();
}

// Cargar todos los usuarios
async function loadUsers() {
    try {
        const users = await apiRequest('/usuarios/');
        renderUsersTable(users);
    } catch (error) {
        console.error('Error loading users:', error);
        showNotification('Error al cargar los usuarios', 'error');
    }
}

// Cargar todos los pacientes (vista admin)
async function loadAllPatients() {
    try {
        const pacientes = await apiRequest('/pacientes/');
        renderAdminPatientsTable(pacientes);
    } catch (error) {
        console.error('Error loading patients:', error);
        showNotification('Error al cargar los pacientes', 'error');
    }
}

// Cargar todos los médicos
async function loadDoctors() {
    try {
        const allUsers = await apiRequest('/usuarios/');
        const medicos = allUsers.filter(user => {
            const userRol = user.rol || user.tipo_usuario;
            return userRol === 'medico';
        });
        renderDoctorsTable(medicos);
    } catch (error) {
        console.error('Error loading doctors:', error);
        showNotification('Error al cargar los médicos', 'error');
    }
}

// FUNCIONES CORREGIDAS PARA MANEJAR DIFERENTES ESTRUCTURAS DE DATOS

// Función para obtener el ID de usuario (maneja diferentes estructuras)
function getUserId(user) {
    return user.id_usuario || user.id || user.user_id || 'N/A';
}

// Función para obtener el nombre de usuario (maneja diferentes estructuras)
function getUserName(user) {
    return user.nombre || user.name || 'Nombre no disponible';
}

// Función para obtener el email de usuario (maneja diferentes estructuras)
function getUserEmail(user) {
    return user.correo || user.email || 'Email no disponible';
}

// Función para obtener el rol de usuario (maneja diferentes estructuras)
function getUserRol(user) {
    return user.rol || user.tipo_usuario || user.role || 'N/A';
}

// Función para obtener el estatus de usuario (maneja diferentes estructuras)
function getUserStatus(user) {
    return user.estatus || user.status || user.estado || 'Activo';
}

// Renderizar tabla de usuarios CORREGIDA
function renderUsersTable(users) {
    const usersTableBody = document.getElementById('usersTableBody');
    if (!usersTableBody) return;
    
    usersTableBody.innerHTML = '';
    
    if (users.length === 0) {
        usersTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4">
                    <div class="empty-state">
                        <i class="fas fa-users fa-3x mb-3"></i>
                        <h5>No hay usuarios registrados</h5>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    users.forEach(user => {
        const row = document.createElement('tr');
        const userId = getUserId(user);
        const userName = getUserName(user);
        const userEmail = getUserEmail(user);
        const userRol = getUserRol(user);
        const userStatus = getUserStatus(user);
        
        const tipoBadge = userRol === 'admin' ? 'admin' : 'medico';
        const estatusBadge = userStatus === 'Activo' ? 'bg-success' : 'bg-secondary';
        
        row.innerHTML = `
            <td>${userId}</td>
            <td>${userName}</td>
            <td>${userEmail}</td>
            <td>
                <span class="user-type-badge ${tipoBadge}">
                    ${userRol === 'admin' ? 'Administrador' : 'Médico'}
                </span>
            </td>
            <td>
                <span class="badge ${estatusBadge}">${userStatus}</span>
            </td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1" onclick="editUser(${userId})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-warning me-1" onclick="toggleUserStatus(${userId}, '${userStatus}')">
                    <i class="fas ${userStatus === 'Activo' ? 'fa-pause' : 'fa-play'}"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteUser(${userId})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        usersTableBody.appendChild(row);
    });
}

// Renderizar tabla de pacientes CORREGIDA
function renderAdminPatientsTable(pacientes) {
    const adminPatientsTableBody = document.getElementById('adminPatientsTableBody');
    if (!adminPatientsTableBody) return;
    
    adminPatientsTableBody.innerHTML = '';
    
    if (pacientes.length === 0) {
        adminPatientsTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4">
                    <div class="empty-state">
                        <i class="fas fa-user-injured fa-3x mb-3"></i>
                        <h5>No hay pacientes registrados</h5>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    pacientes.forEach(paciente => {
        const row = document.createElement('tr');
        const pacienteId = paciente.id_paciente || paciente.id || 'N/A';
        const nombre = paciente.nombre || 
            (paciente.sexo === 'Femenino' ? 
                `Paciente Femenina ${pacienteId}` : 
                `Paciente Masculino ${pacienteId}`);
        
        row.innerHTML = `
            <td>${pacienteId}</td>
            <td>${nombre}</td>
            <td>${paciente.edad || 'N/A'} años</td>
            <td>${paciente.sexo || 'N/A'}</td>
            <td>${paciente.doctor_asignado || 'No asignado'}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1" onclick="editPatientAdmin(${pacienteId})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deletePatientAdmin(${pacienteId})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        adminPatientsTableBody.appendChild(row);
    });
}

// Renderizar tabla de médicos CORREGIDA
function renderDoctorsTable(medicos) {
    const doctorsTableBody = document.getElementById('doctorsTableBody');
    if (!doctorsTableBody) return;
    
    doctorsTableBody.innerHTML = '';
    
    if (medicos.length === 0) {
        doctorsTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4">
                    <div class="empty-state">
                        <i class="fas fa-user-md fa-3x mb-3"></i>
                        <h5>No hay médicos registrados</h5>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    medicos.forEach(medico => {
        const row = document.createElement('tr');
        const userId = getUserId(medico);
        const userName = getUserName(medico);
        const userEmail = getUserEmail(medico);
        const userStatus = getUserStatus(medico);
        
        const estatusBadge = userStatus === 'Activo' ? 'bg-success' : 'bg-secondary';
        
        row.innerHTML = `
            <td>${userId}</td>
            <td>${userName}</td>
            <td>${userEmail}</td>
            <td>${medico.especialidad || 'General'}</td>
            <td>
                <span class="badge ${estatusBadge}">${userStatus}</span>
            </td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1" onclick="editUser(${userId})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-warning me-1" onclick="toggleUserStatus(${userId}, '${userStatus}')">
                    <i class="fas ${userStatus === 'Activo' ? 'fa-pause' : 'fa-play'}"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteDoctor(${userId})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        doctorsTableBody.appendChild(row);
    });
}

// FUNCIONES CRUD CORREGIDAS

// Función para agregar usuario con la estructura correcta
async function addUser() {
    try {
        const userData = {
            nombre: document.getElementById('userName').value,
            correo: document.getElementById('userEmail').value,
            password: document.getElementById('userPassword').value,
            rol: document.getElementById('userType').value,
            estatus: "Activo"
        };

        console.log('📝 Enviando datos de usuario:', userData);

        await apiRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });

        const modal = bootstrap.Modal.getInstance(document.getElementById('addUserModal'));
        modal.hide();
        document.getElementById('addUserForm').reset();

        showNotification('✅ Usuario agregado exitosamente', 'success');
        await loadUsers();
        
    } catch (error) {
        console.error('Error adding user:', error);
        showNotification('❌ Error al agregar el usuario: ' + error.message, 'error');
    }
}

// Función para agregar médico con la estructura correcta
async function addDoctor() {
    try {
        const doctorData = {
            nombre: document.getElementById('doctorName').value,
            correo: document.getElementById('doctorEmail').value,
            password: document.getElementById('doctorPassword').value,
            rol: "medico",
            estatus: "Activo",
            especialidad: document.getElementById('doctorSpecialty').value
        };

        console.log('📝 Enviando datos de médico:', doctorData);

        await apiRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify(doctorData)
        });

        const modal = bootstrap.Modal.getInstance(document.getElementById('addDoctorModal'));
        modal.hide();
        document.getElementById('addDoctorForm').reset();

        showNotification('✅ Médico agregado exitosamente', 'success');
        await loadDoctors();
        
    } catch (error) {
        console.error('Error adding doctor:', error);
        showNotification('❌ Error al agregar el médico: ' + error.message, 'error');
    }
}

// Función para editar usuario CORREGIDA
async function editUser(userId) {
    try {
        const user = await apiRequest(`/usuarios/${userId}`);
        console.log('📋 Datos del usuario recibidos:', user);
        
        // Usar las funciones helper para obtener los datos correctamente
        document.getElementById('editUserId').value = getUserId(user);
        document.getElementById('editUserName').value = getUserName(user);
        document.getElementById('editUserEmail').value = getUserEmail(user);
        document.getElementById('editUserType').value = getUserRol(user);
        
        const modal = new bootstrap.Modal(document.getElementById('editUserModal'));
        modal.show();
        
    } catch (error) {
        console.error('Error loading user:', error);
        showNotification('❌ Error al cargar el usuario: ' + error.message, 'error');
    }
}

// Función para actualizar usuario con la estructura correcta
async function updateUser() {
    try {
        const userId = document.getElementById('editUserId').value;
        const userData = {
            nombre: document.getElementById('editUserName').value,
            correo: document.getElementById('editUserEmail').value,
            rol: document.getElementById('editUserType').value,
            estatus: "Activo"
        };

        console.log('📝 Actualizando usuario ID:', userId, 'Datos:', userData);

        await apiRequest(`/usuarios/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(userData)
        });

        const modal = bootstrap.Modal.getInstance(document.getElementById('editUserModal'));
        modal.hide();

        showNotification('✅ Usuario actualizado exitosamente', 'success');
        await loadUsers();
        
    } catch (error) {
        console.error('Error updating user:', error);
        showNotification('❌ Error al actualizar el usuario: ' + error.message, 'error');
    }
}

// Función para cambiar estatus de usuario
async function toggleUserStatus(userId, currentStatus) {
    try {
        const newStatus = currentStatus === 'Activo' ? 'Inactivo' : 'Activo';
        const userData = {
            estatus: newStatus
        };

        console.log('🔄 Cambiando estatus del usuario:', userId, 'Nuevo estatus:', newStatus);

        await apiRequest(`/usuarios/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(userData)
        });

        showNotification(`✅ Usuario ${newStatus === 'Activo' ? 'activado' : 'desactivado'} exitosamente`, 'success');
        await loadUsers();
        
    } catch (error) {
        console.error('Error updating user status:', error);
        showNotification('❌ Error al cambiar el estatus del usuario', 'error');
    }
}

// Función para eliminar usuario
async function deleteUser(userId) {
    if (confirm('¿Está seguro de que desea eliminar este usuario?')) {
        try {
            await apiRequest(`/usuarios/${userId}`, {
                method: 'DELETE'
            });
            
            showNotification('✅ Usuario eliminado exitosamente', 'success');
            await loadUsers();
        } catch (error) {
            console.error('Error deleting user:', error);
            showNotification('❌ Error al eliminar el usuario', 'error');
        }
    }
}

// Función para eliminar médico
async function deleteDoctor(userId) {
    if (confirm('¿Está seguro de que desea eliminar este médico?')) {
        try {
            await apiRequest(`/usuarios/${userId}`, {
                method: 'DELETE'
            });
            
            showNotification('✅ Médico eliminado exitosamente', 'success');
            await loadDoctors();
        } catch (error) {
            console.error('Error deleting doctor:', error);
            showNotification('❌ Error al eliminar el médico', 'error');
        }
    }
}

// Función para eliminar paciente (admin)
async function deletePatientAdmin(patientId) {
    if (confirm('¿Está seguro de que desea eliminar este paciente?')) {
        try {
            await apiRequest(`/pacientes/${patientId}`, {
                method: 'DELETE'
            });
            
            showNotification('✅ Paciente eliminado exitosamente', 'success');
            await loadAllPatients();
        } catch (error) {
            console.error('Error deleting patient:', error);
            showNotification('❌ Error al eliminar el paciente', 'error');
        }
    }
}

// Modificar la función logout existente para incluir admin
const originalLogout = logout;
logout = function() {
    authToken = '';
    currentUser = null;
    isAdmin = false;
    
    // Ocultar todos los paneles
    app.classList.add('d-none');
    if (document.getElementById('adminPanel')) {
        document.getElementById('adminPanel').classList.add('d-none');
    }
    
    // Mostrar login
    loginScreen.classList.remove('d-none');
    loginForm.reset();
    loginError.classList.add('d-none');
};

// Agregar los estilos CSS necesarios
const adminStyles = `
<style>
.admin-badge {
    background-color: #dc3545;
    color: white;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 500;
}

.user-type-badge {
    background-color: #6c757d;
    color: white;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 500;
}

.user-type-badge.medico {
    background-color: #0d6efd;
}

.user-type-badge.admin {
    background-color: #dc3545;
}
</style>
`;

document.head.insertAdjacentHTML('beforeend', adminStyles);

console.log('✅ Sistema de administración integrado y corregido correctamente');