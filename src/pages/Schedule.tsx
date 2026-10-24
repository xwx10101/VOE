import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CalendarPlus,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  PencilLine,
  Sparkles,
  Trash2,
  Undo2,
  Users,
  Wand2,
  X,
} from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { EmptyState } from '@/components/shared/Feedback';
import { StackedBars } from '@/components/shared/Charts';
import { Modal } from '@/components/shared/Modal';
import { DAYS } from '@/lib/recommendations';
import {
  applyProposals,
  buildProposals,
  detectConflicts,
  loadForMember,
  minutesToTime,
  responsibilityBalance,
  timeToMinutes,
} from '@/lib/scheduleOptimizer';
import { EVENT_CATEGORY_LABELS } from '@/data/questions';
import { useFamily } from '@/state/FamilyContext';
import type { EventCategory, ScheduleEvent } from '@/types';

const CATEGORIES: EventCategory[] = ['work', 'school', 'study', 'household', 'family', 'rest', 'care', 'health'];

const CATEGORY_STYLE: Record<EventCategory, { borderColor: string; background: string }> = {
  work: { borderColor: '#123C69', background: 'rgba(18,60,105,0.05)' },
  school: { borderColor: '#29BEFD', background: 'rgba(41,190,253,0.07)' },
  study: { borderColor: '#FFB000', background: 'rgba(255,176,0,0.09)' },
  household: { borderColor: '#A259EA', background: 'rgba(162,89,234,0.08)' },
  family: { borderColor: '#47E6C1', background: 'rgba(71,230,193,0.12)' },
  rest: { borderColor: '#5B6472', background: 'rgba(91,100,114,0.07)' },
  care: { borderColor: '#C93645', background: 'rgba(201,54,69,0.06)' },
  health: { borderColor: '#2E9D68', background: 'rgba(46,157,104,0.07)' },
};

const emptyDraft = (day: string): Omit<ScheduleEvent, 'id'> => ({
  title: '',
  day,
  start: '17:00',
  end: '17:30',
  category: 'family',
  ownerId: '',
});

export default function Schedule() {
  const {
    schedule,
    profile,
    addEvent,
    updateEvent,
    deleteEvent,
    commitOptimization,
    undoOptimization,
    undoSnapshot,
    pushToast,
  } = useFamily();

  const [view, setView] = useState<'week' | 'day'>('week');
  const [activeDay, setActiveDay] = useState('Wednesday');
  const [filters, setFilters] = useState<EventCategory[]>([]);
  const [editor, setEditor] = useState<{ mode: 'create' | 'edit'; event: ScheduleEvent } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ScheduleEvent | null>(null);
  const [optimizing, setOptimizing] = useState(false);
  const [selectedProposals, setSelectedProposals] = useState<string[]>([]);
  const [error, setError] = useState('');

  const visibleEvents = useMemo(
    () => (filters.length ? schedule.filter((event) => filters.includes(event.category)) : schedule),
    [schedule, filters],
  );

  const conflicts = useMemo(() => detectConflicts(schedule), [schedule]);
  const proposals = useMemo(() => buildProposals(schedule, profile.members), [schedule, profile.members]);
  const balance = useMemo(() => responsibilityBalance(schedule, profile.members), [schedule, profile.members]);

  const proposedEvents = useMemo(
    () => applyProposals(schedule, proposals, selectedProposals).events,
    [schedule, proposals, selectedProposals],
  );
  const proposedBalance = useMemo(
    () => responsibilityBalance(proposedEvents, profile.members),
    [proposedEvents, profile.members],
  );

  const dayEvents = (day: string) =>
    visibleEvents
      .filter((event) => event.day === day)
      .sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));

  const toggleFilter = (category: EventCategory) => {
    setFilters((current) =>
      current.includes(category) ? current.filter((item) => item !== category) : [...current, category],
    );
  };

  const openCreate = (day: string) => {
    const owner = profile.members[0]?.id ?? '';
    setError('');
    setEditor({ mode: 'create', event: { ...emptyDraft(day), id: 'new', ownerId: owner } });
  };

  const saveEvent = () => {
    if (!editor) return;
    const event = editor.event;
    if (event.title.trim().length < 2) {
      setError('Give the event a short title so others understand it.');
      return;
    }
    if (!event.ownerId) {
      setError('Assign one member as the owner. Shared ownership is a discussion, not a default.');
      return;
    }
    if (timeToMinutes(event.end) <= timeToMinutes(event.start)) {
      setError('The end time must be after the start time.');
      return;
    }
    if (editor.mode === 'create') {
      addEvent({ ...event, title: event.title.trim() });
      pushToast('Event added to the schedule.');
    } else {
      updateEvent(event.id, { ...event, title: event.title.trim() });
      pushToast('Event updated.');
    }
    setEditor(null);
    setError('');
  };

  const studentLoad = profile.members
    .map((member) => ({ member, loads: loadForMember(schedule, member.id) }))
    .map((entry) => ({
      ...entry,
      busiest: [...entry.loads].sort((a, b) => b.minutes - a.minutes)[0],
    }));

  return (
    <div className="mx-auto max-w-[1180px]">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Smart schedule</p>
          <h1 className="mt-2 font-display text-[clamp(1.6rem,3vw,2.2rem)] font-semibold leading-tight text-ink">
            Balance time and responsibility
          </h1>
          <p className="mt-1.5 max-w-[64ch] text-sm leading-relaxed text-muted">
            The schedule is the household’s shared calendar. Optimisation proposes changes — it never applies them
            without a family confirmation.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => openCreate(activeDay)}>
            <CalendarPlus aria-hidden="true" className="h-3.5 w-3.5" />
            Add event
          </Button>
          <Button
            size="sm"
            variant={optimizing ? 'ghost' : 'signal'}
            onClick={() => {
              setOptimizing(true);
              setSelectedProposals(proposals.map((proposal) => proposal.id));
            }}
          >
            <Wand2 aria-hidden="true" className="h-3.5 w-3.5" />
            AI Optimise
          </Button>
        </div>
      </header>

      <div className="mt-4 flex flex-col gap-3 rounded-control border border-border bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1 rounded-full border border-border p-1" role="group" aria-label="Schedule view">
          {(['week', 'day'] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={view === option}
              onClick={() => setView(option)}
              className={`rounded-full px-3.5 py-1.5 text-[12px] font-semibold capitalize transition ${
                view === option ? 'bg-ink text-white' : 'text-muted hover:text-ink'
              }`}
            >
              {option} view
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">Filter</span>
          {CATEGORIES.map((category) => (
            <button
              key={category}
              type="button"
              aria-pressed={filters.includes(category)}
              onClick={() => toggleFilter(category)}
              className="chip !min-h-[30px] !px-2.5 !py-1 !text-[11px]"
            >
              {EVENT_CATEGORY_LABELS[category]}
            </button>
          ))}
          {filters.length ? (
            <button type="button" onClick={() => setFilters([])} className="text-[11px] font-semibold text-royal">
              Clear
            </button>
          ) : null}
        </div>
      </div>

      {conflicts.length ? (
        <div className="mt-3 rounded-control border border-warning/30 bg-warning/[0.07] p-3.5">
          <p className="flex items-center gap-2 text-[12.5px] font-semibold text-ink">
            <AlertTriangle aria-hidden="true" className="h-4 w-4 text-warning" />
            {conflicts.length} scheduling conflict{conflicts.length === 1 ? '' : 's'} detected
          </p>
          <ul className="mt-1.5 space-y-1 text-[12px] text-muted">
            {conflicts.slice(0, 3).map((conflict) => (
              <li key={`${conflict.day}-${conflict.first.id}-${conflict.second.id}`}>
                {conflict.day}: “{conflict.first.title}” overlaps “{conflict.second.title}” for{' '}
                {profile.members.find((member) => member.id === conflict.memberId)?.name.split(' ')[0] ?? 'a member'}.
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {view === 'week' ? (
        <div className="mt-4 overflow-x-auto">
          <div className="grid min-w-[900px] grid-cols-7 gap-2">
            {DAYS.map((day) => {
              const events = dayEvents(day);
              return (
                <section key={day} className="rounded-control border border-border bg-white p-2.5">
                  <div className="flex items-center justify-between px-0.5">
                    <h2 className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-ink">{day.slice(0, 3)}</h2>
                    <span className="text-[10.5px] text-muted">{events.length}</span>
                  </div>
                  <ul className="mt-2 space-y-1.5">
                    {events.map((event) => {
                      const owner = profile.members.find((member) => member.id === event.ownerId);
                      return (
                        <li key={event.id}>
                          <button
                            type="button"
                            onClick={() => {
                              setError('');
                              setEditor({ mode: 'edit', event: { ...event } });
                            }}
                            className={`w-full rounded-md border border-border px-2 py-1.5 text-left transition hover:shadow-soft ${
                              event.completed ? 'opacity-60' : ''
                            }`}
                            style={{
                              borderLeftWidth: 3,
                              borderLeftColor: CATEGORY_STYLE[event.category].borderColor,
                              backgroundColor: CATEGORY_STYLE[event.category].background,
                            }}
                          >
                            <p className={`text-[10.5px] font-semibold leading-tight text-ink ${event.completed ? 'line-through' : ''}`}>
                              {event.title}
                            </p>
                            <p className="mt-0.5 flex items-center gap-1 text-[10.5px] text-muted">
                              <Clock aria-hidden="true" className="h-2.5 w-2.5" />
                              {event.start}–{event.end}
                            </p>
                            <p className="mt-0.5 truncate text-[10.5px] text-muted">
                              {owner?.name.split(' ')[0] ?? 'Unassigned'}
                              {event.backupId
                                ? ` · backup ${profile.members.find((member) => member.id === event.backupId)?.name.split(' ')[0]}`
                                : ''}
                            </p>
                          </button>
                        </li>
                      );
                    })}
                    {events.length === 0 ? (
                      <li className="rounded-md border border-dashed border-border px-2 py-3 text-center text-[10px] text-muted">
                        Open
                      </li>
                    ) : null}
                  </ul>
                  <button
                    type="button"
                    onClick={() => openCreate(day)}
                    className="mt-2 w-full rounded-md border border-dashed border-border py-1 text-[10px] font-semibold text-muted transition hover:border-royal/40 hover:text-royal"
                  >
                    + Add
                  </button>
                </section>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="mt-4">
          <div className="flex items-center justify-between rounded-control border border-border bg-white px-3 py-2">
            <button
              type="button"
              onClick={() => setActiveDay(DAYS[Math.max(0, DAYS.indexOf(activeDay) - 1)])}
              className="btn-quiet btn-sm"
              disabled={activeDay === 'Monday'}
            >
              <ChevronLeft aria-hidden="true" className="h-3.5 w-3.5" />
              Previous
            </button>
            <p className="font-display text-sm font-semibold text-ink">{activeDay}</p>
            <button
              type="button"
              onClick={() => setActiveDay(DAYS[Math.min(6, DAYS.indexOf(activeDay) + 1)])}
              className="btn-quiet btn-sm"
              disabled={activeDay === 'Sunday'}
            >
              Next
              <ChevronRight aria-hidden="true" className="h-3.5 w-3.5" />
            </button>
          </div>

          <ul className="mt-3 space-y-2">
            {dayEvents(activeDay).map((event) => {
              const owner = profile.members.find((member) => member.id === event.ownerId);
              return (
                <li key={event.id} className={`card flex flex-col gap-2 p-3.5 sm:flex-row sm:items-center ${event.completed ? 'opacity-70' : ''}`}>
                  <div className="flex w-full items-start gap-3 sm:w-auto sm:flex-1">
                    <div className="w-[92px] shrink-0">
                      <p className="text-[12px] font-semibold tabular-nums text-ink">
                        {event.start}–{event.end}
                      </p>
                      <p className="text-[10px] text-muted">{EVENT_CATEGORY_LABELS[event.category]}</p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-[13.5px] font-semibold text-ink ${event.completed ? 'line-through' : ''}`}>
                        {event.title}
                      </p>
                      <p className="mt-0.5 text-[11.5px] text-muted">
                        {owner?.name ?? 'Unassigned'}
                        {event.backupId
                          ? ` · backup: ${profile.members.find((member) => member.id === event.backupId)?.name}`
                          : ''}
                        {event.locked ? ' · fixed commitment' : ''}
                      </p>
                      {event.note ? <p className="mt-1 text-[11.5px] leading-relaxed text-muted">{event.note}</p> : null}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        updateEvent(event.id, { completed: !event.completed });
                        pushToast(event.completed ? 'Event reopened.' : 'Event marked complete.');
                      }}
                      className="btn-ghost btn-sm"
                      aria-pressed={Boolean(event.completed)}
                    >
                      <Check aria-hidden="true" className="h-3 w-3" />
                      {event.completed ? 'Completed' : 'Complete'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setError('');
                        setEditor({ mode: 'edit', event: { ...event } });
                      }}
                      className="btn-ghost btn-sm"
                    >
                      <PencilLine aria-hidden="true" className="h-3 w-3" />
                      Edit
                    </button>
                    <button type="button" onClick={() => setConfirmDelete(event)} className="btn-danger btn-sm">
                      <Trash2 aria-hidden="true" className="h-3 w-3" />
                      Delete
                    </button>
                  </div>
                </li>
              );
            })}
            {dayEvents(activeDay).length === 0 ? (
              <li>
                <EmptyState
                  title={`Nothing scheduled on ${activeDay}`}
                  copy="Open space is useful. Add only what the household has agreed to."
                  icon={<Clock aria-hidden="true" className="h-5 w-5" />}
                  action={<Button size="sm" variant="ghost" onClick={() => openCreate(activeDay)}>Add an event</Button>}
                />
              </li>
            ) : null}
          </ul>
        </div>
      )}

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className="card p-5">
          <h2 className="font-display text-base font-semibold text-ink">Responsibility distribution</h2>
          <p className="mt-1 text-[12px] text-muted">
            Based on scheduled household, care, and health tasks. Planning work is separated.
          </p>
          <div className="mt-4">
            <StackedBars
              rows={balance.map((row) => ({
                memberId: row.memberId,
                visible: Math.round(row.visibleMinutes / 15),
                planning: Math.round(row.planningMinutes / 15),
              }))}
              members={profile.members}
            />
          </div>
          <p className="mt-3 text-[11.5px] leading-relaxed text-muted">
            Shares: {balance.map((row) => `${profile.members.find((m) => m.id === row.memberId)?.name.split(' ')[0]} ${row.share}%`).join(' · ')}
          </p>
        </section>

        <section className="card p-5">
          <h2 className="font-display text-base font-semibold text-ink">Overload indicators</h2>
          <p className="mt-1 text-[12px] text-muted">The densest day for each member, from the shared schedule.</p>
          <ul className="mt-3 space-y-2">
            {studentLoad.map(({ member, busiest }) => {
              const tone =
                busiest.status === 'overloaded'
                  ? 'text-danger bg-danger/[0.07] border-danger/25'
                  : busiest.status === 'busy'
                    ? 'text-[#7a4d00] bg-warning/[0.07] border-warning/25'
                    : 'text-muted bg-canvas border-border';
              return (
                <li key={member.id} className={`flex items-center justify-between gap-3 rounded-control border px-3 py-2 ${tone}`}>
                  <span className="text-[12.5px] font-medium text-ink">{member.name.split(' ')[0]}</span>
                  <span className="text-[11.5px]">
                    {busiest.day} · {Math.round(busiest.minutes / 60)}h {busiest.minutes % 60 ? `${busiest.minutes % 60}m` : ''} ·{' '}
                    {busiest.status}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      {optimizing ? (
        <section className="card mt-4 overflow-hidden" aria-label="Schedule optimisation proposals">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-3.5">
            <div>
              <h2 className="font-display text-base font-semibold text-ink">Proposed changes</h2>
              <p className="text-[12px] text-muted">
                Review each proposal. Nothing changes until you apply the selected items.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOptimizing(false)}
              className="btn btn-sm border border-border text-muted"
            >
              <X aria-hidden="true" className="h-3.5 w-3.5" />
              Close
            </button>
          </div>

          <div className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div>
              <ul className="space-y-2.5">
                {proposals.map((proposal) => {
                  const checked = selectedProposals.includes(proposal.id);
                  return (
                    <li
                      key={proposal.id}
                      className={`rounded-control border p-3.5 transition ${checked ? 'border-royal/40 bg-royal/[0.04]' : 'border-border'}`}
                    >
                      <label className="flex items-start gap-3">
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
                        <span className="min-w-0">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="text-[13px] font-semibold text-ink">{proposal.title}</span>
                            <span className="rounded-full bg-canvas px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
                              {proposal.kind.replace('-', ' ')}
                            </span>
                          </span>
                          <span className="mt-1 block text-[12px] leading-relaxed text-muted">{proposal.reason}</span>
                          {proposal.from && proposal.to ? (
                            <span className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-muted">
                              <span className="rounded bg-canvas px-1.5 py-0.5">
                                {proposal.from.day} {proposal.from.start}
                              </span>
                              <ArrowRight aria-hidden="true" className="h-3 w-3" />
                              <span className="rounded bg-teal/15 px-1.5 py-0.5 font-semibold text-[#0d5c4b]">
                                {proposal.to.day} {proposal.to.start}
                              </span>
                            </span>
                          ) : null}
                          {proposal.newEvent ? (
                            <span className="mt-1.5 inline-block rounded bg-teal/15 px-1.5 py-0.5 text-[11px] font-semibold text-[#0d5c4b]">
                              New: {proposal.newEvent.day} {proposal.newEvent.start}–{proposal.newEvent.end} ·{' '}
                              {proposal.newEvent.title}
                            </span>
                          ) : null}
                        </span>
                      </label>
                    </li>
                  );
                })}
                {proposals.length === 0 ? (
                  <li className="rounded-control border border-dashed border-border px-4 py-6 text-center text-[12px] text-muted">
                    No improvement is needed from the current schedule. The engine will not invent changes.
                  </li>
                ) : null}
              </ul>
            </div>

            <div className="space-y-3">
              <div className="rounded-control border border-border bg-canvas/60 p-3.5">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted">Before</p>
                <ul className="mt-1.5 space-y-1 text-[11.5px] text-ink/80">
                  {balance.map((row) => (
                    <li key={row.memberId} className="flex justify-between gap-2">
                      <span>{profile.members.find((m) => m.id === row.memberId)?.name.split(' ')[0]}</span>
                      <span className="tabular-nums">{row.share}%</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-control border border-teal/30 bg-teal/[0.06] p-3.5">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#0d5c4b]">
                  After selected changes
                </p>
                <ul className="mt-1.5 space-y-1 text-[11.5px] text-ink/80">
                  {proposedBalance.map((row) => (
                    <li key={row.memberId} className="flex justify-between gap-2">
                      <span>{profile.members.find((m) => m.id === row.memberId)?.name.split(' ')[0]}</span>
                      <span className="tabular-nums">{row.share}%</span>
                    </li>
                  ))}
                </ul>
              </div>
              <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-muted">
                <Users aria-hidden="true" className="mt-0.5 h-3 w-3 shrink-0" />
                {selectedProposals.length} of {proposals.length} proposals selected.
              </p>
              <Button
                size="sm"
                className="w-full"
                disabled={selectedProposals.length === 0}
                onClick={() => {
                  const result = applyProposals(schedule, proposals, selectedProposals);
                  commitOptimization(result.events);
                  pushToast(`Applied ${selectedProposals.length} selected change${selectedProposals.length === 1 ? '' : 's'}. Undo is available.`);
                  setSelectedProposals([]);
                  setOptimizing(false);
                }}
              >
                <Sparkles aria-hidden="true" className="h-3.5 w-3.5" />
                Apply {selectedProposals.length || 0} selected change{selectedProposals.length === 1 ? '' : 's'}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setSelectedProposals([]);
                  setOptimizing(false);
                  pushToast('Proposals rejected. The schedule is unchanged.', 'info');
                }}
              >
                Reject all
              </Button>
              {undoSnapshot ? (
                <Button
                  size="sm"
                  variant="quiet"
                  className="w-full"
                  onClick={() => {
                    undoOptimization();
                    pushToast('Schedule restored to the previous state.', 'info');
                  }}
                >
                  <Undo2 aria-hidden="true" className="h-3.5 w-3.5" />
                  Undo last change
                </Button>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {!optimizing && undoSnapshot ? (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-control border border-border bg-white px-4 py-3">
          <p className="text-[12px] text-muted">A schedule change was applied recently.</p>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              undoOptimization();
              pushToast('Schedule restored to the previous state.', 'info');
            }}
          >
            <Undo2 aria-hidden="true" className="h-3.5 w-3.5" />
            Undo
          </Button>
        </div>
      ) : null}

      <Modal
        open={Boolean(editor)}
        onClose={() => setEditor(null)}
        title={editor?.mode === 'create' ? 'Add a schedule event' : 'Edit schedule event'}
        description="Only the events the household has agreed to belong here."
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setEditor(null)}>
              Cancel
            </Button>
            <Button size="sm" onClick={saveEvent}>
              {editor?.mode === 'create' ? 'Add event' : 'Save changes'}
            </Button>
          </>
        }
      >
        {editor ? (
          <div className="space-y-3">
            {error ? (
              <p role="alert" className="rounded-control bg-danger/[0.06] px-3 py-2 text-[12px] text-danger">
                {error}
              </p>
            ) : null}
            <label className="block">
              <span className="field-label">Event title</span>
              <input
                className="field"
                value={editor.event.title}
                maxLength={70}
                onChange={(event) => setEditor({ ...editor, event: { ...editor.event, title: event.target.value } })}
                placeholder="For example: chemistry revision"
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="block">
                <span className="field-label">Day</span>
                <select
                  className="field"
                  value={editor.event.day}
                  onChange={(event) => setEditor({ ...editor, event: { ...editor.event, day: event.target.value } })}
                >
                  {DAYS.map((day) => (
                    <option key={day}>{day}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="field-label">Start</span>
                <input
                  type="time"
                  className="field"
                  value={editor.event.start}
                  onChange={(event) => setEditor({ ...editor, event: { ...editor.event, start: event.target.value } })}
                />
              </label>
              <label className="block">
                <span className="field-label">End</span>
                <input
                  type="time"
                  className="field"
                  value={editor.event.end}
                  onChange={(event) => {
                    const start = timeToMinutes(editor.event.start);
                    const end = timeToMinutes(event.target.value);
                    setEditor({
                      ...editor,
                      event: {
                        ...editor.event,
                        end: event.target.value,
                        start: end <= start ? minutesToTime(Math.max(0, end - 30)) : editor.event.start,
                      },
                    });
                  }}
                />
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="field-label">Category</span>
                <select
                  className="field"
                  value={editor.event.category}
                  onChange={(event) =>
                    setEditor({
                      ...editor,
                      event: { ...editor.event, category: event.target.value as EventCategory },
                    })
                  }
                >
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {EVENT_CATEGORY_LABELS[category]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="field-label">Owner</span>
                <select
                  className="field"
                  value={editor.event.ownerId}
                  onChange={(event) => setEditor({ ...editor, event: { ...editor.event, ownerId: event.target.value } })}
                >
                  <option value="">Choose a member</option>
                  {profile.members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="field-label">Backup (optional)</span>
                <select
                  className="field"
                  value={editor.event.backupId ?? ''}
                  onChange={(event) =>
                    setEditor({
                      ...editor,
                      event: { ...editor.event, backupId: event.target.value || undefined },
                    })
                  }
                >
                  <option value="">No backup</option>
                  {profile.members
                    .filter((member) => member.id !== editor.event.ownerId)
                    .map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                </select>
              </label>
              <label className="flex items-end gap-2 pb-2 text-[12.5px] text-ink">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-border text-royal focus:ring-insight"
                  checked={Boolean(editor.event.locked)}
                  onChange={(event) => setEditor({ ...editor, event: { ...editor.event, locked: event.target.checked } })}
                />
                Fixed commitment (not movable by optimisation)
              </label>
            </div>
            <label className="block">
              <span className="field-label">Note (optional)</span>
              <textarea
                className="field min-h-[64px]"
                maxLength={160}
                value={editor.event.note ?? ''}
                onChange={(event) => setEditor({ ...editor, event: { ...editor.event, note: event.target.value } })}
              />
            </label>
            <p className="rounded-control bg-canvas px-3 py-2 text-[11px] leading-relaxed text-muted">
              Conflicts are detected automatically. Depending on the member, overlapping events are flagged rather
              than blocked, because some overlaps are intentional.
            </p>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        title="Delete this event?"
        description="This removes the event from the shared schedule."
        size="sm"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(null)}>
              Keep event
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                if (!confirmDelete) return;
                deleteEvent(confirmDelete.id);
                pushToast('Event deleted. Undo is available on this page.', 'info');
                setConfirmDelete(null);
              }}
            >
              Delete event
            </Button>
          </>
        }
      >
        <p className="text-[13px] text-ink">
          “{confirmDelete?.title}” · {confirmDelete?.day} {confirmDelete?.start}–{confirmDelete?.end}
        </p>
      </Modal>
    </div>
  );
}
