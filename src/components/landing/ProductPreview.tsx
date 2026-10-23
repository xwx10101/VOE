/*
 * ✏️ TEAM GUIDE: The hero "living product" preview — an animated mock of the
 * real dashboard (adherence ring, today's meds, BP trend, AI insight,
 * meal-plan + clash-resolved floating cards). Pure presentational; all copy
 * comes from i18n (landing.preview.*).
 */
import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'framer-motion';
import { CalendarCheck2, Check, Clock, Sparkles, UtensilsCrossed } from 'lucide-react';
import { Avatar } from '@/components/shared/Avatar';
import { Badge } from '@/components/ui/badge';
import { CountUp } from '@/components/shared/CountUp';
import { ProgressRing } from '@/components/shared/ProgressRing';
import { EASE_CINEMATIC } from '@/lib/motion';
import { cn, localized } from '@/lib/utils';
import { mockFamily } from '@/data/mockFamily';
import type { Lang } from '@/types';

const BP_PATH = 'M2 42 C22 38 32 28 48 31 S78 40 94 33 S124 20 140 26 S170 36 186 29 S208 22 222 27';

export function ProductPreview() {
  const { t, i18n } = useTranslation();
  const reduceMotion = useReducedMotion();
  const lang = (i18n.language === 'ar' ? 'ar' : 'en') as Lang;
  const Mariam = mockFamily.members.find((m) => m.id === 'member-mariam')!;

  const meds = [
    { name: t('landing.preview.med1Name'), meta: t('landing.preview.med1Meta'), taken: true },
    { name: t('landing.preview.med2Name'), meta: t('landing.preview.med2Meta'), taken: false },
    { name: t('landing.preview.med3Name'), meta: t('landing.preview.med3Meta'), taken: false },
  ];

  return (
    <div className="relative mx-auto w-full max-w-xl" aria-hidden="true">
      {/* Glow behind the card */}
      <div className="absolute -inset-8 rounded-[2.5rem] bg-brand-gradient opacity-20 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: reduceMotion ? 0 : 34, rotate: reduceMotion ? 0 : 1 }}
        animate={{ opacity: 1, y: 0, rotate: 0 }}
        transition={{ duration: 0.8, ease: EASE_CINEMATIC, delay: 0.35 }}
        className="glass noise-overlay relative overflow-hidden rounded-[1.75rem] p-5 shadow-bloom sm:p-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex -space-x-2.5 rtl:space-x-reverse">
              {mockFamily.members.slice(0, 4).map((m) => (
                <Avatar key={m.id} name={localized(m.name, lang)} size="sm" className="ring-2 ring-card" />
              ))}
            </span>
            <div>
              <p className="text-sm font-bold leading-tight">{localized(mockFamily.name, lang)}</p>
              <p className="text-xs text-muted-foreground">{t('landing.preview.title')}</p>
            </div>
          </div>
          <span className="flex items-center gap-1.5 text-xs font-semibold text-success">
            <span className="animate-pulse-dot h-2 w-2 rounded-full bg-success" />
            LIVE
          </span>
        </div>

        <div className="mt-5 grid grid-cols-[auto_1fr] items-center gap-4">
          {/* Adherence ring */}
          <div className="flex flex-col items-center gap-1.5">
            <ProgressRing value={94} size={92} strokeWidth={9} label={t('landing.preview.adherence')}>
              <span className="text-lg font-extrabold">
                <CountUp end={94} suffix="%" />
              </span>
            </ProgressRing>
            <span className="max-w-[6.5rem] text-center text-[0.68rem] font-medium leading-tight text-muted-foreground">
              {t('landing.preview.adherence')}
            </span>
          </div>

          {/* BP trend */}
          <div className="rounded-2xl border border-border/70 bg-background/60 p-3.5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-bold">{t('landing.preview.bpTitle')}</p>
              <Badge variant="success" className="text-[0.65rem]">{t('landing.preview.bpStatus')}</Badge>
            </div>
            <svg viewBox="0 0 224 64" className="mt-2 h-14 w-full">
              <defs>
                <linearGradient id="bpFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0D9488" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.02" />
                </linearGradient>
                <linearGradient id="bpLine" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#0D9488" />
                  <stop offset="100%" stopColor="#8B5CF6" />
                </linearGradient>
              </defs>
              <path d={`${BP_PATH} L222 64 L2 64 Z`} fill="url(#bpFill)" />
              <motion.path
                d={BP_PATH}
                fill="none"
                stroke="url(#bpLine)"
                strokeWidth="2.5"
                strokeLinecap="round"
                initial={{ pathLength: reduceMotion ? 1 : 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.6, ease: 'easeInOut', delay: 0.9 }}
              />
            </svg>
            <p className="text-[0.7rem] text-muted-foreground">
              {localized(Mariam.name, lang)} · 128/82
            </p>
          </div>
        </div>

        {/* Today's meds */}
        <p className="mt-5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
          {t('landing.preview.medsTitle')}
        </p>
        <ul className="mt-2.5 flex flex-col gap-2">
          {meds.map((med, i) => (
            <motion.li
              key={med.name}
              initial={{ opacity: 0, x: reduceMotion ? 0 : -14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45, ease: EASE_CINEMATIC, delay: 0.8 + i * 0.18 }}
              className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/60 px-3 py-2.5"
            >
              <span
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
                  med.taken ? 'bg-success text-success-foreground' : 'bg-warning/25 text-warning-foreground dark:text-warning',
                )}
              >
                {med.taken ? <Check className="size-4" /> : <Clock className="size-4" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold leading-tight">{med.name}</span>
                <span className="block truncate text-xs text-muted-foreground">{med.meta}</span>
              </span>
              <Badge variant={med.taken ? 'success' : 'warning'} className="shrink-0 text-[0.65rem]">
                {med.taken ? t('landing.preview.taken') : t('landing.preview.upcoming')}
              </Badge>
            </motion.li>
          ))}
        </ul>
      </motion.div>

      {/* Floating: AI insight */}
      <motion.div
        initial={{ opacity: 0, y: reduceMotion ? 0 : 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE_CINEMATIC, delay: 1.15 }}
        className="absolute -top-7 end-2 z-10 sm:-end-8"
      >
        <div className="glass animate-float w-60 rounded-2xl p-3.5 shadow-bloom">
          <p className="flex items-center gap-1.5 text-[0.7rem] font-bold uppercase tracking-wide text-brand-violet">
            <Sparkles className="size-3.5" />
            {t('landing.preview.insightKicker')}
          </p>
          <p className="mt-1.5 text-xs leading-relaxed">{t('landing.preview.insightText')}</p>
        </div>
      </motion.div>

      {/* Floating: meal plan */}
      <motion.div
        initial={{ opacity: 0, y: reduceMotion ? 0 : 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE_CINEMATIC, delay: 1.35 }}
        className="absolute -bottom-8 start-2 z-10 hidden sm:block sm:-start-10"
      >
        <div className="glass animate-float-slow flex items-start gap-2.5 rounded-2xl p-3.5 shadow-bloom" style={{ animationDelay: '0.8s' }}>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-amber/20 text-amber-600 dark:text-brand-amber">
            <UtensilsCrossed className="size-4.5" />
          </span>
          <span>
            <span className="block text-sm font-bold leading-tight">{t('landing.preview.mealChip')}</span>
            <span className="block text-xs text-muted-foreground">{t('landing.preview.mealChipSub')}</span>
          </span>
        </div>
      </motion.div>

      {/* Floating: clash resolved */}
      <motion.div
        initial={{ opacity: 0, y: reduceMotion ? 0 : 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE_CINEMATIC, delay: 1.55 }}
        className="absolute -bottom-6 end-3 z-10 sm:-end-6"
      >
        <div className="glass animate-float flex items-center gap-2 rounded-full py-2 pe-4 ps-2.5 shadow-bloom" style={{ animationDelay: '1.6s' }}>
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-400">
            <CalendarCheck2 className="size-4" />
          </span>
          <span>
            <span className="block text-xs font-bold leading-none">{t('landing.preview.scheduleChip')}</span>
            <span className="mt-0.5 block text-[0.68rem] leading-none text-muted-foreground">
              {t('landing.preview.scheduleChipSub')}
            </span>
          </span>
        </div>
      </motion.div>
    </div>
  );
}
