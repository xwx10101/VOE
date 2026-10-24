import { useEffect, useMemo, useRef, useState } from 'react';

export interface TrendPoint {
  label: string;
  value: number;
  note?: string;
}

export function TrendChart({
  data,
  title,
  description,
  height = 152,
}: {
  data: TrendPoint[];
  title: string;
  description: string;
  height?: number;
}) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const min = Math.min(...data.map((point) => point.value));
  const max = Math.max(...data.map((point) => point.value));
  const span = Math.max(1, max - min);
  const width = 520;
  const padding = 18;
  const innerHeight = height - 46;

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.isIntersecting && setVisible(true)),
      { threshold: 0.25 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const points = useMemo(
    () =>
      data.map((point, index) => {
        const x = padding + (index * (width - padding * 2)) / Math.max(1, data.length - 1);
        const y = padding + innerHeight - ((point.value - min) / span) * (innerHeight - 26);
        return { ...point, x, y };
      }),
    [data, innerHeight, min, span],
  );

  const path = points.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x},${point.y}`).join(' ');
  const area = `${path} L${points[points.length - 1]?.x ?? 0},${padding + innerHeight} L${points[0]?.x ?? 0},${padding + innerHeight} Z`;
  const latest = data[data.length - 1];

  return (
    <div ref={ref}>
      <p className="text-sm font-semibold text-ink">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-muted">{description}</p>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="mt-3 w-full"
        role="img"
        aria-label={`${title}. Seven day household trend: ${data
          .map((point) => `${point.label} ${point.value}`)
          .join(', ')}.`}
      >
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#29BEFD" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#29BEFD" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 0.5, 1].map((fraction) => (
          <line
            key={fraction}
            x1={padding}
            x2={width - padding}
            y1={padding + innerHeight * fraction}
            y2={padding + innerHeight * fraction}
            stroke="#E7EDF5"
            strokeWidth="1"
          />
        ))}
        <path
          d={area}
          fill="url(#trendFill)"
          style={{ opacity: visible ? 1 : 0, transition: 'opacity 700ms ease 150ms' }}
        />
        <path
          d={path}
          fill="none"
          stroke="#123C69"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            strokeDasharray: 1000,
            strokeDashoffset: visible ? 0 : 1000,
            transition: 'stroke-dashoffset 1100ms cubic-bezier(0.22,0.61,0.36,1)',
          }}
        />
        {points.map((point) => (
          <g key={point.label}>
            <circle cx={point.x} cy={point.y} r="4" fill="#fff" stroke="#123C69" strokeWidth="2" />
            <text
              x={point.x}
              y={height - 10}
              textAnchor="middle"
              className="fill-muted"
              style={{ fontSize: 11, fontWeight: 600 }}
            >
              {point.label}
            </text>
          </g>
        ))}
      </svg>
      {latest ? (
        <p className="mt-1 text-xs text-muted">
          Latest: <span className="font-semibold text-ink">{latest.label}</span>, household index{' '}
          <span className="font-semibold text-ink">{latest.value}</span>
          {latest.note ? ` — ${latest.note}` : ''}. Higher is steadier. Prototype household data only.
        </p>
      ) : null}
    </div>
  );
}

export function StackedBars({
  rows,
  members,
}: {
  rows: { memberId: string; visible: number; planning: number }[];
  members: { id: string; name: string; avatarColor: string }[];
}) {
  const max = Math.max(1, ...rows.map((row) => row.visible + row.planning));
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-4 text-xs text-muted">
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-sm bg-royal" aria-hidden="true" /> Visible tasks
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-sm bg-gold" aria-hidden="true" /> Planning work
        </span>
      </div>
      <ul className="space-y-3">
        {rows.map((row) => {
          const member = members.find((item) => item.id === row.memberId);
          const total = row.visible + row.planning;
          return (
            <li key={row.memberId}>
              <div className="mb-1 flex items-center justify-between gap-3 text-[13px]">
                <span className="font-medium text-ink">{member?.name.split(' ')[0] ?? row.memberId}</span>
                <span className="tabular-nums text-muted">
                  {total} {total === 1 ? 'task' : 'tasks'}
                  {row.planning > 0 ? ` · ${row.planning} planning` : ''}
                </span>
              </div>
              <div
                className="flex h-2.5 w-full overflow-hidden rounded-full bg-canvas"
                role="img"
                aria-label={`${member?.name ?? row.memberId}: ${row.visible} visible tasks, ${row.planning} planning tasks`}
              >
                <span
                  className="bar-fill h-full bg-royal"
                  style={{ width: `${(row.visible / max) * 100}%` }}
                />
                <span
                  className="bar-fill h-full bg-gold"
                  style={{ width: `${(row.planning / max) * 100}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-xs leading-relaxed text-muted">
        Planning work — remembering, listing, arranging — is counted separately because it is the least
        visible part of household load.
      </p>
    </div>
  );
}

export function CategoryBars({
  categories,
  onSelect,
}: {
  categories: { id: string; label: string; score: number; summary: string }[];
  onSelect?: (id: string) => void;
}) {
  return (
    <ul className="space-y-4">
      {categories.map((category) => {
        const tone =
          category.score >= 75 ? 'bg-success' : category.score >= 55 ? 'bg-insight' : 'bg-warning';
        const statusText =
          category.score >= 75 ? 'Steady' : category.score >= 55 ? 'Watch' : 'Needs attention';
        const content = (
          <>
            <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-medium text-ink">{category.label}</span>
              <span className="flex items-center gap-2 text-xs">
                <span className="rounded-full bg-canvas px-2 py-0.5 font-semibold text-muted">
                  {statusText}
                </span>
                <span className="tabular-nums font-semibold text-ink">{category.score}</span>
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-canvas">
              <div
                className={`bar-fill h-full rounded-full ${tone}`}
                style={{ width: `${category.score}%` }}
              />
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-muted">{category.summary}</p>
          </>
        );
        return (
          <li key={category.id}>
            {onSelect ? (
              <button
                type="button"
                onClick={() => onSelect(category.id)}
                className="w-full rounded-control p-1 text-left transition hover:bg-canvas/70"
              >
                {content}
              </button>
            ) : (
              <div>{content}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
