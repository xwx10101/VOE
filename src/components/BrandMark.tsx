import { Sparkles } from 'lucide-react';

export default function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`brand-lockup${compact ? ' brand-lockup-compact' : ''}`}>
      <span className="brand-mark" aria-hidden="true">
        <span className="brand-mark-orbit" />
        <Sparkles size={18} strokeWidth={1.8} />
      </span>
      {!compact && (
        <span className="brand-wordmark">
          <strong>ldx</strong>
          <span>workbench</span>
        </span>
      )}
    </div>
  );
}
