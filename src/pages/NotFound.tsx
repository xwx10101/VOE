/* ✏️ TEAM GUIDE: Animated 404 — friendly, on-brand, with ways back home. */
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Home, LayoutDashboard } from 'lucide-react';
import { LogoMark } from '@/components/brand/Logo';
import { Button } from '@/components/ui/button';

export function NotFound() {
  const { t } = useTranslation();
  return (
    <main className="mesh-bg noise-overlay flex min-h-svh flex-col items-center justify-center gap-6 px-6 text-center">
      <motion.div
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="animate-float"
      >
        <LogoMark className="h-20 w-20" />
      </motion.div>
      <motion.p
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
        className="text-gradient text-[clamp(4.5rem,14vw,8rem)] font-extrabold leading-none tracking-tight"
        aria-hidden="true"
      >
        404
      </motion.p>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.22 }}
        className="flex flex-col items-center gap-3"
      >
        <h1 className="text-2xl font-extrabold tracking-tight">{t('notFound.title')}</h1>
        <p className="max-w-md text-balance text-muted-foreground">{t('notFound.desc')}</p>
        <div className="mt-3 flex flex-wrap justify-center gap-3">
          <Button asChild variant="gradient" size="lg">
            <Link to="/">
              <Home aria-hidden="true" />
              {t('notFound.backHome')}
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/dashboard">
              <LayoutDashboard aria-hidden="true" />
              {t('notFound.goDashboard')}
            </Link>
          </Button>
        </div>
      </motion.div>
    </main>
  );
}
