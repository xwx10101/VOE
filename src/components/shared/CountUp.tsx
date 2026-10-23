/*
 * ✏️ TEAM GUIDE: Animated number count-up when scrolled into view.
 * Example: <CountUp end={40} suffix="+" /> → 0 … 40+
 */
import { useEffect, useRef, useState } from 'react';
import { animate, useInView, useReducedMotion } from 'framer-motion';

interface CountUpProps {
  end: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  className?: string;
}

export function CountUp({ end, suffix = '', prefix = '', duration = 1.4, className }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const reduceMotion = useReducedMotion();
  const [value, setValue] = useState(reduceMotion ? end : 0);

  useEffect(() => {
    if (!inView) return;
    if (reduceMotion) {
      setValue(end);
      return;
    }
    const controls = animate(0, end, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setValue(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, end, duration, reduceMotion]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {value.toLocaleString('en-US')}
      {suffix}
    </span>
  );
}
