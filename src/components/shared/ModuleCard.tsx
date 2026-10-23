/*
 * ✏️ TEAM GUIDE: Selectable module card used in Register (step 3) & Onboarding.
 * Renders as an accessible toggle button with icon, title, description and
 * an animated check when selected.
 */
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { MODULE_ICONS, MODULE_TINTS } from '@/components/shared/moduleIcons';
import { popIn } from '@/lib/motion';
import { cn } from '@/lib/utils';
import type { ModuleId } from '@/types';

interface ModuleCardProps {
  moduleId: ModuleId;
  selected: boolean;
  onToggle: (id: ModuleId) => void;
}

export function ModuleCard({ moduleId, selected, onToggle }: ModuleCardProps) {
  const { t } = useTranslation();
  const Icon = MODULE_ICONS[moduleId];
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => onToggle(moduleId)}
      className={cn(
        'group relative flex w-full flex-col gap-2.5 rounded-2xl border p-4 text-start transition-all duration-300 ease-cinematic active:scale-[0.98]',
        selected
          ? 'border-primary/60 bg-primary/[0.06] shadow-glow'
          : 'border-border bg-card hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-bloom',
      )}
    >
      <span className="flex items-start justify-between gap-2">
        <span
          className={cn(
            'flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105',
            MODULE_TINTS[moduleId],
          )}
        >
          <Icon className="size-5" aria-hidden="true" />
        </span>
        {selected ? (
          <motion.span
            variants={popIn}
            initial="hidden"
            animate="visible"
            className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-soft"
          >
            <Check className="size-3.5" aria-hidden="true" />
          </motion.span>
        ) : (
          <span className="h-6 w-6 rounded-full border-2 border-border transition group-hover:border-primary/40" aria-hidden="true" />
        )}
      </span>
      <span className="text-sm font-bold leading-snug">{t(`modules.${moduleId}.title`)}</span>
      <span className="text-xs leading-relaxed text-muted-foreground">{t(`modules.${moduleId}.desc`)}</span>
    </button>
  );
}
