/*
 * ✏️ TEAM GUIDE: PHASE 1 placeholder dashboard — proves the end-to-end flow
 * (auth → onboarding → your saved family). Phase 2 replaces this with the
 * full app shell: sidebar, stat cards, sparklines and AI insight card.
 */
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Check, LogOut, Rocket, Users } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { Avatar } from '@/components/shared/Avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { MODULE_ICONS, MODULE_TINTS } from '@/components/shared/moduleIcons';
import { useAuthStore } from '@/stores/authStore';
import { useFamilyStore } from '@/stores/familyStore';
import { greetingKey, localized, cn } from '@/lib/utils';
import { fadeUp, staggerContainer } from '@/lib/motion';
import type { Lang } from '@/types';

export function Dashboard() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const lang = (i18n.language === 'ar' ? 'ar' : 'en') as Lang;
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const family = useFamilyStore((s) => s.family);

  const handleLogout = () => {
    logout();
    toast.success(t('auth.success.loggedOut'));
    navigate('/', { replace: true });
  };

  const firstName = (user?.name ?? '').split(/\s+/)[0] ?? '';

  return (
    <div className="mesh-bg min-h-svh">
      <header className="glass sticky top-0 z-40">
        <div className="container flex h-16 items-center justify-between gap-3">
          <Logo variant="compact" />
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
            <span className="mx-1 hidden items-center gap-2 sm:flex">
              <Avatar name={user?.name ?? '?'} size="sm" />
              <span className="max-w-32 truncate text-sm font-bold">{user?.name}</span>
            </span>
            <Button variant="ghost" size="icon" onClick={handleLogout} aria-label={t('common.logout')}>
              <LogOut aria-hidden="true" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container pb-20 pt-10">
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="mx-auto max-w-5xl">
          <motion.p variants={fadeUp} className="text-lg font-semibold text-muted-foreground">
            {t(greetingKey())}, {firstName} 👋
          </motion.p>
          <motion.h1 variants={fadeUp} className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            {t('dashboard.phaseTitle')}
          </motion.h1>
          <motion.div variants={fadeUp} className="mt-4">
            <Badge variant="gradient">
              <Rocket aria-hidden="true" />
              {t('dashboard.phaseBadge')}
            </Badge>
          </motion.div>
          <motion.p variants={fadeUp} className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">
            {t('dashboard.phaseDesc')}
          </motion.p>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {/* Family card */}
            <motion.div variants={fadeUp}>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2">
                      <Users className="size-5 text-primary" aria-hidden="true" />
                      {t('dashboard.yourFamily')}
                    </span>
                    {family ? (
                      <Badge variant="secondary">{t('dashboard.membersCount', { count: family.members.length })}</Badge>
                    ) : null}
                  </CardTitle>
                  {family ? <p className="text-sm font-semibold text-primary">{localized(family.name, lang)}</p> : null}
                </CardHeader>
                <CardContent>
                  {family && family.members.length > 0 ? (
                    <ul className="flex flex-col gap-2.5">
                      {family.members.map((m) => (
                        <li
                          key={m.id}
                          className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/60 px-3 py-2.5"
                        >
                          <Avatar name={localized(m.name, lang)} size="sm" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-bold">{localized(m.name, lang)}</span>
                            <span className="block text-xs text-muted-foreground">
                              {t(`relations.${m.relation}`)} · {m.age} {t('common.yearsOld')}
                            </span>
                          </span>
                          <span className="flex flex-wrap justify-end gap-1">
                            {m.conditions.map((c) => (
                              <Badge key={c} variant="warning" className="text-[0.65rem]">
                                {t(`conditions.${c}` as 'conditions.diabetes', { defaultValue: c })}
                              </Badge>
                            ))}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">{t('dashboard.noMembers')}</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Modules card */}
            <motion.div variants={fadeUp}>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>{t('dashboard.yourModules')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="flex flex-col gap-2.5">
                    {(family?.enabledModules ?? []).map((id) => {
                      const Icon = MODULE_ICONS[id];
                      return (
                        <li
                          key={id}
                          className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/60 px-3 py-2.5"
                        >
                          <span className={cn('flex h-9 w-9 items-center justify-center rounded-lg', MODULE_TINTS[id])}>
                            <Icon className="size-4.5" aria-hidden="true" />
                          </span>
                          <span className="flex-1 text-sm font-bold">{t(`modules.${id}.title`)}</span>
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-success/15 text-success">
                            <Check className="size-3.5" aria-hidden="true" />
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
