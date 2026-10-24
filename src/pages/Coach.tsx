import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check,
  Copy,
  CornerDownLeft,
  Lightbulb,
  MessageCircle,
  PencilLine,
  Plus,
  Send,
  ShieldAlert,
  Sparkles,
  Trash2,
  TriangleAlert,
} from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { Modal } from '@/components/shared/Modal';
import { SafetyNotice } from '@/components/shared/Feedback';
import { DEMO_COACH_SCENARIOS } from '@/data/demo';
import { requestCoachResponse, responseToPlainText, streamText } from '@/lib/ai';
import { sanitizeText } from '@/lib/safety';
import { useFamily } from '@/state/FamilyContext';
import type { ChatMessage, CoachResponse, PlanAction } from '@/types';

const todayName = () => new Date().toLocaleDateString('en-US', { weekday: 'long' });

function buildPlanActions(response: CoachResponse): PlanAction[] {
  const day = todayName();
  return [
    {
      id: `plan-coach-${Date.now()}-today`,
      day,
      title: response.todayAction.title,
      detail: response.todayAction.detail,
      why: response.whyItHelps,
      minutes: response.todayAction.minutes || 10,
      participants: [],
      category: 'connection',
      status: 'open',
      source: 'coach',
    },
    ...response.weekSteps.slice(0, 2).map((step, index) => {
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const startIndex = days.indexOf(day);
      const planDay = days[(Math.max(0, startIndex) + index + 1) % 7];
      return {
        id: `plan-coach-${Date.now()}-${index}`,
        day: planDay,
        title: step.length > 72 ? `${step.slice(0, 69)}…` : step,
        detail: step,
        why: response.pattern,
        minutes: 15,
        participants: [],
        category: 'connection',
        status: 'open',
        source: 'coach',
      } satisfies PlanAction;
    }),
  ];
}

export default function Coach() {
  const { profile, result, addPlanActions, pushToast } = useFamily();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<{ response: CoachResponse; title: string; minutes: number; day: string } | null>(null);
  const stopStreamRef = useRef<(() => void) | null>(null);
  const timerRef = useRef<number | null>(null);
  const logRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    return () => {
      stopStreamRef.current?.();
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    const log = logRef.current;
    if (!log || typeof log.scrollTo !== 'function') return;
    log.scrollTo({ top: log.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const send = async (raw: string) => {
    const text = sanitizeText(raw, 600);
    if (!text || busy) return;
    setError('');
    setBusy(true);
    setInput('');

    const familyId = `family-${Date.now()}`;
    const coachId = `coach-${Date.now()}`;
    setMessages((current) => [
      ...current,
      { id: familyId, role: 'family', content: text },
      { id: coachId, role: 'coach', content: '', pending: true },
    ]);

    try {
      const response = await requestCoachResponse({ message: text, profile, result });
      // Typing state before the response begins to appear.
      await new Promise((resolve) => setTimeout(resolve, 320));

      const fullText = response.reflection;
      let started = false;
      stopStreamRef.current = streamText(
        fullText,
        (partial) => {
          started = true;
          setMessages((current) =>
            current.map((message) =>
              message.id === coachId ? { ...message, content: partial, pending: true } : message,
            ),
          );
        },
        { intervalMs: 12, chunkSize: 5 },
      );

      const finishWhenReady = () => {
        if (!started) {
          timerRef.current = window.setTimeout(finishWhenReady, 120);
          return;
        }
        timerRef.current = window.setTimeout(() => {
          stopStreamRef.current?.();
          stopStreamRef.current = null;
          setMessages((current) =>
            current.map((message) =>
              message.id === coachId
                ? { ...message, content: fullText, pending: false, response }
                : message,
            ),
          );
          setBusy(false);
        }, Math.max(700, fullText.length * 11));
      };
      finishWhenReady();
    } catch {
      setMessages((current) =>
        current.map((message) =>
          message.id === coachId
            ? {
                ...message,
                pending: false,
                error: true,
                content:
                  'Guidance could not be generated in this browser. The deterministic engine still works — try again, or open the weekly plan and use the suggested actions there.',
              }
            : message,
        ),
      );
      setError('The coach could not respond. Check that browser storage is available, then try again.');
      setBusy(false);
    }
  };

  const copy = async (response: CoachResponse) => {
    const text = responseToPlainText(response);
    try {
      await navigator.clipboard.writeText(text);
      pushToast('Response copied to the clipboard.');
    } catch {
      pushToast('Copy is unavailable in this browser. Select the text to copy it.', 'error');
    }
  };

  const addToPlan = (response: CoachResponse) => {
    addPlanActions(buildPlanActions(response));
    pushToast('Coach actions added to the weekly plan.');
  };

  return (
    <div className="mx-auto max-w-4xl">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">AI-assisted family guidance</p>
          <h1 className="mt-2 font-display text-[clamp(1.6rem,3vw,2.2rem)] font-semibold leading-tight text-ink">
            AI Family Coach
          </h1>
          <p className="mt-1.5 max-w-[62ch] text-sm leading-relaxed text-muted">
            Educational, non-medical guidance shaped by this household’s signals. Every response ends with
            something the family can edit or reject.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => navigate('/plan')}
            className="btn-ghost btn-sm"
          >
            Weekly plan
          </button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setMessages([]);
              setError('');
              pushToast('Conversation cleared from this screen.', 'info');
            }}
            disabled={messages.length === 0}
          >
            <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
            Clear conversation
          </Button>
        </div>
      </header>

      <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_260px]">
        <div className="rounded-control border border-border bg-white p-3.5 text-[12px] leading-relaxed text-muted">
          <span className="font-semibold text-ink">How this works: </span>
          responses are generated on this device by a deterministic rules engine, using the signals you reported.
          No live model is required, and no conversation is sent anywhere.
        </div>
        <div className="rounded-control border border-border bg-canvas/70 p-3.5 text-[12px] leading-relaxed text-muted">
          <span className="font-semibold text-ink">Safety boundary: </span>
          if a message suggests an emergency, ordinary coaching stops and the coach points to human support.
        </div>
      </div>

      <section className="card mt-4 overflow-hidden" aria-label="Coach conversation">
        <div
          ref={logRef}
          className="max-h-[52dvh] min-h-[280px] space-y-4 overflow-y-auto p-4 sm:p-5 scrollbar-slim"
          aria-live="polite"
          aria-relevant="additions text"
        >
          {messages.length === 0 ? (
            <div className="flex h-full min-h-[220px] flex-col items-center justify-center text-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-royal/[0.07] text-royal">
                <MessageCircle aria-hidden="true" className="h-5 w-5" />
              </span>
              <p className="mt-3 font-display text-[15px] font-semibold text-ink">Start with what feels hardest this week</p>
              <p className="mt-1 max-w-sm text-[12.5px] leading-relaxed text-muted">
                Choose a scenario below, or write in your own words. There is no wrong place to start.
              </p>
            </div>
          ) : null}

          {messages.map((message) =>
            message.role === 'family' ? (
              <div key={message.id} className="flex justify-end">
                <div className="max-w-[85%] rounded-card rounded-br-md bg-ink px-4 py-2.5 text-[13.5px] leading-relaxed text-white">
                  {message.content}
                </div>
              </div>
            ) : (
              <div key={message.id} className="flex gap-2.5">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal/20 text-[11px] font-bold text-[#0d5c4b]">
                  FM
                </span>
                <div className="min-w-0 flex-1">
                  {message.pending && !message.content ? (
                    <div className="inline-flex items-center gap-1.5 rounded-card rounded-bl-md border border-border bg-canvas px-3.5 py-3">
                      <span className="sr-only">Coach is typing</span>
                      {[0, 1, 2].map((dot) => (
                        <span
                          key={dot}
                          className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted"
                          style={{ animationDelay: `${dot * 120}ms` }}
                          aria-hidden="true"
                        />
                      ))}
                    </div>
                  ) : null}

                  {message.error ? (
                    <div className="rounded-card rounded-bl-md border border-danger/30 bg-danger/[0.05] p-3.5">
                      <p className="flex items-center gap-2 text-[12px] font-semibold text-danger">
                        <TriangleAlert aria-hidden="true" className="h-4 w-4" />
                        Fallback guidance
                      </p>
                      <p className="mt-1.5 text-[13px] leading-relaxed text-ink/80">{message.content}</p>
                      <button
                        type="button"
                        onClick={() => send('Our weekly schedule is overloaded')}
                        className="btn-ghost btn-sm mt-2"
                      >
                        Try the offline example
                      </button>
                    </div>
                  ) : null}

                  {message.response ? (
                    <article
                      className={`rounded-card rounded-bl-md border p-4 ${
                        message.response.isSafetyResponse
                          ? 'border-warning/40 bg-warning/[0.06]'
                          : 'border-border bg-white'
                      }`}
                    >
                      {message.response.isSafetyResponse ? (
                        <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7a4d00]">
                          <ShieldAlert aria-hidden="true" className="h-3.5 w-3.5" />
                          Safety response
                        </p>
                      ) : null}
                      <p className="mt-1 whitespace-pre-line text-[13.5px] leading-relaxed text-ink">
                        {message.content}
                      </p>

                      {!message.response.isSafetyResponse ? (
                        <>
                          <div className="mt-4 rounded-control bg-canvas p-3">
                            <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted">Pattern summary</p>
                            <p className="mt-1 text-[12.5px] leading-relaxed text-ink/80">{message.response.pattern}</p>
                          </div>

                          <div className="mt-3 rounded-control border border-gold/30 bg-gold/[0.06] p-3">
                            <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#7a4d00]">
                              Today’s action · under 15 minutes
                            </p>
                            <p className="mt-1 text-[13px] font-semibold text-ink">{message.response.todayAction.title}</p>
                            <p className="mt-1 text-[12.5px] leading-relaxed text-muted">{message.response.todayAction.detail}</p>
                            <p className="mt-1.5 text-[11px] text-muted">{message.response.todayAction.minutes} minutes · today</p>
                          </div>

                          <div className="mt-3">
                            <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted">Three steps for the week</p>
                            <ol className="mt-1.5 space-y-1.5">
                              {message.response.weekSteps.map((step, index) => (
                                <li key={step} className="flex gap-2 text-[12.5px] leading-relaxed text-ink/80">
                                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-royal/[0.08] text-[10px] font-bold text-royal">
                                    {index + 1}
                                  </span>
                                  {step}
                                </li>
                              ))}
                            </ol>
                          </div>

                          <div className="mt-3 rounded-control border border-border p-3">
                            <p className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted">
                              <Lightbulb aria-hidden="true" className="h-3 w-3" /> Conversation starter
                            </p>
                            <p className="mt-1 text-[12.5px] italic leading-relaxed text-ink/80">
                              “{message.response.conversationStarter}”
                            </p>
                          </div>

                          <p className="mt-3 text-[12px] leading-relaxed text-muted">
                            <span className="font-semibold text-ink">Why this may help: </span>
                            {message.response.whyItHelps}
                          </p>
                        </>
                      ) : null}

                      {message.response.safetyNote ? (
                        <p className="mt-3 rounded-control bg-canvas px-3 py-2 text-[11.5px] leading-relaxed text-muted">
                          {message.response.safetyNote}
                        </p>
                      ) : null}

                      <div className="mt-4 flex flex-wrap gap-1.5 border-t border-border pt-3">
                        {!message.response.isSafetyResponse ? (
                          <>
                            <button
                              type="button"
                              onClick={() => addToPlan(message.response!)}
                              className="btn-signal btn-sm"
                            >
                              <Plus aria-hidden="true" className="h-3.5 w-3.5" />
                              Add actions to plan
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setEditing({
                                  response: message.response!,
                                  title: message.response!.todayAction.title,
                                  minutes: message.response!.todayAction.minutes || 10,
                                  day: todayName(),
                                })
                              }
                              className="btn-ghost btn-sm"
                            >
                              <PencilLine aria-hidden="true" className="h-3.5 w-3.5" />
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setMessages((current) =>
                                  current.filter((item) => item.id !== message.id),
                                );
                                pushToast('Recommendation rejected and removed.', 'info');
                              }}
                              className="btn-quiet btn-sm"
                            >
                              Reject
                            </button>
                          </>
                        ) : null}
                        <button type="button" onClick={() => copy(message.response!)} className="btn-quiet btn-sm">
                          <Copy aria-hidden="true" className="h-3.5 w-3.5" />
                          Copy response
                        </button>
                      </div>
                    </article>
                  ) : null}
                </div>
              </div>
            ),
          )}
        </div>

        <div className="border-t border-border p-4">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted">Suggested scenarios</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {DEMO_COACH_SCENARIOS.map((scenario) => (
              <button
                key={scenario.id}
                type="button"
                onClick={() => send(scenario.label)}
                disabled={busy}
                className="chip disabled:opacity-50"
              >
                {scenario.label}
              </button>
            ))}
          </div>

          {error ? (
            <p role="alert" className="mt-2 rounded-control bg-danger/[0.06] px-3 py-2 text-[12px] text-danger">
              {error}
            </p>
          ) : null}

          <form
            className="mt-3 flex items-end gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              send(input);
            }}
          >
            <div className="flex-1">
              <label htmlFor="coach-input" className="sr-only">
                Describe what is happening in your family this week
              </label>
              <textarea
                id="coach-input"
                className="field min-h-[52px] resize-none"
                rows={2}
                maxLength={600}
                value={input}
                placeholder="Describe what is happening this week…"
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    send(input);
                  }
                }}
              />
              <p className="mt-1 flex items-center justify-between text-[10.5px] text-muted">
                <span className="inline-flex items-center gap-1">
                  <CornerDownLeft aria-hidden="true" className="h-3 w-3" /> Enter to send · Shift + Enter for a new line
                </span>
                <span>{input.length}/600</span>
              </p>
            </div>
            <Button type="submit" size="sm" loading={busy} disabled={!input.trim()}>
              <Send aria-hidden="true" className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only">Send</span>
            </Button>
          </form>
        </div>
      </section>

      <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_260px]">
        <SafetyNotice title="What the coach will not do">
          It will not diagnose, provide therapy, or assess risk. For clinical concerns, a qualified professional
          should be involved. FamilyMind AI cannot monitor emergencies and does not invent hotline numbers.
        </SafetyNotice>
        <div className="rounded-control border border-border bg-white p-4">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
            <Sparkles aria-hidden="true" className="h-3.5 w-3.5 text-royal" /> Engine status
          </p>
          <p className="mt-2 flex items-center gap-2 text-[12.5px] text-ink">
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-success text-white">
              <Check aria-hidden="true" className="h-2.5 w-2.5" />
            </span>
            Deterministic rules engine active
          </p>
          <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted">
            A future model can be connected through a server proxy. Secrets are never exposed in the browser, and
            outputs are validated before display.
          </p>
        </div>
      </div>

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title="Edit before adding to the plan"
        description="You decide the outcome, the time, and the day."
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (!editing) return;
                const action: PlanAction = {
                  id: `plan-coach-edit-${Date.now()}`,
                  day: editing.day,
                  title: editing.title.trim() || 'Family action',
                  detail: editing.response.todayAction.detail,
                  why: editing.response.whyItHelps,
                  minutes: editing.minutes,
                  participants: [],
                  category: 'connection',
                  status: 'open',
                  source: 'coach',
                };
                addPlanActions([action]);
                pushToast('Edited action added to the plan.');
                setEditing(null);
              }}
            >
              Add edited action
            </Button>
          </>
        }
      >
        {editing ? (
          <div className="space-y-3">
            <label className="block">
              <span className="field-label">Action title</span>
              <input
                className="field"
                value={editing.title}
                maxLength={90}
                onChange={(event) => setEditing({ ...editing, title: event.target.value })}
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="field-label">Minutes</span>
                <input
                  type="number"
                  min={5}
                  max={120}
                  step={5}
                  className="field"
                  value={editing.minutes}
                  onChange={(event) => setEditing({ ...editing, minutes: Number(event.target.value) })}
                />
              </label>
              <label className="block">
                <span className="field-label">Day</span>
                <select
                  className="field"
                  value={editing.day}
                  onChange={(event) => setEditing({ ...editing, day: event.target.value })}
                >
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                    <option key={day}>{day}</option>
                  ))}
                </select>
              </label>
            </div>
            <p className="rounded-control bg-canvas p-3 text-[12px] leading-relaxed text-muted">
              {editing.response.todayAction.detail}
            </p>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
