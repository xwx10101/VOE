/*
 * ✏️ TEAM GUIDE: Add/edit weekly event dialog, including the COMPANION field
 * (who must accompany — the conflict engine checks their calendar too).
 */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2 } from 'lucide-react';
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
import { FormField } from '@/components/shared/FormField';
import { timeToMinutes, weekdayName, WEEK_ORDER_MONDAY_FIRST } from '@/lib/dates';
import { localized } from '@/lib/utils';
import type {
  EventCategory,
  FamilyMember,
  Lang,
  LocalizedString,
  ScheduleEvent,
} from '@/types';

export interface EventFormValues {
  memberId: string;
  title: LocalizedString;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  category: EventCategory;
  location?: LocalizedString;
  withMemberId?: string;
}

const CATEGORIES: EventCategory[] = ['school', 'work', 'medical', 'sport', 'family', 'other'];

interface EventFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: ScheduleEvent | null;
  members: FamilyMember[];
  defaultMemberId?: string;
  onSave: (values: EventFormValues) => void;
  onDelete?: (event: ScheduleEvent) => void;
}

export function EventFormDialog({
  open,
  onOpenChange,
  initial,
  members,
  defaultMemberId,
  onSave,
  onDelete,
}: EventFormDialogProps) {
  const { t, i18n } = useTranslation();
  const lang = (i18n.language === 'ar' ? 'ar' : 'en') as Lang;

  const [memberId, setMemberId] = useState('');
  const [title, setTitle] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [startTime, setStartTime] = useState('16:00');
  const [endTime, setEndTime] = useState('17:00');
  const [category, setCategory] = useState<EventCategory>('family');
  const [location, setLocation] = useState('');
  const [companion, setCompanion] = useState('');
  const [errors, setErrors] = useState<Partial<Record<'title' | 'time', string>>>({});

  useEffect(() => {
    if (!open) return;
    setMemberId(initial?.memberId ?? defaultMemberId ?? members[0]?.id ?? '');
    setTitle(initial ? localized(initial.title, lang) : '');
    setDayOfWeek(initial?.dayOfWeek ?? new Date().getDay());
    setStartTime(initial?.startTime ?? '16:00');
    setEndTime(initial?.endTime ?? '17:00');
    setCategory(initial?.category ?? 'family');
    setLocation(initial?.location ? localized(initial.location, lang) : '');
    setCompanion(initial?.withMemberId ?? '');
    setErrors({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial]);

  const patchLocalized = (current: LocalizedString | undefined, value: string): LocalizedString =>
    current ? { ...current, [lang]: value } : { ar: value, en: value };

  const handleSave = () => {
    const next: typeof errors = {};
    if (title.trim() === '') next.title = t('sched.form.errors.titleRequired');
    if (!startTime || !endTime || timeToMinutes(endTime) <= timeToMinutes(startTime))
      next.time = t('sched.form.errors.endAfterStart');
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    onSave({
      memberId,
      title: patchLocalized(initial?.title, title.trim()),
      dayOfWeek,
      startTime,
      endTime,
      category,
      location: location.trim() ? patchLocalized(initial?.location, location.trim()) : undefined,
      withMemberId: companion && companion !== memberId ? companion : undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{initial ? t('sched.edit') : t('sched.add')}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          <FormField id="evt-title" label={t('sched.form.title')} error={errors.title}>
            <Input
              id="evt-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('sched.form.titlePlaceholder')}
              aria-invalid={!!errors.title}
              aria-describedby={errors.title ? 'evt-title-error' : undefined}
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <span className="flex flex-col gap-2">
              <Label htmlFor="evt-member">{t('sched.form.member')}</Label>
              <Select id="evt-member" value={memberId} onChange={(e) => setMemberId(e.target.value)}>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {localized(m.name, lang)}
                  </option>
                ))}
              </Select>
            </span>
            <span className="flex flex-col gap-2">
              <Label htmlFor="evt-day">{t('sched.form.day')}</Label>
              <Select id="evt-day" value={String(dayOfWeek)} onChange={(e) => setDayOfWeek(Number(e.target.value))}>
                {WEEK_ORDER_MONDAY_FIRST.map((dow) => (
                  <option key={dow} value={dow}>
                    {weekdayName(dow, lang, 'long')}
                  </option>
                ))}
              </Select>
            </span>
            <FormField id="evt-start" label={t('sched.form.start')}>
              <Input id="evt-start" type="time" dir="ltr" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </FormField>
            <FormField id="evt-end" label={t('sched.form.end')} error={errors.time}>
              <Input
                id="evt-end"
                type="time"
                dir="ltr"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                aria-invalid={!!errors.time}
                aria-describedby={errors.time ? 'evt-end-error' : undefined}
              />
            </FormField>
            <span className="flex flex-col gap-2">
              <Label htmlFor="evt-category">{t('sched.form.category')}</Label>
              <Select id="evt-category" value={category} onChange={(e) => setCategory(e.target.value as EventCategory)}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {t(`categories.${c}`)}
                  </option>
                ))}
              </Select>
            </span>
            <FormField id="evt-location" label={t('sched.form.location')} hint={t('common.optional')}>
              <Input
                id="evt-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={t('sched.form.locationPlaceholder')}
              />
            </FormField>
          </div>

          <span className="flex flex-col gap-2">
            <Label htmlFor="evt-companion">{t('sched.form.companion')}</Label>
            <Select id="evt-companion" value={companion} onChange={(e) => setCompanion(e.target.value)}>
              <option value="">{t('sched.form.companionNone')}</option>
              {members
                .filter((m) => m.id !== memberId)
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {localized(m.name, lang)}
                  </option>
                ))}
            </Select>
            <span className="text-xs text-muted-foreground">{t('sched.form.companionHint')}</span>
          </span>
        </div>

        <DialogFooter className="sm:justify-between">
          {initial && onDelete ? (
            <Button
              variant="ghost"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => {
                onOpenChange(false);
                onDelete(initial);
              }}
            >
              <Trash2 aria-hidden="true" />
              {t('sched.form.deleteEvent')}
            </Button>
          ) : (
            <span />
          )}
          <span className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="gradient" onClick={handleSave}>
              {t('common.save')}
            </Button>
          </span>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
