/*
 * ✏️ TEAM GUIDE: Accessible form field wrapper — label + control + inline error.
 * Usage:
 *   <FormField id="email" label={t('auth.email')} error={errors.email}>
 *     <Input id="email" aria-invalid={!!errors.email} aria-describedby="email-error" />
 *   </FormField>
 */
import { CircleAlert } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface FormFieldProps {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}

export function FormField({ id, label, error, hint, className, children }: FormFieldProps) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && !error ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      {error ? (
        <p id={`${id}-error`} role="alert" className="flex items-center gap-1.5 text-xs font-medium text-destructive">
          <CircleAlert className="size-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : null}
    </div>
  );
}
