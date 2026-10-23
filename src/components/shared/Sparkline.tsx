/*
 * ✏️ TEAM GUIDE: Tiny animated SVG sparkline (area + smoothed line + end dot).
 * Used inside StatCards. Null points are treated as "carry last value".
 * Color comes from `toneClassName` (text color → currentColor).
 */
import { useId, useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SparklineProps {
  data: Array<number | null>;
  height?: number;
  toneClassName?: string;
  className?: string;
  label?: string;
}

export function Sparkline({
  data,
  height = 42,
  toneClassName = 'text-primary',
  className,
  label,
}: SparklineProps) {
  const gradientId = useId().replace(/[:]/g, '');
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-30px' });
  const reduceMotion = useReducedMotion();

  const width = 120;
  // Fill nulls by carrying the nearest known value so the line never breaks.
  const filled: number[] = [];
  let last = data.find((v) => v !== null) ?? 0;
  for (const v of data) {
    if (v !== null) last = v;
    filled.push(last);
  }
  if (filled.length < 2) return null;

  const min = Math.min(...filled);
  const max = Math.max(...filled);
  const range = max - min || 1;
  const pad = 4;
  const points = filled.map((v, i) => ({
    x: pad + (i / (filled.length - 1)) * (width - pad * 2),
    y: pad + (1 - (v - min) / range) * (height - pad * 2),
  }));

  // Smooth path via quadratic midpoints.
  let d = `M ${points[0]!.x} ${points[0]!.y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]!;
    const curr = points[i]!;
    const midX = (prev.x + curr.x) / 2;
    const midY = (prev.y + curr.y) / 2;
    d += ` Q ${prev.x} ${prev.y} ${midX} ${midY}`;
  }
  const lastPoint = points[points.length - 1]!;
  d += ` L ${lastPoint.x} ${lastPoint.y}`;
  const area = `${d} L ${lastPoint.x} ${height} L ${points[0]!.x} ${height} Z`;

  return (
    <div ref={ref} role="img" aria-label={label} className={cn('w-full', className)}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        style={{ height }}
        className={cn('w-full overflow-visible', toneClassName)}
      >
        <defs>
          <linearGradient id={`spark-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.32" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#spark-${gradientId})`} />
        <motion.path
          d={d}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          initial={{ pathLength: reduceMotion ? 1 : 0 }}
          animate={{ pathLength: inView ? 1 : 0 }}
          transition={{ duration: 1.1, ease: 'easeInOut', delay: 0.15 }}
        />
        <motion.circle
          cx={lastPoint.x}
          cy={lastPoint.y}
          r="3"
          fill="currentColor"
          initial={{ opacity: 0 }}
          animate={{ opacity: inView ? 1 : 0 }}
          transition={{ delay: reduceMotion ? 0 : 1.1 }}
        />
      </svg>
    </div>
  );
}
