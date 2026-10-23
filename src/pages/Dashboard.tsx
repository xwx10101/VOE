/*
 * ✏️ TEAM GUIDE: The family dashboard — time-aware greeting, 4 live stat
 * cards (adherence, doses, events, elder safety), today's medication
 * timeline, rotating AI Insight, mini schedule and the Nasma AI CTA.
 * All numbers derive from the domain stores via lib/stats.ts + ai/* engines.
 */
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { AlarmClock, CalendarDays, HeartPulse, Pill, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CountUp } from '@/components/shared/CountUp';
import { InsightCard } from '@/components/shared/InsightCard';
import { StatCard } from '@/components/shared/StatCard';
import { MiniSchedule } from '@/components/dashboard/MiniSchedule';
import { TodayTimeline } from '@/components/dashboard/TodayTimeline';
import { conflictingEventIds, detectConflicts } from '@/ai/conflictResolver';
import { safetySummary, type SafetyStatus } from '@/ai/anomalyDetector';
import { addDaysToKey, formatTime, todayKey, WEEK_ORDER_MONDAY_FIRST } from '@/lib/dates';
import { adherenceReport, buildDayDoses } from '@/lib/stats';
import { fadeUp, staggerContainer } from '@/lib/motion';
import { greetingKey, localized } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { useFamilyStore } from '@/stores/familyStore';
import { useHealthStore } from '@/stores/healthStore';
import { useMedicationsStore } from '@/stores/medicationsStore';
import { useScheduleStore } from '@/stores/scheduleStore';
import type { DoseStatus, Lang } from '@/types';

const SAFETY_BADGE: Record<Exclude<SafetyStatus, 'noData'>, 'success' | 'warning' | 'destructive'> = {
  stable: 'success',
  attention: 'warning',
  alert: 'destructive',
};

export function Dashboard() {
  const { t, i18n } = useTranslation();
  const lang = (i18n.language === 'ar' ? 'ar' : 'en') as Lang;
  const user = useAuthStore((s) => s.user);
  const family = useFamilyStore((s) => s.family);
  const medications = useMedicationsStore((s) => s.medications);
  const doseLog = useMedicationsStore((s) => s.doseLog);
  const markDose = useMedicationsStore((s) => s.markDose);
  const events = useScheduleStore((s) => s.events);
  const readings = useHealthStore((s) => s.readings);

  const today = todayKey();
  const todayDow = new Date().getDay();
  const membersById = useMemo(
    () => new Map((family?.members ?? []).map((m) => [m.id, m] as const)),
    [family],
  );

  /* ------------------------------ medications ----------------------------- */
  const adherence = useMemo(() => adherenceReport(medications, doseLog, 7), [medications, doseLog]);
  const todayDoses = useMemo(() => buildDayDoses(medications, doseLog, today), [medications, doseLog, today]);
  const dosesTakenToday = todayDoses.filter((d) => d.status === 'taken').length;
  const nextDose =
    todayDoses.find((d) => d.status === 'due') ?? todayDoses.find((d) => d.status === 'upcoming');
  const doseCountsSpark = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const date = addDaysToKey(today, -(6 - i));
        return buildDayDoses(medications, doseLog, date).filter((d) => d.status === 'taken').length;
      }),
    [medications, doseLog, today],
  );

  /* -------------------------------- schedule ------------------------------ */
  const conflicts = useMemo(() => detectConflicts(events), [events]);
  const conflictIds = useMemo(() => conflictingEventIds(events), [events]);
  const eventsToday = useMemo(
    () => events.filter((e) => e.dayOfWeek === todayDow),
    [events, todayDow],
  );
  const nextEvent = useMemo(() => {
    const nowStr = new Date().toTimeString().slice(0, 5);
    return [...eventsToday]
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
      .find((e) => e.endTime > nowStr);
  }, [eventsToday]);
  const eventsSpark = useMemo(
    () => WEEK_ORDER_MONDAY_FIRST.map((dow) => events.filter((e) => e.dayOfWeek === dow).length),
    [events],
  );

  /* --------------------------------- safety -------------------------------- */
  const elder = family?.members.filter((m) => m.age >= 60).sort((a, b) => b.age - a.age)[0];
  const elderReadings = useMemo(
    () => (elder ? readings.filter((r) => r.memberId === elder.id) : []),
    [elder, readings],
  );
  const safety = useMemo(() => safetySummary(elderReadings), [elderReadings]);
  const bpSpark = useMemo(() => elderReadings.slice(-14).map((r) => r.systolic), [elderReadings]);

  const handleMark = (medicationId: string, time: string, status: DoseStatus | 'clear') =>
    markDose(medicationId, today, time, status);

  const firstName = (user?.name ?? '').split(/\s+/)[0] ?? '';

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="flex flex-col gap-6">
      {/* Greeting */}
      <motion.header variants={fadeUp}>
        <h1 className="text-balance text-[clamp(1.6rem,3.4vw,2.3rem)] font-extrabold leading-tight tracking-tight">
          {t(greetingKey())}, <span className="text-gradient">{firstName}</span>
        </h1>
        {family ? (
          <p className="mt-1.5 text-muted-foreground">
            {t('dashboard.subtitle', { family: localized(family.name, lang) })}
          </p>
        ) : null}
      </motion.header>

      {/* Stat cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label={t('shell.dashboard')}>
        <motion.div variants={fadeUp}>
          <StatCard
            icon={Pill}
            label={t('dashboard.stats.adherence')}
            tintClassName="bg-primary/12 text-primary"
            toneClassName="text-primary"
            value={
              adherence.pct === null ? (
                '—'
              ) : (
                <CountUp end={adherence.pct} suffix="%" />
              )
            }
            spark={adherence.perDay}
            sub={
              adherence.pct === null
                ? t('common.noData')
                : t('dashboard.stats.adherenceSub', { taken: adherence.taken, total: adherence.total })
            }
          />
        </motion.div>

        <motion.div variants={fadeUp}>
          <StatCard
            icon={AlarmClock}
            label={t('dashboard.stats.dosesToday')}
            tintClassName="bg-brand-violet/15 text-brand-violet"
            toneClassName="text-brand-violet"
            value={
              <span className="flex items-baseline gap-1.5">
                <CountUp end={dosesTakenToday} />
                <span className="text-base font-semibold text-muted-foreground">
                  {t('dashboard.stats.dosesOf', { total: todayDoses.length })}
                </span>
              </span>
            }
            spark={doseCountsSpark}
            sub={
              todayDoses.length === 0
                ? t('dashboard.stats.noDoses')
                : nextDose
                  ? t('dashboard.stats.nextDose', {
                      med: localized(nextDose.medication.name, lang),
                      time: formatTime(nextDose.time, lang),
                    })
                  : t('dashboard.stats.allDosesDone')
            }
          />
        </motion.div>

        <motion.div variants={fadeUp}>
          <StatCard
            icon={CalendarDays}
            label={t('dashboard.stats.eventsToday')}
            tintClassName="bg-sky-500/12 text-sky-600 dark:text-sky-400"
            toneClassName="text-sky-500"
            value={
              <span className="flex items-baseline gap-1.5">
                <CountUp end={eventsToday.length} />
                <span className="text-base font-semibold text-muted-foreground">
                  {t('dashboard.stats.eventsCount')}
                </span>
              </span>
            }
            spark={eventsSpark}
            sub={
              <span className="flex flex-wrap items-center gap-2">
                <span>
                  {eventsToday.length === 0
                    ? t('dashboard.stats.noEvents')
                    : nextEvent
                      ? t('dashboard.stats.nextEvent', {
                          event: localized(nextEvent.title, lang),
                          time: formatTime(nextEvent.startTime, lang),
                        })
                      : t('dashboard.stats.allDosesDone')}
                </span>
                {conflicts.length > 0 ? (
                  <Badge variant="warning">{t('dashboard.stats.conflictsBadge', { count: conflicts.length })}</Badge>
                ) : null}
              </span>
            }
          />
        </motion.div>

        <motion.div variants={fadeUp}>
          <StatCard
            icon={HeartPulse}
            label={t('dashboard.stats.safety')}
            tintClassName="bg-rose-500/12 text-rose-600 dark:text-rose-400"
            toneClassName="text-rose-500"
            value={
              safety.latest ? (
                <span dir="ltr" className="tabular-nums">
                  {safety.latest.systolic}/{safety.latest.diastolic}
                </span>
              ) : (
                '—'
              )
            }
            spark={bpSpark}
            sub={
              !elder ? (
                t('dashboard.stats.safetyNoElder')
              ) : safety.status === 'noData' ? (
                t('dashboard.stats.safetyNoData')
              ) : (
                <span className="flex flex-wrap items-center gap-2">
                  <Badge variant={SAFETY_BADGE[safety.status]}>
                    {t(
                      safety.status === 'stable'
                        ? 'dashboard.stats.safetyStable'
                        : safety.status === 'attention'
                          ? 'dashboard.stats.safetyAttention'
                          : 'dashboard.stats.safetyAlert',
                    )}
                  </Badge>
                  <span>
                    {localized(elder.name, lang)} ·{' '}
                    {t('dashboard.stats.safetyAnomalies', { count: safety.anomalyDays })}
                  </span>
                </span>
              )
            }
          />
        </motion.div>
      </section>

      {/* Main grid: timeline + side column */}
      <section className="grid items-start gap-4 xl:grid-cols-3">
        <motion.div variants={fadeUp} className="xl:col-span-2">
          <TodayTimeline doses={todayDoses} membersById={membersById} onMark={handleMark} />
        </motion.div>

        <div className="flex flex-col gap-4">
          <motion.div variants={fadeUp}>
            <InsightCard />
          </motion.div>
          <motion.div variants={fadeUp}>
            <MiniSchedule events={eventsToday} conflictIds={conflictIds} membersById={membersById} />
          </motion.div>
          <motion.div variants={fadeUp}>
            <div className="noise-overlay relative overflow-hidden rounded-2xl bg-brand-gradient p-5 text-white shadow-bloom">
              <div className="relative z-10 flex flex-col items-start gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
                  <Sparkles className="size-5.5" aria-hidden="true" />
                </span>
                <h3 className="text-lg font-extrabold leading-tight">{t('dashboard.aiCta.title')}</h3>
                <p className="text-sm leading-relaxed text-white/85">{t('dashboard.aiCta.desc')}</p>
                <Button asChild className="bg-white text-teal-800 shadow-soft hover:bg-white/90">
                  <Link to="/assistant">{t('dashboard.aiCta.button')}</Link>
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </motion.div>
  );
}
