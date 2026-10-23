/*
 * ✏️ TEAM GUIDE: Add/edit family-member dialog (Settings).
 * Emits a plain values object via onSave — the page decides add vs update.
 * Labels reuse the onboarding.* i18n keys (same wording everywhere).
 */
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
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
import { ChipGroup } from '@/components/shared/ChipGroup';
import { FormField } from '@/components/shared/FormField';
import { localized } from '@/lib/utils';
import type { FamilyMember, Lang, LocalizedString, Relation } from '@/types';

export interface MemberFormValues {
  name: LocalizedString;
  age: number;
  relation: Relation;
  conditions: string[];
  allergies: string[];
}

const RELATIONS: Relation[] = [
  'self',
  'spouse',
  'father',
  'mother',
  'son',
  'daughter',
  'grandfather',
  'grandmother',
  'other',
];
const CONDITION_KEYS = ['diabetes', 'hypertension', 'asthma', 'heartDisease', 'highCholesterol'] as const;
const ALLERGY_KEYS = ['nuts', 'dairy', 'gluten', 'seafood', 'eggs'] as const;

interface MemberFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: FamilyMember | null;
  onSave: (values: MemberFormValues) => void;
}

export function MemberFormDialog({ open, onOpenChange, initial, onSave }: MemberFormDialogProps) {
  const { t, i18n } = useTranslation();
  const lang = (i18n.language === 'ar' ? 'ar' : 'en') as Lang;

  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [relation, setRelation] = useState<Relation>('other');
  const [conditions, setConditions] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [errors, setErrors] = useState<{ name?: string; age?: string }>({});

  // Reset the form whenever the dialog opens (add vs edit).
  useEffect(() => {
    if (!open) return;
    setName(initial ? localized(initial.name, lang) : '');
    setAge(initial ? String(initial.age) : '');
    setRelation(initial?.relation ?? 'other');
    setConditions(initial?.conditions ?? []);
    setAllergies(initial?.allergies ?? []);
    setErrors({});
    // lang intentionally excluded: reopening re-derives the displayed name.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial]);

  const conditionOptions = useMemo(
    () => CONDITION_KEYS.map((k) => ({ value: k, label: t(`conditions.${k}`) })),
    [t],
  );
  const allergyOptions = useMemo(
    () => ALLERGY_KEYS.map((k) => ({ value: k, label: t(`allergies.${k}`) })),
    [t],
  );

  const handleSave = () => {
    const next: typeof errors = {};
    if (name.trim() === '') next.name = t('onboarding.errors.nameRequired');
    const ageNum = Number(age);
    if (age.trim() === '' || Number.isNaN(ageNum) || ageNum < 0 || ageNum > 120)
      next.age = t('onboarding.errors.ageInvalid');
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const trimmed = name.trim();
    const localizedName: LocalizedString = initial
      ? { ...initial.name, [lang]: trimmed }
      : { ar: trimmed, en: trimmed };
    onSave({ name: localizedName, age: ageNum, relation, conditions, allergies });
    toast.success(initial ? t('settings.members.saved') : t('settings.members.added'));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? t('settings.members.edit') : t('settings.members.add')}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          <div className="grid gap-4 sm:grid-cols-[1fr_7rem]">
            <FormField id="member-name" label={t('onboarding.name')} error={errors.name}>
              <Input
                id="member-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('onboarding.namePlaceholder')}
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'member-name-error' : undefined}
              />
            </FormField>
            <FormField id="member-age" label={t('onboarding.age')} error={errors.age}>
              <Input
                id="member-age"
                type="number"
                inputMode="numeric"
                min={0}
                max={120}
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder={t('onboarding.agePlaceholder')}
                aria-invalid={!!errors.age}
                aria-describedby={errors.age ? 'member-age-error' : undefined}
              />
            </FormField>
          </div>

          <span className="flex flex-col gap-2">
            <Label htmlFor="member-relation">{t('onboarding.relation')}</Label>
            <Select
              id="member-relation"
              value={relation}
              onChange={(e) => setRelation(e.target.value as Relation)}
            >
              {RELATIONS.map((r) => (
                <option key={r} value={r}>
                  {t(`relations.${r}`)}
                </option>
              ))}
            </Select>
          </span>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-semibold">
              {t('onboarding.conditions')}{' '}
              <span className="font-normal text-muted-foreground">({t('common.optional')})</span>
            </legend>
            <ChipGroup
              ariaLabel={t('onboarding.conditions')}
              options={conditionOptions}
              selected={conditions}
              onChange={setConditions}
            />
          </fieldset>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-semibold">
              {t('onboarding.allergies')}{' '}
              <span className="font-normal text-muted-foreground">({t('common.optional')})</span>
            </legend>
            <ChipGroup
              ariaLabel={t('onboarding.allergies')}
              options={allergyOptions}
              selected={allergies}
              onChange={setAllergies}
            />
          </fieldset>
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
