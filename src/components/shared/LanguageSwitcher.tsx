/*
 * ✏️ TEAM GUIDE: One-click AR ⇄ EN switch. Flips the entire layout (RTL/LTR)
 * instantly via the i18n engine and persists the choice.
 */
import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';
import { setLanguage } from '@/i18n';
import { cn } from '@/lib/utils';
import type { Lang } from '@/types';

interface LanguageSwitcherProps {
  className?: string;
  /** icon-only compact mode (still has an accessible label). */
  compact?: boolean;
}

export function LanguageSwitcher({ className, compact = false }: LanguageSwitcherProps) {
  const { t, i18n } = useTranslation();
  const current = (i18n.language === 'ar' ? 'ar' : 'en') as Lang;
  const next: Lang = current === 'ar' ? 'en' : 'ar';
  // Show the name of the language you will switch TO, in that language.
  const targetLabel = next === 'ar' ? 'العربية' : 'English';

  return (
    <button
      type="button"
      onClick={() => void setLanguage(next)}
      aria-label={t('language.switch')}
      className={cn(
        'inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-border bg-background/60 px-3 text-sm font-semibold text-foreground backdrop-blur transition-all duration-200 hover:border-primary/40 hover:text-primary active:scale-[0.97]',
        compact && 'w-10 px-0',
        className,
      )}
    >
      <Languages className="size-4 shrink-0" aria-hidden="true" />
      {compact ? null : <span>{targetLabel}</span>}
    </button>
  );
}
