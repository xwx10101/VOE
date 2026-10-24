import { useEffect, useRef, useState } from 'react';
import { statusFor } from '@/lib/scoring';

const STATUS_COLOR: Record<string, string> = {
  strong: '#2E9D68',
  stable: '#29BEFD',
  attention: '#D98900',
  priority: '#C93645',
};

export function ScoreRing({
  score,
  size = 168,
  label = 'Household Harmony Score',
  statusLabel,
  tone = 'light',
  animate = true,
}: {
  score: number;
  size?: number;
  label?: string;
  statusLabel?: string;
  tone?: 'light' | 'dark';
  animate?: boolean;
}) {
  const [shown, setShown] = useState(animate ? 0 : score);
  const ref = useRef<HTMLDivElement | null>(null);
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const status = statusFor(score);
  const color = STATUS_COLOR[status];

  useEffect(() => {
    if (!animate) {
      setShown(score);
      return;
    }
    const node = ref.current;
    let frame = 0;
    const start = performance.now();
    const duration = 900;

    const step = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setShown(Math.round(score * eased));
      if (progress < 1) frame = requestAnimationFrame(step);
    };

    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduced || !node || typeof window.requestAnimationFrame !== 'function') {
      setShown(score);
      return;
    }
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [score, animate]);

  const offset = circumference - (shown / 100) * circumference;

  return (
    <div ref={ref} className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          viewBox="0 0 120 120"
          width={size}
          height={size}
          role="img"
          aria-label={`${label}: ${score} out of 100. ${statusLabel ?? ''}`}
        >
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={tone === 'dark' ? 'rgba(255,255,255,0.14)' : '#E7EDF5'}
            strokeWidth="9"
          />
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 60 60)"
            style={{ transition: 'stroke-dashoffset 120ms linear' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={`font-display text-[clamp(1.9rem,4vw,2.6rem)] font-semibold leading-none ${
              tone === 'dark' ? 'text-white' : 'text-ink'
            }`}
          >
            {shown}
          </span>
          <span className={`mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${tone === 'dark' ? 'text-white/55' : 'text-muted'}`}>
            of 100
          </span>
        </div>
      </div>
      <p className={`text-center text-sm font-semibold ${tone === 'dark' ? 'text-white' : 'text-ink'}`}>
        {statusLabel ?? 'Household Harmony Score'}
      </p>
    </div>
  );
}
