/* ✏️ TEAM GUIDE: Form label (native <label>, styled to the design system). */
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

const Label = forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        'text-sm font-semibold leading-none text-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-60',
        className,
      )}
      {...props}
    />
  ),
);
Label.displayName = 'Label';

export { Label };
