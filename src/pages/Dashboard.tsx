import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BookHeart,
  CalendarDays,
  Check,
  ClipboardCheck,
  Clock,
  HeartHandshake,
  Moon,
  Scale,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';
import { LinkButton } from '@/components/shared/Button';
import { StackedBars, TrendChart } from '@/components/shared/Charts';
import { ExplainabilityPanel, MetricCard } from '@/components/shared/Explainability';
import { ScoreRing } from '@/components/shared/ScoreRing';
import { DEMO_ANSWERS, DEMO_MOOD_TREND } from '@/data/demo';
import { EVENT_CATEGORY_LABELS } from '@/data/questions';
import { computeAssessment } from '@/lib/scoring';
import { buildRecommendations, memberName } from '@/lib/recommendations';
import { loadForMember, timeToMinutes } from '@/lib/scheduleOptimizer';
import { useFamily } from '@/state/FamilyContext';

export default function Dashboard() {
  const { profile, result, plan, schedule, memories, reminders, updateReminder, togglePlanAction, generatePlan, pushToast } =
    useFamily();
  const navigate = useNavigate();

  const fallbackResult = useMemo(() => computeAssessment(DEMO_ANSWERS), []);
  const activeResult = result ?? fallbackResult;
  const isPreview = !result;

  const recommendation = useMemo(
    () => buildRecommendations(activeResult, profile)[0],
    [activeResult, profile],
  );

  const strength = useMemo(
    () => [...activeResult.categories].sort((a, b) => b.score - a.score)[0],
    [activeResult],
  );

  const careDone = reminders.filter((reminder) => reminder.status === 'done').length;
  const careTotal = reminders.length;
  const planDone = plan.actions.filter((action) => action.status === 'done').length;
  const student = profile.members.find((member) => member.role === 'Student');
  const grandmother = profile.members.find((member) => member.ageGroup === 'older-adult');
  const studentLoad = student ? loadForMember(schedule, student.id).find((day) => day.day === 'Wednesday') : undefined;

  const upcoming = useMemo(
    () =>
      [...schedule]
        .sort((a, b) => ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].indexOf(a.day) - ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].indexOf(b.day) || timeToMinutes(a.start) - timeToMinutes(b.start))
        .filter((event) => event.category === 'family' || event.category === 'care' || event.category === 'rest')
        .slice(0, 3),
    [schedule],
  );

  const balance = useMemo(() => {
    const countable = ['household', 'care', 'health'];
    return profile.members.map((member) => {
      const owned = schedule.filter((event) => event.ownerId === member.id && countable.includes(event.category));
      const planning = owned.filter((event) => /planning|grocery|review/i.test(event.title));
      return {
        memberId: member.id,
        visible: owned.filter((event) => !planning.includes(event)).length,
        planning: planning.length,
      };
    });
  }, [profile.members, schedule]);

  const qualityTime = upcoming.filter((event) => event.category === 'family').length;
  const topPlanner = [...balance].sort((a, b) => b.planning - a.planning)[0];
  const topPlannerName = topPlanner
    ? profile.members.find((member) => member.id === topPlanner.memberId)?.name.split(' ')[0] ?? 'one adult'
    : 'one adult';
  const latestMemory = memories[0];

  return (
    <div className="mx-auto max-w-[1180px]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Family overview</p>
          <h1 className="mt-2 font-display text-[clamp(1.6rem,3vw,2.2rem)] font-semibold leading-tight text-ink">
            Good afternoon{profile.members.length
              ? profile.isDemo
                ? ', Al Noor family'
                : `, ${profile.familyName.replace(/ family$/i, '')} family`
              : ''}.
          </h1>
          <p className="mt-1.5 max-w-[62ch] text-sm leading-relaxed text-muted">
            {recommendation
              ? recommendation.rationale
              : 'Complete the family check-in to turn the household signals into a plan.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isPreview ? (
            <LinkButton to="/assessment" size="sm">
              <ClipboardCheck aria-hidden="true" className="h-3.5 w-3.5" />
              Complete the check-in
            </LinkButton>
          ) : (
            <LinkButton to="/results" variant="ghost" size="sm">
              Review the result
              <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
            </LinkButton>
          )}
          <button
            type="button"
            onClick={() => {
              generatePlan();
              pushToast('Plan regenerated from the current signals.');
              navigate('/plan');
            }}
            className="btn-signal btn-sm"
          >
            <Sparkles aria-hidden="true" className="h-3.5 w-3.5" />
            Generate weekly plan
          </button>
        </div>
      </div>

      {isPreview ? (
        <div className="mt-4 flex flex-col gap-2 rounded-control border border-insight/30 bg-insight/[0.06] px-4 py-3 text-[12.5px] text-ink/80 sm:flex-row sm:items-center sm:justify-between">
          <p>
            <span className="font-semibold">Demo preview.</span> These figures use the Al Noor demonstration signals.
            Complete the check-in to replace them with your household’s answers.
          </p>
          <Link to="/assessment" className="shrink-0 font-semibold text-royal">
            Start check-in
          </Link>
        </div>
      ) : null}

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
        <section className="card flex flex-col items-center p-5 text-center">
          <p className="stat-label">Household Harmony Score</p>
          <div className="mt-3">
            <ScoreRing score={activeResult.score} statusLabel={activeResult.statusLabel} size={168} />
          </div>
          <p className="mt-3 text-[12.5px] leading-relaxed text-muted">{activeResult.statusDescription}</p>
          <div className="mt-4 grid w-full grid-cols-2 gap-2">
            <div className="rounded-control bg-canvas p-2.5">
              <p className="text-lg font-semibold tabular-nums text-ink">3</p>
              <p className="text-[10.5px] leading-tight text-muted">day connection streak</p>
            </div>
            <div className="rounded-control bg-canvas p-2.5">
              <p className="text-lg font-semibold tabular-nums text-ink">{careDone}/{careTotal}</p>
              <p className="text-[10.5px] leading-tight text-muted">care routines completed</p>
            </div>
          </div>
          <Link
            to={result ? '/results' : '/assessment'}
            className="mt-3 text-[11.5px] font-semibold text-royal"
          >
            {result ? 'See how the score was calculated' : 'Run the check-in to replace this preview'}
          </Link>
        </section>

        <div className="grid gap-3 sm:grid-cols-2">
          <MetricCard
            label="Best next action"
            value={recommendation ? `${recommendation.durationMinutes} min` : 'Check-in'}
            hint={recommendation?.title ?? 'Start with the eight-question family check-in.'}
            icon={<Sparkles aria-hidden="true" className="h-4 w-4" />}
          />
          <MetricCard
            label="Responsibility balance"
            value={`${balance.reduce((total, row) => total + row.planning, 0)} planning`}
            hint="Planning tasks concentrate with one adult this week."
            icon={<Scale aria-hidden="true" className="h-4 w-4" />}
          />
          <MetricCard
            label="Quality time planned"
            value={`${qualityTime * 30} min`}
            hint={`${qualityTime} family moments in the next days.`}
            icon={<Users aria-hidden="true" className="h-4 w-4" />}
          />
          <MetricCard
            label="Weekly progress"
            value={`${planDone}/${plan.actions.length}`}
            hint="Actions completed without a competitive score or streak pressure."
            icon={<TrendingUp aria-hidden="true" className="h-4 w-4" />}
          />
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <section className="card p-5 lg:col-span-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-base font-semibold text-ink">Today’s family signal</h2>
              <p className="mt-1 text-[12px] text-muted">One connected pattern, not a list of alerts.</p>
            </div>
            <span className="pill">Wednesday overlap</span>
          </div>
          <p className="mt-3 font-display text-[15px] font-semibold leading-snug text-ink">
            Exam pressure and sleep inconsistency overlap on Wednesday.
          </p>
          <p className="mt-2 text-[13px] leading-relaxed text-muted">
            Two Grade 11 assessments fall within three days, the same evening carries a household task, and rest
            timing has varied by more than 90 minutes this week. The household does not need another notification —
            it needs one evening rearranged.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link to="/schedule" className="btn-ghost btn-sm">
              Review Wednesday
              <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
            </Link>
            <Link to="/student" className="btn-quiet btn-sm">
              Open Student Support
            </Link>
          </div>
          {recommendation ? (
            <div className="mt-4">
              <ExplainabilityPanel
                title="Why this pattern is being shown"
                factors={[
                  { label: 'Signals used', value: recommendation.signals.join(' · ') },
                  { label: 'Category', value: `${recommendation.category} · priority 1` },
                  { label: 'Suggested time', value: `${recommendation.durationMinutes} minutes` },
                  { label: 'Control', value: 'Family reviews before anything changes' },
                ]}
                logic={recommendation.rationale}
                action={recommendation.description}
                control="Any member can edit the day, duration, or participants — or reject the suggestion."
                alternative="Defer the task to the weekend and keep Wednesday free of chores."
              />
            </div>
          ) : null}
        </section>

        <section className="card p-5">
          <h2 className="font-display text-base font-semibold text-ink">Best next action</h2>
          <p className="mt-1 text-[12px] text-muted">Small enough to do tonight.</p>
          <div className="mt-3 rounded-control border border-gold/30 bg-gold/[0.06] p-3.5">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#7a4d00]">
              Suggested · {recommendation?.durationMinutes ?? 10} minutes
            </p>
            <p className="mt-1 text-[13.5px] font-semibold leading-snug text-ink">
              {recommendation?.title ?? 'Hold a ten-minute check-in after dinner'}
            </p>
            <p className="mt-1.5 text-[12px] leading-relaxed text-muted">
              {recommendation?.description ?? 'Each person shares one pressure and one request.'}
            </p>
          </div>
          <div className="mt-3 space-y-2">
            <button
              type="button"
              onClick={() => {
                generatePlan();
                pushToast('Action added to the weekly plan.');
                navigate('/plan');
              }}
              className="btn-ghost btn-sm w-full"
            >
              <CalendarDays aria-hidden="true" className="h-3.5 w-3.5" />
              Add to family plan
            </button>
            <Link to="/coach" className="btn-quiet btn-sm w-full">
              Ask the coach about this
            </Link>
          </div>
        </section>

        <section className="card p-5">
          <h2 className="font-display text-base font-semibold text-ink">Household mood trend</h2>
          <p className="mt-1 text-[12px] text-muted">Seven-day household-level index. No individual entries.</p>
          <div className="mt-3">
            <TrendChart
              data={DEMO_MOOD_TREND}
              title="Household steadiness"
              description="Composed from consented household summaries only. Higher indicates a steadier week."
            />
          </div>
        </section>

        <section className="card p-5">
          <h2 className="font-display text-base font-semibold text-ink">Responsibility balance</h2>
          <p className="mt-1 text-[12px] text-muted">Visible tasks and planning work, counted separately.</p>
          <div className="mt-4">
            <StackedBars rows={balance} members={profile.members} />
          </div>
          <Link to="/schedule" className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-semibold text-royal">
            Open schedule and rebalance
            <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
          </Link>
        </section>

        <section className="card p-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="font-display text-base font-semibold text-ink">Care continuity</h2>
              <p className="mt-1 text-[12px] text-muted">
                {grandmother ? `${grandmother.name.split(' ')[0]}’s routines` : 'Care routines'}
              </p>
            </div>
            <HeartHandshake aria-hidden="true" className="h-4 w-4 text-royal" />
          </div>
          <ul className="mt-3 space-y-2">
            {reminders.slice(0, 4).map((reminder) => (
              <li key={reminder.id} className="flex items-center justify-between gap-2 rounded-control border border-border px-2.5 py-2">
                <div className="min-w-0">
                  <p className="truncate text-[12.5px] font-medium text-ink">{reminder.label}</p>
                  <p className="text-[11px] text-muted">
                    {reminder.time} · {reminder.status === 'done' ? 'Completed' : reminder.status === 'later' ? 'Remind later' : 'Pending'}
                  </p>
                </div>
                {reminder.status !== 'done' ? (
                  <button
                    type="button"
                    onClick={() => {
                      updateReminder(reminder.id, { status: 'done' });
                      pushToast('Care routine marked complete.');
                    }}
                    className="inline-flex min-h-[34px] shrink-0 items-center gap-1 rounded-full border border-border px-2.5 text-[11px] font-semibold text-ink"
                  >
                    <Check aria-hidden="true" className="h-3 w-3" />
                    Confirm
                  </button>
                ) : (
                  <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-success">
                    <Check aria-hidden="true" className="h-3 w-3" /> Done
                  </span>
                )}
              </li>
            ))}
          </ul>
          <Link to="/care" className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-semibold text-royal">
            Open care mode
            <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
          </Link>
        </section>

        <section className="card p-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="font-display text-base font-semibold text-ink">Student support</h2>
              <p className="mt-1 text-[12px] text-muted">Shared with the student’s consent.</p>
            </div>
            <Moon aria-hidden="true" className="h-4 w-4 text-royal" />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-control bg-canvas p-2.5">
              <p className="text-[10.5px] uppercase tracking-wide text-muted">Exam countdown</p>
              <p className="text-lg font-semibold tabular-nums text-ink">2 days</p>
            </div>
            <div className="rounded-control bg-canvas p-2.5">
              <p className="text-[10.5px] uppercase tracking-wide text-muted">Wednesday load</p>
              <p className="text-lg font-semibold tabular-nums text-ink">{studentLoad ? `${Math.round(studentLoad.minutes / 60)}h` : '—'}</p>
            </div>
          </div>
          <p className="mt-3 text-[12.5px] leading-relaxed text-muted">
            Protected study block 17:00–19:00. Recommended break: 20:00, ten minutes away from screens.
          </p>
          <Link to="/student" className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-semibold text-royal">
            Open student mode
            <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
          </Link>
        </section>

        <section className="card p-5">
          <h2 className="font-display text-base font-semibold text-ink">Upcoming family activities</h2>
          <p className="mt-1 text-[12px] text-muted">Protected time, not another task list.</p>
          <ul className="mt-3 space-y-2">
            {upcoming.map((event) => (
              <li key={event.id} className="flex items-start gap-2.5 rounded-control border border-border px-2.5 py-2">
                <Clock aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-royal" />
                <div className="min-w-0">
                  <p className="truncate text-[12.5px] font-medium text-ink">{event.title}</p>
                  <p className="text-[11px] text-muted">
                    {event.day} · {event.start}–{event.end} · {EVENT_CATEGORY_LABELS[event.category]}
                  </p>
                </div>
              </li>
            ))}
            {upcoming.length === 0 ? (
              <li className="rounded-control border border-dashed border-border px-2.5 py-3 text-[12px] text-muted">
                No family activity is scheduled. A 15-minute walk is enough to start.
              </li>
            ) : null}
          </ul>
          <Link to="/plan" className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-semibold text-royal">
            Open the weekly plan
            <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
          </Link>
        </section>

        <section className="card p-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="font-display text-base font-semibold text-ink">Family strength</h2>
              <p className="mt-1 text-[12px] text-muted">From the Memory Vault</p>
            </div>
            <BookHeart aria-hidden="true" className="h-4 w-4 text-royal" />
          </div>
          {latestMemory ? (
            <div className="mt-3 rounded-control border border-teal/25 bg-teal/[0.05] p-3">
              <p className="text-[13px] font-semibold text-ink">{latestMemory.title}</p>
              <p className="mt-1 text-[12px] leading-relaxed text-muted">{latestMemory.message}</p>
              <p className="mt-2 text-[10.5px] uppercase tracking-wide text-muted">
                {latestMemory.type.replace('-', ' ')} · {latestMemory.date}
              </p>
            </div>
          ) : (
            <p className="mt-3 text-[12.5px] text-muted">No memories yet. Add one small win to begin.</p>
          )}
          <p className="mt-3 text-[12px] leading-relaxed text-muted">
            {strength.label} is the strongest category this week ({strength.score}). Protecting it matters as much
            as fixing what is low.
          </p>
          <Link to="/memories" className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-semibold text-royal">
            Open the Memory Vault
            <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
          </Link>
        </section>

        <section className="card p-5">
          <h2 className="font-display text-base font-semibold text-ink">Weekly progress</h2>
          <p className="mt-1 text-[12px] text-muted">Completed actions, without a competitive score.</p>
          <div className="mt-3">
            <div className="flex items-center justify-between text-[12px] text-muted">
              <span>
                {planDone} of {plan.actions.length} complete
              </span>
              <span className="font-semibold text-ink">
                {plan.actions.length ? Math.round((planDone / plan.actions.length) * 100) : 0}%
              </span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-canvas">
              <div
                className="bar-fill h-full rounded-full bg-success"
                style={{ width: `${plan.actions.length ? (planDone / plan.actions.length) * 100 : 0}%` }}
              />
            </div>
          </div>
          <ul className="mt-3 space-y-1.5">
            {plan.actions.slice(0, 3).map((action) => (
              <li key={action.id} className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => togglePlanAction(action.id)}
                  aria-pressed={action.status === 'done'}
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition ${
                    action.status === 'done' ? 'border-success bg-success text-white' : 'border-border text-transparent hover:border-royal'
                  }`}
                >
                  <Check aria-hidden="true" className="h-3 w-3" />
                  <span className="sr-only">
                    Mark “{action.title}” {action.status === 'done' ? 'incomplete' : 'complete'}
                  </span>
                </button>
                <span className={`text-[12px] ${action.status === 'done' ? 'text-muted line-through' : 'text-ink'}`}>
                  {action.day} · {action.title}
                </span>
              </li>
            ))}
          </ul>
          <Link to="/plan" className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-semibold text-royal">
            Review all actions
            <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
          </Link>
        </section>

        <section className="card flex flex-col justify-between p-5 lg:col-span-2">
          <div>
            <h2 className="font-display text-base font-semibold text-ink">Household responsibility snapshot</h2>
            <p className="mt-1 text-[12px] text-muted">
              {balance.length} members · {schedule.length} scheduled events · planning concentrated with{' '}
              {topPlannerName}.
            </p>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {profile.members.map((member) => (
              <span key={member.id} className="pill">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: member.avatarColor }} aria-hidden="true" />
                {memberName(profile, member.id)}
              </span>
            ))}
          </div>
          <Link to="/schedule" className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-semibold text-royal">
            Optimise the schedule
            <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
          </Link>
        </section>
      </div>
    </div>
  );
}
