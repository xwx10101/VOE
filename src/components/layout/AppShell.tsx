import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { ArrowUpRight, Menu, RotateCcw, Sparkles, X } from 'lucide-react';
import { Brand } from '@/components/layout/Brand';
import { APP_NAV } from '@/data/navigation';
import { useFamily } from '@/state/FamilyContext';
import { ToastStack } from '@/components/shared/Feedback';

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <ul className="space-y-1">
      {APP_NAV.map((item) => {
        const Icon = item.icon;
        return (
          <li key={item.to}>
            <NavLink
              to={item.to}
              onClick={onNavigate}
              className={({ isActive }) =>
                `group flex items-start gap-3 rounded-control px-3 py-2.5 text-sm transition ${
                  isActive
                    ? 'bg-royal text-white shadow-soft'
                    : 'text-ink/80 hover:bg-canvas hover:text-ink'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    aria-hidden="true"
                    className={`mt-0.5 h-4 w-4 shrink-0 ${isActive ? 'text-teal' : 'text-muted group-hover:text-royal'}`}
                  />
                  <span>
                    <span className="block font-medium leading-tight">{item.label}</span>
                    <span
                      className={`mt-0.5 block text-[11px] leading-tight ${
                        isActive ? 'text-white/65' : 'text-muted'
                      }`}
                    >
                      {item.description}
                    </span>
                  </span>
                </>
              )}
            </NavLink>
          </li>
        );
      })}
    </ul>
  );
}

export function AppShell() {
  const { profile, resetDemoHousehold, pushToast, toasts, dismissToast, result } = useFamily();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const restoreRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    restoreRef.current = document.activeElement as HTMLElement;
    const panel = document.getElementById('app-drawer-panel');
    panel?.querySelector<HTMLElement>('button, a')?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
      if (event.key !== 'Tab' || !panel) return;
      const focusable = panel.querySelectorAll<HTMLElement>('a, button, input, select, textarea');
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
      restoreRef.current?.focus();
    };
  }, [open]);

  return (
    <div className="min-h-dvh bg-canvas">
      <a href="#main" className="skip-link">
        Skip to main content
      </a>

      <div className="mx-auto flex w-full max-w-[1440px]">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-dvh w-[268px] shrink-0 flex-col border-r border-border bg-white/90 px-4 py-5 lg:flex">
          <Brand />
          <div className="mt-5 rounded-control border border-border bg-canvas/70 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Household</p>
            <p className="mt-1 font-display text-sm font-semibold text-ink">
              {profile.isDemo ? 'Al Noor family' : profile.familyName || 'Your family'}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-1">
              {profile.members.slice(0, 6).map((member) => (
                <span
                  key={member.id}
                  title={`${member.name} · ${member.role}`}
                  className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-ink"
                  style={{ backgroundColor: `${member.avatarColor}33`, border: `1px solid ${member.avatarColor}` }}
                >
                  {member.name.charAt(0)}
                </span>
              ))}
              {profile.members.length === 0 ? (
                <span className="text-[11px] text-muted">No members yet</span>
              ) : null}
            </div>
            <p className="mt-2 text-[11px] text-muted">
              {result ? `Harmony ${result.score} · ${result.statusLabel}` : 'Assessment not completed'}
            </p>
          </div>

          <nav aria-label="Application" className="mt-4 flex-1 overflow-y-auto pr-0.5 scrollbar-slim">
            <NavList />
          </nav>

          <div className="mt-3 space-y-2 border-t border-border pt-3">
            <Link to="/demo" className="btn-signal btn-sm w-full">
              <Sparkles aria-hidden="true" className="h-3.5 w-3.5" />
              Launch Demo
            </Link>
            <div className="flex items-center justify-between gap-2">
              <Link to="/" className="text-[11px] font-medium text-muted hover:text-ink">
                Public site
              </Link>
              <button
                type="button"
                onClick={() => {
                  resetDemoHousehold();
                  pushToast('Al Noor demo data restored.');
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1.5 text-[11px] font-semibold text-muted transition hover:border-royal/40 hover:text-ink"
              >
                <RotateCcw aria-hidden="true" className="h-3 w-3" />
                Reset demo
              </button>
            </div>
          </div>
        </aside>

        {/* Main column */}
        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-[90] flex h-14 items-center justify-between gap-3 border-b border-border bg-white/90 px-4 backdrop-blur-md lg:hidden">
            <Brand compact />
            <div className="flex items-center gap-2">
              <Link to="/demo" className="btn-signal btn-sm">
                <Sparkles aria-hidden="true" className="h-3.5 w-3.5" />
                Demo
              </Link>
              <button
                type="button"
                onClick={() => setOpen(true)}
                aria-expanded={open}
                aria-controls="app-drawer"
                className="btn btn-sm border border-border text-ink"
              >
                <Menu aria-hidden="true" className="h-4 w-4" />
                <span className="sr-only">Open application navigation</span>
              </button>
            </div>
          </header>

          <main id="main" className="px-4 py-6 pb-16 sm:px-6 lg:px-8 lg:py-8">
            <Outlet />
          </main>

          <footer className="border-t border-border px-4 py-5 text-[11px] leading-relaxed text-muted sm:px-6 lg:px-8">
            <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
              <p>
                FamilyMind AI prototype · Non-medical · Does not monitor emergencies · Data stays on this
                device.
              </p>
              <Link to="/trust" className="inline-flex items-center gap-1 font-semibold text-royal">
                Trust &amp; Safety
                <ArrowUpRight aria-hidden="true" className="h-3 w-3" />
              </Link>
            </div>
          </footer>
        </div>
      </div>

      {open ? (
        <div className="fixed inset-0 z-[120] lg:hidden" id="app-drawer">
          <div className="absolute inset-0 bg-ink/45" onClick={() => setOpen(false)} aria-hidden="true" />
          <div
            id="app-drawer-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Application navigation"
            className="absolute inset-y-0 right-0 flex w-[88%] max-w-sm flex-col bg-white p-4 shadow-lift"
          >
            <div className="flex items-center justify-between">
              <Brand />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="btn btn-sm border border-border text-muted"
              >
                <X aria-hidden="true" className="h-4 w-4" />
                <span className="sr-only">Close application navigation</span>
              </button>
            </div>
            <nav aria-label="Application" className="mt-4 flex-1 overflow-y-auto">
              <NavList onNavigate={() => setOpen(false)} />
            </nav>
            <button
              type="button"
              onClick={() => {
                resetDemoHousehold();
                pushToast('Al Noor demo data restored.');
                setOpen(false);
              }}
              className="btn-ghost btn-sm mt-3 w-full"
            >
              <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" />
              Reset Al Noor demo
            </button>
          </div>
        </div>
      ) : null}

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
