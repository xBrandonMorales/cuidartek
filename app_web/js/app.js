// Archivo principal de la aplicación - Inicialización

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar event listeners
    initializeEventListeners();
    
    // Por defecto, mostrar login
    console.log('🚀 Aplicación CuidarTek inicializada');
});

function initializeEventListeners() {
    // Login
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        login(email, password);
    });

    // Logout
    logoutBtn.addEventListener('click', logout);

    // Refresh
    refreshBtn.addEventListener('click', function() {
        if (currentModule === 'patients') {
            loadPatients();
        } else if (currentModule === 'indicators') {
            if (patientSelector.value) {
                loadPatientIndicators(patientSelector.value);
            }
        } else if (currentModule === 'reports') {
            loadReports();
        } else if (currentModule === 'communication') {
            if (typeof loadChats === 'function') {
                loadChats();
            }
        }
    });

    // Navegación entre módulos
    moduleLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const module = this.getAttribute('data-module');
            switchModule(module);
        });
    });

    // Comunicación
    if (sendMessageBtn) {
        sendMessageBtn.addEventListener('click', sendMessage);
    }
    if (messageInput) {
        messageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }

    // Inicializar sistema de búsqueda
    initializeSearch();

    // ✅ NUEVO: Inicializar formulario de registro
    if (typeof initializeRegisterForm === 'function') {
        initializeRegisterForm();
    }
    if (typeof initializePasswordValidation === 'function') {
        initializePasswordValidation();
    }
}

// Función para manejar el refresh global
function handleGlobalRefresh() {
    if (currentModule === 'patients') {
        loadPatients();
    } else if (currentModule === 'indicators') {
        if (patientSelector.value) {
            loadPatientIndicators(patientSelector.value);
        }
    } else if (currentModule === 'reports') {
        loadReports();
    } else if (currentModule === 'communication') {
        if (typeof loadChats === 'function') {
            loadChats();
        }
    }
}

// En la función switchModule, agrega limpieza de búsqueda: (CÓDIGO AGREGADO)
const originalSwitchModule = switchModule;
switchModule = function(module) {
    originalSwitchModule(module);
    
    // Limpiar recursos del módulo de comunicación al cambiar
    if (module !== 'communication') {
        if (typeof cleanupChats === 'function') {
            cleanupChats();
        }
    } else {
        // Inicializar módulo de comunicación cuando se active
        setTimeout(() => {
            if (typeof initializeCommunicationModule === 'function') {
                initializeCommunicationModule();
            } else if (typeof loadChats === 'function') {
                loadChats();
            }
        }, 100);
    }
    
    // Limpiar búsqueda al cambiar de módulo
    clearSearch();
    
    resetPDFButtonsFlags();
};

// Exportar funciones globales para que estén disponibles en el HTML
window.viewPatient = viewPatient;
window.editPatient = editPatient;
window.deletePatient = deletePatient;
window.updatePatient = updatePatient;
window.addIndicator = addIndicator;
window.addReport = addReport;
window.viewReport = viewReport;
window.editReport = editReport;
window.updateReport = updateReport;
window.deleteReport = deleteReport;
window.sendMessage = sendMessage;
window.generateReportPDF = generateReportPDF;
window.generateIndicatorsPDF = generateIndicatorsPDF;

// Funciones de administración
window.addUser = addUser;
window.addDoctor = addDoctor;
window.editUser = editUser;
window.updateUser = updateUser;
window.toggleUserStatus = toggleUserStatus;
window.deleteUser = deleteUser;
window.deleteDoctor = deleteDoctor;
window.deletePatientAdmin = deletePatientAdmin;
window.editPatientAdmin = editPatientAdmin;

// Exportar función de inicialización del módulo de comunicación
window.initializeCommunicationModule = function() {
    if (typeof loadChats === 'function') {
        loadChats();
    }
};

console.log('✅ Aplicación CuidarTek cargada correctamente');