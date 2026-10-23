/*
 * ✏️ TEAM GUIDE: Split-screen auth layout shared by Login & Register.
 * Start side = animated brand panel (floating care cards); end side = the form.
 * On mobile the brand panel collapses into a compact header.
 */
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Pill, Sparkles, UtensilsCrossed } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { EASE_CINEMATIC } from '@/lib/motion';

const FLOAT_CARDS = [
  { icon: Pill, titleKey: 'auth.brandPanel.card1Title', subKey: 'auth.brandPanel.card1Sub', className: 'top-[16%] start-[7%]', delay: '0s' },
  { icon: Sparkles, titleKey: 'auth.brandPanel.card2Title', subKey: 'auth.brandPanel.card2Sub', className: 'top-[41%] end-[6%]', delay: '1.2s' },
  { icon: UtensilsCrossed, titleKey: 'auth.brandPanel.card3Title', subKey: 'auth.brandPanel.card3Sub', className: 'bottom-[19%] start-[11%]', delay: '2.1s' },
] as const;

export function AuthShell({ children }: { children: React.ReactNode }) {
  const { t, i18n } = useTranslation();
  const reduceMotion = useReducedMotion();
  const BackIcon = i18n.language === 'ar' ? ArrowRight : ArrowLeft;

  return (
    <div className="grid min-h-svh lg:grid-cols-[1.05fr_1fr]">
      {/* ---- Brand panel (desktop) ---- */}
      <aside className="mesh-bg noise-overlay relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-10">
        <div
          aria-hidden="true"
          className="animate-mesh-pan pointer-events-none absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              'radial-gradient(480px 340px at 18% 12%, hsl(var(--brand-teal) / 0.3), transparent 65%), radial-gradient(520px 380px at 85% 85%, hsl(var(--brand-violet) / 0.3), transparent 65%)',
            backgroundSize: '130% 130%, 130% 130%',
          }}
        />
        <motion.div
          initial={{ opacity: 0, y: reduceMotion ? 0 : 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: EASE_CINEMATIC }}
          className="relative z-10"
        >
          <Logo />
          <h2 className="mt-10 max-w-md text-4xl font-extrabold leading-[1.15] tracking-tight">
            {t('auth.brandPanel.headline')}
          </h2>
          <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground">
            {t('auth.brandPanel.sub')}
          </p>
        </motion.div>

        {/* Floating showcase cards */}
        {FLOAT_CARDS.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.titleKey}
              initial={{ opacity: 0, y: reduceMotion ? 0 : 26 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE_CINEMATIC, delay: 0.25 + i * 0.16 }}
              className={`absolute z-10 ${card.className}`}
              aria-hidden="true"
            >
              <div
                className="glass animate-float flex max-w-[17rem] items-start gap-3 rounded-2xl p-3.5 shadow-bloom"
                style={{ animationDelay: card.delay }}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-gradient text-white">
                  <Icon className="size-4.5" />
                </span>
                <span>
                  <span className="block text-sm font-bold leading-tight">{t(card.titleKey)}</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                    {t(card.subKey)}
                  </span>
                </span>
              </div>
            </motion.div>
          );
        })}

        <motion.blockquote
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.7 }}
          className="relative z-10 max-w-md"
        >
          <p className="text-base font-medium leading-relaxed">{t('auth.brandPanel.quote')}</p>
          <cite className="mt-2 block text-sm not-italic text-muted-foreground">
            {t('auth.brandPanel.quoteBy')}
          </cite>
        </motion.blockquote>
      </aside>

      {/* ---- Form side ---- */}
      <main className="relative flex min-h-svh flex-col">
        <div className="flex items-center justify-between gap-2 p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background/60 backdrop-blur transition hover:border-primary/40 hover:text-primary"
              aria-label={t('common.back')}
            >
              <BackIcon className="size-4.5" aria-hidden="true" />
            </Link>
            <span className="lg:hidden">
              <Logo variant="compact" />
            </span>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center px-4 pb-10 sm:px-8">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </main>
    </div>
  );
}
