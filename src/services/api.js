import axios from 'axios';

// Função para obter configuração dinamicamente
const getConfig = () => {
  return window.APP_CONFIG || {
    API_BASE_URL: 'https://sendd.altersoft.dev.br',
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

// Criar instância do axios
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://sendd.altersoft.dev.br',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token de autenticação
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('vixplay_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
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
      // Token expirado ou inválido
      localStorage.removeItem('vixplay_token');
      localStorage.removeItem('vixplay_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Funções de API baseadas nos endpoints do config.js
export const apiService = {
  // Generic HTTP methods
  get: (url) => api.get(url),
  post: (url, data) => api.post(url, data),
  put: (url, data) => api.put(url, data),
  delete: (url) => api.delete(url),
  
  // Autenticação
  login: (credentials) => api.post(getConfig().API_ENDPOINTS.LOGIN, credentials),
  register: (userData) => api.post(getConfig().API_ENDPOINTS.REGISTER, userData),
  
  
  
  // Clients
  getClients: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`${getConfig().API_ENDPOINTS.CLIENTS || '/private/clients'}${queryString ? `?${queryString}` : ''}`);
  },
  getClient: (id) => api.get(`${getConfig().API_ENDPOINTS.CLIENTS || '/private/clients'}/${id}`),
  createClient: (data) => api.post(getConfig().API_ENDPOINTS.CLIENTS || '/private/clients', data),
  updateClient: (id, data) => api.put(`${getConfig().API_ENDPOINTS.CLIENTS || '/private/clients'}/${id}`, data),
  deleteClient: (id) => api.delete(`${getConfig().API_ENDPOINTS.CLIENTS || '/private/clients'}/${id}`),
  toggleClientActive: (id) => api.patch(`${getConfig().API_ENDPOINTS.CLIENTS || '/private/clients'}/${id}/toggle-active`),
  
 
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
    return api.post(getConfig().API_ENDPOINTS.UPLOAD_AVATAR, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  // Admin - Users
  getUsers: () => api.get(getConfig().API_ENDPOINTS.USERS),
  getUser: (id) => api.get(`${getConfig().API_ENDPOINTS.USERS}/${id}`),
  createUser: (data) => api.post(getConfig().API_ENDPOINTS.USERS, data),
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
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  updateNotification: (id, data) => api.put(`/private/notifications/${id}`, data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  deleteNotification: (id) => api.delete(`/private/notifications/${id}`),
  updateNotificationStatus: (id, data) => api.patch(`/private/notifications/${id}/status`, data),
};

export default api;