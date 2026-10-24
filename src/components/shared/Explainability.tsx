import { useState, type ReactNode } from 'react';
import { ChevronDown, Lock, ShieldCheck, Users } from 'lucide-react';
import type { StatusId } from '@/types';

const STATUS_STYLES: Record<StatusId, { bg: string; text: string; dot: string }> = {
  strong: { bg: 'bg-success/10', text: 'text-[#1f6f4a]', dot: 'bg-success' },
  stable: { bg: 'bg-insight/10', text: 'text-[#0f5f84]', dot: 'bg-insight' },
  attention: { bg: 'bg-warning/10', text: 'text-[#7a4d00]', dot: 'bg-warning' },
  priority: { bg: 'bg-danger/10', text: 'text-[#8c2130]', dot: 'bg-danger' },
};

export function StatusPill({ status, label }: { status: StatusId; label: string }) {
  const style = STATUS_STYLES[status];
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${style.bg} ${style.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} aria-hidden="true" />
      {label}
    </span>
  );
}

export function MetricCard({
  label,
  value,
  suffix,
  hint,
  icon,
  tone = 'light',
}: {
  label: string;
  value: string | number;
  suffix?: string;
  hint?: string;
  icon?: ReactNode;
  tone?: 'light' | 'dark';
}) {
  return (
    <div
      className={`rounded-control border p-4 ${
        tone === 'dark' ? 'border-white/10 bg-white/[0.04]' : 'border-border bg-white'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${tone === 'dark' ? 'text-white/55' : 'text-muted'}`}>
          {label}
        </p>
        {icon ? <span className={tone === 'dark' ? 'text-teal' : 'text-royal'}>{icon}</span> : null}
      </div>
      <p className={`mt-2 font-display text-2xl font-semibold leading-none ${tone === 'dark' ? 'text-white' : 'text-ink'}`}>
        {value}
        {suffix ? <span className="ml-1 text-sm font-medium text-muted">{suffix}</span> : null}
      </p>
      {hint ? (
        <p className={`mt-1.5 text-xs leading-snug ${tone === 'dark' ? 'text-white/55' : 'text-muted'}`}>{hint}</p>
      ) : null}
    </div>
  );
}

export function ExplainabilityPanel({
  title = 'How this was calculated',
  factors,
  logic,
  action,
  control,
  alternative,
  defaultOpen = false,
}: {
  title?: string;
  factors: { label: string; value: string }[];
  logic: string;
  action: string;
  control: string;
  alternative: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-control border border-border bg-white">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span className="text-sm font-semibold text-ink">{title}</span>
        <ChevronDown
          aria-hidden="true"
          className={`h-4 w-4 text-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open ? (
        <div className="space-y-4 border-t border-border px-4 py-4">
          <div>
            <p className="stat-label mb-2">Input factors</p>
            <ul className="grid gap-2 sm:grid-cols-2">
              {factors.map((factor) => (
                <li key={factor.label} className="rounded-control bg-canvas px-3 py-2">
                  <p className="text-[11px] uppercase tracking-wide text-muted">{factor.label}</p>
                  <p className="text-sm font-medium text-ink">{factor.value}</p>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="stat-label mb-1">Rule logic</p>
            <p className="text-[13px] leading-relaxed text-muted">{logic}</p>
          </div>
          <div>
            <p className="stat-label mb-1">Suggested action</p>
            <p className="text-[13px] leading-relaxed text-muted">{action}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-control border border-teal/30 bg-teal/[0.07] p-3">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#0d5c4b]">
                <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5" /> Family control
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-ink/80">{control}</p>
            </div>
            <div className="rounded-control border border-border bg-canvas p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Alternative action</p>
              <p className="mt-1 text-[13px] leading-relaxed text-muted">{alternative}</p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const MATRIX_ROWS = [
  {
    data: 'Private journal & mood note',
    icon: 'lock',
    privateToMember: true,
    summary: 'Never included',
    selected: 'Only if the member shares it',
    household: 'Not visible',
  },
  {
    data: 'Assessment answers',
    icon: 'summary',
    privateToMember: false,
    summary: 'Category-level only',
    selected: 'Category-level only',
    household: 'Harmony Score and categories',
  },
  {
    data: 'Household schedule',
    icon: 'users',
    privateToMember: false,
    summary: 'Shared with the household',
    selected: 'Shared with the household',
    household: 'Visible',
  },
  {
    data: 'Care reminders',
    icon: 'summary',
    privateToMember: false,
    summary: 'Completion state only',
    selected: 'Visible to the care circle',
    household: 'Completion state and backup name',
  },
  {
    data: 'Memory Vault entries',
    icon: 'lock',
    privateToMember: true,
    summary: 'Only entries marked household',
    selected: 'Entries marked selected',
    household: 'Only entries marked household',
  },
  {
    data: 'Coach conversation',
    icon: 'lock',
    privateToMember: true,
    summary: 'Stays on this device',
    selected: 'Never shared automatically',
    household: 'Not visible',
  },
];

export function PrivacyMatrix() {
  return (
    <div className="overflow-x-auto rounded-control border border-border">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <caption className="sr-only">
          Privacy matrix showing which family information is private, shared as a summary, shared with
          selected members, or visible to the household.
        </caption>
        <thead>
          <tr className="bg-canvas text-[11px] uppercase tracking-wide text-muted">
            <th scope="col" className="px-4 py-3 font-semibold">
              Information
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Private to member
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Shared as summary
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Selected members
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Household
            </th>
          </tr>
        </thead>
        <tbody>
          {MATRIX_ROWS.map((row) => (
            <tr key={row.data} className="border-t border-border align-top">
              <th scope="row" className="px-4 py-3 text-[13px] font-medium text-ink">
                <span className="flex items-start gap-2">
                  {row.icon === 'lock' ? (
                    <Lock aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-royal" />
                  ) : (
                    <Users aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-royal" />
                  )}
                  {row.data}
                </span>
              </th>
              <td className="px-4 py-3 text-[13px] text-muted">{row.privateToMember ? 'Yes' : 'No'}</td>
              <td className="px-4 py-3 text-[13px] text-muted">{row.summary}</td>
              <td className="px-4 py-3 text-[13px] text-muted">{row.selected}</td>
              <td className="px-4 py-3 text-[13px] text-muted">{row.household}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
