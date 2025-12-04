// Funciones de autenticación - VERSIÓN CORREGIDA
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
}

function logout() {
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
}

// Función para registrar nuevo médico con parámetros en query string
async function registerMedico(medicoData) {
    try {
        console.log('📝 Iniciando registro de médico:', medicoData);

        // Construir la URL con los parámetros en query string
        const queryParams = new URLSearchParams({
            nombre: medicoData.nombre,
            rol: "medico"
        }).toString();

        const url = `${API_BASE_URL}/auth/register?${queryParams}`;

        console.log('🔗 URL de registro:', url);

        // USAR EL ENDPOINT CON PARÁMETROS EN QUERY STRING
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                correo: medicoData.correo,
                password: medicoData.password
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error ${response.status}: ${errorText}`);
        }

        const usuarioCreado = await response.json();
        console.log('✅ Usuario médico registrado exitosamente:', usuarioCreado);

        // Intentar crear el perfil médico SOLO si existe el endpoint /medicos
        try {
            console.log('🔄 Intentando crear perfil médico...');
            const medicoResponse = await apiRequest('/medicos', {
                method: 'POST',
                body: JSON.stringify({
                    especialidad: medicoData.especialidad || "General",
                    cedula_profesional: medicoData.cedula_profesional || "Pendiente",
                    telefono_consultorio: medicoData.telefono_consultorio || "",
                    direccion_consultorio: medicoData.direccion_consultorio || "",
                    horario_consultorio: medicoData.horario_consultorio || "Lunes a Viernes 9:00-18:00",
                    anos_experiencia: medicoData.anos_experiencia || 0,
                    universidad: medicoData.universidad || "",
                    id_usuario: usuarioCreado.id_usuario || usuarioCreado.id || usuarioCreado.user_id
                })
            });

            console.log('✅ Perfil médico creado exitosamente:', medicoResponse);
            return {
                ...usuarioCreado,
                perfil_medico: medicoResponse
            };

        } catch (medicoError) {
            console.log('⚠️ No se pudo crear perfil médico, pero el usuario fue registrado:', medicoError.message);
            return usuarioCreado;
        }

    } catch (error) {
        console.error('❌ Error en registro de médico:', error);
        throw error;
    }
}

// Función para manejar el registro desde el formulario - CORREGIDA
async function handleRegister(event) {
    event.preventDefault();
    
    const registerError = document.getElementById('registerError');
    const registerSuccess = document.getElementById('registerSuccess');
    
    // Ocultar mensajes anteriores
    if (registerError) registerError.classList.add('d-none');
    if (registerSuccess) registerSuccess.classList.add('d-none');
    
    try {
        // Obtener elementos del formulario de registro CON VERIFICACIÓN
        const nombreInput = document.getElementById('registerNombre');
        const emailInput = document.getElementById('registerEmail');
        const passwordInput = document.getElementById('registerPassword');
        const confirmPasswordInput = document.getElementById('registerConfirmPassword');
        const especialidadInput = document.getElementById('registerEspecialidad');
        const telefonoInput = document.getElementById('registerTelefono');
        const universidadInput = document.getElementById('registerUniversidad');
        const direccionInput = document.getElementById('registerDireccion');
        const termsCheckbox = document.getElementById('registerTerms');
        
        // VERIFICAR QUE TODOS LOS ELEMENTOS EXISTAN
        if (!nombreInput || !emailInput || !passwordInput || !confirmPasswordInput || 
            !especialidadInput || !telefonoInput || !universidadInput || !direccionInput || 
            !termsCheckbox) {
            console.error('❌ Error: No se encontraron todos los elementos del formulario');
            showRegisterError('Error en el formulario. Por favor, recargue la página.');
            return;
        }
        
        // Obtener valores
        const nombre = nombreInput.value.trim();
        const correo = emailInput.value.trim();
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        const especialidad = especialidadInput.value.trim();
        const telefono = telefonoInput.value.trim();
        const universidad = universidadInput.value.trim();
        const direccion = direccionInput.value.trim();
        const termsAccepted = termsCheckbox.checked;
        
        // Validaciones básicas
        if (!nombre || !correo || !password) {
            showRegisterError('Nombre, correo y contraseña son obligatorios');
            return;
        }
        
        if (password !== confirmPassword) {
            showRegisterError('Las contraseñas no coinciden');
            return;
        }
        
        if (password.length < 6) {
            showRegisterError('La contraseña debe tener al menos 6 caracteres');
            return;
        }
        
        if (!correo.includes('@')) {
            showRegisterError('Por favor ingresa un correo electrónico válido');
            return;
        }
        
        if (!termsAccepted) {
            showRegisterError('Debes aceptar los términos y condiciones');
            return;
        }
        
        // Preparar datos para el registro
        const medicoData = {
            nombre: nombre,
            correo: correo,
            password: password,
            rol: "medico",
            especialidad: especialidad || "General",
            cedula_profesional: "Pendiente", // Valor por defecto ya que no hay campo en el formulario
            telefono_consultorio: telefono || "",
            direccion_consultorio: direccion || "",
            horario_consultorio: "Lunes a Viernes 9:00-18:00",
            anos_experiencia: 0,
            universidad: universidad || ""
        };
        
        // Mostrar loading
        const submitBtn = event.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Registrando...';
        submitBtn.disabled = true;
        
        // Llamar a la función de registro
        const result = await registerMedico(medicoData);
        
        // Mostrar éxito
        showRegisterSuccess('¡Registro exitoso! Tu cuenta de médico ha sido creada. Ahora puedes iniciar sesión.');
        
        // Limpiar formulario
        document.getElementById('registerForm').reset();
        
        // Cambiar a la pestaña de login después de 3 segundos
        setTimeout(() => {
            const loginTab = document.getElementById('login-tab');
            if (loginTab) {
                loginTab.click();
            }
            
            // Pre-llenar el email en el login
            const emailLoginInput = document.getElementById('email');
            if (emailLoginInput) {
                emailLoginInput.value = correo;
            }
            
            const passwordLoginInput = document.getElementById('password');
            if (passwordLoginInput) {
                passwordLoginInput.focus();
            }
        }, 3000);
        
    } catch (error) {
        console.error('❌ Error en registro:', error);
        
        // Mostrar error específico
        let mensajeError = 'Error en el registro. Intente nuevamente.';
        
        if (error.message.includes('409') || error.message.includes('duplicate')) {
            mensajeError = 'El correo electrónico ya está registrado.';
        } else if (error.message.includes('400')) {
            mensajeError = 'Datos inválidos. Verifica la información.';
        } else if (error.message.includes('500')) {
            mensajeError = 'Error del servidor. Intente más tarde.';
        } else if (error.message.includes('405')) {
            mensajeError = 'Método no permitido. Contacta al administrador.';
        } else if (error.message.includes('422')) {
            mensajeError = 'Datos faltantes. Verifica que todos los campos estén completos.';
        } else {
            mensajeError = error.message || 'Error en el registro. Intente nuevamente.';
        }
        
        showRegisterError(mensajeError);
    } finally {
        // Restaurar botón
        const submitBtn = event.target.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.innerHTML = 'Registrarse como Médico';
            submitBtn.disabled = false;
        }
    }
}

// Función para mostrar error en registro
function showRegisterError(message) {
    const registerError = document.getElementById('registerError');
    if (registerError) {
        registerError.textContent = message;
        registerError.classList.remove('d-none');
    }
}

// Función para mostrar éxito en registro
function showRegisterSuccess(message) {
    const registerSuccess = document.getElementById('registerSuccess');
    if (registerSuccess) {
        registerSuccess.textContent = message;
        registerSuccess.classList.remove('d-none');
    }
}

// Inicializar event listener para el formulario de registro
function initializeRegisterForm() {
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
}

// Agregar validación en tiempo real para todos los campos
function initializeFormValidations() {
    const passwordInput = document.getElementById('registerPassword');
    const confirmPasswordInput = document.getElementById('registerConfirmPassword');
    const emailInput = document.getElementById('registerEmail');
    const nombreInput = document.getElementById('registerNombre');
    
    // Validación de confirmación de contraseña
    if (passwordInput && confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', function() {
            const password = passwordInput.value;
            const confirmPassword = this.value;
            
            if (confirmPassword && password !== confirmPassword) {
                this.classList.add('is-invalid');
                this.classList.remove('is-valid');
                showFieldError(this, 'Las contraseñas no coinciden');
            } else if (confirmPassword) {
                this.classList.add('is-valid');
                this.classList.remove('is-invalid');
                clearFieldError(this);
            } else {
                this.classList.remove('is-valid', 'is-invalid');
                clearFieldError(this);
            }
        });
    }
    
    // Validación de email
    if (emailInput) {
        emailInput.addEventListener('blur', function() {
            const email = this.value.trim();
            if (email && !email.includes('@')) {
                this.classList.add('is-invalid');
                showFieldError(this, 'Ingresa un correo electrónico válido');
            } else if (email) {
                this.classList.add('is-valid');
                this.classList.remove('is-invalid');
                clearFieldError(this);
            }
        });
    }
    
    // Validación de nombre
    if (nombreInput) {
        nombreInput.addEventListener('blur', function() {
            const nombre = this.value.trim();
            if (nombre && nombre.length < 2) {
                this.classList.add('is-invalid');
                showFieldError(this, 'El nombre debe tener al menos 2 caracteres');
            } else if (nombre) {
                this.classList.add('is-valid');
                this.classList.remove('is-invalid');
                clearFieldError(this);
            }
        });
    }
}

// Función para mostrar errores de campo específico
function showFieldError(field, message) {
    let errorElement = field.parentNode.querySelector('.field-error');
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.className = 'field-error invalid-feedback';
        field.parentNode.appendChild(errorElement);
    }
    errorElement.textContent = message;
    errorElement.style.display = 'block';
}

function clearFieldError(field) {
    const errorElement = field.parentNode.querySelector('.field-error');
    if (errorElement) {
        errorElement.style.display = 'none';
    }
}

// Función para manejar errores específicos de la API
function manejarErrorAPI(error) {
    console.error('🔧 Detalles del error:', error);
    
    if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
        return 'Error de conexión. Verifica tu internet.';
    }
    
    if (error.message.includes('409')) {
        return 'El correo electrónico ya está registrado.';
    }
    
    if (error.message.includes('400')) {
        return 'Datos inválidos. Verifica que todos los campos sean correctos.';
    }
    
    if (error.message.includes('500')) {
        return 'Error del servidor. Por favor, intenta más tarde.';
    }
    
    return error.message || 'Error desconocido. Intenta nuevamente.';
}

// Al final del archivo, asegurar que las funciones estén disponibles
window.handleRegister = handleRegister;
window.initializeRegisterForm = initializeRegisterForm;
window.initializeFormValidations = initializeFormValidations;d