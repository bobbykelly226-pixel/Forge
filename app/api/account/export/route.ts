import type { SupabaseClient } from '@supabase/supabase-js';

import { createServiceClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Authentication required.' }, { status: 401 });

  const token = new URL(request.url).searchParams.get('token') ?? '';
  if (!/^[0-9a-f-]{36}$/i.test(token)) {
    return Response.json({ error: 'This download link is invalid.' }, { status: 400 });
  }
  const admin = createServiceClient();
  if (!admin) return Response.json({ error: 'Export service unavailable.' }, { status: 503 });
  const db = admin as unknown as SupabaseClient;
  const { data: consumed, error: consumeError } = await db.rpc('consume_account_export_token', {
    p_token: token,
    p_user_id: user.id,
  });
  if (consumeError || consumed !== true) {
    return Response.json({ error: 'This download link has expired or was already used.' }, { status: 410 });
  }

  const [
    profile,
    privateDetails,
    preferences,
    profileAnswers,
    compatibilityAnswers,
    photos,
    appState,
    questionnaireResponses,
    legalAcceptances,
    relationships,
    blocks,
    reports,
    feedback,
    participants,
  ] = await Promise.all([
    db.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    db.from('profile_private_details').select('*').eq('user_id', user.id).maybeSingle(),
    db.from('profile_preferences').select('*').eq('user_id', user.id).maybeSingle(),
    db.from('profile_answers').select('*').eq('user_id', user.id),
    db.from('compatibility_answers').select('*').eq('user_id', user.id),
    db.from('profile_photos').select('*').eq('user_id', user.id),
    db.from('user_app_state').select('*').eq('user_id', user.id).maybeSingle(),
    db.from('user_questionnaire_responses').select('*').eq('user_id', user.id),
    db.from('member_legal_acceptances').select('*').eq('user_id', user.id),
    db.from('connections').select('*').or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`),
    db.from('user_blocks').select('*').or(`blocker_id.eq.${user.id},blocked_id.eq.${user.id}`),
    db.from('user_reports').select('*').eq('reporter_id', user.id),
    db.from('beta_feedback_submissions').select('*').eq('user_id', user.id),
    db.from('conversation_participants').select('*').eq('user_id', user.id),
  ]);

  const conversationIds = (participants.data ?? []).map((row) => String(row.conversation_id));
  const [conversations, messages, attachments] = conversationIds.length
    ? await Promise.all([
        db.from('conversations').select('*').in('id', conversationIds),
        db.from('messages').select('*').in('conversation_id', conversationIds).order('created_at'),
        db.from('message_attachments').select('*').in('conversation_id', conversationIds),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }];

  await db.from('account_lifecycle_events').insert({
    user_id: user.id,
    actor_user_id: user.id,
    action: 'export_downloaded',
  });

  const body = JSON.stringify({
    generated_at: new Date().toISOString(),
    account: { id: user.id, email: user.email, created_at: user.created_at },
    profile: profile.data,
    private_details: privateDetails.data,
    preferences: preferences.data,
    profile_answers: profileAnswers.data ?? [],
    compatibility_answers: compatibilityAnswers.data ?? [],
    photos: photos.data ?? [],
    app_state: appState.data,
    questionnaire_responses: questionnaireResponses.data ?? [],
    legal_acceptances: legalAcceptances.data ?? [],
    connections: relationships.data ?? [],
    blocks: blocks.data ?? [],
    reports_submitted: reports.data ?? [],
    beta_feedback: feedback.data ?? [],
    conversations: conversations.data ?? [],
    conversation_participation: participants.data ?? [],
    messages: messages.data ?? [],
    message_attachments: attachments.data ?? [],
    retention_note: 'Safety, legal, and audit records may be retained under Forge policy and applicable law.',
  }, null, 2);

  return new Response(body, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="forge-account-export-${new Date().toISOString().slice(0, 10)}.json"`,
      'Cache-Control': 'private, no-store, max-age=0',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
