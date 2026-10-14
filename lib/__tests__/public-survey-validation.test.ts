import assert from 'node:assert/strict';
import { test } from 'node:test';
import { SURVEY_QUESTIONS, SURVEY_VERSION } from '../survey/questions';
import { validateSurveySubmission } from '../survey/validation';

function valid() { return { id: 'c605aeb7-7f21-4a52-9825-2d7d315ea85a', version: SURVEY_VERSION, answers: Object.fromEntries(SURVEY_QUESTIONS.map(q => [q.id, q.kind === 'text' ? [] : [q.options![0]]])) }; }
test('valid submission includes no identity fields and normalizes optional text', () => {
  const input = valid(); input.answers.worthwhile = ['  Respectful conversations  '];
  const result = validateSurveySubmission(input);
  assert.ok(result.success);
  assert.deepEqual(result.submission.answers.worthwhile, ['Respectful conversations']);
  assert.equal(Object.keys(result.submission.answers).length, 7);
});
test('rejects missing required questions, unknown options, duplicate choices, and more than three', () => {
  for (const answers of [[], ['not allowed'], Array(2).fill(SURVEY_QUESTIONS[1].options![0]), SURVEY_QUESTIONS[1].options!.slice(0, 4)]) {
    const input = valid(); input.answers.frustrations = answers;
    assert.equal(validateSurveySubmission(input).success, false);
  }
});
test('rejects mixed exclusive choices in every multiple-choice question', () => {
  for (const q of SURVEY_QUESTIONS.filter(q => q.exclusive)) {
    const input = valid(); input.answers[q.id] = [q.options![0], q.exclusive![0]];
    assert.equal(validateSurveySubmission(input).success, false);
  }
});
test('rejects identity fields, unknown question keys, wrong version, and invalid IDs', () => {
  assert.equal(validateSurveySubmission({ ...valid(), email: 'person@example.test' }).success, false);
  assert.equal(validateSurveySubmission({ ...valid(), answers: { ...valid().answers, user_id: ['123'] } }).success, false);
  assert.equal(validateSurveySubmission({ ...valid(), version: 'old' }).success, false);
  assert.equal(validateSurveySubmission({ ...valid(), id: '123' }).success, false);
});
test('rejects oversized or invalid written answers while allowing blank optional answers', () => {
  const input = valid(); input.answers.feature = ['x'.repeat(1001)];
  assert.equal(validateSurveySubmission(input).success, false);
  input.answers.feature = ['\u0000'];
  assert.equal(validateSurveySubmission(input).success, false);
  input.answers.feature = [];
  assert.equal(validateSurveySubmission(input).success, true);
});
