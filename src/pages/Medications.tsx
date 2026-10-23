/*
 * ✏️ TEAM GUIDE: Smart Medication Intelligence — member tabs, adherence ring
 * + 14-day trend, refill alerts, and medication cards with risk badges,
 * refill countdowns and tappable dose slots. Full CRUD via dialog.
 */
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { PackageOpen, Pill, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { CountUp } from '@/components/shared/CountUp';
import { EmptyState } from '@/components/shared/EmptyState';
import { MemberFilter, type MemberFilterValue } from '@/components/shared/MemberFilter';
import { PageHeader } from '@/components/shared/PageHeader';
import { ProgressRing } from '@/components/shared/ProgressRing';
import { AdherenceChart } from '@/components/medications/AdherenceChart';
import { MedicationCard } from '@/components/medications/MedicationCard';
import {
  MedicationFormDialog,
  type MedicationFormValues,
} from '@/components/medications/MedicationFormDialog';
import { todayKey } from '@/lib/dates';
import { fadeUp, staggerContainer } from '@/lib/motion';
import {
  adherenceReport,
  buildDayDoses,
  eveningMissCount,
  missedDoseRisk,
  refillDaysLeft,
} from '@/lib/stats';
import { localized, uid } from '@/lib/utils';
import { useFamilyStore } from '@/stores/familyStore';
import { useMedicationsStore } from '@/stores/medicationsStore';
import type { DoseStatus, Lang, Medication } from '@/types';

export function Medications() {
  const { t, i18n } = useTranslation();
  const lang = (i18n.language === 'ar' ? 'ar' : 'en') as Lang;
  const family = useFamilyStore((s) => s.family);
  const medications = useMedicationsStore((s) => s.medications);
  const doseLog = useMedicationsStore((s) => s.doseLog);
  const markDose = useMedicationsStore((s) => s.markDose);
  const addMedication = useMedicationsStore((s) => s.addMedication);
  const updateMedication = useMedicationsStore((s) => s.updateMedication);
  const removeMedication = useMedicationsStore((s) => s.removeMedication);

  const [filter, setFilter] = useState<MemberFilterValue>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Medication | null>(null);
  const [deleting, setDeleting] = useState<Medication | null>(null);

  const members = family?.members ?? [];
  const membersById = useMemo(() => new Map(members.map((m) => [m.id, m] as const)), [members]);
  const today = todayKey();

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: medications.length };
    for (const med of medications) map[med.memberId] = (map[med.memberId] ?? 0) + 1;
    return map;
  }, [medications]);

  const filtered = useMemo(
    () => (filter === 'all' ? medications : medications.filter((m) => m.memberId === filter)),
    [medications, filter],
  );

  const adherence7 = useMemo(
    () => adherenceReport(filtered, doseLog, 7),
    [filtered, doseLog],
  );
  const adherence14 = useMemo(
    () => adherenceReport(filtered, doseLog, 14),
    [filtered, doseLog],
  );
  const todayDoses = useMemo(() => buildDayDoses(medications, doseLog, today), [medications, doseLog, today]);
  const dosesByMed = useMemo(() => {
    const map = new Map<string, typeof todayDoses>();
    for (const d of todayDoses) {
      const list = map.get(d.medication.id) ?? [];
      list.push(d);
      map.set(d.medication.id, list);
    }
    return map;
  }, [todayDoses]);

  const refillAlerts = useMemo(
    () =>
      filtered
        .map((med) => ({ med, days: refillDaysLeft(med) }))
        .filter((x) => x.days <= 7)
        .sort((a, b) => a.days - b.days),
    [filtered],
  );

  const handleMark = (medicationId: string, time: string, status: DoseStatus | 'clear') =>
    markDose(medicationId, today, time, status);

  const handleSave = (values: MedicationFormValues) => {
    if (editing) {
      updateMedication({ ...editing, ...values });
      toast.success(t('meds.saved'));
    } else {
      addMedication({ id: uid('med'), startDate: today, ...values });
      toast.success(t('meds.added'));
    }
  };

  const handleDelete = () => {
    if (!deleting) return;
    removeMedication(deleting.id);
    toast.success(t('meds.deleted'));
    setDeleting(null);
  };

  const openAdd = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="flex flex-col gap-6">
      <PageHeader
        title={t('modules.medications.title')}
        subtitle={t('meds.subtitle')}
        actions={
          <Button variant="gradient" onClick={openAdd}>
            <Plus aria-hidden="true" />
            {t('meds.add')}
          </Button>
        }
      />

      <motion.div variants={fadeUp}>
        <MemberFilter
          members={members}
          value={filter}
          onChange={setFilter}
          allLabel={t('meds.allMembers')}
          lang={lang}
          counts={counts}
        />
      </motion.div>

      {medications.length === 0 ? (
        <motion.div variants={fadeUp}>
          <EmptyState
            icon={Pill}
            title={t('meds.empty.title')}
            desc={t('meds.empty.desc')}
            className="py-16"
            action={
              <Button variant="gradient" onClick={openAdd}>
                <Plus aria-hidden="true" />
                {t('meds.empty.action')}
              </Button>
            }
          />
        </motion.div>
      ) : filtered.length === 0 ? (
        <motion.div variants={fadeUp}>
          <EmptyState
            icon={Pill}
            title={t('meds.emptyMember.title', {
              name: filter !== 'all' ? localized(membersById.get(filter)?.name ?? { ar: '', en: '' }, lang) : '',
            })}
            desc={t('meds.emptyMember.desc')}
            className="py-16"
            action={
              <Button variant="gradient" onClick={openAdd}>
                <Plus aria-hidden="true" />
                {t('meds.add')}
              </Button>
            }
          />
        </motion.div>
      ) : (
        <>
          {/* Analytics row */}
          <section className="grid items-stretch gap-4 lg:grid-cols-3">
            <motion.div variants={fadeUp}>
              <Card className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
                <ProgressRing
                  value={adherence7.pct ?? 0}
                  size={132}
                  strokeWidth={11}
                  label={t('meds.adherence7d')}
                >
                  <span className="text-3xl font-extrabold">
                    {adherence7.pct === null ? '—' : <CountUp end={adherence7.pct} suffix="%" />}
                  </span>
                </ProgressRing>
                <p className="font-bold">{t('meds.adherence7d')}</p>
                <p className="text-sm text-muted-foreground">
                  {t('meds.adherenceOf', { taken: adherence7.taken, total: adherence7.total })}
                </p>
              </Card>
            </motion.div>

            <motion.div variants={fadeUp} className="lg:col-span-2">
              <Card className="h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{t('meds.trendTitle')}</CardTitle>
                  <CardDescription>{t('meds.trendSub')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <AdherenceChart perDay={adherence14.perDay} lang={lang} />
                </CardContent>
              </Card>
            </motion.div>
          </section>

          {/* Refill alerts */}
          {refillAlerts.length > 0 ? (
            <motion.section
              variants={fadeUp}
              aria-live="polite"
              className="rounded-2xl border border-warning/45 bg-warning/[0.08] p-4"
            >
              <p className="flex items-center gap-2 font-extrabold text-warning-foreground dark:text-warning">
                <PackageOpen className="size-5" aria-hidden="true" />
                {t('meds.refill.alertTitle')}
              </p>
              <ul className="mt-2 flex flex-col gap-1 text-sm">
                {refillAlerts.map(({ med, days }) => (
                  <li key={med.id} className="text-foreground/85">
                    {t('meds.refill.alertItem', {
                      med: `${localized(med.name, lang)} ${med.dosage}`,
                      member: localized(membersById.get(med.memberId)?.name ?? { ar: '', en: '' }, lang),
                      days: t('meds.refill.daysLeft', { count: days }),
                    })}
                  </li>
                ))}
              </ul>
            </motion.section>
          ) : null}

          {/* Medication cards */}
          <motion.section
            key={filter}
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3"
          >
            {filtered.map((med) => (
              <motion.div key={med.id} variants={fadeUp} layout>
                <MedicationCard
                  med={med}
                  member={membersById.get(med.memberId)}
                  todayDoses={dosesByMed.get(med.id) ?? []}
                  adherencePct={adherenceReport([med], doseLog, 7, { medicationId: med.id }).pct}
                  risk={missedDoseRisk(med, doseLog)}
                  eveningMisses={eveningMissCount(med, doseLog)}
                  onMark={handleMark}
                  onEdit={(m) => {
                    setEditing(m);
                    setDialogOpen(true);
                  }}
                  onDelete={setDeleting}
                />
              </motion.div>
            ))}
          </motion.section>
        </>
      )}

      <MedicationFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editing}
        members={members}
        defaultMemberId={filter !== 'all' ? filter : undefined}
        onSave={handleSave}
      />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={t('meds.deleteTitle', { name: deleting ? localized(deleting.name, lang) : '' })}
        desc={t('meds.deleteDesc')}
        confirmLabel={t('common.delete')}
        onConfirm={handleDelete}
      />
    </motion.div>
  );
}
