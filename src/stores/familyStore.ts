/*
 * ✏️ TEAM GUIDE: The active household (family, members, enabled modules).
 * Loaded per-user from lib/api.ts; every module store reads members from here.
 * Phase 2+ adds member CRUD actions used by Settings.
 */
import { create } from 'zustand';
import { loadFamily, saveFamily } from '@/lib/api';
import type { Family } from '@/types';

interface FamilyState {
  family: Family | null;
  ownerId: string | null;
  loadForUser: (userId: string) => void;
  setFamily: (family: Family) => void;
  reset: () => void;
}

export const useFamilyStore = create<FamilyState>()((set, get) => ({
  family: null,
  ownerId: null,

  loadForUser: (userId) => {
    set({ ownerId: userId, family: loadFamily(userId) });
  },

  setFamily: (family) => {
    const { ownerId } = get();
    if (ownerId) saveFamily(ownerId, family);
    set({ family });
  },

  reset: () => set({ family: null, ownerId: null }),
}));
