/*
 * ✏️ TEAM GUIDE: Entry point. Loads i18n + theme BEFORE first paint so there
 * is no flash of wrong language/direction, then mounts the app.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@/i18n'; // initializes languages + <html lang/dir>
import { initTheme } from '@/stores/uiStore';
import '@/index.css';
import App from '@/App';

initTheme();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
