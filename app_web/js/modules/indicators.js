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
        renderIndicatorsTable(); // Mostrar tabla en lugar de gráfica
        
        // Agregar botón de PDF después de cargar indicadores
        setTimeout(() => {
            addPDFButtonToIndicators();
        }, 100);
    } catch (error) {
        console.error('Error loading indicators:', error);
        showNotification('Error al cargar los indicadores del paciente', 'error');
        indicators = [];
        renderLatestIndicators();
        renderIndicatorsTable();
    }
}

// Función para obtener los últimos 2 registros de cada tipo
function getLatestIndicatorsByType() {
    const wearableIndicators = indicators.filter(ind => ind.fuente_dato === 'wearable');
    const manualIndicators = indicators.filter(ind => ind.fuente_dato === 'manual');
    
    // Tomar solo los últimos 2 de cada tipo
    const latestWearable = wearableIndicators.slice(0, 2);
    const latestManual = manualIndicators.slice(0, 2);
    
    // Combinar y ordenar por fecha (más reciente primero)
    const combined = [...latestWearable, ...latestManual];
    return combined.sort((a, b) => new Date(b.fecha_registro) - new Date(a.fecha_registro));
}

// Función para renderizar los últimos indicadores
function renderLatestIndicators() {
    latestIndicators.innerHTML = '';
    
    if (indicators.length === 0) {
        latestIndicators.innerHTML = `
            <li class="list-group-item text-muted">
                <i class="fas fa-chart-line me-2"></i>No hay indicadores registrados
            </li>
        `;
        return;
    }

    // Obtener los últimos 2 registros de cada tipo
    const latestIndicatorsData = getLatestIndicatorsByType();
    
    // Mostrar el más reciente primero como resumen
    const latest = indicators[0];
    
    // Encabezado con información del último registro
    const header = document.createElement('li');
    header.className = 'list-group-item bg-light';
    header.innerHTML = `
        <div class="d-flex justify-content-between align-items-center">
            <strong>Último registro</strong>
            <span class="badge bg-primary">${new Date(latest.fecha_registro).toLocaleDateString()}</span>
        </div>
    `;
    latestIndicators.appendChild(header);

    // Últimos indicadores del registro más reciente
    const items = [
        { 
            label: 'Presión arterial', 
            value: latest.presion_sistolica && latest.presion_diastolica ? 
                `${latest.presion_sistolica}/${latest.presion_diastolica} mmHg` : 'No registrada',
            icon: 'fa-heartbeat'
        },
        { 
            label: 'Glucosa', 
            value: latest.glucosa ? `${latest.glucosa} mg/dL` : 'No registrada',
            icon: 'fa-tint'
        },
        { 
            label: 'Peso', 
            value: latest.peso ? `${latest.peso} kg` : 'No registrado',
            icon: 'fa-weight'
        },
        { 
            label: 'Frecuencia cardíaca', 
            value: latest.frecuencia_cardiaca ? `${latest.frecuencia_cardiaca} lpm` : 'No registrada',
            icon: 'fa-heart'
        },
        { 
            label: 'Estado de ánimo', 
            value: latest.estado_animo || 'No registrado',
            icon: 'fa-smile'
        },
        { 
            label: 'Actividad física', 
            value: latest.actividad_fisica || 'No registrada',
            icon: 'fa-running'
        },
        { 
            label: 'Fuente del dato', 
            value: latest.fuente_dato === 'wearable' ? 
                '<span class="badge bg-success">Wearable</span>' : 
                '<span class="badge bg-info">Manual</span>',
            icon: 'fa-database'
        }
    ];

    items.forEach(item => {
        const li = document.createElement('li');
        li.className = 'list-group-item';
        li.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <i class="fas ${item.icon} me-2 text-muted"></i>
                    <span class="small">${item.label}</span>
                </div>
                ${item.label === 'Fuente del dato' ? item.value : `<span class="fw-bold">${item.value}</span>`}
            </div>
        `;
        latestIndicators.appendChild(li);
    });
}

// Función para renderizar la tabla de indicadores (solo últimos 2 de cada tipo)
function renderIndicatorsTable() {
    const indicatorsModule = document.getElementById('indicatorsModule');
    
    // Buscar o crear el contenedor de la tabla
    let tableContainer = indicatorsModule.querySelector('#indicatorsTableContainer');
    if (!tableContainer) {
        tableContainer = document.createElement('div');
        tableContainer.id = 'indicatorsTableContainer';
        tableContainer.className = 'card mt-4';
        
        // Reemplazar el gráfico por la tabla
        const chartCard = indicatorsModule.querySelector('.card');
        if (chartCard) {
            chartCard.innerHTML = `
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">Tabla de Indicadores de Salud</h5>
                    <div>
                        <button class="btn btn-primary btn-sm me-2" data-bs-toggle="modal" data-bs-target="#addIndicatorModal">
                            <i class="fas fa-plus me-1"></i> Agregar Indicadores
                        </button>
                        <button class="btn btn-success btn-sm" onclick="showFullIndicatorsHistory()">
                            <i class="fas fa-history me-1"></i> Ver Historial Completo
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <div class="alert alert-info d-flex align-items-center mb-3">
                        <i class="fas fa-info-circle me-2"></i>
                        Mostrando los últimos 2 registros de wearables y 2 de manuales
                    </div>
                    <div class="table-responsive" id="indicatorsTableWrapper">
                        <!-- La tabla se cargará aquí -->
                    </div>
                </div>
            `;
            tableContainer = indicatorsModule.querySelector('#indicatorsTableWrapper');
        }
    }
    
    if (indicators.length === 0) {
        tableContainer.innerHTML = `
            <div class="text-center p-4 text-muted">
                <i class="fas fa-chart-line fa-3x mb-3"></i>
                <p class="mb-0">No hay indicadores registrados para este paciente</p>
            </div>
        `;
        return;
    }
    
    // Obtener solo los últimos 2 registros de cada tipo
    const displayIndicators = getLatestIndicatorsByType();
    
    // Crear tabla organizada
    tableContainer.innerHTML = `
        <table class="table table-striped table-hover">
            <thead class="table-dark">
                <tr>
                    <th>Fecha Registro</th>
                    <th>Fuente</th>
                    <th>Presión Arterial</th>
                    <th>Glucosa (mg/dL)</th>
                    <th>Peso (kg)</th>
                    <th>Frec. Cardíaca</th>
                    <th>Estado Ánimo</th>
                    <th>Actividad Física</th>
                </tr>
            </thead>
            <tbody>
                ${displayIndicators.map(indicator => `
                    <tr>
                        <td>
                            <div class="fw-bold">${new Date(indicator.fecha_registro).toLocaleDateString()}</div>
                            <small class="text-muted">${new Date(indicator.fecha_registro).toLocaleTimeString()}</small>
                        </td>
                        <td>
                            <span class="badge ${indicator.fuente_dato === 'wearable' ? 'bg-success' : 'bg-info'}">
                                <i class="fas ${indicator.fuente_dato === 'wearable' ? 'fa-watch' : 'fa-edit'} me-1"></i>
                                ${indicator.fuente_dato === 'wearable' ? 'Wearable' : 'Manual'}
                            </span>
                        </td>
                        <td>
                            ${indicator.presion_sistolica && indicator.presion_diastolica ? 
                                `<div class="fw-bold">${indicator.presion_sistolica}/${indicator.presion_diastolica}</div>
                                 <small class="text-muted">mmHg</small>` : 
                                '<span class="text-muted">N/R</span>'}
                        </td>
                        <td>
                            ${indicator.glucosa ? 
                                `<div class="fw-bold">${indicator.glucosa}</div>
                                 <small class="text-muted">mg/dL</small>` : 
                                '<span class="text-muted">N/R</span>'}
                        </td>
                        <td>
                            ${indicator.peso ? 
                                `<div class="fw-bold">${indicator.peso}</div>
                                 <small class="text-muted">kg</small>` : 
                                '<span class="text-muted">N/R</span>'}
                        </td>
                        <td>
                            ${indicator.frecuencia_cardiaca ? 
                                `<div class="fw-bold">${indicator.frecuencia_cardiaca}</div>
                                 <small class="text-muted">lpm</small>` : 
                                '<span class="text-muted">N/R</span>'}
                        </td>
                        <td>
                            ${indicator.estado_animo ? 
                                `<span class="badge ${getMoodBadgeClass(indicator.estado_animo)}">
                                    ${indicator.estado_animo}
                                </span>` : 
                                '<span class="text-muted">N/R</span>'}
                        </td>
                        <td>
                            ${indicator.actividad_fisica ? 
                                `<span class="badge ${getActivityBadgeClass(indicator.actividad_fisica)}">
                                    ${indicator.actividad_fisica}
                                </span>` : 
                                '<span class="text-muted">N/R</span>'}
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        
        <!-- Información de resumen -->
        <div class="row mt-3">
            <div class="col-md-6">
                <div class="card bg-light">
                    <div class="card-body py-2">
                        <div class="row text-center">
                            <div class="col-4">
                                <div class="border rounded p-2 bg-success bg-opacity-10">
                                    <h6 class="text-success mb-0">${indicators.filter(i => i.fuente_dato === 'wearable').length}</h6>
                                    <small class="text-muted">Wearables</small>
                                </div>
                            </div>
                            <div class="col-4">
                                <div class="border rounded p-2 bg-info bg-opacity-10">
                                    <h6 class="text-info mb-0">${indicators.filter(i => i.fuente_dato === 'manual').length}</h6>
                                    <small class="text-muted">Manuales</small>
                                </div>
                            </div>
                            <div class="col-4">
                                <div class="border rounded p-2 bg-primary bg-opacity-10">
                                    <h6 class="text-primary mb-0">${indicators.length}</h6>
                                    <small class="text-muted">Total</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card bg-light">
                    <div class="card-body py-2">
                        <div class="small">
                            <p class="mb-1"><strong>Mostrando:</strong> 2 wearables + 2 manuales más recientes</p>
                            <p class="mb-0"><strong>Total en historial:</strong> ${indicators.length} registros</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Función auxiliar para obtener clases de badge según el estado de ánimo
function getMoodBadgeClass(mood) {
    const moodClasses = {
        'Excelente': 'bg-success',
        'Bueno': 'bg-primary',
        'Regular': 'bg-warning',
        'Malo': 'bg-danger',
        'Deprimido': 'bg-dark'
    };
    return moodClasses[mood] || 'bg-secondary';
}

// Función auxiliar para obtener clases de badge según la actividad física
function getActivityBadgeClass(activity) {
    const activityClasses = {
        'Sedentario': 'bg-secondary',
        'Ligera': 'bg-info',
        'Moderada': 'bg-primary',
        'Intensa': 'bg-warning',
        'Atlética': 'bg-success'
    };
    return activityClasses[activity] || 'bg-secondary';
}

// Variable global para almacenar el modal
let fullIndicatorsHistoryModal = null;

// Función para mostrar historial completo de indicadores en modal - CORREGIDA
async function showFullIndicatorsHistory() {
    const patientId = patientSelector.value;
    if (!patientId) {
        showNotification('Por favor seleccione un paciente primero', 'error');
        return;
    }

    try {
        // Obtener paciente para mostrar nombre
        const patient = patients.find(p => p.id_paciente == patientId);
        const patientName = patient ? patient.nombre : `Paciente ${patientId}`;

        // Cargar TODOS los indicadores del paciente
        const allIndicators = await apiRequest(`/indicadores-salud/paciente/${patientId}`);
        
        // Ordenar por fecha más reciente primero
        allIndicators.sort((a, b) => new Date(b.fecha_registro) - new Date(a.fecha_registro));

        console.log('📊 Mostrando historial completo:', allIndicators.length, 'registros');

        // Si el modal ya existe, removerlo
        const existingModal = document.getElementById('fullIndicatorsHistoryModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Crear modal para historial completo
        const modalHTML = `
            <div class="modal fade" id="fullIndicatorsHistoryModal" tabindex="-1" aria-labelledby="fullIndicatorsHistoryModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-xl">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="fullIndicatorsHistoryModalLabel">
                                <i class="fas fa-history me-2"></i>
                                Historial Completo de Indicadores - ${patientName}
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="alert alert-info d-flex align-items-center">
                                <i class="fas fa-info-circle me-2"></i>
                                Mostrando todos los ${allIndicators.length} registros del paciente
                            </div>
                            <div class="table-responsive">
                                <table class="table table-striped table-hover">
                                    <thead class="table-dark">
                                        <tr>
                                            <th>Fecha Registro</th>
                                            <th>Fuente</th>
                                            <th>Presión Arterial</th>
                                            <th>Glucosa (mg/dL)</th>
                                            <th>Peso (kg)</th>
                                            <th>Frec. Cardíaca</th>
                                            <th>Estado Ánimo</th>
                                            <th>Actividad Física</th>
                                        </tr>
                                    </thead>
                                    <tbody id="fullIndicatorsTableBody">
                                        ${allIndicators.map(indicator => `
                                            <tr>
                                                <td>
                                                    <div class="fw-bold">${new Date(indicator.fecha_registro).toLocaleDateString()}</div>
                                                    <small class="text-muted">${new Date(indicator.fecha_registro).toLocaleTimeString()}</small>
                                                </td>
                                                <td>
                                                    <span class="badge ${indicator.fuente_dato === 'wearable' ? 'bg-success' : 'bg-info'}">
                                                        <i class="fas ${indicator.fuente_dato === 'wearable' ? 'fa-watch' : 'fa-edit'} me-1"></i>
                                                        ${indicator.fuente_dato === 'wearable' ? 'Wearable' : 'Manual'}
                                                    </span>
                                                </td>
                                                <td>
                                                    ${indicator.presion_sistolica && indicator.presion_diastolica ? 
                                                        `<div class="fw-bold">${indicator.presion_sistolica}/${indicator.presion_diastolica}</div>
                                                         <small class="text-muted">mmHg</small>` : 
                                                        '<span class="text-muted">N/R</span>'}
                                                </td>
                                                <td>
                                                    ${indicator.glucosa ? 
                                                        `<div class="fw-bold">${indicator.glucosa}</div>
                                                         <small class="text-muted">mg/dL</small>` : 
                                                        '<span class="text-muted">N/R</span>'}
                                                </td>
                                                <td>
                                                    ${indicator.peso ? 
                                                        `<div class="fw-bold">${indicator.peso}</div>
                                                         <small class="text-muted">kg</small>` : 
                                                        '<span class="text-muted">N/R</span>'}
                                                </td>
                                                <td>
                                                    ${indicator.frecuencia_cardiaca ? 
                                                        `<div class="fw-bold">${indicator.frecuencia_cardiaca}</div>
                                                         <small class="text-muted">lpm</small>` : 
                                                        '<span class="text-muted">N/R</span>'}
                                                </td>
                                                <td>
                                                    ${indicator.estado_animo ? 
                                                        `<span class="badge ${getMoodBadgeClass(indicator.estado_animo)}">
                                                            ${indicator.estado_animo}
                                                        </span>` : 
                                                        '<span class="text-muted">N/R</span>'}
                                                </td>
                                                <td>
                                                    ${indicator.actividad_fisica ? 
                                                        `<span class="badge ${getActivityBadgeClass(indicator.actividad_fisica)}">
                                                            ${indicator.actividad_fisica}
                                                        </span>` : 
                                                        '<span class="text-muted">N/R</span>'}
                                                </td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                            <button type="button" class="btn btn-primary" onclick="generateIndicatorsPDF(${patientId})">
                                <i class="fas fa-file-pdf me-1"></i>Descargar PDF
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Agregar modal al DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Mostrar modal
        const modalElement = document.getElementById('fullIndicatorsHistoryModal');
        fullIndicatorsHistoryModal = new bootstrap.Modal(modalElement);
        fullIndicatorsHistoryModal.show();

        // Limpiar el modal cuando se cierre
        modalElement.addEventListener('hidden.bs.modal', function () {
            if (modalElement) {
                modalElement.remove();
                fullIndicatorsHistoryModal = null;
            }
        });

    } catch (error) {
        console.error('Error al mostrar historial completo:', error);
        showNotification('Error al cargar el historial completo', 'error');
    }
}

function clearIndicators() {
    latestIndicators.innerHTML = '<li class="list-group-item text-muted">Seleccione un paciente para ver sus indicadores</li>';
    
    // Limpiar tabla también
    const tableContainer = document.getElementById('indicatorsTableContainer');
    if (tableContainer) {
        tableContainer.innerHTML = `
            <div class="text-center p-4 text-muted">
                <i class="fas fa-chart-line fa-3x mb-3"></i>
                <p class="mb-0">Seleccione un paciente para ver sus indicadores</p>
            </div>
        `;
    }
}

// Función para generar PDF de indicadores - CON CUIDARTEK EN GRANDE
async function generateIndicatorsPDF(patientId) {
    try {
        const patient = patients.find(p => p.id_paciente == patientId);
        const patientName = patient ? patient.nombre : `Paciente ${patientId}`;
        
        // Cargar TODOS los indicadores para el PDF
        const allIndicators = await apiRequest(`/indicadores-salud/paciente/${patientId}`);
        allIndicators.sort((a, b) => new Date(b.fecha_registro) - new Date(a.fecha_registro));
        
        // Crear contenido del PDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Configuración de colores
        const primaryColor = [41, 128, 185]; // Azul profesional
        const secondaryColor = [52, 152, 219]; // Azul más claro
        const accentColor = [46, 204, 113]; // Verde para elementos positivos
        const headerColor = [241, 242, 246]; // Gris claro para headers
        
        // Encabezado - CUIDARTEK EN GRANDE
        doc.setFillColor(...primaryColor);
        doc.rect(0, 0, 210, 50, 'F');
        
        // LOGO CUIDARTEK EN GRANDE
        doc.setFontSize(28);
        doc.setTextColor(255, 255, 255);
        doc.setFont(undefined, 'bold');
        doc.text('CUIDARTEK', 105, 25, { align: 'center' });
        
        // Subtítulo
        doc.setFontSize(14);
        doc.setTextColor(255, 255, 255);
        doc.text('Sistema de Monitoreo de Salud', 105, 35, { align: 'center' });
        
        // Título principal del reporte
        doc.setFontSize(18);
        doc.text('REPORTE DE INDICADORES DE SALUD', 105, 50, { align: 'center' });
        
        // Información del paciente
        doc.setFillColor(240, 248, 255);
        doc.rect(10, 60, 190, 30, 'F');
        
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.setFont(undefined, 'bold');
        doc.text('INFORMACIÓN DEL PACIENTE:', 15, 70);
        
        doc.setFont(undefined, 'normal');
        doc.text(`Nombre: ${patientName}`, 15, 78);
        doc.text(`ID: ${patientId}`, 15, 85);
        doc.text(`Fecha de generación: ${new Date().toLocaleDateString('es-ES', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        })}`, 120, 78);
        
        // Estadísticas rápidas
        const totalRegistros = allIndicators.length;
        const wearables = allIndicators.filter(i => i.fuente_dato === 'wearable').length;
        const manuales = allIndicators.filter(i => i.fuente_dato === 'manual').length;
        
        doc.text(`Total de registros: ${totalRegistros}`, 120, 85);
        doc.text(`Wearables: ${wearables}`, 120, 92);
        doc.text(`Manuales: ${manuales}`, 120, 99);
        
        // Encabezados de la tabla
        let yPosition = 105;
        
        // Fondo del header de la tabla
        doc.setFillColor(...headerColor);
        doc.rect(10, yPosition, 190, 10, 'F');
        
        // Bordes del header
        doc.setDrawColor(200, 200, 200);
        doc.rect(10, yPosition, 190, 10);
        
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        doc.setFont(undefined, 'bold');
        
        // Encabezados de columnas
        doc.text('FECHA', 12, yPosition + 7);
        doc.text('FUENTE', 40, yPosition + 7);
        doc.text('PRESIÓN', 65, yPosition + 7);
        doc.text('GLUCOSA', 90, yPosition + 7);
        doc.text('PESO', 115, yPosition + 7);
        doc.text('F. CARDÍACA', 135, yPosition + 7);
        doc.text('ESTADO', 160, yPosition + 7);
        doc.text('ACTIVIDAD', 180, yPosition + 7);
        
        yPosition += 12;
        
        // Datos de la tabla
        doc.setFont(undefined, 'normal');
        doc.setFontSize(8);
        
        allIndicators.forEach((indicator, index) => {
            if (yPosition > 270) { // Nueva página si se llena
                doc.addPage();
                yPosition = 20;
                
                // Header en nueva página
                doc.setFillColor(...headerColor);
                doc.rect(10, yPosition, 190, 10, 'F');
                doc.rect(10, yPosition, 190, 10);
                
                doc.setFontSize(9);
                doc.setFont(undefined, 'bold');
                doc.text('FECHA', 12, yPosition + 7);
                doc.text('FUENTE', 40, yPosition + 7);
                doc.text('PRESIÓN', 65, yPosition + 7);
                doc.text('GLUCOSA', 90, yPosition + 7);
                doc.text('PESO', 115, yPosition + 7);
                doc.text('F. CARDÍACA', 135, yPosition + 7);
                doc.text('ESTADO', 160, yPosition + 7);
                doc.text('ACTIVIDAD', 180, yPosition + 7);
                
                yPosition += 12;
                doc.setFont(undefined, 'normal');
                doc.setFontSize(8);
            }
            
            // Alternar colores de fondo para filas
            if (index % 2 === 0) {
                doc.setFillColor(250, 250, 250);
                doc.rect(10, yPosition - 4, 190, 6, 'F');
            }
            
            // Borde de la fila
            doc.setDrawColor(240, 240, 240);
            doc.rect(10, yPosition - 4, 190, 6);
            
            // Fecha
            const fecha = new Date(indicator.fecha_registro).toLocaleDateString();
            doc.text(fecha, 12, yPosition);
            
            // Fuente con color
            if (indicator.fuente_dato === 'wearable') {
                doc.setTextColor(...accentColor);
            } else {
                doc.setTextColor(...secondaryColor);
            }
            doc.text(indicator.fuente_dato === 'wearable' ? 'W' : 'M', 44, yPosition);
            doc.setTextColor(0, 0, 0);
            
            // Presión arterial
            const presion = indicator.presion_sistolica && indicator.presion_diastolica ? 
                `${indicator.presion_sistolica}/${indicator.presion_diastolica}` : 'N/R';
            doc.text(presion, 67, yPosition);
            
            // Glucosa
            const glucosa = indicator.glucosa ? indicator.glucosa.toString() : 'N/R';
            doc.text(glucosa, 94, yPosition);
            
            // Peso
            const peso = indicator.peso ? indicator.peso.toString() : 'N/R';
            doc.text(peso, 118, yPosition);
            
            // Frecuencia cardíaca
            const fc = indicator.frecuencia_cardiaca ? indicator.frecuencia_cardiaca.toString() : 'N/R';
            doc.text(fc, 142, yPosition);
            
            // Estado de ánimo
            const animo = indicator.estado_animo ? indicator.estado_animo.charAt(0) : 'N/R';
            doc.text(animo, 164, yPosition);
            
            // Actividad física
            const actividad = indicator.actividad_fisica ? indicator.actividad_fisica.charAt(0) : 'N/R';
            doc.text(actividad, 184, yPosition);
            
            yPosition += 6;
        });
        
        // Resumen estadístico al final
        yPosition += 10;
        doc.setFontSize(10);
        doc.setTextColor(...primaryColor);
        doc.setFont(undefined, 'bold');
        doc.text('RESUMEN ESTADÍSTICO', 15, yPosition);
        
        yPosition += 6;
        doc.setFontSize(8);
        doc.setTextColor(0, 0, 0);
        doc.setFont(undefined, 'normal');
        
        // Calcular promedios
        const presionesSistolicas = allIndicators.filter(i => i.presion_sistolica).map(i => i.presion_sistolica);
        const presionesDiastolicas = allIndicators.filter(i => i.presion_diastolica).map(i => i.presion_diastolica);
        const glucosas = allIndicators.filter(i => i.glucosa).map(i => i.glucosa);
        const pesos = allIndicators.filter(i => i.peso).map(i => i.peso);
        const frecuencias = allIndicators.filter(i => i.frecuencia_cardiaca).map(i => i.frecuencia_cardiaca);
        
        const avgSistolica = presionesSistolicas.length ? (presionesSistolicas.reduce((a, b) => a + b) / presionesSistolicas.length).toFixed(1) : 'N/A';
        const avgDiastolica = presionesDiastolicas.length ? (presionesDiastolicas.reduce((a, b) => a + b) / presionesDiastolicas.length).toFixed(1) : 'N/A';
        const avgGlucosa = glucosas.length ? (glucosas.reduce((a, b) => a + b) / glucosas.length).toFixed(1) : 'N/A';
        const avgPeso = pesos.length ? (pesos.reduce((a, b) => a + b) / pesos.length).toFixed(1) : 'N/A';
        const avgFC = frecuencias.length ? (frecuencias.reduce((a, b) => a + b) / frecuencias.length).toFixed(1) : 'N/A';
        
        doc.text(`• Promedio presión arterial: ${avgSistolica}/${avgDiastolica} mmHg`, 20, yPosition);
        yPosition += 4;
        doc.text(`• Promedio glucosa: ${avgGlucosa} mg/dL`, 20, yPosition);
        yPosition += 4;
        doc.text(`• Promedio peso: ${avgPeso} kg`, 20, yPosition);
        yPosition += 4;
        doc.text(`• Promedio frecuencia cardíaca: ${avgFC} lpm`, 20, yPosition);
        yPosition += 4;
        doc.text(`• Total de registros: ${totalRegistros}`, 20, yPosition);
        yPosition += 4;
        doc.text(`• Registros wearables: ${wearables}`, 20, yPosition);
        yPosition += 4;
        doc.text(`• Registros manuales: ${manuales}`, 20, yPosition);
        
        // Añadir leyenda
        yPosition += 8;
        doc.setFontSize(7);
        doc.setTextColor(100, 100, 100);
        doc.text('Leyenda: W = Wearable, M = Manual, N/R = No registrado', 15, yPosition);
        yPosition += 3;
        doc.text('Abreviaturas: Excelente(E), Bueno(B), Regular(R), Malo(M), Deprimido(D)', 15, yPosition);
        yPosition += 3;
        doc.text('Actividad: Sedentario(S), Ligera(L), Moderada(M), Intensa(I), Atlética(A)', 15, yPosition);
        
        // Pie de página
        const pageCount = doc.internal.getNumberOfPages();
        for(let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(100, 100, 100);
            doc.text(`Página ${i} de ${pageCount}`, 105, 285, { align: 'center' });
            doc.text('Generado por CuidarTek - Bienestar Digital', 105, 290, { align: 'center' });
        }
        
        // Guardar PDF
        const fileName = `Reporte_Indicadores_${patientName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
        
        showNotification('✅ PDF generado exitosamente', 'success');
        
    } catch (error) {
        console.error('Error generando PDF:', error);
        showNotification('❌ Error al generar el PDF', 'error');
    }
}

// Función para agregar botón de PDF a los indicadores
function addPDFButtonToIndicators() {
    const indicatorsModule = document.getElementById('indicatorsModule');
    if (!indicatorsModule) return;
    
    // Buscar si ya existe el botón de PDF
    let pdfButton = indicatorsModule.querySelector('#downloadPDFBtn');
    
    if (!pdfButton && patientSelector.value) {
        // Crear botón de PDF
        pdfButton = document.createElement('button');
        pdfButton.id = 'downloadPDFBtn';
        pdfButton.className = 'btn btn-success btn-sm ms-2';
        pdfButton.innerHTML = '<i class="fas fa-file-pdf me-1"></i>Descargar PDF';
        pdfButton.onclick = () => generateIndicatorsPDF(patientSelector.value);
        
        // Agregar el botón al header de la tabla
        const cardHeader = indicatorsModule.querySelector('.card-header');
        if (cardHeader) {
            const existingButtons = cardHeader.querySelector('.btn-group');
            if (existingButtons) {
                existingButtons.appendChild(pdfButton);
            } else {
                cardHeader.querySelector('.d-flex').appendChild(pdfButton);
            }
        }
    }
}