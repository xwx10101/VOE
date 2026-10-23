/* ✏️ TEAM GUIDE: Live password-strength meter (score comes from lib/api.ts). */
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const LEVELS = [
  { key: 'auth.strength.weak', className: 'bg-destructive' },
  { key: 'auth.strength.fair', className: 'bg-brand-amber' },
  { key: 'auth.strength.good', className: 'bg-chart-4' },
  { key: 'auth.strength.strong', className: 'bg-success' },
] as const;

export function PasswordStrength({ score }: { score: number }) {
  const { t } = useTranslation();
  if (score <= 0) return null;
  const level = LEVELS[Math.min(score, 4) - 1]!;
  return (
    <div className="flex flex-col gap-1.5" aria-live="polite">
      <div
        role="meter"
        aria-label={t('auth.strength.label')}
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={4}
        className="flex gap-1.5"
      >
        {LEVELS.map((l, i) => (
          <motion.span
            key={l.key}
            initial={false}
            animate={{ scaleY: i < score ? 1 : 0.7, opacity: i < score ? 1 : 0.35 }}
            className={cn('h-1.5 flex-1 rounded-full', i < score ? level.className : 'bg-muted')}
          />
        ))}
      </div>
      <p className="text-xs font-medium text-muted-foreground">
        {t('auth.strength.label')}: <span className="text-foreground">{t(level.key)}</span>
      </p>
    </div>
  );
}
