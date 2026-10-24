import {
  Activity,
  BookHeart,
  CalendarRange,
  ClipboardCheck,
  HeartHandshake,
  Home,
  LayoutDashboard,
  MessagesSquare,
  ShieldCheck,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  short: string;
  description: string;
  icon: LucideIcon;
}

export const APP_NAV: NavItem[] = [
  {
    to: '/dashboard',
    label: 'Overview',
    short: 'Overview',
    description: 'Household signals at a glance',
    icon: LayoutDashboard,
  },
  {
    to: '/assessment',
    label: 'Assessment',
    short: 'Assessment',
    description: 'Eight questions, explainable result',
    icon: ClipboardCheck,
  },
  {
    to: '/coach',
    label: 'AI Coach',
    short: 'Coach',
    description: 'Family guidance you control',
    icon: MessagesSquare,
  },
  {
    to: '/plan',
    label: 'Weekly Plan',
    short: 'Plan',
    description: 'Practical actions for seven days',
    icon: CalendarRange,
  },
  {
    to: '/schedule',
    label: 'Schedule',
    short: 'Schedule',
    description: 'Balance time and responsibility',
    icon: Activity,
  },
  {
    to: '/student',
    label: 'Student Support',
    short: 'Student',
    description: 'Study pressure and recovery',
    icon: GraduationCap,
  },
  {
    to: '/care',
    label: 'Older Adult Care',
    short: 'Care',
    description: 'Dignified routine support',
    icon: HeartHandshake,
  },
  {
    to: '/memories',
    label: 'Memory Vault',
    short: 'Memories',
    description: 'Private family wins',
    icon: BookHeart,
  },
  {
    to: '/trust',
    label: 'Trust & Safety',
    short: 'Trust',
    description: 'Privacy, ethics, explainability',
    icon: ShieldCheck,
  },
];

export const PUBLIC_NAV: { to: string; label: string }[] = [
  { to: '/', label: 'Overview' },
  { to: '/assessment', label: 'Assessment' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/coach', label: 'AI Coach' },
  { to: '/plan', label: 'Weekly Plan' },
  { to: '/trust', label: 'Trust & Safety' },
];

export const DEMO_ICON = Sparkles;
export const HOME_ICON = Home;
