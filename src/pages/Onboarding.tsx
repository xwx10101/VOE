/*
 * ✏️ TEAM GUIDE: 3-step onboarding wizard — 1) family members 2) care
 * modules 3) celebration. Completes the draft family created at Register
 * and flips user.onboarded=true so the app unlocks.
 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Check,
  ChevronDown,
  CircleAlert,
  PartyPopper,
  Trash2,
  UserPlus,
} from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { Avatar } from '@/components/shared/Avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChipGroup } from '@/components/shared/ChipGroup';
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher';
import { ModuleCard } from '@/components/shared/ModuleCard';
import { Stepper } from '@/components/shared/Stepper';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { useShake } from '@/hooks/useShake';
import { useAuthStore } from '@/stores/authStore';
import { useFamilyStore } from '@/stores/familyStore';
import { EASE_CINEMATIC } from '@/lib/motion';
import { cn, localized, uid } from '@/lib/utils';
import { DEFAULT_MODULES, MODULES } from '@/config/app.config';
import type { FamilyMember, Lang, ModuleId, Relation } from '@/types';

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

interface MemberDraft {
  key: string;
  name: string;
  age: string;
  relation: Relation;
  conditions: string[];
  allergies: string[];
}

const emptyDraft = (relation: Relation = 'other'): MemberDraft => ({
  key: uid('draft'),
  name: '',
  age: '',
  relation,
  conditions: [],
  allergies: [],
});

/** How many blank member rows to start with (from the Register household size). */
function initialDrafts(userName: string): MemberDraft[] {
  let size = 1;
  try {
    const pending = Number(sessionStorage.getItem('nasmacare:pendingHouseholdSize'));
    if (pending >= 1 && pending <= 10) size = pending;
  } catch {
    /* ignore */
  }
  const drafts = Array.from({ length: size }, () => emptyDraft());
  drafts[0] = { ...emptyDraft('self'), name: userName };
  return drafts;
}

export function Onboarding() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const lang = (i18n.language === 'ar' ? 'ar' : 'en') as Lang;
  const user = useAuthStore((s) => s.user);
  const completeOnboarding = useAuthStore((s) => s.completeOnboarding);
  const family = useFamilyStore((s) => s.family);
  const setFamily = useFamilyStore((s) => s.setFamily);
  const { controls, shake } = useShake();

  const [step, setStep] = useState(0);
  const [drafts, setDrafts] = useState<MemberDraft[]>(() => initialDrafts(user?.name ?? ''));
  const [modules, setModules] = useState<ModuleId[]>(
    () => family?.enabledModules ?? [...DEFAULT_MODULES],
  );
  const [error, setError] = useState<string | null>(null);
  const [savedMembers, setSavedMembers] = useState<FamilyMember[]>([]);

  const steps = [
    { id: 'members', label: t('onboarding.steps.members') },
    { id: 'modules', label: t('onboarding.steps.modules') },
    { id: 'done', label: t('onboarding.steps.done') },
  ];

  const conditionOptions = useMemo(
    () => CONDITION_KEYS.map((k) => ({ value: k, label: t(`conditions.${k}`) })),
    [t],
  );
  const allergyOptions = useMemo(
    () => ALLERGY_KEYS.map((k) => ({ value: k, label: t(`allergies.${k}`) })),
    [t],
  );

  const patchDraft = (key: string, patch: Partial<MemberDraft>) =>
    setDrafts((prev) => prev.map((d) => (d.key === key ? { ...d, ...patch } : d)));

  const toggleModule = (id: ModuleId) =>
    setModules((prev) => (prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]));

  const goToModules = () => {
    const filled = drafts.filter((d) => d.name.trim() !== '' || d.age.trim() !== '');
    if (filled.length === 0) {
      setError(t('onboarding.errors.atLeastOne'));
      shake();
      return;
    }
    if (filled.some((d) => d.name.trim() === '')) {
      setError(t('onboarding.errors.nameRequired'));
      shake();
      return;
    }
    const badAge = filled.some((d) => {
      const n = Number(d.age);
      return d.age.trim() === '' || Number.isNaN(n) || n < 0 || n > 120;
    });
    if (badAge) {
      setError(t('onboarding.errors.ageInvalid'));
      shake();
      return;
    }
    setError(null);
    setStep(1);
  };

  const finish = () => {
    if (modules.length === 0) {
      setError(t('auth.errors.moduleRequired'));
      shake();
      return;
    }
    setError(null);
    const members: FamilyMember[] = drafts
      .filter((d) => d.name.trim() !== '')
      .map((d) => ({
        id: uid('member'),
        name: { ar: d.name.trim(), en: d.name.trim() },
        age: Number(d.age),
        relation: d.relation,
        conditions: d.conditions,
        allergies: d.allergies,
      }));
    const fallbackName = user?.name ?? '';
    setFamily({
      id: family?.id ?? uid('family'),
      name: family?.name ?? { ar: fallbackName, en: fallbackName },
      members,
      enabledModules: modules,
    });
    setSavedMembers(members);
    completeOnboarding();
    setStep(2);
    toast.success(t('onboarding.success'));
  };

  const firstName = (user?.name ?? '').split(/\s+/)[0] ?? '';
  const familyDisplay = family ? localized(family.name, lang) : '';

  return (
    <div className="mesh-bg min-h-svh">
      <div className="container flex items-center justify-between py-5">
        <Logo variant="compact" />
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>

      <main className="container pb-20">
        <div className="mx-auto max-w-3xl">
          <p className="text-center text-xs font-bold uppercase tracking-[0.16em] text-primary">
            {t('onboarding.eyebrow')}
          </p>
          <div className="mx-auto mt-6 max-w-xl">
            <Stepper steps={steps} current={step} />
          </div>

          <motion.div animate={controls} className="mt-10">
            <AnimatePresence mode="wait" initial={false}>
              {/* ---------- STEP 1: MEMBERS ---------- */}
              {step === 0 ? (
                <motion.section
                  key="members"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.35, ease: EASE_CINEMATIC }}
                >
                  <h1 className="text-center text-3xl font-extrabold tracking-tight">{t('onboarding.membersTitle')}</h1>
                  <p className="mx-auto mt-3 max-w-xl text-center leading-relaxed text-muted-foreground">
                    {t('onboarding.membersDesc')}
                  </p>

                  <div className="mt-8 flex flex-col gap-5">
                    <AnimatePresence initial={false}>
                      {drafts.map((draft, i) => (
                        <motion.article
                          key={draft.key}
                          layout
                          initial={{ opacity: 0, y: 18 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.96 }}
                          transition={{ duration: 0.3, ease: EASE_CINEMATIC }}
                          className="rounded-[1.5rem] border border-border/80 bg-card p-5 shadow-soft sm:p-6"
                        >
                          <header className="flex items-center justify-between gap-3">
                            <span className="flex items-center gap-3">
                              <Avatar name={draft.name || '?'} />
                              <span className="font-bold">{t('onboarding.memberLabel', { n: i + 1 })}</span>
                            </span>
                            {drafts.length > 1 ? (
                              <button
                                type="button"
                                onClick={() => setDrafts((prev) => prev.filter((d) => d.key !== draft.key))}
                                aria-label={t('onboarding.removeMember')}
                                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                              >
                                <Trash2 className="size-4.5" aria-hidden="true" />
                              </button>
                            ) : null}
                          </header>

                          <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_7rem_1fr]">
                            <span className="flex flex-col gap-2">
                              <Label htmlFor={`name-${draft.key}`}>{t('onboarding.name')}</Label>
                              <Input
                                id={`name-${draft.key}`}
                                value={draft.name}
                                onChange={(e) => patchDraft(draft.key, { name: e.target.value })}
                                placeholder={t('onboarding.namePlaceholder')}
                              />
                            </span>
                            <span className="flex flex-col gap-2">
                              <Label htmlFor={`age-${draft.key}`}>{t('onboarding.age')}</Label>
                              <Input
                                id={`age-${draft.key}`}
                                type="number"
                                inputMode="numeric"
                                min={0}
                                max={120}
                                value={draft.age}
                                onChange={(e) => patchDraft(draft.key, { age: e.target.value })}
                                placeholder={t('onboarding.agePlaceholder')}
                              />
                            </span>
                            <span className="flex flex-col gap-2">
                              <Label htmlFor={`relation-${draft.key}`}>{t('onboarding.relation')}</Label>
                              <span className="relative block">
                                <select
                                  id={`relation-${draft.key}`}
                                  value={draft.relation}
                                  onChange={(e) => patchDraft(draft.key, { relation: e.target.value as Relation })}
                                  className="h-11 w-full appearance-none rounded-xl border border-input bg-background/70 px-3.5 pe-10 text-sm shadow-sm transition hover:border-primary/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                >
                                  {RELATIONS.map((r) => (
                                    <option key={r} value={r}>
                                      {t(`relations.${r}`)}
                                    </option>
                                  ))}
                                </select>
                                <ChevronDown className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                              </span>
                            </span>
                          </div>

                          <div className="mt-5 grid gap-5 sm:grid-cols-2">
                            <fieldset className="flex flex-col gap-2">
                              <legend className="mb-2 text-sm font-semibold">
                                {t('onboarding.conditions')}{' '}
                                <span className="font-normal text-muted-foreground">({t('common.optional')})</span>
                              </legend>
                              <ChipGroup
                                ariaLabel={t('onboarding.conditions')}
                                options={conditionOptions}
                                selected={draft.conditions}
                                onChange={(v) => patchDraft(draft.key, { conditions: v })}
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
                                selected={draft.allergies}
                                onChange={(v) => patchDraft(draft.key, { allergies: v })}
                              />
                            </fieldset>
                          </div>
                        </motion.article>
                      ))}
                    </AnimatePresence>

                    <button
                      type="button"
                      onClick={() => setDrafts((prev) => [...prev, emptyDraft()])}
                      className="flex items-center justify-center gap-2 rounded-[1.25rem] border-2 border-dashed border-border bg-background/50 py-4 font-semibold text-muted-foreground transition hover:border-primary/50 hover:text-primary"
                    >
                      <UserPlus className="size-5" aria-hidden="true" />
                      {t('onboarding.addMember')}
                    </button>
                  </div>

                  {error ? (
                    <p role="alert" className="mt-5 flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
                      <CircleAlert className="size-4.5 shrink-0" aria-hidden="true" />
                      {error}
                    </p>
                  ) : null}

                  <div className="mt-7 flex justify-end">
                    <Button variant="gradient" size="lg" onClick={goToModules} className="min-w-40">
                      {t('common.next')}
                    </Button>
                  </div>
                </motion.section>
              ) : step === 1 ? (
                /* ---------- STEP 2: MODULES ---------- */
                <motion.section
                  key="modules"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.35, ease: EASE_CINEMATIC }}
                >
                  <h1 className="text-center text-3xl font-extrabold tracking-tight">{t('onboarding.modulesTitle')}</h1>
                  <p className="mx-auto mt-3 max-w-xl text-center leading-relaxed text-muted-foreground">
                    {t('onboarding.modulesDesc')}
                  </p>
                  <div className="mt-8 grid gap-4 sm:grid-cols-2">
                    {MODULES.map((mod) => (
                      <ModuleCard
                        key={mod.id}
                        moduleId={mod.id}
                        selected={modules.includes(mod.id)}
                        onToggle={toggleModule}
                      />
                    ))}
                  </div>
                  {error ? (
                    <p role="alert" className="mt-5 flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
                      <CircleAlert className="size-4.5 shrink-0" aria-hidden="true" />
                      {error}
                    </p>
                  ) : null}
                  <div className="mt-7 flex gap-3">
                    <Button variant="outline" size="lg" onClick={() => setStep(0)} className="flex-1">
                      {t('common.back')}
                    </Button>
                    <Button variant="gradient" size="lg" onClick={finish} className="flex-[2]">
                      {t('common.next')}
                    </Button>
                  </div>
                </motion.section>
              ) : (
                /* ---------- STEP 3: CELEBRATION ---------- */
                <motion.section
                  key="done"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: EASE_CINEMATIC }}
                  className="flex flex-col items-center pt-6 text-center"
                >
                  <motion.span
                    initial={{ scale: 0, rotate: -30 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 14, delay: 0.15 }}
                    className="relative flex h-24 w-24 items-center justify-center rounded-full bg-brand-gradient text-white shadow-bloom"
                  >
                    <PartyPopper className="size-11" aria-hidden="true" />
                    <motion.span
                      initial={{ scale: 0.6, opacity: 0.7 }}
                      animate={{ scale: 1.6, opacity: 0 }}
                      transition={{ duration: 1.1, repeat: Infinity, ease: 'easeOut' }}
                      className="absolute inset-0 rounded-full border-2 border-primary/50"
                      aria-hidden="true"
                    />
                  </motion.span>

                  <h1 className="mt-8 text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">
                    {t('onboarding.doneTitle', { name: firstName })}
                  </h1>
                  <p className="mt-3 max-w-lg text-balance leading-relaxed text-muted-foreground">
                    {t('onboarding.doneDesc', { family: familyDisplay })}
                  </p>

                  {savedMembers.length > 0 ? (
                    <div className="mt-7 flex flex-wrap items-center justify-center gap-2.5">
                      {savedMembers.map((m, i) => (
                        <motion.span
                          key={m.id}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.35 + i * 0.1, duration: 0.35, ease: EASE_CINEMATIC }}
                          className={cn('glass flex items-center gap-2 rounded-full py-1.5 pe-4 ps-1.5 shadow-soft')}
                        >
                          <Avatar name={localized(m.name, lang)} size="sm" />
                          <span className="text-sm font-bold">{localized(m.name, lang)}</span>
                          <Check className="size-3.5 text-success" aria-hidden="true" />
                        </motion.span>
                      ))}
                    </div>
                  ) : null}

                  <Button
                    variant="gradient"
                    size="lg"
                    className="mt-9 min-w-56"
                    onClick={() => navigate('/dashboard', { replace: true })}
                  >
                    {t('onboarding.goDashboard')}
                  </Button>
                </motion.section>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
