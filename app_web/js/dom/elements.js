// Elementos DOM
const loginScreen = document.getElementById('loginScreen');
const app = document.getElementById('app');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');
const refreshBtn = document.getElementById('refreshBtn');
const moduleLinks = document.querySelectorAll('[data-module]');
const moduleContents = document.querySelectorAll('.module-content');
const moduleTitle = document.getElementById('moduleTitle');
const userName = document.getElementById('userName');

// Elementos del módulo de pacientes
const patientsModule = document.getElementById('patientsModule');
const totalPatients = document.getElementById('totalPatients');
const activePatients = document.getElementById('activePatients');
const totalMedications = document.getElementById('totalMedications');
const totalConditions = document.getElementById('totalConditions');
const patientsTableBody = document.getElementById('patientsTableBody');
const myPatientsTableBody = document.getElementById('myPatientsTableBody');
const myPatientsCount = document.getElementById('myPatientsCount');

// Elementos del módulo de indicadores
const indicatorsModule = document.getElementById('indicatorsModule');
const patientSelector = document.getElementById('patientSelector');
const latestIndicators = document.getElementById('latestIndicators');

// Elementos del módulo de comunicación
const communicationModule = document.getElementById('communicationModule');
const chatList = document.getElementById('chatList');
const chatTitle = document.getElementById('chatTitle');
const chatMessages = document.getElementById('chatMessages');
const messageInput = document.getElementById('messageInput');
const sendMessageBtn = document.getElementById('sendMessageBtn');

// Elementos del módulo de reportes
const reportsModule = document.getElementById('reportsModule');
const reportsTableBody = document.getElementById('reportsTableBody');
const reportPatientFilter = document.getElementById('reportPatientFilter');