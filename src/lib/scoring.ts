import { ASSESSMENT_QUESTIONS, STATUS_COPY } from '@/data/questions';
import type {
  AssessmentAnswers,
  AssessmentOption,
  AssessmentQuestion,
  AssessmentResult,
  CategoryScore,
  StatusId,
} from '@/types';

export const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));

export function optionFor(question: AssessmentQuestion, value?: string): AssessmentOption | undefined {
  return question.options.find((option) => option.value === value);
}

export function isAnswerComplete(answers: AssessmentAnswers): boolean {
  return ASSESSMENT_QUESTIONS.every((question) => Boolean(answers[question.id]));
}

export function answeredCount(answers: AssessmentAnswers): number {
  return ASSESSMENT_QUESTIONS.filter((question) => Boolean(answers[question.id])).length;
}

export function statusFor(score: number): StatusId {
  if (score >= 80) return 'strong';
  if (score >= 60) return 'stable';
  if (score >= 40) return 'attention';
  return 'priority';
}

export function statusLabel(score: number): string {
  return STATUS_COPY[statusFor(score)].label;
}

const CATEGORY_DEFINITION: {
  id: CategoryScore['id'];
  label: string;
  scales: AssessmentQuestion['scale'][];
  positive: string;
  attention: string;
}[] = [
  {
    id: 'connection',
    label: 'Connection',
    scales: ['familyTime', 'communication'],
    positive: 'The household still makes room to talk and to spend deliberate time together.',
    attention: 'Shared time and open conversation are thin this week. One short, reliable moment matters more than a long one.',
  },
  {
    id: 'balance',
    label: 'Responsibility Balance',
    scales: ['tasks', 'stress'],
    positive: 'Responsibilities look reasonably shared, which keeps household pressure distributed.',
    attention: 'Planning and chores lean toward one person. Rebalancing one recurring task is the smallest useful step.',
  },
  {
    id: 'student',
    label: 'Student Support',
    scales: ['student', 'rest'],
    positive: 'Study pressure appears manageable and recovery time is available.',
    attention: 'Study pressure and recovery overlap. Protect preparation time instead of adding activities.',
  },
  {
    id: 'care',
    label: 'Care Continuity',
    scales: ['care', 'routines'],
    positive: 'Care routines and family habits are holding steadily.',
    attention: 'A routine slipped. A named backup keeps continuity without turning care into surveillance.',
  },
  {
    id: 'rest',
    label: 'Rest and Recovery',
    scales: ['rest', 'stress'],
    positive: 'Sleep and recovery routines look steady across the household.',
    attention: 'Rest is inconsistent. An earlier protected evening is more useful than another reminder.',
  },
];

function categoryBand(score: number): 'strong' | 'steady' | 'attention' {
  if (score >= 75) return 'strong';
  if (score >= 55) return 'steady';
  return 'attention';
}

function buildCategoryScores(answers: AssessmentAnswers): CategoryScore[] {
  return CATEGORY_DEFINITION.map((definition) => {
    const questions = ASSESSMENT_QUESTIONS.filter((question) => definition.scales.includes(question.scale));
    const severities: number[] = [];

    questions.forEach((question) => {
      const option = optionFor(question, answers[question.id]);
      if (!option) return;
      const max = Math.max(...question.options.map((item) => item.deduction), 1);
      severities.push(max === 0 ? 0 : option.deduction / max);
    });

    const average = severities.length
      ? severities.reduce((total, value) => total + value, 0) / severities.length
      : 0;
    const score = Math.round(clamp(100 - average * 85, 12, 100));
    const band = categoryBand(score);
    const summary =
      band === 'attention'
        ? definition.attention
        : band === 'steady'
          ? `${definition.positive} One small adjustment would keep it steady.`
          : definition.positive;

    return { id: definition.id, label: definition.label, score, summary };
  });
}

const STRENGTH_COPY: Partial<Record<AssessmentQuestion['scale'], string>> = {
  familyTime: 'Family time is still happening — the habit exists to build on.',
  communication: 'Family members can generally raise important topics with each other.',
  tasks: 'Household responsibilities are not concentrated on one person.',
  student: 'Study pressure is currently manageable for the student who shared it.',
  care: 'Care routines are holding, and support is responsive.',
  routines: 'Family routines held this week, which protects stability.',
  rest: 'Rest and recovery are reasonably balanced across the household.',
  stress: 'Household stress is at a level the family can still work with.',
};

const SIGNAL_COPY: Partial<Record<AssessmentQuestion['scale'], string>> = {
  familyTime: 'Intentional family time has become rare.',
  communication: 'Important conversations are being delayed or avoided.',
  tasks: 'Household planning sits with too few people.',
  student: 'Academic pressure is high and overlaps other responsibilities.',
  care: 'An older-adult routine has been missed.',
  routines: 'Family routines are slipping, which makes the week feel less predictable.',
  rest: 'Sleep and recovery are inconsistent.',
  stress: 'Household stress is elevated across several areas.',
};

export function computeAssessment(answers: AssessmentAnswers, note?: string): AssessmentResult {
  const deductions: AssessmentResult['deductions'] = [];
  const strengths: string[] = [];
  const signals: string[] = [];
  let total = 0;

  ASSESSMENT_QUESTIONS.forEach((question) => {
    const option = optionFor(question, answers[question.id]);
    if (!option) return;
    total += option.deduction;
    if (option.deduction > 0) {
      deductions.push({
        label: question.prompt.replace(/\?$/, ''),
        amount: option.deduction,
        answer: option.label,
      });
    }
    const max = Math.max(...question.options.map((item) => item.deduction), 1);
    const severity = option.deduction / max;
    if (severity <= 0.34 && STRENGTH_COPY[question.scale]) strengths.push(STRENGTH_COPY[question.scale]!);
    if (severity >= 0.5 && SIGNAL_COPY[question.scale]) signals.push(SIGNAL_COPY[question.scale]!);
  });

  const score = Math.round(clamp(100 - total));
  const status = statusFor(score);
  const copy = STATUS_COPY[status];

  return {
    score,
    status,
    statusLabel: copy.label,
    statusDescription: copy.description,
    categories: buildCategoryScores(answers),
    deductions,
    strengths: [...new Set(strengths)].slice(0, 3),
    signals: [...new Set(signals)].slice(0, 4),
    completedAt: new Date().toISOString(),
    note: note?.trim() || undefined,
  };
}

export function scoreSummary(result: AssessmentResult) {
  const weakest = [...result.categories].sort((a, b) => a.score - b.score)[0];
  const strongest = [...result.categories].sort((a, b) => b.score - a.score)[0];
  return {
    weakest,
    strongest,
    sentence:
      result.status === 'strong'
        ? `The household reports a strong foundation. ${strongest.label} is the clearest strength; the family can protect it while making one small improvement.`
        : result.status === 'stable'
          ? `The household is generally steady. ${weakest.label} needs the most attention this week, while ${strongest.label} is worth protecting.`
          : result.status === 'attention'
            ? `Several signals overlap this week. ${weakest.label} is the area where one coordinated action will help most.`
            : `Pressure is concentrated in more than one area. Start with one action in ${weakest.label}, agreed together, rather than trying to fix everything.`,
  };
}
