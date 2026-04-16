import { create } from 'zustand';
import { authService } from '../services/services';

const useAuthStore = create((set, get) => ({
  user: (() => {
    try {
      const stored = localStorage.getItem('ats_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })(),
  token: localStorage.getItem('ats_token') || null,
  isLoading: false,
  error: null,

  setAuth: (user, token) => {
    localStorage.setItem('ats_token', token);
    localStorage.setItem('ats_user', JSON.stringify(user));
    set({ user, token, error: null });
  },

  clearAuth: () => {
    localStorage.removeItem('ats_token');
    localStorage.removeItem('ats_user');
    set({ user: null, token: null });
  },

  register: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authService.register(data);
      get().setAuth(res.data.user, res.token);
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed. Please try again.';
      set({ error: message });
      return { success: false, error: message };
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authService.login(data);
      get().setAuth(res.data.user, res.token);
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed. Please check your credentials.';
      set({ error: message });
      return { success: false, error: message };
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    try {
      await authService.logout();
    } catch {
      // Continue with local logout even if API fails
    }
    get().clearAuth();
  },

  refreshUser: async () => {
    try {
      const res = await authService.getMe();
      const user = res.data.user;
      localStorage.setItem('ats_user', JSON.stringify(user));
      set({ user });
    } catch {
      // Token may be expired — clear auth
      get().clearAuth();
    }
  },

  isAuthenticated: () => !!get().token && !!get().user,
}));

export default useAuthStore;
