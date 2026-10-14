import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';

export const SURVEY_COOKIE = 'forge_survey_session';
export const SURVEY_SESSION_SECONDS = 7200;

function signature(value: string, secret: string) {
  return createHmac('sha256', secret).update(`forge-survey-session:${value}`).digest('hex');
}
export function createSurveySession(secret: string, now = Date.now()) {
  const id = randomUUID();
  const value = `${id}.${Math.floor(now / 1000)}`;
  return { id, cookie: `${value}.${signature(value, secret)}` };
}
export function readSurveySession(cookie: string | undefined, secret: string, now = Date.now()) {
  if (!cookie || cookie.length > 150) return null;
  const [id, issued, mac, ...extra] = cookie.split('.');
  if (extra.length || !/^[0-9a-f-]{36}$/.test(id ?? '') || !/^\d{10}$/.test(issued ?? '') || !/^[0-9a-f]{64}$/.test(mac ?? '')) return null;
  const expected = signature(`${id}.${issued}`, secret);
  if (!timingSafeEqual(Buffer.from(mac, 'hex'), Buffer.from(expected, 'hex'))) return null;
  const age = Math.floor(now / 1000) - Number(issued);
  if (age < 0 || age > SURVEY_SESSION_SECONDS) return null;
  return { id, age };
}
export function surveyRateKey(ip: string, secret: string, now = Date.now()) {
  return createHmac('sha256', secret).update(`forge-survey-rate:${new Date(now).toISOString().slice(0, 10)}:${ip}`).digest('hex');
}
export function surveyOriginAllowed(origin: string | null, requestUrl: string) {
  return origin === new URL(requestUrl).origin;
}
