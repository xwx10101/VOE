/*
 * ✏️ TEAM GUIDE: Today's medication timeline (dashboard centerpiece).
 * Doses grouped by time slot on a vertical rail; "mark taken" writes through
 * to the medications store, so adherence numbers update instantly.
 */
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Pill, RotateCcw } from 'lucide-react';
import { Avatar } from '@/components/shared/Avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/EmptyState';
import { MODULE_TINTS } from '@/components/shared/moduleIcons';
import { formatTime } from '@/lib/dates';
import { cn, localized } from '@/lib/utils';
import type { DayDose, DerivedDoseStatus } from '@/lib/stats';
import type { DoseStatus, FamilyMember, Lang } from '@/types';

const STATUS_BADGE: Record<DerivedDoseStatus, 'success' | 'destructive' | 'warning' | 'secondary' | 'outline'> = {
  taken: 'success',
  missed: 'destructive',
  due: 'warning',
  upcoming: 'secondary',
  skipped: 'outline',
};

interface TodayTimelineProps {
  doses: DayDose[];
  membersById: Map<string, FamilyMember>;
  onMark: (medicationId: string, time: string, status: DoseStatus | 'clear') => void;
}

export function TodayTimeline({ doses, membersById, onMark }: TodayTimelineProps) {
  const { t, i18n } = useTranslation();
  const lang = (i18n.language === 'ar' ? 'ar' : 'en') as Lang;

  const takenCount = doses.filter((d) => d.status === 'taken').length;
  const progress = doses.length ? Math.round((takenCount / doses.length) * 100) : 0;

  // Group doses by time slot, preserving chronological order.
  const groups = new Map<string, DayDose[]>();
  for (const dose of doses) {
    const list = groups.get(dose.time) ?? [];
    list.push(dose);
    groups.set(dose.time, list);
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2.5">
          <span className={cn('flex h-9 w-9 items-center justify-center rounded-xl', MODULE_TINTS.medications)}>
            <Pill className="size-4.5" aria-hidden="true" />
          </span>
          {t('dashboard.timeline.title')}
        </CardTitle>
        {doses.length > 0 ? (
          <div className="flex flex-col gap-2 pt-1">
            <p className="text-sm text-muted-foreground">
              {t('dashboard.timeline.subtitle', { taken: takenCount, total: doses.length })}
            </p>
            <div
              className="h-2 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <motion.div
                className="h-full rounded-full bg-brand-gradient"
                initial={false}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </div>
        ) : null}
      </CardHeader>

      <CardContent>
        {doses.length === 0 ? (
          <EmptyState
            icon={Pill}
            title={t('dashboard.timeline.emptyTitle')}
            desc={t('dashboard.timeline.emptyDesc')}
            action={
              <Button asChild variant="gradient">
                <Link to="/medications">{t('dashboard.timeline.emptyAction')}</Link>
              </Button>
            }
          />
        ) : (
          <div className="relative flex flex-col gap-6">
            <span aria-hidden="true" className="absolute bottom-2 start-[3.35rem] top-2 w-px bg-border sm:start-[3.85rem]" />
            {[...groups.entries()].map(([time, slotDoses]) => (
              <div key={time} className="relative flex gap-3 sm:gap-4">
                <time className="w-[3.4rem] shrink-0 pt-2.5 text-end text-xs font-extrabold tabular-nums text-muted-foreground sm:w-16 sm:text-[0.8rem]">
                  {formatTime(time, lang)}
                </time>
                <span
                  aria-hidden="true"
                  className={cn(
                    'relative z-10 mt-3 h-2.5 w-2.5 shrink-0 rounded-full ring-4 ring-card',
                    slotDoses.every((d) => d.status === 'taken')
                      ? 'bg-success'
                      : slotDoses.some((d) => d.status === 'missed')
                        ? 'bg-destructive'
                        : 'bg-primary',
                  )}
                />
                <ul className="flex min-w-0 flex-1 flex-col gap-2">
                  {slotDoses.map((dose) => {
                    const member = membersById.get(dose.medication.memberId);
                    const isTaken = dose.status === 'taken';
                    return (
                      <motion.li
                        key={`${dose.medication.id}-${dose.time}`}
                        layout
                        className={cn(
                          'flex flex-wrap items-center gap-3 rounded-xl border px-3.5 py-3 transition-colors duration-300',
                          isTaken
                            ? 'border-success/30 bg-success/[0.06]'
                            : dose.status === 'missed'
                              ? 'border-destructive/30 bg-destructive/[0.05]'
                              : 'border-border/70 bg-background/60',
                        )}
                      >
                        {member ? <Avatar name={localized(member.name, lang)} size="sm" /> : null}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-bold leading-tight">
                            {localized(dose.medication.name, lang)}{' '}
                            <span className="font-semibold text-muted-foreground" dir="ltr">
                              {dose.medication.dosage}
                            </span>
                          </span>
                          <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                            {member ? `${localized(member.name, lang)} · ` : ''}
                            {localized(dose.medication.instructions, lang)}
                          </span>
                        </span>

                        <span className="flex items-center gap-2">
                          <AnimatePresence mode="wait" initial={false}>
                            <motion.span
                              key={dose.status}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              transition={{ duration: 0.18 }}
                            >
                              <Badge variant={STATUS_BADGE[dose.status]}>
                                {t(`dashboard.timeline.${dose.status}`)}
                              </Badge>
                            </motion.span>
                          </AnimatePresence>

                          {isTaken ? (
                            <button
                              type="button"
                              onClick={() => onMark(dose.medication.id, dose.time, 'clear')}
                              aria-label={t('dashboard.timeline.undo')}
                              title={t('dashboard.timeline.undo')}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground active:scale-90"
                            >
                              <RotateCcw className="size-4" aria-hidden="true" />
                            </button>
                          ) : (
                            <motion.button
                              type="button"
                              whileTap={{ scale: 0.9 }}
                              onClick={() => onMark(dose.medication.id, dose.time, 'taken')}
                              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand-gradient px-3 text-xs font-bold text-white shadow-soft transition hover:brightness-110"
                            >
                              <Check className="size-4" aria-hidden="true" />
                              {t('dashboard.timeline.markTaken')}
                            </motion.button>
                          )}
                        </span>
                      </motion.li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
