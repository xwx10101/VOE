import { Link } from 'react-router-dom';

export function BrandMark({ size = 34 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 40 40"
      width={size}
      height={size}
      role="img"
      aria-label="FamilyMind AI mark: four connected family signals"
      className="shrink-0"
    >
      <rect width="40" height="40" rx="11" fill="#071426" />
      <circle cx="14" cy="15" r="3.6" fill="#47E6C1" />
      <circle cx="27" cy="13.5" r="2.7" fill="#FFB000" />
      <circle cx="25.5" cy="26.5" r="3.3" fill="#29BEFD" />
      <circle cx="14" cy="27" r="2.4" fill="#A259EA" />
      <path
        d="M17.2 13.9L24.3 13.2M16.4 17.8L23 24.2M17 27.8L22.6 27.1M16 19L15 23.6"
        stroke="#E7EEF9"
        strokeOpacity="0.6"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Brand({
  tone = 'dark',
  compact = false,
}: {
  tone?: 'dark' | 'light';
  compact?: boolean;
}) {
  return (
    <Link
      to="/"
      className="flex items-center gap-2.5 rounded-control outline-none focus-visible:ring-2 focus-visible:ring-insight"
      aria-label="FamilyMind AI home"
    >
      <BrandMark size={compact ? 30 : 34} />
      <span className="leading-none">
        <span
          className={`block font-display text-[15px] font-semibold tracking-tight ${
            tone === 'light' ? 'text-white' : 'text-ink'
          }`}
        >
          FamilyMind<span className="text-teal"> AI</span>
        </span>
        {!compact ? (
          <span
            className={`mt-0.5 block text-[10px] font-medium uppercase tracking-[0.16em] ${
              tone === 'light' ? 'text-white/55' : 'text-muted'
            }`}
          >
            Family wellbeing
          </span>
        ) : null}
      </span>
    </Link>
  );
}
