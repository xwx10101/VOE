import { Check, Circle, Clock3, LoaderCircle, X } from 'lucide-react';

export default function StatusPill({ status }: { status?: string }) {
  const value = (status || 'unknown').toLowerCase();
  if (value === 'completed' || value === 'success' || value === 'succeeded') {
    return <span className="status-pill status-completed"><Check size={12} /> Completed</span>;
  }
  if (value === 'failed' || value === 'error') {
    return <span className="status-pill status-failed"><X size={12} /> Failed</span>;
  }
  if (value === 'processing' || value === 'running') {
    return <span className="status-pill status-processing"><LoaderCircle size={12} className="spin" /> Processing</span>;
  }
  if (value === 'queued' || value === 'pending') {
    return <span className="status-pill status-queued"><Clock3 size={12} /> Queued</span>;
  }
  return <span className="status-pill status-unknown"><Circle size={10} /> {status || 'Unknown'}</span>;
}
