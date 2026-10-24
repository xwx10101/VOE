import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleUserRound,
  HeartHandshake,
  Info,
  Lock,
  Plus,
  ShieldCheck,
  Trash2,
  Users,
} from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { SafetyNotice } from '@/components/shared/Feedback';
import { DEMO_PROFILE } from '@/data/demo';
import { GOALS } from '@/data/questions';
import { useFamily } from '@/state/FamilyContext';
import type { AgeGroup, FamilyMember, GoalId, HouseholdProfile, MemberRole } from '@/types';

const STEPS = ['Welcome', 'Household', 'Goals', 'Privacy', 'Preferences'] as const;

const ROLE_OPTIONS: MemberRole[] = ['Father', 'Mother', 'Student', 'Child', 'Grandmother', 'Grandfather', 'Guardian', 'Other'];
const AGE_OPTIONS: { value: AgeGroup; label: string }[] = [
  { value: 'child', label: 'Child' },
  { value: 'teen', label: 'Teenager' },
  { value: 'adult', label: 'Adult' },
  { value: 'older-adult', label: 'Older adult' },
];
const COLORS = ['#29BEFD', '#A259EA', '#47E6C1', '#FFB000', '#E63946', '#2E9D68'];
const ACTIVITIES = ['Walk', 'Shared meal', 'Short check-in', 'Story or memory', 'Board game', 'Quiet study support'];
const SHARED_TIMES = ['Weekdays after dinner', 'Friday evening', 'Saturday afternoon', 'Sunday morning'];
const ACCESSIBILITY = ['Large text for older adult', 'Reduced motion', 'High contrast', 'Screen reader friendly'];

const emptyMember = (index: number): FamilyMember => ({
  id: `member-${Date.now()}-${index}`,
  name: '',
  role: 'Other',
  ageGroup: 'adult',
  avatarColor: COLORS[index % COLORS.length],
  consent: { shareSummary: true, receivePlanActions: true, keepJournalPrivate: true },
  accessibility: [],
});

export default function Onboarding() {
  const { profile, saveProfile, pushToast } = useFamily();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<HouseholdProfile>(() => ({
    ...profile,
    members: profile.members.length ? profile.members.map((member) => ({ ...member })) : [emptyMember(0)],
  }));
  const [error, setError] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);

  const validMembers = useMemo(
    () => draft.members.filter((member) => member.name.trim().length > 1),
    [draft.members],
  );

  const updateMember = (id: string, patch: Partial<FamilyMember>) => {
    setDraft((current) => ({
      ...current,
      members: current.members.map((member) => (member.id === id ? { ...member, ...patch } : member)),
    }));
  };

  const toggleGoal = (goal: GoalId) => {
    setDraft((current) => ({
      ...current,
      goals: current.goals.includes(goal)
        ? current.goals.filter((item) => item !== goal)
        : [...current.goals, goal],
    }));
  };

  const toggleList = (key: 'preferredActivities' | 'sharedTimes' | 'accessibility', value: string) => {
    setDraft((current) => {
      const list = current.preferences[key];
      return {
        ...current,
        preferences: {
          ...current.preferences,
          [key]: list.includes(value) ? list.filter((item) => item !== value) : [...list, value],
        },
      };
    });
  };

  const loadDemo = () => {
    setDraft({
      ...DEMO_PROFILE,
      members: DEMO_PROFILE.members.map((member) => ({ ...member })),
      preferences: { ...DEMO_PROFILE.preferences },
      goals: [...DEMO_PROFILE.goals],
    });
    setAcknowledged(true);
    setError('');
    pushToast('Al Noor demo family loaded — all five members and preferences are filled in.');
  };

  const next = () => {
    if (step === 1 && validMembers.length === 0) {
      setError('Add at least one household member with a name before continuing.');
      return;
    }
    if (step === 3 && !acknowledged) {
      setError('Please confirm that you understand the privacy boundaries before continuing.');
      return;
    }
    setError('');
    setStep((current) => Math.min(STEPS.length - 1, current + 1));
  };

  const back = () => {
    setError('');
    setStep((current) => Math.max(0, current - 1));
  };

  const finish = () => {
    const cleaned: HouseholdProfile = {
      ...draft,
      members: validMembers,
      familyName: draft.familyName.trim() || 'Your family',
      isDemo: validMembers.length === DEMO_PROFILE.members.length && validMembers.every((member) => member.name.includes('Al Noor')),
    };
    saveProfile(cleaned);
    pushToast('Household saved on this device. Next: the eight-question family check-in.');
    navigate('/assessment');
  };

  return (
    <div className="bg-canvas">
      <div className="container-page max-w-5xl py-10 sm:py-14">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">Household setup</p>
            <h1 className="mt-2 font-display text-[clamp(1.7rem,3.2vw,2.4rem)] font-semibold leading-tight text-ink">
              Set up the family, with the boundaries first.
            </h1>
            <p className="mt-2 max-w-[62ch] text-sm leading-relaxed text-muted">
              Five short steps. Everything stays on this device, and the demo household can be loaded at any
              point.
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={loadDemo} className="self-start shrink-0">
            <HeartHandshake aria-hidden="true" className="h-4 w-4" />
            Use Al Noor Demo Family
          </Button>
        </div>

        <ol className="mt-7 grid grid-cols-5 gap-1.5" aria-label="Onboarding progress">
          {STEPS.map((label, index) => (
            <li key={label}>
              <div
                className={`h-1.5 rounded-full transition-colors ${
                  index <= step ? 'bg-royal' : 'bg-border'
                }`}
                aria-hidden="true"
              />
              <p className={`mt-2 truncate text-[11px] font-medium ${index === step ? 'text-ink' : 'text-muted'}`}>
                <span className="tabular-nums">{index + 1}.</span> {label}
              </p>
            </li>
          ))}
        </ol>

        <div className="card mt-6 p-5 sm:p-7">
          {error ? (
            <div role="alert" className="mb-5 rounded-control border border-danger/30 bg-danger/[0.05] px-4 py-3 text-sm text-danger">
              {error}
            </div>
          ) : null}

          {step === 0 ? (
            <div>
              <h2 className="font-display text-xl font-semibold text-ink">What FamilyMind AI is — and is not</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-control border border-teal/30 bg-teal/[0.05] p-4">
                  <p className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide text-[#0d5c4b]">
                    <Check aria-hidden="true" className="h-4 w-4" /> What it does
                  </p>
                  <ul className="mt-2 space-y-2 text-[13px] leading-relaxed text-ink/75">
                    <li>Connects consented household summaries into non-clinical patterns.</li>
                    <li>Explains every suggestion, including the signals it used.</li>
                    <li>Turns understanding into a small, editable family plan.</li>
                    <li>Keeps private entries and coach conversations private.</li>
                  </ul>
                </div>
                <div className="rounded-control border border-border bg-canvas p-4">
                  <p className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide text-muted">
                    <Info aria-hidden="true" className="h-4 w-4" /> What it does not do
                  </p>
                  <ul className="mt-2 space-y-2 text-[13px] leading-relaxed text-ink/75">
                    <li>It does not diagnose medical or mental-health conditions.</li>
                    <li>It does not monitor emergencies or call anyone automatically.</li>
                    <li>It does not replace qualified professionals.</li>
                    <li>It does not let one member see another member’s private notes.</li>
                  </ul>
                </div>
              </div>
              <div className="mt-4">
                <SafetyNotice title="The family remains in control">
                  Nothing is applied automatically. Recommendations are proposals that the family reviews,
                  edits, or rejects — and every sharing choice can be revoked.
                </SafetyNotice>
              </div>
            </div>
          ) : null}

          {step === 1 ? (
            <div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="font-display text-xl font-semibold text-ink">Who is in the household?</h2>
                  <p className="mt-1 text-sm text-muted">
                    Add the people who will take part. Consent choices are per member.
                  </p>
                </div>
                <label className="w-full sm:w-56">
                  <span className="field-label">Household name</span>
                  <input
                    className="field"
                    value={draft.familyName}
                    onChange={(event) => setDraft((current) => ({ ...current, familyName: event.target.value }))}
                    placeholder="e.g. Al Noor"
                  />
                </label>
              </div>

              <ul className="mt-4 space-y-3">
                {draft.members.map((member, index) => (
                  <li key={member.id} className="rounded-control border border-border p-3.5">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <label>
                        <span className="field-label">Name</span>
                        <input
                          className="field"
                          value={member.name}
                          onChange={(event) => updateMember(member.id, { name: event.target.value })}
                          placeholder="Member name"
                        />
                      </label>
                      <label>
                        <span className="field-label">Role</span>
                        <select
                          className="field"
                          value={member.role}
                          onChange={(event) => updateMember(member.id, { role: event.target.value as MemberRole })}
                        >
                          {ROLE_OPTIONS.map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        <span className="field-label">Age group</span>
                        <select
                          className="field"
                          value={member.ageGroup}
                          onChange={(event) => updateMember(member.id, { ageGroup: event.target.value as AgeGroup })}
                        >
                          {AGE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <div>
                        <span className="field-label">Profile colour</span>
                        <div className="flex flex-wrap gap-1.5">
                          {COLORS.map((color) => (
                            <button
                              key={color}
                              type="button"
                              aria-label={`Use colour ${color}`}
                              aria-pressed={member.avatarColor === color}
                              onClick={() => updateMember(member.id, { avatarColor: color })}
                              className={`h-8 w-8 rounded-full border-2 transition ${
                                member.avatarColor === color ? 'border-ink' : 'border-transparent'
                              }`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
                      <label className="flex items-center gap-2 text-[12.5px] text-ink">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-border text-royal focus:ring-insight"
                          checked={member.consent.shareSummary}
                          onChange={(event) =>
                            updateMember(member.id, {
                              consent: { ...member.consent, shareSummary: event.target.checked },
                            })
                          }
                        />
                        Included in consented household summaries
                      </label>
                      {draft.members.length > 1 ? (
                        <button
                          type="button"
                          onClick={() =>
                            setDraft((current) => ({
                              ...current,
                              members: current.members.filter((item) => item.id !== member.id),
                            }))
                          }
                          className="inline-flex items-center gap-1.5 text-[12px] font-medium text-danger"
                        >
                          <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
                          Remove member
                        </button>
                      ) : null}
                    </div>
                    <p className="mt-2 text-[11px] text-muted">
                      <CircleUserRound aria-hidden="true" className="mr-1 inline h-3 w-3" />
                      Adding member {index + 1}. Private journals are never included, regardless of this
                      setting.
                    </p>
                  </li>
                ))}
              </ul>

              <Button
                variant="ghost"
                size="sm"
                className="mt-3"
                onClick={() =>
                  setDraft((current) => ({ ...current, members: [...current.members, emptyMember(current.members.length)] }))
                }
              >
                <Plus aria-hidden="true" className="h-4 w-4" />
                Add another member
              </Button>
            </div>
          ) : null}

          {step === 2 ? (
            <div>
              <h2 className="font-display text-xl font-semibold text-ink">What should this week improve?</h2>
              <p className="mt-1 text-sm text-muted">
                Choose the priorities that matter most. These guide the weekly plan, and they can change later.
              </p>
              <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                {GOALS.map((goal) => {
                  const selected = draft.goals.includes(goal.id);
                  return (
                    <button
                      key={goal.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => toggleGoal(goal.id)}
                      className={`flex items-start gap-3 rounded-control border p-3.5 text-left transition ${
                        selected
                          ? 'border-royal/40 bg-royal/[0.06]'
                          : 'border-border bg-white hover:border-royal/25 hover:bg-canvas/60'
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                          selected ? 'border-royal bg-royal text-white' : 'border-border text-transparent'
                        }`}
                        aria-hidden="true"
                      >
                        <Check className="h-3 w-3" />
                      </span>
                      <span>
                        <span className="block text-[13.5px] font-semibold text-ink">{goal.label}</span>
                        <span className="mt-0.5 block text-[12px] leading-relaxed text-muted">{goal.detail}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-4 text-[12px] text-muted">
                {draft.goals.length === 0
                  ? 'No priorities selected yet — the plan will start from the household’s signals instead.'
                  : `${draft.goals.length} priorit${draft.goals.length === 1 ? 'y' : 'ies'} selected.`}
              </p>
            </div>
          ) : null}

          {step === 3 ? (
            <div>
              <h2 className="font-display text-xl font-semibold text-ink">Privacy and sharing</h2>
              <p className="mt-1 text-sm text-muted">
                These are the rules the product enforces, not settings that can be quietly changed by one member.
              </p>
              <ul className="mt-4 space-y-2.5">
                {[
                  'Private notes remain private — they never enter a household summary.',
                  'Household summaries contain only the categories each member has agreed to share.',
                  'Sharing can be revoked at any time, per member.',
                  'Prototype data can be reset or deleted from the Trust & Safety page.',
                  'No secret monitoring is permitted — nobody can track another member covertly.',
                ].map((statement) => (
                  <li key={statement} className="flex items-start gap-3 rounded-control border border-border bg-canvas/60 p-3.5">
                    <Lock aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-royal" />
                    <span className="text-[13px] leading-relaxed text-ink/80">{statement}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-5 rounded-control border border-border p-3.5">
                <p className="text-[12px] font-semibold uppercase tracking-wide text-muted">Per-member sharing</p>
                <ul className="mt-2 divide-y divide-border">
                  {draft.members
                    .filter((member) => member.name.trim())
                    .map((member) => (
                      <li key={member.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                        <span className="text-[13px] text-ink">{member.name}</span>
                        <label className="flex items-center gap-2 text-[12px] text-muted">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-border text-royal focus:ring-insight"
                            checked={member.consent.shareSummary}
                            onChange={(event) =>
                              updateMember(member.id, {
                                consent: { ...member.consent, shareSummary: event.target.checked },
                              })
                            }
                          />
                          Share summary
                        </label>
                      </li>
                    ))}
                  {draft.members.filter((member) => member.name.trim()).length === 0 ? (
                    <li className="py-2 text-[12px] text-muted">Add a member first to configure sharing.</li>
                  ) : null}
                </ul>
              </div>

              <label className="mt-4 flex items-start gap-3 rounded-control border border-border bg-white p-3.5">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border-border text-royal focus:ring-insight"
                  checked={acknowledged}
                  onChange={(event) => setAcknowledged(event.target.checked)}
                />
                <span className="text-[13px] leading-relaxed text-ink">
                  I understand that FamilyMind AI is not a medical tool, cannot monitor emergencies, and keeps
                  the family in control of every recommendation.
                </span>
              </label>
            </div>
          ) : null}

          {step === 4 ? (
            <div>
              <h2 className="font-display text-xl font-semibold text-ink">Preferences for this household</h2>
              <p className="mt-1 text-sm text-muted">
                These shape when and how suggestions appear, so the plan fits the family rather than the other
                way round.
              </p>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <fieldset>
                  <legend className="field-label">Reminder style</legend>
                  <div className="space-y-2">
                    {[
                      { value: 'gentle', label: 'Gentle — one quiet reminder' },
                      { value: 'scheduled', label: 'Scheduled — reminders at set times' },
                      { value: 'minimal', label: 'Minimal — only the weekly summary' },
                    ].map((option) => (
                      <label key={option.value} className="flex items-center gap-2.5 rounded-control border border-border px-3 py-2 text-[13px] text-ink">
                        <input
                          type="radio"
                          name="reminderStyle"
                          value={option.value}
                          checked={draft.preferences.reminderStyle === option.value}
                          onChange={() =>
                            setDraft((current) => ({
                              ...current,
                              preferences: {
                                ...current.preferences,
                                reminderStyle: option.value as HouseholdProfile['preferences']['reminderStyle'],
                              },
                            }))
                          }
                          className="h-4 w-4 border-border text-royal focus:ring-insight"
                        />
                        {option.label}
                      </label>
                    ))}
                  </div>
                </fieldset>

                <fieldset>
                  <legend className="field-label">Maximum daily family-action time</legend>
                  <div className="space-y-2">
                    {[15, 30, 45].map((minutes) => (
                      <label key={minutes} className="flex items-center gap-2.5 rounded-control border border-border px-3 py-2 text-[13px] text-ink">
                        <input
                          type="radio"
                          name="maxDaily"
                          checked={draft.preferences.maxDailyMinutes === minutes}
                          onChange={() =>
                            setDraft((current) => ({
                              ...current,
                              preferences: {
                                ...current.preferences,
                                maxDailyMinutes: minutes as HouseholdProfile['preferences']['maxDailyMinutes'],
                              },
                            }))
                          }
                          className="h-4 w-4 border-border text-royal focus:ring-insight"
                        />
                        {minutes} minutes
                      </label>
                    ))}
                  </div>
                </fieldset>

                <fieldset>
                  <legend className="field-label">Preferred activity types</legend>
                  <div className="flex flex-wrap gap-1.5">
                    {ACTIVITIES.map((activity) => {
                      const active = draft.preferences.preferredActivities.includes(activity);
                      return (
                        <button
                          key={activity}
                          type="button"
                          aria-pressed={active}
                          onClick={() => toggleList('preferredActivities', activity)}
                          className="chip"
                        >
                          {active ? <Check aria-hidden="true" className="h-3 w-3" /> : null}
                          {activity}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                <fieldset>
                  <legend className="field-label">Available shared times</legend>
                  <div className="flex flex-wrap gap-1.5">
                    {SHARED_TIMES.map((time) => {
                      const active = draft.preferences.sharedTimes.includes(time);
                      return (
                        <button
                          key={time}
                          type="button"
                          aria-pressed={active}
                          onClick={() => toggleList('sharedTimes', time)}
                          className="chip"
                        >
                          {active ? <Check aria-hidden="true" className="h-3 w-3" /> : null}
                          {time}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                <fieldset className="sm:col-span-2">
                  <legend className="field-label">Accessibility options</legend>
                  <div className="flex flex-wrap gap-1.5">
                    {ACCESSIBILITY.map((item) => {
                      const active = draft.preferences.accessibility.includes(item);
                      return (
                        <button
                          key={item}
                          type="button"
                          aria-pressed={active}
                          onClick={() => toggleList('accessibility', item)}
                          className="chip"
                        >
                          {active ? <Check aria-hidden="true" className="h-3 w-3" /> : null}
                          {item}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              </div>

              <div className="mt-5 rounded-control border border-border bg-canvas/70 p-4">
                <p className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide text-muted">
                  <Users aria-hidden="true" className="h-3.5 w-3.5" /> Ready to save
                </p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-ink/75">
                  {validMembers.length} member{validMembers.length === 1 ? '' : 's'} ·{' '}
                  {draft.goals.length} priorit{draft.goals.length === 1 ? 'y' : 'ies'} · up to{' '}
                  {draft.preferences.maxDailyMinutes} minutes of family action per day.
                </p>
              </div>
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <div className="flex items-center gap-2 text-[11px] text-muted">
              <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5 text-royal" />
              Stored locally · no account required
            </div>
            <div className="flex gap-2">
              {step > 0 ? (
                <Button variant="ghost" size="sm" onClick={back}>
                  <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
                  Back
                </Button>
              ) : null}
              {step < STEPS.length - 1 ? (
                <Button size="sm" onClick={next}>
                  Continue
                  <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
                </Button>
              ) : (
                <Button size="sm" onClick={finish}>
                  Save household and start check-in
                  <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
