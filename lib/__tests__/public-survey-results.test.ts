import assert from 'node:assert/strict';
import { test } from 'node:test';
import { surveyChoiceRows, surveyResultsPage, type SurveyResults } from '../survey/results';
import { SURVEY_QUESTIONS } from '../survey/questions';

const empty: SurveyResults = { total: 0, counts: [], written_total: 0, page: 1, feedback: [] };
test('empty results show every answer with zero counts and percentages', () => {
  const rows = surveyChoiceRows('experience', empty);
  assert.equal(rows.length, 3);
  assert.ok(rows.every(row => row.count === 0 && row.percent === 0));
});
test('percentages use respondents rather than number of selections', () => {
  const options = SURVEY_QUESTIONS[1].options!;
  const results = { ...empty, total: 4, counts: options.slice(0, 3).map(answer => ({ question: 'frustrations', answer, count: 3 })) };
  const rows = surveyChoiceRows('frustrations', results);
  assert.equal(rows[0].percent, 75);
  assert.equal(rows.reduce((sum, row) => sum + row.percent, 0), 225);
});
test('pagination rejects noninteger, negative, huge and malformed page numbers', () => {
  for (const input of ['0', '-1', '1.2', 'oops', 'Infinity', '9999999999']) assert.equal(surveyResultsPage(input), 1);
  assert.equal(surveyResultsPage(undefined), 1);
  assert.equal(surveyResultsPage('2'), 2);
});
