/*
 * ✏️ TEAM GUIDE: Login page (split-screen via AuthShell).
 * Validates inline (bilingual errors), shakes on invalid submit, and offers
 * the one-click demo account (Al Mansouri family).
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { CircleAlert, Sparkles } from 'lucide-react';
import { AuthShell } from '@/components/auth/AuthShell';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/shared/FormField';
import { useShake } from '@/hooks/useShake';
import { useAuthStore } from '@/stores/authStore';
import { AuthError, isValidEmail } from '@/lib/api';
import { DEMO_CREDENTIALS } from '@/config/app.config';

type FieldErrors = Partial<Record<'email' | 'password', string>>;

export function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const loginAsDemo = useAuthStore((s) => s.loginAsDemo);
  const { controls, shake } = useShake();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  const afterAuth = (onboarded: boolean, name: string) => {
    toast.success(t('auth.success.welcomeBack', { name }));
    navigate(onboarded ? '/dashboard' : '/onboarding', { replace: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const next: FieldErrors = {};
    if (!email.trim()) next.email = t('auth.errors.required');
    else if (!isValidEmail(email)) next.email = t('auth.errors.emailInvalid');
    if (!password) next.password = t('auth.errors.required');
    setErrors(next);
    if (Object.keys(next).length > 0) {
      shake();
      return;
    }
    setSubmitting(true);
    try {
      const user = await login(email, password);
      afterAuth(user.onboarded, user.name);
    } catch (err) {
      setFormError(
        err instanceof AuthError
          ? t(`auth.errors.${err.code}` as 'auth.errors.invalidCredentials')
          : t('auth.errors.generic'),
      );
      shake();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemo = async () => {
    setDemoLoading(true);
    try {
      const user = await loginAsDemo();
      afterAuth(user.onboarded, user.name);
    } catch {
      toast.error(t('auth.errors.generic'));
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <AuthShell>
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <h1 className="text-3xl font-extrabold tracking-tight">{t('auth.loginTitle')}</h1>
        <p className="mt-2 text-muted-foreground">{t('auth.loginSubtitle')}</p>

        <motion.form animate={controls} onSubmit={(e) => void handleSubmit(e)} noValidate className="mt-8 flex flex-col gap-5">
          {formError ? (
            <p role="alert" className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
              <CircleAlert className="size-4.5 shrink-0" aria-hidden="true" />
              {formError}
            </p>
          ) : null}

          <FormField id="login-email" label={t('auth.email')} error={errors.email}>
            <Input
              id="login-email"
              type="email"
              dir="ltr"
              autoComplete="email"
              placeholder={t('auth.emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'login-email-error' : undefined}
            />
          </FormField>

          <FormField id="login-password" label={t('auth.password')} error={errors.password}>
            <PasswordInput
              id="login-password"
              dir="ltr"
              autoComplete="current-password"
              placeholder={t('auth.passwordPlaceholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'login-password-error' : undefined}
            />
          </FormField>

          <Button type="submit" variant="gradient" size="lg" isLoading={submitting} className="mt-1 w-full">
            {submitting ? t('auth.signingIn') : t('auth.signIn')}
          </Button>
        </motion.form>

        {/* Demo account */}
        <div className="glass mt-6 rounded-2xl p-4">
          <p className="flex items-center gap-2 text-sm font-bold">
            <Sparkles className="size-4 text-brand-violet" aria-hidden="true" />
            {t('auth.demo.title')}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{t('auth.demo.desc')}</p>
          <Button variant="secondary" className="mt-3 w-full" isLoading={demoLoading} onClick={() => void handleDemo()}>
            {t('auth.demo.button')}
          </Button>
          <p dir="ltr" className="mt-2.5 text-center font-mono text-xs text-muted-foreground">
            {DEMO_CREDENTIALS.email} · {DEMO_CREDENTIALS.password}
          </p>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {t('auth.noAccount')}{' '}
          <Link to="/register" className="font-bold text-primary underline-offset-4 hover:underline">
            {t('auth.registerNow')}
          </Link>
        </p>
      </motion.div>
    </AuthShell>
  );
}
