/*
 * ✏️ TEAM GUIDE: Scroll-triggered reveal wrapper (fade + rise, once).
 * Wrap any section content: <Reveal delay={0.1}>…</Reveal>.
 * Automatically degrades to a plain fade when the user prefers reduced motion.
 */
import { motion, useReducedMotion } from 'framer-motion';
import { EASE_CINEMATIC } from '@/lib/motion';

interface RevealProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  y?: number;
}

export function Reveal({ children, delay = 0, className, y = 26 }: RevealProps) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: reduceMotion ? 0 : y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: reduceMotion ? 0.2 : 0.6, ease: EASE_CINEMATIC, delay }}
    >
      {children}
    </motion.div>
  );
}
