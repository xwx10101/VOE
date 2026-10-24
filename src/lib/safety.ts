export type SafetyLevel = 'none' | 'sensitive' | 'crisis';

const CRISIS_PATTERNS: { id: string; pattern: RegExp }[] = [
  { id: 'self-harm', pattern: /\b(kill myself|killing myself|suicid\w*|end (my|his|her|their|our) life|end it all|self[- ]?harm|hurt myself|harming (myself|himself|herself)|cutting myself|want to die|wants? to die|don'?t want to live)\b/i },
  { id: 'immediate-danger', pattern: /\b(emergency|can'?t breathe|cannot breathe|chest pain|overdose|unconscious|seizure|bleeding heavily|heart attack|stroke)\b/i },
  { id: 'violence', pattern: /\b(hitting me|hit me|beaten|abusing me|abusive|violent at home|afraid of someone at home|threatened me)\b/i },
  { id: 'harm-to-other', pattern: /\b(hurt (him|her|them|my child)|harm my (child|family)|kill (him|her|them))\b/i },
];

const SENSITIVE_PATTERNS: { id: string; pattern: RegExp }[] = [
  { id: 'medication', pattern: /\b(dosage|dose|diagnos\w*|prescri\w*|antidepressant|medication change|withdraw\w*)\b/i },
  { id: 'mental-health', pattern: /\b(depress\w*|anxiety|panic attack|trauma|eating disorder|bipolar)\b/i },
  { id: 'conflict', pattern: /\b(shouting|yelling|arguments? every day|daily arguments?|won'?t speak to|screaming)\b/i },
  { id: 'privacy', pattern: /\b(track|spy|monitor secretly|read (his|her|their) messages|check (his|her|their) phone)\b/i },
];

export function classifyMessage(text: string): SafetyLevel {
  if (CRISIS_PATTERNS.some((item) => item.pattern.test(text))) return 'crisis';
  if (SENSITIVE_PATTERNS.some((item) => item.pattern.test(text))) return 'sensitive';
  return 'none';
}

export const CRISIS_RESPONSE = [
  'I am going to pause ordinary family coaching here.',
  'FamilyMind AI cannot monitor emergencies or assess risk. If someone is in immediate danger, contact local emergency services now, or reach a trusted adult, a qualified professional, or a local support service you already know.',
  'This prototype does not provide crisis support and does not replace a qualified professional.',
].join('\n\n');

export const SENSITIVE_NOTE =
  'This response is general family guidance, not medical or mental-health advice. For anything clinical, a qualified professional should be involved. FamilyMind AI does not diagnose or monitor emergencies.';

export const EMERGENCY_PLACEHOLDER =
  'Emergency contact setup is a placeholder in this prototype. FamilyMind AI does not monitor emergencies and will not call anyone on its own.';

/** Removes characters commonly used to inject markup, and trims length. */
export function sanitizeText(input: string, maxLength = 600): string {
  return input
    .replace(/[<>]/g, ' ')
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

export function redactForLog(input: string): string {
  return `[redacted ${input.length} chars]`;
}
