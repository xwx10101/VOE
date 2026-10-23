/*
 * ✏️ TEAM GUIDE: Animated circular progress ring (draws itself when scrolled
 * into view). Used for medication adherence and dashboard stats.
 * `value` is 0–100. Children render centered inside the ring.
 */
import { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { EASE_CINEMATIC } from '@/lib/motion';
import { clamp, cn } from '@/lib/utils';

interface ProgressRingProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  /** Tailwind text-color class for the progress stroke (uses currentColor). */
  toneClassName?: string;
  children?: React.ReactNode;
  label?: string;
}

export function ProgressRing({
  value,
  size = 96,
  strokeWidth = 9,
  className,
  toneClassName = 'text-primary',
  children,
  label,
}: ProgressRingProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const reduceMotion = useReducedMotion();
  const pct = clamp(value, 0, 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const targetOffset = circumference * (1 - pct / 100);

  return (
    <div
      ref={ref}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-muted"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          className={cn('stroke-current', toneClassName)}
          initial={{ strokeDashoffset: circumference }}
          animate={{
            strokeDashoffset: inView || reduceMotion ? targetOffset : circumference,
          }}
          transition={{ duration: reduceMotion ? 0 : 1.15, ease: EASE_CINEMATIC, delay: 0.15 }}
        />
      </svg>
      {children ? <span className="absolute inset-0 flex items-center justify-center">{children}</span> : null}
    </div>
  );
}
