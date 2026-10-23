/*
 * ✏️ TEAM GUIDE: Shared Framer Motion variants — one cinematic motion language
 * for the whole app (300–400ms, ease [0.22, 1, 0.36, 1]).
 * Components should import from here instead of hand-rolling transitions.
 */
import type { Variants } from 'framer-motion';

export const EASE_CINEMATIC = [0.22, 1, 0.36, 1] as const;

/** Route-level page transition (fade + rise). */
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.38, ease: EASE_CINEMATIC },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.22, ease: EASE_CINEMATIC },
  },
};

/** Single element entrance (used by Reveal and lists). */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 22 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: EASE_CINEMATIC, delay },
  }),
};

/** Parent that staggers any `fadeUp` children. */
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.09, delayChildren: 0.05 },
  },
};

/** Gentle pop for badges / chips / toasts. */
export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 320, damping: 22 },
  },
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.15 } },
};
