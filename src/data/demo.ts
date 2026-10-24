import type {
  AssessmentAnswers,
  FamilyMember,
  FamilySignal,
  HouseholdProfile,
  MemoryEntry,
  PlanAction,
  Reminder,
  ScheduleEvent,
  WeeklyPlan,
} from '@/types';

const consent = (shareSummary = true, receivePlanActions = true) =>
  ({ shareSummary, receivePlanActions, keepJournalPrivate: true as const });

export const DEMO_MEMBERS: FamilyMember[] = [
  {
    id: 'omar',
    name: 'Omar Al Noor',
    role: 'Father',
    ageGroup: 'adult',
    age: 44,
    avatarColor: '#29BEFD',
    consent: consent(),
    note: 'Busy work schedule. Wants to protect family time and steady household coordination.',
  },
  {
    id: 'mariam',
    name: 'Mariam Al Noor',
    role: 'Mother',
    ageGroup: 'adult',
    age: 41,
    avatarColor: '#A259EA',
    consent: consent(),
    note: 'Balances work, household planning and care. Wants a fairer distribution of responsibilities.',
  },
  {
    id: 'zayed',
    name: 'Zayed Al Noor',
    role: 'Student',
    ageGroup: 'teen',
    age: 16,
    avatarColor: '#47E6C1',
    consent: consent(),
    note: 'Grade 11. Two assessments in three days. Wants to manage exam pressure and sleep.',
  },
  {
    id: 'latifa',
    name: 'Latifa Al Noor',
    role: 'Child',
    ageGroup: 'child',
    age: 12,
    avatarColor: '#FFB000',
    consent: consent(),
    note: 'Grade 7. Building a steadier homework and sleep routine.',
  },
  {
    id: 'fatima',
    name: 'Fatima Al Noor',
    role: 'Grandmother',
    ageGroup: 'older-adult',
    age: 70,
    avatarColor: '#E63946',
    consent: consent(),
    note: 'Values routine consistency, movement and regular family calls.',
  },
];

export const DEMO_PROFILE: HouseholdProfile = {
  familyName: 'Al Noor',
  members: DEMO_MEMBERS,
  goals: ['communicate', 'care', 'student', 'time', 'balance'],
  preferences: {
    reminderStyle: 'gentle',
    preferredActivities: ['Walk', 'Shared meal', 'Short check-in', 'Story or memory'],
    sharedTimes: ['Weekdays after dinner', 'Friday evening', 'Saturday afternoon'],
    maxDailyMinutes: 30,
    accessibility: ['Large text for older adult'],
  },
  createdAt: '2026-10-19T08:00:00.000Z',
  isDemo: true,
};

/** Deterministic demo assessment: 100 − 55 = 45 → Needs Attention. */
export const DEMO_ANSWERS: AssessmentAnswers = {
  q1: 'once',
  q2: 'moderate',
  q3: 'comfortable',
  q4: 'slightlyUneven',
  q5: 'high',
  q6: 'occasionalMissed',
  q7: 'none',
  q8: 'inconsistent',
};

export const DEMO_NOTE = 'Wednesday feels overloaded. A calmer evening and one shared meal would help.';

export const DEMO_SIGNALS: FamilySignal[] = [
  {
    id: 'sig-exam',
    title: 'Exam pressure overlaps a chore evening',
    detail: 'Two Grade 11 assessments sit within three days, and Wednesday also carries a household task.',
    severity: 'attention',
    source: 'Assessment · schedule',
    relatedMembers: ['zayed', 'omar'],
  },
  {
    id: 'sig-time',
    title: 'One family moment this week',
    detail: 'Intentional family time happened once, on Friday evening. The Friday window is still open.',
    severity: 'watch',
    source: 'Assessment · shared calendar',
    relatedMembers: ['omar', 'mariam', 'latifa', 'zayed', 'fatima'],
  },
  {
    id: 'sig-care',
    title: 'One care routine slipped',
    detail: 'Fatima’s evening routine was missed once. No backup is currently assigned.',
    severity: 'watch',
    source: 'Care routines',
    relatedMembers: ['fatima', 'mariam'],
  },
  {
    id: 'sig-balance',
    title: 'One person carries most planning',
    detail: 'Mariam owns four of seven planning tasks. Visible chores are shared more evenly.',
    severity: 'watch',
    source: 'Responsibility balance',
    relatedMembers: ['mariam'],
  },
  {
    id: 'sig-rest',
    title: 'Sleep timing is inconsistent',
    detail: 'Household rest patterns vary by more than 90 minutes across the week.',
    severity: 'watch',
    source: 'Assessment · household summary',
    relatedMembers: ['zayed', 'latifa'],
  },
  {
    id: 'sig-strength',
    title: 'Care participation is consistent',
    detail: 'Family care contributions held steady — this is a strength to protect.',
    severity: 'strength',
    source: 'Care routines',
    relatedMembers: ['omar', 'mariam', 'latifa'],
  },
];

export const DEMO_PLAN_ACTIONS: PlanAction[] = [
  {
    id: 'plan-mon',
    day: 'Monday',
    title: '10-minute family check-in after dinner',
    detail: 'Each person shares one pressure and one small request. No phones at the table.',
    why: 'Communication is described as generally comfortable, but intentional family time happened only once. A short, reliable moment is easier to keep than a long meeting.',
    minutes: 10,
    participants: ['omar', 'mariam', 'zayed', 'latifa', 'fatima'],
    category: 'connection',
    status: 'open',
    source: 'generated',
  },
  {
    id: 'plan-tue',
    day: 'Tuesday',
    title: 'Share grocery planning between Mariam and Omar',
    detail: 'Omar takes the list and the order; Mariam reviews it. Twenty minutes of planning moves off one person.',
    why: 'Four of seven planning tasks sit with one person. Moving one recurring planning task rebalances invisible work without adding a new activity.',
    minutes: 20,
    participants: ['mariam', 'omar'],
    category: 'balance',
    status: 'open',
    source: 'generated',
  },
  {
    id: 'plan-wed',
    day: 'Wednesday',
    title: 'Protected study block, and the kitchen task moves to Omar',
    detail: 'Study 17:00–19:00, then quiet recovery after 21:00. Omar takes the Wednesday kitchen task.',
    why: 'Two assessments fall within three days and Wednesday contains both a chore and exam preparation. Protecting the study block reduces overlap rather than adding pressure.',
    minutes: 120,
    participants: ['zayed', 'omar'],
    category: 'student',
    status: 'open',
    source: 'generated',
  },
  {
    id: 'plan-thu',
    day: 'Thursday',
    title: 'Family call and memory prompt with Fatima',
    detail: 'A 15-minute call, ending with one story prompt: “Which Eid do you remember most?”',
    why: 'One care routine was missed this week and no backup is assigned. A scheduled call adds connection and continuity at the same time.',
    minutes: 15,
    participants: ['fatima', 'latifa', 'zayed'],
    category: 'care',
    status: 'open',
    source: 'generated',
  },
  {
    id: 'plan-fri',
    day: 'Friday',
    title: '30-minute family walk — indoor alternative ready',
    detail: 'Walk after Asr. If the weather is unsuitable, the indoor option is a shared tea and photo review.',
    why: 'Friday evening contains the only shared, uncommitted window this week. A walk adds quality time without extra planning overhead.',
    minutes: 30,
    participants: ['omar', 'mariam', 'zayed', 'latifa', 'fatima'],
    category: 'connection',
    status: 'open',
    source: 'generated',
  },
  {
    id: 'plan-sat',
    day: 'Saturday',
    title: 'Responsibility reset and shared meal',
    detail: 'Review the week’s tasks together and rebalance one item before the shared meal.',
    why: 'Task distribution is slightly uneven. A short weekly reset keeps the balance from drifting back to one person.',
    minutes: 30,
    participants: ['omar', 'mariam', 'zayed', 'latifa'],
    category: 'balance',
    status: 'open',
    source: 'generated',
  },
  {
    id: 'plan-sun',
    day: 'Sunday',
    title: 'Gratitude reflection and next-week planning',
    detail: 'Add one memory to the vault, then choose at most two priorities for the coming week.',
    why: 'Following one missed care routine, looking back at what held builds continuity without adding pressure.',
    minutes: 15,
    participants: ['omar', 'mariam', 'zayed', 'latifa', 'fatima'],
    category: 'connection',
    status: 'open',
    source: 'generated',
  },
];

export const DEMO_PLAN: WeeklyPlan = {
  weekLabel: 'This week',
  actions: DEMO_PLAN_ACTIONS,
  generatedAt: '2026-10-19T08:00:00.000Z',
  priorities: ['communicate', 'student', 'care'],
  maxDailyMinutes: 30,
};

const WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const DEMO_SCHEDULE: ScheduleEvent[] = [
  { id: 'ev1', title: 'Work — regional planning', day: 'Monday', start: '09:00', end: '17:00', category: 'work', ownerId: 'omar', locked: true },
  { id: 'ev2', title: 'School day', day: 'Monday', start: '08:00', end: '14:00', category: 'school', ownerId: 'zayed', locked: true },
  { id: 'ev3', title: 'Family check-in', day: 'Monday', start: '19:30', end: '19:40', category: 'family', ownerId: 'mariam' },
  { id: 'ev4', title: 'Work', day: 'Tuesday', start: '09:00', end: '17:00', category: 'work', ownerId: 'mariam', locked: true },
  { id: 'ev5', title: 'Grocery planning', day: 'Tuesday', start: '18:00', end: '18:45', category: 'household', ownerId: 'mariam' },
  { id: 'ev6', title: 'Study — physics revision', day: 'Tuesday', start: '19:00', end: '20:30', category: 'study', ownerId: 'zayed' },
  { id: 'ev7', title: 'Assessment — mathematics', day: 'Wednesday', start: '09:30', end: '11:00', category: 'school', ownerId: 'zayed', locked: true },
  { id: 'ev8', title: 'Study — chemistry revision', day: 'Wednesday', start: '17:00', end: '19:00', category: 'study', ownerId: 'zayed' },
  { id: 'ev9', title: 'Kitchen duty', day: 'Wednesday', start: '19:15', end: '20:00', category: 'household', ownerId: 'zayed' },
  { id: 'ev10', title: 'Reading routine', day: 'Wednesday', start: '20:30', end: '21:00', category: 'school', ownerId: 'latifa' },
  { id: 'ev11', title: 'Medication routine', day: 'Thursday', start: '08:00', end: '08:15', category: 'care', ownerId: 'fatima' },
  { id: 'ev12', title: 'Family call with Fatima', day: 'Thursday', start: '17:00', end: '17:20', category: 'family', ownerId: 'mariam' },
  { id: 'ev13', title: 'Work — client review', day: 'Friday', start: '09:00', end: '12:00', category: 'work', ownerId: 'omar', locked: true },
  { id: 'ev14', title: 'Open family window', day: 'Friday', start: '17:00', end: '18:00', category: 'family', ownerId: 'omar' },
  { id: 'ev15', title: 'Shared meal', day: 'Saturday', start: '13:00', end: '14:00', category: 'family', ownerId: 'mariam' },
  { id: 'ev16', title: 'Hydration + movement', day: 'Saturday', start: '10:00', end: '10:20', category: 'health', ownerId: 'fatima' },
  { id: 'ev17', title: 'Weekly planning reset', day: 'Sunday', start: '19:00', end: '19:20', category: 'family', ownerId: 'omar' },
  { id: 'ev18', title: 'Rest and recovery', day: 'Sunday', start: '21:30', end: '22:00', category: 'rest', ownerId: 'zayed' },
];

export const DEMO_WEEK_DAYS = WEEK;

export const DEMO_REMINDERS: Reminder[] = [
  { id: 'r1', memberId: 'fatima', label: 'Morning medication', time: '08:00', kind: 'medication', status: 'done' },
  { id: 'r2', memberId: 'fatima', label: 'Midday hydration', time: '13:00', kind: 'hydration', status: 'pending' },
  { id: 'r3', memberId: 'fatima', label: 'Gentle walk', time: '17:30', kind: 'movement', status: 'done' },
  { id: 'r4', memberId: 'fatima', label: 'Family call', time: '19:00', kind: 'family-call', status: 'later' },
  { id: 'r5', memberId: 'fatima', label: 'Clinic appointment', time: 'Tue 10:00', kind: 'appointment', status: 'pending' },
  { id: 'r6', memberId: 'fatima', label: 'Evening routine (missed Wednesday)', time: '21:00', kind: 'medication', status: 'pending' },
];

export const DEMO_MEMORIES: MemoryEntry[] = [
  {
    id: 'm1',
    type: 'achievement',
    title: 'Latifa’s science presentation',
    message: 'Latifa presented her water-cycle project to the class and answered three questions without notes.',
    date: '2026-10-16',
    memberTags: ['latifa'],
    visibility: 'household',
    createdAt: '2026-10-16T15:00:00.000Z',
  },
  {
    id: 'm2',
    type: 'story',
    title: 'A childhood story from Fatima',
    message: 'Grandmother described the courtyard where she learned to cook, and the neighbour who taught her to bake bread.',
    date: '2026-10-14',
    memberTags: ['fatima', 'latifa'],
    visibility: 'household',
    createdAt: '2026-10-14T19:30:00.000Z',
  },
  {
    id: 'm3',
    type: 'weekly-win',
    title: 'Omar protected Friday family time',
    message: 'Omar moved a work call so the family could walk together before sunset.',
    date: '2026-10-17',
    memberTags: ['omar'],
    visibility: 'household',
    createdAt: '2026-10-17T18:00:00.000Z',
  },
  {
    id: 'm4',
    type: 'gratitude',
    title: 'Mariam asked for support',
    message: 'Mariam asked for help with planning, and two responsibilities were shared the same evening.',
    date: '2026-10-15',
    memberTags: ['mariam', 'omar'],
    visibility: 'household',
    createdAt: '2026-10-15T20:00:00.000Z',
  },
];

/** Household-level mood trend, no individual entries exposed. */
export const DEMO_MOOD_TREND = [
  { label: 'Mon', value: 58, note: 'Busy start' },
  { label: 'Tue', value: 54, note: 'Planning load' },
  { label: 'Wed', value: 43, note: 'Exam overlap' },
  { label: 'Thu', value: 61, note: 'Care routine held' },
  { label: 'Fri', value: 76, note: 'Family walk' },
  { label: 'Sat', value: 79, note: 'Shared meal' },
  { label: 'Sun', value: 72, note: 'Planning reset' },
];

export const DEMO_RESPONSIBILITY = [
  { memberId: 'mariam', visible: 9, planning: 4 },
  { memberId: 'omar', visible: 5, planning: 1 },
  { memberId: 'zayed', visible: 4, planning: 0 },
  { memberId: 'latifa', visible: 3, planning: 1 },
  { memberId: 'fatima', visible: 1, planning: 0 },
];

export const DEMO_IMPACT = [
  { value: '1', label: 'responsibility rebalanced', detail: 'One Wednesday task moves from Zayed to Omar' },
  { value: '2', label: 'study blocks protected', detail: 'Wednesday evening and the weekend before the second assessment' },
  { value: '1', label: 'care backup assigned', detail: 'Omar becomes backup for Fatima’s evening routine' },
  { value: '30', suffix: ' min', label: 'family time planned', detail: 'Friday walk with an indoor alternative' },
  { value: '5', label: 'recommendations explained', detail: 'Each with signals, reasoning and family control' },
];

export const DEMO_COACH_SCENARIOS = [
  { id: 'exam-stress', label: 'My child is stressed about exams' },
  { id: 'no-time', label: 'We do not spend enough time together' },
  { id: 'one-person', label: 'One person handles most household tasks' },
  { id: 'missed-care', label: 'We missed grandmother’s routine reminder' },
  { id: 'arguments', label: 'Important conversations become arguments' },
  { id: 'disconnected', label: 'A family member feels disconnected' },
  { id: 'overloaded', label: 'Our weekly schedule is overloaded' },
];
