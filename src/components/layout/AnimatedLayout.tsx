/*
 * ✏️ TEAM GUIDE: Route transition wrapper. Every page is rendered inside this
 * in App.tsx (AnimatePresence keyed by pathname) for the cinematic fade+rise.
 * Honors prefers-reduced-motion.
 */
import { motion, useReducedMotion } from 'framer-motion';
import { pageVariants } from '@/lib/motion';

export function AnimatedLayout({ children }: { children: React.ReactNode }) {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return <>{children}</>;
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="min-h-full"
    >
      {children}
    </motion.div>
  );
}
