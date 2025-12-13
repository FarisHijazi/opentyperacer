import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../lib/api';

interface User {
  id: string;
  username: string;
  isGuest: boolean;
  avatarColor: string;
  carColor: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  initGuest: () => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      loading: false,

      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),

      initGuest: async () => {
        if (get().user) return;

        set({ loading: true });
        try {
          const response = await api.post<{ user: User; token: string }>('/auth/guest');
          set({
            user: response.data.user,
            token: response.data.token,
            loading: false,
          });
        } catch (error) {
          console.error('Failed to create guest:', error);
          set({ loading: false });
        }
      },

      logout: () => {
        set({ user: null, token: null });
      },
    }),
    {
      name: 'typeracer-auth',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);
