const APP_CONFIG = {

    API_BASE_URL: 'http://10.0.10.17:5000',
    //API_BASE_URL: 'https://sendd.altersoft.dev.br',
    API_ENDPOINTS: {
        LOGIN: '/public/login',
        REGISTER: '/public/cadastro',
        
        USERS: '/private/users',
        ADMIN_STATS: '/private/stats',
        
        UPDATE_USER: '/private/users',
        
        SYSTEM_CONFIG: '/private/system-config',
        
    }
};

// Função para construir URLs da API
function buildApiUrl(endpoint) {
    return `${APP_CONFIG.API_BASE_URL}${endpoint}`;
}

// Tornar disponível globalmente
window.APP_CONFIG = APP_CONFIG;
window.buildApiUrl = buildApiUrl;