const PREFIX = 'familymind:';

export const KEYS = {
  profile: 'familymind:v1:profile',
  assessment: 'familymind:v1:assessment',
  plan: 'familymind:v1:plan',
  schedule: 'familymind:v1:schedule',
  memories: 'familymind:v1:memories',
  reminders: 'familymind:v1:reminders',
  introSeen: 'familymind:intro:seen:v1',
  sessionIntro: 'familymind:intro:session:v1',
} as const;

export const storageAvailable = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    const probe = `${PREFIX}probe`;
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
};

export function readJSON<T>(key: string, fallback: T, validate?: (value: unknown) => boolean): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed: unknown = JSON.parse(raw);
    if (validate && !validate(parsed)) return fallback;
    return parsed as T;
  } catch {
    return fallback;
  }
}

export function writeJSON<T>(key: string, value: T): boolean {
  if (typeof window === 'undefined') return false;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function removeKey(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* storage may be unavailable; the app stays usable in memory */
  }
}

export function clearAllLocalData(): void {
  if (typeof window === 'undefined') return;
  Object.values(KEYS).forEach(removeKey);
  try {
    Object.keys(window.localStorage)
      .filter((key) => key.startsWith(PREFIX))
      .forEach((key) => window.localStorage.removeItem(key));
  } catch {
    /* ignore */
  }
}

export function readSessionFlag(key: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.sessionStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}

export function writeSessionFlag(key: string, value = true): void {
  if (typeof window === 'undefined') return;
  try {
    if (value) window.sessionStorage.setItem(key, '1');
    else window.sessionStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

/** Minimal shape guards so corrupted storage never breaks a screen. */
export const guards = {
  isObject: (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null,
  hasMembers: (value: unknown): boolean =>
    guards.isObject(value) && Array.isArray((value as { members?: unknown }).members),
  hasNumberScore: (value: unknown): boolean =>
    guards.isObject(value) && typeof (value as { score?: unknown }).score === 'number',
  hasActions: (value: unknown): boolean =>
    guards.isObject(value) && Array.isArray((value as { actions?: unknown }).actions),
  isArray: (value: unknown): value is unknown[] => Array.isArray(value),
};
