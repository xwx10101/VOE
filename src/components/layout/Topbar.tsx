/*
 * ✏️ TEAM GUIDE: In-app top bar — mobile menu trigger, current page title,
 * "Ask Nasma" CTA, language/theme controls and the account dropdown.
 */
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings as SettingsIcon,
  Sparkles,
} from 'lucide-react';
import { Avatar } from '@/components/shared/Avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { MODULES } from '@/config/app.config';
import { formatFullDate } from '@/lib/dates';
import { useAuthStore } from '@/stores/authStore';
import type { Lang } from '@/types';

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { t, i18n } = useTranslation();
  const lang = (i18n.language === 'ar' ? 'ar' : 'en') as Lang;
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const module = MODULES.find((m) => m.route === pathname);
  const title = pathname.startsWith('/settings')
    ? t('settings.title')
    : module
      ? t(`modules.${module.id}.title`)
      : t('shell.dashboard');

  const handleLogout = () => {
    logout();
    toast.success(t('auth.success.loggedOut'));
    navigate('/', { replace: true });
  };

  return (
    <header className="glass sticky top-0 z-30">
      <div className="flex h-16 items-center gap-2.5 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label={t('shell.openMenu')}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background/60 transition hover:border-primary/40 hover:text-primary lg:hidden"
        >
          <Menu className="size-5" aria-hidden="true" />
        </button>

        <div className="min-w-0">
          <p className="truncate text-[0.95rem] font-extrabold leading-tight">{title}</p>
          <p className="hidden text-xs text-muted-foreground sm:block">
            {formatFullDate(new Date(), lang)}
          </p>
        </div>

        <div className="ms-auto flex items-center gap-2">
          <Button
            variant="gradient"
            size="sm"
            className="h-10 px-3 sm:px-4"
            onClick={() => navigate('/assistant')}
          >
            <Sparkles aria-hidden="true" />
            <span className="hidden sm:inline">{t('shell.askNasma')}</span>
          </Button>
          <LanguageSwitcher compact />
          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={t('shell.account')}
                className="flex items-center gap-2 rounded-xl border border-border bg-background/60 py-1.5 pe-2.5 ps-1.5 transition hover:border-primary/40"
              >
                <Avatar name={user?.name ?? '?'} size="sm" className="h-8 w-8" />
                <span className="hidden max-w-28 truncate text-sm font-bold md:block">{user?.name}</span>
                <ChevronDown className="size-4 text-muted-foreground" aria-hidden="true" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <span className="block text-sm font-bold">{user?.name}</span>
                <span dir="ltr" className="block truncate text-start text-xs font-normal text-muted-foreground">
                  {user?.email}
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => navigate('/dashboard')}>
                <LayoutDashboard aria-hidden="true" />
                {t('shell.dashboard')}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => navigate('/settings')}>
                <SettingsIcon aria-hidden="true" />
                {t('shell.settings')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={handleLogout} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                <LogOut aria-hidden="true" />
                {t('common.logout')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
