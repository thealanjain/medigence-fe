import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

// ─── Request Interceptor: Attach JWT ──────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('medigence_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor: Handle auth errors ─────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid → clear and redirect
      if (typeof window !== 'undefined') {
        localStorage.removeItem('medigence_token');
        localStorage.removeItem('medigence_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

// ─── Onboarding ───────────────────────────────────────────────────────────────
export const onboardingAPI = {
  getDraft: () => api.get('/onboarding/draft'),
  saveStep1: (data) => api.post('/onboarding/step-1', data),
  saveStep2: (data) => api.post('/onboarding/step-2', data),
  saveStep3: (data) => api.post('/onboarding/step-3', data),
  submit: () => api.post('/onboarding/submit'),
};

// ─── Doctors ──────────────────────────────────────────────────────────────────
export const doctorsAPI = {
  getAll: () => api.get('/doctors'),
  getById: (id) => api.get(`/doctors/${id}`),
};

// ─── Chats ────────────────────────────────────────────────────────────────────
export const chatsAPI = {
  getMyChats: () => api.get('/chats/my'),
  getChatById: (chatId) => api.get(`/chats/${chatId}`),
};

// ─── Messages ─────────────────────────────────────────────────────────────────
export const messagesAPI = {
  getMessages: (chatId) => api.get(`/messages/${chatId}`),
  sendMessage: (data) => api.post('/messages', data),
  markAsRead: (chatId) => api.patch(`/messages/${chatId}/read`),
};

export default api;
