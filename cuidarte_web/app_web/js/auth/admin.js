// Sistema de administración

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
                                <button class="btn btn-primary btn-sm" data-bs-toggle="modal" data-bs-target="#addPatientModal">
                                    <i class="fas fa-plus me-1"></i> Agregar Paciente
                                </button>
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
                                    <option value="paciente">Paciente</option>
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

        <!-- Modal para agregar paciente - SIN CAMPO id_usuario -->
        <div class="modal fade" id="addPatientModal" tabindex="-1" aria-labelledby="addPatientModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="addPatientModalLabel">Agregar Nuevo Paciente</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <form id="addPatientForm">
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="patientName" class="form-label">Nombre del Paciente</label>
                                        <input type="text" class="form-control" id="patientName" placeholder="Ej: Juan Pérez García" required>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="patientAge" class="form-label">Edad</label>
                                        <input type="number" class="form-control" id="patientAge" min="0" max="120" required>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="patientGender" class="form-label">Sexo</label>
                                        <select class="form-select" id="patientGender" required>
                                            <option value="">Seleccione</option>
                                            <option value="Masculino">Masculino</option>
                                            <option value="Femenino">Femenino</option>
                                            <option value="Otro">Otro</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="patientDoctor" class="form-label">Médico Asignado</label>
                                        <select class="form-select" id="patientDoctor">
                                            <option value="">Sin médico asignado</option>
                                            <!-- Los médicos se cargarán dinámicamente -->
                                        </select>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="patientWeight" class="form-label">Peso (kg)</label>
                                        <input type="number" step="0.1" class="form-control" id="patientWeight" placeholder="Ej: 70.5">
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="patientHeight" class="form-label">Altura (m)</label>
                                        <input type="number" step="0.01" class="form-control" id="patientHeight" placeholder="Ej: 1.75">
                                    </div>
                                </div>
                            </div>
                            
                            <div class="mb-3">
                                <label for="patientConditions" class="form-label">Enfermedades Crónicas</label>
                                <textarea class="form-control" id="patientConditions" rows="3" placeholder="Ej: Diabetes tipo 2, Hipertensión arterial"></textarea>
                            </div>
                            
                            <div class="mb-3">
                                <label for="patientMedications" class="form-label">Medicamentos</label>
                                <textarea class="form-control" id="patientMedications" rows="3" placeholder="Ej: Metformina 500mg, Losartán 50mg"></textarea>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-primary" onclick="addPatient()">Guardar Paciente</button>
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
                                    <option value="paciente">Paciente</option>
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

        <!-- Modal para editar paciente (admin) -->
        <div class="modal fade" id="editPatientAdminModal" tabindex="-1" aria-labelledby="editPatientAdminModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="editPatientAdminModalLabel">Editar Paciente</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body" id="editPatientAdminModalBody">
                        <!-- Contenido cargado dinámicamente -->
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-primary" onclick="updatePatientAdmin()">Actualizar Paciente</button>
                    </div>
                </div>
            </div>
        </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', adminHTML);
        
        // Agregar event listener para el logout de admin
        document.getElementById('adminLogoutBtn').addEventListener('click', logout);
        
        // Inicializar eventos del modal de pacientes
        initializePatientModal();
    }
    
    // Mostrar el panel de admin
    document.getElementById('adminPanel').classList.remove('d-none');
    
    // Cargar datos de administración
    loadAdminData();
}

// Inicializar eventos del modal de pacientes
function initializePatientModal() {
    const addPatientModal = document.getElementById('addPatientModal');
    if (addPatientModal) {
        addPatientModal.addEventListener('show.bs.modal', function() {
            loadDoctorsForPatientModal();
        });
        
        addPatientModal.addEventListener('hidden.bs.modal', function() {
            document.getElementById('addPatientForm').reset();
        });
    }
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

// Renderizar tabla de usuarios
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
        
        const tipoBadge = userRol === 'admin' ? 'admin' : (userRol === 'medico' ? 'medico' : 'paciente');
        const estatusBadge = userStatus === 'Activo' ? 'bg-success' : 'bg-secondary';
        
        row.innerHTML = `
            <td>${userId}</td>
            <td>${userName}</td>
            <td>${userEmail}</td>
            <td>
                <span class="user-type-badge ${tipoBadge}">
                    ${userRol === 'admin' ? 'Administrador' : (userRol === 'medico' ? 'Médico' : 'Paciente')}
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

// Renderizar tabla de pacientes
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

// Renderizar tabla de médicos
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

// Función para agregar usuario
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

// Función para cargar médicos en el select del modal de agregar paciente
async function loadDoctorsForPatientModal() {
    try {
        console.log('🔄 Cargando médicos para el select...');
        const allUsers = await apiRequest('/usuarios/');
        
        const medicos = allUsers.filter(user => {
            const userRol = user.rol || user.tipo_usuario;
            return userRol === 'medico' && (user.estatus === 'Activo' || user.estatus === undefined || user.estatus === null);
        });
        
        console.log(`🎯 Médicos encontrados: ${medicos.length}`);
        
        const doctorSelect = document.getElementById('patientDoctor');
        if (doctorSelect) {
            doctorSelect.innerHTML = '<option value="">Sin médico asignado</option>';
            
            medicos.forEach(medico => {
                const option = document.createElement('option');
                const userId = medico.id_usuario || medico.id;
                const userName = medico.nombre || 'Médico sin nombre';
                const especialidad = medico.especialidad || 'General';
                
                option.value = userId;
                option.textContent = `${userName} - ${especialidad}`;
                doctorSelect.appendChild(option);
            });
            
            console.log(`✅ Select cargado con ${medicos.length} médicos`);
        }
    } catch (error) {
        console.error('❌ Error loading doctors for patient modal:', error);
    }
}

// Función para agregar paciente - VERSIÓN SIMPLIFICADA SIN id_usuario
async function addPatient() {
    try {
        // Obtener valores del formulario
        const nombre = document.getElementById('patientName').value.trim();
        const edad = parseInt(document.getElementById('patientAge').value) || 0;
        const sexo = document.getElementById('patientGender').value;
        const pesoInput = document.getElementById('patientWeight').value;
        const alturaInput = document.getElementById('patientHeight').value;
        const enfermedadesInput = document.getElementById('patientConditions').value.trim();
        const medicamentosInput = document.getElementById('patientMedications').value.trim();
        const doctorAsignadoInput = document.getElementById('patientDoctor').value;

        // Validaciones básicas
        if (!nombre) {
            showNotification('El nombre del paciente es requerido', 'error');
            return;
        }

        if (!edad || edad < 0 || edad > 150) {
            showNotification('La edad debe ser un valor válido entre 0 y 150 años', 'error');
            return;
        }

        if (!sexo) {
            showNotification('El sexo del paciente es requerido', 'error');
            return;
        }

        // Mostrar indicador de carga
        const submitBtn = document.querySelector('#addPatientModal .btn-primary');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Guardando...';
        submitBtn.disabled = true;

        try {
            // Crear objeto de datos del paciente SIN id_usuario
            const patientData = {
                nombre: nombre,
                edad: edad,
                sexo: sexo
                // NO incluimos id_usuario - la API lo asignará automáticamente
            };

            // Agregar campos opcionales solo si tienen valor
            if (pesoInput && pesoInput !== "") {
                patientData.peso_actual = parseFloat(pesoInput);
            }
            
            if (alturaInput && alturaInput !== "") {
                patientData.altura = parseFloat(alturaInput);
            }
            
            if (enfermedadesInput) {
                patientData.enfermedades_cronicas = enfermedadesInput;
            }
            
            if (medicamentosInput) {
                patientData.medicamentos = medicamentosInput;
            }
            
            if (doctorAsignadoInput && doctorAsignadoInput !== "") {
                patientData.doctor_asignado = parseInt(doctorAsignadoInput);
            }

            console.log('📤 Enviando datos de paciente a la API (SIN id_usuario):', patientData);

            // Enviar a la API
            await apiRequest('/pacientes/', {
                method: 'POST',
                body: JSON.stringify(patientData)
            });

            // Éxito
            const modal = bootstrap.Modal.getInstance(document.getElementById('addPatientModal'));
            modal.hide();
            
            // Resetear formulario
            setTimeout(() => {
                document.getElementById('addPatientForm').reset();
            }, 300);

            showNotification('✅ Paciente agregado exitosamente', 'success');
            await loadAllPatients();
            
        } catch (apiError) {
            console.error('❌ Error de API:', apiError);
            
            // Intentar con estructura aún más simple
            if (apiError.message.includes('422') || apiError.message.includes('400')) {
                console.log('⚠️ Probando estructura MÍNIMA...');
                
                // Intento alternativo: enviar SOLO los campos obligatorios
                const minimalData = {
                    nombre: nombre,
                    edad: edad,
                    sexo: sexo
                };
                
                console.log('📤 Enviando datos mínimos:', minimalData);
                
                try {
                    await apiRequest('/pacientes/', {
                        method: 'POST',
                        body: JSON.stringify(minimalData)
                    });
                    
                    // Si llega aquí, el intento mínima funcionó
                    const modal = bootstrap.Modal.getInstance(document.getElementById('addPatientModal'));
                    modal.hide();
                    
                    setTimeout(() => {
                        document.getElementById('addPatientForm').reset();
                    }, 300);

                    showNotification('✅ Paciente agregado exitosamente (solo datos básicos)', 'success');
                    await loadAllPatients();
                    
                } catch (minimalError) {
                    console.error('❌ Error con estructura mínima:', minimalError);
                    
                    // Último intento: verificar si es un problema con el tipo de datos
                    const lastTryData = {
                        nombre: String(nombre),
                        edad: Number(edad),
                        sexo: String(sexo),
                        peso_actual: pesoInput ? Number(pesoInput) : null,
                        altura: alturaInput ? Number(alturaInput) : null,
                        enfermedades_cronicas: enfermedadesInput || null,
                        medicamentos: medicamentosInput || null,
                        doctor_asignado: doctorAsignadoInput ? Number(doctorAsignadoInput) : null
                    };
                    
                    console.log('📤 Último intento con conversión de tipos:', lastTryData);
                    
                    await apiRequest('/pacientes/', {
                        method: 'POST',
                        body: JSON.stringify(lastTryData)
                    });
                    
                    const modal = bootstrap.Modal.getInstance(document.getElementById('addPatientModal'));
                    modal.hide();
                    
                    setTimeout(() => {
                        document.getElementById('addPatientForm').reset();
                    }, 300);

                    showNotification('✅ Paciente agregado exitosamente', 'success');
                    await loadAllPatients();
                }
                
            } else {
                throw apiError; // Re-lanzar otros errores
            }
            
        } finally {
            // Restaurar botón
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
        
    } catch (error) {
        console.error('❌ Error final:', error);
        showNotification(`❌ Error al agregar el paciente: ${error.message}`, 'error');
    }
}

// Función para editar usuario
async function editUser(userId) {
    try {
        const user = await apiRequest(`/usuarios/${userId}`);
        console.log('📋 Datos del usuario recibidos:', user);
        
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

// Función para editar paciente (admin)
async function editPatientAdmin(patientId) {
    try {
        const patient = await apiRequest(`/pacientes/${patientId}`);
        const allUsers = await apiRequest('/usuarios/');
        const medicos = allUsers.filter(user => {
            const userRol = user.rol || user.tipo_usuario;
            return userRol === 'medico';
        });

        console.log('📋 Datos del paciente recibidos:', patient);
        
        const modalBody = document.getElementById('editPatientAdminModalBody');
        modalBody.innerHTML = `
            <form id="editPatientAdminForm">
                <input type="hidden" id="editPatientId" value="${patient.id_paciente}">
                <div class="row">
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="editPatientName" class="form-label">Nombre del Paciente</label>
                            <input type="text" class="form-control" id="editPatientName" value="${patient.nombre || ''}" required>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="editPatientAge" class="form-label">Edad</label>
                            <input type="number" class="form-control" id="editPatientAge" value="${patient.edad || ''}" min="0" max="120" required>
                        </div>
                    </div>
                </div>
                
                <div class="row">
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="editPatientGender" class="form-label">Sexo</label>
                            <select class="form-select" id="editPatientGender" required>
                                <option value="">Seleccione</option>
                                <option value="Masculino" ${patient.sexo === 'Masculino' ? 'selected' : ''}>Masculino</option>
                                <option value="Femenino" ${patient.sexo === 'Femenino' ? 'selected' : ''}>Femenino</option>
                                <option value="Otro" ${patient.sexo === 'Otro' ? 'selected' : ''}>Otro</option>
                            </select>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="editPatientDoctor" class="form-label">Médico Asignado</label>
                            <select class="form-select" id="editPatientDoctor">
                                <option value="">Sin médico asignado</option>
                                ${medicos.map(medico => `
                                    <option value="${getUserId(medico)}" ${patient.doctor_asignado == getUserId(medico) ? 'selected' : ''}>
                                        ${getUserName(medico)} - ${medico.especialidad || 'General'}
                                    </option>
                                `).join('')}
                            </select>
                        </div>
                    </div>
                </div>
                
                <div class="row">
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="editPatientWeight" class="form-label">Peso (kg)</label>
                            <input type="number" step="0.1" class="form-control" id="editPatientWeight" value="${patient.peso_actual || ''}">
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="editPatientHeight" class="form-label">Altura (m)</label>
                            <input type="number" step="0.01" class="form-control" id="editPatientHeight" value="${patient.altura || ''}">
                        </div>
                    </div>
                </div>
                
                <div class="mb-3">
                    <label for="editPatientConditions" class="form-label">Enfermedades Crónicas</label>
                    <textarea class="form-control" id="editPatientConditions" rows="3">${patient.enfermedades_cronicas || ''}</textarea>
                </div>
                
                <div class="mb-3">
                    <label for="editPatientMedications" class="form-label">Medicamentos</label>
                    <textarea class="form-control" id="editPatientMedications" rows="3">${patient.medicamentos || ''}</textarea>
                </div>
            </form>
        `;

        const modal = new bootstrap.Modal(document.getElementById('editPatientAdminModal'));
        modal.show();
        
    } catch (error) {
        console.error('Error loading patient:', error);
        showNotification('❌ Error al cargar el paciente: ' + error.message, 'error');
    }
}

// Función para actualizar paciente (admin)
async function updatePatientAdmin() {
    try {
        const patientId = document.getElementById('editPatientId').value;
        
        // Obtener valores
        const nombre = document.getElementById('editPatientName').value;
        const edad = parseInt(document.getElementById('editPatientAge').value) || 0;
        const sexo = document.getElementById('editPatientGender').value;
        const pesoInput = document.getElementById('editPatientWeight').value;
        const alturaInput = document.getElementById('editPatientHeight').value;
        const condicionesInput = document.getElementById('editPatientConditions').value;
        const medicamentosInput = document.getElementById('editPatientMedications').value;
        const doctorInput = document.getElementById('editPatientDoctor').value;

        // Estructura básica
        const patientData = {
            nombre: nombre,
            edad: edad,
            sexo: sexo
        };

        // Agregar campos opcionales
        if (pesoInput && pesoInput !== "") patientData.peso_actual = parseFloat(pesoInput);
        if (alturaInput && alturaInput !== "") patientData.altura = parseFloat(alturaInput);
        if (condicionesInput) patientData.enfermedades_cronicas = condicionesInput;
        if (medicamentosInput) patientData.medicamentos = medicamentosInput;
        if (doctorInput && doctorInput !== "") {
            patientData.doctor_asignado = parseInt(doctorInput);
        }

        console.log('📝 Actualizando paciente ID:', patientId, 'Datos:', patientData);

        await apiRequest(`/pacientes/${patientId}`, {
            method: 'PUT',
            body: JSON.stringify(patientData)
        });

        const modal = bootstrap.Modal.getInstance(document.getElementById('editPatientAdminModal'));
        modal.hide();

        showNotification('✅ Paciente actualizado exitosamente', 'success');
        await loadAllPatients();
        
    } catch (error) {
        console.error('Error updating patient:', error);
        showNotification('❌ Error al actualizar el paciente: ' + error.message, 'error');
    }
}

// Función para actualizar usuario
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

// Agregar los estilos CSS necesarios para admin
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

.user-type-badge.paciente {
    background-color: #198754;
}

.empty-state {
    color: #6c757d;
    text-align: center;
    padding: 2rem;
}

.empty-state i {
    color: #dee2e6;
}
</style>
`;

// Insertar estilos cuando se carga el módulo
document.head.insertAdjacentHTML('beforeend', adminStyles);