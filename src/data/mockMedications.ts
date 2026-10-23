/*
 * ✏️ TEAM: edit everything here — the demo family's medications (10 real-world
 * medicines) plus a deterministic 14-day adherence-history generator.
 * Patterns are intentional: Grandma Mariam is excellent in the morning but
 * sometimes misses her evening Metformin — the risk the app should surface.
 */
import { addDaysToKey, nowMinutes, timeToMinutes, todayKey } from '@/lib/dates';
import type { DoseLogEntry, Medication } from '@/types';

/** Medication start dates are relative so the demo always looks alive. */
const daysAgo = (n: number) => addDaysToKey(todayKey(), -n);

export const mockMedications: Medication[] = [
  {
    id: 'med-mariam-amlodipine',
    memberId: 'member-mariam',
    name: { ar: 'أملوديبين', en: 'Amlodipine' },
    dosage: '5mg',
    form: 'tablet',
    times: ['08:00'],
    asNeeded: false,
    instructions: { ar: 'قرص واحد صباحًا لضغط الدم', en: 'One tablet in the morning for blood pressure' },
    supplyRemaining: 23,
    unitsPerDose: 1,
    startDate: daysAgo(180),
  },
  {
    id: 'med-mariam-metformin',
    memberId: 'member-mariam',
    name: { ar: 'ميتفورمين', en: 'Metformin' },
    dosage: '850mg',
    form: 'tablet',
    times: ['08:00', '20:00'],
    asNeeded: false,
    instructions: { ar: 'مع الإفطار والعشاء للسكري', en: 'With breakfast and dinner for diabetes' },
    supplyRemaining: 17,
    unitsPerDose: 1,
    startDate: daysAgo(180),
  },
  {
    id: 'med-mariam-losartan',
    memberId: 'member-mariam',
    name: { ar: 'لوسارتان', en: 'Losartan' },
    dosage: '50mg',
    form: 'tablet',
    times: ['08:00'],
    asNeeded: false,
    instructions: { ar: 'قرص واحد صباحًا مع الأملوديبين', en: 'One tablet in the morning with Amlodipine' },
    supplyRemaining: 11,
    unitsPerDose: 1,
    startDate: daysAgo(150),
  },
  {
    id: 'med-mariam-aspirin',
    memberId: 'member-mariam',
    name: { ar: 'أسبرين', en: 'Aspirin' },
    dosage: '81mg',
    form: 'tablet',
    times: ['08:00'],
    asNeeded: false,
    instructions: { ar: 'جرعة منخفضة بعد الإفطار لصحة القلب', en: 'Low dose after breakfast for heart health' },
    supplyRemaining: 26,
    unitsPerDose: 1,
    startDate: daysAgo(150),
  },
  {
    id: 'med-mariam-atorvastatin',
    memberId: 'member-mariam',
    name: { ar: 'أتورفاستاتين', en: 'Atorvastatin' },
    dosage: '20mg',
    form: 'tablet',
    times: ['21:00'],
    asNeeded: false,
    instructions: { ar: 'قرص قبل النوم للكوليسترول', en: 'One tablet at bedtime for cholesterol' },
    supplyRemaining: 9,
    unitsPerDose: 1,
    startDate: daysAgo(120),
  },
  {
    id: 'med-ahmed-atorvastatin',
    memberId: 'member-ahmed',
    name: { ar: 'أتورفاستاتين', en: 'Atorvastatin' },
    dosage: '10mg',
    form: 'tablet',
    times: ['21:30'],
    asNeeded: false,
    instructions: { ar: 'قرص مساءً للكوليسترول', en: 'One tablet in the evening for cholesterol' },
    supplyRemaining: 19,
    unitsPerDose: 1,
    startDate: daysAgo(90),
  },
  {
    id: 'med-ahmed-vitamind',
    memberId: 'member-ahmed',
    name: { ar: 'فيتامين د', en: 'Vitamin D3' },
    dosage: '1000 IU',
    form: 'capsule',
    times: ['07:30'],
    asNeeded: false,
    instructions: { ar: 'كبسولة مع الإفطار', en: 'One capsule with breakfast' },
    supplyRemaining: 34,
    unitsPerDose: 1,
    startDate: daysAgo(60),
  },
  {
    id: 'med-omar-montelukast',
    memberId: 'member-omar',
    name: { ar: 'مونتيلوكاست', en: 'Montelukast' },
    dosage: '5mg',
    form: 'tablet',
    times: ['20:00'],
    asNeeded: false,
    instructions: { ar: 'قرص مساءً للوقاية من الربو', en: 'One tablet in the evening for asthma prevention' },
    supplyRemaining: 14,
    unitsPerDose: 1,
    startDate: daysAgo(200),
  },
  {
    id: 'med-omar-ventolin',
    memberId: 'member-omar',
    name: { ar: 'بخاخ فنتولين', en: 'Ventolin Inhaler' },
    dosage: '100mcg',
    form: 'inhaler',
    times: [],
    asNeeded: true,
    instructions: { ar: 'بختان عند الحاجة لضيق التنفس', en: 'Two puffs when needed for wheezing' },
    supplyRemaining: 1,
    unitsPerDose: 1,
    startDate: daysAgo(200),
  },
  {
    id: 'med-fatima-iron',
    memberId: 'member-fatima',
    name: { ar: 'مكمل الحديد', en: 'Iron Supplement' },
    dosage: '65mg',
    form: 'tablet',
    times: ['07:30'],
    asNeeded: false,
    instructions: { ar: 'قرص على معدة فارغة مع فيتامين سي', en: 'One tablet on an empty stomach with vitamin C' },
    supplyRemaining: 21,
    unitsPerDose: 1,
    startDate: daysAgo(45),
  },
  {
    id: 'med-layla-vitamind',
    memberId: 'member-layla',
    name: { ar: 'قطرات فيتامين د', en: 'Vitamin D Drops' },
    dosage: '400 IU',
    form: 'drops',
    times: ['07:45'],
    asNeeded: false,
    instructions: { ar: 'قطرات مع حليب الصباح', en: 'Drops with morning milk' },
    supplyRemaining: 1,
    unitsPerDose: 1,
    startDate: daysAgo(30),
  },
];

/**
 * Deterministic adherence target per medication-slot (0–100).
 * The story: mornings are near-perfect; Mariam evening Metformin slips.
 */
const ADHERENCE_TARGETS: Record<string, number> = {
  'med-mariam-amlodipine': 97,
  'med-mariam-metformin': 96, // morning slot
  'med-mariam-metformin@20:00': 78, // evening slot — the risk to surface
  'med-mariam-losartan': 95,
  'med-mariam-aspirin': 98,
  'med-mariam-atorvastatin': 90,
  'med-ahmed-atorvastatin': 88,
  'med-ahmed-vitamind': 93,
  'med-omar-montelukast': 92,
  'med-fatima-iron': 94,
  'med-layla-vitamind': 99,
};

/** Stable pseudo-random 0–99 from a string seed (same history on every load). */
function seededRoll(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h) % 100;
}

/**
 * Build 14 days of dose history ending today. Today's future slots are left
 * unlogged (= pending); past slots roll against the adherence target.
 */
export function generateMockDoseLog(medications: Medication[], days = 14): DoseLogEntry[] {
  const log: DoseLogEntry[] = [];
  const today = todayKey();
  const now = nowMinutes();
  for (const med of medications) {
    if (med.asNeeded) continue;
    for (let back = days - 1; back >= 0; back--) {
      const date = addDaysToKey(today, -back);
      for (const time of med.times) {
        if (date === today && timeToMinutes(time) > now) continue; // still pending
        const target =
          ADHERENCE_TARGETS[`${med.id}@${time}`] ?? ADHERENCE_TARGETS[med.id] ?? 92;
        const taken = seededRoll(`${med.id}|${date}|${time}`) < target;
        log.push({
          id: `dose-${med.id}-${date}-${time}`,
          medicationId: med.id,
          date,
          time,
          status: taken ? 'taken' : 'missed',
        });
      }
    }
  }
  return log;
}
