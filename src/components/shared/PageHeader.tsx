/* ✏️ TEAM GUIDE: Standard in-app page header — title, subtitle, actions slot. */
import { motion } from 'framer-motion';
import { fadeUp } from '@/lib/motion';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, actions, className }: PageHeaderProps) {
  return (
    <motion.header
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className={cn('flex flex-wrap items-end justify-between gap-4', className)}
    >
      <div className="min-w-0">
        <h1 className="text-balance text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
        {subtitle ? (
          <p className="mt-1.5 max-w-2xl text-balance text-sm leading-relaxed text-muted-foreground sm:text-base">
            {subtitle}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </motion.header>
  );
}
