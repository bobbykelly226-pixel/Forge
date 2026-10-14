import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { NextRequest } from 'next/server';
import * as next from 'next/server';
import * as security from '../survey/security';
import { SURVEY_VERSION, SURVEY_QUESTIONS } from '../survey/questions';

const secret = 'test-key-not-a-real-service-credential';
function loadRoute(save: (value: unknown, key: string) => Promise<unknown>) {
  const source = fs.readFileSync('app/api/survey/route.ts', 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports: Record<string, (request: NextRequest) => Promise<Response>> = {};
  vm.runInNewContext(compiled, { exports, require: (name: string) => name === 'next/server' ? next : name.endsWith('/security') ? security : { saveSurveySubmission: save }, process: { env: { SUPABASE_SERVICE_ROLE_KEY: secret, NODE_ENV: 'production' } }, TextDecoder, Buffer, Date });
  return exports;
}
function payload(id: string) { return { id, website: '', version: SURVEY_VERSION, answers: Object.fromEntries(SURVEY_QUESTIONS.map(q => [q.id, q.kind === 'text' ? [] : [q.options![0]]])) }; }
function post(body: unknown, cookie: string, origin = 'https://forge.forgedinlife.com') {
  return new NextRequest('https://forge.forgedinlife.com/api/survey', { method: 'POST', headers: { origin, 'content-type': 'application/json', cookie: `${security.SURVEY_COOKIE}=${cookie}`, 'x-vercel-forwarded-for': '192.0.2.1' }, body: JSON.stringify(body) });
}
test('route initializes an HttpOnly secure cookie without account login', async () => {
  const route = loadRoute(async () => { throw new Error('not called'); });
  const response = await route.GET(new NextRequest('https://forge.forgedinlife.com/api/survey'));
  assert.equal(response.status, 200);
  assert.match(response.headers.get('set-cookie')!, /HttpOnly/);
  assert.match(response.headers.get('set-cookie')!, /Secure/);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  const result = await response.json();
  assert.equal(result.success, true);
  assert.match(result.id, /^[a-f0-9-]{36}$/);
});
test('valid submission reaches storage without identity or honeypot fields', async () => {
  let calls = 0;
  const session = security.createSurveySession(secret, Date.now() - 5000);
  const route = loadRoute(async (input, key) => { calls++; assert.deepEqual(Object.keys(input as object).sort(), ['answers','id','version']); assert.match(key, /^[a-f0-9]{64}$/); return { success: true, message: 'Saved' }; });
  const response = await route.POST(post(payload(session.id), session.cookie));
  assert.equal(response.status, 200);
  assert.equal((await response.json()).success, true);
  assert.equal(calls, 1);
});
test('route rejects cross origin, missing signature, honeypot, mismatched ID and oversized body before storage', async () => {
  let calls = 0;
  const route = loadRoute(async () => { calls++; return { success: true }; });
  const session = security.createSurveySession(secret, Date.now() - 5000);
  for (const request of [post(payload(session.id), session.cookie, 'https://evil.example'), post(payload(session.id), ''), post({ ...payload(session.id), website: 'spam' }, session.cookie), post({ ...payload(session.id), id: 'wrong' }, session.cookie), post({ ...payload(session.id), extra: 'x'.repeat(17000) }, session.cookie)]) assert.ok((await route.POST(request)).status >= 400);
  assert.equal(calls, 0);
});
test('storage failures never return a successful submission response', async () => {
  const session = security.createSurveySession(secret, Date.now() - 5000);
  const route = loadRoute(async () => ({ success: false, message: 'Try again' }));
  const response = await route.POST(post(payload(session.id), session.cookie));
  assert.equal(response.status, 400);
  assert.equal((await response.json()).success, false);
});
