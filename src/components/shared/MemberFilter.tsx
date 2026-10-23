/*
 * ✏️ TEAM GUIDE: Member tab filter — "All family" + one pill per member
 * (avatar + name), with a sliding active indicator. Used by Medications,
 * Schedule and (later) Safety. Horizontally scrollable on small screens.
 */
import { useId } from 'react';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';
import { Avatar } from '@/components/shared/Avatar';
import { cn, localized } from '@/lib/utils';
import type { FamilyMember, Lang } from '@/types';

export type MemberFilterValue = 'all' | string;

interface MemberFilterProps {
  members: FamilyMember[];
  value: MemberFilterValue;
  onChange: (value: MemberFilterValue) => void;
  allLabel: string;
  lang: Lang;
  counts?: Record<string, number>;
}

export function MemberFilter({ members, value, onChange, allLabel, lang, counts }: MemberFilterProps) {
  const pillId = useId();

  const item = (
    key: string,
    label: string,
    avatar: React.ReactNode,
    count?: number,
  ) => {
    const active = value === key;
    return (
      <button
        key={key}
        type="button"
        role="tab"
        aria-selected={active}
        onClick={() => onChange(key)}
        className={cn(
          'relative flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition-colors duration-200',
          active ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
        )}
      >
        {active ? (
          <motion.span
            layoutId={`member-pill-${pillId}`}
            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
            className="absolute inset-0 rounded-full bg-brand-gradient shadow-bloom"
            aria-hidden="true"
          />
        ) : null}
        <span className="relative z-10 flex items-center gap-2">
          {avatar}
          {label}
          {count !== undefined ? (
            <span
              className={cn(
                'flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[0.65rem] font-extrabold',
                active ? 'bg-white/25 text-white' : 'bg-muted text-muted-foreground',
              )}
            >
              {count}
            </span>
          ) : null}
        </span>
      </button>
    );
  };

  return (
    <div
      role="tablist"
      aria-label={allLabel}
      className="flex gap-1.5 overflow-x-auto rounded-full border border-border/70 bg-card/70 p-1.5 shadow-soft backdrop-blur"
    >
      {item(
        'all',
        allLabel,
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Users className="size-3.5" aria-hidden="true" />
        </span>,
        counts?.all,
      )}
      {members.map((m) =>
        item(
          m.id,
          localized(m.name, lang),
          <Avatar name={localized(m.name, lang)} size="sm" className="h-6 w-6 text-[0.55rem]" />,
          counts?.[m.id],
        ),
      )}
    </div>
  );
}
