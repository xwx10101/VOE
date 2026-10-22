import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: number;
  title: string;
  detail?: string;
  kind: 'success' | 'error' | 'info';
}

export default function Toast({ toast, onClose }: { toast: ToastMessage | null; onClose: () => void }) {
  if (!toast) return null;
  const Icon = toast.kind === 'error' ? AlertCircle : toast.kind === 'success' ? CheckCircle2 : Info;
  return (
    <div className={`toast toast-${toast.kind}`} role="status">
      <span className="toast-icon"><Icon size={18} /></span>
      <span className="toast-copy"><b>{toast.title}</b>{toast.detail && <small>{toast.detail}</small>}</span>
      <button className="icon-button toast-close" onClick={onClose} type="button" aria-label="Dismiss"><X size={15} /></button>
    </div>
  );
}
