import type { AssessmentQuestion, GoalId } from '@/types';

export const ASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
  {
    id: 'q1',
    scale: 'familyTime',
    prompt: 'How often did your family intentionally connect this week?',
    helper: 'Think about time set aside on purpose — a meal, a walk, a shared activity.',
    options: [
      { value: 'fourPlus', label: 'Four or more times', hint: 'A consistent rhythm this week', deduction: 0 },
      { value: 'twoThree', label: 'Two or three times', hint: 'Some shared moments held', deduction: 5 },
      { value: 'once', label: 'Once', hint: 'One moment this week', deduction: 11 },
      { value: 'none', label: 'Not this week', hint: 'No intentional time together', deduction: 18 },
    ],
  },
  {
    id: 'q2',
    scale: 'stress',
    prompt: 'How would you describe overall household stress?',
    helper: 'A shared impression from the household, not one person’s private state.',
    options: [
      { value: 'low', label: 'Low', hint: 'The week felt manageable', deduction: 0 },
      { value: 'moderate', label: 'Moderate', hint: 'Busy, but mostly steady', deduction: 8 },
      { value: 'high', label: 'High', hint: 'Several pressures overlapped', deduction: 18 },
      { value: 'overwhelming', label: 'Overwhelming', hint: 'The week felt hard to carry', deduction: 28 },
    ],
  },
  {
    id: 'q3',
    scale: 'communication',
    prompt: 'How comfortable do family members feel starting important conversations?',
    helper: 'Consider whether people can raise a concern without delay or argument.',
    options: [
      { value: 'strong', label: 'Strong — conversations happen early', deduction: 0 },
      { value: 'comfortable', label: 'Generally comfortable', deduction: 6 },
      { value: 'limited', label: 'Limited — topics are avoided', deduction: 14 },
      { value: 'difficult', label: 'Very difficult — conversations escalate', deduction: 22 },
    ],
  },
  {
    id: 'q4',
    scale: 'tasks',
    prompt: 'How fairly are household responsibilities distributed?',
    helper: 'Count invisible planning work as well as visible chores.',
    options: [
      { value: 'fair', label: 'Fair', deduction: 0 },
      { value: 'slightlyUneven', label: 'Slightly uneven', deduction: 6 },
      { value: 'uneven', label: 'Uneven', deduction: 13 },
      { value: 'concentrated', label: 'Highly concentrated on one person', deduction: 20 },
    ],
  },
  {
    id: 'q5',
    scale: 'student',
    prompt: 'Is a student currently experiencing study pressure?',
    helper: 'Only what the student has agreed to share with the household.',
    options: [
      { value: 'none', label: 'Not at the moment', deduction: 0 },
      { value: 'moderate', label: 'Moderate', deduction: 5 },
      { value: 'high', label: 'High — assessments overlap', deduction: 12 },
      { value: 'severe', label: 'Severe — daily strain', deduction: 18 },
    ],
  },
  {
    id: 'q6',
    scale: 'care',
    prompt: 'Does an older family member need routine support?',
    helper: 'Medication, hydration, movement, appointments, or a regular call.',
    options: [
      { value: 'fullySupported', label: 'No support needed or fully supported', deduction: 0 },
      { value: 'occasionalMissed', label: 'Occasionally missed routine', deduction: 7 },
      { value: 'repeatedMissed', label: 'Repeated missed routines', deduction: 15 },
    ],
  },
  {
    id: 'q7',
    scale: 'routines',
    prompt: 'Were important family routines missed this week?',
    helper: 'Bedtime, study start, shared meals, care reminders — any routine the family values.',
    options: [
      { value: 'none', label: 'No — routines held', deduction: 0 },
      { value: 'one', label: 'One routine was missed', deduction: 4 },
      { value: 'several', label: 'A few routines slipped', deduction: 8 },
      { value: 'many', label: 'Most routines were disrupted', deduction: 12 },
    ],
  },
  {
    id: 'q8',
    scale: 'rest',
    prompt: 'How balanced are sleep and recovery across the household?',
    helper: 'A non-medical household impression of rest this week.',
    options: [
      { value: 'good', label: 'Good', deduction: 0 },
      { value: 'inconsistent', label: 'Inconsistent', deduction: 5 },
      { value: 'poor', label: 'Poor', deduction: 12 },
    ],
  },
];

export const GOALS: { id: GoalId; label: string; detail: string }[] = [
  { id: 'communicate', label: 'Communicate more openly', detail: 'Start important conversations earlier.' },
  { id: 'balance', label: 'Balance household responsibilities', detail: 'Share visible and invisible work.' },
  { id: 'student', label: 'Support exam wellbeing', detail: 'Protect study time and recovery.' },
  { id: 'care', label: 'Improve older-adult care consistency', detail: 'Keep routines steady with backup.' },
  { id: 'rest', label: 'Protect rest and sleep', detail: 'Build a calmer evening rhythm.' },
  { id: 'time', label: 'Create more quality time', detail: 'Hold time that is not about tasks.' },
];

export const EVENT_CATEGORY_LABELS: Record<string, string> = {
  work: 'Work',
  school: 'School',
  study: 'Study',
  household: 'Household',
  family: 'Family time',
  rest: 'Rest',
  care: 'Older adult care',
  health: 'Health routine',
};

export const STATUS_COPY = {
  strong: {
    label: 'Strong Foundation',
    description: 'Most signals are steady. The focus is protecting what already works.',
  },
  stable: {
    label: 'Stable with Opportunities',
    description: 'The household is holding together, with a few clear places to improve.',
  },
  attention: {
    label: 'Needs Attention',
    description: 'Several signals overlap this week. A small, coordinated plan will help most.',
  },
  priority: {
    label: 'Priority Support',
    description: 'Pressure is high across more than one area. Start small, and involve the family in every choice.',
  },
} as const;
