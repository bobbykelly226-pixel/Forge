export type SurveyQuestion = {
  id: string;
  title: string;
  kind: 'single' | 'multiple' | 'text';
  options?: readonly string[];
  exclusive?: readonly string[];
  description?: string;
};

export const SURVEY_VERSION = 'dating-experience-v1';
export const SURVEY_QUESTIONS: readonly SurveyQuestion[] = [
  { id: 'experience', title: 'What is your experience with dating apps or websites?', kind: 'single', options: ['I currently use them.', 'I’ve used them, but stopped.', 'I’ve never used them.'] },
  { id: 'frustrations', title: 'What frustrations have you experienced with dating apps or websites?', kind: 'multiple', options: ['Matches whose values or intentions don’t align with mine', 'The app didn’t let me express my values or match around them', 'Dishonest, misleading, or fake profiles', 'Ghosting or conversations that go nowhere', 'Unwanted or disrespectful messages', 'Safety or privacy concerns', 'Costs, paywalls, or unclear pricing', 'Too much swiping and not enough meaningful connection', 'Other', 'None', 'I haven’t used dating apps or websites'], exclusive: ['None', 'I haven’t used dating apps or websites'] },
  { id: 'leaving', title: 'What is the biggest reason you stopped, or would consider stopping, using a dating app?', kind: 'single', options: ['I wasn’t meeting compatible people.', 'The app’s design or dating culture wasn’t right for me.', 'It took too much time or felt exhausting.', 'I didn’t trust the profiles or people I encountered.', 'I felt uncomfortable or unsafe.', 'It cost too much.', 'I met someone or no longer needed it.', 'Other', 'I’m not considering stopping.', 'I haven’t used dating apps or websites.'] },
  { id: 'worthwhile', title: 'What would make online dating feel worth trying, or continuing, for you?', kind: 'text' },
  { id: 'improvements', title: 'Which improvements would matter most to you?', kind: 'multiple', options: ['Clearer relationship intentions', 'Matching based on meaningful values and compatibility', 'Better tools for handling unwanted contact and safety concerns', 'Fewer irrelevant profiles', 'More genuine conversations', 'Clear, transparent pricing', 'A simpler experience with less swiping', 'Other', 'None of these'], exclusive: ['None of these'] },
  { id: 'feature', title: 'What is one feature or change you wish a dating app offered?', kind: 'text' },
  { id: 'trying', title: 'What would encourage you to try Forge?', description: 'Choose up to three. If you’re ready now or not interested, choose that answer by itself.', kind: 'multiple', options: ['Enough people in my area', 'A clear explanation of how it works', 'Confidence in its safety and privacy practices', 'Evidence that it offers something meaningfully different', 'A free way to try it', 'A recommendation from someone I trust', 'Other', 'I’d be willing to try it now.', 'I’m not interested in trying a new dating platform.'], exclusive: ['I’d be willing to try it now.', 'I’m not interested in trying a new dating platform.'] },
];

export function selectSurveyOption(question: SurveyQuestion, selected: string[], option: string): string[] {
  if (!question.options?.includes(option)) return selected;
  if (question.kind === 'single') return [option];
  if (selected.includes(option)) return selected.filter(value => value !== option);
  if (question.exclusive?.includes(option)) return [option];
  const ordinary = selected.filter(value => !question.exclusive?.includes(value));
  return ordinary.length < 3 ? [...ordinary, option] : ordinary;
}
