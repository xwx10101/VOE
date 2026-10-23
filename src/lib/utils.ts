/*
 * ✏️ TEAM GUIDE: Small shared helpers. `cn` merges Tailwind classes safely
 * (clsx + tailwind-merge) and is used by every UI component.
 */
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Lang, LocalizedString } from '@/types';

/** Merge class names, resolving Tailwind conflicts (last wins). */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Short unique id for locally-created records. */
export function uid(prefix = 'id'): string {
  const rand =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${rand}`;
}

/** Clamp a number between min and max (inclusive). */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Pick the right language from a LocalizedString (falls back gracefully). */
export function localized(value: LocalizedString, lang: Lang): string {
  return value[lang] || value.en || value.ar;
}

/**
 * Deterministic pleasant color for avatar initials, derived from the name.
 * Returns an HSL string so it works in both light and dark themes.
 */
export function hashColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue} 65% 45%)`;
}

/** First letters (up to 2) of a display name, for avatar initials. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0]?.charAt(0) ?? '';
  const second = parts.length > 1 ? (parts[parts.length - 1]?.charAt(0) ?? '') : '';
  return (first + second).toUpperCase();
}

/** i18n key for a time-aware greeting, based on the local hour. */
export function greetingKey(date = new Date()): 'greetings.morning' | 'greetings.afternoon' | 'greetings.evening' {
  const h = date.getHours();
  if (h < 12) return 'greetings.morning';
  if (h < 18) return 'greetings.afternoon';
  return 'greetings.evening';
}
