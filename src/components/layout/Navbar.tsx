/*
 * ✏️ TEAM GUIDE: Public marketing navbar (landing page).
 * Transparent at the top → glass on scroll. Mobile menu included.
 * Logged-in users see a "Dashboard" shortcut instead of auth buttons.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import { LayoutDashboard, Menu, X } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { href: '#pillars', key: 'nav.pillars' },
  { href: '#features', key: 'nav.features' },
  { href: '#how-it-works', key: 'nav.howAiWorks' },
  { href: '#stories', key: 'nav.stories' },
] as const;

export function Navbar() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-300',
        scrolled ? 'glass shadow-soft' : 'bg-transparent',
      )}
    >
      <div className="container flex h-[4.25rem] items-center justify-between gap-3">
        <Link to="/" aria-label={t('brand.tagline')} className="shrink-0">
          <Logo variant="compact" />
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-lg px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
            >
              {t(link.key)}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitcher className="hidden sm:inline-flex" />
          <ThemeToggle className="hidden sm:inline-flex" />
          {user ? (
            <Button asChild variant="gradient" size="sm" className="h-10 px-4">
              <Link to={user.onboarded ? '/dashboard' : '/onboarding'}>
                <LayoutDashboard aria-hidden="true" />
                <span className="hidden md:inline">{t('notFound.goDashboard')}</span>
              </Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden h-10 px-4 md:inline-flex">
                <Link to="/login">{t('common.login')}</Link>
              </Button>
              <Button asChild variant="gradient" size="sm" className="hidden h-10 px-4 sm:inline-flex">
                <Link to="/register">{t('common.getStarted')}</Link>
              </Button>
            </>
          )}
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-label={t('nav.menu')}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background/60 backdrop-blur transition hover:border-primary/40 hover:text-primary lg:hidden"
          >
            {menuOpen ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen ? (
          <motion.nav
            aria-label="Mobile"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="glass overflow-hidden lg:hidden"
          >
            <div className="container flex flex-col gap-1 py-4">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted"
                >
                  {t(link.key)}
                </a>
              ))}
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border/70 pt-4">
                <LanguageSwitcher />
                <ThemeToggle />
                {!user ? (
                  <>
                    <Button asChild variant="outline" className="flex-1">
                      <Link to="/login">{t('common.login')}</Link>
                    </Button>
                    <Button asChild variant="gradient" className="flex-1">
                      <Link to="/register">{t('common.getStarted')}</Link>
                    </Button>
                  </>
                ) : null}
              </div>
            </div>
          </motion.nav>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
