import type {
  AssessmentResult,
  HouseholdProfile,
  PlanAction,
  Recommendation,
  WeeklyPlan,
} from '@/types';

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function memberName(profile: HouseholdProfile, id: string): string {
  return profile.members.find((member) => member.id === id)?.name.split(' ')[0] ?? 'A family member';
}

interface RuleContext {
  result: AssessmentResult;
  profile: HouseholdProfile;
}

type Rule = (ctx: RuleContext) => Recommendation | null;

const categoryScore = (result: AssessmentResult, id: string) =>
  result.categories.find((category) => category.id === id)?.score ?? 100;

const memberId = (profile: HouseholdProfile, role: string) =>
  profile.members.find((member) => member.role === role)?.id;

const rules: Rule[] = [
  ({ result, profile }) => {
    const student = memberId(profile, 'Student');
    if (categoryScore(result, 'student') >= 70 && categoryScore(result, 'rest') >= 70) return null;
    return {
      id: 'rec-study-block',
      title: 'Protect a study block and move one chore',
      description:
        'Hold a 90-minute study block before 20:00 and move one non-urgent household task away from that evening.',
      rationale:
        'Study pressure is high while recovery is inconsistent. Adding another activity would compete with preparation, so the plan removes a competing task instead.',
      signals: ['Student pressure elevated', 'Rest inconsistent', 'Responsibilities overlap on the same evening'],
      durationMinutes: 90,
      category: 'student',
      participants: [student ?? 'student', memberId(profile, 'Father') ?? 'father'].filter(Boolean),
      benefit: 'Fewer competing demands on the night before an assessment.',
      priority: 1,
      day: 'Wednesday',
    };
  },
  ({ result, profile }) => {
    if (categoryScore(result, 'connection') >= 72) return null;
    return {
      id: 'rec-checkin',
      title: 'Ten-minute family check-in after dinner',
      description: 'Each person shares one pressure and one small request. Phones stay off the table.',
      rationale:
        'Intentional family time is limited and conversations are described as slower to start. A short, repeated moment is easier to sustain than a long meeting.',
      signals: ['Limited intentional family time', 'Communication could start earlier'],
      durationMinutes: 10,
      category: 'connection',
      participants: profile.members.slice(0, 5).map((member) => member.id),
      benefit: 'Earlier visibility of small pressures, before they become the week’s problem.',
      priority: 2,
      day: 'Monday',
    };
  },
  ({ result, profile }) => {
    if (categoryScore(result, 'care') >= 75) return null;
    const older = profile.members.find((member) => member.ageGroup === 'older-adult');
    if (!older) return null;
    return {
      id: 'rec-care-backup',
      title: 'Assign a care backup and a family call',
      description:
        'Name one backup person for the routine that was missed, and keep a 15-minute family call in the same week.',
      rationale:
        'One care routine was missed and no backup is currently assigned. Naming a backup keeps continuity without monitoring the person’s private day.',
      signals: ['Care routine missed', 'No backup assigned'],
      durationMinutes: 15,
      category: 'care',
      participants: [older.id, memberId(profile, 'Father') ?? profile.members[0]?.id].filter(Boolean) as string[],
      benefit: 'Routine continuity with a named person instead of an alert.',
      priority: 3,
      day: 'Thursday',
    };
  },
  ({ result, profile }) => {
    if (categoryScore(result, 'balance') >= 70) return null;
    return {
      id: 'rec-rebalance',
      title: 'Move one recurring planning task to a second adult',
      description: 'Hand over one planning task this week — a list, an order, or an appointment — and review it together.',
      rationale:
        'Responsibilities are uneven, and planning work is the least visible part. Recurring tasks rebalance more reliably than one-off chores.',
      signals: ['Task distribution uneven', 'Planning concentrated on one person'],
      durationMinutes: 20,
      category: 'balance',
      participants: profile.members.filter((member) => member.ageGroup === 'adult').map((member) => member.id),
      benefit: 'Roughly two hours of weekly planning pressure redistributed.',
      priority: 4,
      day: 'Tuesday',
    };
  },
  ({ result, profile }) => {
    if (categoryScore(result, 'rest') >= 72 && result.score >= 70) return null;
    return {
      id: 'rec-family-walk',
      title: 'Thirty-minute family walk with a weather alternative',
      description: 'Use the shared Friday window. Indoor alternative: shared tea and a photo or story review.',
      rationale:
        'The week holds an open shared window, and quality time is the lowest-effort way to raise connection without adding a task.',
      signals: ['Quality time limited', 'Shared Friday window available'],
      durationMinutes: 30,
      category: 'connection',
      participants: profile.members.map((member) => member.id),
      benefit: 'Thirty minutes of protected family time that is not about chores or exams.',
      priority: 5,
      day: 'Friday',
    };
  },
  ({ result, profile }) => {
    if (result.status === 'strong') return null;
    return {
      id: 'rec-reflection',
      title: 'Short reflection and next-week planning',
      description: 'Add one memory to the vault, then agree on no more than two priorities for the coming week.',
      rationale:
        'Pressure is spread across several areas. A brief reflection keeps the plan realistic and lets the family notice what already worked.',
      signals: ['Household stress elevated', 'Several signals need attention'],
      durationMinutes: 15,
      category: 'connection',
      participants: profile.members.map((member) => member.id),
      benefit: 'A steady weekly rhythm instead of a new set of resolutions.',
      priority: 6,
      day: 'Sunday',
    };
  },
];

export function buildRecommendations(result: AssessmentResult, profile: HouseholdProfile): Recommendation[] {
  return rules
    .map((rule) => rule({ result, profile }))
    .filter((item): item is Recommendation => Boolean(item))
    .sort((a, b) => a.priority - b.priority);
}

const DAY_TITLES: Record<string, string> = {
  Monday: 'A short check-in to open the week',
  Tuesday: 'Share one planning task',
  Wednesday: 'Protect study time, move one chore',
  Thursday: 'Care routine with a named backup',
  Friday: 'Shared family time',
  Saturday: 'Responsibility reset',
  Sunday: 'Reflect and plan lightly',
};

export function recommendationToPlanAction(rec: Recommendation, day: string): PlanAction {
  return {
    id: `plan-${rec.id}`,
    day,
    title: rec.title,
    detail: rec.description,
    why: rec.rationale,
    minutes: rec.durationMinutes,
    participants: rec.participants,
    category: rec.category,
    status: 'open',
    source: 'generated',
  };
}

export function buildWeeklyPlan(
  result: AssessmentResult | null,
  profile: HouseholdProfile,
  priorities: string[] = profile.goals,
): WeeklyPlan {
  const recommendations = result
    ? buildRecommendations(result, profile)
    : defaultRecommendations(profile);

  const actions: PlanAction[] = [];
  const perDay: Record<string, number> = {};

  recommendations.forEach((rec, index) => {
    const preferred = rec.day ?? DAYS[index % DAYS.length];
    const day = pickDay(preferred, perDay, result?.score ?? 60);
    perDay[day] = (perDay[day] ?? 0) + 1;
    actions.push({
      ...recommendationToPlanAction(rec, day),
      title: result ? rec.title : DAY_TITLES[day] ?? rec.title,
    });
  });

  return {
    weekLabel: 'This week',
    actions,
    generatedAt: new Date().toISOString(),
    priorities: priorities.slice(0, 3) as WeeklyPlan['priorities'],
    maxDailyMinutes: profile.preferences.maxDailyMinutes,
  };
}

function pickDay(preferred: string, perDay: Record<string, number>, score: number): string {
  const limit = Math.max(1, Math.min(2, Math.ceil(score / 45)));
  if ((perDay[preferred] ?? 0) < limit) return preferred;
  const alternative = DAYS.find((day) => (perDay[day] ?? 0) === 0);
  return alternative ?? preferred;
}

function defaultRecommendations(profile: HouseholdProfile): Recommendation[] {
  return [
    {
      id: 'default-checkin',
      title: 'Ten-minute family check-in after dinner',
      description: 'Each person shares one pressure and one small request.',
      rationale: 'A short, repeated moment makes small pressures easier to notice early.',
      signals: ['No assessment completed yet', 'Household preferences used'],
      durationMinutes: 10,
      category: 'connection',
      participants: profile.members.map((member) => member.id),
      benefit: 'One reliable moment of contact in the week.',
      priority: 1,
      day: 'Monday',
    },
    {
      id: 'default-balance',
      title: 'Share one recurring household task',
      description: 'Choose one task that repeats and give it a second owner.',
      rationale: 'Recurring tasks rebalance more reliably than one-off chores.',
      signals: ['No assessment completed yet', 'Household preferences used'],
      durationMinutes: 20,
      category: 'balance',
      participants: profile.members.filter((member) => member.ageGroup === 'adult').map((member) => member.id),
      benefit: 'Less planning pressure on one person.',
      priority: 2,
      day: 'Tuesday',
    },
    {
      id: 'default-walk',
      title: 'Shared family time in an available window',
      description: 'Use the next shared window for a walk, a meal, or a story review.',
      rationale: 'Shared time is the simplest lever for connection and needs little planning.',
      signals: ['No assessment completed yet', 'Available shared time'],
      durationMinutes: 30,
      category: 'connection',
      participants: profile.members.map((member) => member.id),
      benefit: 'Protected time that is not about tasks.',
      priority: 3,
      day: 'Friday',
    },
  ];
}

export function reduceWorkloadWorkload(plan: WeeklyPlan): WeeklyPlan {
  const seenDays = new Set<string>();
  const actions = plan.actions
    .filter((action) => {
      if (seenDays.has(action.day)) return false;
      seenDays.add(action.day);
      return true;
    })
    .map((action) => (action.minutes > 30 ? { ...action, minutes: 30 } : action));
  return { ...plan, actions };
}
