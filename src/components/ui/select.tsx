/*
 * ✏️ TEAM GUIDE: Styled native <select> (accessible, zero-dep, RTL-safe).
 * Prefer this for form dropdowns; options passed as children <option>s.
 */
import { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

const Select = forwardRef<HTMLSelectElement, SelectProps>(({ className, children, ...props }, ref) => (
  <span className="relative block">
    <select
      ref={ref}
      className={cn(
        'h-11 w-full appearance-none rounded-xl border border-input bg-background/70 px-3.5 pe-10 text-sm text-foreground shadow-sm transition-all duration-200 hover:border-primary/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-55 aria-[invalid=true]:border-destructive',
        className,
      )}
      {...props}
    >
      {children}
    </select>
    <ChevronDown
      className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
      aria-hidden="true"
    />
  </span>
));
Select.displayName = 'Select';

export { Select };
