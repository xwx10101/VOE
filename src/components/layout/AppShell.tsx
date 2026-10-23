/*
 * ✏️ TEAM GUIDE: Authenticated app shell — Sidebar + Topbar + animated page
 * outlet. Mobile gets a slide-in drawer (direction-aware). Page transitions
 * use the useOutlet()+cloneElement pattern so the shell itself never remounts.
 */
import { cloneElement, useEffect, useState } from 'react';
import { useLocation, useOutlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import { Sidebar, SidebarContent } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';

export function AppShell() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const element = useOutlet();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isRTL = i18n.language === 'ar';

  // Close the mobile drawer on navigation & lock body scroll while open.
  useEffect(() => setDrawerOpen(false), [location.pathname]);
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [drawerOpen]);

  return (
    <div className="mesh-bg flex min-h-svh">
      <a
        href="#app-main"
        className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        {t('a11y.skipToContent')}
      </a>

      <Sidebar />

      {/* Mobile drawer */}
      <AnimatePresence>
        {drawerOpen ? (
          <>
            <motion.div
              key="drawer-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-sm lg:hidden"
              aria-hidden="true"
            />
            <motion.aside
              key="drawer-panel"
              role="dialog"
              aria-modal="true"
              aria-label={t('shell.mainNav')}
              initial={{ x: isRTL ? '105%' : '-105%' }}
              animate={{ x: 0 }}
              exit={{ x: isRTL ? '105%' : '-105%' }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-y-0 start-0 z-50 w-[17.5rem] border-e border-border/70 bg-card shadow-bloom lg:hidden"
            >
              <SidebarContent
                expanded
                variant="mobile"
                onNavigate={() => setDrawerOpen(false)}
                onClose={() => setDrawerOpen(false)}
              />
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenuClick={() => setDrawerOpen(true)} />
        <main id="app-main" className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <AnimatePresence mode="wait" initial={false}>
            {element ? cloneElement(element, { key: location.pathname }) : null}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
