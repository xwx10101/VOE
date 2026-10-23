/*
 * ✏️ TEAM GUIDE: One medication at a glance — form icon, miss-risk badge,
 * refill countdown, today's tappable dose slots, 7-day adherence bar and an
 * "evening pattern" warning when the AI stats spot one.
 */
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  Check,
  CupSoda,
  Droplets,
  MoonStar,
  Pencil,
  Pill,
  Syringe,
  Trash2,
  Wind,
  type LucideIcon,
} from 'lucide-react';
import { Avatar } from '@/components/shared/Avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { MODULE_TINTS } from '@/components/shared/moduleIcons';
import { formatTime } from '@/lib/dates';
import { refillDaysLeft, type DayDose, type DoseRisk } from '@/lib/stats';
import { cn, localized } from '@/lib/utils';
import type { DoseStatus, FamilyMember, Lang, Medication, MedicationForm } from '@/types';

export const FORM_ICONS: Record<MedicationForm, LucideIcon> = {
  tablet: Pill,
  capsule: Pill,
  inhaler: Wind,
  drops: Droplets,
  syrup: CupSoda,
  injection: Syringe,
};

interface MedicationCardProps {
  med: Medication;
  member?: FamilyMember;
  todayDoses: DayDose[];
  adherencePct: number | null;
  risk: DoseRisk;
  eveningMisses: number;
  onMark: (medicationId: string, time: string, status: DoseStatus | 'clear') => void;
  onEdit: (med: Medication) => void;
  onDelete: (med: Medication) => void;
}

export function MedicationCard({
  med,
  member,
  todayDoses,
  adherencePct,
  risk,
  eveningMisses,
  onMark,
  onEdit,
  onDelete,
}: MedicationCardProps) {
  const { t, i18n } = useTranslation();
  const lang = (i18n.language === 'ar' ? 'ar' : 'en') as Lang;
  const FormIcon = FORM_ICONS[med.form];
  const daysLeft = refillDaysLeft(med);
  const refillUrgent = daysLeft <= 3;
  const refillSoon = !refillUrgent && daysLeft <= 7;

  const riskBadge = risk.level === 'high' ? 'destructive' : risk.level === 'medium' ? 'warning' : 'success';

  return (
    <Card className="group flex h-full flex-col gap-3.5 p-5 transition-all duration-300 ease-cinematic hover:-translate-y-1 hover:shadow-bloom">
      {/* Header */}
      <div className="flex items-start gap-3">
        <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', MODULE_TINTS.medications)}>
          <FormIcon className="size-5.5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-extrabold leading-tight">
            {localized(med.name, lang)}{' '}
            <span dir="ltr" className="text-sm font-semibold text-muted-foreground">{med.dosage}</span>
          </h3>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            {member ? (
              <>
                <Avatar name={localized(member.name, lang)} size="sm" className="h-5 w-5 text-[0.5rem]" />
                {localized(member.name, lang)} ·
              </>
            ) : null}
            {t(`medForms.${med.form}`)}
          </p>
        </div>
        <span className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            onClick={() => onEdit(med)}
            aria-label={t('meds.edit')}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-primary"
          >
            <Pencil className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(med)}
            aria-label={t('common.delete')}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </button>
        </span>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap items-center gap-1.5">
        {med.asNeeded ? (
          <Badge variant="violet">{t('meds.asNeeded')}</Badge>
        ) : (
          <Badge variant={riskBadge}>
            {t('meds.risk.label')}: {t(`meds.risk.${risk.level}`)}
          </Badge>
        )}
        {refillUrgent ? (
          <Badge variant="destructive">{t('meds.refill.now')}</Badge>
        ) : refillSoon ? (
          <Badge variant="warning">{t('meds.refill.soon')}</Badge>
        ) : null}
        <span className="ms-auto text-xs font-semibold text-muted-foreground">
          {t('meds.refill.unitsLeft', { count: med.supplyRemaining })}
          {Number.isFinite(daysLeft) ? ` · ${t('meds.refill.daysLeft', { count: daysLeft })}` : ''}
        </span>
      </div>

      <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
        {localized(med.instructions, lang)}
      </p>

      {/* Today's slots */}
      {!med.asNeeded ? (
        todayDoses.length > 0 ? (
          <div className="flex flex-wrap gap-2" role="group" aria-label={t('dashboard.timeline.title')}>
            {todayDoses.map((dose) => {
              const taken = dose.status === 'taken';
              return (
                <motion.button
                  key={dose.time}
                  type="button"
                  whileTap={{ scale: 0.88 }}
                  aria-pressed={taken}
                  title={t(`dashboard.timeline.${dose.status}`)}
                  onClick={() => onMark(med.id, dose.time, taken ? 'clear' : 'taken')}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-bold tabular-nums transition-all duration-200',
                    taken && 'border-success bg-success text-success-foreground shadow-soft',
                    dose.status === 'missed' && 'border-destructive/50 bg-destructive/[0.07] text-destructive hover:bg-destructive/15',
                    dose.status === 'due' && 'border-warning/60 bg-warning/15 text-warning-foreground dark:text-warning hover:bg-warning/25',
                    (dose.status === 'upcoming' || dose.status === 'skipped') &&
                      'border-border bg-background/60 text-foreground hover:border-primary/40 hover:text-primary',
                  )}
                >
                  {taken ? <Check className="size-4" aria-hidden="true" /> : null}
                  {formatTime(dose.time, lang)}
                </motion.button>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t('meds.noDosesToday')}</p>
        )
      ) : null}

      {/* Evening pattern warning */}
      {eveningMisses >= 2 ? (
        <p className="flex items-center gap-2 rounded-xl bg-warning/[0.12] px-3 py-2 text-xs font-semibold text-warning-foreground dark:text-warning">
          <MoonStar className="size-4 shrink-0" aria-hidden="true" />
          {t('meds.eveningMisses', { count: eveningMisses })}
        </p>
      ) : null}

      {/* Adherence bar */}
      {!med.asNeeded && adherencePct !== null ? (
        <div className="mt-auto flex flex-col gap-1.5 pt-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-muted-foreground">{t('meds.perMedAdherence')}</span>
            <span className="font-extrabold">{adherencePct}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={adherencePct} aria-valuemin={0} aria-valuemax={100}>
            <motion.div
              className={cn(
                'h-full rounded-full',
                adherencePct >= 90 ? 'bg-success' : adherencePct >= 75 ? 'bg-brand-gradient' : 'bg-warning',
              )}
              initial={{ width: 0 }}
              whileInView={{ width: `${adherencePct}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </div>
      ) : null}
    </Card>
  );
}
