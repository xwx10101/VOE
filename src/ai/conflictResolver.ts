/*
 * ✏️ TEAM GUIDE — AI MODULE: Schedule conflict detection + resolution
 * suggestions. Pure functions: deterministic, explainable, unit-testable.
 *
 * A conflict = two events on the same weekday whose time ranges overlap AND
 * that share a person — either the same owner, or one event's COMPANION
 * (withMemberId, e.g. who drives Grandma to the clinic). This catches the
 * classic family double-booking: "Mum can't be at the school meeting AND
 * drive Grandma at the same time."
 *
 * suggestResolution() then searches, in order, for the least disruptive fix:
 *   1) start the later event right after the earlier one ends (same day)
 *   2) fit it in before the earlier one starts (same day)
 *   3) same time on the next day
 * verifying that EVERY involved person (owner + companion) is free.
 * See docs/AI_EXPLAINED.md (Phase 6).
 */
import { minutesToTime, timeToMinutes } from '@/lib/dates';
import type { ScheduleEvent } from '@/types';

export interface ScheduleConflict {
  id: string;
  /** The person who is double-booked. */
  memberId: string;
  /** 'self' = owns both events · 'companion' = must accompany one of them. */
  kind: 'self' | 'companion';
  dayOfWeek: number;
  /** The two overlapping events, earlier start first. */
  events: [ScheduleEvent, ScheduleEvent];
  overlapMinutes: number;
}

export type SuggestionReason = 'shiftAfter' | 'shiftBefore' | 'nextDay';

export interface ConflictSuggestion {
  /** Event to move (always the later-starting one — least disruptive). */
  eventId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  reason: SuggestionReason;
}

/** Everyone occupied by an event: its owner + optional companion. */
export function personsOf(event: ScheduleEvent): string[] {
  return event.withMemberId && event.withMemberId !== event.memberId
    ? [event.memberId, event.withMemberId]
    : [event.memberId];
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
      if (a.dayOfWeek !== b.dayOfWeek || !eventsOverlap(a, b)) continue;
      const personsB = new Set(personsOf(b));
      const shared = personsOf(a).find((p) => personsB.has(p));
      if (!shared) continue;
      const [first, second] =
        timeToMinutes(a.startTime) <= timeToMinutes(b.startTime) ? [a, b] : [b, a];
      conflicts.push({
        id: `conflict-${first.id}-${second.id}`,
        memberId: shared,
        kind: a.memberId === shared && b.memberId === shared ? 'self' : 'companion',
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

/** Would `candidate` (a moved copy of an event) clash with anyone involved? */
function isSlotFree(candidate: ScheduleEvent, allEvents: ScheduleEvent[]): boolean {
  const persons = new Set(personsOf(candidate));
  return !allEvents.some((other) => {
    if (other.id === candidate.id || other.dayOfWeek !== candidate.dayOfWeek) return false;
    if (!eventsOverlap(candidate, other)) return false;
    return personsOf(other).some((p) => persons.has(p));
  });
}

/**
 * Suggest the least disruptive fix for a conflict, or null when no clean
 * slot exists (the UI then invites a manual edit).
 */
export function suggestResolution(
  conflict: ScheduleConflict,
  allEvents: ScheduleEvent[],
): ConflictSuggestion | null {
  const [first, second] = conflict.events;
  const duration = timeToMinutes(second.endTime) - timeToMinutes(second.startTime);
  const dayStart = 5 * 60; // never schedule before 05:00
  const dayEnd = 23 * 60 + 59;

  const attempt = (
    dayOfWeek: number,
    startMin: number,
    reason: SuggestionReason,
  ): ConflictSuggestion | null => {
    const endMin = startMin + duration;
    if (startMin < dayStart || endMin > dayEnd) return null;
    const candidate: ScheduleEvent = {
      ...second,
      dayOfWeek,
      startTime: minutesToTime(startMin),
      endTime: minutesToTime(endMin),
    };
    if (!isSlotFree(candidate, allEvents)) return null;
    return {
      eventId: second.id,
      dayOfWeek,
      startTime: candidate.startTime,
      endTime: candidate.endTime,
      reason,
    };
  };

  return (
    attempt(second.dayOfWeek, timeToMinutes(first.endTime), 'shiftAfter') ??
    attempt(second.dayOfWeek, timeToMinutes(first.startTime) - duration, 'shiftBefore') ??
    attempt((second.dayOfWeek + 1) % 7, timeToMinutes(second.startTime), 'nextDay')
  );
}
