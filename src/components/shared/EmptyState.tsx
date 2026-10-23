/*
 * ✏️ TEAM GUIDE: Illustrated empty state — gradient icon orb, message, CTA.
 * Use whenever a list/module has no data yet (new families start empty!).
 */
import type { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  desc?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, desc, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border/80 bg-background/50 px-6 py-10 text-center',
        className,
      )}
    >
      <motion.span
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 16 }}
        className="animate-float flex h-16 w-16 items-center justify-center rounded-full bg-brand-gradient text-white shadow-bloom"
      >
        <Icon className="size-8" aria-hidden="true" />
      </motion.span>
      <h3 className="text-lg font-bold">{title}</h3>
      {desc ? <p className="max-w-sm text-balance text-sm leading-relaxed text-muted-foreground">{desc}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
