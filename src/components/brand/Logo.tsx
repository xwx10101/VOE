/*
 * ✏️ TEAM GUIDE: The NasmaCare logo — a heart whose pulse line runs through it,
 * crowned by a golden crescent. Pure inline SVG (no image assets).
 * Variants: "full" (mark + wordmark), "compact" (mark + name, smaller), "mark".
 * The same artwork powers favicon.svg and (Phase 6) the PWA icons.
 */
import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface LogoProps {
  variant?: 'full' | 'compact' | 'mark';
  className?: string;
  markClassName?: string;
}

/** The standalone heart-pulse-crescent mark. */
export function LogoMark({ className }: { className?: string }) {
  const gradientId = useId().replace(/[:]/g, '');
  return (
    <svg
      viewBox="0 0 64 64"
      role="img"
      aria-hidden="true"
      focusable="false"
      className={cn('h-9 w-9 shrink-0', className)}
    >
      <defs>
        <linearGradient id={`nc-heart-${gradientId}`} x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#14B8A6" />
          <stop offset="0.55" stopColor="#0D9488" />
          <stop offset="1" stopColor="#8B5CF6" />
        </linearGradient>
        <linearGradient id={`nc-moon-${gradientId}`} x1="40" y1="0" x2="62" y2="18" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FBBF24" />
          <stop offset="1" stopColor="#F59E0B" />
        </linearGradient>
      </defs>
      {/* Heart */}
      <path
        d="M29 54C14.8 43 7.5 33.4 7.5 24.2 7.5 16.9 12.6 11.5 19.4 11.5c4.2 0 7.7 2.2 9.6 5.6 1.9-3.4 5.4-5.6 9.6-5.6 6.8 0 11.9 5.4 11.9 12.7 0 9.2-7.3 18.8-21.5 29.8Z"
        fill={`url(#nc-heart-${gradientId})`}
      />
      {/* Pulse (ECG) line */}
      <path
        d="M13 30h6.5l2.8-6 4.6 11.5 3-5.5h7.5"
        fill="none"
        stroke="#fff"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Crescent */}
      <path
        d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"
        transform="translate(40.5 -1.5) scale(0.92)"
        fill={`url(#nc-moon-${gradientId})`}
      />
    </svg>
  );
}

export function Logo({ variant = 'full', className, markClassName }: LogoProps) {
  const { t, i18n } = useTranslation();
  if (variant === 'mark') return <LogoMark className={markClassName ?? className} />;
  const isArabic = i18n.language === 'ar';
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark className={cn(variant === 'compact' ? 'h-8 w-8' : 'h-10 w-10', markClassName)} />
      <span
        className={cn(
          'font-extrabold leading-none tracking-tight text-foreground',
          variant === 'compact' ? 'text-lg' : 'text-[1.35rem]',
        )}
      >
        {t('brand.nameA')}
        {isArabic ? ' ' : ''}
        <span className="text-gradient">{t('brand.nameB')}</span>
      </span>
    </span>
  );
}
