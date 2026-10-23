/* ✏️ TEAM GUIDE: shadcn/ui Switch (Radix), custom-themed. RTL-safe thumb travel. */
import { forwardRef } from 'react';
import * as SwitchPrimitives from '@radix-ui/react-switch';
import { cn } from '@/lib/utils';

const Switch = forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    ref={ref}
    className={cn(
      'peer inline-flex h-6.5 w-12 shrink-0 cursor-pointer items-center rounded-full border border-transparent shadow-soft transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted-foreground/30',
      className,
    )}
    {...props}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        'pointer-events-none block h-5.5 w-5.5 rounded-full bg-white shadow-md ring-0 transition-transform duration-300 ease-cinematic data-[state=checked]:ltr:translate-x-[1.35rem] data-[state=unchecked]:ltr:translate-x-0.5 data-[state=checked]:rtl:-translate-x-[1.35rem] data-[state=unchecked]:rtl:-translate-x-0.5',
      )}
    />
  </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
