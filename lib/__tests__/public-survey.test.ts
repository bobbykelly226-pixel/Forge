import assert from 'node:assert/strict';
import { test } from 'node:test';
import { SURVEY_QUESTIONS, selectSurveyOption } from '../survey/questions';

test('approved survey contains seven questions and only two optional written answers', () => {
  assert.equal(SURVEY_QUESTIONS.length, 7);
  assert.equal(SURVEY_QUESTIONS.filter(q => q.kind === 'text').length, 2);
  assert.equal(new Set(SURVEY_QUESTIONS.map(q => q.id)).size, 7);
  for (const q of SURVEY_QUESTIONS) assert.ok(!/[—–]/.test(q.title));
});
test('multiple selections cap at three, allow removal, and reject unknown options', () => {
  const q = SURVEY_QUESTIONS[1];
  const options = q.options!;
  const selected = options.slice(0, 3);
  assert.deepEqual(selectSurveyOption(q, selected, options[3]), selected);
  assert.deepEqual(selectSurveyOption(q, selected, options[0]), selected.slice(1));
  assert.deepEqual(selectSurveyOption(q, selected, 'not an option'), selected);
});
test('exclusive answers replace ordinary choices and are cleared by a new ordinary choice', () => {
  for (const q of SURVEY_QUESTIONS.filter(q => q.exclusive)) {
    for (const exclusive of q.exclusive!) {
      assert.deepEqual(selectSurveyOption(q, q.options!.slice(0, 3), exclusive), [exclusive]);
      assert.deepEqual(selectSurveyOption(q, [exclusive], q.options![0]), [q.options![0]]);
      assert.deepEqual(selectSurveyOption(q, [exclusive], exclusive), []);
    }
  }
});
test('single choice replaces the previous answer', () => {
  const q = SURVEY_QUESTIONS[0];
  assert.deepEqual(selectSurveyOption(q, [q.options![0]], q.options![1]), [q.options![1]]);
});
