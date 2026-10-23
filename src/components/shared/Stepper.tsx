/*
 * ✏️ TEAM GUIDE: Horizontal progress stepper for multi-step flows
 * (Register, Onboarding). Completed steps show a check; the bar animates.
 */
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StepDef {
  id: string;
  label: string;
  desc?: string;
}

interface StepperProps {
  steps: StepDef[];
  current: number; // 0-based
}

export function Stepper({ steps, current }: StepperProps) {
  return (
    <ol className="relative flex items-start" aria-label="Progress">
      {/* Track + animated fill */}
      <span aria-hidden="true" className="absolute start-5 end-5 top-5 h-0.5 rounded bg-muted" />
      <motion.span
        aria-hidden="true"
        className="absolute start-5 top-5 h-0.5 rounded bg-brand-gradient rtl:origin-right ltr:origin-left"
        initial={false}
        animate={{
          width: `calc(${(current / Math.max(steps.length - 1, 1)) * 100}% - ${(current / Math.max(steps.length - 1, 1)) * 2.5}rem)`,
        }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      />
      {steps.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li
            key={step.id}
            aria-current={active ? 'step' : undefined}
            className="relative z-10 flex flex-1 flex-col items-center gap-2 text-center"
          >
            <motion.span
              initial={false}
              animate={{ scale: active ? 1.08 : 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-bold shadow-soft transition-colors duration-300',
                done && 'border-primary bg-primary text-primary-foreground',
                active && 'border-primary bg-background text-primary shadow-glow',
                !done && !active && 'border-border bg-background text-muted-foreground',
              )}
            >
              {done ? <Check className="size-4.5" aria-hidden="true" /> : i + 1}
            </motion.span>
            <span className="flex flex-col">
              <span className={cn('text-xs font-bold sm:text-sm', active ? 'text-foreground' : 'text-muted-foreground')}>
                {step.label}
              </span>
              {step.desc ? (
                <span className="hidden text-[0.7rem] text-muted-foreground sm:block">{step.desc}</span>
              ) : null}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
