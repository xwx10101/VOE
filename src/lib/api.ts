/*
 * ✏️ TEAM GUIDE: THE data layer — the only place that talks to persistence.
 * Phase 1 implementation: localStorage. Future backend (see docs/API_CONTRACT.md):
 * swap each function body for fetch() calls — signatures stay identical,
 * so stores & UI never change.
 *
 * Security note: passwords are stored as salted SHA-256 hashes (Web Crypto),
 * never in plain text. (Real auth still belongs on a server when we add one.)
 */
import { DATA_DOMAINS, DEMO_CREDENTIALS, STORAGE_KEYS, type DataDomain } from '@/config/app.config';
import { mockFamily } from '@/data/mockFamily';
import { buildMockHealth } from '@/data/mockHealth';
import { generateMockDoseLog, mockMedications } from '@/data/mockMedications';
import { mockSchedule } from '@/data/mockSchedule';
import { uid } from '@/lib/utils';
import type {
  DoseLogEntry,
  Family,
  HealthReading,
  Medication,
  ScheduleEvent,
  SessionUser,
  UserRecord,
} from '@/types';

/* ---------------------------------- errors --------------------------------- */

/** Error whose `code` maps to an i18n key under auth.errors.* */
export class AuthError extends Error {
  readonly code: string;
  constructor(code: string) {
    super(code);
    this.code = code;
  }
}

/* ------------------------------ storage helpers ----------------------------- */

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full / blocked — app keeps working in-memory */
  }
}

function readUsers(): UserRecord[] {
  return readJSON<UserRecord[]>(STORAGE_KEYS.users, []);
}

function writeUsers(users: UserRecord[]): void {
  writeJSON(STORAGE_KEYS.users, users);
}

function toSessionUser(user: UserRecord): SessionUser {
  return { id: user.id, name: user.name, email: user.email, onboarded: user.onboarded };
}

/** Update one field of a stored user record. */
function patchUser(id: string, patch: Partial<UserRecord>): UserRecord | null {
  const users = readUsers();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) return null;
  users[idx] = { ...users[idx]!, ...patch };
  writeUsers(users);
  return users[idx]!;
}

/* --------------------------------- hashing ---------------------------------- */

/** Salted SHA-256 via Web Crypto (salt = normalized email). */
async function sha256Hex(text: string): Promise<string> {
  const subtle = window.crypto?.subtle;
  if (subtle) {
    const digest = await subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  // Non-secure-context fallback (e.g. plain http on a LAN IP): FNV-1a + mixing.
  // NOT cryptographic — only used where Web Crypto is unavailable.
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0;
    h2 = Math.imul(h2 ^ (c + i), 0x85ebca6b) >>> 0;
  }
  return `fnv:${h1.toString(16)}:${h2.toString(16)}:${text.length}`;
}

async function hashPassword(email: string, password: string): Promise<string> {
  return sha256Hex(`${email.trim().toLowerCase()}::${password}`);
}

/* -------------------------------- demo seed --------------------------------- */

let seedPromise: Promise<void> | null = null;

/** Seed the full Al Mansouri story (family + medications + schedule + health). */
function seedDemoStory(userId: string): void {
  writeJSON(STORAGE_KEYS.family(userId), mockFamily);
  writeJSON(STORAGE_KEYS.data(userId, 'medications'), mockMedications);
  writeJSON(STORAGE_KEYS.data(userId, 'doseLog'), generateMockDoseLog(mockMedications));
  writeJSON(STORAGE_KEYS.data(userId, 'schedule'), mockSchedule);
  writeJSON(STORAGE_KEYS.data(userId, 'health'), buildMockHealth());
}

/** Ensure the one-click demo account exists exactly once. */
export function ensureDemoAccount(): Promise<void> {
  seedPromise ??= (async () => {
    const users = readUsers();
    if (users.some((u) => u.email === DEMO_CREDENTIALS.email)) {
      // Self-heal older installs (e.g. Phase 1) that predate domain seeding.
      try {
        if (window.localStorage.getItem(STORAGE_KEYS.data('user-demo', 'medications')) === null) {
          seedDemoStory('user-demo');
        }
      } catch {
        /* ignore */
      }
      return;
    }
    const demo: UserRecord = {
      id: 'user-demo',
      name: 'Al Mansouri',
      email: DEMO_CREDENTIALS.email,
      passwordHash: await hashPassword(DEMO_CREDENTIALS.email, DEMO_CREDENTIALS.password),
      createdAt: new Date().toISOString(),
      onboarded: true,
    };
    writeUsers([...users, demo]);
    seedDemoStory(demo.id);
  })();
  return seedPromise;
}

/* ----------------------------------- auth ----------------------------------- */

export async function registerAccount(
  name: string,
  email: string,
  password: string,
): Promise<SessionUser> {
  await ensureDemoAccount();
  const normalized = email.trim().toLowerCase();
  const users = readUsers();
  if (users.some((u) => u.email === normalized)) throw new AuthError('emailTaken');
  const user: UserRecord = {
    id: uid('user'),
    name: name.trim(),
    email: normalized,
    passwordHash: await hashPassword(normalized, password),
    createdAt: new Date().toISOString(),
    onboarded: false,
  };
  writeUsers([...users, user]);
  writeJSON(STORAGE_KEYS.session, user.id);
  return toSessionUser(user);
}

export async function loginAccount(email: string, password: string): Promise<SessionUser> {
  await ensureDemoAccount();
  const normalized = email.trim().toLowerCase();
  const user = readUsers().find((u) => u.email === normalized);
  if (!user) throw new AuthError('invalidCredentials');
  const hash = await hashPassword(normalized, password);
  if (hash !== user.passwordHash) throw new AuthError('invalidCredentials');
  writeJSON(STORAGE_KEYS.session, user.id);
  return toSessionUser(user);
}

/** Convenience wrapper for the one-click demo button. */
export async function loginDemo(): Promise<SessionUser> {
  return loginAccount(DEMO_CREDENTIALS.email, DEMO_CREDENTIALS.password);
}

/** Restore the current session user (or null for guests). */
export async function getSessionUser(): Promise<SessionUser | null> {
  await ensureDemoAccount();
  const id = readJSON<string | null>(STORAGE_KEYS.session, null);
  if (!id) return null;
  const user = readUsers().find((u) => u.id === id);
  return user ? toSessionUser(user) : null;
}

export function clearSession(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEYS.session);
  } catch {
    /* ignore */
  }
}

/** Mark onboarding as finished for this user. */
export function setOnboarded(userId: string): SessionUser | null {
  const updated = patchUser(userId, { onboarded: true });
  return updated ? toSessionUser(updated) : null;
}

/** Update the account holder's display name (Settings → Profile). */
export function updateUserProfile(userId: string, name: string): SessionUser | null {
  const updated = patchUser(userId, { name: name.trim() });
  return updated ? toSessionUser(updated) : null;
}

/* --------------------------- per-user data domains -------------------------- */

/** Load one persisted collection for a user ([] when nothing stored yet). */
export function loadCollection<T>(userId: string, domain: DataDomain): T[] {
  return readJSON<T[]>(STORAGE_KEYS.data(userId, domain), []);
}

/** Persist one collection for a user. */
export function saveCollection<T>(userId: string, domain: DataDomain, items: T[]): void {
  writeJSON(STORAGE_KEYS.data(userId, domain), items);
}

/** Everything we hold for one user — powers Settings "Export my data". */
export interface UserDataExport {
  exportedAt: string;
  app: string;
  user: SessionUser | null;
  family: Family | null;
  medications: Medication[];
  doseLog: DoseLogEntry[];
  schedule: ScheduleEvent[];
  health: HealthReading[];
}

export function exportUserData(userId: string): UserDataExport {
  const record = readUsers().find((u) => u.id === userId);
  return {
    exportedAt: new Date().toISOString(),
    app: 'NasmaCare',
    user: record ? toSessionUser(record) : null,
    family: loadFamily(userId),
    medications: loadCollection<Medication>(userId, 'medications'),
    doseLog: loadCollection<DoseLogEntry>(userId, 'doseLog'),
    schedule: loadCollection<ScheduleEvent>(userId, 'schedule'),
    health: loadCollection<HealthReading>(userId, 'health'),
  };
}

/**
 * Reset a user's data (Settings → Danger zone).
 * Demo account: restore the pristine Al Mansouri story (great for re-demos).
 * Custom account: wipe family + collections and require onboarding again.
 */
export function resetUserData(userId: string): SessionUser | null {
  if (userId === 'user-demo') {
    seedDemoStory(userId);
    const record = readUsers().find((u) => u.id === userId);
    return record ? toSessionUser(record) : null;
  }
  try {
    window.localStorage.removeItem(STORAGE_KEYS.family(userId));
    for (const domain of DATA_DOMAINS) {
      window.localStorage.removeItem(STORAGE_KEYS.data(userId, domain));
    }
  } catch {
    /* ignore */
  }
  const updated = patchUser(userId, { onboarded: false });
  return updated ? toSessionUser(updated) : null;
}

/* ---------------------------------- family ---------------------------------- */

export function loadFamily(userId: string): Family | null {
  return readJSON<Family | null>(STORAGE_KEYS.family(userId), null);
}

export function saveFamily(userId: string, family: Family): void {
  writeJSON(STORAGE_KEYS.family(userId), family);
}

/* ------------------------------ validation utils ---------------------------- */

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

/** Password strength score 0–4 (length, cases, digit, symbol/length bonus). */
export function passwordStrength(password: string): number {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password) || password.length >= 12) score++;
  return score;
}
