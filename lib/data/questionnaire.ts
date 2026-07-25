import { createClient } from '@/lib/supabase/server';
import { ensureFoundationalRecords, type DataAccessResult } from '@/lib/data/profile';
import {
  emptyPersistedAnswer,
  sanitizeAnswerAgainstCatalog,
  type PersistedQuestionAnswer,
} from '@/lib/questionnaire/persistence/answer-state';
import {
  getQuestionnaireCatalog,
  QUESTIONNAIRE_VERSION,
} from '@/lib/questionnaire/catalog';
import type { CategoryDefinition } from '@/lib/questionnaire/types';
import type { ResponseQualifier, ResponseState } from '@/lib/questionnaire/types';
import type { Json } from '@/lib/supabase/database.types';

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    return { supabase, user: null as null };
  }
  const ensured = await ensureFoundationalRecords();
  if (!ensured.success) {
    return { supabase, user: null as null };
  }
  return { supabase, user };
}

type RpcOk = { ok?: boolean; message?: string; code?: string; [key: string]: unknown };

function rpcResult(
  data: unknown,
  error: { message: string } | null,
  fallback: string
): DataAccessResult<RpcOk> {
  if (error) {
    console.error(fallback, error.message);
    return { success: false, message: fallback };
  }
  const payload = (data ?? {}) as RpcOk;
  if (!payload.ok) {
    return {
      success: false,
      message: typeof payload.message === 'string' ? payload.message : fallback,
    };
  }
  return { success: true, data: payload };
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

export type LoadedQuestionnaireProgress = {
  status: 'not_started' | 'in_progress' | 'completed';
  categoryKey: string | null;
  questionKey: string | null;
  phase: 'intro' | 'base' | 'priority' | 'complete' | null;
  startedAt: string | null;
  completedAt: string | null;
  updatedAt: string | null;
};

export type LoadedQuestionnaireState = {
  versionKey: string;
  progress: LoadedQuestionnaireProgress;
  answersByCategory: Record<number, Record<string, PersistedQuestionAnswer>>;
};

function questionByKey(categories: CategoryDefinition[], questionKey: string) {
  for (const category of categories) {
    const question = category.questions.find((q) => q.id === questionKey);
    if (question) return { category, question };
  }
  return null;
}

export async function loadMyQuestionnaireState(): Promise<
  DataAccessResult<LoadedQuestionnaireState>
> {
  const { supabase, user } = await requireUser();
  if (!user) return { success: false, message: 'You must be signed in.' };

  const catalog = getQuestionnaireCatalog();
  const { data, error } = await supabase.rpc('load_my_questionnaire_state', {
    p_version_key: QUESTIONNAIRE_VERSION,
  });
  const result = rpcResult(data, error, 'Could not load your Compatibility Profile.');
  if (!result.success) {
    return { success: false, message: result.message };
  }
  if (!result.data) {
    return { success: false, message: 'Could not load your Compatibility Profile.' };
  }

  const progressRaw =
    result.data.progress && typeof result.data.progress === 'object'
      ? (result.data.progress as Record<string, unknown>)
      : {};

  const progress: LoadedQuestionnaireProgress = {
    status:
      progressRaw.status === 'completed' ||
      progressRaw.status === 'in_progress' ||
      progressRaw.status === 'not_started'
        ? progressRaw.status
        : 'not_started',
    categoryKey: asString(progressRaw.category_key),
    questionKey: asString(progressRaw.question_key),
    phase:
      progressRaw.phase === 'intro' ||
      progressRaw.phase === 'base' ||
      progressRaw.phase === 'priority' ||
      progressRaw.phase === 'complete'
        ? progressRaw.phase
        : null,
    startedAt: asString(progressRaw.started_at),
    completedAt: asString(progressRaw.completed_at),
    updatedAt: asString(progressRaw.updated_at),
  };

  const answersByCategory: Record<number, Record<string, PersistedQuestionAnswer>> = {};
  const rows = Array.isArray(result.data.responses) ? result.data.responses : [];

  for (const row of rows) {
    if (!row || typeof row !== 'object') continue;
    const r = row as Record<string, unknown>;
    const questionKey = asString(r.question_key);
    if (!questionKey) continue;
    const located = questionByKey(catalog.categories, questionKey);
    if (!located) continue;

    const selectedRows = Array.isArray(r.selected_choices) ? r.selected_choices : [];
    const selectedChoiceIds: string[] = [];
    const choiceContexts: Record<string, string> = {};
    for (const selected of selectedRows) {
      if (!selected || typeof selected !== 'object') continue;
      const s = selected as Record<string, unknown>;
      const choiceKey = asString(s.choice_key);
      if (!choiceKey) continue;
      selectedChoiceIds.push(choiceKey);
      const context = asString(s.context_text);
      if (context) choiceContexts[choiceKey] = context;
    }

    const priorityChoiceIds = Array.isArray(r.priority_choice_keys)
      ? r.priority_choice_keys.filter((item): item is string => typeof item === 'string')
      : [];

    const answer = sanitizeAnswerAgainstCatalog(located.question, {
      selectedChoiceIds,
      priorityChoiceIds,
      choiceContexts,
      identity: {
        refinement: asString(r.identity_refinement),
        userSupplied: asString(r.identity_user_supplied),
        publicDisplayAllowed:
          typeof r.identity_public_display_allowed === 'boolean'
            ? r.identity_public_display_allowed
            : false,
        privateMatchingAllowed:
          typeof r.identity_private_matching_allowed === 'boolean'
            ? r.identity_private_matching_allowed
            : false,
      },
      clientMutation:
        typeof r.client_mutation === 'number' && Number.isFinite(r.client_mutation)
          ? r.client_mutation
          : 0,
      responseState:
        typeof r.response_state === 'string'
          ? (r.response_state as ResponseState)
          : undefined,
      activeQualifiers: Array.isArray(r.active_qualifiers)
        ? (r.active_qualifiers.filter(
            (item): item is ResponseQualifier => typeof item === 'string'
          ) as ResponseQualifier[])
        : undefined,
    });

    if (!answersByCategory[located.category.number]) {
      answersByCategory[located.category.number] = {};
    }
    answersByCategory[located.category.number][questionKey] = answer;
  }

  return {
    success: true,
    data: {
      versionKey: QUESTIONNAIRE_VERSION,
      progress,
      answersByCategory,
    },
  };
}

export async function saveMyQuestionnaireResponse(input: {
  questionKey: string;
  answer: PersistedQuestionAnswer;
}): Promise<DataAccessResult<{ clientMutation: number }>> {
  const { supabase, user } = await requireUser();
  if (!user) return { success: false, message: 'You must be signed in.' };

  const catalog = getQuestionnaireCatalog();
  const located = questionByKey(catalog.categories, input.questionKey);
  if (!located) {
    return { success: false, message: 'Question was not found in the active catalog.' };
  }

  const sanitized = sanitizeAnswerAgainstCatalog(located.question, input.answer);
  if (sanitized.selectedChoiceIds.length === 0) {
    return clearMyQuestionnaireQuestion(input.questionKey);
  }

  const choiceContexts: Record<string, string> = {};
  for (const [choiceId, text] of Object.entries(sanitized.choiceContexts)) {
    choiceContexts[choiceId] = text;
  }

  let identity: Json = {};
  if (located.question.structuredIdentity) {
    identity = {
      refinement: sanitized.identity.refinement ?? null,
      user_supplied: sanitized.identity.userSupplied ?? null,
      public_display_allowed: sanitized.identity.publicDisplayAllowed ?? false,
      ...(located.question.structuredIdentity.privacy.userControlsPrivateMatchingUse
        ? {
            private_matching_allowed:
              sanitized.identity.privateMatchingAllowed ?? false,
          }
        : {}),
    };
  }

  const mutation = Math.max(sanitized.clientMutation, 1);
  const { data, error } = await supabase.rpc('save_my_questionnaire_response', {
    p_version_key: QUESTIONNAIRE_VERSION,
    p_question_key: input.questionKey,
    p_choice_keys: sanitized.selectedChoiceIds,
    p_priority_choice_keys: sanitized.priorityChoiceIds,
    p_choice_contexts: choiceContexts,
    p_identity: identity,
    p_client_mutation: mutation,
    p_response_state: sanitized.responseState ?? 'answered',
    p_active_qualifiers: sanitized.activeQualifiers ?? [],
  });

  const result = rpcResult(data, error, 'Could not save your answer. Try again.');
  if (!result.success) {
    return { success: false, message: result.message };
  }

  return {
    success: true,
    data: {
      clientMutation:
        typeof result.data?.client_mutation === 'number'
          ? (result.data.client_mutation as number)
          : mutation,
    },
  };
}

export async function clearMyQuestionnaireQuestion(
  questionKey: string
): Promise<DataAccessResult<{ clientMutation: number }>> {
  const { supabase, user } = await requireUser();
  if (!user) return { success: false, message: 'You must be signed in.' };

  const { data, error } = await supabase.rpc('clear_my_questionnaire_question', {
    p_version_key: QUESTIONNAIRE_VERSION,
    p_question_key: questionKey,
  });
  const result = rpcResult(data, error, 'Could not clear this answer. Try again.');
  if (!result.success) return { success: false, message: result.message };
  return { success: true, data: { clientMutation: 0 } };
}

export async function saveMyQuestionnaireProgressPosition(input: {
  categoryKey?: string | null;
  questionKey?: string | null;
  phase?: 'intro' | 'base' | 'priority' | 'complete' | null;
  status?: 'not_started' | 'in_progress' | 'completed' | null;
}): Promise<DataAccessResult<true>> {
  const { supabase, user } = await requireUser();
  if (!user) return { success: false, message: 'You must be signed in.' };

  const { data, error } = await supabase.rpc('save_my_questionnaire_progress_position', {
    p_version_key: QUESTIONNAIRE_VERSION,
    p_category_key: input.categoryKey ?? undefined,
    p_question_key: input.questionKey ?? undefined,
    p_phase: input.phase ?? undefined,
    p_status: input.status ?? undefined,
  });
  const result = rpcResult(data, error, 'Could not save your progress. Try again.');
  if (!result.success) return { success: false, message: result.message };
  return { success: true, data: true };
}

export async function clearMyQuestionnaireCategory(
  categoryKey: string
): Promise<DataAccessResult<true>> {
  const { supabase, user } = await requireUser();
  if (!user) return { success: false, message: 'You must be signed in.' };

  const { data, error } = await supabase.rpc('clear_my_questionnaire_category', {
    p_version_key: QUESTIONNAIRE_VERSION,
    p_category_key: categoryKey,
  });
  const result = rpcResult(data, error, 'Could not restart this category. Try again.');
  if (!result.success) return { success: false, message: result.message };
  return { success: true, data: true };
}

export async function clearMyQuestionnaireProfile(): Promise<DataAccessResult<true>> {
  const { supabase, user } = await requireUser();
  if (!user) return { success: false, message: 'You must be signed in.' };

  const { data, error } = await supabase.rpc('clear_my_questionnaire_profile', {
    p_version_key: QUESTIONNAIRE_VERSION,
  });
  const result = rpcResult(
    data,
    error,
    'Could not restart your Compatibility Profile. Try again.'
  );
  if (!result.success) return { success: false, message: result.message };
  return { success: true, data: true };
}

export async function loadParentingEligibilityProfile(): Promise<
  DataAccessResult<{
    has_children: string | null;
    children: string | null;
    open_to_partner_with_children: string | null;
  }>
> {
  const { supabase, user } = await requireUser();
  if (!user) return { success: false, message: 'You must be signed in.' };

  const { data, error } = await supabase
    .from('profiles')
    .select('has_children, children, open_to_partner_with_children')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    console.error('Could not load parenting eligibility profile', error.message);
    return { success: false, message: 'Could not load your profile.' };
  }

  return {
    success: true,
    data: {
      has_children: data?.has_children ?? null,
      children: data?.children ?? null,
      open_to_partner_with_children: data?.open_to_partner_with_children ?? null,
    },
  };
}

export { emptyPersistedAnswer };
