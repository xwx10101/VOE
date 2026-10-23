/*
 * ✏️ TEAM GUIDE: Central app configuration — edit product-wide settings HERE only.
 * App name, demo credentials, module registry, storage keys and feature flags.
 * Note: brand colors live in src/index.css (CSS variables) + tailwind.config.ts.
 */
import type { Lang, LocalizedString, ModuleId } from '@/types';

export const APP_NAME: LocalizedString = { en: 'NasmaCare', ar: 'نسمة كير' };

/** Default UI language on first visit (Arabic-first, switchable anytime). */
export const DEFAULT_LANGUAGE: Lang = 'ar';
export const SUPPORTED_LANGUAGES: Lang[] = ['ar', 'en'];

/** One-click demo account (seeded automatically on first run). */
export const DEMO_CREDENTIALS = {
  email: 'demo@nasmacare.com',
  password: 'demo1234',
} as const;

/** Module registry: route + whether it is on by default for new families. */
export interface ModuleMeta {
  id: ModuleId;
  route: string;
  defaultEnabled: boolean;
}

export const MODULES: ModuleMeta[] = [
  { id: 'medications', route: '/medications', defaultEnabled: true },
  { id: 'meals', route: '/meals', defaultEnabled: true },
  { id: 'schedule', route: '/schedule', defaultEnabled: true },
  { id: 'safety', route: '/safety', defaultEnabled: true },
  { id: 'assistant', route: '/assistant', defaultEnabled: true },
];

export const DEFAULT_MODULES: ModuleId[] = MODULES.filter((m) => m.defaultEnabled).map(
  (m) => m.id,
);

/** localStorage keys (versioned so future migrations stay safe). */
export const STORAGE_KEYS = {
  users: 'nasmacare:v1:users',
  session: 'nasmacare:v1:session',
  family: (userId: string) => `nasmacare:v1:family:${userId}`,
  language: 'nasmacare:v1:language',
  theme: 'nasmacare:v1:theme',
} as const;

/** Feature flags — flip to enable/disable whole experiences without code changes. */
export const FEATURE_FLAGS = {
  /** Floating Nasma AI chat widget (built in Phase 5). */
  assistantWidget: true,
  /** PWA install prompt & offline shell (wired in Phase 6). */
  pwa: false,
} as const;

/** Brand palette reference (mirrors index.css tokens — for charts/canvas use). */
export const BRAND_COLORS = {
  teal: '#0D9488',
  violet: '#8B5CF6',
  amber: '#F59E0B',
  ink: '#0B1120',
  paper: '#F8FAFC',
} as const;
