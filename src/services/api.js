import axios from 'axios';
import 'nprogress/nprogress.css';
import NProgress from 'nprogress';

// Configuração opcional do NProgress (sem spinner)
NProgress.configure({ showSpinner: false });

// Função para obter configuração dinamicamente
const getConfig = () => {
  return window.APP_CONFIG || {
    API_BASE_URL: 'https://api.sendd.altersoft.dev.br',
    API_ENDPOINTS: {
      LOGIN: '/public/login',
      REGISTER: '/public/cadastro',

      UPLOAD_AVATAR: '/private/upload-avatar',
      UPDATE_PROFILE: '/private/profile',

      PROFILE: '/private/profile',
      USERS: '/private/users',
      ADMIN_STATS: '/private/stats',

      SYSTEM_CONFIG: '/private/system-config',

    }
  };
};

export const getApiBaseUrl = () => {
  const config = getConfig();

  // CRITICAL FIX: Sempre usar caminho relativo em DEV para forçar o uso do Proxy do Vite.
  // Isso ignora qualquer VITE_API_URL que possa estar apontando para 'localhost' (que falha no celular).
  if (import.meta.env.DEV) {
    return '';
  }

  return import.meta.env.VITE_API_URL || config.API_BASE_URL || 'https://api.sendd.altersoft.dev.br';
};

// Criar instância do axios
const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token de autenticação e Loading Bar
api.interceptors.request.use(
  (config) => {
    NProgress.start();
    const token = localStorage.getItem('vixplay_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    NProgress.done();
    return Promise.reject(error);
  }
);
// Adicionar interceptor de resposta para parar barra
api.interceptors.response.use(
  (response) => {
    NProgress.done();
    return response;
  },
  (error) => {
    NProgress.done();
    return Promise.reject(error);
  }
);


// Interceptor para tratar respostas
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      const isAuthFlow = url === '/public/login' || url === '/public/cadastro';
      // Não redirecionar automaticamente em 401 durante login/cadastro
      if (!isAuthFlow) {
        localStorage.removeItem('vixplay_token');
        localStorage.removeItem('vixplay_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Funções de API baseadas nos endpoints do config.js
export const apiService = {
  // Generic HTTP methods
  get: (url, config) => api.get(url, config),
  post: (url, data, config) => api.post(url, data, config),
  put: (url, data, config) => api.put(url, data, config),
  delete: (url, config) => api.delete(url, config),
  patch: (url, data, config) => api.patch(url, data, config),

  // Autenticação
  login: (credentials) => api.post(getConfig().API_ENDPOINTS.LOGIN, credentials),
  register: (userData) => api.post(getConfig().API_ENDPOINTS.REGISTER, userData),



  // Clientes
  getClients: (params) => api.get('/private/clients', { params }),
  getClient: (id) => api.get(`/private/clients/${id}`),
  createClient: (data) => api.post('/private/clients', data),
  updateClient: (id, data) => api.put(`/private/clients/${id}`, data),
  deleteClient: (id) => api.delete(`/private/clients/${id}`),
  toggleClientActive: (id) => api.patch(`/private/clients/${id}/toggle-active`),
  addClientContract: (id, data) => api.post(`/private/clients/${id}/contracts`, data),
  deleteClientContract: (id, contractId) => api.delete(`/private/clients/${id}/contracts/${contractId}`),

  // Notificações
  saveNotification: (data) => api.post('/private/notifications', data),
  getNotifications: (params) => api.get('/private/notifications', { params }),

  // Mídias
  getMedias: (params) => api.get('/private/media', { params }),
  uploadMedia: (formData) => api.post('/private/media', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateMedia: (id, data) => api.put(`/private/media/${id}`, data),
  deleteMedia: (id) => api.delete(`/private/media/${id}`),

  // Templates
  getTemplates: (params) => api.get('/private/templates', { params }),
  getAllTemplates: () => api.get('/private/templates/all'),
  createTemplate: (data) => api.post('/private/templates', data),
  updateTemplate: (id, data) => api.put(`/private/templates/${id}`, data),
  deleteTemplate: (id) => api.delete(`/private/templates/${id}`),

  // Chat Client Info
  getChatClientInfo: (chatId) => api.get(`/private/chats/${chatId}/client-info`),
  linkClientToChat: (chatId, clientId) => api.post(`/private/chats/${chatId}/link-client`, { clientId }),
  syncClientForChat: (chatId) => api.post(`/private/chats/${chatId}/sync-client`),
  sendMessageManual: (chatId, data) => api.post(`/private/chats/${chatId}/send-message`, data),
  performUnlock: (chatId, contractId) => api.post(`/private/chats/${chatId}/unlock`, { contractId }),

  // Ticket / Chamados
  getTicketSubjects: (chatId) => api.get(`/private/chats/${chatId}/ticket-subjects`),
  createTicket: (chatId, data) => api.post(`/private/chats/${chatId}/ticket`, data),
  getTickets: (chatId, contractId) => api.post(`/private/chats/${chatId}/tickets`, { contractId }),
  checkConnection: (data) => api.post('/private/integrations/check-connection', data),
  getIntegrations: (params) => api.get('/private/integrations', { params }),
  createExternalInvoice: (data) => api.post('/private/integrations/create-invoice', data),

  // Campanhas
  getCampaigns: (params) => api.get('/private/campaigns', { params }),
  getCampaign: (id) => api.get(`/private/campaigns/${id}`),
  createCampaign: (data) => api.post('/private/campaigns', data),
  updateCampaign: (id, data) => api.put(`/private/campaigns/${id}`, data),
  deleteCampaign: (id) => api.delete(`/private/campaigns/${id}`),

  // Instâncias
  getInstances: () => api.get('/private/instance'),
  getInstance: (id) => api.get(`/private/instance/${id}`),
  createInstance: (data) => api.post('/private/instance', data),
  updateInstance: (id, data) => api.put(`/private/instance/${id}`, data),
  deleteInstance: (id) => api.delete(`/private/instance/${id}`),


  // Perfil
  getProfile: () => api.get(getConfig().API_ENDPOINTS.PROFILE),
  updateProfile: (formData) => {
    return api.put(getConfig().API_ENDPOINTS.UPDATE_PROFILE, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Avatar Upload
  uploadAvatar: (formData) => {
    // Não definir Content-Type manualmente; deixar o axios setar boundary corretamente
    return api.post(getConfig().API_ENDPOINTS.UPLOAD_AVATAR, formData);
  },

  // Admin - Users
  getUsers: () => api.get(getConfig().API_ENDPOINTS.USERS),
  getUser: (id) => api.get(`${getConfig().API_ENDPOINTS.USERS}/${id}`),
  syncIntegration: (id) => api.post(`/private/integrations/${id}/sync`),
  updateUser: (id, data) => api.put(`${getConfig().API_ENDPOINTS.UPDATE_USER}/${id}`, data),
  deleteUser: (id) => api.delete(`${getConfig().API_ENDPOINTS.USERS}/${id}`),

  // Admin - Stats
  getAdminStats: () => api.get(getConfig().API_ENDPOINTS.ADMIN_STATS),
  testBlockOverdueUsers: () => api.post(getConfig().API_ENDPOINTS.TEST_BLOCK_OVERDUE_USERS),

  // Contact
  sendContact: (data) => api.post(getConfig().API_ENDPOINTS.CONTACT, data),

  // System Config
  getSystemConfig: () => api.get(getConfig().API_ENDPOINTS.SYSTEM_CONFIG || '/private/system-config'),


  // Manual Notifications
  getNotifications: (params) => api.get('/private/notifications', { params }),
  getNotification: (id) => api.get(`/private/notifications/${id}`),
  createNotification: (data) => api.post('/private/notifications', data, {
    // Não definir Content-Type manualmente; deixar o axios setar boundary corretamente
  }),
  updateNotification: (id, data) => api.put(`/private/notifications/${id}`, data, {
    // Não definir Content-Type manualmente; deixar o axios setar boundary corretamente
  }),
  deleteNotification: (id) => api.delete(`/private/notifications/${id}`),
  updateNotificationStatus: (id, data) => api.patch(`/private/notifications/${id}/status`, data),

  // Leads
  importLeads: (formData) => api.post('/private/leads/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getLeads: (params) => api.get('/private/leads', { params }),
  createLead: (data) => api.post('/private/leads', data),
  updateLead: (id, data) => api.put(`/private/leads/${id}`, data),
  deleteLead: (id) => api.delete(`/private/leads/${id}`),
};

export default api;