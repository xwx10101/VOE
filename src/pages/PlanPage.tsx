import { useMemo, useState } from 'react';
import {
  CalendarRange,
  Check,
  ChevronDown,
  Clock,
  PencilLine,
  Printer,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Users,
  Wand2,
} from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { EmptyState } from '@/components/shared/Feedback';
import { ExplainabilityPanel } from '@/components/shared/Explainability';
import { Modal } from '@/components/shared/Modal';
import { DAYS } from '@/lib/recommendations';
import { useFamily } from '@/state/FamilyContext';
import type { PlanAction } from '@/types';

const CATEGORY_TONE: Record<string, string> = {
  connection: 'bg-insight/10 text-[#0f5f84]',
  balance: 'bg-violet/10 text-[#5b2a86]',
  student: 'bg-gold/15 text-[#7a4d00]',
  care: 'bg-teal/15 text-[#0d5c4b]',
  rest: 'bg-royal/10 text-royal',
};

export default function PlanPage() {
  const {
    plan,
    profile,
    result,
    togglePlanAction,
    updatePlanAction,
    regeneratePlanAction,
    applyReduceWorkload,
    generatePlan,
    resetPlan,
    pushToast,
    memberById,
  } = useFamily();

  const [editing, setEditing] = useState<PlanAction | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [reduced, setReduced] = useState(false);

  const byDay = useMemo(
    () =>
      DAYS.map((day) => ({
        day,
        actions: plan.actions.filter((action) => action.day === day),
      })),
    [plan.actions],
  );

  const completed = plan.actions.filter((action) => action.status === 'done').length;
  const totalMinutes = plan.actions.reduce((total, action) => total + action.minutes, 0);

  const save = () => {
    pushToast('Plan saved locally on this device.');
  };

  return (
    <div className="mx-auto max-w-[1100px]">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Weekly family plan</p>
          <h1 className="mt-2 font-display text-[clamp(1.6rem,3vw,2.2rem)] font-semibold leading-tight text-ink">
            Seven days, sized to the household
          </h1>
          <p className="mt-1.5 max-w-[64ch] text-sm leading-relaxed text-muted">
            At most two wellbeing actions a day. Every action carries a reason, participants, and an estimated
            duration — and nothing is applied without the family’s confirmation.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 no-print">
          <Button
            size="sm"
            onClick={() => {
              generatePlan();
              pushToast('New plan generated from the current signals.');
            }}
          >
            <Sparkles aria-hidden="true" className="h-3.5 w-3.5" />
            Generate My Weekly Plan
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              applyReduceWorkload();
              setReduced(true);
              pushToast('Reduced workload: one action per day, capped at the daily limit.');
            }}
          >
            <Wand2 aria-hidden="true" className="h-3.5 w-3.5" />
            Reduce Workload
          </Button>
          <Button variant="ghost" size="sm" onClick={() => window.print()}>
            <Printer aria-hidden="true" className="h-3.5 w-3.5" />
            Print view
          </Button>
        </div>
      </header>

      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        {[
          { label: 'Actions this week', value: `${plan.actions.length}` },
          { label: 'Completed', value: `${completed}/${plan.actions.length}` },
          { label: 'Total planned time', value: `${totalMinutes} min` },
          { label: 'Daily limit', value: `${plan.maxDailyMinutes} min` },
        ].map((metric) => (
          <div key={metric.label} className="rounded-control border border-border bg-white p-3.5">
            <p className="stat-label">{metric.label}</p>
            <p className="mt-1 font-display text-xl font-semibold text-ink">{metric.value}</p>
          </div>
        ))}
      </div>

      {reduced ? (
        <p className="mt-3 rounded-control border border-insight/30 bg-insight/[0.06] px-3.5 py-2.5 text-[12px] text-ink/80">
          Reduced workload mode is on: one action per day, and no action longer than the household’s daily limit.
          Nothing else was removed.
        </p>
      ) : null}

      {plan.actions.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="No plan yet"
            copy="Generate a plan from the household signals, or load the Al Noor sample plan."
            icon={<CalendarRange aria-hidden="true" className="h-5 w-5" />}
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Button size="sm" onClick={() => generatePlan()}>Generate My Weekly Plan</Button>
                <Button size="sm" variant="ghost" onClick={() => resetPlan()}>Reset sample plan</Button>
              </div>
            }
          />
        </div>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {byDay.map(({ day, actions }) => (
            <section key={day} className="card p-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-[13px] font-semibold uppercase tracking-[0.12em] text-ink">{day}</h2>
                <span className="text-[11px] text-muted">{actions.length} action{actions.length === 1 ? '' : 's'}</span>
              </div>
              {actions.length === 0 ? (
                <p className="mt-3 rounded-control border border-dashed border-border px-3 py-3 text-[12px] text-muted">
                  Open space. Nothing needs to be added here.
                </p>
              ) : (
                <ul className="mt-2.5 space-y-2.5">
                  {actions.map((action) => {
                    const isDone = action.status === 'done';
                    return (
                      <li key={action.id} className={`rounded-control border p-3 transition ${isDone ? 'border-success/30 bg-success/[0.04]' : 'border-border'}`}>
                        <div className="flex items-start gap-2.5">
                          <button
                            type="button"
                            aria-pressed={isDone}
                            onClick={() => togglePlanAction(action.id)}
                            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition ${
                              isDone ? 'border-success bg-success text-white' : 'border-border text-transparent hover:border-royal'
                            }`}
                          >
                            <Check aria-hidden="true" className="h-3 w-3" />
                            <span className="sr-only">
                              Mark “{action.title}” {isDone ? 'incomplete' : 'complete'}
                            </span>
                          </button>
                          <div className="min-w-0 flex-1">
                            <p className={`text-[13px] font-semibold leading-snug ${isDone ? 'text-muted line-through' : 'text-ink'}`}>
                              {action.title}
                            </p>
                            <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10.5px] text-muted">
                              <span className="inline-flex items-center gap-1">
                                <Clock aria-hidden="true" className="h-3 w-3" />
                                {action.minutes} min
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <Users aria-hidden="true" className="h-3 w-3" />
                                {action.participants.length
                                  ? action.participants.map((id) => memberById(id)?.name.split(' ')[0] ?? 'Member').join(', ')
                                  : 'Household'}
                              </span>
                              <span className={`rounded-full px-1.5 py-0.5 font-semibold ${CATEGORY_TONE[action.category] ?? 'bg-canvas text-muted'}`}>
                                {action.category}
                              </span>
                            </div>
                            <p className="mt-1.5 text-[12px] leading-relaxed text-muted">{action.detail}</p>

                            <button
                              type="button"
                              aria-expanded={expanded === action.id}
                              onClick={() => setExpanded(expanded === action.id ? null : action.id)}
                              className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-royal"
                            >
                              Why this action?
                              <ChevronDown
                                aria-hidden="true"
                                className={`h-3 w-3 transition-transform ${expanded === action.id ? 'rotate-180' : ''}`}
                              />
                            </button>
                            {expanded === action.id ? (
                              <p className="mt-1 rounded-control bg-canvas px-2.5 py-2 text-[11.5px] leading-relaxed text-muted">
                                {action.why}
                              </p>
                            ) : null}

                            <div className="mt-2 flex flex-wrap gap-1.5 no-print">
                              <button type="button" onClick={() => setEditing(action)} className="btn-ghost btn-sm">
                                <PencilLine aria-hidden="true" className="h-3 w-3" />
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  regeneratePlanAction(action.id);
                                  pushToast('Action replaced with an alternative for the same day.', 'info');
                                }}
                                className="btn-quiet btn-sm"
                              >
                                <RefreshCw aria-hidden="true" className="h-3 w-3" />
                                Replace
                              </button>
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}

      <div className="mt-4 space-y-3">
        <ExplainabilityPanel
          title="Why this plan?"
          defaultOpen
          factors={[
            { label: 'Assessment', value: result ? `${result.score} · ${result.statusLabel}` : 'Demo signals' },
            {
              label: 'Priorities',
              value: plan.priorities.length ? plan.priorities.join(', ') : 'Household signals',
            },
            { label: 'Daily limit', value: `${plan.maxDailyMinutes} minutes` },
            { label: 'Household size', value: `${profile.members.length} members` },
          ]}
          logic="The plan is assembled from the assessment result and the household’s stated priorities. Actions are matched to the weakest categories, spread across the week so no day carries more than two actions, and capped by the household’s daily time limit. Removing a competing task is preferred over adding a new activity."
          action="Seven actions across Monday to Sunday, editable and removable at any point."
          control="Any member can edit, replace, complete, or delete an action. Nothing is scheduled on another member’s behalf without a confirmation step."
          alternative="Use Reduce Workload to keep only one action per day, or start from the single Highest-priority action."
        />

        <div className="flex flex-col gap-2 rounded-control border border-border bg-white p-4 sm:flex-row sm:items-center sm:justify-between no-print">
          <p className="text-[12px] leading-relaxed text-muted">
            Changes are stored in this browser. The plan is a prototype artefact, not a clinical prescription.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" size="sm" onClick={save}>
              Save locally
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                resetPlan();
                setReduced(false);
                pushToast('Al Noor sample plan restored.');
              }}
            >
              <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" />
              Reset sample plan
            </Button>
          </div>
        </div>
      </div>

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title="Edit this action"
        description="Keep it small enough to actually happen."
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (!editing) return;
                updatePlanAction(editing.id, {
                  title: editing.title,
                  detail: editing.detail,
                  minutes: editing.minutes,
                  day: editing.day,
                  participants: editing.participants,
                });
                pushToast('Action updated.');
                setEditing(null);
              }}
            >
              Save changes
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
            <label className="block">
              <span className="field-label">What happens</span>
              <textarea
                className="field min-h-[80px]"
                value={editing.detail}
                maxLength={280}
                onChange={(event) => setEditing({ ...editing, detail: event.target.value })}
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="field-label">Day</span>
                <select
                  className="field"
                  value={editing.day}
                  onChange={(event) => setEditing({ ...editing, day: event.target.value })}
                >
                  {DAYS.map((day) => (
                    <option key={day}>{day}</option>
                  ))}
                </select>
              </label>
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
            </div>
            <fieldset>
              <legend className="field-label">Participants</legend>
              <div className="flex flex-wrap gap-1.5">
                {profile.members.map((member) => {
                  const active = editing.participants.includes(member.id);
                  return (
                    <button
                      key={member.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() =>
                        setEditing({
                          ...editing,
                          participants: active
                            ? editing.participants.filter((id) => id !== member.id)
                            : [...editing.participants, member.id],
                        })
                      }
                      className="chip"
                    >
                      {active ? <Check aria-hidden="true" className="h-3 w-3" /> : null}
                      {member.name.split(' ')[0]}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
