import axios from 'axios';

// ── Configuration ───────────────────────────────────────────
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Interceptor: Add token to headers ───────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Interceptor: Handle responses ───────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// ── Auth Endpoints ──────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  verifyOtp: (data) => api.post('/auth/verify-otp', data),
  resendOtp: (data) => api.post('/auth/resend-otp', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/me'),
};

// ── Chat Endpoints ──────────────────────────────────────────
export const chatAPI = {
  createSession: () => api.post('/chat/session', {}),
  sendMessage: (sessionId, message) =>
    api.post('/chat/message', { sessionId, message }),
  getSessions: () => api.get('/chat/sessions'),
  getSession: (sessionId) => api.get(`/chat/sessions/${sessionId}`),
  getHistory: (sessionId) => api.get(`/chat/sessions/${sessionId}/history`),
};

// ── Dashboard Endpoints ─────────────────────────────────────
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getSessions: () => api.get('/dashboard/sessions'),
};

// ── Reports Endpoints ───────────────────────────────────────
export const reportsAPI = {
  getReports: () => api.get('/dashboard/reports'),
  getReport: (reportId) => api.get(`/dashboard/reports/${reportId}`),
};

// ── Admin Endpoints ─────────────────────────────────────────
export const adminAPI = {
  getAnalytics: () => api.get('/admin/analytics'),
  getFlaggedSessions: () => api.get('/admin/flagged-sessions'),
  getUsers: () => api.get('/admin/users'),
};

export default api;
