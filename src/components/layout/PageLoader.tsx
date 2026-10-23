/* ✏️ TEAM GUIDE: Full-screen branded loading fallback (auth hydration / lazy routes). */
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { LogoMark } from '@/components/brand/Logo';

export function PageLoader() {
  const { t } = useTranslation();
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={t('common.loading')}
      className="mesh-bg flex min-h-svh flex-col items-center justify-center gap-5 p-6"
    >
      <motion.div
        animate={{ scale: [1, 1.08, 1], opacity: [1, 0.85, 1] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <LogoMark className="h-16 w-16" />
      </motion.div>
      <div className="flex w-52 flex-col gap-2.5" aria-hidden="true">
        <div className="skeleton h-3.5 w-full" />
        <div className="skeleton h-3.5 w-3/4 self-center" />
      </div>
      <span className="sr-only">{t('common.loading')}</span>
    </div>
  );
}
