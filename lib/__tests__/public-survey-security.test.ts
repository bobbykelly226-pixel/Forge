import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createSurveySession, readSurveySession, surveyRateKey, surveyOriginAllowed } from '../survey/security';

const secret = 'test-secret-not-a-real-credential';
const now = 1791983000000;
test('survey cookie is signed, bounded, expiring, and resistant to tampering', () => {
  const session = createSurveySession(secret, now);
  assert.deepEqual(readSurveySession(session.cookie, secret, now + 4000), { id: session.id, age: 4 });
  assert.equal(readSurveySession(session.cookie, 'wrong-secret', now), null);
  assert.equal(readSurveySession(session.cookie + 'x', secret, now), null);
  assert.equal(readSurveySession(session.cookie.replace(session.id, '00000000-0000-4000-8000-000000000000'), secret, now), null);
  assert.equal(readSurveySession(session.cookie, secret, now + 7201000), null);
  assert.equal(readSurveySession(session.cookie, secret, now - 1000), null);
});
test('rate keys rotate daily and contain no raw connection identifier', () => {
  const key = surveyRateKey('192.0.2.1', secret, now);
  assert.match(key, /^[a-f0-9]{64}$/);
  assert.equal(key.includes('192.0.2.1'), false);
  assert.notEqual(key, surveyRateKey('192.0.2.1', secret, now + 86400000));
});
test('submissions reject cross-origin and missing-origin requests', () => {
  assert.equal(surveyOriginAllowed('https://forge.forgedinlife.com', 'https://forge.forgedinlife.com/api/survey'), true);
  assert.equal(surveyOriginAllowed('https://evil.example', 'https://forge.forgedinlife.com/api/survey'), false);
  assert.equal(surveyOriginAllowed(null, 'https://forge.forgedinlife.com/api/survey'), false);
});
