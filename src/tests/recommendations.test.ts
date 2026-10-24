import { describe, expect, it } from 'vitest';
import { DEMO_ANSWERS, DEMO_PROFILE } from '@/data/demo';
import { computeAssessment } from '@/lib/scoring';
import {
  DAYS,
  buildRecommendations,
  buildWeeklyPlan,
  memberName,
  recommendationToPlanAction,
} from '@/lib/recommendations';

const demoResult = computeAssessment(DEMO_ANSWERS);

describe('recommendation engine', () => {
  it('returns prioritised recommendations connected to signals', () => {
    const recommendations = buildRecommendations(demoResult, DEMO_PROFILE);
    expect(recommendations.length).toBeGreaterThanOrEqual(3);
    recommendations.forEach((rec) => {
      expect(rec.rationale.length).toBeGreaterThan(30);
      expect(rec.signals.length).toBeGreaterThan(0);
      expect(rec.durationMinutes).toBeGreaterThan(0);
      expect(rec.benefit.length).toBeGreaterThan(10);
      expect(rec.participants.length).toBeGreaterThan(0);
    });
    const priorities = recommendations.map((rec) => rec.priority);
    expect(priorities).toEqual([...priorities].sort((a, b) => a - b));
  });

  it('is deterministic', () => {
    expect(buildRecommendations(demoResult, DEMO_PROFILE)).toEqual(
      buildRecommendations(demoResult, DEMO_PROFILE),
    );
  });

  it('always includes a student support action for the demo household', () => {
    const recommendations = buildRecommendations(demoResult, DEMO_PROFILE);
    expect(recommendations.some((rec) => rec.category === 'student')).toBe(true);
  });

  it('converts a recommendation into a plan action with an explanation', () => {
    const recommendation = buildRecommendations(demoResult, DEMO_PROFILE)[0];
    const action = recommendationToPlanAction(recommendation, 'Wednesday');
    expect(action.day).toBe('Wednesday');
    expect(action.minutes).toBe(recommendation.durationMinutes);
    expect(action.why).toBe(recommendation.rationale);
    expect(action.status).toBe('open');
  });

  it('never schedules more than two actions on one day', () => {
    const plan = buildWeeklyPlan(demoResult, DEMO_PROFILE);
    const counts = plan.actions.reduce<Record<string, number>>((total, action) => {
      total[action.day] = (total[action.day] ?? 0) + 1;
      return total;
    }, {});
    Object.values(counts).forEach((count) => expect(count).toBeLessThanOrEqual(2));
    plan.actions.forEach((action) => {
      expect(DAYS).toContain(action.day);
      expect(action.why.length).toBeGreaterThan(10);
    });
  });

  it('produces a default plan when no assessment exists', () => {
    const plan = buildWeeklyPlan(null, DEMO_PROFILE);
    expect(plan.actions.length).toBeGreaterThan(0);
    plan.actions.forEach((action) => expect(action.why.length).toBeGreaterThan(10));
  });

  it('resolves member first names safely', () => {
    expect(memberName(DEMO_PROFILE, 'zayed')).toBe('Zayed');
    expect(memberName(DEMO_PROFILE, 'missing')).toBe('A family member');
  });
});
