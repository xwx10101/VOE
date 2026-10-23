/* ✏️ TEAM GUIDE: Weekly family schedule state (CRUD-ready for Phase 3). */
import { create } from 'zustand';
import { loadCollection, saveCollection } from '@/lib/api';
import type { ScheduleEvent } from '@/types';

interface ScheduleState {
  events: ScheduleEvent[];
  ownerId: string | null;
  loadForUser: (userId: string) => void;
  addEvent: (event: ScheduleEvent) => void;
  updateEvent: (event: ScheduleEvent) => void;
  removeEvent: (id: string) => void;
  reset: () => void;
}

export const useScheduleStore = create<ScheduleState>()((set, get) => {
  const persist = (events: ScheduleEvent[]) => {
    const { ownerId } = get();
    if (ownerId) saveCollection(ownerId, 'schedule', events);
  };
  return {
    events: [],
    ownerId: null,
    loadForUser: (userId) =>
      set({ ownerId: userId, events: loadCollection<ScheduleEvent>(userId, 'schedule') }),
    addEvent: (event) => {
      const next = [...get().events, event];
      set({ events: next });
      persist(next);
    },
    updateEvent: (event) => {
      const next = get().events.map((e) => (e.id === event.id ? event : e));
      set({ events: next });
      persist(next);
    },
    removeEvent: (id) => {
      const next = get().events.filter((e) => e.id !== id);
      set({ events: next });
      persist(next);
    },
    reset: () => set({ events: [], ownerId: null }),
  };
});
