import { describe, expect, it } from 'vitest';
import {
  CRISIS_RESPONSE,
  EMERGENCY_PLACEHOLDER,
  SENSITIVE_NOTE,
  classifyMessage,
  redactForLog,
  sanitizeText,
} from '@/lib/safety';
import { localProvider, requestCoachResponse, responseToPlainText } from '@/lib/ai';
import { DEMO_ANSWERS, DEMO_PROFILE } from '@/data/demo';
import { computeAssessment } from '@/lib/scoring';

const result = computeAssessment(DEMO_ANSWERS);
const baseRequest = { profile: DEMO_PROFILE, result };

describe('safety layer', () => {
  it('detects explicit crisis language', () => {
    expect(classifyMessage('I want to kill myself')).toBe('crisis');
    expect(classifyMessage('she said she wants to end her life')).toBe('crisis');
    expect(classifyMessage('he is having chest pain and cannot breathe')).toBe('crisis');
    expect(classifyMessage('my father is hitting me')).toBe('crisis');
  });

  it('marks clinical and privacy topics as sensitive rather than crisis', () => {
    expect(classifyMessage('my daughter has depression and a new prescription')).toBe('sensitive');
    expect(classifyMessage('can I check his phone to see what he is doing')).toBe('sensitive');
    expect(classifyMessage('arguments every day are hard')).toBe('sensitive');
  });

  it('leaves ordinary family topics unflagged', () => {
    expect(classifyMessage('we do not spend enough time together')).toBe('none');
    expect(classifyMessage('one person handles most household tasks')).toBe('none');
  });

  it('never invents hotline numbers', () => {
    expect(CRISIS_RESPONSE).not.toMatch(/\d{3,}/);
    expect(CRISIS_RESPONSE.toLowerCase()).toContain('cannot monitor emergencies');
    expect(EMERGENCY_PLACEHOLDER.toLowerCase()).toContain('does not monitor emergencies');
    expect(SENSITIVE_NOTE.toLowerCase()).toContain('not medical');
  });

  it('sanitises user text and clamps length', () => {
    expect(sanitizeText('<script>alert(1)</script> hello')).toBe('script alert(1) /script hello');
    expect(sanitizeText('x'.repeat(900), 50)).toHaveLength(50);
    expect(sanitizeText('  padded  ')).toBe('padded');
  });

  it('redacts content for logging', () => {
    expect(redactForLog('private note')).toBe('[redacted 12 chars]');
  });
});

describe('coach service', () => {
  it('returns structured, non-clinical guidance for exam stress', async () => {
    const response = await localProvider.respond({
      ...baseRequest,
      message: 'My child is stressed about exams',
    });
    expect(response.todayAction.minutes).toBeLessThanOrEqual(15);
    expect(response.weekSteps).toHaveLength(3);
    expect(response.conversationStarter.length).toBeGreaterThan(10);
    expect(response.whyItHelps.length).toBeGreaterThan(20);
    expect(response.isSafetyResponse).toBeUndefined();
  });

  it('is deterministic for the same scenario', async () => {
    const a = await localProvider.respond({ ...baseRequest, message: 'We missed grandmother’s reminder' });
    const b = await localProvider.respond({ ...baseRequest, message: 'We missed grandmother’s reminder' });
    expect(a).toEqual(b);
  });

  it('stops ordinary coaching for crisis language', async () => {
    const response = await requestCoachResponse({ ...baseRequest, message: 'I think I want to die' });
    expect(response.isSafetyResponse).toBe(true);
    expect(response.todayAction.minutes).toBe(0);
    expect(response.reflection.toLowerCase()).toContain('cannot monitor emergencies');
    expect(response.safetyNote?.toLowerCase()).toContain('not medical');
  });

  it('falls back to a general response for unmatched messages', async () => {
    const response = await localProvider.respond({ ...baseRequest, message: 'Something else entirely' });
    expect(response.reflection.length).toBeGreaterThan(20);
    expect(response.weekSteps).toHaveLength(3);
  });

  it('serialises a response for copying', async () => {
    const response = await localProvider.respond({ ...baseRequest, message: 'Our schedule is overloaded' });
    const text = responseToPlainText(response);
    expect(text).toContain('Today');
    expect(text).toContain('This week');
    expect(text).toContain('Conversation starter');
  });
});
