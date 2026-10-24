import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { ArrowRight, Menu, Sparkles, X } from 'lucide-react';
import { Brand } from '@/components/layout/Brand';
import { PUBLIC_NAV } from '@/data/navigation';
import { LinkButton } from '@/components/shared/Button';

function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    restoreRef.current = document.activeElement as HTMLElement;
    const panel = panelRef.current;
    panel?.querySelector<HTMLAnchorElement>('a')?.focus();
    document.body.style.overflow = 'hidden';

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key !== 'Tab' || !panel) return;
      const focusable = panel.querySelectorAll<HTMLElement>('a, button');
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      restoreRef.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[110] lg:hidden">
      <div className="absolute inset-0 bg-ink/45" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Site navigation"
        className="absolute inset-y-0 right-0 flex w-[86%] max-w-sm flex-col bg-white p-5 shadow-lift"
      >
        <div className="flex items-center justify-between">
          <Brand />
          <button type="button" onClick={onClose} className="btn btn-sm border border-border text-muted">
            <X aria-hidden="true" className="h-4 w-4" />
            <span className="sr-only">Close navigation</span>
          </button>
        </div>
        <nav aria-label="Primary" className="mt-6 flex-1 overflow-y-auto">
          <ul className="space-y-1">
            {PUBLIC_NAV.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex min-h-[46px] items-center justify-between rounded-control px-3 text-sm font-medium transition ${
                      isActive ? 'bg-royal/[0.07] text-royal' : 'text-ink hover:bg-canvas'
                    }`
                  }
                >
                  {item.label}
                  <ArrowRight aria-hidden="true" className="h-4 w-4 opacity-40" />
                </NavLink>
              </li>
            ))}
            <li>
              <NavLink
                to="/student"
                onClick={onClose}
                className="flex min-h-[46px] items-center justify-between rounded-control px-3 text-sm font-medium text-ink hover:bg-canvas"
              >
                Student Support
                <ArrowRight aria-hidden="true" className="h-4 w-4 opacity-40" />
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/care"
                onClick={onClose}
                className="flex min-h-[46px] items-center justify-between rounded-control px-3 text-sm font-medium text-ink hover:bg-canvas"
              >
                Older Adult Care
                <ArrowRight aria-hidden="true" className="h-4 w-4 opacity-40" />
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/memories"
                onClick={onClose}
                className="flex min-h-[46px] items-center justify-between rounded-control px-3 text-sm font-medium text-ink hover:bg-canvas"
              >
                Memory Vault
                <ArrowRight aria-hidden="true" className="h-4 w-4 opacity-40" />
              </NavLink>
            </li>
          </ul>
        </nav>
        <Link
          to="/demo"
          onClick={onClose}
          className="btn-signal mt-4 w-full"
        >
          <Sparkles aria-hidden="true" className="h-4 w-4" />
          Launch guided demo
        </Link>
      </div>
    </div>
  );
}

export function PublicLayout() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    setOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="skip-link">
        Skip to main content
      </a>
      <header className="sticky top-0 z-[100] border-b border-border/80 bg-white/85 backdrop-blur-md">
        <div className="container-page flex h-16 items-center justify-between gap-4">
          <Brand />
          <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
            {PUBLIC_NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `rounded-full px-3.5 py-2 text-[13px] font-medium transition ${
                    isActive ? 'bg-royal/[0.07] text-royal' : 'text-muted hover:bg-canvas hover:text-ink'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <LinkButton to="/demo" variant="primary" size="sm" className="hidden sm:inline-flex">
              <Sparkles aria-hidden="true" className="h-3.5 w-3.5" />
              Launch Demo
            </LinkButton>
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-expanded={open}
              aria-controls="mobile-navigation"
              className="btn btn-sm border border-border text-ink lg:hidden"
            >
              <Menu aria-hidden="true" className="h-4 w-4" />
              <span className="sr-only">Open navigation</span>
            </button>
          </div>
        </div>
      </header>
      <div id="mobile-navigation">
        <MobileDrawer open={open} onClose={() => setOpen(false)} />
      </div>
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-border bg-white">
        <div className="container-page grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Brand />
            <p className="mt-3 max-w-xs text-[13px] leading-relaxed text-muted">
              Responsible AI for family wellbeing. Built for multi-generational households in the UAE.
            </p>
          </div>
          <div>
            <p className="stat-label mb-3">Product</p>
            <ul className="space-y-2 text-[13px] text-muted">
              <li><Link className="hover:text-ink" to="/assessment">Family assessment</Link></li>
              <li><Link className="hover:text-ink" to="/dashboard">Family dashboard</Link></li>
              <li><Link className="hover:text-ink" to="/plan">Weekly plan</Link></li>
              <li><Link className="hover:text-ink" to="/coach">AI Family Coach</Link></li>
            </ul>
          </div>
          <div>
            <p className="stat-label mb-3">Support</p>
            <ul className="space-y-2 text-[13px] text-muted">
              <li><Link className="hover:text-ink" to="/student">Student Support</Link></li>
              <li><Link className="hover:text-ink" to="/care">Older Adult Care</Link></li>
              <li><Link className="hover:text-ink" to="/memories">Memory Vault</Link></li>
              <li><Link className="hover:text-ink" to="/trust">Trust &amp; Safety</Link></li>
            </ul>
          </div>
          <div>
            <p className="stat-label mb-3">Prototype</p>
            <p className="text-[13px] leading-relaxed text-muted">
              Demonstration project for an AI innovation competition. Not a medical device. Does not
              monitor emergencies.
            </p>
            <Link to="/demo" className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-royal">
              Guided judge demo
              <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
        <div className="border-t border-border">
          <div className="container-page flex flex-col gap-2 py-4 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 FamilyMind AI · Prototype, not a clinical service.</p>
            <p>Understand the signals. Strengthen the family.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
