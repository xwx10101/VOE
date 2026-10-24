import type { EventCategory, FamilyMember, ScheduleEvent, ScheduleProposal } from '@/types';
import { DAYS } from '@/lib/recommendations';

export const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
};

export const minutesToTime = (minutes: number): string => {
  const clamped = Math.max(0, Math.min(24 * 60, minutes));
  const hours = Math.floor(clamped / 60);
  const mins = clamped % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

export const durationOf = (event: ScheduleEvent): number =>
  Math.max(0, timeToMinutes(event.end) - timeToMinutes(event.start));

export interface Conflict {
  day: string;
  memberId: string;
  first: ScheduleEvent;
  second: ScheduleEvent;
}

export function detectConflicts(events: ScheduleEvent[]): Conflict[] {
  const conflicts: Conflict[] = [];
  DAYS.forEach((day) => {
    const dayEvents = events.filter((event) => event.day === day);
    for (let i = 0; i < dayEvents.length; i += 1) {
      for (let j = i + 1; j < dayEvents.length; j += 1) {
        const a = dayEvents[i];
        const b = dayEvents[j];
        if (a.ownerId !== b.ownerId) continue;
        const overlap =
          timeToMinutes(a.start) < timeToMinutes(b.end) && timeToMinutes(b.start) < timeToMinutes(a.end);
        if (overlap) conflicts.push({ day, memberId: a.ownerId, first: a, second: b });
      }
    }
  });
  return conflicts;
}

export interface DayLoad {
  day: string;
  minutes: number;
  events: number;
  status: 'clear' | 'steady' | 'busy' | 'overloaded';
}

export function loadForMember(events: ScheduleEvent[], memberId: string): DayLoad[] {
  return DAYS.map((day) => {
    const dayEvents = events.filter((event) => event.day === day && event.ownerId === memberId);
    const minutes = dayEvents.reduce((total, event) => total + durationOf(event), 0);
    const status: DayLoad['status'] =
      minutes >= 480 ? 'overloaded' : minutes >= 330 ? 'busy' : minutes >= 120 ? 'steady' : 'clear';
    return { day, minutes, events: dayEvents.length, status };
  });
}

export interface BalanceRow {
  memberId: string;
  visibleMinutes: number;
  planningMinutes: number;
  totalMinutes: number;
  share: number;
}

const PLANNING_HINTS = ['planning', 'grocery', 'review', 'list', 'appointment'];

export function responsibilityBalance(events: ScheduleEvent[], members: FamilyMember[]): BalanceRow[] {
  const countable: EventCategory[] = ['household', 'care', 'health'];
  const rows = members.map((member) => {
    const owned = events.filter((event) => event.ownerId === member.id && countable.includes(event.category));
    const planningMinutes = owned
      .filter((event) => PLANNING_HINTS.some((hint) => event.title.toLowerCase().includes(hint)))
      .reduce((total, event) => total + durationOf(event), 0);
    const totalMinutes = owned.reduce((total, event) => total + durationOf(event), 0);
    return {
      memberId: member.id,
      visibleMinutes: Math.max(0, totalMinutes - planningMinutes),
      planningMinutes,
      totalMinutes,
      share: 0,
    };
  });
  const total = rows.reduce((sum, row) => sum + row.totalMinutes, 0);
  return rows.map((row) => ({ ...row, share: total === 0 ? 0 : Math.round((row.totalMinutes / total) * 100) }));
}

/**
 * Deterministic optimisation proposals derived from the current schedule.
 * Nothing is applied here — the family selects and confirms each change.
 */
export function buildProposals(events: ScheduleEvent[], members: FamilyMember[]): ScheduleProposal[] {
  const proposals: ScheduleProposal[] = [];
  const byId = (id: string) => events.find((event) => event.id === id);
  const student = members.find((member) => member.role === 'Student');
  const father = members.find((member) => member.role === 'Father');
  const mother = members.find((member) => member.role === 'Mother');
  const olderAdult = members.find((member) => member.ageGroup === 'older-adult');

  const wednesdayHousehold = events.find(
    (event) =>
      event.day === 'Wednesday' &&
      event.category === 'household' &&
      (!student || event.ownerId === student.id),
  );
  if (wednesdayHousehold && father) {
    proposals.push({
      id: 'prop-move-chore',
      kind: 'move',
      title: 'Move Wednesday’s kitchen task to Thursday and assign Omar',
      reason:
        'A mathematics assessment and a chemistry revision block both fall on Wednesday. One non-urgent household task competes directly with preparation and recovery time.',
      eventId: wednesdayHousehold.id,
      memberId: father.id,
      from: { day: wednesdayHousehold.day, start: wednesdayHousehold.start },
      to: { day: 'Thursday', start: '18:00' },
      affects: [student?.id, father.id].filter(Boolean) as string[],
    });
  }

  const careEvent = events.find((event) => event.category === 'care' || event.category === 'health');
  if (careEvent && father && !careEvent.backupId) {
    proposals.push({
      id: 'prop-care-backup',
      kind: 'assign-backup',
      title: 'Assign Omar as backup for the morning care routine',
      reason:
        'One older-adult routine was missed this week and the schedule has no named backup. A backup keeps continuity without monitoring anyone’s private day.',
      eventId: careEvent.id,
      memberId: father.id,
      affects: [olderAdult?.id, father.id].filter(Boolean) as string[],
    });
  }

  const denseDay = 'Wednesday';
  const studentDense = student
    ? events.filter((event) => event.day === denseDay && event.ownerId === student.id)
    : [];
  const hasRest = events.some((event) => event.day === denseDay && event.category === 'rest' && student && event.ownerId === student.id);
  if (student && studentDense.length >= 2 && !hasRest) {
    proposals.push({
      id: 'prop-protect-rest',
      kind: 'protect-rest',
      title: 'Protect 21:00–21:30 recovery time on Wednesday',
      reason:
        'The student already has a school block and a study block on the same day. Protected recovery keeps the evening from running late into the next morning.',
      memberId: student.id,
      newEvent: {
        title: 'Protected recovery',
        day: denseDay,
        start: '21:00',
        end: '21:30',
        category: 'rest',
        ownerId: student.id,
        note: 'No tasks, no screens — agreed with the family.',
      },
      affects: [student.id],
    });
  }

  const fridayEvent = events.find(
    (event) => event.day === 'Friday' && event.category === 'family' && !event.locked,
  );
  const hasFridayWalk = events.some(
    (event) => event.day === 'Friday' && event.category === 'family' && /walk/i.test(event.title),
  );
  if (!hasFridayWalk && mother) {
    proposals.push({
      id: 'prop-family-time',
      kind: 'add-family-time',
      title: 'Add a 30-minute family walk on Friday',
      reason: fridayEvent
        ? 'A shared window is already open on Friday evening. Using it needs no new planning and adds protected family time.'
        : 'Friday evening has no committed events. A short shared activity fits without competing with work or study.',
      newEvent: {
        title: 'Family walk (indoor alternative ready)',
        day: 'Friday',
        start: '17:30',
        end: '18:00',
        category: 'family',
        ownerId: mother.id,
        note: 'Indoor alternative: shared tea and a memory prompt.',
      },
      affects: members.map((member) => member.id),
    });
  }

  if (mother && father) {
    const motherOwned = events.filter((event) => event.ownerId === mother.id && event.category === 'household');
    const fatherOwned = events.filter((event) => event.ownerId === father.id && event.category === 'household');
    if (motherOwned.length > fatherOwned.length) {
      proposals.push({
        id: 'prop-rebalance',
        kind: 'rebalance',
        title: 'Share one of Mariam’s recurring household tasks with Omar',
        reason: `${motherOwned.length} recurring household tasks sit with Mariam and ${fatherOwned.length} with Omar. Moving one recurring task rebalances the week more reliably than a one-off chore.`,
        eventId: motherOwned[0].id,
        memberId: father.id,
        affects: [mother.id, father.id],
      });
    }
  }

  return proposals.filter((proposal) => {
    if (proposal.kind === 'move') {
      const event = proposal.eventId ? byId(proposal.eventId) : undefined;
      return Boolean(event);
    }
    return true;
  });
}

export interface ApplyResult {
  events: ScheduleEvent[];
  applied: ScheduleProposal[];
}

export function applyProposals(
  events: ScheduleEvent[],
  proposals: ScheduleProposal[],
  selectedIds: string[],
): ApplyResult {
  const applied = proposals.filter((proposal) => selectedIds.includes(proposal.id));
  let next = [...events];

  applied.forEach((proposal, index) => {
    if (proposal.kind === 'move' && proposal.eventId) {
      next = next.map((event) =>
        event.id === proposal.eventId
          ? {
              ...event,
              day: proposal.to?.day ?? event.day,
              start: proposal.to?.start ?? event.start,
              end: proposal.to
                ? minutesToTime(timeToMinutes(proposal.to.start) + durationOf(event))
                : event.end,
              ownerId: proposal.memberId ?? event.ownerId,
            }
          : event,
      );
    }
    if (proposal.kind === 'assign-backup' && proposal.eventId) {
      next = next.map((event) =>
        event.id === proposal.eventId ? { ...event, backupId: proposal.memberId } : event,
      );
    }
    if (proposal.kind === 'rebalance' && proposal.eventId) {
      next = next.map((event) =>
        event.id === proposal.eventId ? { ...event, ownerId: proposal.memberId ?? event.ownerId } : event,
      );
    }
    if (proposal.newEvent) {
      next = [...next, { ...proposal.newEvent, id: `ev-opt-${index}-${proposal.id}` }];
    }
  });

  return { events: next, applied };
}

export function freeWindow(events: ScheduleEvent[], day: string, from = '17:00', to = '21:00'): boolean {
  const dayEvents = events
    .filter((event) => event.day === day)
    .sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
  const start = timeToMinutes(from);
  const end = timeToMinutes(to);
  let cursor = start;
  for (const event of dayEvents) {
    const eventStart = timeToMinutes(event.start);
    const eventEnd = timeToMinutes(event.end);
    if (eventEnd <= cursor) continue;
    if (eventStart >= end) break;
    if (eventStart - cursor >= 30) return true;
    cursor = Math.max(cursor, eventEnd);
  }
  return end - cursor >= 30;
}
