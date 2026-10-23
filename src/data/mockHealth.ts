/*
 * ✏️ TEAM: edit everything here — 30 days of BP + fasting-glucose readings
 * for Grandma Mariam, generated deterministically (same story every load).
 * Three deliberate anomalies for the AI to catch:
 *   🔺 21 days ago — BP spike 158/96 (salty weekend majlis, story-wise)
 *   🔺 12 days ago — glucose spike 196 mg/dL
 *   🔺 4 days ago  — BP 152/94 + glucose 171 (recent — dashboard should care)
 * Baseline around 126±4 / 81±3, glucose 112–124 (managed type-2 diabetes).
 */
import { addDaysToKey, todayKey } from '@/lib/dates';
import type { HealthReading } from '@/types';

/** Index 0 = 29 days ago … index 29 = today. [systolic, diastolic, glucose] */
const OVERRIDES: Record<number, [number, number, number]> = {
  8: [158, 96, 138], // 21 days ago — BP spike
  17: [131, 83, 196], // 12 days ago — glucose spike
  25: [152, 94, 171], // 4 days ago — combined spike
};

export function buildMockHealth(memberId = 'member-mariam', days = 30): HealthReading[] {
  const today = todayKey();
  const readings: HealthReading[] = [];
  for (let i = 0; i < days; i++) {
    const date = addDaysToKey(today, -(days - 1 - i));
    const wave = Math.round(3.5 * Math.sin(i / 3.1));
    const jitter = ((i * 7) % 5) - 2;
    let systolic = 126 + wave + jitter;
    let diastolic = 81 + Math.round(2 * Math.sin(i / 2.7)) + ((i * 3) % 3) - 1;
    let glucose = 117 + Math.round(5 * Math.sin(i / 4.3)) + ((i * 11) % 7) - 3;
    const override = OVERRIDES[i];
    if (override) [systolic, diastolic, glucose] = override;
    readings.push({
      id: `health-${memberId}-${date}`,
      memberId,
      date,
      systolic,
      diastolic,
      glucoseMgDl: glucose,
    });
  }
  return readings;
}

/** Ready-made demo set (regenerated fresh at seed/reset time). */
export const mockHealth: HealthReading[] = buildMockHealth();
