import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, ClipboardCheck, Info, RotateCcw, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { SafetyNotice } from '@/components/shared/Feedback';
import { ASSESSMENT_QUESTIONS, GOALS } from '@/data/questions';
import { answeredCount, isAnswerComplete, optionFor } from '@/lib/scoring';
import { useFamily } from '@/state/FamilyContext';
import type { GoalId } from '@/types';

const TOTAL_STEPS = ASSESSMENT_QUESTIONS.length + 1;

export default function Assessment() {
  const { answers, setAnswer, resetAnswers, completeAssessment, pushToast, profile, saveProfile, result } =
    useFamily();
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const [error, setError] = useState('');
  const [note, setNote] = useState(result?.note ?? '');
  const headingRef = useRef<HTMLHeadingElement | null>(null);

  const question = ASSESSMENT_QUESTIONS[index];
  const isReview = index === ASSESSMENT_QUESTIONS.length;
  const complete = isAnswerComplete(answers);
  const progress = isReview ? 100 : Math.round((answeredCount(answers) / ASSESSMENT_QUESTIONS.length) * 100);

  useEffect(() => {
    headingRef.current?.focus();
  }, [index]);

  const next = () => {
    if (!isReview && !answers[question.id]) {
      setError('Choose one answer to continue. Every question can be changed later.');
      return;
    }
    setError('');
    setIndex((current) => Math.min(TOTAL_STEPS - 1, current + 1));
  };

  const back = () => {
    setError('');
    setIndex((current) => Math.max(0, current - 1));
  };

  const submit = () => {
    if (!complete) {
      setError('Some questions are still unanswered. Use Back to complete them.');
      setIndex(ASSESSMENT_QUESTIONS.findIndex((item) => !answers[item.id]));
      return;
    }
    const computed = completeAssessment(note.trim() || undefined);
    pushToast(`Assessment saved. Harmony Score ${computed.score} — ${computed.statusLabel}.`);
    navigate('/results');
  };

  const toggleGoal = (goal: GoalId) => {
    saveProfile({
      ...profile,
      goals: profile.goals.includes(goal) ? profile.goals.filter((item) => item !== goal) : [...profile.goals, goal],
    });
  };

  return (
    <div className="mx-auto max-w-3xl">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Family check-in</p>
          <h1 className="mt-2 font-display text-[clamp(1.6rem,3vw,2.2rem)] font-semibold leading-tight text-ink">
            Eight questions about this week
          </h1>
          <p className="mt-1.5 max-w-[58ch] text-sm leading-relaxed text-muted">
            Answer for the household, not for one person. No answer is used to judge anyone, and the result is a
            prioritisation aid — not a diagnosis.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            resetAnswers();
            setIndex(0);
            setNote('');
            setError('');
            pushToast('Answers cleared.', 'info');
          }}
          className="btn-ghost btn-sm"
        >
          <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" />
          Start over
        </button>
      </header>

      <div className="mt-5 card p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[12px] font-semibold text-ink">
            {isReview ? 'Review and submit' : `Question ${index + 1} of ${ASSESSMENT_QUESTIONS.length}`}
          </p>
          <p className="text-[12px] text-muted">
            {answeredCount(answers)} / {ASSESSMENT_QUESTIONS.length} answered
          </p>
        </div>
        <div
          className="mt-2 h-2 w-full overflow-hidden rounded-full bg-canvas"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          aria-label="Assessment progress"
        >
          <div className="bar-fill h-full rounded-full bg-gradient-to-r from-royal to-insight" style={{ width: `${progress}%` }} />
        </div>

        {error ? (
          <div role="alert" className="mt-4 rounded-control border border-danger/30 bg-danger/[0.05] px-4 py-2.5 text-[13px] text-danger">
            {error}
          </div>
        ) : null}

        {!isReview && question ? (
          <div className="mt-5">
            <fieldset>
              <legend className="w-full">
                <h2
                  ref={headingRef}
                  tabIndex={-1}
                  className="font-display text-[clamp(1.15rem,2.2vw,1.4rem)] font-semibold leading-snug text-ink outline-none"
                >
                  {question.prompt}
                </h2>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{question.helper}</p>
              </legend>
              <div className="mt-4 grid gap-2.5">
                {question.options.map((option) => {
                  const selected = answers[question.id] === option.value;
                  return (
                    <label
                      key={option.value}
                      className={`flex cursor-pointer items-start gap-3 rounded-control border p-3.5 transition ${
                        selected
                          ? 'border-royal bg-royal/[0.05] shadow-soft'
                          : 'border-border bg-white hover:border-royal/30 hover:bg-canvas/50'
                      }`}
                    >
                      <input
                        type="radio"
                        name={question.id}
                        value={option.value}
                        checked={selected}
                        onChange={() => {
                          setAnswer(question.id, option.value);
                          setError('');
                        }}
                        className="mt-0.5 h-4 w-4 shrink-0 border-border text-royal focus:ring-insight"
                      />
                      <span className="min-w-0">
                        <span className="block text-[14px] font-medium text-ink">{option.label}</span>
                        {option.hint ? (
                          <span className="mt-0.5 block text-[12px] leading-relaxed text-muted">{option.hint}</span>
                        ) : null}
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <p className="mt-3 flex items-start gap-2 text-[11.5px] leading-relaxed text-muted">
              <Info aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              This answer affects the {question.scale === 'care' ? 'Care Continuity' : question.scale === 'student' ? 'Student Support' : question.scale === 'rest' ? 'Rest and Recovery' : question.scale === 'tasks' ? 'Responsibility Balance' : 'Connection'} category and the overall score.
              {optionFor(question, answers[question.id]) ? ` Selected: ${optionFor(question, answers[question.id])?.label}.` : ''}
            </p>
          </div>
        ) : null}

        {isReview ? (
          <div className="mt-5">
            <h2 ref={headingRef} tabIndex={-1} className="font-display text-xl font-semibold text-ink outline-none">
              Review the week before you see the result
            </h2>
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
              Optional: choose the priorities that matter most, and add one sentence about what would make this
              week feel better. This note stays on this device.
            </p>

            <ul className="mt-4 space-y-1.5">
              {ASSESSMENT_QUESTIONS.map((item, itemIndex) => {
                const chosen = optionFor(item, answers[item.id]);
                return (
                  <li key={item.id} className="flex items-center gap-3 rounded-control border border-border px-3 py-2">
                    <span className="w-5 shrink-0 text-[11px] tabular-nums text-muted">{itemIndex + 1}</span>
                    <span className="min-w-0 flex-1 truncate text-[12.5px] text-muted">{item.prompt}</span>
                    <button
                      type="button"
                      onClick={() => setIndex(itemIndex)}
                      className="shrink-0 rounded-full px-2 py-1 text-[11.5px] font-semibold text-royal hover:bg-royal/5"
                    >
                      <span className={chosen ? 'text-ink' : 'text-danger'}>
                        {chosen ? chosen.label : 'Answer'}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            <fieldset className="mt-5">
              <legend className="field-label">Family priorities (optional)</legend>
              <div className="flex flex-wrap gap-1.5">
                {GOALS.map((goal) => {
                  const active = profile.goals.includes(goal.id);
                  return (
                    <button key={goal.id} type="button" aria-pressed={active} onClick={() => toggleGoal(goal.id)} className="chip">
                      {active ? <Check aria-hidden="true" className="h-3 w-3" /> : null}
                      {goal.label}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div className="mt-4">
              <label htmlFor="assessment-note" className="field-label">
                What would make this week feel better?
              </label>
              <p id="assessment-note-hint" className="field-hint">
                Optional, up to 200 characters. This stays private to this device.
              </p>
              <textarea
                id="assessment-note"
                className="field min-h-[88px] resize-y"
                maxLength={200}
                value={note}
                aria-describedby="assessment-note-hint assessment-note-count"
                onChange={(event) => setNote(event.target.value.slice(0, 200))}
                placeholder="For example: a calmer Wednesday evening and one meal together."
              />
              <p id="assessment-note-count" className="mt-1 text-right text-[11px] text-muted">
                {note.length}/200 characters
              </p>
            </div>

            <div className="mt-4">
              <SafetyNotice>
                Results are a prioritisation aid based on reported household signals. FamilyMind AI does not
                diagnose medical or mental-health conditions and cannot monitor emergencies.
              </SafetyNotice>
            </div>
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <button type="button" onClick={back} disabled={index === 0} className="btn-ghost btn-sm disabled:opacity-50">
            <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
            Back
          </button>
          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-1.5 text-[11px] text-muted sm:flex">
              <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5 text-royal" />
              Non-clinical · family-controlled
            </span>
            {isReview ? (
              <Button size="sm" onClick={submit}>
                <ClipboardCheck aria-hidden="true" className="h-3.5 w-3.5" />
                Show my family result
              </Button>
            ) : (
              <Button size="sm" onClick={next}>
                Next question
                <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <p className="mt-4 text-center text-[11px] text-muted">
        Keyboard tip: use arrow keys within a question, and Tab to reach the Next button.
      </p>
    </div>
  );
}
