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


/// nuevoooo

function renderReportsTable() {
    reportsTableBody.innerHTML = '';
    
    const patientFilter = reportPatientFilter.value;
    
    // Filtrar reportes si se seleccionó un paciente
    let filteredReports = reports;
    if (patientFilter) {
        filteredReports = reports.filter(report => report.id_paciente == patientFilter);
    }
    
    // ORDENAR POR FECHA MÁS RECIENTE PRIMERO
    filteredReports.sort((a, b) => new Date(b.fecha_reporte) - new Date(a.fecha_reporte));
    
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
        
        // Formatear fecha completa
        const fechaCompleta = new Date(report.fecha_reporte).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
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
                <br>
                <small class="text-muted">ID: ${report.id_paciente}</small>
            </td>
            <td>
                ${fechaCompleta}
                <br>
                <small class="text-muted">Reporte ID: ${report.id_reporte}</small>
            </td>
            <td>${diagnosticoCorto}</td>
            <td>${recomendacionesCorto}</td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" onclick="viewReport(${report.id_reporte})" title="Ver reporte">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-outline-secondary" onclick="editReport(${report.id_reporte})" title="Editar reporte">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-outline-danger" onclick="deleteReport(${report.id_reporte})" title="Eliminar reporte">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        reportsTableBody.appendChild(row);
    });
    
    // Agregar botones de PDF después de renderizar la tabla
    setTimeout(() => {
        addPDFButtonsToReports();
    }, 100);
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
    
    // Agregar botón de PDF en el footer del modal (solo en modo vista)
    if (!isEditMode) {
        setTimeout(() => {
            const existingPdfButton = modalFooter.querySelector('.btn-pdf-modal');
            if (!existingPdfButton) {
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
    }
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