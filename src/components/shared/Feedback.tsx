import type { ReactNode } from 'react';
import { CheckCircle2, Info, ShieldAlert, TriangleAlert, X } from 'lucide-react';
import type { ToastMessage } from '@/types';

export function ToastStack({
  toasts,
  onDismiss,
}: {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-4 z-[150] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-6 sm:items-end"
      role="status"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-control border border-border bg-white p-3 shadow-lift"
        >
          {toast.tone === 'success' ? (
            <CheckCircle2 aria-hidden="true" className="mt-0.5 h-4 w-4 text-success" />
          ) : toast.tone === 'error' ? (
            <TriangleAlert aria-hidden="true" className="mt-0.5 h-4 w-4 text-danger" />
          ) : (
            <Info aria-hidden="true" className="mt-0.5 h-4 w-4 text-royal" />
          )}
          <p className="flex-1 text-sm leading-snug text-ink">{toast.title}</p>
          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            className="rounded p-1 text-muted hover:text-ink"
          >
            <X aria-hidden="true" className="h-3.5 w-3.5" />
            <span className="sr-only">Dismiss notification</span>
          </button>
        </div>
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  copy,
  action,
  icon,
}: {
  title: string;
  copy: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-card border border-dashed border-border bg-white/70 px-6 py-10 text-center">
      {icon ? <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-canvas text-muted">{icon}</div> : null}
      <p className="font-display text-base font-semibold text-ink">{title}</p>
      <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-muted">{copy}</p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function SafetyNotice({
  children,
  title = 'Prototype boundaries',
  tone = 'neutral',
}: {
  children: ReactNode;
  title?: string;
  tone?: 'neutral' | 'warning';
}) {
  return (
    <div
      className={`flex items-start gap-3 rounded-control border p-4 ${
        tone === 'warning' ? 'border-warning/30 bg-warning/[0.06]' : 'border-border bg-canvas/70'
      }`}
    >
      <ShieldAlert
        aria-hidden="true"
        className={`mt-0.5 h-4 w-4 shrink-0 ${tone === 'warning' ? 'text-warning' : 'text-royal'}`}
      />
      <div>
        <p className="text-[13px] font-semibold text-ink">{title}</p>
        <div className="mt-1 text-[13px] leading-relaxed text-muted">{children}</div>
      </div>
    </div>
  );
}

export function LoadingSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-hidden="true">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="h-16 animate-pulse rounded-control bg-canvas" />
      ))}
    </div>
  );
}

export function ErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="rounded-card border border-danger/25 bg-danger/[0.04] p-6">
      <p className="font-semibold text-ink">Something interrupted this view</p>
      <p className="mt-1 text-sm text-muted">
        Your family data is still saved locally. Try again — the deterministic engine works without a
        network connection.
      </p>
      {onRetry ? (
        <button type="button" onClick={onRetry} className="btn-ghost btn-sm mt-3">
          Try again
        </button>
      ) : null}
    </div>
  );
}
