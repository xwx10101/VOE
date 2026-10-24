import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pause, Play, SkipForward } from 'lucide-react';

const PHASE_TIMES = [0, 3000, 6200, 9400, 12600, 16000, 19400, 22400];

const CAPTIONS = [
  { title: 'A family, in an ordinary week', body: 'Five people, one household, and a week that looks full.' },
  { title: 'Everyday signals appear', body: 'Exam pressure, missed routines, uneven planning, less sleep.' },
  { title: 'Signals stay fragmented', body: 'Each one alone looks small. Nobody sees the combined pattern.' },
  { title: 'FamilyMind connects what is shared', body: 'Only consented summaries — never private notes or messages.' },
  { title: 'The pattern becomes explainable', body: 'Exam pressure and inconsistent sleep overlap on Wednesday.' },
  { title: 'Understanding becomes a plan', body: 'One task moves, one study block is protected, one backup is named.' },
  { title: 'The family decides', body: 'Every suggestion is reviewed, edited, or rejected by the family.' },
];

const MEMBERS = [
  { name: 'Omar', role: 'Father', x: 138, y: 132, color: '#29BEFD' },
  { name: 'Mariam', role: 'Mother', x: 318, y: 104, color: '#A259EA' },
  { name: 'Zayed', role: 'Student', x: 502, y: 142, color: '#47E6C1' },
  { name: 'Latifa', role: 'Child', x: 686, y: 106, color: '#FFB000' },
  { name: 'Fatima', role: 'Grandmother', x: 866, y: 138, color: '#E63946' },
];

const SIGNALS = [
  { label: 'Exam pressure', x: 140, y: 268, tone: '#FFB000' },
  { label: 'Sleep inconsistent', x: 700, y: 258, tone: '#29BEFD' },
  { label: 'Care reminder missed', x: 862, y: 318, tone: '#E63946' },
  { label: 'One family moment', x: 300, y: 340, tone: '#47E6C1' },
  { label: 'Planning uneven', x: 512, y: 322, tone: '#A259EA' },
];

const PLAN_ITEMS = [
  'Move one Wednesday task to Omar',
  'Protect Zayed’s study block',
  'Assign a care backup for Fatima',
  'Plan 30 minutes of family time',
];

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(query.matches);
    const listener = (event: MediaQueryListEvent) => setReduced(event.matches);
    query.addEventListener('change', listener);
    return () => query.removeEventListener('change', listener);
  }, []);
  return reduced;
}

export function CinematicIntro({
  onComplete,
  autoStart = true,
}: {
  onComplete: () => void;
  autoStart?: boolean;
}) {
  const reducedMotion = usePrefersReducedMotion();
  const [phase, setPhase] = useState(0);
  const [paused, setPaused] = useState(!autoStart || reducedMotion);
  const [started, setStarted] = useState(false);
  const [forceFull, setForceFull] = useState(false);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number | null>(null);
  const elapsedRef = useRef(0);
  const barRef = useRef<HTMLDivElement | null>(null);
  const finishedRef = useRef(false);

  useEffect(() => {
    if (!started) {
      const frame = requestAnimationFrame(() => setStarted(true));
      return () => cancelAnimationFrame(frame);
    }
    return undefined;
  }, [started]);

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onComplete();
  }, [onComplete]);

  // Timeline: one rAF loop, paused/resumed, cleaned up on unmount.
  useEffect(() => {
    if (!started || paused) {
      lastRef.current = null;
      return;
    }
    const step = (now: number) => {
      if (lastRef.current === null) lastRef.current = now;
      const delta = now - lastRef.current;
      lastRef.current = now;
      elapsedRef.current = Math.min(PHASE_TIMES[PHASE_TIMES.length - 1], elapsedRef.current + delta);

      const nextPhase = PHASE_TIMES.findIndex(
        (time, index) =>
          elapsedRef.current >= time &&
          (index === PHASE_TIMES.length - 1 || elapsedRef.current < PHASE_TIMES[index + 1]),
      );
      setPhase((current) => (nextPhase === -1 ? current : nextPhase));

      if (barRef.current) {
        const percent = (elapsedRef.current / PHASE_TIMES[PHASE_TIMES.length - 1]) * 100;
        barRef.current.style.width = `${percent}%`;
      }

      if (elapsedRef.current >= PHASE_TIMES[PHASE_TIMES.length - 1]) {
        finish();
        return;
      }
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastRef.current = null;
    };
  }, [started, paused, finish]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') finish();
      if (event.key === ' ') {
        event.preventDefault();
        setPaused((current) => !current);
      }
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [finish]);

  const caption = CAPTIONS[Math.min(phase, CAPTIONS.length - 1)];
  const connected = phase >= 3;
  const explaining = phase >= 4;
  const planning = phase >= 5;
  const closing = phase >= 6;

  const dots = useMemo(() => MEMBERS.map((member) => ({ ...member })), []);

  if (reducedMotion && !forceFull) {
    return (
      <div className="intro-stage flex items-center justify-center px-5">
        <div className="w-full max-w-lg rounded-card border border-white/10 bg-white/[0.04] p-7 text-center">
          <p className="eyebrow text-teal/90">FamilyMind AI</p>
          <h2 className="mt-3 font-display text-2xl font-semibold leading-tight text-white">
            Understand the signals. Strengthen the family.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-white/65">
            Responsible AI for everyday family wellbeing. A static introduction is shown because reduced
            motion is enabled.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <button type="button" onClick={finish} className="btn-signal">
              Enter website
            </button>
            <button
              type="button"
              onClick={() => {
                setForceFull(true);
                setStarted(true);
                setPaused(false);
              }}
              className="btn border border-white/20 text-white hover:bg-white/10"
            >
              Play the full intro
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="intro-stage" role="dialog" aria-modal="true" aria-label="FamilyMind AI introduction">
      <div className="intro-grid" aria-hidden="true" />

      <div className="relative flex h-full flex-col">
        <div className="flex items-center justify-between px-4 pt-4 sm:px-7 sm:pt-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-[11px] font-bold text-teal">
              FM
            </span>
            <span className="font-display text-sm font-semibold text-white/90">FamilyMind AI</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setStarted(true);
                setPaused((current) => !current);
              }}
              className="btn btn-sm border border-white/15 text-white/85 hover:bg-white/10"
              aria-pressed={paused}
            >
              {paused ? <Play aria-hidden="true" className="h-3.5 w-3.5" /> : <Pause aria-hidden="true" className="h-3.5 w-3.5" />}
              {paused ? 'Resume' : 'Pause'}
            </button>
            <button
              type="button"
              onClick={finish}
              className="btn btn-sm border border-white/15 text-white/85 hover:bg-white/10"
            >
              <SkipForward aria-hidden="true" className="h-3.5 w-3.5" />
              Skip intro
            </button>
          </div>
        </div>

        <div className="relative flex-1 px-3 sm:px-6">
          <svg
            viewBox="0 0 1000 430"
            className="mx-auto h-full w-full max-w-5xl"
            role="img"
            aria-label="Animated introduction: five family members, scattered everyday signals, and connected insight leading to a family plan."
          >
            <defs>
              <radialGradient id="hubGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#47E6C1" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#47E6C1" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="hubRing" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#47E6C1" />
                <stop offset="100%" stopColor="#29BEFD" />
              </linearGradient>
            </defs>

            <circle cx="500" cy="232" r="150" fill="url(#hubGlow)" opacity={connected ? 0.9 : 0.25} style={{ transition: 'opacity 900ms ease' }} />

            {dots.map((member, index) => {
              const visible = phase >= 0;
              const linkActive = connected;
              return (
                <g key={member.name} style={{ opacity: visible ? 1 : 0 }}>
                  <line
                    x1={member.x}
                    y1={member.y + 26}
                    x2="500"
                    y2="232"
                    stroke={linkActive ? '#47E6C1' : '#FFFFFF'}
                    strokeOpacity={linkActive ? 0.45 : 0.08}
                    strokeWidth="1.3"
                    strokeDasharray={linkActive ? 'none' : '4 6'}
                    style={{ transition: 'stroke-opacity 900ms ease, stroke 900ms ease' }}
                  />
                  <circle
                    cx={member.x}
                    cy={member.y}
                    r={30}
                    fill={`${member.color}22`}
                    stroke={member.color}
                    strokeWidth="1.6"
                    style={{
                      transformOrigin: `${member.x}px ${member.y}px`,
                      transform: started ? 'scale(1)' : 'scale(0.6)',
                      transition: `transform 700ms cubic-bezier(0.22,0.61,0.36,1) ${index * 160}ms, opacity 700ms ease ${index * 160}ms`,
                      opacity: visible ? 1 : 0,
                    }}
                  />
                  <text
                    x={member.x}
                    y={member.y + 5}
                    textAnchor="middle"
                    fill="#FFFFFF"
                    style={{ fontSize: 16, fontWeight: 600, fontFamily: 'Sora, sans-serif' }}
                  >
                    {member.name.charAt(0)}
                  </text>
                  <text
                    x={member.x}
                    y={member.y + 50}
                    textAnchor="middle"
                    fill="#FFFFFF"
                    fillOpacity="0.72"
                    style={{ fontSize: 13, fontWeight: 500 }}
                  >
                    {member.name}
                  </text>
                  <text
                    x={member.x}
                    y={member.y + 66}
                    textAnchor="middle"
                    fill="#FFFFFF"
                    fillOpacity="0.4"
                    style={{ fontSize: 10.5, letterSpacing: '0.08em', textTransform: 'uppercase' }}
                  >
                    {member.role}
                  </text>
                </g>
              );
            })}

            {SIGNALS.map((signal, index) => {
              const appear = phase >= 1;
              const fragment = phase >= 2;
              const absorbed = planning;
              const offsetX = fragment ? (index % 2 === 0 ? -12 : 12) : 0;
              const offsetY = fragment ? (index < 2 ? -8 : 10) : 0;
              return (
                <g
                  key={signal.label}
                  style={{
                    opacity: absorbed ? 0 : appear ? 1 : 0,
                    transform: `translate(${offsetX}px, ${offsetY}px)`,
                    transition: `opacity ${absorbed ? 700 : 600}ms ease ${appear ? index * 90 : 0}ms, transform 700ms ease`,
                  }}
                >
                  <rect
                    x={signal.x - 74}
                    y={signal.y - 15}
                    width="148"
                    height="30"
                    rx="15"
                    fill="#0B1B33"
                    stroke={signal.tone}
                    strokeOpacity="0.5"
                  />
                  <circle cx={signal.x - 56} cy={signal.y} r="3.4" fill={signal.tone} className="signal-dot" />
                  <text
                    x={signal.x - 46}
                    y={signal.y + 4}
                    fill="#FFFFFF"
                    fillOpacity="0.86"
                    style={{ fontSize: 11.5, fontWeight: 500 }}
                  >
                    {signal.label}
                  </text>
                </g>
              );
            })}

            <g style={{ opacity: connected ? 1 : 0, transition: 'opacity 800ms ease' }}>
              <circle cx="500" cy="232" r="62" fill="#071426" stroke="url(#hubRing)" strokeWidth="1.8" />
              <circle cx="500" cy="232" r="74" fill="none" stroke="#47E6C1" strokeOpacity="0.18" strokeWidth="1" strokeDasharray="3 7" />
              <text x="500" y="224" textAnchor="middle" fill="#FFFFFF" style={{ fontSize: 14, fontWeight: 600, fontFamily: 'Sora, sans-serif' }}>
                Family Signal
              </text>
              <text x="500" y="244" textAnchor="middle" fill="#47E6C1" style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.16em' }}>
                ENGINE
              </text>
            </g>

            <g style={{ opacity: explaining && !planning ? 1 : 0, transition: 'opacity 600ms ease' }}>
              <rect x="286" y="322" width="428" height="58" rx="14" fill="#0B1B33" stroke="#47E6C1" strokeOpacity="0.35" />
              <text x="500" y="345" textAnchor="middle" fill="#47E6C1" style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.16em' }}>
                CONNECTED PATTERN
              </text>
              <text x="500" y="366" textAnchor="middle" fill="#FFFFFF" fillOpacity="0.86" style={{ fontSize: 13 }}>
                Exam pressure and sleep inconsistency overlap on Wednesday.
              </text>
            </g>

            {PLAN_ITEMS.map((item, index) => (
              <g
                key={item}
                style={{
                  opacity: planning && !closing ? 1 : 0,
                  transform: planning ? 'translateY(0)' : 'translateY(10px)',
                  transition: `opacity 500ms ease ${index * 120}ms, transform 500ms ease ${index * 120}ms`,
                }}
              >
                <rect x="286" y={288 + index * 34} width="428" height="30" rx="10" fill="#0B1B33" stroke="#47E6C1" strokeOpacity="0.28" />
                <circle cx="306" cy={303 + index * 34} r="3.6" fill="#FFB000" />
                <text x="320" y={307 + index * 34} fill="#FFFFFF" fillOpacity="0.9" style={{ fontSize: 12.5 }}>
                  {item}
                </text>
              </g>
            ))}
          </svg>
        </div>

        <div className="relative px-5 pb-5 sm:px-8 sm:pb-7">
          <div className="mx-auto max-w-3xl">
            <div key={phase} className="intro-fade text-center">
              {closing ? (
                <h1 className="font-display text-[clamp(1.5rem,3.4vw,2.4rem)] font-semibold leading-tight text-white">
                  Understand the signals. Strengthen the family.
                </h1>
              ) : (
                <>
                  <p className="font-display text-[clamp(1.05rem,2.2vw,1.5rem)] font-semibold text-white">
                    {caption.title}
                  </p>
                  <p className="mt-1.5 text-sm text-white/60">{caption.body}</p>
                </>
              )}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1.5" aria-hidden="true">
                {CAPTIONS.map((item, index) => (
                  <span
                    key={item.title}
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      index === Math.min(phase, CAPTIONS.length - 1) ? 'w-6 bg-teal' : 'w-1.5 bg-white/25'
                    }`}
                  />
                ))}
              </div>
              {closing ? (
                <button type="button" onClick={finish} className="btn-signal">
                  Enter website
                </button>
              ) : (
                <p className="text-[11px] text-white/55">Press Esc to skip · Space to pause</p>
              )}
            </div>

            <div className="mt-4 h-0.5 w-full overflow-hidden rounded-full bg-white/10" aria-hidden="true">
              <div ref={barRef} className="h-full w-0 rounded-full bg-gradient-to-r from-teal to-insight" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
