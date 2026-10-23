/* ✏️ TEAM GUIDE: Public footer — brand, pillars, modules, competition credit. */
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HeartHandshake } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { MODULES } from '@/config/app.config';
import { MODULE_ICONS } from '@/components/shared/moduleIcons';

const PILLAR_KEYS = ['health', 'nutrition', 'time', 'peace'] as const;

export function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="border-t border-border/70 bg-card/50">
      <div className="container grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div className="flex flex-col gap-4">
          <Logo />
          <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">{t('footer.tagline')}</p>
          <p className="text-xs leading-relaxed text-muted-foreground/80">{t('footer.competition')}</p>
        </div>

        <nav aria-label={t('footer.pillarsTitle')}>
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-foreground">
            {t('footer.pillarsTitle')}
          </h3>
          <ul className="flex flex-col gap-2.5">
            {PILLAR_KEYS.map((key) => (
              <li key={key}>
                <a href="#pillars" className="text-sm text-muted-foreground transition hover:text-primary">
                  {t(`landing.pillars.${key}.title`)}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label={t('footer.modulesTitle')}>
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-foreground">
            {t('footer.modulesTitle')}
          </h3>
          <ul className="flex flex-col gap-2.5">
            {MODULES.map((mod) => {
              const Icon = MODULE_ICONS[mod.id];
              return (
                <li key={mod.id}>
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-primary"
                  >
                    <Icon className="size-4" aria-hidden="true" />
                    {t(`modules.${mod.id}.title`)}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="glass noise-overlay flex flex-col items-start gap-3 overflow-hidden rounded-2xl p-5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-bloom">
            <HeartHandshake className="size-5" aria-hidden="true" />
          </span>
          <p className="text-sm font-semibold leading-relaxed">{t('footer.yearOfFamily')}</p>
          <p className="text-xs leading-relaxed text-muted-foreground">{t('landing.problemText')}</p>
        </div>
      </div>
      <div className="border-t border-border/60 py-5">
        <p className="container text-center text-xs text-muted-foreground">{t('footer.rights')}</p>
      </div>
    </footer>
  );
}
