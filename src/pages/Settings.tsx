/*
 * ✏️ TEAM GUIDE: Settings — profile, preferences (instant RTL/theme),
 * family-member management, module toggles, data export (JSON), data reset
 * and logout. Every change writes through the stores to lib/api.ts.
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Database,
  Download,
  LogOut,
  Moon,
  Palette,
  Pencil,
  Plus,
  RefreshCcw,
  Sun,
  Trash2,
  User as UserIcon,
  Users,
} from 'lucide-react';
import { Avatar } from '@/components/shared/Avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { FormField } from '@/components/shared/FormField';
import { PageHeader } from '@/components/shared/PageHeader';
import { MemberFormDialog, type MemberFormValues } from '@/components/settings/MemberFormDialog';
import { MODULE_ICONS, MODULE_TINTS } from '@/components/shared/moduleIcons';
import { setLanguage } from '@/i18n';
import { exportUserData } from '@/lib/api';
import { MODULES } from '@/config/app.config';
import { fadeUp, staggerContainer } from '@/lib/motion';
import { todayKey } from '@/lib/dates';
import { cn, localized, uid } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { useFamilyStore } from '@/stores/familyStore';
import { useUiStore, type ThemeMode } from '@/stores/uiStore';
import type { FamilyMember, Lang } from '@/types';

/** Sliding-pill segmented control (language / theme). */
function Segmented<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  idSuffix,
}: {
  options: Array<{ value: T; label: React.ReactNode }>;
  value: T;
  onChange: (v: T) => void;
  ariaLabel: string;
  idSuffix: string;
}) {
  return (
    <div role="group" aria-label={ariaLabel} className="flex rounded-xl bg-muted p-1">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              'relative flex-1 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors',
              active ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {active ? (
              <motion.span
                layoutId={`segmented-${idSuffix}`}
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                className="absolute inset-0 rounded-lg bg-primary shadow-soft"
                aria-hidden="true"
              />
            ) : null}
            <span className="relative z-10 inline-flex items-center justify-center gap-1.5">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function Settings() {
  const { t, i18n } = useTranslation();
  const lang = (i18n.language === 'ar' ? 'ar' : 'en') as Lang;
  const navigate = useNavigate();

  const user = useAuthStore((s) => s.user);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const logout = useAuthStore((s) => s.logout);
  const resetAccountData = useAuthStore((s) => s.resetAccountData);
  const family = useFamilyStore((s) => s.family);
  const setFamilyName = useFamilyStore((s) => s.setFamilyName);
  const addMember = useFamilyStore((s) => s.addMember);
  const updateMember = useFamilyStore((s) => s.updateMember);
  const removeMember = useFamilyStore((s) => s.removeMember);
  const toggleModule = useFamilyStore((s) => s.toggleModule);
  const theme = useUiStore((s) => s.theme);
  const setTheme = useUiStore((s) => s.setTheme);

  const [name, setName] = useState(user?.name ?? '');
  const [familyName, setFamilyNameInput] = useState('');
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [deletingMember, setDeletingMember] = useState<FamilyMember | null>(null);
  const [resetOpen, setResetOpen] = useState(false);

  useEffect(() => {
    if (family) setFamilyNameInput(localized(family.name, lang));
  }, [family, lang]);

  const saveProfile = () => {
    if (name.trim().length >= 2) updateProfile(name);
    if (family && familyName.trim().length >= 2) {
      setFamilyName({ ...family.name, [lang]: familyName.trim() });
    }
    toast.success(t('settings.profile.saved'));
  };

  const handleMemberSave = (values: MemberFormValues) => {
    if (editingMember) updateMember({ ...editingMember, ...values });
    else addMember({ id: uid('member'), ...values });
  };

  const handleDeleteMember = () => {
    if (!deletingMember) return;
    removeMember(deletingMember.id);
    toast.success(t('settings.members.deleted'));
    setDeletingMember(null);
  };

  const handleExport = () => {
    if (!user) return;
    const data = exportUserData(user.id);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nasmacare-export-${todayKey()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t('settings.data.exported'));
  };

  const handleReset = () => {
    const updated = resetAccountData();
    toast.success(t('settings.data.resetDone'));
    if (updated && !updated.onboarded) navigate('/onboarding', { replace: true });
    else navigate('/dashboard', { replace: true });
  };

  const handleLogout = () => {
    logout();
    toast.success(t('auth.success.loggedOut'));
    navigate('/', { replace: true });
  };

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="mx-auto flex max-w-4xl flex-col gap-6">
      <PageHeader title={t('settings.title')} subtitle={t('settings.subtitle')} />

      {/* ---------- Profile ---------- */}
      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/12 text-primary">
                <UserIcon className="size-4.5" aria-hidden="true" />
              </span>
              {t('settings.profile.title')}
            </CardTitle>
            <CardDescription>{t('settings.profile.desc')}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="flex items-center gap-4">
              <Avatar name={user?.name ?? '?'} size="lg" />
              <div className="min-w-0">
                <p className="truncate font-extrabold">{user?.name}</p>
                <p dir="ltr" className="truncate text-start text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField id="settings-name" label={t('settings.profile.name')}>
                <Input id="settings-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
              </FormField>
              <FormField id="settings-email" label={t('settings.profile.email')}>
                <Input id="settings-email" value={user?.email ?? ''} dir="ltr" disabled readOnly />
              </FormField>
              <FormField id="settings-family" label={t('settings.profile.familyName')}>
                <Input
                  id="settings-family"
                  value={familyName}
                  onChange={(e) => setFamilyNameInput(e.target.value)}
                />
              </FormField>
            </div>
            <div className="flex justify-end">
              <Button variant="gradient" onClick={saveProfile}>
                {t('common.saveChanges')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ---------- Preferences ---------- */}
      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-violet/15 text-brand-violet">
                <Palette className="size-4.5" aria-hidden="true" />
              </span>
              {t('settings.preferences.title')}
            </CardTitle>
            <CardDescription>{t('settings.preferences.desc')}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 sm:grid-cols-2">
            <div className="flex flex-col gap-2.5">
              <span className="text-sm font-semibold">{t('settings.preferences.language')}</span>
              <Segmented<Lang>
                idSuffix="language"
                ariaLabel={t('settings.preferences.language')}
                value={lang}
                onChange={(v) => void setLanguage(v)}
                options={[
                  { value: 'ar', label: 'العربية' },
                  { value: 'en', label: 'English' },
                ]}
              />
            </div>
            <div className="flex flex-col gap-2.5">
              <span className="text-sm font-semibold">{t('settings.preferences.theme')}</span>
              <Segmented<ThemeMode>
                idSuffix="theme"
                ariaLabel={t('settings.preferences.theme')}
                value={theme}
                onChange={setTheme}
                options={[
                  {
                    value: 'light',
                    label: (
                      <>
                        <Sun className="size-4" aria-hidden="true" />
                        {t('settings.preferences.light')}
                      </>
                    ),
                  },
                  {
                    value: 'dark',
                    label: (
                      <>
                        <Moon className="size-4" aria-hidden="true" />
                        {t('settings.preferences.dark')}
                      </>
                    ),
                  },
                ]}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ---------- Members ---------- */}
      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/12 text-sky-600 dark:text-sky-400">
                  <Users className="size-4.5" aria-hidden="true" />
                </span>
                {t('settings.members.title')}
              </span>
              <Button
                size="sm"
                variant="gradient"
                onClick={() => {
                  setEditingMember(null);
                  setMemberDialogOpen(true);
                }}
              >
                <Plus aria-hidden="true" />
                {t('settings.members.add')}
              </Button>
            </CardTitle>
            <CardDescription>{t('settings.members.desc')}</CardDescription>
          </CardHeader>
          <CardContent>
            {family && family.members.length > 0 ? (
              <ul className="flex flex-col gap-2.5">
                {family.members.map((member) => (
                  <li
                    key={member.id}
                    className="flex flex-wrap items-center gap-3 rounded-xl border border-border/70 bg-background/60 px-3.5 py-3"
                  >
                    <Avatar name={localized(member.name, lang)} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-bold leading-tight">{localized(member.name, lang)}</span>
                      <span className="block text-xs text-muted-foreground">
                        {t(`relations.${member.relation}`)} · {member.age} {t('common.yearsOld')}
                      </span>
                    </span>
                    <span className="flex flex-wrap justify-end gap-1.5">
                      {member.conditions.map((c) => (
                        <Badge key={c} variant="warning" className="text-[0.65rem]">
                          {t(`conditions.${c}` as 'conditions.diabetes', { defaultValue: c })}
                        </Badge>
                      ))}
                      {member.allergies.map((a) => (
                        <Badge key={a} variant="violet" className="text-[0.65rem]">
                          {t(`allergies.${a}` as 'allergies.nuts', { defaultValue: a })}
                        </Badge>
                      ))}
                    </span>
                    <span className="flex items-center gap-1">
                      <button
                        type="button"
                        aria-label={t('settings.members.edit')}
                        onClick={() => {
                          setEditingMember(member);
                          setMemberDialogOpen(true);
                        }}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-primary"
                      >
                        <Pencil className="size-4.5" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        aria-label={t('common.delete')}
                        onClick={() => setDeletingMember(member)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="size-4.5" aria-hidden="true" />
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-xl bg-muted/60 px-4 py-3.5 text-sm text-muted-foreground">
                {t('settings.members.empty')}
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ---------- Modules ---------- */}
      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader>
            <CardTitle>{t('settings.modules.title')}</CardTitle>
            <CardDescription>{t('settings.modules.desc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col divide-y divide-border/60">
              {MODULES.map((mod) => {
                const Icon = MODULE_ICONS[mod.id];
                const enabled = family?.enabledModules.includes(mod.id) ?? false;
                return (
                  <li key={mod.id} className="flex items-center gap-3.5 py-3.5 first:pt-0 last:pb-0">
                    <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', MODULE_TINTS[mod.id])}>
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold">{t(`modules.${mod.id}.title`)}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {t(`modules.${mod.id}.desc`)}
                      </span>
                    </span>
                    <Switch
                      checked={enabled}
                      onCheckedChange={() => toggleModule(mod.id)}
                      aria-label={t(`modules.${mod.id}.title`)}
                    />
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      </motion.div>

      {/* ---------- Data & account ---------- */}
      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-amber/18 text-amber-700 dark:text-brand-amber">
                <Database className="size-4.5" aria-hidden="true" />
              </span>
              {t('settings.data.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0 max-w-md">
                <p className="font-bold">{t('settings.data.export')}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{t('settings.data.exportDesc')}</p>
              </div>
              <Button variant="outline" onClick={handleExport}>
                <Download aria-hidden="true" />
                {t('settings.data.export')}
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-5">
              <div className="min-w-0 max-w-md">
                <p className="font-bold">{t('common.logout')}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{t('settings.logoutDesc')}</p>
              </div>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut aria-hidden="true" />
                {t('common.logout')}
              </Button>
            </div>

            <div className="rounded-2xl border border-destructive/30 bg-destructive/[0.04] p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-destructive">{t('settings.danger')}</p>
              <div className="mt-2.5 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0 max-w-md">
                  <p className="font-bold">{t('settings.data.reset')}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{t('settings.data.resetDesc')}</p>
                </div>
                <Button variant="destructive" onClick={() => setResetOpen(true)}>
                  <RefreshCcw aria-hidden="true" />
                  {t('settings.data.reset')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Dialogs */}
      <MemberFormDialog
        open={memberDialogOpen}
        onOpenChange={setMemberDialogOpen}
        initial={editingMember}
        onSave={handleMemberSave}
      />
      <ConfirmDialog
        open={!!deletingMember}
        onOpenChange={(open) => !open && setDeletingMember(null)}
        title={t('settings.members.deleteTitle', {
          name: deletingMember ? localized(deletingMember.name, lang) : '',
        })}
        desc={t('settings.members.deleteDesc')}
        confirmLabel={t('common.delete')}
        onConfirm={handleDeleteMember}
      />
      <ConfirmDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        title={t('settings.data.resetTitle')}
        desc={`${t('settings.data.resetDesc')} ${t('settings.data.resetConfirm')}`}
        confirmLabel={t('settings.data.reset')}
        onConfirm={handleReset}
      />
    </motion.div>
  );
}
