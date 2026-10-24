import { describe, expect, it } from 'vitest';
import { DEMO_MEMBERS, DEMO_SCHEDULE } from '@/data/demo';
import {
  applyProposals,
  buildProposals,
  detectConflicts,
  durationOf,
  freeWindow,
  loadForMember,
  minutesToTime,
  responsibilityBalance,
  timeToMinutes,
} from '@/lib/scheduleOptimizer';
import type { ScheduleEvent } from '@/types';

describe('schedule optimisation', () => {
  it('parses and formats times', () => {
    expect(timeToMinutes('19:15')).toBe(1155);
    expect(minutesToTime(1155)).toBe('19:15');
    expect(durationOf(DEMO_SCHEDULE[0])).toBe(480);
  });

  it('proposes the documented demo changes', () => {
    const proposals = buildProposals(DEMO_SCHEDULE, DEMO_MEMBERS);
    const kinds = proposals.map((proposal) => proposal.kind);
    expect(kinds).toContain('move');
    expect(kinds).toContain('assign-backup');
    expect(kinds).toContain('protect-rest');
    expect(kinds).toContain('add-family-time');
    proposals.forEach((proposal) => expect(proposal.reason.length).toBeGreaterThan(40));
  });

  it('is deterministic', () => {
    expect(buildProposals(DEMO_SCHEDULE, DEMO_MEMBERS)).toEqual(
      buildProposals(DEMO_SCHEDULE, DEMO_MEMBERS),
    );
  });

  it('moves the Wednesday chore to Thursday and reassigns it, preserving duration', () => {
    const proposals = buildProposals(DEMO_SCHEDULE, DEMO_MEMBERS);
    const move = proposals.find((proposal) => proposal.kind === 'move');
    expect(move).toBeDefined();
    const before = DEMO_SCHEDULE.find((event) => event.id === move!.eventId)!;
    const { events } = applyProposals(DEMO_SCHEDULE, proposals, [move!.id]);
    const after = events.find((event) => event.id === move!.eventId)!;

    expect(after.day).toBe('Thursday');
    expect(after.start).toBe('18:00');
    expect(durationOf(after)).toBe(durationOf(before));
    expect(after.ownerId).toBe('omar');
  });

  it('assigns a named care backup without touching other events', () => {
    const proposals = buildProposals(DEMO_SCHEDULE, DEMO_MEMBERS);
    const backup = proposals.find((proposal) => proposal.kind === 'assign-backup')!;
    const { events, applied } = applyProposals(DEMO_SCHEDULE, proposals, [backup.id]);
    expect(applied).toHaveLength(1);
    const event = events.find((item) => item.id === backup.eventId)!;
    expect(event.backupId).toBe('omar');
    const untouched = events.filter((item) => item.id !== backup.eventId);
    expect(untouched).toHaveLength(DEMO_SCHEDULE.length - 1);
  });

  it('adds a new event only for proposals that create one', () => {
    const proposals = buildProposals(DEMO_SCHEDULE, DEMO_MEMBERS);
    const familyTime = proposals.find((proposal) => proposal.kind === 'add-family-time')!;
    const { events } = applyProposals(DEMO_SCHEDULE, proposals, [familyTime.id]);
    expect(events).toHaveLength(DEMO_SCHEDULE.length + 1);
    expect(events[events.length - 1].category).toBe('family');
  });

  it('ignores unselected proposals', () => {
    const proposals = buildProposals(DEMO_SCHEDULE, DEMO_MEMBERS);
    const { events, applied } = applyProposals(DEMO_SCHEDULE, proposals, []);
    expect(applied).toHaveLength(0);
    expect(events).toEqual(DEMO_SCHEDULE);
  });

  it('detects overlapping events for the same member', () => {
    const conflicting: ScheduleEvent[] = [
      { id: 'a', title: 'A', day: 'Monday', start: '09:00', end: '11:00', category: 'work', ownerId: 'omar' },
      { id: 'b', title: 'B', day: 'Monday', start: '10:30', end: '12:00', category: 'work', ownerId: 'omar' },
      { id: 'c', title: 'C', day: 'Monday', start: '10:30', end: '12:00', category: 'work', ownerId: 'mariam' },
    ];
    const conflicts = detectConflicts(conflicting);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].memberId).toBe('omar');
  });

  it('reports no conflict for the demo schedule', () => {
    expect(detectConflicts(DEMO_SCHEDULE)).toHaveLength(0);
  });

  it('computes responsibility shares that sum to about 100', () => {
    const balance = responsibilityBalance(DEMO_SCHEDULE, DEMO_MEMBERS);
    expect(balance).toHaveLength(DEMO_MEMBERS.length);
    const total = balance.reduce((sum, row) => sum + row.share, 0);
    expect(total).toBeGreaterThanOrEqual(98);
    expect(total).toBeLessThanOrEqual(102);
    const mariam = balance.find((row) => row.memberId === 'mariam')!;
    expect(mariam.planningMinutes).toBeGreaterThan(0);
  });

  it('flags the busiest day of the week for the student', () => {
    const loads = loadForMember(DEMO_SCHEDULE, 'zayed');
    expect(loads).toHaveLength(7);
    const busiest = [...loads].sort((a, b) => b.minutes - a.minutes)[0];
    expect(['Monday', 'Wednesday']).toContain(busiest.day);
  });

  it('detects available shared windows', () => {
    expect(freeWindow(DEMO_SCHEDULE, 'Friday', '09:00', '12:00')).toBe(false);
    expect(freeWindow(DEMO_SCHEDULE, 'Friday', '18:00', '21:00')).toBe(true);
    expect(freeWindow(DEMO_SCHEDULE, 'Monday', '20:00', '22:00')).toBe(true);
  });
});
