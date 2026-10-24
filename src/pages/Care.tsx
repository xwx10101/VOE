import { useMemo, useState } from 'react';
import {
  AlertCircle,
  BellRing,
  BookOpen,
  CalendarClock,
  Check,
  Droplets,
  Footprints,
  HeartHandshake,
  PhoneCall,
  Pill,
  ShieldCheck,
  UserCheck,
  Users,
} from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { EMERGENCY_PLACEHOLDER } from '@/lib/safety';
import { useFamily } from '@/state/FamilyContext';
import type { MemoryEntry } from '@/types';

const KIND_META: Record<string, { label: string; icon: typeof Pill; detail: string }> = {
  medication: { label: 'Medication routine', icon: Pill, detail: 'Take with water, after breakfast.' },
  hydration: { label: 'Hydration', icon: Droplets, detail: 'One glass of water now, one with lunch.' },
  movement: { label: 'Gentle movement', icon: Footprints, detail: 'Ten minutes around the courtyard, at your own pace.' },
  'family-call': { label: 'Family call', icon: PhoneCall, detail: 'A short call with Mariam, Zayed, or Latifa.' },
  appointment: { label: 'Appointment', icon: CalendarClock, detail: 'Clinic review, Tuesday at 10:00. Transport arranged.' },
  memory: { label: 'Memory prompt', icon: BookOpen, detail: 'Which Eid do you remember most fondly?' },
};

export default function Care() {
  const { profile, reminders, updateReminder, addMemory, pushToast } = useFamily();
  const grandmother = profile.members.find((member) => member.ageGroup === 'older-adult') ?? profile.members[0];
  const [backupId, setBackupId] = useState(
    () => profile.members.find((member) => member.id !== grandmother?.id)?.id ?? '',
  );
  const [story, setStory] = useState('');
  const [agreed, setAgreed] = useState(true);

  const ownReminders = useMemo(
    () => reminders.filter((reminder) => reminder.memberId === grandmother?.id),
    [reminders, grandmother],
  );

  const completed = ownReminders.filter((reminder) => reminder.status === 'done').length;

  const saveStory = () => {
    if (story.trim().length < 5) {
      pushToast('Add a little more before saving the memory.', 'error');
      return;
    }
    const entry: Omit<MemoryEntry, 'id' | 'createdAt'> = {
      type: 'story',
      title: 'A story from the family archive',
      message: story.trim(),
      date: new Date().toISOString().slice(0, 10),
      memberTags: grandmother ? [grandmother.id] : [],
      visibility: 'household',
    };
    addMemory(entry);
    setStory('');
    pushToast('Story saved to the Memory Vault.');
  };

  return (
    <div className="mx-auto max-w-[1000px] text-[16px]">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Older adult care</p>
          <h1 className="mt-2 font-display text-[clamp(1.7rem,3vw,2.3rem)] font-semibold leading-tight text-ink">
            {grandmother?.name ?? 'Care routines'}
          </h1>
          <p className="mt-2 max-w-[60ch] text-[15px] leading-relaxed text-muted">
            Clear routines, large controls, and a named person to call. Nothing here monitors you, and nothing is
            shared without agreement.
          </p>
        </div>
        <div className="rounded-control border border-border bg-white px-4 py-3 text-center">
          <p className="text-[12px] uppercase tracking-wide text-muted">Routines completed</p>
          <p className="font-display text-2xl font-semibold tabular-nums text-ink">
            {completed}/{ownReminders.length}
          </p>
        </div>
      </header>

      <section className="mt-4 rounded-card border border-royal/25 bg-royal/[0.05] p-5">
        <p className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.14em] text-royal">
          <BellRing aria-hidden="true" className="h-4 w-4" /> Today’s routines
        </p>
        <p className="mt-1 text-[14px] text-muted">
          Confirm each routine when it is done. If you cannot complete one, you can ask for help or remind yourself
          later — no explanation is required.
        </p>

        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {ownReminders.map((reminder) => {
            const meta = KIND_META[reminder.kind] ?? KIND_META.medication;
            const Icon = meta.icon;
            const done = reminder.status === 'done';
            return (
              <li key={reminder.id} className={`rounded-card border bg-white p-4 ${done ? 'border-success/35' : 'border-border'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className={`flex h-11 w-11 items-center justify-center rounded-control ${done ? 'bg-success/10 text-success' : 'bg-royal/[0.07] text-royal'}`}>
                      <Icon aria-hidden="true" className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-[16px] font-semibold leading-tight text-ink">{reminder.label}</p>
                      <p className="mt-0.5 text-[13px] text-muted">{reminder.time}</p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11.5px] font-semibold ${
                      done ? 'bg-success/10 text-[#1f6f4a]' : reminder.status === 'later' ? 'bg-warning/10 text-[#7a4d00]' : 'bg-canvas text-muted'
                    }`}
                  >
                    {done ? 'Completed' : reminder.status === 'later' ? 'Remind later' : 'Pending'}
                  </span>
                </div>
                <p className="mt-2.5 text-[14px] leading-relaxed text-muted">{meta.detail}</p>
                {reminder.backupId ? (
                  <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-teal/10 px-2.5 py-1 text-[12px] font-medium text-[#0d5c4b]">
                    <UserCheck aria-hidden="true" className="h-3.5 w-3.5" />
                    Backup: {profile.members.find((member) => member.id === reminder.backupId)?.name.split(' ')[0]}
                  </p>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      updateReminder(reminder.id, { status: 'done' });
                      pushToast('Routine confirmed. Thank you — nothing else is needed.');
                    }}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-control bg-ink px-4 text-[14px] font-semibold text-white transition hover:bg-royal disabled:opacity-50"
                    disabled={done}
                  >
                    <Check aria-hidden="true" className="h-4 w-4" />
                    Confirm
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      updateReminder(reminder.id, { status: 'later' });
                      pushToast('Reminder moved later. No notification was sent to anyone.');
                    }}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-control border border-border px-4 text-[14px] font-medium text-ink transition hover:bg-canvas"
                  >
                    Remind later
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      updateReminder(reminder.id, { backupId });
                      pushToast(`${profile.members.find((member) => member.id === backupId)?.name.split(' ')[0] ?? 'A family member'} is now the backup for this routine.`);
                    }}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-control border border-border px-4 text-[14px] font-medium text-ink transition hover:bg-canvas"
                  >
                    <Users aria-hidden="true" className="h-4 w-4" />
                    Ask family
                  </button>
                </div>
              </li>
            );
          })}
          {ownReminders.length === 0 ? (
            <li className="rounded-card border border-dashed border-border p-5 text-[14px] text-muted sm:col-span-2">
              No routines are set up yet. A family member can add them from the care settings.
            </li>
          ) : null}
        </ul>
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className="rounded-card border border-border bg-white p-5">
          <h2 className="flex items-center gap-2 font-display text-[18px] font-semibold text-ink">
            <UserCheck aria-hidden="true" className="h-5 w-5 text-royal" />
            Care backup
          </h2>
          <p className="mt-2 text-[14px] leading-relaxed text-muted">
            Two stages only. First, a reminder to {grandmother?.name.split(' ')[0] ?? 'the person'}. If a routine is
            still not confirmed after an agreed time, one named backup is asked — never the whole household.
          </p>

          <ol className="mt-3 space-y-2">
            <li className="flex items-start gap-3 rounded-control border border-border bg-canvas/60 p-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-royal text-[12px] font-bold text-white">1</span>
              <span className="text-[14px] leading-relaxed text-ink">
                Primary reminder at the agreed time. Only the person sees it.
              </span>
            </li>
            <li className="flex items-start gap-3 rounded-control border border-border bg-canvas/60 p-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-royal text-[12px] font-bold text-white">2</span>
              <span className="text-[14px] leading-relaxed text-ink">
                After 45 minutes, the named backup is asked once. No location, no monitoring, no group message.
              </span>
            </li>
          </ol>

          <label className="mt-3 block">
            <span className="field-label !text-[14px]">Named backup</span>
            <select className="field !min-h-[46px] !text-[15px]" value={backupId} onChange={(event) => setBackupId(event.target.value)}>
              {profile.members
                .filter((member) => member.id !== grandmother?.id)
                .map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name} · {member.role}
                  </option>
                ))}
            </select>
          </label>

          <label className="mt-3 flex items-start gap-3 rounded-control border border-border p-3">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(event) => setAgreed(event.target.checked)}
              className="mt-1 h-5 w-5 rounded border-border text-royal focus:ring-insight"
            />
            <span className="text-[14px] leading-relaxed text-ink">
              I agree that this person may be contacted if a routine is missed. This can be changed at any time.
            </span>
          </label>

          <Button
            className="mt-3 w-full !min-h-[46px] !text-[15px]"
            disabled={!agreed}
            onClick={() => {
              ownReminders.forEach((reminder) => updateReminder(reminder.id, { backupId }));
              pushToast('Backup assigned. Only that person will be asked, and only after the agreed delay.');
            }}
          >
            <HeartHandshake aria-hidden="true" className="h-4 w-4" />
            Assign care backup
          </Button>
        </section>

        <section className="rounded-card border border-border bg-white p-5">
          <h2 className="flex items-center gap-2 font-display text-[18px] font-semibold text-ink">
            <BookOpen aria-hidden="true" className="h-5 w-5 text-royal" />
            Memory prompt
          </h2>
          <p className="mt-2 text-[15px] leading-relaxed text-ink">
            “Which Eid do you remember most fondly, and what did the house smell like that morning?”
          </p>
          <label className="mt-3 block">
            <span className="field-label !text-[14px]">Write or dictate your answer</span>
            <textarea
              className="field min-h-[120px] !text-[15px] leading-relaxed"
              maxLength={400}
              value={story}
              onChange={(event) => setStory(event.target.value)}
              placeholder="A few sentences are enough."
            />
          </label>
          <p className="mt-1 text-right text-[12px] text-muted">{story.length}/400</p>
          <Button className="mt-2 w-full !min-h-[46px] !text-[15px]" onClick={saveStory}>
            Save to the Memory Vault
          </Button>
          <p className="mt-2 text-[13px] leading-relaxed text-muted">
            Saved entries are visible to the household only if you choose that when saving. Stories are never used
            to score the family.
          </p>
        </section>
      </div>

      <section className="mt-4 rounded-card border border-border bg-canvas/70 p-5">
        <h2 className="flex items-center gap-2 font-display text-[17px] font-semibold text-ink">
          <AlertCircle aria-hidden="true" className="h-5 w-5 text-warning" />
          Emergency contact setup
        </h2>
        <p className="mt-2 text-[14px] leading-relaxed text-muted">{EMERGENCY_PLACEHOLDER}</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <label className="block">
            <span className="field-label !text-[13.5px]">Trusted contact name</span>
            <input className="field !min-h-[44px] !text-[15px]" placeholder="Placeholder only" disabled />
          </label>
          <label className="block">
            <span className="field-label !text-[13.5px]">Contact number</span>
            <input className="field !min-h-[44px] !text-[15px]" placeholder="Not connected in the prototype" disabled />
          </label>
        </div>
        <p className="mt-2 flex items-start gap-2 text-[13px] leading-relaxed text-muted">
          <ShieldCheck aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-royal" />
          In a real emergency, call your local emergency number directly. This prototype does not monitor
          emergencies and will not contact anyone automatically.
        </p>
      </section>
    </div>
  );
}
