'use server';

import { revalidatePath } from 'next/cache';

import { createClient } from '@/lib/supabase/server';
import {
  COMPATIBILITY_QUESTION_KEYS,
  type CompatibilityAnswerValue,
  type CompatibilityAnswersMap,
  type CompatibilityQuestionKey,
} from '@/lib/types/compatibility';

type CompatibilityActionResult = {
  success: boolean;
  message: string;
};

const ALLOWED_QUESTION_KEYS = new Set<string>(
  Object.values(COMPATIBILITY_QUESTION_KEYS)
);

function isAllowedQuestionKey(key: string): key is CompatibilityQuestionKey {
  return ALLOWED_QUESTION_KEYS.has(key);
}

function isValidAnswerValue(value: unknown): value is CompatibilityAnswerValue {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }

  if (Array.isArray(value)) {
    return (
      value.length > 0 &&
      value.every((item) => typeof item === 'string' && item.trim().length > 0)
    );
  }

  return false;
}

export async function loadCompatibilityAnswers(): Promise<CompatibilityAnswersMap> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {};
  }

  const { data, error } = await supabase
    .from('compatibility_answers')
    .select('question_key, answer_value')
    .eq('user_id', user.id);

  if (error) {
    console.error('Compatibility answers load failed:', error.message);
    return {};
  }

  const answers: CompatibilityAnswersMap = {};

  for (const row of data ?? []) {
    if (!isAllowedQuestionKey(row.question_key)) {
      continue;
    }

    if (!isValidAnswerValue(row.answer_value)) {
      continue;
    }

    answers[row.question_key] = row.answer_value;
  }

  return answers;
}

export async function saveCompatibilityAnswer(
  questionKey: string,
  answerValue: CompatibilityAnswerValue
): Promise<CompatibilityActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: 'You must be signed in to save answers.' };
  }

  if (!isAllowedQuestionKey(questionKey)) {
    return { success: false, message: 'Unknown question.' };
  }

  const normalizedValue: CompatibilityAnswerValue = Array.isArray(answerValue)
    ? answerValue.map((item) => item.trim()).filter(Boolean)
    : typeof answerValue === 'string'
      ? answerValue.trim()
      : answerValue;

  // Clearing a multi-select removes the stored answer rather than saving [].
  if (
    (typeof normalizedValue === 'string' && !normalizedValue) ||
    (Array.isArray(normalizedValue) && normalizedValue.length === 0)
  ) {
    const { error } = await supabase
      .from('compatibility_answers')
      .delete()
      .eq('user_id', user.id)
      .eq('question_key', questionKey);

    if (error) {
      console.error('Compatibility answer clear failed:', error.message);
      return { success: false, message: 'Could not clear your answer. Please try again.' };
    }

    revalidatePath('/onboarding');
    revalidatePath('/app');
    return { success: true, message: 'Answer cleared.' };
  }

  if (!isValidAnswerValue(normalizedValue)) {
    return { success: false, message: 'Answer value is invalid.' };
  }

  const { error } = await supabase.from('compatibility_answers').upsert(
    {
      user_id: user.id,
      question_key: questionKey,
      answer_value: normalizedValue,
    },
    { onConflict: 'user_id,question_key' }
  );

  if (error) {
    console.error('Compatibility answer save failed:', error.message);
    return { success: false, message: 'Could not save your answer. Please try again.' };
  }

  revalidatePath('/onboarding');
  revalidatePath('/app');

  return { success: true, message: 'Answer saved.' };
}
