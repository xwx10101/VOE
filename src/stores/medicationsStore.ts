/*
 * ✏️ TEAM GUIDE: Medications + dose log state.
 * Marking a dose from ANY screen (dashboard timeline, medications page,
 * assistant) goes through markDose() so adherence stays consistent.
 */
import { create } from 'zustand';
import { loadCollection, saveCollection } from '@/lib/api';
import type { DoseLogEntry, DoseStatus, Medication } from '@/types';

interface MedicationsState {
  medications: Medication[];
  doseLog: DoseLogEntry[];
  ownerId: string | null;
  loadForUser: (userId: string) => void;
  /** Record (or clear, with 'clear') the outcome of one scheduled dose slot. */
  markDose: (medicationId: string, date: string, time: string, status: DoseStatus | 'clear') => void;
  addMedication: (med: Medication) => void;
  updateMedication: (med: Medication) => void;
  removeMedication: (id: string) => void;
  reset: () => void;
}

export const useMedicationsStore = create<MedicationsState>()((set, get) => {
  const persist = (medications: Medication[], doseLog: DoseLogEntry[]) => {
    const { ownerId } = get();
    if (!ownerId) return;
    saveCollection(ownerId, 'medications', medications);
    saveCollection(ownerId, 'doseLog', doseLog);
  };

  return {
    medications: [],
    doseLog: [],
    ownerId: null,

    loadForUser: (userId) =>
      set({
        ownerId: userId,
        medications: loadCollection<Medication>(userId, 'medications'),
        doseLog: loadCollection<DoseLogEntry>(userId, 'doseLog'),
      }),

    markDose: (medicationId, date, time, status) => {
      const { medications } = get();
      let { doseLog } = get();
      const id = `dose-${medicationId}-${date}-${time}`;
      doseLog = doseLog.filter((e) => e.id !== id);
      if (status !== 'clear') {
        doseLog = [...doseLog, { id, medicationId, date, time, status }];
        // Taking a dose consumes supply; clearing/missing restores nothing (safe default).
        if (status === 'taken') {
          const nextMeds = medications.map((m) =>
            m.id === medicationId
              ? { ...m, supplyRemaining: Math.max(0, m.supplyRemaining - m.unitsPerDose) }
              : m,
          );
          set({ medications: nextMeds, doseLog });
          persist(nextMeds, doseLog);
          return;
        }
      }
      set({ doseLog });
      persist(medications, doseLog);
    },

    addMedication: (med) => {
      const next = [...get().medications, med];
      set({ medications: next });
      persist(next, get().doseLog);
    },

    updateMedication: (med) => {
      const next = get().medications.map((m) => (m.id === med.id ? med : m));
      set({ medications: next });
      persist(next, get().doseLog);
    },

    removeMedication: (id) => {
      const medications = get().medications.filter((m) => m.id !== id);
      const doseLog = get().doseLog.filter((e) => e.medicationId !== id);
      set({ medications, doseLog });
      persist(medications, doseLog);
    },

    reset: () => set({ medications: [], doseLog: [], ownerId: null }),
  };
});
