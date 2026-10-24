import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpenCheck,
  BrainCircuit,
  CalendarCheck2,
  ChevronRight,
  CircleDot,
  Clock,
  FlaskConical,
  HeartHandshake,
  Lock,
  MessagesSquare,
  Play,
  Scale,
  ShieldCheck,
  Sparkles,
  Sun,
  Users,
} from 'lucide-react';
import { CinematicIntro } from '@/components/layout/CinematicIntro';
import { SafeBoundary } from '@/components/shared/SafeBoundary';
import { HeroSignalPreview } from '@/components/marketing/HeroSignalPreview';
import { LinkButton } from '@/components/shared/Button';
import { SectionHeading } from '@/components/shared/SectionHeading';
import { ExplainabilityPanel } from '@/components/shared/Explainability';
import { DEMO_IMPACT, DEMO_MEMBERS, DEMO_SIGNALS } from '@/data/demo';
import { KEYS, readSessionFlag, writeSessionFlag } from '@/lib/storage';

const TRUST_LABELS = [
  { icon: Lock, label: 'Privacy-conscious' },
  { icon: BrainCircuit, label: 'Explainable recommendations' },
  { icon: Users, label: 'Multi-generational support' },
  { icon: ShieldCheck, label: 'Family-controlled' },
];

const HOW_STEPS = [
  { title: 'Check in privately', copy: 'Each member answers what they choose to share. Private notes stay private.', icon: CircleDot },
  { title: 'Combine consented summaries', copy: 'The family sees category-level patterns, never another person’s private entries.', icon: Users },
  { title: 'Identify non-clinical patterns', copy: 'The signal engine finds overlaps across time, load and routines.', icon: BrainCircuit },
  { title: 'Explain the reasoning', copy: 'Every suggestion states which signal it used and why it matters.', icon: BookOpenCheck },
  { title: 'Build an achievable plan', copy: 'At most two actions a day, sized to the family’s available time.', icon: CalendarCheck2 },
  { title: 'Reflect and adapt', copy: 'The family keeps what worked, edits what did not, and stays in control.', icon: Sun },
];

const SIGNAL_CARDS = [
  { title: 'Four days without shared time', detail: 'Time exists, but it is not protected.' },
  { title: 'Exam load rising this week', detail: 'Two assessments within three days.' },
  { title: 'One care reminder missed', detail: 'No backup is named for the routine.' },
  { title: 'Most planning sits with one person', detail: 'Invisible work concentrates first.' },
  { title: 'Sleep routine inconsistent', detail: 'Evenings run later than intended.' },
];

const PREVIEW_TABS = ['Connected signals', 'Explained action', 'Weekly plan'] as const;

export default function Landing() {
  const [showIntro, setShowIntro] = useState(() => !readSessionFlag(KEYS.sessionIntro));
  const [tab, setTab] = useState<(typeof PREVIEW_TABS)[number]>('Connected signals');

  const finishIntro = () => {
    writeSessionFlag(KEYS.sessionIntro, true);
    setShowIntro(false);
  };

  return (
    <>
      {showIntro ? (
        <SafeBoundary fallback={null}>
          <CinematicIntro onComplete={finishIntro} />
        </SafeBoundary>
      ) : null}

      {/* HERO */}
      <section className="relative isolate overflow-hidden bg-ink text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            background:
              'radial-gradient(900px 520px at 12% 0%, rgba(41,190,253,0.16), transparent 65%), radial-gradient(760px 480px at 88% 18%, rgba(71,230,193,0.13), transparent 62%), radial-gradient(600px 400px at 60% 100%, rgba(162,89,234,0.12), transparent 70%)',
          }}
        />
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.5]"
          preserveAspectRatio="none"
          viewBox="0 0 1200 700"
        >
          <g stroke="#47E6C1" strokeOpacity="0.14" strokeWidth="1">
            <path d="M120 520L330 300L520 420L720 220L980 330" fill="none" />
            <path d="M60 260L250 380L430 180L660 360L900 160L1140 300" fill="none" />
          </g>
          <g fill="#47E6C1">
            <circle cx="330" cy="300" r="3.2" opacity="0.7" />
            <circle cx="520" cy="420" r="2.6" opacity="0.55" />
            <circle cx="720" cy="220" r="3.4" opacity="0.65" />
            <circle cx="430" cy="180" r="2.4" opacity="0.45" />
            <circle cx="900" cy="160" r="2.8" opacity="0.5" />
          </g>
        </svg>

        <div className="container-page relative grid gap-10 pb-16 pt-12 sm:pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-12 lg:pb-24 lg:pt-20">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-teal/25 bg-teal/[0.08] px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-teal">
              <Sparkles aria-hidden="true" className="h-3.5 w-3.5" />
              Responsible AI for everyday family wellbeing
            </p>
            <h1 className="mt-5 max-w-[19ch] font-display text-[clamp(2.15rem,5.4vw,4.15rem)] font-semibold leading-[1.03] tracking-[-0.03em]">
              Understand the signals.{' '}
              <span className="bg-gradient-to-r from-teal via-insight to-violet bg-clip-text text-transparent">
                Strengthen the family.
              </span>
            </h1>
            <p className="mt-5 max-w-[54ch] text-[15px] leading-relaxed text-white/70 sm:text-[17px]">
              FamilyMind AI connects the everyday signals a family chooses to share, explains what needs
              attention, and turns understanding into practical action.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <LinkButton to="/assessment" variant="signal" className="w-full sm:w-auto">
                Start Family Check-In
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </LinkButton>
              <LinkButton
                to="/demo"
                className="w-full border border-white/15 bg-white/[0.04] text-white hover:bg-white/[0.09] sm:w-auto"
                variant="ghost"
              >
                <Play aria-hidden="true" className="h-4 w-4" />
                View the Live Family Story
              </LinkButton>
            </div>

            <ul className="mt-8 grid grid-cols-2 gap-2.5 sm:flex sm:flex-wrap sm:gap-4">
              {TRUST_LABELS.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.label} className="flex items-center gap-2 text-[12px] font-medium text-white/60">
                    <Icon aria-hidden="true" className="h-3.5 w-3.5 text-teal" />
                    {item.label}
                  </li>
                );
              })}
            </ul>

            <button
              type="button"
              onClick={() => setShowIntro(true)}
              className="mt-6 inline-flex items-center gap-2 text-[12px] font-semibold text-white/55 transition hover:text-white/80"
            >
              <Play aria-hidden="true" className="h-3 w-3" />
              Replay the cinematic intro
            </button>
          </div>

          <HeroSignalPreview />
        </div>

        <div className="relative border-t border-white/10 bg-ink/60">
          <div className="container-page flex flex-wrap items-center justify-between gap-x-8 gap-y-3 py-4 text-[11px] uppercase tracking-[0.14em] text-white/55">
            <span>Non-clinical by design</span>
            <span className="hidden sm:inline">No emergency monitoring</span>
            <span>On-device prototype data</span>
            <span className="hidden md:inline">Family consent required</span>
            <span>UAE-built concept</span>
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="relative bg-white py-16 sm:py-20">
        <div className="container-page">
          <SectionHeading
            eyebrow="The problem"
            title="Small signals become visible when they are connected."
            copy="Families already see each individual task. What they miss is the combined pattern: the exam week that collides with a chore evening, the care routine that slips when one person travels, the shared time that quietly disappears from a busy week."
          />

          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {SIGNAL_CARDS.map((card, index) => (
              <article key={card.title} className="card relative overflow-hidden p-4">
                <span className="text-[11px] font-semibold tabular-nums text-muted/70">0{index + 1}</span>
                <h3 className="mt-2 text-[14px] font-semibold leading-snug text-ink">{card.title}</h3>
                <p className="mt-1.5 text-[12px] leading-relaxed text-muted">{card.detail}</p>
                <span
                  aria-hidden="true"
                  className="absolute inset-x-4 bottom-0 h-px bg-gradient-to-r from-transparent via-insight/50 to-transparent"
                />
              </article>
            ))}
          </div>

          <div className="mt-8 flex flex-col items-start justify-between gap-5 rounded-card border border-royal/15 bg-royal/[0.04] p-5 sm:flex-row sm:items-center sm:p-6">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-royal text-white">
                <BrainCircuit aria-hidden="true" className="h-4 w-4" />
              </span>
              <p className="max-w-[52ch] font-display text-[15px] font-semibold leading-snug text-ink sm:text-base">
                “This family does not need more notifications. It needs one coordinated plan.”
              </p>
            </div>
            <Link to="/dashboard" className="btn-ghost btn-sm shrink-0">
              See the household view
              <ChevronRight aria-hidden="true" className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-canvas py-16 sm:py-20">
        <div className="container-page">
          <SectionHeading
            eyebrow="How FamilyMind works"
            title="A six-step loop the family can actually keep."
            copy="CHECK IN → UNDERSTAND → EXPLAIN → PLAN → ACT → REFLECT"
          />
          <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {HOW_STEPS.map((step, index) => {
              const Icon = step.icon;
              return (
                <li key={step.title} className="card group p-5 transition duration-300 hover:-translate-y-0.5 hover:shadow-lift">
                  <div className="flex items-center justify-between">
                    <span className="flex h-9 w-9 items-center justify-center rounded-control bg-canvas text-royal transition group-hover:bg-royal group-hover:text-white">
                      <Icon aria-hidden="true" className="h-4 w-4" />
                    </span>
                    <span className="font-display text-xs font-semibold tabular-nums text-muted/60">
                      Step {index + 1}
                    </span>
                  </div>
                  <h3 className="mt-3.5 text-[15px] font-semibold text-ink">{step.title}</h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{step.copy}</p>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* INTERACTIVE PREVIEW */}
      <section className="bg-white py-16 sm:py-20">
        <div className="container-page">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <SectionHeading
              eyebrow="Interactive product preview"
              title="From a scattered signal to a family decision."
              copy="This is the real interaction model: signals are explained, a suggestion is proposed, and the family confirms what enters the week."
            />
            <LinkButton to="/demo" variant="ghost" size="sm" className="shrink-0">
              Open the guided demo
              <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
            </LinkButton>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-[300px_1fr]">
            <div className="card p-5">
              <p className="stat-label">Al Noor household · prototype</p>
              <div className="mt-3 space-y-2.5">
                {DEMO_MEMBERS.map((member) => (
                  <div key={member.id} className="flex items-center gap-3">
                    <span
                      className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold text-ink"
                      style={{ backgroundColor: `${member.avatarColor}2b`, border: `1px solid ${member.avatarColor}` }}
                      aria-hidden="true"
                    >
                      {member.name.charAt(0)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-ink">{member.name}</p>
                      <p className="truncate text-[11px] text-muted">
                        {member.role} · {member.ageGroup === 'older-adult' ? 'older adult' : member.ageGroup}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-control bg-canvas p-3 text-[11px] leading-relaxed text-muted">
                Shared dashboards show consented summaries only. The grandmother’s routine is visible; her
                private notes are not.
              </div>
            </div>

            <div className="card overflow-hidden">
              <div className="flex flex-wrap gap-1 border-b border-border p-2" role="tablist" aria-label="Product preview">
                {PREVIEW_TABS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    role="tab"
                    aria-selected={tab === item}
                    onClick={() => setTab(item)}
                    className={`rounded-full px-3.5 py-2 text-[12px] font-semibold transition ${
                      tab === item ? 'bg-ink text-white' : 'text-muted hover:bg-canvas hover:text-ink'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>

              <div className="p-5">
                {tab === 'Connected signals' ? (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                      Wednesday · three signals overlap
                    </p>
                    <ul className="mt-3 space-y-2.5">
                      {DEMO_SIGNALS.slice(0, 3).map((signal) => (
                        <li key={signal.id} className="flex items-start gap-3 rounded-control border border-border p-3">
                          <span
                            className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                              signal.severity === 'attention' ? 'bg-warning' : signal.severity === 'watch' ? 'bg-insight' : 'bg-success'
                            }`}
                            aria-hidden="true"
                          />
                          <div>
                            <p className="text-[13px] font-semibold text-ink">{signal.title}</p>
                            <p className="mt-0.5 text-[12px] leading-relaxed text-muted">{signal.detail}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-4 rounded-control bg-canvas px-3 py-2.5 text-[12px] leading-relaxed text-muted">
                      Each signal is a reported household input, not a detected fact about a person.
                    </p>
                  </div>
                ) : null}

                {tab === 'Explained action' ? (
                  <div className="space-y-3">
                    <div className="rounded-control border border-gold/30 bg-gold/[0.06] p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7a4d00]">
                        Suggested action · 10 minutes
                      </p>
                      <p className="mt-1.5 font-display text-[15px] font-semibold text-ink">
                        Move one Wednesday task and hold a short check-in after dinner.
                      </p>
                      <p className="mt-1.5 text-[12px] leading-relaxed text-muted">
                        Study pressure is high while sleep is inconsistent, and Wednesday contains several
                        responsibilities. Removing a chore protects preparation better than adding an
                        activity.
                      </p>
                    </div>
                    <ExplainabilityPanel
                      title="Why this recommendation?"
                      factors={[
                        { label: 'Student pressure', value: 'High' },
                        { label: 'Rest', value: 'Inconsistent' },
                        { label: 'Wednesday load', value: '3 events for one person' },
                        { label: 'Family time', value: 'Once this week' },
                      ]}
                      logic="If student pressure is high or severe, rest is inconsistent, and the same evening holds a household task, then propose removing the task rather than adding an activity. Duration is capped at 10 minutes so the action is achievable on a school night."
                      action="Move Zayed’s Wednesday kitchen task to Omar, and hold a 10-minute check-in after dinner."
                      control="The family can apply, edit, or reject this action. Nothing changes until someone confirms it."
                      alternative="A 15-minute family walk on Friday instead, if the week is already full."
                    />
                  </div>
                ) : null}

                {tab === 'Weekly plan' ? (
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                        This week · 7 actions · max 2 per day
                      </p>
                      <span className="pill">Demo plan</span>
                    </div>
                    <ul className="mt-3 divide-y divide-border">
                      {[
                        ['Mon', 'Family check-in after dinner', '10 min'],
                        ['Tue', 'Grocery planning shared with Omar', '20 min'],
                        ['Wed', 'Protected study block, chore moved', '90 min'],
                        ['Thu', 'Family call and memory prompt', '15 min'],
                        ['Fri', 'Family walk, indoor alternative', '30 min'],
                        ['Sat', 'Responsibility reset and shared meal', '30 min'],
                        ['Sun', 'Gratitude reflection', '15 min'],
                      ].map(([day, title, time]) => (
                        <li key={day} className="flex items-center gap-3 py-2.5">
                          <span className="w-9 shrink-0 text-[11px] font-semibold uppercase tracking-wide text-muted">
                            {day}
                          </span>
                          <span className="flex-1 text-[13px] text-ink">{title}</span>
                          <span className="flex items-center gap-1 text-[11px] text-muted">
                            <Clock aria-hidden="true" className="h-3 w-3" />
                            {time}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <Link to="/plan" className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-semibold text-royal">
                      Open the editable plan
                      <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MULTI-GENERATIONAL */}
      <section className="bg-canvas py-16 sm:py-20">
        <div className="container-page">
          <SectionHeading
            eyebrow="Multi-generational support"
            title="One household. Five different experiences."
            copy="The same plan has to work for a parent with a full calendar, a student in an assessment week, a child building routines, and a grandmother who values her own independence."
          />
          <div className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { name: 'Omar, 44', role: 'Father', copy: 'Protects family time and coordinates the household without becoming the default backup for everything.', icon: Users },
              { name: 'Mariam, 41', role: 'Mother', copy: 'Sees planning load made visible, and can hand over one recurring task without asking twice.', icon: Scale },
              { name: 'Zayed, 16', role: 'Grade 11 student', copy: 'Chooses what to share, protects study time, and requests support with a prepared message.', icon: BookOpenCheck },
              { name: 'Latifa, 12', role: 'Grade 7 student', copy: 'Builds a homework and sleep routine with a small number of steps, not a wall of reminders.', icon: Sun },
              { name: 'Fatima, 70', role: 'Grandmother', copy: 'Keeps her routine and her dignity: large text, clear confirmations, and a named care backup.', icon: HeartHandshake },
              { name: 'The household', role: 'Shared view', copy: 'Sees only consented summaries — never private journals, exact moods, or personal messages.', icon: Lock },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.name} className="card p-5">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-control bg-royal/[0.07] text-royal">
                      <Icon aria-hidden="true" className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-[13px] font-semibold text-ink">{item.name}</p>
                      <p className="text-[11px] text-muted">{item.role}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-[13px] leading-relaxed text-muted">{item.copy}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* EXPLAINABLE AI + PRIVACY */}
      <section className="bg-white py-16 sm:py-20">
        <div className="container-page grid gap-10 lg:grid-cols-2 lg:gap-14">
          <div>
            <SectionHeading
              eyebrow="Explainable AI"
              title="No black-box advice."
              copy="Every suggestion answers five questions before a family is asked to act on it."
            />
            <ul className="mt-6 space-y-3">
              {[
                'What signal influenced this?',
                'Why does it matter to this household?',
                'Why was this action selected instead of another?',
                'Who controls whether it is applied?',
                'How much time will it require?',
              ].map((question) => (
                <li key={question} className="flex items-start gap-3 text-[14px] text-ink">
                  <span className="mt-1.5 flex h-1.5 w-1.5 shrink-0 rounded-full bg-teal" aria-hidden="true" />
                  {question}
                </li>
              ))}
            </ul>
            <Link
              to="/trust"
              className="mt-6 inline-flex items-center gap-1.5 text-[13px] font-semibold text-royal"
            >
              Read the explainability standard
              <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="card p-5 sm:p-6">
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
              <Lock aria-hidden="true" className="h-3.5 w-3.5 text-royal" /> Privacy by default
            </p>
            <h3 className="mt-3 font-display text-xl font-semibold text-ink">
              The family stays in control of every boundary.
            </h3>
            <div className="mt-4 space-y-3">
              {[
                { title: 'Private stays private', copy: 'Journal entries, exact mood notes and coach conversations are never included in household summaries.' },
                { title: 'Consent is visible', copy: 'Each member chooses whether they appear in shared summaries, and can revoke it.' },
                { title: 'No secret monitoring', copy: 'There is no covert tracking of another family member, and no location or microphone access.' },
                { title: 'Data stays local', copy: 'This prototype stores everything in this browser. Reset and deletion controls are always available.' },
              ].map((item) => (
                <div key={item.title} className="rounded-control border border-border bg-canvas/60 p-3.5">
                  <p className="text-[13px] font-semibold text-ink">{item.title}</p>
                  <p className="mt-1 text-[12px] leading-relaxed text-muted">{item.copy}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* IMPACT */}
      <section className="bg-ink py-16 text-white sm:py-20">
        <div className="container-page">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeading
              eyebrow="Prototype projection"
              title="What the demo household decides in one week."
              tone="light"
              copy="These are planned outputs from the Al Noor demonstration plan, not measured clinical outcomes."
            />
            <span className="self-start rounded-full border border-white/15 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/50">
              Illustrative result
            </span>
          </div>
          <div className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {DEMO_IMPACT.map((item) => (
              <div key={item.label} className="rounded-card border border-white/10 bg-white/[0.04] p-5">
                <p className="font-display text-3xl font-semibold text-teal">
                  {item.value}
                  {item.suffix ? <span className="text-base text-white/60">{item.suffix}</span> : null}
                </p>
                <p className="mt-1.5 text-[13px] font-semibold text-white">{item.label}</p>
                <p className="mt-1 text-[11px] leading-relaxed text-white/55">{item.detail}</p>
              </div>
            ))}
          </div>
          <p className="mt-5 flex items-center gap-2 text-[11px] text-white/55">
            <FlaskConical aria-hidden="true" className="h-3.5 w-3.5" />
            Prototype metrics demonstrate interface behaviour. They are not clinical outcomes and do not
            predict family crises.
          </p>
        </div>
      </section>

      {/* FINAL PITCH */}
      <section className="relative overflow-hidden bg-white py-16 sm:py-24">
        <div className="container-page">
          <div className="mx-auto max-w-3xl text-center">
            <p className="eyebrow">The case for FamilyMind AI</p>
            <h2 className="mt-3 font-display text-[clamp(1.8rem,3.6vw,2.9rem)] font-semibold leading-[1.1] text-ink">
              Every strong society begins with supported families.
            </h2>
            <p className="mx-auto mt-4 max-w-[60ch] text-[15px] leading-relaxed text-muted">
              Existing tools organise time, collect moods, or offer generic advice. FamilyMind AI is the
              first layer that connects them responsibly: consented signals, non-clinical patterns,
              explainable suggestions, and a family-controlled plan that fits a real week.
            </p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <LinkButton to="/onboarding" variant="primary">
                Set up your household
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </LinkButton>
              <LinkButton to="/demo" variant="ghost">
                <Sparkles aria-hidden="true" className="h-4 w-4" />
                Launch the 4-minute judge demo
              </LinkButton>
            </div>
          </div>

          <div className="mt-14 grid gap-3 sm:grid-cols-3">
            {[
              { title: 'Deterministic by design', copy: 'The same inputs always produce the same result, so a live demonstration never depends on a network or a model.', icon: MessagesSquare },
              { title: 'Built around consent', copy: 'Each member controls what is shared. Private material is excluded from household summaries by construction.', icon: Lock },
              { title: 'Culturally grounded', copy: 'Designed in the UAE for multi-generational households, with respect for elder dignity and family decision-making.', icon: ShieldCheck },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-card border border-border bg-canvas/60 p-5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-control bg-white text-royal shadow-soft">
                    <Icon aria-hidden="true" className="h-4 w-4" />
                  </span>
                  <p className="mt-3 text-[14px] font-semibold text-ink">{item.title}</p>
                  <p className="mt-1.5 text-[12px] leading-relaxed text-muted">{item.copy}</p>
                </div>
              );
            })}
          </div>

          <p className="mx-auto mt-12 max-w-2xl text-center font-display text-[15px] font-medium leading-relaxed text-ink/80">
            FamilyMind AI does not replace the family’s judgment. It helps the family see, decide, and act
            together.
          </p>
        </div>
      </section>
    </>
  );
}
