import { create } from 'zustand';
import type { User } from '../types';
import { createAuthApi } from '../api/auth';
import { apiClient } from '../api/client';
import { applyLocalPreferences } from '../lib/user-preferences';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  loadProfile: () => Promise<void>;
  clearError: () => void;
}

const authApi = createAuthApi(apiClient);

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { user, token } = await authApi.login({ email, password });
      localStorage.setItem('token', token);
      set({ user: applyLocalPreferences(user), token, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al iniciar sesión';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  register: async (email, password, name) => {
    set({ isLoading: true, error: null });
    try {
      const { user, token } = await authApi.register({ email, password, name });
      localStorage.setItem('token', token);
      set({ user: applyLocalPreferences(user), token, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al registrarse';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },

  loadProfile: async () => {
    set({ isLoading: true });
    try {
      const profile = await authApi.getProfile();
      set({ user: applyLocalPreferences(profile), isLoading: false });
    } catch {
      localStorage.removeItem('token');
      set({ user: null, token: null, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
