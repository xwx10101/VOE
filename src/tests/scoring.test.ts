import { describe, expect, it } from 'vitest';
import { ASSESSMENT_QUESTIONS } from '@/data/questions';
import { DEMO_ANSWERS } from '@/data/demo';
import {
  answeredCount,
  clamp,
  computeAssessment,
  isAnswerComplete,
  statusFor,
  statusLabel,
} from '@/lib/scoring';
import type { AssessmentAnswers } from '@/types';

const answerAll = (value: 'best' | 'worst'): AssessmentAnswers => {
  const answers: AssessmentAnswers = {};
  ASSESSMENT_QUESTIONS.forEach((question) => {
    const sorted = [...question.options].sort((a, b) => a.deduction - b.deduction);
    answers[question.id] = value === 'best' ? sorted[0].value : sorted[sorted.length - 1].value;
  });
  return answers;
};

describe('assessment scoring', () => {
  it('produces the deterministic demo result', () => {
    const result = computeAssessment(DEMO_ANSWERS);
    expect(result.score).toBe(45);
    expect(result.status).toBe('attention');
    expect(result.statusLabel).toBe('Needs Attention');
  });

  it('is deterministic for identical answers', () => {
    const first = computeAssessment(DEMO_ANSWERS);
    const second = computeAssessment(DEMO_ANSWERS);
    expect({ ...first, completedAt: '' }).toEqual({ ...second, completedAt: '' });
  });

  it('returns a strong foundation when every answer is low severity', () => {
    const result = computeAssessment(answerAll('best'));
    expect(result.score).toBe(100);
    expect(result.status).toBe('strong');
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it('clamps the worst possible score at zero and classifies priority support', () => {
    const result = computeAssessment(answerAll('worst'));
    expect(result.score).toBe(0);
    expect(result.status).toBe('priority');
    expect(result.score).toBeGreaterThanOrEqual(0);
  });

  it('changes the score when an answer changes', () => {
    const changed = computeAssessment({ ...DEMO_ANSWERS, q2: 'overwhelming' });
    expect(changed.score).toBeLessThan(computeAssessment(DEMO_ANSWERS).score);
  });

  it('reports five integer category scores in range', () => {
    const result = computeAssessment(DEMO_ANSWERS);
    expect(result.categories).toHaveLength(5);
    result.categories.forEach((category) => {
      expect(Number.isInteger(category.score)).toBe(true);
      expect(category.score).toBeGreaterThanOrEqual(0);
      expect(category.score).toBeLessThanOrEqual(100);
      expect(category.summary.length).toBeGreaterThan(10);
    });
  });

  it('records one deduction per answered question with a positive severity', () => {
    const result = computeAssessment(DEMO_ANSWERS);
    expect(result.deductions.length).toBeGreaterThan(0);
    result.deductions.forEach((deduction) => expect(deduction.amount).toBeGreaterThan(0));
  });

  it('handles incomplete answers without throwing', () => {
    const result = computeAssessment({ q1: 'once' });
    expect(result.score).toBe(89);
    expect(result.categories).toHaveLength(5);
  });

  it('tracks answer completeness', () => {
    expect(isAnswerComplete(DEMO_ANSWERS)).toBe(true);
    expect(isAnswerComplete({})).toBe(false);
    expect(answeredCount(DEMO_ANSWERS)).toBe(8);
  });

  it('uses the documented status bands', () => {
    expect(statusFor(100)).toBe('strong');
    expect(statusFor(80)).toBe('strong');
    expect(statusFor(79)).toBe('stable');
    expect(statusFor(60)).toBe('stable');
    expect(statusFor(59)).toBe('attention');
    expect(statusFor(40)).toBe('attention');
    expect(statusFor(39)).toBe('priority');
    expect(statusLabel(45)).toBe('Needs Attention');
  });

  it('clamps helper values', () => {
    expect(clamp(-10)).toBe(0);
    expect(clamp(150)).toBe(100);
  });
});
