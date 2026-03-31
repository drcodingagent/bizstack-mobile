import { create } from 'zustand';
import { User } from '../types';
import * as authApi from '../api/auth';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadStoredAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    const { token, user } = await authApi.login(email, password);
    set({ user, token, isAuthenticated: true });
  },

  logout: async () => {
    await authApi.logout();
    set({ user: null, token: null, isAuthenticated: false });
  },

  loadStoredAuth: async () => {
    set({ isLoading: true });
    try {
      const stored = await authApi.getStoredAuth();
      if (stored) {
        set({ user: stored.user, token: stored.token, isAuthenticated: true });
      }
    } catch {
      // Stored auth invalid
    } finally {
      set({ isLoading: false });
    }
  },
}));
