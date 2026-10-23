/*
 * ✏️ TEAM GUIDE: Tiny hook for the "invalid form" shake micro-animation.
 * Usage: const { controls, shake } = useShake();
 *        <motion.form animate={controls}> … onError → shake()
 */
import { useAnimationControls, useReducedMotion } from 'framer-motion';
import { useCallback } from 'react';

export function useShake() {
  const controls = useAnimationControls();
  const reduceMotion = useReducedMotion();
  const shake = useCallback(() => {
    if (reduceMotion) return;
    void controls.start({
      x: [0, -9, 8, -5, 4, -2, 0],
      transition: { duration: 0.42, ease: 'easeInOut' },
    });
  }, [controls, reduceMotion]);
  return { controls, shake };
}
