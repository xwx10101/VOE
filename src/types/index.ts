export type AgeGroup = 'child' | 'teen' | 'adult' | 'older-adult';

export type MemberRole =
  | 'Father'
  | 'Mother'
  | 'Student'
  | 'Child'
  | 'Grandmother'
  | 'Grandfather'
  | 'Guardian'
  | 'Other';

export interface ConsentPreference {
  /** Member appears in consented household summaries. */
  shareSummary: boolean;
  /** Member may receive household plan assignments. */
  receivePlanActions: boolean;
  /** Member's private journal entries are never included in summaries. */
  keepJournalPrivate: true;
}

export interface FamilyMember {
  id: string;
  name: string;
  role: MemberRole;
  ageGroup: AgeGroup;
  age?: number;
  avatarColor: string;
  accessibility?: string[];
  consent: ConsentPreference;
  /** Short, consented description used in household views. */
  note?: string;
}

export type GoalId =
  | 'communicate'
  | 'balance'
  | 'student'
  | 'care'
  | 'rest'
  | 'time';

export interface HouseholdProfile {
  familyName: string;
  members: FamilyMember[];
  goals: GoalId[];
  preferences: {
    reminderStyle: 'gentle' | 'scheduled' | 'minimal';
    preferredActivities: string[];
    sharedTimes: string[];
    maxDailyMinutes: 15 | 30 | 45;
    accessibility: string[];
  };
  createdAt: string;
  isDemo: boolean;
}

export type ScaleKey = 'stress' | 'communication' | 'familyTime' | 'tasks' | 'student' | 'care' | 'routines' | 'rest';

export interface AssessmentOption {
  value: string;
  label: string;
  hint?: string;
  deduction: number;
}

export interface AssessmentQuestion {
  id: string;
  scale: ScaleKey;
  prompt: string;
  helper: string;
  options: AssessmentOption[];
}

export type AssessmentAnswers = Record<string, string | undefined>;

export interface CategoryScore {
  id: 'connection' | 'balance' | 'student' | 'care' | 'rest';
  label: string;
  score: number;
  summary: string;
}

export type StatusId = 'strong' | 'stable' | 'attention' | 'priority';

export interface AssessmentResult {
  score: number;
  status: StatusId;
  statusLabel: string;
  statusDescription: string;
  categories: CategoryScore[];
  deductions: { label: string; amount: number; answer: string }[];
  strengths: string[];
  signals: string[];
  completedAt: string;
  note?: string;
}

export interface FamilySignal {
  id: string;
  title: string;
  detail: string;
  severity: 'strength' | 'watch' | 'attention';
  source: string;
  relatedMembers: string[];
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  rationale: string;
  signals: string[];
  durationMinutes: number;
  category: 'connection' | 'balance' | 'student' | 'care' | 'rest';
  participants: string[];
  benefit: string;
  priority: number;
  day?: string;
}

export type EventCategory =
  | 'work'
  | 'school'
  | 'study'
  | 'household'
  | 'family'
  | 'rest'
  | 'care'
  | 'health';

export interface ScheduleEvent {
  id: string;
  title: string;
  day: string;
  start: string;
  end: string;
  category: EventCategory;
  ownerId: string;
  backupId?: string;
  locked?: boolean;
  note?: string;
  completed?: boolean;
}

export type ProposalKind = 'move' | 'assign-backup' | 'protect-rest' | 'add-family-time' | 'rebalance';

export interface ScheduleProposal {
  id: string;
  kind: ProposalKind;
  title: string;
  reason: string;
  eventId?: string;
  memberId?: string;
  from?: { day: string; start: string };
  to?: { day: string; start: string };
  newEvent?: Omit<ScheduleEvent, 'id'>;
  affects: string[];
}

export interface Reminder {
  id: string;
  memberId: string;
  label: string;
  time: string;
  kind: 'medication' | 'hydration' | 'movement' | 'family-call' | 'appointment' | 'memory';
  status: 'pending' | 'done' | 'later';
  backupId?: string;
}

export type PlanStatus = 'open' | 'done';

export interface PlanAction {
  id: string;
  day: string;
  title: string;
  detail: string;
  why: string;
  minutes: number;
  participants: string[];
  category: Recommendation['category'] | 'care' | 'connection';
  status: PlanStatus;
  source: 'generated' | 'coach' | 'custom';
}

export interface WeeklyPlan {
  weekLabel: string;
  actions: PlanAction[];
  generatedAt: string;
  priorities: GoalId[];
  maxDailyMinutes: number;
}

export interface MemoryEntry {
  id: string;
  type: 'gratitude' | 'achievement' | 'kind-message' | 'tradition' | 'weekly-win' | 'story' | 'photo-memory';
  title: string;
  message: string;
  date: string;
  memberTags: string[];
  visibility: 'private' | 'selected' | 'household';
  createdAt: string;
}

export interface CoachAction {
  title: string;
  detail: string;
  minutes: number;
  day: string;
}

export interface CoachResponse {
  id: string;
  reflection: string;
  pattern: string;
  todayAction: CoachAction;
  weekSteps: string[];
  conversationStarter: string;
  whyItHelps: string;
  safetyNote?: string;
  isSafetyResponse?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'family' | 'coach';
  content: string;
  response?: CoachResponse;
  pending?: boolean;
  error?: boolean;
}

export interface DemoStep {
  id: string;
  label: string;
  headline: string;
  notes: string;
}

export interface ToastMessage {
  id: string;
  title: string;
  tone: 'success' | 'info' | 'error';
}
