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
  resetUserData,
  setOnboarded,
  updateUserProfile,
} from '@/lib/api';
import { useFamilyStore } from '@/stores/familyStore';
import { useHealthStore } from '@/stores/healthStore';
import { useMedicationsStore } from '@/stores/medicationsStore';
import { useScheduleStore } from '@/stores/scheduleStore';
import type { SessionUser } from '@/types';

type AuthStatus = 'loading' | 'authed' | 'guest';

/** Load every domain store for the signed-in user. */
function loadAllUserData(userId: string): void {
  useFamilyStore.getState().loadForUser(userId);
  useMedicationsStore.getState().loadForUser(userId);
  useScheduleStore.getState().loadForUser(userId);
  useHealthStore.getState().loadForUser(userId);
}

/** Clear every domain store (logout). */
function resetAllUserData(): void {
  useFamilyStore.getState().reset();
  useMedicationsStore.getState().reset();
  useScheduleStore.getState().reset();
  useHealthStore.getState().reset();
}

interface AuthState {
  user: SessionUser | null;
  status: AuthStatus;
  hydrate: () => Promise<void>;
  login: (email: string, password: string) => Promise<SessionUser>;
  loginAsDemo: () => Promise<SessionUser>;
  register: (name: string, email: string, password: string) => Promise<SessionUser>;
  logout: () => void;
  completeOnboarding: () => void;
  updateProfile: (name: string) => void;
  /** Settings → reset. Returns the updated user (onboarded may become false). */
  resetAccountData: () => SessionUser | null;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  status: 'loading',

  hydrate: async () => {
    const user = await getSessionUser();
    set({ user, status: user ? 'authed' : 'guest' });
    if (user) loadAllUserData(user.id);
  },

  login: async (email, password) => {
    const user = await loginAccount(email, password);
    set({ user, status: 'authed' });
    loadAllUserData(user.id);
    return user;
  },

  loginAsDemo: async () => {
    const user = await loginDemo();
    set({ user, status: 'authed' });
    loadAllUserData(user.id);
    return user;
  },

  register: async (name, email, password) => {
    const user = await registerAccount(name, email, password);
    set({ user, status: 'authed' });
    return user;
  },

  logout: () => {
    clearSession();
    resetAllUserData();
    set({ user: null, status: 'guest' });
  },

  completeOnboarding: () => {
    const current = get().user;
    if (!current) return;
    const updated = setOnboarded(current.id);
    if (updated) set({ user: updated });
  },

  updateProfile: (name) => {
    const current = get().user;
    if (!current) return;
    const updated = updateUserProfile(current.id, name);
    if (updated) set({ user: updated });
  },

  resetAccountData: () => {
    const current = get().user;
    if (!current) return null;
    const updated = resetUserData(current.id);
    if (updated) {
      set({ user: updated });
      loadAllUserData(updated.id);
    }
    return updated;
  },
}));
