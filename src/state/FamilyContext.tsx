import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type {
  AssessmentAnswers,
  AssessmentResult,
  FamilyMember,
  HouseholdProfile,
  MemoryEntry,
  PlanAction,
  Reminder,
  ScheduleEvent,
  ToastMessage,
  WeeklyPlan,
} from '@/types';
import {
  DEMO_ANSWERS,
  DEMO_MEMORIES,
  DEMO_PLAN,
  DEMO_PROFILE,
  DEMO_REMINDERS,
  DEMO_SCHEDULE,
} from '@/data/demo';
import { computeAssessment } from '@/lib/scoring';
import { buildWeeklyPlan } from '@/lib/recommendations';
import { KEYS, clearAllLocalData, guards, readJSON, removeKey, writeJSON } from '@/lib/storage';

interface FamilyState {
  profile: HouseholdProfile;
  answers: AssessmentAnswers;
  result: AssessmentResult | null;
  plan: WeeklyPlan;
  schedule: ScheduleEvent[];
  memories: MemoryEntry[];
  reminders: Reminder[];
  undoSnapshot: ScheduleEvent[] | null;
  storageOk: boolean;
}

interface FamilyContextValue extends FamilyState {
  toasts: ToastMessage[];
  saveProfile: (profile: HouseholdProfile) => void;
  setAnswer: (questionId: string, value: string) => void;
  resetAnswers: () => void;
  completeAssessment: (note?: string) => AssessmentResult;
  runDemoAssessment: () => AssessmentResult;
  clearResult: () => void;
  generatePlan: () => WeeklyPlan;
  updatePlanAction: (id: string, patch: Partial<PlanAction>) => void;
  togglePlanAction: (id: string) => void;
  addPlanActions: (actions: PlanAction[]) => void;
  regeneratePlanAction: (id: string) => void;
  applyReduceWorkload: () => void;
  resetPlan: () => void;
  setSchedule: (events: ScheduleEvent[]) => void;
  addEvent: (event: Omit<ScheduleEvent, 'id'>) => void;
  updateEvent: (id: string, patch: Partial<ScheduleEvent>) => void;
  deleteEvent: (id: string) => void;
  commitOptimization: (events: ScheduleEvent[]) => void;
  undoOptimization: () => void;
  updateReminder: (id: string, patch: Partial<Reminder>) => void;
  addMemory: (entry: Omit<MemoryEntry, 'id' | 'createdAt'>) => void;
  updateMemory: (id: string, patch: Partial<MemoryEntry>) => void;
  deleteMemory: (id: string) => void;
  resetDemoHousehold: () => void;
  clearLocalData: () => void;
  pushToast: (title: string, tone?: ToastMessage['tone']) => void;
  dismissToast: (id: string) => void;
  memberById: (id: string) => FamilyMember | undefined;
}

const initialState: FamilyState = {
  profile: DEMO_PROFILE,
  answers: {},
  result: null,
  plan: DEMO_PLAN,
  schedule: DEMO_SCHEDULE,
  memories: DEMO_MEMORIES,
  reminders: DEMO_REMINDERS,
  undoSnapshot: null,
  storageOk: true,
};

const FamilyContext = createContext<FamilyContextValue | null>(null);

const uid = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 9)}`;

export function FamilyProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<FamilyState>(initialState);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const timers = useRef<number[]>([]);

  const pushToast = useCallback((title: string, tone: ToastMessage['tone'] = 'success') => {
    const id = uid('toast');
    setToasts((current) => [...current.slice(-2), { id, title, tone }]);
    const timer = window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 4200);
    timers.current.push(timer);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  // Hydrate once on mount.
  useEffect(() => {
    const profile = readJSON<HouseholdProfile>(KEYS.profile, DEMO_PROFILE, (value) =>
      guards.hasMembers(value),
    );
    const assessment = readJSON<{ answers: AssessmentAnswers; result: AssessmentResult | null; note?: string }>(
      KEYS.assessment,
      { answers: {}, result: null },
      (value) => guards.isObject(value),
    );
    const plan = readJSON<WeeklyPlan>(KEYS.plan, DEMO_PLAN, (value) => guards.hasActions(value));
    const schedule = readJSON<ScheduleEvent[]>(KEYS.schedule, DEMO_SCHEDULE, guards.isArray);
    const memories = readJSON<MemoryEntry[]>(KEYS.memories, DEMO_MEMORIES, guards.isArray);
    const reminders = readJSON<Reminder[]>(KEYS.reminders, DEMO_REMINDERS, guards.isArray);

    setState((current) => ({
      ...current,
      profile,
      answers: assessment.answers ?? {},
      result: assessment.result ?? null,
      plan,
      schedule,
      memories,
      reminders,
    }));

    return () => {
      timers.current.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  // Persist profile.
  useEffect(() => {
    const ok = writeJSON(KEYS.profile, state.profile);
    if (!ok) setState((current) => (current.storageOk ? { ...current, storageOk: false } : current));
  }, [state.profile]);

  useEffect(() => {
    writeJSON(KEYS.assessment, { answers: state.answers, result: state.result });
  }, [state.answers, state.result]);

  useEffect(() => {
    writeJSON(KEYS.plan, state.plan);
  }, [state.plan]);

  useEffect(() => {
    writeJSON(KEYS.schedule, state.schedule);
  }, [state.schedule]);

  useEffect(() => {
    writeJSON(KEYS.memories, state.memories);
  }, [state.memories]);

  useEffect(() => {
    writeJSON(KEYS.reminders, state.reminders);
  }, [state.reminders]);

  const saveProfile = useCallback((profile: HouseholdProfile) => {
    setState((current) => ({ ...current, profile }));
  }, []);

  const setAnswer = useCallback((questionId: string, value: string) => {
    setState((current) => ({
      ...current,
      answers: { ...current.answers, [questionId]: value },
    }));
  }, []);

  const resetAnswers = useCallback(() => {
    setState((current) => ({ ...current, answers: {}, result: null }));
  }, []);

  const completeAssessment = useCallback((note?: string) => {
    let computed: AssessmentResult = computeAssessment({}, note);
    setState((current) => {
      computed = computeAssessment(current.answers, note);
      return { ...current, result: computed };
    });
    return computed;
  }, []);

  const runDemoAssessment = useCallback(() => {
    const computed = computeAssessment(DEMO_ANSWERS);
    setState((current) => ({ ...current, answers: { ...DEMO_ANSWERS }, result: computed }));
    return computed;
  }, []);

  const clearResult = useCallback(() => {
    setState((current) => ({ ...current, result: null }));
  }, []);

  const generatePlan = useCallback(() => {
    let plan = DEMO_PLAN;
    setState((current) => {
      const hasCustom = current.plan.actions.length > 0;
      const previousTitles = hasCustom ? current.plan.actions.map((action) => action.title) : [];
      plan = buildWeeklyPlan(current.result, current.profile, current.profile.goals);
      if (previousTitles.length) {
        plan = {
          ...plan,
          actions: plan.actions.map((action, index) => ({
            ...action,
            title: previousTitles[index] ?? action.title,
          })),
        };
      }
      return { ...current, plan };
    });
    return plan;
  }, []);

  const updatePlanAction = useCallback((id: string, patch: Partial<PlanAction>) => {
    setState((current) => ({
      ...current,
      plan: {
        ...current.plan,
        actions: current.plan.actions.map((action) =>
          action.id === id ? { ...action, ...patch } : action,
        ),
      },
    }));
  }, []);

  const togglePlanAction = useCallback((id: string) => {
    setState((current) => ({
      ...current,
      plan: {
        ...current.plan,
        actions: current.plan.actions.map((action) =>
          action.id === id
            ? { ...action, status: action.status === 'done' ? 'open' : 'done' }
            : action,
        ),
      },
    }));
  }, []);

  const addPlanActions = useCallback((actions: PlanAction[]) => {
    setState((current) => {
      const existingTitles = new Set(current.plan.actions.map((action) => action.title));
      const fresh = actions.filter((action) => !existingTitles.has(action.title));
      return {
        ...current,
        plan: { ...current.plan, actions: [...current.plan.actions, ...fresh] },
      };
    });
  }, []);

  const regeneratePlanAction = useCallback((id: string) => {
    setState((current) => {
      const action = current.plan.actions.find((item) => item.id === id);
      if (!action) return current;
      const alternatives: Record<string, string[]> = {
        Monday: ['Shared tea before bed', 'One round of “what felt heavy today?”'],
        Tuesday: ['Walk to the shop together', 'Ten minutes of shared planning'],
        Wednesday: ['Quiet study support, no questions', 'Early wind-down for the household'],
        Thursday: ['Call with a story prompt', 'Photo review from an older album'],
        Friday: ['Indoor board game instead of the walk', 'Shared meal with no phones'],
        Saturday: ['Simple meal prepared together', 'Twenty-minute task rebalance'],
        Sunday: ['Gratitude note in the vault', 'Choose two priorities for the week'],
      };
      const options = alternatives[action.day] ?? ['A shorter version of this action'];
      const nextTitle = options.find((title) => title !== action.title) ?? options[0];
      return {
        ...current,
        plan: {
          ...current.plan,
          actions: current.plan.actions.map((item) =>
            item.id === id ? { ...item, title: nextTitle, status: 'open' as const, source: 'custom' as const } : item,
          ),
        },
      };
    });
  }, []);

  const applyReduceWorkload = useCallback(() => {
    setState((current) => {
      const seenDays = new Set<string>();
      const actions = current.plan.actions
        .filter((action) => {
          if (seenDays.has(action.day)) return false;
          seenDays.add(action.day);
          return true;
        })
        .map((action) =>
          action.minutes > current.plan.maxDailyMinutes
            ? { ...action, minutes: current.plan.maxDailyMinutes }
            : action,
        );
      return { ...current, plan: { ...current.plan, actions } };
    });
  }, []);

  const resetPlan = useCallback(() => {
    setState((current) => ({ ...current, plan: { ...DEMO_PLAN, actions: DEMO_PLAN.actions.map((a) => ({ ...a })) } }));
  }, []);

  const setSchedule = useCallback((events: ScheduleEvent[]) => {
    setState((current) => ({ ...current, schedule: events }));
  }, []);

  const addEvent = useCallback((event: Omit<ScheduleEvent, 'id'>) => {
    setState((current) => ({ ...current, schedule: [...current.schedule, { ...event, id: uid('ev') }] }));
  }, []);

  const updateEvent = useCallback((id: string, patch: Partial<ScheduleEvent>) => {
    setState((current) => ({
      ...current,
      schedule: current.schedule.map((event) => (event.id === id ? { ...event, ...patch } : event)),
    }));
  }, []);

  const deleteEvent = useCallback((id: string) => {
    setState((current) => ({
      ...current,
      schedule: current.schedule.filter((event) => event.id !== id),
      undoSnapshot: current.schedule,
    }));
  }, []);

  const commitOptimization = useCallback((events: ScheduleEvent[]) => {
    setState((current) => ({ ...current, undoSnapshot: current.schedule, schedule: events }));
  }, []);

  const undoOptimization = useCallback(() => {
    setState((current) =>
      current.undoSnapshot ? { ...current, schedule: current.undoSnapshot, undoSnapshot: null } : current,
    );
  }, []);

  const updateReminder = useCallback((id: string, patch: Partial<Reminder>) => {
    setState((current) => ({
      ...current,
      reminders: current.reminders.map((reminder) =>
        reminder.id === id ? { ...reminder, ...patch } : reminder,
      ),
    }));
  }, []);

  const addMemory = useCallback((entry: Omit<MemoryEntry, 'id' | 'createdAt'>) => {
    setState((current) => ({
      ...current,
      memories: [
        { ...entry, id: uid('mem'), createdAt: new Date().toISOString() },
        ...current.memories,
      ],
    }));
  }, []);

  const updateMemory = useCallback((id: string, patch: Partial<MemoryEntry>) => {
    setState((current) => ({
      ...current,
      memories: current.memories.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)),
    }));
  }, []);

  const deleteMemory = useCallback((id: string) => {
    setState((current) => ({ ...current, memories: current.memories.filter((entry) => entry.id !== id) }));
  }, []);

  const resetDemoHousehold = useCallback(() => {
    setState((current) => ({
      ...current,
      profile: { ...DEMO_PROFILE, members: DEMO_PROFILE.members.map((member) => ({ ...member })) },
      answers: {},
      result: null,
      plan: { ...DEMO_PLAN, actions: DEMO_PLAN.actions.map((action) => ({ ...action })) },
      schedule: DEMO_SCHEDULE.map((event) => ({ ...event })),
      memories: DEMO_MEMORIES.map((entry) => ({ ...entry })),
      reminders: DEMO_REMINDERS.map((reminder) => ({ ...reminder })),
      undoSnapshot: null,
      storageOk: true,
    }));
    writeJSON(KEYS.profile, DEMO_PROFILE);
    writeJSON(KEYS.assessment, { answers: {}, result: null });
  }, []);

  const clearLocalData = useCallback(() => {
    clearAllLocalData();
    removeKey(KEYS.assessment);
    setState((current) => ({
      ...current,
      profile: { ...DEMO_PROFILE, familyName: 'Your family', isDemo: false, members: [], goals: [] },
      answers: {},
      result: null,
      plan: { weekLabel: 'This week', actions: [], generatedAt: new Date().toISOString(), priorities: [], maxDailyMinutes: 30 },
      schedule: [],
      memories: [],
      reminders: [],
      undoSnapshot: null,
    }));
  }, []);

  const memberById = useCallback(
    (id: string) => state.profile.members.find((member) => member.id === id),
    [state.profile.members],
  );

  const value = useMemo<FamilyContextValue>(
    () => ({
      ...state,
      toasts,
      saveProfile,
      setAnswer,
      resetAnswers,
      completeAssessment,
      runDemoAssessment,
      clearResult,
      generatePlan,
      updatePlanAction,
      togglePlanAction,
      addPlanActions,
      regeneratePlanAction,
      applyReduceWorkload,
      resetPlan,
      setSchedule,
      addEvent,
      updateEvent,
      deleteEvent,
      commitOptimization,
      undoOptimization,
      updateReminder,
      addMemory,
      updateMemory,
      deleteMemory,
      resetDemoHousehold,
      clearLocalData,
      pushToast,
      dismissToast,
      memberById,
    }),
    [
      state,
      toasts,
      saveProfile,
      setAnswer,
      resetAnswers,
      completeAssessment,
      runDemoAssessment,
      clearResult,
      generatePlan,
      updatePlanAction,
      togglePlanAction,
      addPlanActions,
      regeneratePlanAction,
      applyReduceWorkload,
      resetPlan,
      setSchedule,
      addEvent,
      updateEvent,
      deleteEvent,
      commitOptimization,
      undoOptimization,
      updateReminder,
      addMemory,
      updateMemory,
      deleteMemory,
      resetDemoHousehold,
      clearLocalData,
      pushToast,
      dismissToast,
      memberById,
    ],
  );

  return <FamilyContext.Provider value={value}>{children}</FamilyContext.Provider>;
}

export function useFamily(): FamilyContextValue {
  const context = useContext(FamilyContext);
  if (!context) throw new Error('useFamily must be used inside FamilyProvider');
  return context;
}

export { DEMO_ANSWERS, KEYS };
