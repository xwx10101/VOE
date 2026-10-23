/* ✏️ TEAM GUIDE: Health readings state (BP + glucose; logging UI in Phase 4). */
import { create } from 'zustand';
import { loadCollection, saveCollection } from '@/lib/api';
import type { HealthReading } from '@/types';

interface HealthState {
  readings: HealthReading[];
  ownerId: string | null;
  loadForUser: (userId: string) => void;
  addReading: (reading: HealthReading) => void;
  removeReading: (id: string) => void;
  reset: () => void;
}

export const useHealthStore = create<HealthState>()((set, get) => {
  const persist = (readings: HealthReading[]) => {
    const { ownerId } = get();
    if (ownerId) saveCollection(ownerId, 'health', readings);
  };
  return {
    readings: [],
    ownerId: null,
    loadForUser: (userId) =>
      set({ ownerId: userId, readings: loadCollection<HealthReading>(userId, 'health') }),
    addReading: (reading) => {
      const next = [...get().readings.filter((r) => r.id !== reading.id), reading].sort((a, b) =>
        a.date.localeCompare(b.date),
      );
      set({ readings: next });
      persist(next);
    },
    removeReading: (id) => {
      const next = get().readings.filter((r) => r.id !== id);
      set({ readings: next });
      persist(next);
    },
    reset: () => set({ readings: [], ownerId: null }),
  };
});
