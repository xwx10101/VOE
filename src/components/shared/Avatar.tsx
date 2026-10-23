/*
 * ✏️ TEAM GUIDE: Initials avatar with a stable, name-derived color.
 * Sizes: sm (32px) · md (40px) · lg (56px).
 */
import { cn, hashColor, initials } from '@/lib/utils';

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_CLASSES = {
  sm: 'h-8 w-8 text-[0.7rem]',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-lg',
} as const;

export function Avatar({ name, size = 'md', className }: AvatarProps) {
  const color = hashColor(name);
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center rounded-full font-bold text-white shadow-soft ring-2 ring-white/40 dark:ring-white/10',
        SIZE_CLASSES[size],
        className,
      )}
      style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }}
    >
      {initials(name)}
    </span>
  );
}
