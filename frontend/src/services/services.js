import api from './api';

// ========== AUTH SERVICES ==========
export const authService = {
  login: (credentials) => api.post('/auth/login', credentials).then(res => res.data),
  register: (userData) => api.post('/auth/register', userData).then(res => res.data),
  getMe: () => api.get('/auth/me').then(res => res.data),
  logout: () => api.post('/auth/logout')
};

// ========== RESUME SERVICES ==========
export const resumeService = {
  upload: (formData) => api.post('/resumes/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(res => res.data),
  getAll: (page = 1, limit = 10) => api.get(`/resumes?page=${page}&limit=${limit}`).then(res => res.data),
  getById: (id) => api.get(`/resumes/${id}`).then(res => res.data),
  delete: (id) => api.delete(`/resumes/${id}`).then(res => res.data)
};

// ========== ANALYSIS SERVICES ==========
export const analysisService = {
  analyze: (data) => api.post('/analysis/run', data).then(res => res.data),
  getDashboard: () => api.get('/analysis/dashboard').then(res => res.data),
  getAll: (page = 1, limit = 10) => api.get(`/analysis?page=${page}&limit=${limit}`).then(res => res.data),
  getById: (id) => api.get(`/analysis/${id}`).then(res => res.data),
  delete: (id) => api.delete(`/analysis/${id}`).then(res => res.data)
};
