/*
 * ✏️ TEAM GUIDE: Multi-select chip group (conditions, allergies, tags).
 * Keyboard friendly: chips are real <button>s with aria-pressed.
 */
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ChipOption {
  value: string;
  label: string;
}

interface ChipGroupProps {
  options: ChipOption[];
  selected: string[];
  onChange: (next: string[]) => void;
  ariaLabel?: string;
}

export function ChipGroup({ options, selected, onChange, ariaLabel }: ChipGroupProps) {
  const toggle = (value: string) => {
    onChange(
      selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value],
    );
  };
  return (
    <div role="group" aria-label={ariaLabel} className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = selected.includes(option.value);
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => toggle(option.value)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-all duration-200 active:scale-[0.96]',
              active
                ? 'border-primary bg-primary text-primary-foreground shadow-soft'
                : 'border-border bg-background/60 text-foreground hover:border-primary/40 hover:text-primary',
            )}
          >
            {active ? <Check className="size-3.5" aria-hidden="true" /> : null}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
