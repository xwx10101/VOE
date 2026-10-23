/*
 * ✏️ TEAM GUIDE: One detected schedule conflict + the AI's one-tap fix.
 * The suggestion comes from ai/conflictResolver.suggestResolution(); this
 * card only explains it in human language and applies it on demand.
 */
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Pencil, Sparkles, TriangleAlert, WandSparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatTime, weekdayName } from '@/lib/dates';
import { localized } from '@/lib/utils';
import type { ConflictSuggestion, ScheduleConflict } from '@/ai/conflictResolver';
import type { FamilyMember, Lang, ScheduleEvent } from '@/types';

const REASON_KEYS = {
  shiftAfter: 'sched.reasonShiftAfter',
  shiftBefore: 'sched.reasonShiftBefore',
  nextDay: 'sched.reasonNextDay',
} as const;

interface ConflictCardProps {
  conflict: ScheduleConflict;
  suggestion: ConflictSuggestion | null;
  membersById: Map<string, FamilyMember>;
  onApply: (suggestion: ConflictSuggestion) => void;
  onDismiss: (conflictId: string) => void;
  onEdit: (event: ScheduleEvent) => void;
}

export function ConflictCard({
  conflict,
  suggestion,
  membersById,
  onApply,
  onDismiss,
  onEdit,
}: ConflictCardProps) {
  const { t, i18n } = useTranslation();
  const lang = (i18n.language === 'ar' ? 'ar' : 'en') as Lang;
  const [a, b] = conflict.events;
  const memberName = localized(
    membersById.get(conflict.memberId)?.name ?? { ar: '', en: '' },
    lang,
  );
  const range = (e: ScheduleEvent) => `${formatTime(e.startTime, lang)} – ${formatTime(e.endTime, lang)}`;
  const movedEvent = suggestion
    ? conflict.events.find((e) => e.id === suggestion.eventId) ?? b
    : b;
  const otherEvent = movedEvent.id === a.id ? b : a;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border border-warning/50 bg-warning/[0.06] p-4 shadow-soft sm:p-5"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warning/20 text-warning-foreground dark:text-warning">
          <TriangleAlert className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm leading-relaxed">
            {t('sched.conflictDesc', {
              member: memberName,
              day: weekdayName(conflict.dayOfWeek, lang, 'long'),
              a: localized(a.title, lang),
              aTime: range(a),
              b: localized(b.title, lang),
              bTime: range(b),
            })}
          </p>

          {suggestion ? (
            <div className="mt-3 rounded-xl border border-brand-violet/30 bg-brand-violet/[0.07] p-3.5">
              <p className="flex items-center gap-1.5 text-[0.7rem] font-bold uppercase tracking-[0.12em] text-brand-violet">
                <Sparkles className="size-3.5" aria-hidden="true" />
                {t('sched.suggestionKicker')}
              </p>
              <p className="mt-1.5 font-bold leading-snug">
                {t('sched.moveTo', {
                  event: localized(movedEvent.title, lang),
                  day: weekdayName(suggestion.dayOfWeek, lang, 'long'),
                  start: formatTime(suggestion.startTime, lang),
                  end: formatTime(suggestion.endTime, lang),
                })}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t(REASON_KEYS[suggestion.reason], { other: localized(otherEvent.title, lang) })}
              </p>
            </div>
          ) : (
            <p className="mt-2.5 text-sm text-muted-foreground">{t('sched.noSuggestion')}</p>
          )}

          <div className="mt-3.5 flex flex-wrap items-center gap-2">
            {suggestion ? (
              <Button size="sm" variant="gradient" onClick={() => onApply(suggestion)}>
                <WandSparkles aria-hidden="true" />
                {t('sched.apply')}
              </Button>
            ) : null}
            <Button size="sm" variant="outline" onClick={() => onEdit(movedEvent)}>
              <Pencil aria-hidden="true" />
              {t('sched.edit')}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onDismiss(conflict.id)}>
              <X aria-hidden="true" />
              {t('sched.dismiss')}
            </Button>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
