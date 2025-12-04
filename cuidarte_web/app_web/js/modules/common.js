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
        communication: 'Comunicación con Pacientes',
        reports: 'Reportes Médicos'
    };
    moduleTitle.textContent = titles[module];

    if (module === 'indicators') {
        loadPatientSelector();
    } else if (module === 'communication') {
        loadChats();
    } else if (module === 'reports') {
        loadReports();
    }
    
    // Resetear flags de PDF al cambiar módulo
    resetPDFButtonsFlags();
}

// Función para resetear los flags cuando se cambia de módulo
function resetPDFButtonsFlags() {
    pdfButtonsAdded.reportsTable = false;
    pdfButtonsAdded.indicatorsModule = false;
}