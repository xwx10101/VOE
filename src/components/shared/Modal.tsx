import { useEffect, useId, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}) {
  const ref = useRef<HTMLDialogElement | null>(null);
  const restoreRef = useRef<HTMLElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      restoreRef.current = document.activeElement as HTMLElement;
      dialog.showModal();
      document.body.style.overflow = 'hidden';
    }
    if (!open && dialog.open) {
      dialog.close();
      document.body.style.overflow = '';
      restoreRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const width = size === 'lg' ? 'max-w-3xl' : size === 'sm' ? 'max-w-md' : 'max-w-xl';

  return (
    <dialog
      ref={ref}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
      aria-labelledby={titleId}
      className={`w-[calc(100%-2rem)] ${width} rounded-card border border-border bg-white p-0 text-ink shadow-lift backdrop:bg-ink/55`}
    >
      <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
        <div>
          <h2 id={titleId} className="text-lg font-semibold text-ink">
            {title}
          </h2>
          {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
        </div>
        <button type="button" onClick={onClose} className="btn btn-sm border border-border text-muted">
          <X aria-hidden="true" className="h-4 w-4" />
          <span className="sr-only">Close dialog</span>
        </button>
      </div>
      <div className="max-h-[65dvh] overflow-y-auto px-5 py-4 sm:px-6">{children}</div>
      {footer ? (
        <div className="flex flex-wrap justify-end gap-2 border-t border-border bg-canvas/60 px-5 py-3 sm:px-6">
          {footer}
        </div>
      ) : null}
    </dialog>
  );
}
