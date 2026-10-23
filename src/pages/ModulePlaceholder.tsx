/*
 * ✏️ TEAM GUIDE: Elegant stand-in for modules arriving in later phases
 * (Medications P3 · Schedule P3 · Meals P4 · Safety P4 · Assistant P5).
 * Each phase replaces its route's element with the real page.
 */
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Hammer } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageHeader } from '@/components/shared/PageHeader';
import { MODULE_ICONS } from '@/components/shared/moduleIcons';
import { fadeUp, staggerContainer } from '@/lib/motion';
import type { ModuleId } from '@/types';

interface ModulePlaceholderProps {
  moduleId: ModuleId;
  phase: number;
}

export function ModulePlaceholder({ moduleId, phase }: ModulePlaceholderProps) {
  const { t } = useTranslation();
  const Icon = MODULE_ICONS[moduleId];
  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="flex flex-col gap-6">
      <PageHeader
        title={t(`modules.${moduleId}.title`)}
        subtitle={t(`modules.${moduleId}.desc`)}
        actions={
          <Badge variant="violet">
            <Hammer aria-hidden="true" />
            {t('moduleComing.badge', { phase })}
          </Badge>
        }
      />
      <motion.div variants={fadeUp}>
        <EmptyState
          icon={Icon}
          title={t(`modules.${moduleId}.title`)}
          desc={t('moduleComing.desc', { phase })}
          className="py-16"
          action={
            <Button asChild variant="gradient">
              <Link to="/dashboard">{t('moduleComing.backDashboard')}</Link>
            </Button>
          }
        />
      </motion.div>
    </motion.div>
  );
}
