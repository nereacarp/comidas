import { create } from 'zustand';
import type { User } from '../types';
import { createAuthApi } from '../api/auth';
import { apiClient } from '../api/client';
import { applyLocalPreferences } from '../lib/user-preferences';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  acceptInvitation: (token: string, name: string, password: string) => Promise<void>;
  logout: () => void;
  loadProfile: () => Promise<void>;
  clearError: () => void;
}

const authApi = createAuthApi(apiClient);

function isNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return msg === 'failed to fetch' || msg.includes('networkerror') || msg.includes('network error');
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: localStorage.getItem('session_hint') === '1',
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { user } = await authApi.login({ email, password });
      localStorage.setItem('session_hint', '1');
      set({ user: applyLocalPreferences(user), isAuthenticated: true, isLoading: false });
    } catch (error) {
      const serverMessage = error instanceof Error ? error.message : '';
      const message = isNetworkError(error)
        ? 'No se ha podido conectar. Comprueba tu conexión.'
        : ['Cuenta suspendida', 'Email no verificado'].includes(serverMessage)
          ? serverMessage
          : 'Email o contraseña incorrectos.';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  register: async (email, password, name) => {
    set({ isLoading: true, error: null });
    try {
      const result = await authApi.register({ email, password, name });
      if ('requiresEmailVerification' in result) {
        set({ user: null, isAuthenticated: false, isLoading: false });
        return true;
      }
      const { user } = result;
      localStorage.setItem('session_hint', '1');
      set({ user: applyLocalPreferences(user), isAuthenticated: true, isLoading: false });
      return false;
    } catch (error) {
      const message = isNetworkError(error)
        ? 'No se ha podido conectar. Comprueba tu conexión.'
        : error instanceof Error ? error.message : 'No se ha podido crear la cuenta.';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  acceptInvitation: async (token, name, password) => {
    set({ isLoading: true, error: null });
    try {
      const { user } = await authApi.acceptUserInvitation({
        token,
        name,
        password,
        acceptedTerms: true,
      });
      localStorage.setItem('session_hint', '1');
      set({ user: applyLocalPreferences(user), isAuthenticated: true, isLoading: false });
    } catch (error) {
      const message = isNetworkError(error)
        ? 'No se ha podido conectar. Comprueba tu conexión.'
        : error instanceof Error ? error.message : 'No se ha podido aceptar la invitación.';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  logout: () => {
    void authApi.logout().catch(() => undefined);
    localStorage.removeItem('session_hint');
    set({ user: null, isAuthenticated: false });
  },

  loadProfile: async () => {
    set({ isLoading: true });
    try {
      const profile = await authApi.getProfile();
      set({ user: applyLocalPreferences(profile), isLoading: false });
    } catch {
      localStorage.removeItem('session_hint');
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
