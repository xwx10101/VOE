/*
 * ✏️ TEAM GUIDE: App sidebar — animated expanded (272px) ⇄ icon rail (76px)
 * on desktop; full drawer on mobile (rendered by AppShell).
 * Shows only ENABLED modules, live badges (doses left, conflicts, safety dot),
 * sliding active pill, family card and user card.
 */
import { useId, useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { LayoutDashboard, PanelLeftClose, PanelLeftOpen, Settings as SettingsIcon, X } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { Avatar } from '@/components/shared/Avatar';
import { MODULE_ICONS } from '@/components/shared/moduleIcons';
import { detectConflicts } from '@/ai/conflictResolver';
import { safetySummary } from '@/ai/anomalyDetector';
import { MODULES } from '@/config/app.config';
import { todayKey } from '@/lib/dates';
import { buildDayDoses } from '@/lib/stats';
import { useAuthStore } from '@/stores/authStore';
import { useFamilyStore } from '@/stores/familyStore';
import { useHealthStore } from '@/stores/healthStore';
import { useMedicationsStore } from '@/stores/medicationsStore';
import { useScheduleStore } from '@/stores/scheduleStore';
import { useUiStore } from '@/stores/uiStore';
import { cn, localized } from '@/lib/utils';
import type { Lang, ModuleId } from '@/types';

/** Animated label that collapses away in rail mode. */
function RailLabel({ expanded, children }: { expanded: boolean; children: React.ReactNode }) {
  return (
    <motion.span
      initial={false}
      animate={{ width: expanded ? 'auto' : 0, opacity: expanded ? 1 : 0 }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-hidden whitespace-nowrap"
    >
      {children}
    </motion.span>
  );
}

interface NavEntry {
  to: string;
  label: string;
  icon: React.ReactNode;
  badge?: { count: number; tone: 'primary' | 'warning'; ariaLabel: string };
  dot?: boolean;
}

interface SidebarContentProps {
  expanded: boolean;
  /** Where the sidebar lives — controls pill animation namespace & footer. */
  variant: 'desktop' | 'mobile';
  onNavigate?: () => void;
  onClose?: () => void;
}

export function SidebarContent({ expanded, variant, onNavigate, onClose }: SidebarContentProps) {
  const { t, i18n } = useTranslation();
  const lang = (i18n.language === 'ar' ? 'ar' : 'en') as Lang;
  const user = useAuthStore((s) => s.user);
  const family = useFamilyStore((s) => s.family);
  const medications = useMedicationsStore((s) => s.medications);
  const doseLog = useMedicationsStore((s) => s.doseLog);
  const events = useScheduleStore((s) => s.events);
  const readings = useHealthStore((s) => s.readings);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const pillId = useId();

  const badges = useMemo(() => {
    const dosesLeft = buildDayDoses(medications, doseLog, todayKey()).filter(
      (d) => d.status === 'due' || d.status === 'upcoming',
    ).length;
    const conflicts = detectConflicts(events).length;
    const elder = family?.members.find((m) => m.age >= 60);
    const safety =
      elder && readings.length
        ? safetySummary(readings.filter((r) => r.memberId === elder.id)).status
        : 'noData';
    return { dosesLeft, conflicts, safety };
  }, [medications, doseLog, events, family, readings]);

  const enabledModules = MODULES.filter((m) => family?.enabledModules.includes(m.id));

  const moduleBadge = (id: ModuleId): NavEntry['badge'] => {
    if (id === 'medications' && badges.dosesLeft > 0)
      return { count: badges.dosesLeft, tone: 'primary', ariaLabel: t('shell.dosesLeft', { count: badges.dosesLeft }) };
    if (id === 'schedule' && badges.conflicts > 0)
      return { count: badges.conflicts, tone: 'warning', ariaLabel: t('shell.conflictsCount', { count: badges.conflicts }) };
    return undefined;
  };

  const entries: NavEntry[] = [
    {
      to: '/dashboard',
      label: t('shell.dashboard'),
      icon: <LayoutDashboard className="size-5" aria-hidden="true" />,
    },
    ...enabledModules.map((mod) => {
      const Icon = MODULE_ICONS[mod.id];
      return {
        to: mod.route,
        label: t(`modules.${mod.id}.title`),
        icon:
          mod.id === 'assistant' ? (
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-gradient text-white shadow-soft">
              <Icon className="size-3.5" aria-hidden="true" />
            </span>
          ) : (
            <Icon className="size-5" aria-hidden="true" />
          ),
        badge: moduleBadge(mod.id),
        dot: mod.id === 'safety' && (badges.safety === 'attention' || badges.safety === 'alert'),
      } satisfies NavEntry;
    }),
  ];

  const renderEntry = (entry: NavEntry) => (
    <NavLink
      key={entry.to}
      to={entry.to}
      onClick={onNavigate}
      aria-label={entry.badge ? `${entry.label} — ${entry.badge.ariaLabel}` : entry.label}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors duration-200',
          isActive ? 'text-primary' : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
          !expanded && 'justify-center px-0',
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive ? (
            <motion.span
              layoutId={`nav-pill-${pillId}`}
              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              className="absolute inset-0 rounded-xl bg-primary/12 ring-1 ring-primary/25"
              aria-hidden="true"
            />
          ) : null}
          <span className="relative z-10 flex shrink-0 items-center">
            {entry.icon}
            {entry.dot ? (
              <span className="animate-pulse-dot absolute -end-0.5 -top-0.5 h-2 w-2 rounded-full bg-warning ring-2 ring-card" aria-hidden="true" />
            ) : null}
          </span>
          <RailLabel expanded={expanded}>
            <span className="relative z-10">{entry.label}</span>
          </RailLabel>
          {entry.badge && expanded ? (
            <span
              aria-hidden="true"
              className={cn(
                'relative z-10 ms-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[0.68rem] font-extrabold',
                entry.badge.tone === 'warning'
                  ? 'bg-warning text-warning-foreground'
                  : 'bg-primary text-primary-foreground',
              )}
            >
              {entry.badge.count}
            </span>
          ) : null}
          {/* Rail tooltip */}
          {!expanded ? (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute start-full z-50 ms-3 hidden whitespace-nowrap rounded-lg bg-foreground px-2.5 py-1.5 text-xs font-semibold text-background shadow-bloom group-hover:block"
            >
              {entry.label}
            </span>
          ) : null}
        </>
      )}
    </NavLink>
  );

  return (
    <div className="flex h-full flex-col">
      {/* Brand row */}
      <div className={cn('flex items-center gap-2 px-4 pb-2 pt-5', !expanded && 'justify-center px-2')}>
        {expanded ? <Logo variant="compact" /> : <Logo variant="mark" markClassName="h-9 w-9" />}
        {variant === 'mobile' ? (
          <button
            type="button"
            onClick={onClose}
            aria-label={t('shell.closeMenu')}
            className="ms-auto flex h-9 w-9 items-center justify-center rounded-lg border border-border transition hover:border-primary/40 hover:text-primary"
          >
            <X className="size-4.5" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {/* Family card */}
      {family ? (
        <div className={cn('mx-3 mt-3', !expanded && 'mx-2')}>
          {expanded ? (
            <div className="rounded-2xl border border-border/70 bg-background/60 p-3.5">
              <p className="truncate text-sm font-extrabold">{localized(family.name, lang)}</p>
              <div className="mt-2.5 flex items-center">
                <span className="flex -space-x-2 rtl:space-x-reverse">
                  {family.members.slice(0, 5).map((m) => (
                    <Avatar key={m.id} name={localized(m.name, lang)} size="sm" className="h-7 w-7 text-[0.6rem] ring-2 ring-card" />
                  ))}
                </span>
                {family.members.length > 5 ? (
                  <span className="ms-2 text-xs font-bold text-muted-foreground">+{family.members.length - 5}</span>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="flex justify-center" title={localized(family.name, lang)}>
              <Avatar name={localized(family.name, lang)} size="sm" />
            </div>
          )}
        </div>
      ) : null}

      {/* Main nav */}
      <nav aria-label={t('shell.mainNav')} className="mt-4 flex flex-col gap-1 px-3">
        {entries.map(renderEntry)}
      </nav>

      {/* Bottom: settings + user + collapse */}
      <div className="mt-auto flex flex-col gap-1 px-3 pb-4">
        {renderEntry({
          to: '/settings',
          label: t('shell.settings'),
          icon: <SettingsIcon className="size-5" aria-hidden="true" />,
        })}

        <div
          className={cn(
            'mt-2 flex items-center gap-3 rounded-2xl border border-border/70 bg-background/60 p-3',
            !expanded && 'justify-center p-2',
          )}
        >
          <Avatar name={user?.name ?? '?'} size="sm" />
          <RailLabel expanded={expanded}>
            <span className="block max-w-[9.5rem]">
              <span className="block truncate text-sm font-bold leading-tight">{user?.name}</span>
              <span dir="ltr" className="block truncate text-start text-xs text-muted-foreground">
                {user?.email}
              </span>
            </span>
          </RailLabel>
        </div>

        {variant === 'desktop' ? (
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label={expanded ? t('shell.collapse') : t('shell.expand')}
            aria-expanded={expanded}
            className={cn(
              'mt-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-muted-foreground transition hover:bg-muted/70 hover:text-foreground',
              !expanded && 'justify-center px-0',
            )}
          >
            {expanded ? (
              <PanelLeftClose className="size-5 shrink-0 rtl:-scale-x-100" aria-hidden="true" />
            ) : (
              <PanelLeftOpen className="size-5 shrink-0 rtl:-scale-x-100" aria-hidden="true" />
            )}
            <RailLabel expanded={expanded}>{t('shell.collapse')}</RailLabel>
          </button>
        ) : null}
      </div>
    </div>
  );
}

/** Desktop sidebar with animated width (expanded ⇄ rail). */
export function Sidebar() {
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 76 : 272 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-0 z-40 hidden h-svh shrink-0 border-e border-border/70 bg-card/70 backdrop-blur-xl lg:block"
    >
      <SidebarContent expanded={!collapsed} variant="desktop" />
    </motion.aside>
  );
}
