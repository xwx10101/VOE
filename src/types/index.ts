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
