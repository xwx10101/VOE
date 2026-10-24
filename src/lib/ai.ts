import type { AssessmentResult, CoachResponse, HouseholdProfile, Recommendation } from '@/types';
import { buildRecommendations } from '@/lib/recommendations';
import { classifyMessage, CRISIS_RESPONSE, sanitizeText, SENSITIVE_NOTE } from '@/lib/safety';

export interface CoachRequest {
  message: string;
  profile: HouseholdProfile;
  result: AssessmentResult | null;
  scenarioId?: string;
}

export interface CoachProvider {
  id: string;
  label: string;
  available: boolean;
  respond: (request: CoachRequest) => Promise<CoachResponse>;
}

const firstName = (fullName: string) => fullName.split(' ')[0];

interface ScenarioTemplate {
  id: string;
  match: RegExp;
  build: (ctx: CoachRequest, recs: Recommendation[]) => Omit<CoachResponse, 'id'>;
}

const topRec = (recs: Recommendation[], category: string) =>
  recs.find((rec) => rec.category === category) ?? recs[0];

const SCENARIOS: ScenarioTemplate[] = [
  {
    id: 'exam-stress',
    match: /(exam|assessment|study|school pressure|test|grades|revision)/i,
    build: ({ profile }, recs) => {
      const student = profile.members.find((member) => member.role === 'Student');
      const rec = topRec(recs, 'student');
      return {
        reflection: `It sounds as if exam pressure is spreading into the rest of the week, and nobody wants to add another obligation on top of it.${
          student ? ` ${firstName(student.name)} is carrying the academic load, and the household feels it too.` : ''
        }`,
        pattern:
          'Study pressure is high while sleep and recovery are inconsistent. The same evening carries preparation and household responsibilities, so the pressure compounds instead of easing.',
        todayAction: {
          title: 'Ten-minute check-in after dinner',
          detail: 'Each person shares one pressure and one small request. Keep it short and do not solve anything tonight — just listen.',
          minutes: 10,
          day: 'Today',
        },
        weekSteps: [
          'Protect a 90-minute study block before 20:00, with phones outside the room.',
          'Move one non-urgent household task off the assessment evening.',
          'Agree a fixed wind-down time so the evening does not run into the next morning.',
        ],
        conversationStarter: 'What is one thing we can remove from this week to make it more manageable?',
        whyItHelps:
          'Short, predictable contact lowers the sense that pressure has to be carried alone, and moving one task reduces genuine time conflict rather than adding encouragement on top of it.',
        safetyNote: rec ? undefined : SENSITIVE_NOTE,
      };
    },
  },
  {
    id: 'no-time',
    match: /(not spend|no time|together|quality time|busy week|family time)/i,
    build: () => ({
      reflection:
        'It sounds as if the week is full of tasks and short on the moments that make the household feel like a family rather than a schedule.',
      pattern:
        'Intentional family time happened only once this week, while the calendar still holds one open shared window. The need is not for more time — it is for protected time.',
      todayAction: {
        title: 'Fifteen minutes, no phones, at the table',
        detail: 'One question each: what went well today, and what felt heavy? Then stop. Ending on time is what makes it repeatable.',
        minutes: 15,
        day: 'Today',
      },
      weekSteps: [
        'Put the next shared window in the calendar as a family event, not a task.',
        'Keep one ritual that survives a busy week — a Friday walk or a shared meal.',
        'Move, rather than cancel, family time when something urgent appears.',
      ],
      conversationStarter: 'When did we last have a conversation that was not about the plan for tomorrow?',
      whyItHelps:
        'Short and reliable beats long and occasional. A protected moment that keeps happening is what changes how the week feels.',
    }),
  },
  {
    id: 'one-person',
    match: /(one person|most (of the )?(household )?tasks|unfair|chores|balance|planning)/i,
    build: ({ profile }) => {
      const adult = profile.members.find((member) => member.role === 'Mother') ?? profile.members[0];
      return {
        reflection: `It sounds as if a great deal of the household runs through one person — and much of that work is planning rather than visible chores. ${
          adult ? `${firstName(adult.name)} may be carrying the part nobody sees.` : ''
        }`,
        pattern:
          'Responsibility is uneven, and planning tasks concentrate more than visible ones. That asymmetry is what makes the imbalance feel larger than the chore list suggests.',
        todayAction: {
          title: 'Hand over one recurring planning task today',
          detail: 'Pick a list, an order, or an appointment. The other person owns it fully this week — including remembering it.',
          minutes: 20,
          day: 'Today',
        },
        weekSteps: [
          'List the invisible work: reminders, lists, appointments, and the person who tracks them.',
          'Move one recurring item permanently, not just this week.',
          'Review the split at the weekend for five minutes, and adjust only one thing.',
        ],
        conversationStarter: 'Which part of the week feels heaviest to carry, and what could someone else take over fully?',
        whyItHelps:
          'Recurring tasks, not one-off chores, create the sense of fairness. Moving one recurring item changes the pattern; adding a single favour does not.',
      };
    },
  },
  {
    id: 'missed-care',
    match: /(grandmother|grandfather|older|care|medication|reminder.*missed|missed.*reminder)/i,
    build: ({ profile }) => {
      const older = profile.members.find((member) => member.ageGroup === 'older-adult');
      return {
        reflection: `A missed routine is unsettling precisely because it matters. This is a coordination gap, not a failure of care.${
          older ? ` ${firstName(older.name)}’s routine deserves a plan that does not depend on one person remembering.` : ''
        }`,
        pattern:
          'One care routine was missed and no backup is assigned. Continuity currently rests on a single person’s availability.',
        todayAction: {
          title: 'Name a backup for the next routine',
          detail: `${older ? firstName(older.name) : 'The family member'} and the backup agree together who steps in if the primary person is unavailable. Keep it to one routine for now.`,
          minutes: 10,
          day: 'Today',
        },
        weekSteps: [
          'Confirm which routines need support, with the person’s own agreement.',
          'Assign one named backup — not a group chat message.',
          'Keep a simple completion note so continuity is visible without monitoring anyone’s private day.',
        ],
        conversationStarter: 'Which routine would you like more support with, and who would you like as the backup?',
        whyItHelps:
          'A named backup removes the single point of failure and keeps the person in control of who is involved in their routine.',
      };
    },
  },
  {
    id: 'arguments',
    match: /(argument|argue|conflict|fight|shouting|escalat)/i,
    build: () => ({
      reflection:
        'It sounds as if important conversations are starting at the wrong moment, when everyone is already tired — and then ending somewhere nobody intended.',
      pattern:
        'Conversations are described as becoming difficult, and they usually land in the busiest part of the evening. The topic is often not the real problem; the timing is.',
      todayAction: {
        title: 'Move one conversation to a calmer ten minutes',
        detail: 'Open with what you noticed rather than what is wrong: “I noticed the evenings feel tense. Can we talk for ten minutes tomorrow after dinner?”',
        minutes: 10,
        day: 'Today',
      },
      weekSteps: [
        'Agree one rule: no important conversation after 21:00.',
        'Start with one request each, not a list of grievances.',
        'End with one thing each person will do — small enough to actually happen.',
      ],
      conversationStarter: 'What would make it easier to raise something difficult without it becoming a conflict?',
      whyItHelps:
        'Short, timed conversations with one request each reduce escalation, and a shared time limit gives everyone an exit without withdrawing.',
      safetyNote: SENSITIVE_NOTE,
    }),
  },
  {
    id: 'disconnected',
    match: /(disconnected|lonely|left out|withdrawn|not included|ignored)/i,
    build: ({ profile }) => {
      const teen = profile.members.find((member) => member.ageGroup === 'teen');
      return {
        reflection: `Feeling disconnected inside a busy family is common, and it is rarely about a lack of love. It is usually about the absence of a small, predictable moment.${
          teen ? ` ${firstName(teen.name)} may not say it directly.` : ''
        }`,
        pattern:
          'Shared time is limited and most contact happens around logistics. Connection is currently left to chance rather than protected.',
        todayAction: {
          title: 'One-to-one time, ten minutes, no agenda',
          detail: 'Ask about something unrelated to school or chores, and let the conversation end when it ends.',
          minutes: 10,
          day: 'Today',
        },
        weekSteps: [
          'Protect one short one-to-one moment per person this week.',
          'Ask about interests rather than responsibilities.',
          'Offer a low-pressure invitation and accept a no without consequence.',
        ],
        conversationStarter: 'What is something you have been thinking about that you have not had a chance to say?',
        whyItHelps:
          'Connection is built in small, repeated moments rather than one large family gesture. One-to-one contact is often easier to accept than a group activity.',
      };
    },
  },
  {
    id: 'overloaded',
    match: /(overload|too much|packed|no break|burn(ed|t) out|exhausted|schedule)/i,
    build: ({ profile }) => ({
      reflection:
        'It sounds as if the week is at capacity, and the honest problem is not motivation — it is that nothing has been removed.',
      pattern:
        'Three or more days carry committed events with little recovery space. Adding an activity now would increase pressure rather than connection.',
      todayAction: {
        title: 'Remove one item from the week',
        detail: 'Choose the least consequential task and cancel, defer, or hand it over. If nothing can move, shorten it to fifteen minutes instead.',
        minutes: 15,
        day: 'Today',
      },
      weekSteps: [
        'Name the three highest-priority commitments and let the rest wait a week.',
        'Protect one recovery block after the densest day.',
        'Keep at most one wellbeing action per day, not two.',
      ],
      conversationStarter: 'What can we take out of this week so that we are not just surviving it?',
      whyItHelps:
        'Reducing load is more effective than adding a coping activity. A plan that removes something is more likely to be followed than one that adds more.',
      safetyNote: profile.preferences.maxDailyMinutes ? undefined : SENSITIVE_NOTE,
    }),
  },
];

function fallbackBuild({ message }: CoachRequest): Omit<CoachResponse, 'id'> {
  return {
    reflection: `Thank you for raising this openly. It takes something to name a family pressure instead of letting it sit.`,
    pattern:
      'Based on the assessment signals, the strongest lever this week is a short, consistent moment of contact alongside one task that can be moved rather than added.',
    todayAction: {
      title: 'Ten-minute check-in after dinner',
      detail: `Keep it to one round of sharing. You mentioned: “${sanitizeText(message, 120)}” — start there if it feels safe to.`,
      minutes: 10,
      day: 'Today',
    },
    weekSteps: [
      'Move one non-urgent task off the busiest evening.',
      'Protect one shared window for time that is not about tasks.',
      'Review together what helped, and drop what did not.',
    ],
    conversationStarter: 'What would make this week feel even slightly lighter for everyone?',
    whyItHelps:
      'Small, repeated actions are easier to sustain than a large plan, and they give the family evidence about what actually helps.',
  };
}

function localResponse(request: CoachRequest): CoachResponse {
  const level = classifyMessage(request.message);

  if (level === 'crisis') {
    return {
      id: `crisis-${Date.now()}`,
      isSafetyResponse: true,
      reflection: CRISIS_RESPONSE,
      pattern: 'FamilyMind AI has stopped ordinary coaching for this message.',
      todayAction: {
        title: 'Contact immediate, human support',
        detail:
          'If someone is in immediate danger, contact local emergency services, a trusted adult, or a qualified professional now.',
        minutes: 0,
        day: 'Now',
      },
      weekSteps: [
        'Involve a qualified professional rather than a family plan.',
        'Keep the person accompanied by someone they trust.',
        'Return to ordinary planning only when the situation is safe and supported.',
      ],
      conversationStarter: 'Who is the safest person to contact right now?',
      whyItHelps: 'Crisis situations need human, qualified support. Family organisation tools are not designed for them.',
      safetyNote: SENSITIVE_NOTE,
    };
  }

  const recs = request.result
    ? buildRecommendations(request.result, request.profile)
    : buildRecommendations({ ...emptyResult, score: 60 } as AssessmentResult, request.profile);

  const scenario =
    SCENARIOS.find((item) => item.id === request.scenarioId) ??
    SCENARIOS.find((item) => item.match.test(request.message));

  const built = scenario ? scenario.build(request, recs) : fallbackBuild(request);
  const safetyNote =
    built.safetyNote ?? (level === 'sensitive' ? SENSITIVE_NOTE : built.safetyNote);

  return {
    ...built,
    id: `coach-${scenario?.id ?? 'fallback'}`,
    safetyNote,
  };
}

const emptyResult = {
  score: 60,
  categories: [],
  strengths: [],
  signals: [],
  deductions: [],
  status: 'stable',
  statusLabel: 'Stable with Opportunities',
  statusDescription: '',
  completedAt: new Date().toISOString(),
} as unknown as AssessmentResult;

export const localProvider: CoachProvider = {
  id: 'local-deterministic',
  label: 'On-device rules engine',
  available: true,
  respond: async (request) => localResponse(request),
};

/**
 * Optional remote provider. Disabled by default: no keys are read on the client,
 * and no request is ever made. A real deployment would call a backend proxy.
 */
export const remoteProvider: CoachProvider = {
  id: 'remote-proxy',
  label: 'Remote model via server proxy',
  available: false,
  respond: async (request) => localProvider.respond(request),
};

export function getProvider(): CoachProvider {
  return remoteProvider.available ? remoteProvider : localProvider;
}

export async function requestCoachResponse(request: CoachRequest): Promise<CoachResponse> {
  const provider = getProvider();
  try {
    return await provider.respond(request);
  } catch {
    return localProvider.respond(request);
  }
}

export function responseToPlainText(response: CoachResponse): string {
  return [
    response.reflection,
    '',
    `Pattern: ${response.pattern}`,
    '',
    `Today (${response.todayAction.minutes} min): ${response.todayAction.title} — ${response.todayAction.detail}`,
    '',
    'This week:',
    ...response.weekSteps.map((step) => `• ${step}`),
    '',
    `Conversation starter: “${response.conversationStarter}”`,
    '',
    `Why this may help: ${response.whyItHelps}`,
    response.safetyNote ? `\nSafety note: ${response.safetyNote}` : '',
  ]
    .join('\n')
    .trim();
}

/** Simulated streaming with an abort-safe interval, never a fragile timeout chain. */
export function streamText(
  text: string,
  onChunk: (partial: string) => void,
  options: { intervalMs?: number; chunkSize?: number } = {},
): () => void {
  const interval = options.intervalMs ?? 18;
  const chunkSize = options.chunkSize ?? 4;
  let index = 0;
  const timer = window.setInterval(() => {
    index = Math.min(text.length, index + chunkSize);
    onChunk(text.slice(0, index));
    if (index >= text.length) window.clearInterval(timer);
  }, interval);
  return () => window.clearInterval(timer);
}
