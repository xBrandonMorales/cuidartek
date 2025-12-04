// Funciones del módulo de pacientes - VERSIÓN COMPLETA CORREGIDA
async function loadPatients() {
    try {
        console.log('🔄 Cargando TODOS mis pacientes asignados...');
        
        // 1. PRIMERO: Cargar pacientes desde paciente-medico/mis-pacientes (incluye solicitudes aceptadas)
        console.log('🔄 Cargando desde /paciente-medico/mis-pacientes...');
        const pacientesDelMedico = await window.apiRequest('/paciente-medico/mis-pacientes');
        console.log('✅ Pacientes desde paciente-medico:', pacientesDelMedico);
        
        // 2. SEGUNDO: Cargar TODOS los pacientes para obtener información completa
        console.log('🔄 Cargando todos los pacientes para información completa...');
        const todosLosPacientes = await apiRequest('/pacientes/');
        console.log('✅ Todos los pacientes:', todosLosPacientes);
        
        // 3. COMBINAR: Crear una lista única con TODOS los pacientes del médico
        myPatients = [];
        
        // Procesar pacientes desde paciente-medico (solicitudes aceptadas)
        if (pacientesDelMedico && pacientesDelMedico.length > 0) {
            pacientesDelMedico.forEach(pm => {
                // Buscar información completa en la lista general
                const pacienteCompleto = todosLosPacientes.find(p => p.id_paciente === pm.id_paciente);
                
                const paciente = {
                    id_paciente: pm.id_paciente,
                    id_usuario: pm.id_usuario_paciente,
                    nombre: pm.nombre_paciente || `Paciente ${pm.id_paciente}`,
                    edad: pm.edad || pacienteCompleto?.edad,
                    sexo: pm.sexo || pacienteCompleto?.sexo,
                    peso_actual: pm.peso_actual || pacienteCompleto?.peso_actual,
                    altura: pm.altura || pacienteCompleto?.altura,
                    enfermedades_cronicas: pacienteCompleto?.enfermedades_cronicas || '',
                    medicamentos: pacienteCompleto?.medicamentos || '',
                    doctor_asignado: currentUser.id_usuario,
                    // Campos adicionales para identificar origen
                    origen: 'solicitud_aceptada',
                    id_relacion: pm.id_relacion,
                    fecha_asignacion: pm.fecha_asignacion
                };
                
                myPatients.push(paciente);
            });
        }
        
        // 4. AGREGAR: Pacientes que tienen doctor_asignado directamente (método tradicional)
        const pacientesDirectos = todosLosPacientes.filter(p => 
            p.doctor_asignado === currentUser.id_usuario && 
            !myPatients.some(mp => mp.id_paciente === p.id_paciente) // Evitar duplicados
        );
        
        if (pacientesDirectos.length > 0) {
            console.log('🔄 Agregando pacientes con asignación directa:', pacientesDirectos.length);
            
            pacientesDirectos.forEach(paciente => {
                const nombre = paciente.nombre || 
                    (paciente.sexo === 'Femenino' ? 
                        `Paciente Femenina ${paciente.id_paciente}` : 
                        `Paciente Masculino ${paciente.id_paciente}`);
                
                myPatients.push({
                    id_paciente: paciente.id_paciente,
                    id_usuario: paciente.id_usuario,
                    nombre: nombre,
                    edad: paciente.edad,
                    sexo: paciente.sexo,
                    peso_actual: paciente.peso_actual,
                    altura: paciente.altura,
                    enfermedades_cronicas: paciente.enfermedades_cronicas || '',
                    medicamentos: paciente.medicamentos || '',
                    doctor_asignado: paciente.doctor_asignado,
                    origen: 'asignacion_directa'
                });
            });
        }
        
        console.log(`🎯 TOTAL de mis pacientes: ${myPatients.length}`);
        console.log('📋 Lista completa de mis pacientes:', myPatients);
        
        // 5. ACTUALIZAR ESTADÍSTICAS
        updatePatientStatistics();
        
        // 6. RENDERIZAR TABLA
        renderMyPatientsTable();
        
    } catch (error) {
        console.error('❌ Error cargando pacientes:', error);
        showNotification('Error al cargar los pacientes', 'error');
        
        // Mostrar estado vacío
        myPatients = [];
        renderMyPatientsTable();
    }
}

// Función para actualizar estadísticas
function updatePatientStatistics() {
    totalPatients.textContent = myPatients.length;
    activePatients.textContent = myPatients.length;
    
    // Contar pacientes con medicamentos REALES
    const conMedicamentos = myPatients.filter(p => {
        const meds = (p.medicamentos || '').toLowerCase().trim();
        return meds && meds !== 'nada' && meds !== 'ninguno' && meds !== '' && 
               meds !== 'null' && meds !== 'undefined';
    }).length;
    
    // Contar pacientes con enfermedades REALES
    const conEnfermedades = myPatients.filter(p => {
        const enfermedades = (p.enfermedades_cronicas || '').toLowerCase().trim();
        return enfermedades && enfermedades !== 'nada' && enfermedades !== 'ninguna' && 
               enfermedades !== '' && enfermedades !== 'null' && enfermedades !== 'undefined';
    }).length;
    
    totalMedications.textContent = conMedicamentos;
    totalConditions.textContent = conEnfermedades;

    console.log(`💊 Mis pacientes con medicamentos: ${conMedicamentos}`);
    console.log(`🏥 Mis pacientes con enfermedades: ${conEnfermedades}`);
}

// Función para renderizar la tabla de mis pacientes (MEJORADA)
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
    
    // Ordenar pacientes por nombre
    const pacientesOrdenados = [...myPatients].sort((a, b) => 
        a.nombre.localeCompare(b.nombre)
    );
    
    pacientesOrdenados.forEach(patient => {
        const row = document.createElement('tr');
        
        // Badge para identificar el origen
        const origenBadge = patient.origen === 'solicitud_aceptada' ? 
            '<span class="badge bg-success ms-2" title="Desde solicitud">Solicitud</span>' :
            '<span class="badge bg-primary ms-2" title="Asignación directa">Directo</span>';
        
        row.innerHTML = `
            <td>
                <strong>${patient.nombre}</strong>
                ${origenBadge}
            </td>
            <td>${patient.edad || 'N/A'} años</td>
            <td>${patient.sexo || 'N/A'}</td>
            <td>${patient.peso_actual || 'N/A'} kg</td>
            <td>${patient.altura || 'N/A'} m</td>
            <td>${patient.enfermedades_cronicas || 'Ninguna'}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1" onclick="viewPatient(${patient.id_paciente})" title="Ver paciente">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-outline-secondary me-1" onclick="editPatient(${patient.id_paciente})" title="Editar paciente">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deletePatient(${patient.id_paciente})" title="Eliminar paciente">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        myPatientsTableBody.appendChild(row);
    });
    
    console.log(`✅ Tabla renderizada con ${myPatients.length} pacientes`);
}

// Función para ver paciente
async function viewPatient(patientId) {
    try {
        console.log(`👁️ Viendo paciente ID: ${patientId}`);
        const patient = await apiRequest(`/pacientes/${patientId}`);
        
        // Buscar en myPatients para obtener el nombre correcto
        const miPaciente = myPatients.find(p => p.id_paciente === patientId);
        const nombreMostrar = miPaciente?.nombre || 
            patient.nombre || 
            (patient.sexo === 'Femenino' ? `Paciente Femenina ${patient.id_paciente}` : `Paciente Masculino ${patient.id_paciente}`);
        
        const patientConNombre = {
            ...patient,
            nombre: nombreMostrar
        };
        
        showPatientModal(patientConNombre, false);
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
        
        // Buscar en myPatients para obtener el nombre correcto
        const miPaciente = myPatients.find(p => p.id_paciente === patientId);
        const nombreMostrar = miPaciente?.nombre || 
            patient.nombre || 
            (patient.sexo === 'Femenino' ? `Paciente Femenina ${patient.id_paciente}` : `Paciente Masculino ${patient.id_paciente}`);
        
        const patientConNombre = {
            ...patient,
            nombre: nombreMostrar
        };
        
        showPatientModal(patientConNombre, true);
    } catch (error) {
        console.error('Error loading patient:', error);
        showNotification('Error al cargar los datos del paciente', 'error');
    }
}

// Función para mostrar modal de paciente (vista/edición) - CON HISTORIAL
function showPatientModal(patient, isEditMode = false) {
    const modal = document.getElementById('patientViewModal');
    const modalTitle = document.getElementById('patientViewModalLabel');
    const modalBody = document.getElementById('patientViewModalBody');
    const modalFooter = document.getElementById('patientViewModalFooter');
    
    modalTitle.textContent = isEditMode ? 'Editar Paciente' : 'Ver Paciente';
    
    modalBody.innerHTML = `
        <ul class="nav nav-tabs mb-3" id="patientTabs" role="tablist">
            <li class="nav-item" role="presentation">
                <button class="nav-link active" id="info-tab" data-bs-toggle="tab" data-bs-target="#info" type="button" role="tab" aria-controls="info" aria-selected="true">
                    <i class="fas fa-info-circle me-1"></i>Información
                </button>
            </li>
            <li class="nav-item" role="presentation">
                <button class="nav-link" id="history-tab" data-bs-toggle="tab" data-bs-target="#history" type="button" role="tab" aria-controls="history" aria-selected="false">
                    <i class="fas fa-history me-1"></i>Historial Completo
                </button>
            </li>
        </ul>
        
        <div class="tab-content" id="patientTabContent">
            <!-- Pestaña de Información -->
            <div class="tab-pane fade show active" id="info" role="tabpanel" aria-labelledby="info-tab">
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
                                <input type="text" class="form-control" id="viewPatientName" value="${patient.nombre}" ${!isEditMode ? 'readonly' : ''}>
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
            </div>
            
            <!-- Pestaña de Historial -->
            <div class="tab-pane fade" id="history" role="tabpanel" aria-labelledby="history-tab">
                <div class="row">
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-header">
                                <h6 class="mb-0"><i class="fas fa-file-medical me-2"></i>Reportes Médicos</h6>
                            </div>
                            <div class="card-body p-0">
                                <div id="patientReportsHistory" style="max-height: 300px; overflow-y: auto;">
                                    <div class="text-center p-3 text-muted">
                                        <div class="spinner-border spinner-border-sm me-2" role="status"></div>
                                        Cargando reportes...
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-header">
                                <h6 class="mb-0"><i class="fas fa-chart-line me-2"></i>Indicadores Registrados</h6>
                            </div>
                            <div class="card-body p-0">
                                <div id="patientIndicatorsHistory" style="max-height: 300px; overflow-y: auto;">
                                    <div class="text-center p-3 text-muted">
                                        <div class="spinner-border spinner-border-sm me-2" role="status"></div>
                                        Cargando indicadores...
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
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
    
    // Cargar historial cuando se muestre el modal
    loadPatientHistory(patient.id_paciente);
}

// Función para cargar el historial completo del paciente
async function loadPatientHistory(patientId) {
    try {
        // Cargar reportes del paciente
        const patientReports = await apiRequest(`/reportes-medicos/paciente/${patientId}`);
        renderPatientReportsHistory(patientReports);
        
        // Cargar indicadores del paciente
        const patientIndicators = await apiRequest(`/indicadores-salud/paciente/${patientId}`);
        renderPatientIndicatorsHistory(patientIndicators);
        
    } catch (error) {
        console.error('❌ Error cargando historial del paciente:', error);
        document.getElementById('patientReportsHistory').innerHTML = '<div class="text-center p-3 text-muted">Error al cargar reportes</div>';
        document.getElementById('patientIndicatorsHistory').innerHTML = '<div class="text-center p-3 text-muted">Error al cargar indicadores</div>';
    }
}

// Función para renderizar historial de reportes
function renderPatientReportsHistory(reports) {
    const container = document.getElementById('patientReportsHistory');
    
    if (!reports || reports.length === 0) {
        container.innerHTML = '<div class="text-center p-3 text-muted">No hay reportes registrados</div>';
        return;
    }
    
    // Ordenar por fecha más reciente primero
    reports.sort((a, b) => new Date(b.fecha_reporte) - new Date(a.fecha_reporte));
    
    let html = '';
    reports.forEach(report => {
        const fecha = new Date(report.fecha_reporte).toLocaleDateString();
        const diagnosticoCorto = report.diagnostico ? 
            (report.diagnostico.length > 30 ? report.diagnostico.substring(0, 30) + '...' : report.diagnostico) : 
            'Sin diagnóstico';
            
        html += `
            <div class="border-bottom p-3">
                <div class="d-flex justify-content-between align-items-start mb-1">
                    <strong class="small">${fecha}</strong>
                    <button class="btn btn-sm btn-outline-primary" onclick="viewReport(${report.id_reporte})">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
                <p class="mb-1 small text-muted">${diagnosticoCorto}</p>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Función para renderizar historial de indicadores
function renderPatientIndicatorsHistory(indicators) {
    const container = document.getElementById('patientIndicatorsHistory');
    
    if (!indicators || indicators.length === 0) {
        container.innerHTML = '<div class="text-center p-3 text-muted">No hay indicadores registrados</div>';
        return;
    }
    
    // Ordenar por fecha más reciente primero
    indicators.sort((a, b) => new Date(b.fecha_registro) - new Date(a.fecha_registro));
    
    let html = '';
    indicators.forEach(indicator => {
        const fecha = new Date(indicator.fecha_registro).toLocaleDateString();
        const tienePresion = indicator.presion_sistolica && indicator.presion_diastolica;
        const presionText = tienePresion ? `${indicator.presion_sistolica}/${indicator.presion_diastolica}` : 'No registrada';
        
        html += `
            <div class="border-bottom p-3">
                <div class="d-flex justify-content-between align-items-start mb-1">
                    <strong class="small">${fecha}</strong>
                    <span class="badge bg-secondary">${indicator.fuente_dato === 'wearable' ? 'Wearable' : 'Manual'}</span>
                </div>
                <div class="row small text-muted">
                    <div class="col-6">Presión: ${presionText}</div>
                    <div class="col-6">Glucosa: ${indicator.glucosa || 'N/R'}</div>
                    <div class="col-6">Peso: ${indicator.peso || 'N/R'} kg</div>
                    <div class="col-6">FC: ${indicator.frecuencia_cardiaca || 'N/R'}</div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
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

// Función para cargar el módulo completo de pacientes
async function loadPatientsModule() {
    await loadPatients();
}

// Función para ocultar la pestaña de "Todos los pacientes" (se mantiene por compatibilidad)
function ocultarPestanaTodosLosPacientes() {
    const allPatientsTab = document.getElementById('all-patients-tab');
    const allPatientsTabContent = document.getElementById('all-patients');
    const myPatientsTab = document.getElementById('my-patients-tab');
    
    if (allPatientsTab && allPatientsTabContent && myPatientsTab) {
        // Ocultar la pestaña de "Todos los pacientes"
        allPatientsTab.parentElement.style.display = 'none';
        allPatientsTabContent.classList.remove('show', 'active');
        
        // Activar y mostrar la pestaña de "Mis Pacientes"
        myPatientsTab.classList.add('active');
        document.getElementById('my-patients').classList.add('show', 'active');
        
        console.log('✅ Pestaña "Todos los pacientes" ocultada');
    }
}

// Función para renderizar tabla de todos los pacientes (se mantiene por compatibilidad)
function renderPatientsTable() {
    // Esta función ya no se usa, pero la mantenemos por si acaso
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