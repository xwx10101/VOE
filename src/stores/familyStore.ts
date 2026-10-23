/*
 * ✏️ TEAM GUIDE: The active household (family, members, enabled modules).
 * Loaded per-user from lib/api.ts; every module store reads members from here.
 * Member CRUD + module toggles here power the Settings page.
 */
import { create } from 'zustand';
import { loadFamily, saveFamily } from '@/lib/api';
import type { Family, FamilyMember, LocalizedString, ModuleId } from '@/types';

interface FamilyState {
  family: Family | null;
  ownerId: string | null;
  loadForUser: (userId: string) => void;
  setFamily: (family: Family) => void;
  setFamilyName: (name: LocalizedString) => void;
  addMember: (member: FamilyMember) => void;
  updateMember: (member: FamilyMember) => void;
  removeMember: (id: string) => void;
  toggleModule: (id: ModuleId) => void;
  reset: () => void;
}

export const useFamilyStore = create<FamilyState>()((set, get) => {
  const patch = (partial: Partial<Family>) => {
    const { family, ownerId } = get();
    if (!family) return;
    const next = { ...family, ...partial };
    if (ownerId) saveFamily(ownerId, next);
    set({ family: next });
  };

  return {
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

    setFamilyName: (name) => patch({ name }),

    addMember: (member) => {
      const { family } = get();
      if (family) patch({ members: [...family.members, member] });
    },

    updateMember: (member) => {
      const { family } = get();
      if (family) patch({ members: family.members.map((m) => (m.id === member.id ? member : m)) });
    },

    removeMember: (id) => {
      const { family } = get();
      if (family) patch({ members: family.members.filter((m) => m.id !== id) });
    },

    toggleModule: (id) => {
      const { family } = get();
      if (!family) return;
      patch({
        enabledModules: family.enabledModules.includes(id)
          ? family.enabledModules.filter((m) => m !== id)
          : [...family.enabledModules, id],
      });
    },

    reset: () => set({ family: null, ownerId: null }),
  };
});
