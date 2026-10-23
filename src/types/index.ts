/*
 * ✏️ TEAM GUIDE: All shared TypeScript types live here (single source of truth).
 * Add new domain types in this file so stores, AI modules and components stay in sync.
 */

/** Supported UI languages. 'ar' renders RTL, 'en' renders LTR. */
export type Lang = 'ar' | 'en';

/** A string available in both languages (used for data like family member names). */
export interface LocalizedString {
  ar: string;
  en: string;
}

/** The five product modules. Used for onboarding toggles, sidebar and feature flags. */
export type ModuleId = 'medications' | 'meals' | 'schedule' | 'safety' | 'assistant';

/** Relationship of a member to the account holder. Keys map to i18n "relations.*". */
export type Relation =
  | 'self'
  | 'spouse'
  | 'father'
  | 'mother'
  | 'son'
  | 'daughter'
  | 'grandfather'
  | 'grandmother'
  | 'other';

/** One person in the household. */
export interface FamilyMember {
  id: string;
  name: LocalizedString;
  age: number;
  relation: Relation;
  /** Condition keys (see i18n "conditions.*"), e.g. 'diabetes'. Free strings also allowed. */
  conditions: string[];
  /** Allergy keys (see i18n "allergies.*"), e.g. 'nuts'. Free strings also allowed. */
  allergies: string[];
}

/** The household: name, members and which modules are switched on. */
export interface Family {
  id: string;
  name: LocalizedString;
  members: FamilyMember[];
  enabledModules: ModuleId[];
}

/** Persisted user record (includes the SHA-256 password hash — never the raw password). */
export interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string; // ISO date
  onboarded: boolean;
}

/** Safe user shape kept in app state (no password hash). */
export interface SessionUser {
  id: string;
  name: string;
  email: string;
  onboarded: boolean;
}

/* ------------------------------ Medications ------------------------------ */

/** Physical form of a medication (keys map to i18n "medForms.*"). */
export type MedicationForm = 'tablet' | 'capsule' | 'inhaler' | 'drops' | 'syrup' | 'injection';

/** A medication prescribed to one family member. */
export interface Medication {
  id: string;
  memberId: string;
  name: LocalizedString;
  /** e.g. "850mg", "5mg", "2 puffs" — display string (data, not UI copy). */
  dosage: string;
  form: MedicationForm;
  /** Daily dose times in 24h "HH:MM". Empty when `asNeeded` is true. */
  times: string[];
  asNeeded: boolean;
  instructions: LocalizedString;
  /** Pills/units currently at home (drives the refill countdown). */
  supplyRemaining: number;
  /** Units taken per dose. */
  unitsPerDose: number;
  startDate: string; // ISO date key YYYY-MM-DD
}

export type DoseStatus = 'taken' | 'missed' | 'skipped';

/** One recorded dose outcome (taken/missed/skipped) for a scheduled slot. */
export interface DoseLogEntry {
  id: string;
  medicationId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM (the scheduled slot)
  status: DoseStatus;
}

/* ------------------------------- Schedule -------------------------------- */

/** Event category (keys map to i18n "categories.*"). */
export type EventCategory = 'school' | 'work' | 'medical' | 'sport' | 'family' | 'other';

/** A weekly recurring family event (dayOfWeek: 0 = Sunday … 6 = Saturday). */
export interface ScheduleEvent {
  id: string;
  memberId: string;
  title: LocalizedString;
  dayOfWeek: number;
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  category: EventCategory;
  location?: LocalizedString;
  /**
   * Optional companion who must also be free (e.g. who drives Grandma to the
   * clinic). The conflict engine checks the companion's calendar too.
   */
  withMemberId?: string;
}

/* --------------------------------- Health --------------------------------- */

/** One day of elder health readings (BP + fasting glucose). */
export interface HealthReading {
  id: string;
  memberId: string;
  date: string; // YYYY-MM-DD
  systolic: number; // mmHg
  diastolic: number; // mmHg
  glucoseMgDl: number; // fasting
}

/* -------------------------------- Insights -------------------------------- */

export type InsightCategory =
  | 'medication'
  | 'nutrition'
  | 'activity'
  | 'sleep'
  | 'hydration'
  | 'eldercare'
  | 'mindset'
  | 'familyTime';

/** A bilingual wellness insight shown on the dashboard (and by the assistant). */
export interface Insight {
  id: string;
  category: InsightCategory;
  title: LocalizedString;
  body: LocalizedString;
}
