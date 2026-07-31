export type SubmitBetaFeedbackState = {
  success: boolean;
  message: string;
  reference?: string;
  responseExpectation?: string;
  fieldErrors?: Partial<Record<'category' | 'area' | 'message', string>>;
};

export const INITIAL_BETA_FEEDBACK_STATE: SubmitBetaFeedbackState = {
  success: false,
  message: '',
};
