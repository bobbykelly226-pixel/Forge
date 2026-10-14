import { NextResponse, type NextRequest } from 'next/server';
import { createSurveySession, readSurveySession, SURVEY_COOKIE, SURVEY_SESSION_SECONDS, surveyOriginAllowed, surveyRateKey } from '@/lib/survey/security';
import { saveSurveySubmission } from '@/lib/survey/storage';

export const runtime = 'nodejs';
const failure = 'Feedback could not be saved right now. Your answers are still here, please try again.';
function reply(body: object, status = 200) { return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } }); }

export async function GET(request: NextRequest) {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) return reply({ success: false, message: failure }, 503);
  const existing = readSurveySession(request.cookies.get(SURVEY_COOKIE)?.value, secret);
  if (existing) return reply({ success: true, id: existing.id });
  const session = createSurveySession(secret);
  const response = reply({ success: true, id: session.id });
  response.cookies.set(SURVEY_COOKIE, session.cookie, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/api/survey', maxAge: SURVEY_SESSION_SECONDS });
  return response;
}

export async function POST(request: NextRequest) {
  if (!surveyOriginAllowed(request.headers.get('origin'), request.url)) return reply({ success: false, message: 'Please submit feedback from the Forge survey page.' }, 403);
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) return reply({ success: false, message: failure }, 503);
  const session = readSurveySession(request.cookies.get(SURVEY_COOKIE)?.value, secret);
  if (!session || session.age < 3) return reply({ success: false, message: 'Please wait a moment and try again. If this page has been open for a while, refresh it before submitting.' }, 403);
  if (!request.headers.get('content-type')?.includes('application/json')) return reply({ success: false, message: failure }, 415);
  // Limit streamed bytes, not just the optional Content-Length header.
  let raw = '';
  const reader = request.body?.getReader();
  if (!reader) return reply({ success: false, message: failure }, 400);
  const decoder = new TextDecoder();
  let bytes = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > 16000) { await reader.cancel(); return reply({ success: false, message: 'Your response is too long. Please shorten your written answers.' }, 413); }
      raw += decoder.decode(chunk.value, { stream: true });
    }
    raw += decoder.decode();
    const input = JSON.parse(raw);
    if (!input || typeof input !== 'object' || Array.isArray(input) || input.id !== session.id || input.website !== '') return reply({ success: false, message: 'Please review your answers and try again.' }, 400);
    const ip = request.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim() ?? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
    if (!ip && process.env.NODE_ENV === 'production') return reply({ success: false, message: failure }, 503);
    const submission = { ...input };
    delete submission.website;
    const result = await saveSurveySubmission(submission, surveyRateKey(ip ?? 'local', secret));
    return reply(result, result.success ? 200 : 400);
  } catch { return reply({ success: false, message: failure }, 500); }
}
