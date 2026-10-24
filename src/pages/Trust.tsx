import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Baby,
  Ban,
  Database,
  FileWarning,
  Globe2,
  HeartHandshake,
  Layers,
  Lock,
  RefreshCcw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  Users,
} from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { Modal } from '@/components/shared/Modal';
import { PrivacyMatrix, ExplainabilityPanel } from '@/components/shared/Explainability';
import { useFamily } from '@/state/FamilyContext';

type Scenario = 'exam' | 'care';

export default function Trust() {
  const { resetDemoHousehold, clearLocalData, pushToast, storageOk } = useFamily();
  const [scenario, setScenario] = useState<Scenario>('exam');
  const [confirmClear, setConfirmClear] = useState(false);

  const factors =
    scenario === 'exam'
      ? [
          { label: 'Reported signal', value: 'Student study pressure: high' },
          { label: 'Reported signal', value: 'Rest and recovery: inconsistent' },
          { label: 'Shared calendar', value: 'Wednesday has 3 events for one member' },
          { label: 'Family goal', value: 'Support exam wellbeing' },
        ]
      : [
          { label: 'Reported signal', value: 'One care routine was missed' },
          { label: 'Shared calendar', value: 'No backup assigned to the routine' },
          { label: 'Family goal', value: 'Improve older-adult care continuity' },
          { label: 'Privacy', value: 'Only completion state is shared' },
        ];

  const logic =
    scenario === 'exam'
      ? 'Rule S-03: if study pressure is high or severe, recovery is inconsistent, and the same evening holds a household task, propose removing the task and protecting a study block. Study time is not increased; the competing responsibility is moved.'
      : 'Rule C-02: if a care routine was missed and no backup is assigned, propose one named backup and a scheduled family call. The engine does not read private notes, health records, or location.';

  const action =
    scenario === 'exam'
      ? 'Move Zayed’s Wednesday kitchen task to Omar, and protect 17:00–19:00 for revision.'
      : 'Assign Omar as backup for the morning routine, and keep a 15-minute family call on Thursday.';

  return (
    <div className="mx-auto max-w-[1100px]">
      <header className="max-w-3xl">
        <p className="eyebrow">Trust center</p>
        <h1 className="mt-2 font-display text-[clamp(1.7rem,3.2vw,2.4rem)] font-semibold leading-tight text-ink">
          Privacy, ethics, and explainability
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">
          FamilyMind AI is built to help a family notice patterns early — not to monitor people. This page states
          exactly what the prototype can and cannot do, and where the boundaries sit.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {['Not a medical device', 'No emergency monitoring', 'Local data only', 'Family-controlled'].map((label) => (
            <span key={label} className="pill">
              <ShieldCheck aria-hidden="true" className="h-3 w-3 text-royal" />
              {label}
            </span>
          ))}
        </div>
      </header>

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <section className="card p-5">
          <h2 className="flex items-center gap-2 font-display text-base font-semibold text-ink">
            <ShieldCheck aria-hidden="true" className="h-4 w-4 text-success" />
            What FamilyMind AI can do
          </h2>
          <ul className="mt-3 space-y-2 text-[13px] leading-relaxed text-muted">
            {[
              'Combine consented household summaries into non-clinical patterns.',
              'Explain each suggestion with the signals and rule that produced it.',
              'Turn a suggestion into an editable action with a time estimate.',
              'Support multiple generations with different views of the same household.',
              'Keep private notes, coach conversations, and exact mood entries private.',
            ].map((item) => (
              <li key={item} className="flex gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-success" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="card p-5">
          <h2 className="flex items-center gap-2 font-display text-base font-semibold text-ink">
            <Ban aria-hidden="true" className="h-4 w-4 text-danger" />
            What it cannot do
          </h2>
          <ul className="mt-3 space-y-2 text-[13px] leading-relaxed text-muted">
            {[
              'It does not diagnose medical or mental-health conditions.',
              'It cannot monitor emergencies or detect that someone is in danger.',
              'It does not replace qualified professionals, therapy, or medical care.',
              'It does not let one member view another member’s private entries.',
              'It does not predict or prevent every family crisis.',
            ].map((item) => (
              <li key={item} className="flex gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-danger" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {[
          {
            icon: Database,
            title: 'Data minimisation',
            body: 'The prototype stores only what a screen needs: household profile, assessment answers, plan, schedule, reminders, and vault entries. Nothing is transmitted to a server, and no analytics or tracking scripts are loaded.',
          },
          {
            icon: Users,
            title: 'Consent and visibility',
            body: 'Each member chooses whether they appear in shared summaries. Sharing can be revoked. Private journals are excluded by construction, not by policy alone.',
          },
          {
            icon: Baby,
            title: 'Child and teenager safeguards',
            body: 'Students control their own sharing. A parent cannot silently read a child’s mood notes, coach conversation, or support-message draft. Household views show category-level summaries only.',
          },
          {
            icon: Layers,
            title: 'Explainable recommendations',
            body: 'Every recommendation names the signals used, the rule applied, the time required, and who controls it. There is no black-box scoring, and no hidden ranking of family members.',
          },
          {
            icon: SlidersHorizontal,
            title: 'Family control',
            body: 'Nothing is applied automatically. Schedule optimisation proposes changes, the family selects them, and an undo is always available. Rejecting a suggestion never affects future access.',
          },
          {
            icon: Lock,
            title: 'Local prototype data',
            body: 'Data is stored in this browser using namespaced local storage keys. Clearing site data removes it. There is no account, no cloud sync, and no remote backup.',
          },
          {
            icon: FileWarning,
            title: 'Limitations',
            body: 'The scoring is a deterministic prototype with fixed weights. It reflects reported household impressions, which can be incomplete or biased. It is not validated clinically and should not be treated as an assessment of any person.',
          },
          {
            icon: HeartHandshake,
            title: 'Crisis boundary',
            body: 'If a message suggests an emergency, ordinary coaching stops. The prototype names no hotline numbers and instead directs the family to local emergency services, a trusted adult, or a qualified professional.',
          },
          {
            icon: Globe2,
            title: 'Cultural respect',
            body: 'Designed in the UAE for multi-generational households: elder dignity, family decision-making, modesty in sharing, and Arabic-capable typography are treated as design requirements rather than localisation extras.',
          },
          {
            icon: Search,
            title: 'Bias awareness',
            body: 'Household summaries can under-report what is hardest to say. The engine weights a single severe signal strongly and never labels a family as broken, unhealthy, or failing. Protection statuses are deliberately absent.',
          },
        ].map((section) => {
          const Icon = section.icon;
          return (
            <section key={section.title} className="card p-5">
              <h2 className="flex items-center gap-2 font-display text-[15px] font-semibold text-ink">
                <Icon aria-hidden="true" className="h-4 w-4 text-royal" />
                {section.title}
              </h2>
              <p className="mt-2 text-[13px] leading-relaxed text-muted">{section.body}</p>
            </section>
          );
        })}
      </div>

      <section className="card mt-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-semibold text-ink">Privacy matrix</h2>
            <p className="mt-1 text-[12px] text-muted">Exactly what each kind of information can reach.</p>
          </div>
          <span className="pill">Applies to every screen</span>
        </div>
        <div className="mt-4">
          <PrivacyMatrix />
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {[
            'Private entries are not automatically shared with the household.',
            'Recommendations are suggestions that the family reviews and controls.',
            'FamilyMind AI does not diagnose medical or mental-health conditions.',
            'It cannot monitor emergencies.',
            'Prototype metrics demonstrate interface behaviour and are not clinical outcomes.',
          ].map((statement) => (
            <p key={statement} className="flex items-start gap-2 rounded-control bg-canvas px-3 py-2 text-[12px] leading-relaxed text-ink/80">
              <ShieldCheck aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-royal" />
              {statement}
            </p>
          ))}
        </div>
      </section>

      <section className="card mt-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-semibold text-ink">“Why did I receive this?”</h2>
            <p className="mt-1 text-[12px] text-muted">
              An interactive example of the explanation standard used across the product.
            </p>
          </div>
          <div className="flex gap-1 rounded-full border border-border p-1" role="group" aria-label="Example scenario">
            <button
              type="button"
              aria-pressed={scenario === 'exam'}
              onClick={() => setScenario('exam')}
              className={`rounded-full px-3 py-1.5 text-[11.5px] font-semibold transition ${
                scenario === 'exam' ? 'bg-ink text-white' : 'text-muted hover:text-ink'
              }`}
            >
              Exam pressure
            </button>
            <button
              type="button"
              aria-pressed={scenario === 'care'}
              onClick={() => setScenario('care')}
              className={`rounded-full px-3 py-1.5 text-[11.5px] font-semibold transition ${
                scenario === 'care' ? 'bg-ink text-white' : 'text-muted hover:text-ink'
              }`}
            >
              Missed care routine
            </button>
          </div>
        </div>
        <div className="mt-4">
          <ExplainabilityPanel
            title="How this recommendation was produced"
            defaultOpen
            factors={factors}
            logic={logic}
            action={action}
            control="The family can apply, edit the day or duration, or reject the suggestion entirely. Nothing is applied automatically, and rejecting it has no consequences."
            alternative="Take no action this week, or choose a smaller alternative from the weekly plan."
          />
        </div>
      </section>

      <section className="card mt-4 p-5 sm:p-6">
        <h2 className="font-display text-base font-semibold text-ink">Your data in this prototype</h2>
        <p className="mt-1 text-[13px] leading-relaxed text-muted">
          Data lives in this browser only. Storage is {storageOk ? 'available' : 'currently unavailable — changes will not persist after a refresh'}.
          No account, no server, no analytics, no camera or microphone access, and no location permission is
          requested anywhere in this application.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              resetDemoHousehold();
              pushToast('Al Noor demo data restored.');
            }}
          >
            <RefreshCcw aria-hidden="true" className="h-3.5 w-3.5" />
            Restore Al Noor demo
          </Button>
          <Button size="sm" variant="danger" onClick={() => setConfirmClear(true)}>
            <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
            Clear all local data
          </Button>
          <Link to="/demo" className="btn-quiet btn-sm">
            Open the guided demo
            <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
          </Link>
        </div>
        <p className="mt-3 text-[11.5px] leading-relaxed text-muted">
          Clearing local data removes the household profile, assessment, plan, schedule, care reminders, and vault
          entries from this browser. It cannot be undone, and no copy exists elsewhere.
        </p>
      </section>

      <Modal
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        title="Clear all local data?"
        description="This removes every prototype record stored in this browser."
        size="sm"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setConfirmClear(false)}>
              Keep my data
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                clearLocalData();
                setConfirmClear(false);
                pushToast('Local prototype data cleared.', 'info');
              }}
            >
              Clear everything
            </Button>
          </>
        }
      >
        <p className="text-[13px] leading-relaxed text-ink">
          The household profile, assessment answers and result, weekly plan, schedule, care reminders, and memory
          vault entries will be deleted from this device. The demo can be restored at any time.
        </p>
      </Modal>
    </div>
  );
}
