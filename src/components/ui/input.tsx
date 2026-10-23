/* ✏️ TEAM GUIDE: shadcn/ui Input, custom-themed. Set aria-invalid for the error look. */
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => (
  <input
    ref={ref}
    type={type}
    className={cn(
      'flex h-11 w-full rounded-xl border border-input bg-background/70 px-3.5 py-2 text-sm text-foreground shadow-sm transition-all duration-200 placeholder:text-muted-foreground/80 hover:border-primary/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-55 aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-destructive/40',
      className,
    )}
    {...props}
  />
));
Input.displayName = 'Input';

export { Input };
