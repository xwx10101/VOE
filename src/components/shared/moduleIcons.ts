/*
 * ✏️ TEAM GUIDE: Icon per product module (single place to change them).
 * Used by the landing bento grid, onboarding, register flow and later the sidebar.
 */
import { CalendarDays, HeartPulse, Pill, Sparkles, UtensilsCrossed, type LucideIcon } from 'lucide-react';
import type { ModuleId } from '@/types';

export const MODULE_ICONS: Record<ModuleId, LucideIcon> = {
  medications: Pill,
  meals: UtensilsCrossed,
  schedule: CalendarDays,
  safety: HeartPulse,
  assistant: Sparkles,
};

/** Soft background tint per module (Tailwind classes, theme-safe). */
export const MODULE_TINTS: Record<ModuleId, string> = {
  medications: 'bg-primary/12 text-primary',
  meals: 'bg-brand-amber/18 text-amber-700 dark:text-brand-amber',
  schedule: 'bg-sky-500/12 text-sky-600 dark:text-sky-400',
  safety: 'bg-rose-500/12 text-rose-600 dark:text-rose-400',
  assistant: 'bg-brand-violet/15 text-brand-violet',
};
