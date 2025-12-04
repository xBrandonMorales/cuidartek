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