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

function asFiniteNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

export type LoadedQuestionnaireProgress = {
  status: 'not_started' | 'in_progress' | 'completed';
  categoryKey: string | null;
  questionKey: string | null;
  phase: 'intro' | 'base' | 'priority' | 'complete' | null;
  writeGeneration: number;
  startedAt: string | null;
  completedAt: string | null;
  updatedAt: string | null;
};

export type LoadedQuestionnaireState = {
  versionKey: string;
  progress: LoadedQuestionnaireProgress;
  answersByCategory: Record<number, Record<string, PersistedQuestionAnswer>>;
  writeGeneration: number;
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

  const writeGeneration = asFiniteNumber(progressRaw.write_generation, 0);

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
    writeGeneration,
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

    const revision = asFiniteNumber(
      r.revision ?? r.client_mutation,
      0
    );

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

    // Preserve tombstone revisions so delayed clears/saves keep compare-and-swap integrity.
    if (r.response_state === 'unanswered' && selectedChoiceIds.length === 0) {
      if (!answersByCategory[located.category.number]) {
        answersByCategory[located.category.number] = {};
      }
      answersByCategory[located.category.number][questionKey] = {
        ...emptyPersistedAnswer(),
        revision,
      };
      continue;
    }

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
      revision,
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
      writeGeneration,
    },
  };
}

export type SaveResponseResult = {
  revision: number;
  writeGeneration: number;
};

export async function saveMyQuestionnaireResponse(input: {
  questionKey: string;
  answer: PersistedQuestionAnswer;
  expectedWriteGeneration: number;
}): Promise<DataAccessResult<SaveResponseResult>> {
  const { supabase, user } = await requireUser();
  if (!user) return { success: false, message: 'You must be signed in.' };

  const catalog = getQuestionnaireCatalog();
  const located = questionByKey(catalog.categories, input.questionKey);
  if (!located) {
    return { success: false, message: 'Question was not found in the active catalog.' };
  }

  const sanitized = sanitizeAnswerAgainstCatalog(located.question, input.answer);
  if (sanitized.selectedChoiceIds.length === 0) {
    return clearMyQuestionnaireQuestion({
      questionKey: input.questionKey,
      expectedRevision: sanitized.revision,
      expectedWriteGeneration: input.expectedWriteGeneration,
    });
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

  // Server derives response_state and qualifiers. Do not send client values.
  const { data, error } = await supabase.rpc('save_my_questionnaire_response', {
    p_version_key: QUESTIONNAIRE_VERSION,
    p_question_key: input.questionKey,
    p_choice_keys: sanitized.selectedChoiceIds,
    p_priority_choice_keys: sanitized.priorityChoiceIds,
    p_choice_contexts: choiceContexts,
    p_identity: identity,
    p_expected_revision: sanitized.revision,
    p_expected_write_generation: input.expectedWriteGeneration,
  });

  const result = rpcResult(data, error, 'Could not save your answer. Try again.');
  if (!result.success) {
    return { success: false, message: result.message };
  }

  return {
    success: true,
    data: {
      revision: asFiniteNumber(result.data?.revision, sanitized.revision + 1),
      writeGeneration: asFiniteNumber(
        result.data?.write_generation,
        input.expectedWriteGeneration
      ),
    },
  };
}

export async function clearMyQuestionnaireQuestion(input: {
  questionKey: string;
  expectedRevision: number;
  expectedWriteGeneration: number;
}): Promise<DataAccessResult<SaveResponseResult>> {
  const { supabase, user } = await requireUser();
  if (!user) return { success: false, message: 'You must be signed in.' };

  const { data, error } = await supabase.rpc('clear_my_questionnaire_question', {
    p_version_key: QUESTIONNAIRE_VERSION,
    p_question_key: input.questionKey,
    p_expected_revision: input.expectedRevision,
    p_expected_write_generation: input.expectedWriteGeneration,
  });
  const result = rpcResult(data, error, 'Could not clear this answer. Try again.');
  if (!result.success) return { success: false, message: result.message };
  return {
    success: true,
    data: {
      revision: asFiniteNumber(result.data?.revision, input.expectedRevision + 1),
      writeGeneration: asFiniteNumber(
        result.data?.write_generation,
        input.expectedWriteGeneration
      ),
    },
  };
}

export async function saveMyQuestionnaireProgressPosition(input: {
  categoryKey?: string | null;
  questionKey?: string | null;
  phase?: 'intro' | 'base' | 'priority' | 'complete' | null;
  expectedWriteGeneration: number;
}): Promise<DataAccessResult<{ writeGeneration: number; status?: string }>> {
  const { supabase, user } = await requireUser();
  if (!user) return { success: false, message: 'You must be signed in.' };

  const { data, error } = await supabase.rpc('save_my_questionnaire_progress_position', {
    p_version_key: QUESTIONNAIRE_VERSION,
    p_category_key: input.categoryKey ?? undefined,
    p_question_key: input.questionKey ?? undefined,
    p_phase: input.phase ?? undefined,
    p_expected_write_generation: input.expectedWriteGeneration,
  });
  const result = rpcResult(data, error, 'Could not save your progress. Try again.');
  if (!result.success) return { success: false, message: result.message };
  return {
    success: true,
    data: {
      writeGeneration: asFiniteNumber(
        result.data?.write_generation,
        input.expectedWriteGeneration
      ),
      status: typeof result.data?.status === 'string' ? result.data.status : undefined,
    },
  };
}

export async function clearMyQuestionnaireCategory(input: {
  categoryKey: string;
  expectedWriteGeneration: number;
}): Promise<DataAccessResult<{ writeGeneration: number }>> {
  const { supabase, user } = await requireUser();
  if (!user) return { success: false, message: 'You must be signed in.' };

  const { data, error } = await supabase.rpc('clear_my_questionnaire_category', {
    p_version_key: QUESTIONNAIRE_VERSION,
    p_category_key: input.categoryKey,
    p_expected_write_generation: input.expectedWriteGeneration,
  });
  const result = rpcResult(data, error, 'Could not restart this category. Try again.');
  if (!result.success) return { success: false, message: result.message };
  return {
    success: true,
    data: {
      writeGeneration: asFiniteNumber(
        result.data?.write_generation,
        input.expectedWriteGeneration + 1
      ),
    },
  };
}

export async function clearMyQuestionnaireProfile(input: {
  expectedWriteGeneration: number;
}): Promise<DataAccessResult<{ writeGeneration: number }>> {
  const { supabase, user } = await requireUser();
  if (!user) return { success: false, message: 'You must be signed in.' };

  const { data, error } = await supabase.rpc('clear_my_questionnaire_profile', {
    p_version_key: QUESTIONNAIRE_VERSION,
    p_expected_write_generation: input.expectedWriteGeneration,
  });
  const result = rpcResult(
    data,
    error,
    'Could not restart your Compatibility Profile. Try again.'
  );
  if (!result.success) return { success: false, message: result.message };
  return {
    success: true,
    data: {
      writeGeneration: asFiniteNumber(
        result.data?.write_generation,
        input.expectedWriteGeneration + 1
      ),
    },
  };
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
