/*
 * ✏️ TEAM GUIDE: Rotating "AI Insight" card. Starts from the day-of-year so
 * every family sees a fresh daily insight; auto-advances every 9s (pauses on
 * hover/focus, honors reduced-motion). Content: src/data/insights.ts.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  Apple,
  ChevronLeft,
  ChevronRight,
  Droplets,
  Footprints,
  HeartHandshake,
  Lightbulb,
  MoonStar,
  Pill,
  Sparkles,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { insights } from '@/data/insights';
import { dayOfYear } from '@/lib/dates';
import { EASE_CINEMATIC } from '@/lib/motion';
import { localized } from '@/lib/utils';
import type { InsightCategory, Lang } from '@/types';

const CATEGORY_ICONS: Record<InsightCategory, LucideIcon> = {
  medication: Pill,
  nutrition: Apple,
  activity: Footprints,
  sleep: MoonStar,
  hydration: Droplets,
  eldercare: HeartHandshake,
  mindset: Lightbulb,
  familyTime: Users,
};

const ROTATE_MS = 9000;

export function InsightCard() {
  const { t, i18n } = useTranslation();
  const lang = (i18n.language === 'ar' ? 'ar' : 'en') as Lang;
  const isRTL = lang === 'ar';
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(() => dayOfYear() % insights.length);
  const [direction, setDirection] = useState(1);
  const pausedRef = useRef(false);

  const go = useCallback((dir: number) => {
    setDirection(dir);
    setIndex((i) => (i + dir + insights.length) % insights.length);
  }, []);

  useEffect(() => {
    if (reduceMotion) return;
    const timer = window.setInterval(() => {
      if (!pausedRef.current) go(1);
    }, ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [go, reduceMotion]);

  const insight = insights[index]!;
  const Icon = CATEGORY_ICONS[insight.category];
  const PrevIcon = isRTL ? ChevronRight : ChevronLeft;
  const NextIcon = isRTL ? ChevronLeft : ChevronRight;

  return (
    <article
      aria-live="polite"
      onMouseEnter={() => (pausedRef.current = true)}
      onMouseLeave={() => (pausedRef.current = false)}
      onFocus={() => (pausedRef.current = true)}
      onBlur={() => (pausedRef.current = false)}
      className="noise-overlay relative flex h-full flex-col overflow-hidden rounded-2xl border border-brand-violet/25 bg-gradient-to-br from-primary/[0.06] via-card to-brand-violet/[0.09] p-5 shadow-soft"
    >
      <header className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-brand-violet">
          <Sparkles className="size-4" aria-hidden="true" />
          {t('dashboard.insight.kicker')}
        </p>
        <Badge variant="violet">
          <Icon aria-hidden="true" />
          {t(`insightCategories.${insight.category}`)}
        </Badge>
      </header>

      <div className="relative mt-4 flex-1">
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={insight.id}
            custom={direction}
            initial={{ opacity: 0, x: reduceMotion ? 0 : direction * (isRTL ? -22 : 22) }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: reduceMotion ? 0 : direction * (isRTL ? 22 : -22) }}
            transition={{ duration: 0.35, ease: EASE_CINEMATIC }}
          >
            <h3 className="text-lg font-extrabold leading-snug tracking-tight">
              {localized(insight.title, lang)}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {localized(insight.body, lang)}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      <footer className="mt-5 flex items-center gap-3">
        <div
          className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={index + 1}
          aria-valuemin={1}
          aria-valuemax={insights.length}
        >
          <motion.div
            className="h-full rounded-full bg-brand-gradient"
            initial={false}
            animate={{ width: `${((index + 1) / insights.length) * 100}%` }}
            transition={{ duration: 0.45, ease: EASE_CINEMATIC }}
          />
        </div>
        <span className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label={t('dashboard.insight.prev')}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background/70 transition hover:border-primary/40 hover:text-primary active:scale-95"
          >
            <PrevIcon className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label={t('dashboard.insight.next')}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background/70 transition hover:border-primary/40 hover:text-primary active:scale-95"
          >
            <NextIcon className="size-4" aria-hidden="true" />
          </button>
        </span>
      </footer>
    </article>
  );
}
