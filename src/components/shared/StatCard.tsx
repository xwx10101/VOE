/*
 * ✏️ TEAM GUIDE: Dashboard stat card — icon tile, label, big value (pass a
 * <CountUp/> for animation), optional sparkline and footer note/badge.
 */
import type { LucideIcon } from 'lucide-react';
import { Sparkline } from '@/components/shared/Sparkline';
import { cn } from '@/lib/utils';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  spark?: Array<number | null>;
  /** Tailwind classes for the icon tile + sparkline tone. */
  tintClassName?: string;
  toneClassName?: string;
  className?: string;
}

export function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  spark,
  tintClassName = 'bg-primary/12 text-primary',
  toneClassName = 'text-primary',
  className,
}: StatCardProps) {
  return (
    <article
      className={cn(
        'group flex h-full flex-col gap-3 rounded-2xl border border-border/80 bg-card p-5 shadow-soft transition-all duration-300 ease-cinematic hover:-translate-y-1 hover:shadow-bloom',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-muted-foreground">{label}</p>
        <span
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110',
            tintClassName,
          )}
        >
          <Icon className="size-5" aria-hidden="true" />
        </span>
      </div>
      <div className="text-[1.8rem] font-extrabold leading-none tracking-tight">{value}</div>
      {spark && spark.length > 1 ? (
        <Sparkline data={spark} toneClassName={toneClassName} label={label} className="-mb-1" />
      ) : null}
      {sub ? <div className="mt-auto text-xs leading-relaxed text-muted-foreground">{sub}</div> : null}
    </article>
  );
}
