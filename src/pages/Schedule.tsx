/*
 * ✏️ TEAM GUIDE: Family Schedule Intelligence — color-coded week board,
 * automatic conflict detection and one-tap AI resolutions
 * (ai/conflictResolver). Companions (withMemberId) are first-class: the
 * board shows them, and the engine keeps their calendars clash-free too.
 */
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import { CalendarDays, CalendarPlus, MapPin, Plus } from 'lucide-react';
import { Avatar } from '@/components/shared/Avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { EmptyState } from '@/components/shared/EmptyState';
import { MemberFilter, type MemberFilterValue } from '@/components/shared/MemberFilter';
import { PageHeader } from '@/components/shared/PageHeader';
import { ConflictCard } from '@/components/schedule/ConflictCard';
import { CATEGORY_COLORS } from '@/components/dashboard/MiniSchedule';
import {
  EventFormDialog,
  type EventFormValues,
} from '@/components/schedule/EventFormDialog';
import {
  detectConflicts,
  suggestResolution,
  type ConflictSuggestion,
} from '@/ai/conflictResolver';
import {
  addDays,
  dateKey,
  formatTime,
  todayKey,
  weekdayName,
  WEEK_ORDER_MONDAY_FIRST,
} from '@/lib/dates';
import { fadeUp, staggerContainer } from '@/lib/motion';
import { cn, localized, uid } from '@/lib/utils';
import { useFamilyStore } from '@/stores/familyStore';
import { useScheduleStore } from '@/stores/scheduleStore';
import type { Lang, ScheduleEvent } from '@/types';

export function Schedule() {
  const { t, i18n } = useTranslation();
  const lang = (i18n.language === 'ar' ? 'ar' : 'en') as Lang;
  const family = useFamilyStore((s) => s.family);
  const events = useScheduleStore((s) => s.events);
  const addEvent = useScheduleStore((s) => s.addEvent);
  const updateEvent = useScheduleStore((s) => s.updateEvent);
  const removeEvent = useScheduleStore((s) => s.removeEvent);

  const [filter, setFilter] = useState<MemberFilterValue>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ScheduleEvent | null>(null);
  const [deleting, setDeleting] = useState<ScheduleEvent | null>(null);
  const [dismissed, setDismissed] = useState<string[]>([]);

  const members = family?.members ?? [];
  const membersById = useMemo(() => new Map(members.map((m) => [m.id, m] as const)), [members]);
  const today = todayKey();

  /* ------------------------------ conflicts ------------------------------ */
  const conflicts = useMemo(() => detectConflicts(events), [events]);
  const visibleConflicts = conflicts.filter((c) => !dismissed.includes(c.id));
  const conflictIds = useMemo(() => {
    const ids = new Set<string>();
    for (const c of conflicts) {
      ids.add(c.events[0].id);
      ids.add(c.events[1].id);
    }
    return ids;
  }, [conflicts]);

  const applySuggestion = (suggestion: ConflictSuggestion) => {
    const target = events.find((e) => e.id === suggestion.eventId);
    if (!target) return;
    updateEvent({
      ...target,
      dayOfWeek: suggestion.dayOfWeek,
      startTime: suggestion.startTime,
      endTime: suggestion.endTime,
    });
    toast.success(t('sched.applied'));
  };

  /* --------------------------------- board -------------------------------- */
  const weekDates = useMemo(() => {
    const now = new Date();
    const monday = addDays(now, -((now.getDay() + 6) % 7));
    return WEEK_ORDER_MONDAY_FIRST.map((dow, i) => ({ dow, date: addDays(monday, i) }));
  }, []);

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: events.length };
    for (const e of events) {
      map[e.memberId] = (map[e.memberId] ?? 0) + 1;
      if (e.withMemberId) map[e.withMemberId] = (map[e.withMemberId] ?? 0) + 1;
    }
    return map;
  }, [events]);

  const visibleFor = (event: ScheduleEvent) =>
    filter === 'all' || event.memberId === filter || event.withMemberId === filter;

  /* ---------------------------------- CRUD --------------------------------- */
  const warnIfConflict = (savedId: string, prospective: ScheduleEvent[], isNew: boolean) => {
    const clash = detectConflicts(prospective).find(
      (c) => c.events[0].id === savedId || c.events[1].id === savedId,
    );
    if (clash) {
      const other = clash.events.find((e) => e.id !== savedId)!;
      toast.warning(t('sched.conflictCreated', { event: localized(other.title, lang) }));
    } else {
      toast.success(isNew ? t('sched.added') : t('sched.saved'));
    }
  };

  const handleSave = (values: EventFormValues) => {
    if (editing) {
      const updated = { ...editing, ...values };
      updateEvent(updated);
      warnIfConflict(updated.id, events.map((e) => (e.id === updated.id ? updated : e)), false);
    } else {
      const created: ScheduleEvent = { id: uid('evt'), ...values };
      addEvent(created);
      warnIfConflict(created.id, [...events, created], true);
    }
  };

  const handleDelete = () => {
    if (!deleting) return;
    removeEvent(deleting.id);
    toast.success(t('sched.deleted'));
    setDeleting(null);
  };

  const openAdd = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (event: ScheduleEvent) => {
    setEditing(event);
    setDialogOpen(true);
  };

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="flex flex-col gap-6">
      <PageHeader
        title={t('modules.schedule.title')}
        subtitle={t('sched.subtitle')}
        actions={
          <Button variant="gradient" onClick={openAdd}>
            <Plus aria-hidden="true" />
            {t('sched.add')}
          </Button>
        }
      />

      <motion.div variants={fadeUp}>
        <MemberFilter
          members={members}
          value={filter}
          onChange={setFilter}
          allLabel={t('sched.allMembers')}
          lang={lang}
          counts={counts}
        />
      </motion.div>

      {/* Conflict center */}
      <AnimatePresence>
        {visibleConflicts.length > 0 ? (
          <motion.section
            key="conflicts"
            variants={fadeUp}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-3"
            aria-live="polite"
          >
            <div>
              <h2 className="text-lg font-extrabold">
                {t('sched.bannerTitle', { count: conflicts.length })}
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">{t('sched.bannerDesc')}</p>
            </div>
            <AnimatePresence initial={false}>
              {visibleConflicts.map((conflict) => (
                <ConflictCard
                  key={conflict.id}
                  conflict={conflict}
                  suggestion={suggestResolution(conflict, events)}
                  membersById={membersById}
                  onApply={applySuggestion}
                  onDismiss={(id) => setDismissed((prev) => [...prev, id])}
                  onEdit={openEdit}
                />
              ))}
            </AnimatePresence>
          </motion.section>
        ) : null}
      </AnimatePresence>

      {events.length === 0 ? (
        <motion.div variants={fadeUp}>
          <EmptyState
            icon={CalendarDays}
            title={t('sched.empty.title')}
            desc={t('sched.empty.desc')}
            className="py-16"
            action={
              <Button variant="gradient" onClick={openAdd}>
                <CalendarPlus aria-hidden="true" />
                {t('sched.empty.action')}
              </Button>
            }
          />
        </motion.div>
      ) : (
        <motion.section
          variants={fadeUp}
          className="flex snap-x gap-3 overflow-x-auto pb-3"
          aria-label={t('modules.schedule.title')}
        >
          {weekDates.map(({ dow, date }) => {
            const isToday = dateKey(date) === today;
            const dayEvents = events
              .filter((e) => e.dayOfWeek === dow && visibleFor(e))
              .sort((a, b) => a.startTime.localeCompare(b.startTime));
            return (
              <div
                key={dow}
                className={cn(
                  'flex min-w-[13.5rem] flex-1 snap-start flex-col gap-2.5 rounded-2xl border p-3',
                  isToday
                    ? 'border-primary/50 bg-primary/[0.05] shadow-glow'
                    : 'border-border/70 bg-card/60',
                )}
              >
                <header className="flex items-center justify-between px-1 pb-1">
                  <span className="flex flex-col">
                    <span className={cn('text-sm font-extrabold', isToday && 'text-primary')}>
                      {weekdayName(dow, lang, 'long')}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {date.getDate()}/{date.getMonth() + 1}
                    </span>
                  </span>
                  {isToday ? <Badge variant="gradient">{t('common.today')}</Badge> : null}
                </header>

                {dayEvents.length === 0 ? (
                  <p className="px-1 py-3 text-center text-lg text-muted-foreground/50" aria-hidden="true">·</p>
                ) : (
                  dayEvents.map((event) => {
                    const member = membersById.get(event.memberId);
                    const companion = event.withMemberId ? membersById.get(event.withMemberId) : undefined;
                    const conflict = conflictIds.has(event.id);
                    return (
                      <button
                        key={event.id}
                        type="button"
                        onClick={() => openEdit(event)}
                        className={cn(
                          'relative overflow-hidden rounded-xl border bg-card p-3 text-start shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-bloom active:scale-[0.98]',
                          conflict ? 'border-warning/60 ring-1 ring-warning/40' : 'border-border/70',
                        )}
                      >
                        <span aria-hidden="true" className={cn('absolute inset-y-0 start-0 w-1.5', CATEGORY_COLORS[event.category])} />
                        <span className="block ps-2">
                          <span className="flex items-start justify-between gap-2">
                            <span className="font-bold leading-snug">{localized(event.title, lang)}</span>
                            {conflict ? (
                              <Badge variant="warning" className="shrink-0 text-[0.6rem]">
                                {t('dashboard.scheduleCard.conflict')}
                              </Badge>
                            ) : null}
                          </span>
                          <span className="mt-1 block text-xs tabular-nums text-muted-foreground">
                            {formatTime(event.startTime, lang)} – {formatTime(event.endTime, lang)}
                          </span>
                          <span className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                            {member ? (
                              <>
                                <Avatar name={localized(member.name, lang)} size="sm" className="h-5 w-5 text-[0.5rem]" />
                                <span className="font-semibold text-foreground/80">{localized(member.name, lang)}</span>
                              </>
                            ) : null}
                            <span className="rounded-md bg-muted px-1.5 py-0.5 text-[0.65rem] font-semibold">
                              {t(`categories.${event.category}`)}
                            </span>
                          </span>
                          {companion ? (
                            <span className="mt-1.5 block text-xs text-muted-foreground">
                              {t('sched.withCompanion', { name: localized(companion.name, lang) })}
                            </span>
                          ) : null}
                          {event.location ? (
                            <span className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="size-3 shrink-0" aria-hidden="true" />
                              <span className="truncate">{localized(event.location, lang)}</span>
                            </span>
                          ) : null}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            );
          })}
        </motion.section>
      )}

      <EventFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editing}
        members={members}
        defaultMemberId={filter !== 'all' ? filter : undefined}
        onSave={handleSave}
        onDelete={(event) => setDeleting(event)}
      />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={t('sched.deleteTitle', { event: deleting ? localized(deleting.title, lang) : '' })}
        desc={t('sched.deleteDesc')}
        confirmLabel={t('common.delete')}
        onConfirm={handleDelete}
      />
    </motion.div>
  );
}
