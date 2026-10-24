import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, CalendarRange, Clock, MessagesSquare, RotateCcw, Sparkles, Target } from 'lucide-react';
import { Button, LinkButton } from '@/components/shared/Button';
import { CategoryBars } from '@/components/shared/Charts';
import { EmptyState, SafetyNotice } from '@/components/shared/Feedback';
import { ExplainabilityPanel, MetricCard, StatusPill } from '@/components/shared/Explainability';
import { ScoreRing } from '@/components/shared/ScoreRing';
import { scoreSummary } from '@/lib/scoring';
import { buildRecommendations, memberName } from '@/lib/recommendations';
import { useFamily } from '@/state/FamilyContext';

export default function Results() {
  const { result, profile, generatePlan, resetAnswers, pushToast } = useFamily();
  const navigate = useNavigate();

  const recommendations = useMemo(
    () => (result ? buildRecommendations(result, profile).slice(0, 3) : []),
    [result, profile],
  );

  if (!result) {
    return (
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-2xl font-semibold text-ink">No result yet</h1>
        <p className="mt-2 text-sm text-muted">
          The explainable result appears after the eight-question family check-in.
        </p>
        <div className="mt-6">
          <EmptyState
            title="Complete the family check-in first"
            copy="Eight questions, about two minutes. Nothing is shared outside this device."
            action={<LinkButton to="/assessment">Start Family Check-In</LinkButton>}
            icon={<Target aria-hidden="true" className="h-5 w-5" />}
          />
        </div>
      </div>
    );
  }

  const summary = scoreSummary(result);
  const totalDeduction = result.deductions.reduce((total, item) => total + item.amount, 0);
  const lowest = [...result.categories].sort((a, b) => a.score - b.score)[0];

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Explainable result</p>
          <h1 className="mt-2 font-display text-[clamp(1.6rem,3vw,2.2rem)] font-semibold leading-tight text-ink">
            {profile.isDemo ? 'The Al Noor household this week' : 'Your household this week'}
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            Based on eight reported household signals. Nothing here is a diagnosis, and nothing was shared
            automatically.
          </p>
        </div>
        <StatusPill status={result.status} label={result.statusLabel} />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="card p-5 sm:p-6" aria-live="polite">
          <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-7">
            <ScoreRing score={result.score} statusLabel={result.statusLabel} size={176} />
            <div className="min-w-0">
              <h2 className="font-display text-lg font-semibold text-ink">Household Harmony Score</h2>
              <p className="mt-2 text-[13.5px] leading-relaxed text-muted">{summary.sentence}</p>
              <p className="mt-3 text-[12px] leading-relaxed text-muted">
                Strongest area: <span className="font-semibold text-ink">{summary.strongest?.label}</span> · Most
                attention needed: <span className="font-semibold text-ink">{summary.weakest?.label}</span>
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="pill">Non-clinical</span>
                <span className="pill">Prioritisation aid</span>
                <span className="pill">Family-reviewed</span>
              </div>
            </div>
          </div>

          {result.note ? (
            <div className="mt-5 rounded-control border border-border bg-canvas/70 p-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Your note · stays private</p>
              <p className="mt-1 text-[13px] leading-relaxed text-ink/80">“{result.note}”</p>
            </div>
          ) : null}
        </section>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <MetricCard label="Status" value={result.statusLabel} hint="Classification bands: 80+, 60–79, 40–59, below 40." />
          <MetricCard
            label="Deductions applied"
            value={`−${totalDeduction}`}
            hint={`8 answers · final score ${result.score}. Integer values only.`}
          />
          <MetricCard
            label="Actions ready"
            value={recommendations.length}
            hint="Prioritised, each with a reason and an estimated time."
          />
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className="card p-5 sm:p-6">
          <h2 className="font-display text-base font-semibold text-ink">Category scores</h2>
          <p className="mt-1 text-[12px] leading-relaxed text-muted">
            Integer values out of 100. Categories summarise areas of household life, not individual people.
          </p>
          <div className="mt-4">
            <CategoryBars categories={result.categories} />
          </div>
        </section>

        <div className="space-y-4">
          <section className="card p-5 sm:p-6">
            <h2 className="font-display text-base font-semibold text-ink">Family strengths</h2>
            <p className="mt-1 text-[12px] text-muted">What is already working and worth protecting.</p>
            {result.strengths.length ? (
              <ul className="mt-3 space-y-2">
                {result.strengths.map((strength) => (
                  <li key={strength} className="flex items-start gap-2.5 rounded-control bg-success/[0.06] p-2.5 text-[13px] leading-relaxed text-ink/80">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-success" aria-hidden="true" />
                    {strength}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-[13px] text-muted">
                No category reached a clear strength this week. That is information, not a verdict — start with one
                small action.
              </p>
            )}
          </section>

          <section className="card p-5 sm:p-6">
            <h2 className="font-display text-base font-semibold text-ink">Signals needing attention</h2>
            <p className="mt-1 text-[12px] text-muted">Reported signals, not detected facts about a person.</p>
            {result.signals.length ? (
              <ul className="mt-3 space-y-2">
                {result.signals.map((signal) => (
                  <li key={signal} className="flex items-start gap-2.5 rounded-control bg-warning/[0.07] p-2.5 text-[13px] leading-relaxed text-ink/80">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-warning" aria-hidden="true" />
                    {signal}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-[13px] text-muted">No elevated signal was reported this week.</p>
            )}
          </section>
        </div>
      </div>

      <section className="mt-4 card p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="font-display text-base font-semibold text-ink">Three prioritised actions</h2>
            <p className="mt-1 text-[12px] text-muted">
              Each action states the signal it used, the time it needs, and the benefit it is aiming for.
            </p>
          </div>
          <span className="pill">Editable before applying</span>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {recommendations.map((rec, index) => (
            <article key={rec.id} className="flex flex-col rounded-control border border-border p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                  Priority {index + 1}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted">
                  <Clock aria-hidden="true" className="h-3 w-3" />
                  {rec.durationMinutes} min
                </span>
              </div>
              <h3 className="mt-2 text-[14px] font-semibold leading-snug text-ink">{rec.title}</h3>
              <p className="mt-1.5 flex-1 text-[12.5px] leading-relaxed text-muted">{rec.description}</p>
              <p className="mt-2.5 rounded-control bg-canvas px-2.5 py-2 text-[11.5px] leading-relaxed text-muted">
                <span className="font-semibold text-ink">Expected benefit: </span>
                {rec.benefit}
              </p>
              <p className="mt-2 text-[11px] text-muted">
                Participants: {rec.participants.map((id) => memberName(profile, id)).join(', ') || 'Household'}
              </p>
              <button
                type="button"
                onClick={() => {
                  generatePlan();
                  pushToast('Weekly plan generated from these signals.');
                  navigate('/plan');
                }}
                className="btn-ghost btn-sm mt-3 w-full"
              >
                Add to weekly plan
                <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
              </button>
            </article>
          ))}
        </div>

        <div className="mt-4 space-y-2.5">
          {recommendations[0] ? (
            <ExplainabilityPanel
              title="Why the first recommendation?"
              factors={[
                { label: 'Overall score', value: `${result.score} · ${result.statusLabel}` },
                { label: 'Weakest category', value: `${lowest.label} (${lowest.score})` },
                { label: 'Signals used', value: recommendations[0].signals.join(' · ') },
                { label: 'Time required', value: `${recommendations[0].durationMinutes} minutes` },
              ]}
              logic={recommendations[0].rationale}
              action={`${recommendations[0].title}. ${recommendations[0].description}`}
              control="The family can edit the day, duration, or participants, or reject it entirely. Nothing is applied automatically."
              alternative="If this week is already full, reduce the action to five minutes or defer it to next week."
            />
          ) : null}

          <ExplainabilityPanel
            title="How this score was calculated"
            factors={result.deductions.map((deduction) => ({
              label: deduction.answer,
              value: `−${deduction.amount}`,
            }))}
            logic={`Start at 100 and subtract the reported severity for each answered question: ${result.deductions
              .map((item) => `${item.answer} −${item.amount}`)
              .join(', ')}. Final score ${100 - totalDeduction}, clamped between 0 and 100, then classified as ${result.statusLabel}.`}
            action="The score prioritises where a family might act first. It is not a measure of family quality."
            control="Every answer can be changed, and the whole result recalculates deterministically."
            alternative="A family can ignore the score entirely and work only from the category descriptions."
          />
        </div>
      </section>

      <section className="mt-4 flex flex-col gap-3 rounded-card border border-border bg-white p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <h2 className="font-display text-base font-semibold text-ink">Turn this into an achievable week</h2>
          <p className="mt-1 text-[13px] leading-relaxed text-muted">
            Generate a seven-day plan with at most two actions per day, then edit anything that does not fit.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => {
              generatePlan();
              pushToast('Weekly plan generated with 7 actions.');
              navigate('/plan');
            }}
          >
            <CalendarRange aria-hidden="true" className="h-4 w-4" />
            Generate Weekly Plan
          </Button>
          <LinkButton to="/coach" variant="ghost">
            <MessagesSquare aria-hidden="true" className="h-4 w-4" />
            Ask Family Coach
          </LinkButton>
          <Button
            variant="quiet"
            onClick={() => {
              resetAnswers();
              navigate('/assessment');
            }}
          >
            <RotateCcw aria-hidden="true" className="h-4 w-4" />
            Retake
          </Button>
        </div>
      </section>

      <div className="mt-4 space-y-3">
        <SafetyNotice tone="warning" title="What this result is not">
          FamilyMind AI does not diagnose medical or mental-health conditions, cannot monitor emergencies, and does
          not replace qualified professionals. Prototype metrics demonstrate interface behaviour and are not
          clinical outcomes.
        </SafetyNotice>
        <p className="flex items-center gap-2 text-[11px] text-muted">
          <Sparkles aria-hidden="true" className="h-3.5 w-3.5 text-royal" />
          Want the deterministic walkthrough?{' '}
          <Link to="/demo" className="font-semibold text-royal">
            Open the guided judge demo
          </Link>
        </p>
      </div>
    </div>
  );
}
