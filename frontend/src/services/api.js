import axios from 'axios';

// Backend API URL
const API_BASE =
  import.meta.env.VITE_API_URL ||
  'https://ats-backend-owhr.onrender.com/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
});

// Request Interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ats_token');

    // Attach JWT token if available
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Set JSON content type only for non-FormData requests
    if (
      !(config.data instanceof FormData) &&
      !config.headers['Content-Type']
    ) {
      config.headers['Content-Type'] = 'application/json';
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle unauthorized access
    if (error.response?.status === 401) {
      localStorage.removeItem('ats_token');
      localStorage.removeItem('ats_user');

      if (
        !window.location.pathname.includes('/login') &&
        !window.location.pathname.includes('/register')
      ) {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;