/*
 * ✏️ TEAM GUIDE — AI MODULE: Elder-safety anomaly detection.
 * Two complementary signals, both fully offline & explainable:
 *   1) Clinical range rules (clear, doctor-friendly thresholds).
 *   2) Rolling z-score vs the person's own 30-day baseline — catches
 *      "unusual for grandma" even inside the textbook-normal band.
 * Phase 4 builds the alert feed on top of these same functions.
 * ⚠️ Supportive information only — never a diagnosis.
 */
import type { HealthReading } from '@/types';

export type ReadingSeverity = 'normal' | 'attention' | 'alert';
export type SafetyStatus = 'stable' | 'attention' | 'alert' | 'noData';

/** Clinical thresholds (conservative, elder-oriented). */
export const CLINICAL_LIMITS = {
  systolic: { attention: 140, alert: 160 },
  diastolic: { attention: 90, alert: 100 },
  glucoseFasting: { attention: 160, alert: 200 },
} as const;

export interface ReadingEvaluation {
  severity: ReadingSeverity;
  /** Which metrics broke a clinical rule. */
  ruleBreaches: Array<'systolic' | 'diastolic' | 'glucose'>;
  /** z-score per metric vs personal baseline (|z| ≥ 2 = statistically unusual). */
  zScores: { systolic: number; diastolic: number; glucose: number };
  statisticallyUnusual: boolean;
}

function mean(values: number[]): number {
  return values.length ? values.reduce((s, v) => s + v, 0) / values.length : 0;
}

function stdDev(values: number[], avg: number): number {
  if (values.length < 2) return 0;
  const variance = values.reduce((s, v) => s + (v - avg) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function zScore(value: number, baseline: number[]): number {
  const avg = mean(baseline);
  const sd = stdDev(baseline, avg);
  if (sd === 0) return 0;
  return (value - avg) / sd;
}

/**
 * Evaluate one reading against clinical rules + the personal baseline
 * (all other readings passed in `history`, typically the last 30 days).
 */
export function evaluateReading(reading: HealthReading, history: HealthReading[]): ReadingEvaluation {
  const others = history.filter((r) => r.id !== reading.id);
  const breaches: ReadingEvaluation['ruleBreaches'] = [];
  let severity: ReadingSeverity = 'normal';
  const lift = (s: ReadingSeverity) => {
    if (s === 'alert' || (s === 'attention' && severity === 'normal')) severity = s;
  };

  if (reading.systolic >= CLINICAL_LIMITS.systolic.alert) { breaches.push('systolic'); lift('alert'); }
  else if (reading.systolic >= CLINICAL_LIMITS.systolic.attention) { breaches.push('systolic'); lift('attention'); }
  if (reading.diastolic >= CLINICAL_LIMITS.diastolic.alert) { breaches.push('diastolic'); lift('alert'); }
  else if (reading.diastolic >= CLINICAL_LIMITS.diastolic.attention) { breaches.push('diastolic'); lift('attention'); }
  if (reading.glucoseMgDl >= CLINICAL_LIMITS.glucoseFasting.alert) { breaches.push('glucose'); lift('alert'); }
  else if (reading.glucoseMgDl >= CLINICAL_LIMITS.glucoseFasting.attention) { breaches.push('glucose'); lift('attention'); }

  const zScores = {
    systolic: zScore(reading.systolic, others.map((r) => r.systolic)),
    diastolic: zScore(reading.diastolic, others.map((r) => r.diastolic)),
    glucose: zScore(reading.glucoseMgDl, others.map((r) => r.glucoseMgDl)),
  };
  const statisticallyUnusual = Object.values(zScores).some((z) => Math.abs(z) >= 2);
  if (statisticallyUnusual) lift('attention');

  return { severity, ruleBreaches: breaches, zScores, statisticallyUnusual };
}

export interface SafetySummary {
  status: SafetyStatus;
  latest: HealthReading | null;
  /** Number of non-normal days in the last 30 readings. */
  anomalyDays: number;
  /** Average systolic over the window (for trend context). */
  avgSystolic: number;
  avgDiastolic: number;
  avgGlucose: number;
}

/** Summarize a member's recent readings for dashboards & the safety page. */
export function safetySummary(readings: HealthReading[]): SafetySummary {
  if (readings.length === 0) {
    return { status: 'noData', latest: null, anomalyDays: 0, avgSystolic: 0, avgDiastolic: 0, avgGlucose: 0 };
  }
  const sorted = [...readings].sort((a, b) => a.date.localeCompare(b.date));
  const latest = sorted[sorted.length - 1]!;
  const recent7 = sorted.slice(-7);
  let anomalyDays = 0;
  let recentAlert = false;
  let recentAttention = false;
  for (const r of sorted) {
    const ev = evaluateReading(r, sorted);
    if (ev.severity !== 'normal') anomalyDays++;
    if (recent7.includes(r)) {
      if (ev.severity === 'alert') recentAlert = true;
      if (ev.severity === 'attention') recentAttention = true;
    }
  }
  const status: SafetyStatus = recentAlert ? 'alert' : recentAttention ? 'attention' : 'stable';
  return {
    status,
    latest,
    anomalyDays,
    avgSystolic: Math.round(mean(sorted.map((r) => r.systolic))),
    avgDiastolic: Math.round(mean(sorted.map((r) => r.diastolic))),
    avgGlucose: Math.round(mean(sorted.map((r) => r.glucoseMgDl))),
  };
}
