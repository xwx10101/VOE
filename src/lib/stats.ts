/*
 * ✏️ TEAM GUIDE: Pure derived-statistics helpers (no state, no storage).
 * The dashboard, medications page and AI assistant all read through here so
 * numbers agree everywhere. Everything is deterministic & unit-testable.
 */
import { addDaysToKey, nowMinutes, timeToMinutes, todayKey } from '@/lib/dates';
import type { DoseLogEntry, Medication } from '@/types';

/** Display status for one scheduled dose slot. */
export type DerivedDoseStatus = 'taken' | 'missed' | 'skipped' | 'due' | 'upcoming';

export interface DayDose {
  medication: Medication;
  time: string; // HH:MM slot
  date: string; // YYYY-MM-DD
  status: DerivedDoseStatus;
}

/** Grace window: a dose becomes "missed" 60 minutes after its slot. */
const GRACE_MINUTES = 60;

/** Expand a day's scheduled doses with their live statuses, sorted by time. */
export function buildDayDoses(
  medications: Medication[],
  doseLog: DoseLogEntry[],
  date: string,
): DayDose[] {
  const today = todayKey();
  const now = nowMinutes();
  const logBySlot = new Map(
    doseLog
      .filter((e) => e.date === date)
      .map((e) => [`${e.medicationId}|${e.time}`, e.status] as const),
  );
  const doses: DayDose[] = [];
  for (const med of medications) {
    if (med.asNeeded || med.startDate > date) continue;
    for (const time of med.times) {
      const logged = logBySlot.get(`${med.id}|${time}`);
      let status: DerivedDoseStatus;
      if (logged) status = logged;
      else if (date < today) status = 'missed';
      else if (date > today) status = 'upcoming';
      else {
        const slot = timeToMinutes(time);
        status = slot <= now - GRACE_MINUTES ? 'missed' : slot <= now + 30 ? 'due' : 'upcoming';
      }
      doses.push({ medication: med, time, date, status });
    }
  }
  return doses.sort(
    (a, b) =>
      timeToMinutes(a.time) - timeToMinutes(b.time) ||
      a.medication.name.en.localeCompare(b.medication.name.en),
  );
}

export interface AdherenceReport {
  /** 0–100, or null when nothing was scheduled in the window. */
  pct: number | null;
  /** Per-day percentages, oldest → newest (for sparklines). nulls = no doses. */
  perDay: Array<number | null>;
  taken: number;
  total: number;
}

/**
 * Adherence over the last `days` days (today counts only slots already due).
 * Optionally restrict to one member or one medication.
 */
export function adherenceReport(
  medications: Medication[],
  doseLog: DoseLogEntry[],
  days = 7,
  filter?: { memberId?: string; medicationId?: string },
): AdherenceReport {
  const meds = medications.filter(
    (m) =>
      !m.asNeeded &&
      (!filter?.memberId || m.memberId === filter.memberId) &&
      (!filter?.medicationId || m.id === filter.medicationId),
  );
  const today = todayKey();
  const now = nowMinutes();
  const perDay: Array<number | null> = [];
  let taken = 0;
  let total = 0;

  for (let back = days - 1; back >= 0; back--) {
    const date = addDaysToKey(today, -back);
    let dayTaken = 0;
    let dayTotal = 0;
    for (const dose of buildDayDoses(meds, doseLog, date)) {
      const isFutureToday = date === today && timeToMinutes(dose.time) > now;
      if (isFutureToday) continue;
      dayTotal++;
      if (dose.status === 'taken') dayTaken++;
    }
    taken += dayTaken;
    total += dayTotal;
    perDay.push(dayTotal === 0 ? null : Math.round((dayTaken / dayTotal) * 100));
  }

  return {
    pct: total === 0 ? null : Math.round((taken / total) * 100),
    perDay,
    taken,
    total,
  };
}

/** Days of supply left before a refill is needed (Infinity for as-needed meds). */
export function refillDaysLeft(med: Medication): number {
  const perDay = med.asNeeded ? 0 : med.times.length * med.unitsPerDose;
  if (perDay === 0) return Number.POSITIVE_INFINITY;
  return Math.floor(med.supplyRemaining / perDay);
}

export type RiskLevel = 'low' | 'medium' | 'high';

export interface DoseRisk {
  /** 0–100 (higher = more likely to be missed). */
  score: number;
  level: RiskLevel;
}

/**
 * Missed-dose risk score for one medication — explainable blend of:
 * 70% inverse 7-day adherence + 30% miss-rate over the last 3 days
 * (recent behavior predicts near-future behavior).
 */
export function missedDoseRisk(med: Medication, doseLog: DoseLogEntry[]): DoseRisk {
  if (med.asNeeded) return { score: 0, level: 'low' };
  const week = adherenceReport([med], doseLog, 7, { medicationId: med.id });
  const invAdherence = week.pct === null ? 0 : 100 - week.pct;

  const today = todayKey();
  let recentMissed = 0;
  let recentTotal = 0;
  for (let back = 0; back < 3; back++) {
    for (const dose of buildDayDoses([med], doseLog, addDaysToKey(today, -back))) {
      if (dose.status === 'upcoming' || dose.status === 'due') continue;
      recentTotal++;
      if (dose.status === 'missed') recentMissed++;
    }
  }
  const recentMissRate = recentTotal ? (recentMissed / recentTotal) * 100 : 0;
  const score = Math.round(invAdherence * 0.7 + recentMissRate * 0.3);
  return { score, level: score > 40 ? 'high' : score >= 15 ? 'medium' : 'low' };
}

/** How often an evening (≥18:00) dose was missed in the last `days` days. */
export function eveningMissCount(med: Medication, doseLog: DoseLogEntry[], days = 7): number {
  const from = addDaysToKey(todayKey(), -(days - 1));
  return doseLog.filter(
    (e) =>
      e.medicationId === med.id &&
      e.status === 'missed' &&
      e.date >= from &&
      timeToMinutes(e.time) >= 18 * 60,
  ).length;
}
