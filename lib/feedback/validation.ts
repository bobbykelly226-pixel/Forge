import {
  BETA_FEEDBACK_AREAS,
  BETA_FEEDBACK_CATEGORIES,
  type BetaFeedbackArea,
  type BetaFeedbackCategory,
} from '@/lib/feedback/constants';

export const BETA_FEEDBACK_MESSAGE_MIN_LENGTH = 10;
export const BETA_FEEDBACK_MESSAGE_MAX_LENGTH = 2000;

const CATEGORY_VALUES = new Set<string>(
  BETA_FEEDBACK_CATEGORIES.map((category) => category.value)
);
const AREA_VALUES = new Set<string>(BETA_FEEDBACK_AREAS.map((area) => area.value));

export type BetaFeedbackInput = {
  category: BetaFeedbackCategory;
  area: BetaFeedbackArea;
  message: string;
  contactRequested: boolean;
};

export type BetaFeedbackValidationResult =
  | { success: true; data: BetaFeedbackInput }
  | {
      success: false;
      message: string;
      fieldErrors: Partial<Record<'category' | 'area' | 'message', string>>;
    };

function normalizedString(value: FormDataEntryValue | null) {
  return typeof value === 'string' ? value.trim() : '';
}

export function validateBetaFeedbackFormData(
  formData: FormData
): BetaFeedbackValidationResult {
  const category = normalizedString(formData.get('category'));
  const area = normalizedString(formData.get('area'));
  const message = normalizedString(formData.get('message'));
  const fieldErrors: Partial<Record<'category' | 'area' | 'message', string>> = {};

  if (!CATEGORY_VALUES.has(category)) {
    fieldErrors.category = 'Choose what you would like to share.';
  }

  if (!AREA_VALUES.has(area)) {
    fieldErrors.area = 'Choose the part of Forge this is about.';
  }

  if (message.length < BETA_FEEDBACK_MESSAGE_MIN_LENGTH) {
    fieldErrors.message = 'Please include at least 10 characters so we can understand the feedback.';
  } else if (message.length > BETA_FEEDBACK_MESSAGE_MAX_LENGTH) {
    fieldErrors.message = 'Please keep feedback to 2,000 characters or fewer.';
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      success: false,
      message: 'Please review the highlighted fields and try again.',
      fieldErrors,
    };
  }

  return {
    success: true,
    data: {
      category: category as BetaFeedbackCategory,
      area: area as BetaFeedbackArea,
      message,
      contactRequested: formData.get('contactRequested') === 'on',
    },
  };
}
