import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Eye,
  EyeOff,
  Info,
  LogOut,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Users,
  Wand2,
} from 'lucide-react';
import { Brand } from '@/components/layout/Brand';
import { Button } from '@/components/shared/Button';
import { StatusPill, ExplainabilityPanel, MetricCard, PrivacyMatrix } from '@/components/shared/Explainability';
import { ScoreRing } from '@/components/shared/ScoreRing';
import { DEMO_ANSWERS, DEMO_SIGNALS } from '@/data/demo';
import { ASSESSMENT_QUESTIONS } from '@/data/questions';
import { optionFor } from '@/lib/scoring';
import { buildRecommendations } from '@/lib/recommendations';
import {
  applyProposals,
  buildProposals,
  responsibilityBalance,
} from '@/lib/scheduleOptimizer';
import { useFamily } from '@/state/FamilyContext';

const STEPS = [
  {
    label: 'The family',
    title: 'Meet the Al Noor family',
    notes:
      'Introduce the household in one sentence: five people, three generations, one ordinary week. Emphasise that the product is multi-generational by design, not a parent-only dashboard.',
  },
  {
    label: 'Signals',
    title: 'Discover the connected signals',
    notes:
      'Point out that no single signal is dramatic. The value is in the overlap: assessment pressure, a chore evening, and inconsistent rest landing on Wednesday.',
  },
  {
    label: 'Assessment',
    title: 'Complete the family check-in',
    notes:
      'Run the deterministic check-in. The score is 45 — “Needs Attention” — and is produced by fixed deductions, not by a model, so it will be identical every time.',
  },
  {
    label: 'Explanation',
    title: 'Understand the recommendation',
    notes:
      'Open the reasoning panel. Show the four inputs, the rule logic, and the explicit statement that the family controls whether anything is applied.',
  },
  {
    label: 'Weekly plan',
    title: 'Generate the weekly plan',
    notes:
      'Seven actions, never more than two a day, each with a reason and a duration. Mention that the family can edit, replace, or complete any action.',
  },
  {
    label: 'Optimise',
    title: 'Optimise the schedule',
    notes:
      'Select the proposals and show the before/after responsibility split. Stress that the engine proposes; the family applies; undo is always available.',
  },
  {
    label: 'Trust',
    title: 'Review privacy and explainability',
    notes:
      'Show the privacy matrix. Make the ethical boundary explicit: no diagnosis, no emergency monitoring, no secret access to another member’s private entries.',
  },
  {
    label: 'Close',
    title: 'The final family actions',
    notes:
      'Close with the projected outputs, then read the final statement. Invite the judges to explore any module themselves.',
  },
];

export default function Demo() {
  const {
    profile,
    schedule,
    result,
    plan,
    memories,
    reminders,
    runDemoAssessment,
    generatePlan,
    resetDemoHousehold,
    commitOptimization,
    pushToast,
  } = useFamily();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [showNotes, setShowNotes] = useState(false);
  const [selectedProposals, setSelectedProposals] = useState<string[]>([]);
  const [applied, setApplied] = useState(false);

  const proposals = useMemo(() => buildProposals(schedule, profile.members), [schedule, profile.members]);
  const recommendation = useMemo(
    () => (result ? buildRecommendations(result, profile)[0] : null),
    [result, profile],
  );
  const balance = useMemo(
    () => responsibilityBalance(schedule, profile.members),
    [schedule, profile.members],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') setStep((current) => Math.min(STEPS.length - 1, current + 1));
      if (event.key === 'ArrowLeft') setStep((current) => Math.max(0, current - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const restart = () => {
    resetDemoHousehold();
    setStep(0);
    setSelectedProposals([]);
    setApplied(false);
    pushToast('Demo reset to the deterministic starting state.');
  };

  const runAssessment = () => {
    const computed = runDemoAssessment();
    pushToast(`Check-in complete: ${computed.score} · ${computed.statusLabel}.`);
  };

  const applySelected = () => {
    const ids = selectedProposals.length ? selectedProposals : proposals.map((proposal) => proposal.id);
    const next = applyProposals(schedule, proposals, ids);
    commitOptimization(next.events);
    setApplied(true);
    pushToast(`Applied ${ids.length} schedule proposals.`);
  };

  const current = STEPS[step];

  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <a href="#main" className="skip-link">
        Skip to demo content
      </a>
      <header className="sticky top-0 z-[90] border-b border-border bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-[1240px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Brand compact />
            <span className="hidden rounded-full border border-border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted sm:inline">
              Guided judge demo
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowNotes((current) => !current)}
              aria-pressed={showNotes}
              className="btn btn-sm border border-border text-muted"
            >
              {showNotes ? <EyeOff aria-hidden="true" className="h-3.5 w-3.5" /> : <Eye aria-hidden="true" className="h-3.5 w-3.5" />}
              {showNotes ? 'Hide notes' : 'Presenter notes'}
            </button>
            <button type="button" onClick={restart} className="btn btn-sm border border-border text-muted">
              <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" />
              Restart
            </button>
            <button type="button" onClick={() => navigate('/dashboard')} className="btn-ghost btn-sm">
              <LogOut aria-hidden="true" className="h-3.5 w-3.5" />
              Exit demo
            </button>
          </div>
        </div>
        <div className="h-0.5 w-full bg-canvas">
          <div
            className="h-full bg-gradient-to-r from-royal to-teal transition-all duration-500"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-[1240px] flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <nav aria-label="Demo steps" className="hide-scrollbar mb-5 flex gap-1.5 overflow-x-auto pb-1">
          {STEPS.map((item, index) => (
            <button
              key={item.label}
              type="button"
              onClick={() => setStep(index)}
              aria-current={index === step ? 'step' : undefined}
              className={`flex min-h-[38px] shrink-0 items-center gap-2 rounded-full border px-3 text-[11.5px] font-semibold transition ${
                index === step
                  ? 'border-ink bg-ink text-white'
                  : index < step
                    ? 'border-teal/40 bg-teal/[0.07] text-[#0d5c4b]'
                    : 'border-border bg-white text-muted hover:text-ink'
              }`}
            >
              <span className="tabular-nums">{index + 1}</span>
              {item.label}
              {index < step ? <Check aria-hidden="true" className="h-3 w-3" /> : null}
            </button>
          ))}
        </nav>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
          <section className="card p-5 sm:p-7">
            <p className="eyebrow">
              Step {step + 1} of {STEPS.length}
            </p>
            <h1 className="mt-2 font-display text-[clamp(1.5rem,2.8vw,2.1rem)] font-semibold leading-tight text-ink">
              {current.title}
            </h1>

            {step === 0 ? (
              <div className="mt-5">
                <p className="max-w-[62ch] text-[14px] leading-relaxed text-muted">
                  A fictional household in the UAE: five people, three generations, and one ordinary week where
                  several small signals happen to overlap. All data in this demo is deterministic.
                </p>
                <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
                  {profile.members.map((member) => (
                    <li key={member.id} className="flex items-start gap-3 rounded-control border border-border p-3.5">
                      <span
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-ink"
                        style={{ backgroundColor: `${member.avatarColor}2b`, border: `1px solid ${member.avatarColor}` }}
                        aria-hidden="true"
                      >
                        {member.name.charAt(0)}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[13.5px] font-semibold text-ink">{member.name}</p>
                        <p className="text-[11.5px] text-muted">
                          {member.role}
                          {member.age ? ` · ${member.age}` : ''}
                        </p>
                        <p className="mt-1 text-[11.5px] leading-relaxed text-muted">{member.note}</p>
                      </div>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 flex items-start gap-2 rounded-control bg-canvas px-3 py-2.5 text-[12px] leading-relaxed text-muted">
                  <Users aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-royal" />
                  Selected goals: communicate more openly, support exam wellbeing, improve care continuity, create
                  more quality time, and balance responsibilities.
                </p>
              </div>
            ) : null}

            {step === 1 ? (
              <div className="mt-5">
                <p className="max-w-[62ch] text-[14px] leading-relaxed text-muted">
                  Each signal alone is unremarkable. The Family Signal Engine surfaces the connection between them —
                  and states that it is doing so.
                </p>
                <ul className="mt-4 space-y-2.5">
                  {DEMO_SIGNALS.map((signal) => (
                    <li key={signal.id} className="flex items-start gap-3 rounded-control border border-border p-3.5">
                      <span
                        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                          signal.severity === 'attention' ? 'bg-warning' : signal.severity === 'watch' ? 'bg-insight' : 'bg-success'
                        }`}
                        aria-hidden="true"
                      />
                      <div>
                        <p className="text-[13px] font-semibold text-ink">{signal.title}</p>
                        <p className="mt-0.5 text-[12px] leading-relaxed text-muted">{signal.detail}</p>
                        <p className="mt-1 text-[10.5px] uppercase tracking-wide text-muted">{signal.source}</p>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 rounded-control border border-royal/25 bg-royal/[0.05] p-4">
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-royal">Connected insight</p>
                  <p className="mt-1.5 font-display text-[15px] font-semibold leading-snug text-ink">
                    Exam pressure and sleep inconsistency overlap on Wednesday — and the same evening carries a
                    household task.
                  </p>
                </div>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="mt-5">
                <p className="max-w-[62ch] text-[14px] leading-relaxed text-muted">
                  Eight reported signals, fixed deductions, integer output. The same answers always produce the same
                  score.
                </p>
                <div className="mt-4 grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
                  <ScoreRing score={result?.score ?? 45} statusLabel={result?.statusLabel ?? 'Needs Attention'} size={168} />
                  <div>
                    <StatusPill status={result?.status ?? 'attention'} label={result?.statusLabel ?? 'Needs Attention'} />
                    <p className="mt-2 text-[13px] leading-relaxed text-muted">
                      Start at 100, then subtract the reported severity for each answer. The demo landscape produces
                      45, which lands in the “Needs Attention” band (40–59).
                    </p>
                    {result ? (
                      <ul className="mt-2 flex flex-wrap gap-1.5">
                        {result.deductions.map((deduction) => (
                          <li key={deduction.label} className="rounded-full bg-canvas px-2 py-1 text-[10.5px] font-medium text-muted">
                            −{deduction.amount} {deduction.answer.toLowerCase()}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </div>

                <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                  {ASSESSMENT_QUESTIONS.map((question) => {
                    const option = optionFor(question, DEMO_ANSWERS[question.id]);
                    return (
                      <li key={question.id} className="rounded-control border border-border px-3 py-2">
                        <p className="text-[11.5px] text-muted">{question.prompt}</p>
                        <p className="mt-0.5 text-[12.5px] font-semibold text-ink">{option?.label ?? '—'}</p>
                      </li>
                    );
                  })}
                </ul>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button size="sm" onClick={runAssessment}>
                    <Check aria-hidden="true" className="h-3.5 w-3.5" />
                    {result ? 'Re-run the check-in' : 'Complete the check-in'}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setStep(3)}>
                    Go to the explanation
                    <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
                  </Button>
                </div>
                {!result ? (
                  <p className="mt-2 text-[11.5px] text-muted">
                    Result preview shown above. Run the check-in to write the deterministic result to this device.
                  </p>
                ) : null}
              </div>
            ) : null}

            {step === 3 ? (
              <div className="mt-5">
                {recommendation ? (
                  <>
                    <div className="rounded-control border border-gold/30 bg-gold/[0.06] p-4">
                      <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#7a4d00]">
                        Priority 1 · {recommendation.durationMinutes} minutes
                      </p>
                      <p className="mt-1 font-display text-[15px] font-semibold text-ink">{recommendation.title}</p>
                      <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{recommendation.description}</p>
                      <p className="mt-2 text-[12px] leading-relaxed text-muted">
                        <span className="font-semibold text-ink">Expected benefit: </span>
                        {recommendation.benefit}
                      </p>
                    </div>
                    <div className="mt-3">
                      <ExplainabilityPanel
                        title="Why this recommendation?"
                        defaultOpen
                        factors={[
                          { label: 'Overall score', value: `${result?.score ?? 45} · ${result?.statusLabel ?? 'Needs Attention'}` },
                          { label: 'Signals', value: recommendation.signals.join(' · ') },
                          { label: 'Time required', value: `${recommendation.durationMinutes} minutes` },
                          { label: 'Control', value: 'Family applies, edits, or rejects' },
                        ]}
                        logic={recommendation.rationale}
                        action={`${recommendation.title}. ${recommendation.description}`}
                        control="Nothing changes until the family confirms it. The action can be edited or removed at any time."
                        alternative="If the week is already full, reduce the action to five minutes or defer it."
                      />
                    </div>
                  </>
                ) : (
                  <div className="rounded-control border border-border bg-canvas p-4">
                    <p className="text-[13px] text-muted">
                      Run the check-in first so the recommendation can be built from the assessment signals.
                    </p>
                    <Button size="sm" className="mt-2" onClick={runAssessment}>
                      Complete the check-in
                    </Button>
                  </div>
                )}
              </div>
            ) : null}

            {step === 4 ? (
              <div className="mt-5">
                <p className="max-w-[62ch] text-[14px] leading-relaxed text-muted">
                  At most two actions a day, each with a reason. The plan is editable; the demo plan is the same on
                  every run.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      generatePlan();
                      pushToast('Weekly plan generated from the demo signals.');
                    }}
                  >
                    <Sparkles aria-hidden="true" className="h-3.5 w-3.5" />
                    Generate the plan
                  </Button>
                  <Link to="/plan" className="btn-ghost btn-sm">
                    Open the full plan
                    <ChevronRight aria-hidden="true" className="h-3.5 w-3.5" />
                  </Link>
                </div>
                <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                  {plan.actions.slice(0, 8).map((action) => (
                    <li key={action.id} className="rounded-control border border-border p-3">
                      <p className="text-[10.5px] font-semibold uppercase tracking-wide text-muted">{action.day}</p>
                      <p className="mt-0.5 text-[12.5px] font-semibold leading-snug text-ink">{action.title}</p>
                      <p className="mt-1 text-[11px] text-muted">
                        {action.minutes} min · {action.participants.length} participants
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {step === 5 ? (
              <div className="mt-5">
                <p className="max-w-[62ch] text-[14px] leading-relaxed text-muted">
                  The engine proposes; the family decides. Select the proposals you want, and note the responsibility
                  split before and after.
                </p>
                <ul className="mt-4 space-y-2">
                  {proposals.map((proposal) => {
                    const checked = selectedProposals.includes(proposal.id);
                    return (
                      <li key={proposal.id} className={`rounded-control border p-3 ${checked ? 'border-royal/40 bg-royal/[0.04]' : 'border-border'}`}>
                        <label className="flex items-start gap-2.5">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              setSelectedProposals((current) =>
                                current.includes(proposal.id)
                                  ? current.filter((id) => id !== proposal.id)
                                  : [...current, proposal.id],
                              )
                            }
                            className="mt-0.5 h-4 w-4 shrink-0 rounded border-border text-royal focus:ring-insight"
                          />
                          <span>
                            <span className="block text-[12.5px] font-semibold text-ink">{proposal.title}</span>
                            <span className="mt-0.5 block text-[11.5px] leading-relaxed text-muted">{proposal.reason}</span>
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-control border border-border bg-canvas/60 p-3">
                    <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted">Current split</p>
                    <ul className="mt-1.5 space-y-1 text-[11.5px] text-ink/80">
                      {balance.map((row) => (
                        <li key={row.memberId} className="flex justify-between gap-2">
                          <span>{profile.members.find((member) => member.id === row.memberId)?.name.split(' ')[0]}</span>
                          <span className="tabular-nums">{row.share}%</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-control border border-teal/30 bg-teal/[0.06] p-3">
                    <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#0d5c4b]">
                      {applied ? 'After applied changes' : 'After selected changes (preview)'}
                    </p>
                    <ul className="mt-1.5 space-y-1 text-[11.5px] text-ink/80">
                      {responsibilityBalance(
                        applyProposals(
                          schedule,
                          proposals,
                          selectedProposals.length ? selectedProposals : proposals.map((proposal) => proposal.id),
                        ).events,
                        profile.members,
                      ).map((row) => (
                        <li key={row.memberId} className="flex justify-between gap-2">
                          <span>{profile.members.find((member) => member.id === row.memberId)?.name.split(' ')[0]}</span>
                          <span className="tabular-nums">{row.share}%</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button size="sm" onClick={applySelected} disabled={proposals.length === 0}>
                    <Wand2 aria-hidden="true" className="h-3.5 w-3.5" />
                    {applied ? 'Apply again' : `Apply ${selectedProposals.length || proposals.length} selected changes`}
                  </Button>
                  <Link to="/schedule" className="btn-ghost btn-sm">
                    Open the full schedule
                  </Link>
                  {applied ? (
                    <span className="inline-flex items-center gap-1.5 self-center text-[11.5px] font-semibold text-[#1f6f4a]">
                      <Check aria-hidden="true" className="h-3.5 w-3.5" />
                      Changes applied · undo available in Schedule
                    </span>
                  ) : null}
                </div>
              </div>
            ) : null}

            {step === 6 ? (
              <div className="mt-5">
                <p className="max-w-[62ch] text-[14px] leading-relaxed text-muted">
                  The privacy model is the product. Shared views contain category-level summaries only; private
                  entries and coach conversations never enter them.
                </p>
                <div className="mt-4">
                  <PrivacyMatrix />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link to="/trust" className="btn-ghost btn-sm">
                    <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5" />
                    Open the Trust Center
                  </Link>
                  <Link to="/student" className="btn-quiet btn-sm">
                    Student sharing controls
                  </Link>
                </div>
              </div>
            ) : null}

            {step === 7 ? (
              <div className="mt-5">
                <div className="grid gap-3 sm:grid-cols-3">
                  <MetricCard label="Responsibility rebalanced" value="1" hint="One Wednesday task moved to Omar" />
                  <MetricCard label="Study blocks protected" value="2" hint="Wednesday evening and the weekend" />
                  <MetricCard label="Family time planned" value="30 min" hint="Friday walk with indoor alternative" />
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <MetricCard label="Care backups assigned" value="1" hint="Omar, for Fatima’s morning routine" />
                  <MetricCard label="Recommendations explained" value="5" hint="Signals, logic, control, alternative" />
                  <MetricCard label="Private entries shared" value="0" hint="By construction, not by promise" />
                </div>

                <div className="mt-4 rounded-control border border-royal/25 bg-royal/[0.05] p-4">
                  <p className="font-display text-[15px] font-semibold leading-relaxed text-ink">
                    FamilyMind AI does not replace the family’s judgment. It helps the family see, decide, and act
                    together.
                  </p>
                  <p className="mt-2 text-[11.5px] text-muted">
                    Prototype projection · illustrative result · not a clinical outcome.
                  </p>
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <div className="rounded-control border border-border p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Plan actions</p>
                    <p className="mt-1 text-[12.5px] text-ink">
                      {plan.actions.filter((action) => action.status === 'done').length}/{plan.actions.length} complete
                    </p>
                  </div>
                  <div className="rounded-control border border-border p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Vault &amp; care</p>
                    <p className="mt-1 text-[12.5px] text-ink">
                      {memories.length} memories · {reminders.filter((reminder) => reminder.status === 'done').length} care routines confirmed
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => navigate('/dashboard')}>
                    Open the household dashboard
                    <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={restart}>
                    <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" />
                    Restart demo
                  </Button>
                </div>
              </div>
            ) : null}
          </section>

          <aside className="space-y-3">
            <div className="card p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Demo state</p>
              <ul className="mt-2 space-y-1.5 text-[12px]">
                <li className="flex items-center justify-between gap-2">
                  <span className="text-muted">Assessment</span>
                  <span className="font-semibold text-ink">{result ? `${result.score} · ${result.statusLabel}` : 'Not run'}</span>
                </li>
                <li className="flex items-center justify-between gap-2">
                  <span className="text-muted">Plan actions</span>
                  <span className="font-semibold text-ink">{plan.actions.length}</span>
                </li>
                <li className="flex items-center justify-between gap-2">
                  <span className="text-muted">Schedule events</span>
                  <span className="font-semibold text-ink">{schedule.length}</span>
                </li>
                <li className="flex items-center justify-between gap-2">
                  <span className="text-muted">Optimisation</span>
                  <span className="font-semibold text-ink">{applied ? 'Applied' : 'Proposed'}</span>
                </li>
              </ul>
              <p className="mt-2 text-[11px] leading-relaxed text-muted">
                Deterministic · no network · no live model. Every figure is reproducible.
              </p>
            </div>

            <div className="card p-4">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                <Info aria-hidden="true" className="h-3.5 w-3.5" /> Presenter notes
              </p>
              {showNotes ? (
                <p className="mt-2 text-[12px] leading-relaxed text-muted">{current.notes}</p>
              ) : (
                <p className="mt-2 text-[12px] leading-relaxed text-muted">
                  Hidden during presentation. Toggle “Presenter notes” in the header.
                </p>
              )}
              <p className="mt-2 border-t border-border pt-2 text-[11px] text-muted">
                Use ← and → to move between steps.
              </p>
            </div>

            <div className="rounded-control border border-border bg-white p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Try it yourself</p>
              <div className="mt-2 space-y-1.5 text-[12px]">
                {[
                  { to: '/dashboard', label: 'Household dashboard' },
                  { to: '/coach', label: 'AI Family Coach' },
                  { to: '/student', label: 'Student Support' },
                  { to: '/care', label: 'Older Adult Care' },
                  { to: '/trust', label: 'Trust & Safety' },
                ].map((link) => (
                  <Link key={link.to} to={link.to} className="flex items-center justify-between gap-2 text-royal hover:underline">
                    {link.label}
                    <ChevronRight aria-hidden="true" className="h-3 w-3" />
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <Button variant="ghost" size="sm" onClick={() => setStep((current) => Math.max(0, current - 1))} disabled={step === 0}>
            <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-[11.5px] text-muted">
              {step + 1} / {STEPS.length}
            </span>
            {step < STEPS.length - 1 ? (
              <Button size="sm" onClick={() => setStep((current) => Math.min(STEPS.length - 1, current + 1))}>
                Next step
                <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button size="sm" onClick={() => navigate('/dashboard')}>
                Finish and explore
                <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        <p className="mt-4 flex items-start gap-2 text-[11px] leading-relaxed text-muted">
          <ShieldCheck aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-royal" />
          This demonstration uses a fictional household. It is not a medical device and does not monitor emergencies.
          All data stays in this browser.
        </p>
      </main>
    </div>
  );
}
