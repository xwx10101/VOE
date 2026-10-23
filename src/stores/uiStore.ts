/*
 * ✏️ TEAM GUIDE: UI preferences — currently the color theme (class strategy,
 * persisted). Light is the default; dark adds `.dark` to <html>.
 */
import { create } from 'zustand';
import { STORAGE_KEYS } from '@/config/app.config';

export type ThemeMode = 'light' | 'dark';

function initialTheme(): ThemeMode {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEYS.theme);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    /* ignore */
  }
  return 'light'; // brand default per design system
}

function applyTheme(theme: ThemeMode): void {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.documentElement.style.colorScheme = theme;
  try {
    window.localStorage.setItem(STORAGE_KEYS.theme, theme);
  } catch {
    /* ignore */
  }
}

function initialSidebarCollapsed(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEYS.sidebar) === 'collapsed';
  } catch {
    return false;
  }
}

interface UiState {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  /** Desktop sidebar: expanded (272px) vs icon rail (76px). Persisted. */
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
}

export const useUiStore = create<UiState>()((set, get) => ({
  theme: initialTheme(),
  setTheme: (theme) => {
    applyTheme(theme);
    set({ theme });
  },
  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    set({ theme: next });
  },
  sidebarCollapsed: initialSidebarCollapsed(),
  setSidebarCollapsed: (collapsed) => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.sidebar, collapsed ? 'collapsed' : 'expanded');
    } catch {
      /* ignore */
    }
    set({ sidebarCollapsed: collapsed });
  },
  toggleSidebar: () => get().setSidebarCollapsed(!get().sidebarCollapsed),
}));

/** Apply the persisted theme before first paint (called from main.tsx). */
export function initTheme(): void {
  applyTheme(useUiStore.getState().theme);
}
