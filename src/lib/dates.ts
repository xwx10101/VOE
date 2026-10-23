/*
 * ✏️ TEAM GUIDE: Date/time helpers used by every module.
 * - Dates are stored as local "YYYY-MM-DD" keys (timezone-safe for a household app).
 * - Display formatting goes through Intl, so Arabic shows Latin numerals
 *   (ar-AE-u-nu-latn) like UAE health apps, with Arabic day/month names.
 */
import type { Lang } from '@/types';

const LOCALES: Record<Lang, string> = { ar: 'ar-AE-u-nu-latn', en: 'en-US' };

/** Local date → "YYYY-MM-DD" key. */
export function dateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayKey(): string {
  return dateKey(new Date());
}

/** "YYYY-MM-DD" → local Date at midnight. */
export function parseKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

/** Add days to a Date (returns a new Date). */
export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** Add days to a date key. */
export function addDaysToKey(key: string, days: number): string {
  return dateKey(addDays(parseKey(key), days));
}

/** Whole-day difference b − a (in days). */
export function diffDays(aKey: string, bKey: string): number {
  const ms = parseKey(bKey).getTime() - parseKey(aKey).getTime();
  return Math.round(ms / 86_400_000);
}

/** "HH:MM" (24h) → minutes since midnight. */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

/** Minutes since midnight → "HH:MM" (24h). */
export function minutesToTime(minutes: number): string {
  const clamped = Math.max(0, Math.min(1439, Math.round(minutes)));
  const h = String(Math.floor(clamped / 60)).padStart(2, '0');
  const m = String(clamped % 60).padStart(2, '0');
  return `${h}:${m}`;
}

/** Minutes since midnight right now. */
export function nowMinutes(): number {
  const n = new Date();
  return n.getHours() * 60 + n.getMinutes();
}

/** Format a stored "HH:MM" for display, e.g. "8:00 AM" / "8:00 ص". */
export function formatTime(time: string, lang: Lang): string {
  const [h, m] = time.split(':').map(Number);
  const d = new Date();
  d.setHours(h ?? 0, m ?? 0, 0, 0);
  return new Intl.DateTimeFormat(LOCALES[lang], {
    hour: 'numeric',
    minute: '2-digit',
  }).format(d);
}

/** Full friendly date for headers, e.g. "Thursday, 23 October 2026" / Arabic equivalent. */
export function formatFullDate(date: Date, lang: Lang): string {
  return new Intl.DateTimeFormat(LOCALES[lang], {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

/** Short date, e.g. "23 Oct" / "23 أكتوبر". */
export function formatShortDate(key: string, lang: Lang): string {
  return new Intl.DateTimeFormat(LOCALES[lang], { day: 'numeric', month: 'short' }).format(
    parseKey(key),
  );
}

/** Weekday name for a JS day (0=Sunday … 6=Saturday). */
export function weekdayName(dayOfWeek: number, lang: Lang, style: 'long' | 'short' = 'short'): string {
  // 2026-10-25 is a Sunday — a stable anchor for weekday names.
  const anchor = new Date(2026, 9, 25 + dayOfWeek);
  return new Intl.DateTimeFormat(LOCALES[lang], { weekday: style }).format(anchor);
}

/** Monday-first week order used by schedule UIs (UAE work week Mon–Fri). */
export const WEEK_ORDER_MONDAY_FIRST = [1, 2, 3, 4, 5, 6, 0] as const;

/** Day of year (1–366) — used to rotate daily insights deterministically. */
export function dayOfYear(date = new Date()): number {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date.getTime() - start.getTime()) / 86_400_000);
}
