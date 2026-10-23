/*
 * ✏️ TEAM GUIDE: Multi-step registration — 1) Account 2) Family 3) Modules.
 * Inline bilingual validation + password-strength meter + terms checkbox.
 * On success: creates the account, saves a draft family (name + modules),
 * then hands off to the Onboarding wizard for member details.
 */
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import { CircleAlert, Minus, Plus } from 'lucide-react';
import { AuthShell } from '@/components/auth/AuthShell';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { PasswordStrength } from '@/components/auth/PasswordStrength';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormField } from '@/components/shared/FormField';
import { ModuleCard } from '@/components/shared/ModuleCard';
import { Stepper } from '@/components/shared/Stepper';
import { useShake } from '@/hooks/useShake';
import { useAuthStore } from '@/stores/authStore';
import { useFamilyStore } from '@/stores/familyStore';
import { AuthError, isValidEmail, passwordStrength } from '@/lib/api';
import { EASE_CINEMATIC } from '@/lib/motion';
import { clamp, uid } from '@/lib/utils';
import { DEFAULT_MODULES, MODULES } from '@/config/app.config';
import type { ModuleId } from '@/types';

type Errors = Partial<
  Record<'name' | 'email' | 'password' | 'confirm' | 'terms' | 'familyName' | 'modules', string>
>;

export function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const register = useAuthStore((s) => s.register);
  const { controls, shake } = useShake();

  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [terms, setTerms] = useState(false);
  const [familyName, setFamilyName] = useState('');
  const [householdSize, setHouseholdSize] = useState(4);
  const [modules, setModules] = useState<ModuleId[]>([...DEFAULT_MODULES]);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  const strength = useMemo(() => passwordStrength(password), [password]);

  const steps = [
    { id: 'account', label: t('auth.steps.account'), desc: t('auth.steps.accountDesc') },
    { id: 'family', label: t('auth.steps.family'), desc: t('auth.steps.familyDesc') },
    { id: 'modules', label: t('auth.steps.modules'), desc: t('auth.steps.modulesDesc') },
  ];

  const toggleModule = (id: ModuleId) =>
    setModules((prev) => (prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]));

  const validateStep = (): boolean => {
    const next: Errors = {};
    if (step === 0) {
      if (name.trim().length < 3) next.name = t('auth.errors.nameShort');
      if (!email.trim()) next.email = t('auth.errors.required');
      else if (!isValidEmail(email)) next.email = t('auth.errors.emailInvalid');
      if (password.length < 8) next.password = t('auth.errors.passwordShort');
      if (confirm !== password) next.confirm = t('auth.errors.passwordMismatch');
      if (!terms) next.terms = t('auth.errors.termsRequired');
    }
    if (step === 1 && familyName.trim().length < 2) next.familyName = t('auth.errors.familyNameRequired');
    if (step === 2 && modules.length === 0) next.modules = t('auth.errors.moduleRequired');
    setErrors(next);
    if (Object.keys(next).length > 0) shake();
    return Object.keys(next).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) setStep((s) => Math.min(s + 1, 2));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 2) {
      handleNext();
      return;
    }
    if (!validateStep()) return;
    setSubmitting(true);
    try {
      const user = await register(name, email, password);
      // Draft family → Onboarding completes it with member details.
      useFamilyStore.getState().loadForUser(user.id);
      useFamilyStore.getState().setFamily({
        id: uid('family'),
        name: { ar: familyName.trim(), en: familyName.trim() },
        members: [],
        enabledModules: modules,
      });
      sessionStorage.setItem('nasmacare:pendingHouseholdSize', String(householdSize));
      toast.success(t('auth.success.accountCreated'));
      navigate('/onboarding', { replace: true });
    } catch (err) {
      const code = err instanceof AuthError ? err.code : 'generic';
      if (code === 'emailTaken') {
        setStep(0);
        setErrors({ email: t('auth.errors.emailTaken') });
      } else {
        toast.error(t('auth.errors.generic'));
      }
      shake();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell>
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE_CINEMATIC }}
      >
        <h1 className="text-3xl font-extrabold tracking-tight">{t('auth.registerTitle')}</h1>
        <p className="mt-2 text-muted-foreground">{t('auth.registerSubtitle')}</p>

        <div className="mt-7">
          <Stepper steps={steps} current={step} />
        </div>

        <motion.form animate={controls} onSubmit={(e) => void handleSubmit(e)} noValidate className="mt-7">
          <AnimatePresence mode="wait" initial={false}>
            {step === 0 ? (
              <motion.div
                key="step-account"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.32, ease: EASE_CINEMATIC }}
                className="flex flex-col gap-5"
              >
                <FormField id="reg-name" label={t('auth.fullName')} error={errors.name}>
                  <Input
                    id="reg-name"
                    autoComplete="name"
                    placeholder={t('auth.namePlaceholder')}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? 'reg-name-error' : undefined}
                  />
                </FormField>

                <FormField id="reg-email" label={t('auth.email')} error={errors.email}>
                  <Input
                    id="reg-email"
                    type="email"
                    dir="ltr"
                    autoComplete="email"
                    placeholder={t('auth.emailPlaceholder')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? 'reg-email-error' : undefined}
                  />
                </FormField>

                <FormField id="reg-password" label={t('auth.password')} error={errors.password}>
                  <PasswordInput
                    id="reg-password"
                    dir="ltr"
                    autoComplete="new-password"
                    placeholder={t('auth.passwordPlaceholder')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? 'reg-password-error' : undefined}
                  />
                  <PasswordStrength score={strength} />
                </FormField>

                <FormField id="reg-confirm" label={t('auth.confirmPassword')} error={errors.confirm}>
                  <PasswordInput
                    id="reg-confirm"
                    dir="ltr"
                    autoComplete="new-password"
                    placeholder={t('auth.passwordPlaceholder')}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    aria-invalid={!!errors.confirm}
                    aria-describedby={errors.confirm ? 'reg-confirm-error' : undefined}
                  />
                </FormField>

                <div className="flex flex-col gap-2">
                  <label htmlFor="reg-terms" className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed">
                    <input
                      id="reg-terms"
                      type="checkbox"
                      checked={terms}
                      onChange={(e) => setTerms(e.target.checked)}
                      aria-invalid={!!errors.terms}
                      className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded-md accent-[hsl(var(--primary))]"
                    />
                    <span className="text-muted-foreground">{t('auth.terms')}</span>
                  </label>
                  {errors.terms ? (
                    <p role="alert" className="flex items-center gap-1.5 text-xs font-medium text-destructive">
                      <CircleAlert className="size-3.5" aria-hidden="true" />
                      {errors.terms}
                    </p>
                  ) : null}
                </div>
              </motion.div>
            ) : step === 1 ? (
              <motion.div
                key="step-family"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.32, ease: EASE_CINEMATIC }}
                className="flex flex-col gap-6"
              >
                <FormField id="reg-family" label={t('auth.familyName')} error={errors.familyName}>
                  <Input
                    id="reg-family"
                    placeholder={t('auth.familyNamePlaceholder')}
                    value={familyName}
                    onChange={(e) => setFamilyName(e.target.value)}
                    aria-invalid={!!errors.familyName}
                    aria-describedby={errors.familyName ? 'reg-family-error' : undefined}
                  />
                </FormField>

                <div className="flex flex-col gap-2">
                  <Label id="household-label">{t('auth.householdSize')}</Label>
                  <div className="glass flex items-center justify-between rounded-2xl px-3 py-2.5" role="group" aria-labelledby="household-label">
                    <button
                      type="button"
                      onClick={() => setHouseholdSize((v) => clamp(v - 1, 1, 15))}
                      disabled={householdSize <= 1}
                      aria-label="-1"
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background transition hover:border-primary/40 hover:text-primary disabled:opacity-40"
                    >
                      <Minus className="size-4.5" aria-hidden="true" />
                    </button>
                    <motion.span
                      key={householdSize}
                      initial={{ scale: 0.8, opacity: 0.4 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-2xl font-extrabold tabular-nums"
                      aria-live="polite"
                    >
                      {householdSize}
                    </motion.span>
                    <button
                      type="button"
                      onClick={() => setHouseholdSize((v) => clamp(v + 1, 1, 15))}
                      disabled={householdSize >= 15}
                      aria-label="+1"
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background transition hover:border-primary/40 hover:text-primary disabled:opacity-40"
                    >
                      <Plus className="size-4.5" aria-hidden="true" />
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">{t('auth.householdSizeHint')}</p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="step-modules"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.32, ease: EASE_CINEMATIC }}
                className="flex flex-col gap-4"
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  {MODULES.map((mod) => (
                    <ModuleCard
                      key={mod.id}
                      moduleId={mod.id}
                      selected={modules.includes(mod.id)}
                      onToggle={toggleModule}
                    />
                  ))}
                </div>
                {errors.modules ? (
                  <p role="alert" className="flex items-center gap-1.5 text-xs font-medium text-destructive">
                    <CircleAlert className="size-3.5" aria-hidden="true" />
                    {errors.modules}
                  </p>
                ) : null}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation buttons */}
          <div className="mt-7 flex gap-3">
            {step > 0 ? (
              <Button type="button" variant="outline" size="lg" onClick={() => setStep((s) => s - 1)} className="flex-1">
                {t('common.back')}
              </Button>
            ) : null}
            {step < 2 ? (
              <Button type="button" variant="gradient" size="lg" onClick={handleNext} className="flex-[2]">
                {t('common.next')}
              </Button>
            ) : (
              <Button type="submit" variant="gradient" size="lg" isLoading={submitting} className="flex-[2]">
                {submitting ? t('auth.creating') : t('auth.createAccount')}
              </Button>
            )}
          </div>
        </motion.form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {t('auth.haveAccount')}{' '}
          <Link to="/login" className="font-bold text-primary underline-offset-4 hover:underline">
            {t('auth.signInNow')}
          </Link>
        </p>
      </motion.div>
    </AuthShell>
  );
}
