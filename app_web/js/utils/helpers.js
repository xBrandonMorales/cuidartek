// Funciones helper para manejar diferentes estructuras de datos

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