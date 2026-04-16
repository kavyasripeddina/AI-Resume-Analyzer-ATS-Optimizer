import api from './api';

export const authService = {
  register: async (data) => {
    const res = await api.post('/auth/register', data);
    return res.data;
  },

  login: async (data) => {
    const res = await api.post('/auth/login', data);
    return res.data;
  },

  logout: async () => {
    await api.post('/auth/logout');
    localStorage.removeItem('ats_token');
    localStorage.removeItem('ats_user');
  },

  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },

  updateProfile: async (data) => {
    const res = await api.patch('/auth/update-profile', data);
    return res.data;
  },
};

export const resumeService = {
  upload: async (file, onProgress) => {
    const formData = new FormData();
    formData.append('resume', file);
    const res = await api.post('/resumes/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded / progressEvent.total) * 100);
          onProgress(percent);
        }
      },
    });
    return res.data;
  },

  getAll: async (page = 1, limit = 10) => {
    const res = await api.get('/resumes', { params: { page, limit } });
    return res.data;
  },

  getById: async (id) => {
    const res = await api.get(`/resumes/${id}`);
    return res.data;
  },

  delete: async (id) => {
    const res = await api.delete(`/resumes/${id}`);
    return res.data;
  },
};

export const analysisService = {
  run: async (data) => {
    const res = await api.post('/analysis/run', data);
    return res.data;
  },

  getHistory: async (page = 1, limit = 10) => {
    const res = await api.get('/analysis', { params: { page, limit } });
    return res.data;
  },

  getById: async (id) => {
    const res = await api.get(`/analysis/${id}`);
    return res.data;
  },

  delete: async (id) => {
    const res = await api.delete(`/analysis/${id}`);
    return res.data;
  },

  getDashboard: async () => {
    const res = await api.get('/analysis/dashboard');
    return res.data;
  },

  tailorBuilder: async (baseData, roleTitle) => {
    const res = await api.post('/analysis/tailor-builder', { baseData, roleTitle });
    return res.data;
  },
};
