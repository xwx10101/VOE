/*
 * ✏️ TEAM GUIDE: Public landing page (marketing-grade).
 * Sections: hero + living product preview → problem statement → 4 pillars →
 * bento features (5 modules) → how the AI works → stats band → family
 * stories → CTA. Every string comes from i18n; edit copy in the JSON files.
 */
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Activity,
  BrainCircuit,
  CalendarCheck2,
  Check,
  FileText,
  MessageCircleHeart,
  Play,
  Quote,
  Salad,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  TrendingUp,
  WifiOff,
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ProductPreview } from '@/components/landing/ProductPreview';
import { Avatar } from '@/components/shared/Avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CountUp } from '@/components/shared/CountUp';
import { ProgressRing } from '@/components/shared/ProgressRing';
import { Reveal } from '@/components/shared/Reveal';
import { MODULE_ICONS, MODULE_TINTS } from '@/components/shared/moduleIcons';
import { useAuthStore } from '@/stores/authStore';
import { EASE_CINEMATIC } from '@/lib/motion';
import { cn } from '@/lib/utils';
import type { ModuleId } from '@/types';

const PILLARS = [
  { key: 'health', icon: Stethoscope, tint: 'bg-primary/12 text-primary' },
  { key: 'nutrition', icon: Salad, tint: 'bg-brand-amber/18 text-amber-700 dark:text-brand-amber' },
  { key: 'time', icon: CalendarCheck2, tint: 'bg-sky-500/12 text-sky-600 dark:text-sky-400' },
  { key: 'peace', icon: ShieldCheck, tint: 'bg-brand-violet/15 text-brand-violet' },
] as const;

const STEPS = [
  { key: 'understand', icon: MessageCircleHeart },
  { key: 'solve', icon: BrainCircuit },
  { key: 'predict', icon: TrendingUp },
  { key: 'summarize', icon: FileText },
] as const;

const STATS = [
  { icon: BrainCircuit, value: 12, suffix: '+', labelKey: 'landing.stats.intents' },
  { icon: Salad, value: 40, suffix: '+', labelKey: 'landing.stats.recipes' },
  { icon: Activity, value: 30, suffix: '', labelKey: 'landing.stats.trends' },
  { icon: WifiOff, value: 100, suffix: '%', labelKey: 'landing.stats.offline' },
] as const;

const STORIES = ['story1', 'story2', 'story3'] as const;
const BENTO_SINGLES: ModuleId[] = ['medications', 'meals', 'schedule', 'safety'];

/** Small decorative widgets inside bento module cards. */
function BentoWidget({ moduleId }: { moduleId: ModuleId }) {
  if (moduleId === 'medications') {
    return (
      <div className="mt-auto flex items-center gap-3 pt-4" aria-hidden="true">
        <ProgressRing value={94} size={54} strokeWidth={6}>
          <span className="text-[0.7rem] font-extrabold">94%</span>
        </ProgressRing>
        <div className="flex flex-1 flex-col gap-1.5">
          <span className="h-2 w-4/5 rounded-full bg-primary/25" />
          <span className="h-2 w-3/5 rounded-full bg-primary/15" />
          <span className="h-2 w-2/3 rounded-full bg-primary/10" />
        </div>
      </div>
    );
  }
  if (moduleId === 'meals') {
    return (
      <div className="mt-auto flex flex-col gap-2 pt-4" aria-hidden="true">
        {[
          ['w-[72%]', 'bg-brand-amber/70'],
          ['w-[48%]', 'bg-primary/60'],
          ['w-[60%]', 'bg-brand-violet/60'],
        ].map(([w, c], i) => (
          <span key={i} className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-muted-foreground/40" />
            <span className={cn('h-2 rounded-full', w, c)} />
          </span>
        ))}
      </div>
    );
  }
  if (moduleId === 'schedule') {
    return (
      <div className="mt-auto flex gap-1.5 pt-4" aria-hidden="true">
        {['bg-sky-500/50', 'bg-primary/50', 'bg-brand-violet/50', 'bg-brand-amber/60', 'bg-rose-500/45'].map(
          (c, i) => (
            <span key={i} className={cn('h-9 flex-1 rounded-lg', c, i === 2 && 'ring-2 ring-sky-500/60')} />
          ),
        )}
      </div>
    );
  }
  return (
    <svg viewBox="0 0 200 44" className="mt-auto w-full pt-3 text-rose-500" aria-hidden="true">
      <path
        d="M2 24h34l6-14 10 26 8-18 5 6h38l6-12 9 22 7-14 5 4h68"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SectionHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <Reveal className="mx-auto flex max-w-2xl flex-col items-center gap-3 text-center">
      <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-primary">
        <span className="h-px w-8 bg-primary/50" aria-hidden="true" />
        {eyebrow}
        <span className="h-px w-8 bg-primary/50" aria-hidden="true" />
      </span>
      <h2 className="text-balance text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">{title}</h2>
      {subtitle ? <p className="text-balance leading-relaxed text-muted-foreground">{subtitle}</p> : null}
    </Reveal>
  );
}

export function Landing() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const loginAsDemo = useAuthStore((s) => s.loginAsDemo);

  const handleDemo = async () => {
    try {
      const user = await loginAsDemo();
      toast.success(t('auth.success.welcomeBack', { name: user.name }));
      navigate('/dashboard');
    } catch {
      toast.error(t('auth.errors.generic'));
    }
  };

  const AssistantIcon = MODULE_ICONS.assistant;

  return (
    <div className="min-h-svh">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        {t('a11y.skipToContent')}
      </a>
      <Navbar />

      <main id="main">
        {/* ---------- HERO ---------- */}
        <section className="mesh-bg noise-overlay relative overflow-hidden pb-28 pt-32 sm:pt-40">
          <div className="container relative grid items-center gap-16 lg:grid-cols-[1fr_1.05fr]">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.11 } } }}
              className="flex flex-col items-start gap-6"
            >
              <motion.div variants={{ hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_CINEMATIC } } }}>
                <Badge variant="gradient" className="px-3.5 py-1 text-[0.8rem] shadow-bloom">
                  <Sparkles aria-hidden="true" />
                  {t('landing.badge')}
                </Badge>
              </motion.div>
              <motion.h1
                variants={{ hidden: { opacity: 0, y: 22 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_CINEMATIC } } }}
                className="text-balance text-[clamp(2.3rem,5.2vw,3.9rem)] font-extrabold leading-[1.08] tracking-tight"
              >
                {t('landing.heroTitleA')}{' '}
                <span className="text-gradient">{t('landing.heroTitleAccent')}</span>
                <span className="mt-2 block text-[0.52em] font-bold leading-snug text-muted-foreground">
                  {t('landing.heroTitleB')}
                </span>
              </motion.h1>
              <motion.p
                variants={{ hidden: { opacity: 0, y: 22 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_CINEMATIC } } }}
                className="max-w-xl text-balance text-base leading-relaxed text-muted-foreground sm:text-lg"
              >
                {t('landing.heroSubtitle')}
              </motion.p>
              <motion.div
                variants={{ hidden: { opacity: 0, y: 22 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_CINEMATIC } } }}
                className="flex flex-wrap items-center gap-3"
              >
                <Button asChild variant="gradient" size="lg">
                  <Link to="/register">{t('landing.heroPrimary')}</Link>
                </Button>
                <Button variant="outline" size="lg" onClick={() => void handleDemo()}>
                  <Play aria-hidden="true" />
                  {t('landing.heroSecondary')}
                </Button>
              </motion.div>
              <motion.p
                variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.6, delay: 0.2 } } }}
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-success/15 text-success">
                  <Check className="size-3" aria-hidden="true" />
                </span>
                {t('landing.heroNote')}
              </motion.p>
            </motion.div>

            <ProductPreview />
          </div>
        </section>

        {/* ---------- PROBLEM ---------- */}
        <section className="py-20 sm:py-24">
          <div className="container">
            <SectionHeader eyebrow={t('landing.problemEyebrow')} title={t('landing.problemTitle')} />
            <Reveal delay={0.12}>
              <blockquote className="relative mx-auto mt-10 max-w-3xl rounded-[1.75rem] border border-border/70 bg-card p-8 text-center shadow-soft sm:p-10">
                <Quote className="absolute -top-4 start-8 h-8 w-8 rounded-full bg-brand-gradient p-1.5 text-white shadow-bloom" aria-hidden="true" />
                <p className="text-balance text-lg font-medium leading-relaxed sm:text-xl">
                  {t('landing.problemText')}
                </p>
              </blockquote>
            </Reveal>
          </div>
        </section>

        {/* ---------- PILLARS ---------- */}
        <section id="pillars" className="scroll-mt-24 bg-muted/40 py-20 sm:py-24">
          <div className="container">
            <SectionHeader
              eyebrow={t('landing.pillarsEyebrow')}
              title={t('landing.pillarsTitle')}
              subtitle={t('landing.pillarsSubtitle')}
            />
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {PILLARS.map((pillar, i) => {
                const Icon = pillar.icon;
                return (
                  <Reveal key={pillar.key} delay={i * 0.09}>
                    <article className="group flex h-full flex-col gap-3 rounded-2xl border border-border/70 bg-card p-6 shadow-soft transition-all duration-300 ease-cinematic hover:-translate-y-1.5 hover:shadow-bloom">
                      <span className={cn('flex h-12 w-12 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110', pillar.tint)}>
                        <Icon className="size-6" aria-hidden="true" />
                      </span>
                      <h3 className="text-lg font-bold">{t(`landing.pillars.${pillar.key}.title`)}</h3>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {t(`landing.pillars.${pillar.key}.desc`)}
                      </p>
                    </article>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        {/* ---------- FEATURES BENTO ---------- */}
        <section id="features" className="scroll-mt-24 py-20 sm:py-24">
          <div className="container">
            <SectionHeader
              eyebrow={t('landing.featuresEyebrow')}
              title={t('landing.featuresTitle')}
              subtitle={t('landing.featuresSubtitle')}
            />
            <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {/* Assistant — signature, spans the top row */}
              <Reveal className="md:col-span-2 lg:col-span-4" delay={0.05}>
                <article className="noise-overlay relative overflow-hidden rounded-[1.75rem] border border-brand-violet/25 bg-gradient-to-br from-primary/[0.07] via-card to-brand-violet/[0.1] p-7 shadow-soft sm:p-9">
                  <div className="grid items-center gap-8 lg:grid-cols-2">
                    <div className="flex flex-col items-start gap-4">
                      <span className="flex items-center gap-3">
                        <span className={cn('flex h-12 w-12 items-center justify-center rounded-2xl', MODULE_TINTS.assistant)}>
                          <AssistantIcon className="size-6" aria-hidden="true" />
                        </span>
                        <Badge variant="violet">
                          <Sparkles aria-hidden="true" />
                          {t('landing.signature')}
                        </Badge>
                      </span>
                      <h3 className="text-2xl font-extrabold tracking-tight">{t('modules.assistant.title')}</h3>
                      <p className="max-w-md leading-relaxed text-muted-foreground">{t('modules.assistant.desc')}</p>
                      <Button variant="gradient" onClick={() => void handleDemo()}>
                        {t('landing.heroSecondary')}
                      </Button>
                    </div>
                    {/* Chat mock */}
                    <div className="flex flex-col gap-3" aria-hidden="true">
                      <motion.div
                        initial={{ opacity: 0, y: 14 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, ease: EASE_CINEMATIC, delay: 0.2 }}
                        className="max-w-[85%] self-end rounded-2xl rounded-ee-sm bg-brand-gradient px-4 py-3 text-sm font-medium text-white shadow-bloom"
                      >
                        {t('landing.bentoChatUser')}
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, y: 14 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, ease: EASE_CINEMATIC, delay: 0.45 }}
                        className="glass flex max-w-[92%] items-start gap-2.5 self-start rounded-2xl rounded-ss-sm p-3.5 shadow-soft"
                      >
                        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-violet/15 text-brand-violet">
                          <Sparkles className="size-3.5" />
                        </span>
                        <p className="text-sm leading-relaxed">{t('landing.bentoChatReply')}</p>
                      </motion.div>
                    </div>
                  </div>
                </article>
              </Reveal>

              {BENTO_SINGLES.map((moduleId, i) => {
                const Icon = MODULE_ICONS[moduleId];
                return (
                  <Reveal key={moduleId} delay={0.08 + i * 0.08}>
                    <article className="group flex h-full flex-col gap-3 rounded-[1.75rem] border border-border/70 bg-card p-6 shadow-soft transition-all duration-300 ease-cinematic hover:-translate-y-1.5 hover:shadow-bloom">
                      <span className={cn('flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110', MODULE_TINTS[moduleId])}>
                        <Icon className="size-5.5" aria-hidden="true" />
                      </span>
                      <h3 className="font-bold leading-snug">{t(`modules.${moduleId}.title`)}</h3>
                      <p className="text-sm leading-relaxed text-muted-foreground">{t(`modules.${moduleId}.desc`)}</p>
                      <BentoWidget moduleId={moduleId} />
                    </article>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        {/* ---------- HOW THE AI WORKS ---------- */}
        <section id="how-it-works" className="mesh-bg scroll-mt-24 py-20 sm:py-24">
          <div className="container">
            <SectionHeader
              eyebrow={t('landing.howEyebrow')}
              title={t('landing.howTitle')}
              subtitle={t('landing.howSubtitle')}
            />
            <div className="relative mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <span aria-hidden="true" className="absolute start-[12%] end-[12%] top-8 hidden border-t-2 border-dashed border-primary/30 lg:block" />
              {STEPS.map((step, i) => {
                const Icon = step.icon;
                return (
                  <Reveal key={step.key} delay={i * 0.12}>
                    <article className="relative flex h-full flex-col items-center gap-3 rounded-2xl border border-border/70 bg-card/80 p-6 text-center shadow-soft backdrop-blur transition-all duration-300 hover:-translate-y-1.5 hover:shadow-bloom">
                      <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-brand-gradient text-white shadow-bloom">
                        <Icon className="size-7" aria-hidden="true" />
                        <span className="absolute -end-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-card bg-foreground text-[0.7rem] font-extrabold text-background">
                          {i + 1}
                        </span>
                      </span>
                      <h3 className="text-lg font-bold">{t(`landing.steps.${step.key}.title`)}</h3>
                      <p className="text-sm leading-relaxed text-muted-foreground">{t(`landing.steps.${step.key}.desc`)}</p>
                    </article>
                  </Reveal>
                );
              })}
            </div>

            {/* Stats band */}
            <Reveal delay={0.15}>
              <div className="noise-overlay relative mt-14 overflow-hidden rounded-[1.75rem] bg-brand-gradient p-8 text-white shadow-bloom sm:p-10">
                <div className="relative z-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                  {STATS.map((stat) => {
                    const Icon = stat.icon;
                    return (
                      <div key={stat.labelKey} className="flex flex-col items-center gap-1.5 text-center">
                        <Icon className="size-6 opacity-85" aria-hidden="true" />
                        <span className="text-4xl font-extrabold tracking-tight">
                          <CountUp end={stat.value} suffix={stat.suffix} />
                        </span>
                        <span className="max-w-[13rem] text-sm leading-snug text-white/85">{t(stat.labelKey)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ---------- STORIES ---------- */}
        <section id="stories" className="scroll-mt-24 py-20 sm:py-24">
          <div className="container">
            <SectionHeader
              eyebrow={t('landing.storiesEyebrow')}
              title={t('landing.storiesTitle')}
              subtitle={t('landing.storiesSubtitle')}
            />
            <div className="mt-12 grid gap-5 lg:grid-cols-3">
              {STORIES.map((story, i) => (
                <Reveal key={story} delay={i * 0.1}>
                  <figure className="flex h-full flex-col gap-4 rounded-[1.75rem] border border-border/70 bg-card p-7 shadow-soft transition-all duration-300 ease-cinematic hover:-translate-y-1.5 hover:shadow-bloom">
                    <Quote className="size-7 text-primary/50" aria-hidden="true" />
                    <blockquote className="flex-1 leading-relaxed">{t(`landing.${story}.quote`)}</blockquote>
                    <figcaption className="flex items-center gap-3 border-t border-border/60 pt-4">
                      <Avatar name={t(`landing.${story}.name`)} />
                      <span>
                        <span className="block text-sm font-bold">{t(`landing.${story}.name`)}</span>
                        <span className="block text-xs text-muted-foreground">{t(`landing.${story}.role`)}</span>
                      </span>
                    </figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- CTA ---------- */}
        <section className="pb-24 pt-2">
          <div className="container">
            <Reveal>
              <div className="noise-overlay relative overflow-hidden rounded-[2rem] bg-brand-gradient px-6 py-14 text-center text-white shadow-bloom sm:px-10">
                <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center gap-5">
                  <h2 className="text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">
                    {t('landing.ctaTitle')}
                  </h2>
                  <p className="text-balance leading-relaxed text-white/85">{t('landing.ctaSubtitle')}</p>
                  <div className="mt-2 flex flex-wrap justify-center gap-3">
                    <Button asChild size="lg" className="bg-white text-teal-800 shadow-soft hover:bg-white/90">
                      <Link to="/register">{t('landing.ctaButton')}</Link>
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => void handleDemo()}
                      className="border-white/50 bg-transparent text-white hover:border-white hover:bg-white/10 hover:text-white"
                    >
                      <Play aria-hidden="true" />
                      {t('landing.heroSecondary')}
                    </Button>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
