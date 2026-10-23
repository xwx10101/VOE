/*
 * ✏️ TEAM GUIDE: Compact "today" schedule card for the dashboard.
 * Conflicting events (from ai/conflictResolver) get a warning ring + badge;
 * finished events dim. Full week intelligence lives in Phase 3.
 */
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight, CalendarCheck2 } from 'lucide-react';
import { Avatar } from '@/components/shared/Avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MODULE_TINTS } from '@/components/shared/moduleIcons';
import { formatTime, nowMinutes, timeToMinutes } from '@/lib/dates';
import { cn, localized } from '@/lib/utils';
import type { EventCategory, FamilyMember, Lang, ScheduleEvent } from '@/types';

export const CATEGORY_COLORS: Record<EventCategory, string> = {
  school: 'bg-sky-500',
  work: 'bg-brand-violet',
  medical: 'bg-rose-500',
  sport: 'bg-brand-amber',
  family: 'bg-primary',
  other: 'bg-slate-400',
};

interface MiniScheduleProps {
  events: ScheduleEvent[];
  conflictIds: Set<string>;
  membersById: Map<string, FamilyMember>;
}

export function MiniSchedule({ events, conflictIds, membersById }: MiniScheduleProps) {
  const { t, i18n } = useTranslation();
  const lang = (i18n.language === 'ar' ? 'ar' : 'en') as Lang;
  const now = nowMinutes();
  const ForwardIcon = lang === 'ar' ? ArrowLeft : ArrowRight;

  const sorted = [...events].sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2.5">
            <span className={cn('flex h-9 w-9 items-center justify-center rounded-xl', MODULE_TINTS.schedule)}>
              <CalendarCheck2 className="size-4.5" aria-hidden="true" />
            </span>
            {t('dashboard.scheduleCard.title')}
          </span>
          <Link
            to="/schedule"
            className="inline-flex items-center gap-1 text-xs font-bold text-primary underline-offset-4 transition hover:underline"
          >
            {t('dashboard.scheduleCard.viewWeek')}
            <ForwardIcon className="size-3.5" aria-hidden="true" />
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <p className="flex items-center gap-2 rounded-xl bg-muted/60 px-4 py-3.5 text-sm text-muted-foreground">
            <CalendarCheck2 className="size-4 shrink-0 text-success" aria-hidden="true" />
            {t('dashboard.scheduleCard.empty')}
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {sorted.map((event) => {
              const member = membersById.get(event.memberId);
              const finished = timeToMinutes(event.endTime) <= now;
              const conflict = conflictIds.has(event.id);
              return (
                <li
                  key={event.id}
                  className={cn(
                    'relative flex items-center gap-3 overflow-hidden rounded-xl border px-3.5 py-2.5 transition',
                    conflict
                      ? 'border-warning/50 bg-warning/[0.07]'
                      : 'border-border/70 bg-background/60',
                    finished && !conflict && 'opacity-55',
                  )}
                >
                  <span aria-hidden="true" className={cn('absolute inset-y-0 start-0 w-1', CATEGORY_COLORS[event.category])} />
                  <span className="min-w-0 flex-1 ps-1">
                    <span className="block truncate text-sm font-bold leading-tight">
                      {localized(event.title, lang)}
                    </span>
                    <span className="mt-0.5 block text-xs tabular-nums text-muted-foreground">
                      {formatTime(event.startTime, lang)} – {formatTime(event.endTime, lang)}
                      {member ? ` · ${localized(member.name, lang)}` : ''}
                    </span>
                  </span>
                  {conflict ? (
                    <Badge variant="warning">{t('dashboard.scheduleCard.conflict')}</Badge>
                  ) : member ? (
                    <Avatar name={localized(member.name, lang)} size="sm" className="h-7 w-7 text-[0.6rem]" />
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
