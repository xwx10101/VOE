import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  Copy,
  GraduationCap,
  Lock,
  Moon,
  Pause,
  Play,
  RotateCcw,
  Send,
  ShieldCheck,
  Timer,
} from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { ExplainabilityPanel } from '@/components/shared/Explainability';
import type { MemoryEntry } from '@/types';
import { loadForMember } from '@/lib/scheduleOptimizer';
import { useFamily } from '@/state/FamilyContext';

const SUBJECTS = [
  { id: 'math', label: 'Mathematics assessment', when: 'Wednesday 09:30', minutes: 90 },
  { id: 'chem', label: 'Chemistry assessment', when: 'Friday 11:00', minutes: 60 },
  { id: 'physics', label: 'Physics revision set', when: 'Tuesday evening', minutes: 45 },
];

const daysUntilWednesday = () => {
  const today = new Date().getDay(); // 0 Sun … 6 Sat
  const target = 3;
  return (target - today + 7) % 7;
};

export default function Student() {
  const { profile, schedule, addPlanActions, addMemory, pushToast } = useFamily();
  const student = profile.members.find((member) => member.role === 'Student') ?? profile.members[0];
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [sleepSteps, setSleepSteps] = useState<string[]>(['Screens off by 22:00']);
  const [sharing, setSharing] = useState({ workload: true, studyBlocks: true, moodNotes: false, conversation: false });
  const [feeling, setFeeling] = useState('overloaded');
  const [reason, setReason] = useState('two assessments overlap this week');
  const [request, setRequest] = useState('move one household task until Thursday');
  const [goal, setGoal] = useState('Finish the physics revision set before 20:00');
  const [shared, setShared] = useState('');
  const [remaining, setRemaining] = useState(600);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<number | null>(null);

  const loads = useMemo(
    () => (student ? loadForMember(schedule, student.id) : []),
    [schedule, student],
  );
  const studyBlocks = useMemo(
    () => schedule.filter((event) => event.category === 'study' && event.ownerId === student?.id),
    [schedule, student],
  );
  const weeklyMinutes = loads.reduce((total, day) => total + day.minutes, 0);
  const heaviest = [...loads].sort((a, b) => b.minutes - a.minutes)[0];
  const examInDays = daysUntilWednesday();

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      intervalRef.current = null;
      return;
    }
    intervalRef.current = window.setInterval(() => {
      setRemaining((current) => {
        if (current <= 1) {
          setRunning(false);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [running]);

  const message = `I am feeling ${feeling} because ${reason}. Could we ${request}?`;

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      pushToast('Copied to the clipboard.');
    } catch {
      pushToast('Copy is unavailable in this browser. Select the text instead.', 'error');
    }
  };

  const shareSummary = () => {
    setShared(message);
    const entry: Omit<MemoryEntry, 'id' | 'createdAt'> = {
      type: 'kind-message',
      title: 'A support request shared with the family',
      message: `${student?.name.split(' ')[0] ?? 'Student'} chose to share: “${message}”`,
      date: new Date().toISOString().slice(0, 10),
      memberTags: student ? [student.id] : [],
      visibility: 'household',
    };
    addMemory(entry);
    pushToast('Summary shared with the household. Private mood notes were not included.');
  };

  return (
    <div className="mx-auto max-w-[1100px]">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Student support mode</p>
          <h1 className="mt-2 font-display text-[clamp(1.6rem,3vw,2.2rem)] font-semibold leading-tight text-ink">
            {student?.name.split(' ')[0] ?? 'Student'}’s week, on your terms
          </h1>
          <p className="mt-1.5 max-w-[64ch] text-sm leading-relaxed text-muted">
            This space is yours. You decide what the household sees, and you can ask for support without
            explaining everything.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 self-start rounded-full border border-border bg-white px-3 py-1.5 text-[11px] font-semibold text-muted">
          <Lock aria-hidden="true" className="h-3.5 w-3.5 text-royal" />
          Private by default
        </span>
      </header>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-4">
          <p className="stat-label">Exam countdown</p>
          <p className="mt-1 font-display text-2xl font-semibold text-ink">
            {examInDays === 0 ? 'Today' : `${examInDays} day${examInDays === 1 ? '' : 's'}`}
          </p>
          <p className="mt-1 text-[11.5px] text-muted">until the mathematics assessment</p>
        </div>
        <div className="card p-4">
          <p className="stat-label">Scheduled load</p>
          <p className="mt-1 font-display text-2xl font-semibold text-ink">
            {Math.floor(weeklyMinutes / 60)}h {weeklyMinutes % 60}m
          </p>
          <p className="mt-1 text-[11.5px] text-muted">This week in the shared calendar</p>
        </div>
        <div className="card p-4">
          <p className="stat-label">Heaviest day</p>
          <p className="mt-1 font-display text-2xl font-semibold text-ink">{heaviest?.day ?? '—'}</p>
          <p className="mt-1 text-[11.5px] text-muted">
            {heaviest ? `${Math.round(heaviest.minutes / 60)}h ${heaviest.minutes % 60}m · ${heaviest.status}` : 'No load recorded'}
          </p>
        </div>
        <div className="card p-4">
          <p className="stat-label">Protected study blocks</p>
          <p className="mt-1 font-display text-2xl font-semibold text-ink">{studyBlocks.length}</p>
          <p className="mt-1 text-[11.5px] text-muted">No chores inside these blocks</p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <section className="card p-5">
          <h2 className="font-display text-base font-semibold text-ink">Current workload</h2>
          <p className="mt-1 text-[12px] text-muted">A shared summary, not a judgement about effort.</p>
          <ul className="mt-3 space-y-2">
            {loads.map((day) => (
              <li key={day.day} className="flex items-center gap-3">
                <span className="w-16 shrink-0 text-[11.5px] text-muted">{day.day.slice(0, 3)}</span>
                <span className="flex h-2 flex-1 overflow-hidden rounded-full bg-canvas">
                  <span
                    className={`h-full rounded-full ${
                      day.status === 'overloaded' ? 'bg-danger' : day.status === 'busy' ? 'bg-warning' : 'bg-insight'
                    }`}
                    style={{ width: `${Math.min(100, (day.minutes / 480) * 100)}%` }}
                  />
                </span>
                <span className="w-16 shrink-0 text-right text-[11px] tabular-nums text-muted">
                  {Math.floor(day.minutes / 60)}h {day.minutes % 60 ? `${day.minutes % 60}m` : ''}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 rounded-control border border-border bg-canvas/60 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Today’s achievable goal</p>
            <label htmlFor="student-goal" className="sr-only">
              Today’s achievable goal
            </label>
            <input
              id="student-goal"
              className="mt-1.5 w-full rounded-control border border-border bg-white px-3 py-2 text-[13px] text-ink"
              value={goal}
              maxLength={120}
              onChange={(event) => setGoal(event.target.value)}
            />
            <p className="mt-1.5 text-[11px] text-muted">
              One goal is enough. If it changes during the day, that is information, not failure.
            </p>
          </div>
        </section>

        <section className="card p-5">
          <h2 className="font-display text-base font-semibold text-ink">Study blocks and break timer</h2>
          <p className="mt-1 text-[12px] text-muted">Protected time, then a real break.</p>
          <ul className="mt-3 space-y-2">
            {studyBlocks.map((block) => (
              <li key={block.id} className="flex items-center justify-between gap-2 rounded-control border border-border px-3 py-2">
                <span className="min-w-0">
                  <span className="block truncate text-[12.5px] font-medium text-ink">{block.title}</span>
                  <span className="text-[11px] text-muted">
                    {block.day} · {block.start}–{block.end}
                  </span>
                </span>
                <span className="shrink-0 rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#7a4d00]">
                  Protected
                </span>
              </li>
            ))}
            {studyBlocks.length === 0 ? (
              <li className="rounded-control border border-dashed border-border px-3 py-3 text-[12px] text-muted">
                No study block is scheduled yet. Add one from the weekly plan.
              </li>
            ) : null}
          </ul>

          <div className="mt-4 rounded-control border border-border p-3.5">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                <Moon aria-hidden="true" className="h-3.5 w-3.5" /> Sleep routine
              </p>
              <span className="text-[11px] font-semibold text-ink">22:00 wind-down · 22:30 lights out</span>
            </div>
            <ul className="mt-2 space-y-1.5">
              {['Screens off by 22:00', 'Bag packed before dinner', 'Phone outside the room'].map((step) => {
                const done = sleepSteps.includes(step);
                return (
                  <li key={step}>
                    <button
                      type="button"
                      aria-pressed={done}
                      onClick={() =>
                        setSleepSteps((current) =>
                          current.includes(step)
                            ? current.filter((item) => item !== step)
                            : [...current, step],
                        )
                      }
                      className="flex w-full items-center gap-2 rounded-control px-1 py-1 text-left"
                    >
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                          done ? 'border-success bg-success text-white' : 'border-border text-transparent'
                        }`}
                        aria-hidden="true"
                      >
                        <Check className="h-2.5 w-2.5" />
                      </span>
                      <span className={`text-[12px] ${done ? 'text-muted' : 'text-ink'}`}>{step}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <p className="mt-1.5 text-[11px] text-muted">
              A routine, not a target. These steps stay private to this screen.
            </p>
          </div>

          <div className="mt-4 rounded-control border border-border bg-canvas/60 p-3.5">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                <Timer aria-hidden="true" className="h-3.5 w-3.5" /> Break timer
              </p>
              <p className="font-display text-xl font-semibold tabular-nums text-ink" aria-live="polite">
                {String(Math.floor(remaining / 60)).padStart(2, '0')}:{String(remaining % 60).padStart(2, '0')}
              </p>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button size="sm" variant="ghost" onClick={() => setRunning((current) => !current)}>
                {running ? <Pause aria-hidden="true" className="h-3.5 w-3.5" /> : <Play aria-hidden="true" className="h-3.5 w-3.5" />}
                {running ? 'Pause break' : remaining === 0 ? 'Start again' : 'Start break'}
              </Button>
              <Button
                size="sm"
                variant="quiet"
                onClick={() => {
                  setRunning(false);
                  setRemaining(600);
                }}
              >
                <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" />
                Reset
              </Button>
            </div>
            <p className="mt-1.5 text-[11px] text-muted">
              {remaining === 0
                ? 'Break finished. Stand up, drink water, and return when you are ready.'
                : 'Ten minutes away from screens. The timer never shares your activity with the household.'}
            </p>
          </div>
        </section>

        <section className="card p-5">
          <h2 className="font-display text-base font-semibold text-ink">Task load</h2>
          <p className="mt-1 text-[12px] text-muted">A short list beats a long one during assessment weeks.</p>
          <ul className="mt-3 space-y-2">
            {SUBJECTS.map((subject) => {
              const done = completedTasks.includes(subject.id);
              return (
                <li key={subject.id} className={`flex items-center gap-3 rounded-control border px-3 py-2 ${done ? 'border-success/30 bg-success/[0.04]' : 'border-border'}`}>
                  <button
                    type="button"
                    aria-pressed={done}
                    onClick={() =>
                      setCompletedTasks((current) =>
                        current.includes(subject.id)
                          ? current.filter((id) => id !== subject.id)
                          : [...current, subject.id],
                      )
                    }
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition ${
                      done ? 'border-success bg-success text-white' : 'border-border text-transparent hover:border-royal'
                    }`}
                  >
                    <Check aria-hidden="true" className="h-3 w-3" />
                    <span className="sr-only">
                      Mark {subject.label} {done ? 'incomplete' : 'complete'}
                    </span>
                  </button>
                  <span className="min-w-0 flex-1">
                    <span className={`block text-[12.5px] font-medium ${done ? 'text-muted line-through' : 'text-ink'}`}>
                      {subject.label}
                    </span>
                    <span className="text-[11px] text-muted">
                      {subject.when} · about {subject.minutes} minutes
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-[11.5px] leading-relaxed text-muted">
            {completedTasks.length} of {SUBJECTS.length} tasks complete. Progress here is private unless you share
            the workload summary.
          </p>
        </section>

        <section className="card p-5">
          <h2 className="font-display text-base font-semibold text-ink">Ask for support</h2>
          <p className="mt-1 text-[12px] text-muted">Build the sentence first. You choose whether to send it.</p>
          <div className="mt-3 space-y-2.5">
            <label className="block">
              <span className="field-label !text-[12px]">I am feeling</span>
              <select className="field" value={feeling} onChange={(event) => setFeeling(event.target.value)}>
                {['overloaded', 'tired', 'worried', 'stretched thin', 'quiet but okay'].map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="field-label !text-[12px]">because</span>
              <select className="field" value={reason} onChange={(event) => setReason(event.target.value)}>
                {[
                  'two assessments overlap this week',
                  'I have not had enough sleep',
                  'Wednesday has too many responsibilities',
                  'I am behind on revision',
                ].map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="field-label !text-[12px]">Could we</span>
              <select className="field" value={request} onChange={(event) => setRequest(event.target.value)}>
                {[
                  'move one household task until Thursday',
                  'keep Wednesday evening quiet',
                  'share the grocery planning this week',
                  'have ten minutes to talk after dinner',
                ].map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-3 rounded-control border border-royal/25 bg-royal/[0.04] p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Your message</p>
            <p className="mt-1 text-[13px] leading-relaxed text-ink">“{message}”</p>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            <Button size="sm" onClick={shareSummary} disabled={!sharing.conversation}>
              <Send aria-hidden="true" className="h-3.5 w-3.5" />
              Share with family
            </Button>
            <Button size="sm" variant="ghost" onClick={() => copy(message)}>
              <Copy aria-hidden="true" className="h-3.5 w-3.5" />
              Copy
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                addPlanActions([
                  {
                    id: `student-talk-${Date.now()}`,
                    day: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
                    title: 'Ten-minute conversation about support',
                    detail: message,
                    why: 'A prepared sentence lowers the cost of starting a difficult conversation.',
                    minutes: 10,
                    participants: student ? [student.id] : [],
                    category: 'connection',
                    status: 'open',
                    source: 'custom',
                  },
                ]);
                pushToast('A conversation was added to the family plan.');
              }}
            >
              Add to plan
            </Button>
          </div>
          {!sharing.conversation ? (
            <p className="mt-2 text-[11px] text-muted">
              Sharing is switched off below. Your message stays on this screen.
            </p>
          ) : null}
          {shared ? (
            <p className="mt-2 rounded-control bg-success/[0.07] px-3 py-2 text-[11.5px] leading-relaxed text-[#1f6f4a]">
              Shared as a summary. Exact mood notes and this conversation remain private.
            </p>
          ) : null}
        </section>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className="card p-5">
          <h2 className="font-display text-base font-semibold text-ink">Sharing controls</h2>
          <p className="mt-1 text-[12px] text-muted">Change these at any time. Nothing is shared by default beyond what you choose.</p>
          <ul className="mt-3 space-y-2">
            {[
              { key: 'workload' as const, label: 'Share workload summary with the household', detail: 'Hours and load level only.' },
              { key: 'studyBlocks' as const, label: 'Share protected study blocks', detail: 'Times are visible, so the family can avoid clashes.' },
              { key: 'conversation' as const, label: 'Allow sharing a prepared support message', detail: 'Only the message you build here.' },
            ].map((item) => (
              <li key={item.key} className="flex items-start justify-between gap-3 rounded-control border border-border px-3 py-2.5">
                <span className="min-w-0">
                  <span className="block text-[12.5px] font-medium text-ink">{item.label}</span>
                  <span className="text-[11px] text-muted">{item.detail}</span>
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={sharing[item.key]}
                  aria-label={item.label}
                  onClick={() => setSharing((current) => ({ ...current, [item.key]: !current[item.key] }))}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition ${sharing[item.key] ? 'bg-royal' : 'bg-border'}`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      sharing[item.key] ? 'translate-x-[22px]' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </li>
            ))}
            <li className="flex items-start justify-between gap-3 rounded-control border border-border bg-canvas/60 px-3 py-2.5">
              <span className="min-w-0">
                <span className="flex items-center gap-1.5 text-[12.5px] font-medium text-ink">
                  <Lock aria-hidden="true" className="h-3 w-3 text-royal" /> Private mood notes
                </span>
                <span className="text-[11px] text-muted">Locked private. These never enter a household summary.</span>
              </span>
              <span className="shrink-0 rounded-full bg-royal/[0.08] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-royal">
                Always private
              </span>
            </li>
          </ul>
        </section>

        <div className="space-y-4">
          <section className="card p-5">
            <h2 className="flex items-center gap-2 font-display text-base font-semibold text-ink">
              <GraduationCap aria-hidden="true" className="h-4 w-4 text-royal" />
              Suggested parent conversation
            </h2>
            <p className="mt-1 text-[12px] text-muted">A neutral way to open the topic, written for you to adapt.</p>
            <p className="mt-3 rounded-control border border-border bg-canvas/60 p-3 text-[13px] leading-relaxed text-ink">
              “I have two assessments close together. I am not asking to skip anything — I would like us to look at
              Wednesday together, and move one task if we can.”
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <button type="button" onClick={() => copy('I have two assessments close together. I am not asking to skip anything — I would like us to look at Wednesday together, and move one task if we can.')} className="btn-ghost btn-sm">
                <Copy aria-hidden="true" className="h-3 w-3" />
                Copy suggestion
              </button>
              <button
                type="button"
                onClick={() => {
                  addPlanActions([
                    {
                      id: `student-convo-${Date.now()}`,
                      day: 'Wednesday',
                      title: 'Parent conversation about Wednesday',
                      detail: 'Use the prepared neutral opener, and agree one change together.',
                      why: 'A prepared opener keeps the conversation about the week, not about blame.',
                      minutes: 10,
                      participants: student ? [student.id] : [],
                      category: 'connection',
                      status: 'open',
                      source: 'custom',
                    },
                  ]);
                  pushToast('Conversation added to the family plan.');
                }}
                className="btn-quiet btn-sm"
              >
                Add to plan
              </button>
            </div>
          </section>

          <ExplainabilityPanel
            title="Why this support is suggested"
            factors={[
              { label: 'Assessment', value: 'Student pressure high' },
              { label: 'Wednesday', value: 'Assessment, study block, kitchen task' },
              { label: 'Rest', value: 'Inconsistent this week' },
              { label: 'Control', value: 'Student chooses what to share' },
            ]}
            logic="When assessment pressure overlaps a household task on the same evening, the engine proposes removing the task and protecting a study block rather than adding more study time. Recovery is scheduled after the block ends."
            action="Protect 17:00–19:00 for revision, move the kitchen task, and keep 21:00 onward quiet."
            control="Only the student can share the workload summary or the support message. Mood notes are never included."
            alternative="Keep the task and shorten the study block to 45 minutes, if the student prefers."
          />
        </div>
      </div>

      <p className="mt-4 flex items-start gap-2 text-[11px] leading-relaxed text-muted">
        <ShieldCheck aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-royal" />
        FamilyMind AI is not a clinical tool and does not monitor emergencies. If pressure feels unmanageable, speak to
        a trusted adult or a qualified professional.
      </p>
    </div>
  );
}
