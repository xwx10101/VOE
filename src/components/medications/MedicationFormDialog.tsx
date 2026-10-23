/*
 * ✏️ TEAM GUIDE: Add/edit medication dialog. Emits MedicationFormValues;
 * the page adds id/startDate and persists via the medications store.
 */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { FormField } from '@/components/shared/FormField';
import { localized } from '@/lib/utils';
import type {
  FamilyMember,
  Lang,
  LocalizedString,
  Medication,
  MedicationForm,
} from '@/types';

export interface MedicationFormValues {
  memberId: string;
  name: LocalizedString;
  dosage: string;
  form: MedicationForm;
  times: string[];
  asNeeded: boolean;
  instructions: LocalizedString;
  supplyRemaining: number;
  unitsPerDose: number;
}

const FORMS: MedicationForm[] = ['tablet', 'capsule', 'inhaler', 'drops', 'syrup', 'injection'];

interface MedicationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: Medication | null;
  members: FamilyMember[];
  defaultMemberId?: string;
  onSave: (values: MedicationFormValues) => void;
}

export function MedicationFormDialog({
  open,
  onOpenChange,
  initial,
  members,
  defaultMemberId,
  onSave,
}: MedicationFormDialogProps) {
  const { t, i18n } = useTranslation();
  const lang = (i18n.language === 'ar' ? 'ar' : 'en') as Lang;

  const [memberId, setMemberId] = useState('');
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [form, setForm] = useState<MedicationForm>('tablet');
  const [times, setTimes] = useState<string[]>(['08:00']);
  const [asNeeded, setAsNeeded] = useState(false);
  const [instructions, setInstructions] = useState('');
  const [supply, setSupply] = useState('30');
  const [unitsPerDose, setUnitsPerDose] = useState('1');
  const [errors, setErrors] = useState<Partial<Record<'name' | 'dosage' | 'times' | 'supply', string>>>({});

  useEffect(() => {
    if (!open) return;
    setMemberId(initial?.memberId ?? defaultMemberId ?? members[0]?.id ?? '');
    setName(initial ? localized(initial.name, lang) : '');
    setDosage(initial?.dosage ?? '');
    setForm(initial?.form ?? 'tablet');
    setTimes(initial && initial.times.length ? initial.times : ['08:00']);
    setAsNeeded(initial?.asNeeded ?? false);
    setInstructions(initial ? localized(initial.instructions, lang) : '');
    setSupply(initial ? String(initial.supplyRemaining) : '30');
    setUnitsPerDose(initial ? String(initial.unitsPerDose) : '1');
    setErrors({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial]);

  const patchLocalized = (current: LocalizedString | undefined, value: string): LocalizedString =>
    current ? { ...current, [lang]: value } : { ar: value, en: value };

  const handleSave = () => {
    const next: typeof errors = {};
    if (name.trim() === '') next.name = t('meds.form.errors.nameRequired');
    if (dosage.trim() === '') next.dosage = t('meds.form.errors.dosageRequired');
    const cleanTimes = [...new Set(times.filter(Boolean))].sort();
    if (!asNeeded && cleanTimes.length === 0) next.times = t('meds.form.errors.timeRequired');
    const supplyNum = Number(supply);
    if (supply.trim() === '' || Number.isNaN(supplyNum) || supplyNum < 0)
      next.supply = t('meds.form.errors.supplyInvalid');
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    onSave({
      memberId,
      name: patchLocalized(initial?.name, name.trim()),
      dosage: dosage.trim(),
      form,
      times: asNeeded ? [] : cleanTimes,
      asNeeded,
      instructions: patchLocalized(initial?.instructions, instructions.trim()),
      supplyRemaining: Math.round(supplyNum),
      unitsPerDose: Math.max(1, Math.round(Number(unitsPerDose) || 1)),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{initial ? t('meds.edit') : t('meds.add')}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="med-name" label={t('meds.form.name')} error={errors.name}>
              <Input
                id="med-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('meds.form.namePlaceholder')}
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'med-name-error' : undefined}
              />
            </FormField>
            <FormField id="med-dosage" label={t('meds.form.dosage')} error={errors.dosage}>
              <Input
                id="med-dosage"
                dir="ltr"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                placeholder={t('meds.form.dosagePlaceholder')}
                aria-invalid={!!errors.dosage}
                aria-describedby={errors.dosage ? 'med-dosage-error' : undefined}
              />
            </FormField>
            <span className="flex flex-col gap-2">
              <Label htmlFor="med-member">{t('meds.form.member')}</Label>
              <Select id="med-member" value={memberId} onChange={(e) => setMemberId(e.target.value)}>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {localized(m.name, lang)}
                  </option>
                ))}
              </Select>
            </span>
            <span className="flex flex-col gap-2">
              <Label htmlFor="med-form">{t('meds.form.formLabel')}</Label>
              <Select id="med-form" value={form} onChange={(e) => setForm(e.target.value as MedicationForm)}>
                {FORMS.map((f) => (
                  <option key={f} value={f}>
                    {t(`medForms.${f}`)}
                  </option>
                ))}
              </Select>
            </span>
          </div>

          {/* As-needed toggle */}
          <div className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-background/60 px-4 py-3">
            <Label htmlFor="med-as-needed" className="cursor-pointer leading-snug">
              {t('meds.form.asNeeded')}
            </Label>
            <Switch id="med-as-needed" checked={asNeeded} onCheckedChange={setAsNeeded} />
          </div>

          {/* Dose times */}
          {!asNeeded ? (
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-sm font-semibold">{t('meds.form.times')}</legend>
              <div className="flex flex-wrap gap-2">
                {times.map((time, i) => (
                  <span key={i} className="flex items-center gap-1">
                    <Input
                      type="time"
                      dir="ltr"
                      value={time}
                      aria-label={`${t('meds.form.times')} ${i + 1}`}
                      onChange={(e) =>
                        setTimes((prev) => prev.map((v, idx) => (idx === i ? e.target.value : v)))
                      }
                      className="h-10 w-[8.5rem]"
                    />
                    {times.length > 1 ? (
                      <button
                        type="button"
                        aria-label={t('meds.form.removeTime')}
                        onClick={() => setTimes((prev) => prev.filter((_, idx) => idx !== i))}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                      >
                        <X className="size-4" aria-hidden="true" />
                      </button>
                    ) : null}
                  </span>
                ))}
                <button
                  type="button"
                  onClick={() => setTimes((prev) => [...prev, '20:00'])}
                  className="inline-flex h-10 items-center gap-1.5 rounded-xl border-2 border-dashed border-border px-3 text-sm font-semibold text-muted-foreground transition hover:border-primary/50 hover:text-primary"
                >
                  <Plus className="size-4" aria-hidden="true" />
                  {t('meds.form.addTime')}
                </button>
              </div>
              {errors.times ? (
                <p role="alert" className="text-xs font-medium text-destructive">{errors.times}</p>
              ) : null}
            </fieldset>
          ) : null}

          <FormField id="med-instructions" label={t('meds.form.instructions')} hint={t('common.optional')}>
            <Input
              id="med-instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder={t('meds.form.instructionsPlaceholder')}
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="med-supply" label={t('meds.form.supply')} error={errors.supply}>
              <Input
                id="med-supply"
                type="number"
                inputMode="numeric"
                min={0}
                value={supply}
                onChange={(e) => setSupply(e.target.value)}
                aria-invalid={!!errors.supply}
                aria-describedby={errors.supply ? 'med-supply-error' : undefined}
              />
            </FormField>
            <FormField id="med-units" label={t('meds.form.unitsPerDose')}>
              <Input
                id="med-units"
                type="number"
                inputMode="numeric"
                min={1}
                value={unitsPerDose}
                onChange={(e) => setUnitsPerDose(e.target.value)}
              />
            </FormField>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button variant="gradient" onClick={handleSave}>
            {t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
