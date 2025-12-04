// Sistema de Búsqueda Global
let currentSearchTerm = '';

// Función para inicializar la búsqueda
function initializeSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');

    if (searchInput && searchBtn) {
        // Evento al hacer clic en el botón de búsqueda
        searchBtn.addEventListener('click', performSearch);
        
        // Evento al presionar Enter en el input
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
        
        // Evento al escribir (búsqueda en tiempo real)
        searchInput.addEventListener('input', function(e) {
            currentSearchTerm = e.target.value.trim();
            if (currentSearchTerm.length >= 2 || currentSearchTerm.length === 0) {
                performSearch();
            }
        });
    }
}

// Función principal de búsqueda
function performSearch() {
    const searchTerm = document.getElementById('searchInput').value.trim();
    currentSearchTerm = searchTerm;
    
    console.log(`🔍 Buscando: "${searchTerm}" en módulo: ${currentModule}`);
    
    // Ejecutar búsqueda según el módulo actual
    switch (currentModule) {
        case 'patients':
            searchPatients(searchTerm);
            break;
        case 'indicators':
            searchIndicators(searchTerm);
            break;
        case 'communication':
            searchChats(searchTerm);
            break;
        case 'reports':
            searchReports(searchTerm);
            break;
        default:
            console.log('Módulo no reconocido para búsqueda');
    }
}

// Búsqueda en módulo de pacientes
function searchPatients(searchTerm) {
    if (!searchTerm) {
        // Si no hay término de búsqueda, mostrar todos los pacientes
        renderPatientsTable();
        renderMyPatientsTable();
        return;
    }

    const searchLower = searchTerm.toLowerCase();
    
    // Filtrar pacientes
    const filteredPatients = patients.filter(patient => 
        patient.nombre.toLowerCase().includes(searchLower) ||
        (patient.edad && patient.edad.toString().includes(searchTerm)) ||
        (patient.sexo && patient.sexo.toLowerCase().includes(searchLower)) ||
        (patient.enfermedades_cronicas && patient.enfermedades_cronicas.toLowerCase().includes(searchLower)) ||
        (patient.medicamentos && patient.medicamentos.toLowerCase().includes(searchLower)) ||
        (patient.id_paciente && patient.id_paciente.toString().includes(searchTerm))
    );

    // Filtrar mis pacientes
    const filteredMyPatients = myPatients.filter(patient => 
        patient.nombre.toLowerCase().includes(searchLower) ||
        (patient.edad && patient.edad.toString().includes(searchTerm)) ||
        (patient.sexo && patient.sexo.toLowerCase().includes(searchLower)) ||
        (patient.enfermedades_cronicas && patient.enfermedades_cronicas.toLowerCase().includes(searchLower)) ||
        (patient.id_paciente && patient.id_paciente.toString().includes(searchTerm))
    );

    console.log(`👥 Pacientes encontrados: ${filteredPatients.length}`);
    console.log(`🎯 Mis pacientes encontrados: ${filteredMyPatients.length}`);

    // Renderizar tablas filtradas
    renderFilteredPatientsTable(filteredPatients);
    renderFilteredMyPatientsTable(filteredMyPatients);
}

// Renderizar tabla de pacientes filtrada
function renderFilteredPatientsTable(filteredPatients) {
    patientsTableBody.innerHTML = '';
    
    if (filteredPatients.length === 0) {
        patientsTableBody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-4">
                    <div class="empty-state">
                        <i class="fas fa-search fa-3x mb-3"></i>
                        <h5>No se encontraron pacientes</h5>
                        <p class="text-muted">No hay resultados para "${currentSearchTerm}"</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    filteredPatients.forEach(patient => {
        const row = document.createElement('tr');
        // Resaltar el término de búsqueda en el nombre
        const highlightedName = highlightText(patient.nombre, currentSearchTerm);
        
        row.innerHTML = `
            <td>
                <strong>${highlightedName}</strong>
            </td>
            <td>${patient.edad} años</td>
            <td>${patient.sexo}</td>
            <td>${patient.peso_actual} kg</td>
            <td>${patient.altura} m</td>
            <td>${highlightText(patient.enfermedades_cronicas, currentSearchTerm)}</td>
            <td>${highlightText(patient.medicamentos, currentSearchTerm)}</td>
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

// Renderizar tabla de mis pacientes filtrada
function renderFilteredMyPatientsTable(filteredMyPatients) {
    myPatientsTableBody.innerHTML = '';
    myPatientsCount.textContent = `${filteredMyPatients.length} paciente${filteredMyPatients.length !== 1 ? 's' : ''} encontrado${filteredMyPatients.length !== 1 ? 's' : ''}`;
    
    if (filteredMyPatients.length === 0) {
        myPatientsTableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4">
                    <div class="empty-state">
                        <i class="fas fa-search fa-3x mb-3"></i>
                        <h5>No se encontraron pacientes</h5>
                        <p class="text-muted">No hay resultados para "${currentSearchTerm}" en tus pacientes</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    filteredMyPatients.forEach(patient => {
        const row = document.createElement('tr');
        const highlightedName = highlightText(patient.nombre, currentSearchTerm);
        
        row.innerHTML = `
            <td>
                <strong>${highlightedName}</strong>
                <span class="doctor-badge ms-2">Mi Paciente</span>
            </td>
            <td>${patient.edad} años</td>
            <td>${patient.sexo}</td>
            <td>${patient.peso_actual} kg</td>
            <td>${patient.altura} m</td>
            <td>${highlightText(patient.enfermedades_cronicas, currentSearchTerm)}</td>
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

// Búsqueda en módulo de indicadores
function searchIndicators(searchTerm) {
    if (!searchTerm) {
        // Si no hay búsqueda, recargar el selector normal
        loadPatientSelector();
        return;
    }

    const searchLower = searchTerm.toLowerCase();
    
    // Filtrar pacientes para el selector
    const filteredPatients = myPatients.filter(patient => 
        patient.nombre.toLowerCase().includes(searchLower) ||
        (patient.id_paciente && patient.id_paciente.toString().includes(searchTerm))
    );

    // Actualizar el selector de pacientes
    updatePatientSelector(filteredPatients);
}

// Actualizar selector de pacientes filtrado
function updatePatientSelector(filteredPatients) {
    const patientSelector = document.getElementById('patientSelector');
    const indicatorPatient = document.getElementById('indicatorPatient');
    
    if (patientSelector) {
        patientSelector.innerHTML = '<option value="">Seleccione un paciente</option>';
        filteredPatients.forEach(patient => {
            const option = document.createElement('option');
            option.value = patient.id_paciente;
            option.textContent = patient.nombre;
            patientSelector.appendChild(option);
        });
    }
    
    if (indicatorPatient) {
        indicatorPatient.innerHTML = '<option value="">Seleccione un paciente</option>';
        filteredPatients.forEach(patient => {
            const option = document.createElement('option');
            option.value = patient.id_paciente;
            option.textContent = patient.nombre;
            indicatorPatient.appendChild(option);
        });
    }
}

// Búsqueda en módulo de comunicación
function searchChats(searchTerm) {
    if (!searchTerm) {
        // Si no hay búsqueda, mostrar todos los chats
        renderChatList();
        return;
    }

    const searchLower = searchTerm.toLowerCase();
    
    // Filtrar chats
    const filteredChats = chats.filter(chat => 
        chat.patientName.toLowerCase().includes(searchLower) ||
        chat.lastMessage.toLowerCase().includes(searchLower)
    );

    renderFilteredChatList(filteredChats);
}

// Renderizar lista de chats filtrada
function renderFilteredChatList(filteredChats) {
    chatList.innerHTML = '';
    
    if (filteredChats.length === 0) {
        chatList.innerHTML = `
            <div class="text-center p-4 text-muted">
                <i class="fas fa-search fa-2x mb-3"></i>
                <p>No se encontraron conversaciones</p>
                <small>No hay resultados para "${currentSearchTerm}"</small>
            </div>
        `;
        return;
    }
    
    filteredChats.forEach(chat => {
        const item = document.createElement('a');
        item.href = '#';
        item.className = `list-group-item list-group-item-action ${currentChatPatientId === chat.id ? 'active' : ''}`;
        
        const lastMessageTime = chat.lastMessageTime ? 
            new Date(chat.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
        
        // Resaltar texto en el nombre y mensaje
        const highlightedName = highlightText(chat.patientName, currentSearchTerm);
        const highlightedMessage = highlightText(chat.lastMessage, currentSearchTerm);
        const shortMessage = highlightedMessage.length > 50 ? 
            highlightedMessage.substring(0, 50) + '...' : highlightedMessage;
        
        item.innerHTML = `
            <div class="d-flex w-100 justify-content-between align-items-start">
                <div class="flex-grow-1">
                    <h6 class="mb-1">${highlightedName}</h6>
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

// Búsqueda en módulo de reportes
function searchReports(searchTerm) {
    if (!searchTerm) {
        // Si no hay búsqueda, mostrar todos los reportes
        renderReportsTable();
        return;
    }

    const searchLower = searchTerm.toLowerCase();
    
    // Filtrar reportes
    let filteredReports = reports.filter(report => {
        // Buscar en nombre del paciente
        const paciente = patients.find(p => p.id_paciente == report.id_paciente);
        const pacienteNombre = paciente ? paciente.nombre : `Paciente ${report.id_paciente}`;
        
        return pacienteNombre.toLowerCase().includes(searchLower) ||
               (report.diagnostico && report.diagnostico.toLowerCase().includes(searchLower)) ||
               (report.recomendaciones_medicas && report.recomendaciones_medicas.toLowerCase().includes(searchLower)) ||
               (report.fecha_reporte && new Date(report.fecha_reporte).toLocaleDateString().includes(searchTerm)) ||
               (report.id_reporte && report.id_reporte.toString().includes(searchTerm));
    });

    renderFilteredReportsTable(filteredReports);
}

// Renderizar tabla de reportes filtrada
function renderFilteredReportsTable(filteredReports) {
    reportsTableBody.innerHTML = '';
    
    if (filteredReports.length === 0) {
        reportsTableBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-4">
                    <div class="empty-state">
                        <i class="fas fa-search fa-3x mb-3"></i>
                        <h5>No se encontraron reportes</h5>
                        <p class="text-muted">No hay resultados para "${currentSearchTerm}"</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    filteredReports.forEach(report => {
        const paciente = patients.find(p => p.id_paciente == report.id_paciente);
        const pacienteNombre = paciente ? paciente.nombre : `Paciente ${report.id_paciente}`;
        
        const diagnosticoCorto = report.diagnostico ? 
            (report.diagnostico.length > 50 ? report.diagnostico.substring(0, 50) + '...' : report.diagnostico) : 
            'No especificado';
            
        const recomendacionesCorto = report.recomendaciones_medicas ? 
            (report.recomendaciones_medicas.length > 50 ? report.recomendaciones_medicas.substring(0, 50) + '...' : report.recomendaciones_medicas) : 
            'No especificadas';
        
        const row = document.createElement('tr');
        const highlightedPaciente = highlightText(pacienteNombre, currentSearchTerm);
        const highlightedDiagnostico = highlightText(diagnosticoCorto, currentSearchTerm);
        const highlightedRecomendaciones = highlightText(recomendacionesCorto, currentSearchTerm);
        
        row.innerHTML = `
            <td>
                <strong>${highlightedPaciente}</strong>
            </td>
            <td>${new Date(report.fecha_reporte).toLocaleDateString()}</td>
            <td>${highlightedDiagnostico}</td>
            <td>${highlightedRecomendaciones}</td>
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

// Función para resaltar texto
function highlightText(text, searchTerm) {
    if (!text || !searchTerm) return text;
    
    const searchLower = searchTerm.toLowerCase();
    const textStr = String(text);
    const textLower = textStr.toLowerCase();
    
    if (!textLower.includes(searchLower)) return textStr;
    
    const regex = new RegExp(`(${escapeRegExp(searchTerm)})`, 'gi');
    return textStr.replace(regex, '<mark class="bg-warning">$1</mark>');
}

// Función para escapar caracteres especiales en regex
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Limpiar búsqueda al cambiar de módulo
function clearSearch() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = '';
        currentSearchTerm = '';
    }
}

// Exportar funciones globales
window.performSearch = performSearch;
window.clearSearch = clearSearch;