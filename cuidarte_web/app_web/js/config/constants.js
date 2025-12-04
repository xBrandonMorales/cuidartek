// Configuración de la API
const API_BASE_URL = 'https://cuidartekapi-production.up.railway.app';

// Estado global (se inicializa en app.js)
let authToken = '';
let currentUser = null;
let currentModule = 'patients';
let patients = [];
let indicators = [];
let reports = [];
let chats = [];
let myPatients = [];
let isAdmin = false;
let healthChart = null;

// Flags para control de botones PDF
let pdfButtonsAdded = {
    reportsTable: false,
    indicatorsModule: false
};