/*
 * ✏️ TEAM GUIDE — AI MODULE: Schedule conflict detection (+ resolution
 * suggestions arrive in Phase 3). Pure functions only: same input, same
 * output, fully unit-testable, zero network. A conflict = two events for the
 * SAME family member overlapping in time on the same weekday.
 * See docs/AI_EXPLAINED.md (Phase 6) for the plain-language explanation.
 */
import { timeToMinutes } from '@/lib/dates';
import type { ScheduleEvent } from '@/types';

export interface ScheduleConflict {
  id: string;
  memberId: string;
  dayOfWeek: number;
  /** The two overlapping events, earlier start first. */
  events: [ScheduleEvent, ScheduleEvent];
  /** Overlap length in minutes. */
  overlapMinutes: number;
}

/** True when two same-day events overlap in time (touching edges are OK). */
export function eventsOverlap(a: ScheduleEvent, b: ScheduleEvent): boolean {
  return (
    timeToMinutes(a.startTime) < timeToMinutes(b.endTime) &&
    timeToMinutes(b.startTime) < timeToMinutes(a.endTime)
  );
}

/** Detect every conflict in a weekly schedule. O(n²) is fine at family scale. */
export function detectConflicts(events: ScheduleEvent[]): ScheduleConflict[] {
  const conflicts: ScheduleConflict[] = [];
  for (let i = 0; i < events.length; i++) {
    for (let j = i + 1; j < events.length; j++) {
      const a = events[i]!;
      const b = events[j]!;
      if (a.memberId !== b.memberId || a.dayOfWeek !== b.dayOfWeek) continue;
      if (!eventsOverlap(a, b)) continue;
      const [first, second] =
        timeToMinutes(a.startTime) <= timeToMinutes(b.startTime) ? [a, b] : [b, a];
      conflicts.push({
        id: `conflict-${first.id}-${second.id}`,
        memberId: a.memberId,
        dayOfWeek: a.dayOfWeek,
        events: [first, second],
        overlapMinutes:
          Math.min(timeToMinutes(a.endTime), timeToMinutes(b.endTime)) -
          Math.max(timeToMinutes(a.startTime), timeToMinutes(b.startTime)),
      });
    }
  }
  return conflicts.sort((x, y) => x.dayOfWeek - y.dayOfWeek);
}

/** Set of event ids involved in any conflict (for highlighting in UIs). */
export function conflictingEventIds(events: ScheduleEvent[]): Set<string> {
  const ids = new Set<string>();
  for (const c of detectConflicts(events)) {
    ids.add(c.events[0].id);
    ids.add(c.events[1].id);
  }
  return ids;
}
