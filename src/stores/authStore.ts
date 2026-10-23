/*
 * ✏️ TEAM GUIDE: Authentication state (Zustand).
 * Flow: hydrate() restores the session → login/register/logout via lib/api.ts.
 * `status` starts as 'loading' so protected routes show a loader, not a redirect flash.
 */
import { create } from 'zustand';
import {
  clearSession,
  getSessionUser,
  loginAccount,
  loginDemo,
  registerAccount,
  setOnboarded,
} from '@/lib/api';
import { useFamilyStore } from '@/stores/familyStore';
import type { SessionUser } from '@/types';

type AuthStatus = 'loading' | 'authed' | 'guest';

interface AuthState {
  user: SessionUser | null;
  status: AuthStatus;
  hydrate: () => Promise<void>;
  login: (email: string, password: string) => Promise<SessionUser>;
  loginAsDemo: () => Promise<SessionUser>;
  register: (name: string, email: string, password: string) => Promise<SessionUser>;
  logout: () => void;
  completeOnboarding: () => void;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  status: 'loading',

  hydrate: async () => {
    const user = await getSessionUser();
    set({ user, status: user ? 'authed' : 'guest' });
    if (user) useFamilyStore.getState().loadForUser(user.id);
  },

  login: async (email, password) => {
    const user = await loginAccount(email, password);
    set({ user, status: 'authed' });
    useFamilyStore.getState().loadForUser(user.id);
    return user;
  },

  loginAsDemo: async () => {
    const user = await loginDemo();
    set({ user, status: 'authed' });
    useFamilyStore.getState().loadForUser(user.id);
    return user;
  },

  register: async (name, email, password) => {
    const user = await registerAccount(name, email, password);
    set({ user, status: 'authed' });
    return user;
  },

  logout: () => {
    clearSession();
    useFamilyStore.getState().reset();
    set({ user: null, status: 'guest' });
  },

  completeOnboarding: () => {
    const current = get().user;
    if (!current) return;
    const updated = setOnboarded(current.id);
    if (updated) set({ user: updated });
  },
}));
