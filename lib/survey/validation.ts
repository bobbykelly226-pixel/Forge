import { SURVEY_QUESTIONS, SURVEY_VERSION } from './questions';

export type SurveySubmission = { id: string; version: typeof SURVEY_VERSION; answers: Record<string, string[]> };
export type SurveyValidation = { success: true; submission: SurveySubmission } | { success: false; message: string };

export function validateSurveySubmission(value: unknown): SurveyValidation {
  const fail = (message: string): SurveyValidation => ({ success: false, message });
  if (!value || typeof value !== 'object' || Array.isArray(value)) return fail('Please review your answers and try again.');
  const input = value as Record<string, unknown>;
  if (Object.keys(input).some(key => !['id', 'version', 'answers'].includes(key))) return fail('Please review your answers and try again.');
  if (typeof input.id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.id)) return fail('Please reload the survey and try again.');
  if (input.version !== SURVEY_VERSION) return fail('This survey has changed. Please reload to see the current questions.');
  if (!input.answers || typeof input.answers !== 'object' || Array.isArray(input.answers)) return fail('Please review your answers and try again.');
  const incoming = input.answers as Record<string, unknown>;
  if (Object.keys(incoming).some(key => !SURVEY_QUESTIONS.some(question => question.id === key))) return fail('Please review your answers and try again.');
  const answers: Record<string, string[]> = {};
  for (const question of SURVEY_QUESTIONS) {
    const raw = incoming[question.id] ?? (question.kind === 'text' ? [] : null);
    if (!Array.isArray(raw) || raw.some(answer => typeof answer !== 'string')) return fail('Please review your answers and try again.');
    const choices = raw as string[];
    if (question.kind === 'text') {
      if (choices.length > 1 || (choices[0]?.length ?? 0) > 1000 || choices[0]?.includes('\u0000')) return fail('Written answers must be 1000 characters or fewer.');
      answers[question.id] = choices[0]?.trim() ? [choices[0].trim()] : [];
      continue;
    }
    if (!choices.length) return fail(`Please answer: ${question.title}`);
    if (choices.length > (question.kind === 'single' ? 1 : 3) || new Set(choices).size !== choices.length || choices.some(answer => !question.options?.includes(answer))) return fail('Please review your selections and try again.');
    if (choices.length > 1 && choices.some(answer => question.exclusive?.includes(answer))) return fail('Choose an exclusive answer by itself.');
    answers[question.id] = [...choices];
  }
  return { success: true, submission: { id: input.id.toLowerCase(), version: SURVEY_VERSION, answers } };
}
