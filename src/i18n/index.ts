/*
 * ✏️ TEAM GUIDE: Internationalization engine (react-i18next).
 * - ALL user-facing strings live in locales/en.json & locales/ar.json.
 * - Arabic automatically flips the whole app to RTL (dir="rtl" on <html>).
 * - The chosen language persists in localStorage. Default: Arabic.
 * To add a string: add the key to BOTH json files, then use t('your.key').
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import ar from './locales/ar.json';
import { DEFAULT_LANGUAGE, STORAGE_KEYS } from '@/config/app.config';
import type { Lang } from '@/types';

/** Type-safe translation keys, derived from the English source file. */
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: {
      translation: typeof en;
    };
  }
}

/** Read the persisted language (falls back to the configured default). */
function initialLanguage(): Lang {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEYS.language);
    if (saved === 'ar' || saved === 'en') return saved;
  } catch {
    /* localStorage unavailable (private mode) — use default */
  }
  return DEFAULT_LANGUAGE;
}

/** Apply lang/dir to the document so layout mirrors instantly. */
export function applyDocumentLanguage(lang: Lang): void {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
}

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ar: { translation: ar },
  },
  lng: initialLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

// Keep <html> in sync on first load and on every language change.
applyDocumentLanguage(i18n.language as Lang);
i18n.on('languageChanged', (lng) => {
  const lang = (lng === 'ar' ? 'ar' : 'en') as Lang;
  applyDocumentLanguage(lang);
  try {
    window.localStorage.setItem(STORAGE_KEYS.language, lang);
  } catch {
    /* ignore persistence errors */
  }
});

/** Switch the whole app language (and direction) instantly. */
export async function setLanguage(lang: Lang): Promise<void> {
  await i18n.changeLanguage(lang);
}

export default i18n;
