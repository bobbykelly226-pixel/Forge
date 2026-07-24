import { createCategoryBuilders } from '@/lib/questionnaire/catalog/build-category';
import type { CategoryDefinition, QuestionDefinition } from '@/lib/questionnaire/types';

const { buildChoices, q, categoryKey: CATEGORY_KEY } = createCategoryBuilders(
  'conflict_repair'
);

/**
 * Locked product decisions for Category 4 after the 10 question reduction.
 * Categories 5 through 10 remain at fifteen questions until later groups.
 * Q3 intentionally has no priority follow up.
 */
export const CATEGORY_04_LOCKED_PRODUCT_DECISIONS = [
  'Q3 intentionally does not receive a priority follow up. The base selections are sufficient.',
  'Multiselect questions are not fully ranked. Only Q6, Q9, and Q10 receive a lightweight “choose the two most important” follow up.',
  'Written responses are excluded because this category has no defined use for them at launch.',
  'Structured answers power alignment; follow up priorities determine added weight.',
] as const;

export const CATEGORY_04_FORMAT_DISTRIBUTION = {
  'Single choice': [1, 4, 5, 7],
  'Limited multiselect': [3, 6, 9, 10],
  'Scenario based choice': [2, 8],
  'Written response': [],
} as const;

const QUESTIONS: QuestionDefinition[] = [
  q({
    number: 1,
    prompt:
      'When tension first develops between you and a partner, what are you most likely to do?',
    formatLabel: 'Single choice',
    responseBehavior: 'single_choice',
    minSelections: 1,
    maxSelections: 1,
    alignmentPurpose:
      "Identifies someone's initial response to relational tension: direct engagement, inquiry, reflection, de escalation, observation, or avoidance.",
    choices: buildChoices(1, [
      'Address it directly before it grows',
      'Ask whether something feels wrong before sharing my own concerns',
      'Take a little time to understand what I am feeling',
      'Try to reduce the tension before discussing the underlying issue',
      'Wait to see whether the issue resolves naturally',
      'Avoid raising it unless it begins affecting the relationship',
    ]),
  }),
  q({
    number: 2,
    prompt:
      'If you become too upset to continue a disagreement constructively, what should happen?',
    formatLabel: 'Scenario based choice',
    responseBehavior: 'scenario_choice',
    minSelections: 1,
    maxSelections: 1,
    alignmentPurpose:
      'Measures preferred de escalation and re engagement practices during active conflict.',
    choices: buildChoices(2, [
      'Continue carefully so the issue is not left unresolved',
      'Take a short pause and resume at a specific time later that day',
      'Take several hours and reconnect once emotions have settled',
      'Resume the conversation the following day',
      'Agree on a return time based on the seriousness of the issue',
      'Pause the disagreement, focus first on restoring emotional safety, and agree on when to return to the issue',
    ]),
  }),
  q({
    number: 3,
    prompt: 'What does a fair compromise generally require?',
    formatLabel: 'Select up to four',
    responseBehavior: 'multi_select',
    minSelections: 1,
    maxSelections: 4,
    alignmentPurpose:
      'Compares expectations for equity, mutual sacrifice, boundaries, influence, and adaptability in compromise.',
    choices: buildChoices(3, [
      'Both people give up something they wanted',
      'The outcome considers what matters most to each person',
      'The person more affected by the decision receives greater consideration',
      'Neither person feels pressured into agreement',
      "The solution protects each person's essential boundaries",
      'The agreement can be revisited if it does not work',
      'Both people understand why the decision was made',
      'The same person is not always expected to give in',
      'The result supports the relationship as a whole',
    ]),
  }),
  q({
    number: 4,
    prompt:
      'If a disagreement cannot be fully resolved, what outcome would you consider acceptable?',
    formatLabel: 'Single choice',
    responseBehavior: 'single_choice',
    minSelections: 1,
    maxSelections: 1,
    alignmentPurpose:
      'Reveals tolerance for unresolved differences and expectations for reaching closure.',
    choices: buildChoices(4, [
      'Continue discussing it until a shared conclusion is reached',
      'Agree on a practical solution even if our opinions remain different',
      'Accept the difference as long as it does not affect essential needs or values',
      'Allow the person most affected to make the final decision',
      'Seek outside guidance when the issue significantly affects the relationship',
      'Reconsider the relationship if the issue creates an ongoing fundamental conflict',
    ]),
  }),
  q({
    number: 5,
    prompt:
      'When a partner raises a concern about your behavior, what is usually most difficult for you?',
    formatLabel: 'Single choice',
    responseBehavior: 'single_choice',
    minSelections: 1,
    maxSelections: 1,
    alignmentPurpose:
      'Captures conflict vulnerabilities without asking users to portray themselves as defensive or emotionally reactive.',
    choices: buildChoices(5, [
      'Hearing the concern without immediately explaining my intentions',
      'Separating criticism of my behavior from criticism of who I am',
      'Remaining calm when I believe the concern is unfair',
      'Acknowledging the concern before sharing my perspective',
      'Accepting that their experience may differ from my own',
      'Discussing the issue before I have had time to reflect',
    ]),
  }),
  q({
    number: 6,
    prompt: 'What makes an apology feel sincere to you?',
    formatLabel: 'Select up to four',
    responseBehavior: 'multi_select',
    minSelections: 1,
    maxSelections: 4,
    alignmentPurpose:
      "Identifies the user's expectations for remorse, accountability, repair, changed behavior, and forgiveness.",
    choices: buildChoices(6, [
      'Clearly naming what happened',
      'Acknowledging how the other person was affected',
      'Accepting responsibility without excuses',
      'Expressing genuine remorse',
      'Asking what may help repair the harm',
      'Taking practical steps to make things right',
      'Changing the behavior afterward',
      'Allowing the hurt person time to rebuild trust',
      'Offering the apology without expecting immediate forgiveness',
    ]),
    priorityFollowUp: {
      prompt: 'Of the elements you selected, which two matter most?',
      selectionCount: 2,
      unordered: true,
    },
  }),
  q({
    number: 7,
    prompt:
      'When someone has hurt you but takes genuine responsibility, how does forgiveness usually work for you?',
    formatLabel: 'Single choice',
    responseBehavior: 'single_choice',
    minSelections: 1,
    maxSelections: 1,
    alignmentPurpose:
      'Differentiates forgiveness, emotional recovery, restored access, boundaries, and reconciliation.',
    choices: buildChoices(7, [
      'I can forgive relatively quickly once responsibility is taken',
      'I can forgive, but emotional healing takes additional time',
      'I need to see consistent behavioral change before forgiveness develops',
      'I can release resentment while still changing the relationship or setting boundaries',
      'Some violations may be too serious for the relationship to recover',
      'Forgiveness depends greatly on the harm, pattern, and circumstances',
    ]),
  }),
  q({
    number: 8,
    prompt: 'If the same conflict keeps returning, what should happen next?',
    formatLabel: 'Scenario based choice',
    responseBehavior: 'scenario_choice',
    minSelections: 1,
    maxSelections: 1,
    alignmentPurpose:
      'Reveals how someone interprets recurring conflict and when they shift from discussion to accountability, outside help, or compatibility evaluation.',
    choices: buildChoices(8, [
      'Identify the deeper need or concern beneath the repeated argument',
      'Determine whether previous agreements were clear and realistic',
      'Examine whether one or both people failed to follow through',
      'Try a substantially different solution',
      'Seek counseling or trusted outside guidance',
      'Decide whether the issue reflects a fundamental incompatibility',
    ]),
  }),
  q({
    number: 9,
    prompt: 'Which behaviors are most important in a partner during conflict?',
    formatLabel: 'Select up to five',
    responseBehavior: 'multi_select',
    minSelections: 1,
    maxSelections: 5,
    alignmentPurpose:
      'Identifies the conflict behaviors someone most needs from a long term partner.',
    choices: buildChoices(9, [
      'Remains respectful even when angry',
      'Addresses the issue instead of attacking my character',
      'Listens before responding',
      'Takes responsibility for their part',
      'Tries to understand my perspective',
      'Communicates concerns directly',
      'Respects an agreed upon pause',
      'Returns to unfinished conversations',
      'Is willing to compromise',
      'Protects important boundaries',
      'Focuses on repair rather than winning',
      'Follows through on agreements afterward',
    ]),
    priorityFollowUp: {
      prompt:
        'Of the behaviors you selected, which two allow the least room for compromise?',
      selectionCount: 2,
      unordered: true,
    },
  }),
  q({
    number: 10,
    prompt:
      'Which conflict patterns would most seriously threaten your willingness to remain in a relationship?',
    formatLabel: 'Select up to five',
    responseBehavior: 'multi_select',
    minSelections: 1,
    maxSelections: 5,
    alignmentPurpose:
      'Identifies high impact conflict incompatibilities and behaviors that may affect safety or trust without diagnosing either user.',
    choices: buildChoices(10, [
      'Insults, humiliation, or contempt',
      'Threats, intimidation, or attempts to create fear',
      'Breaking objects or physically aggressive behavior',
      'Repeatedly refusing to discuss serious concerns',
      'Using silence or withdrawal as punishment',
      'Denying events or deliberately distorting what occurred',
      'Threatening to end the relationship to gain control',
      'Sharing private conflicts to embarrass or recruit others',
      'Refusing to accept any responsibility',
      'Repeatedly breaking agreements made after conflict',
      'Retaliating when boundaries are expressed',
      'Treating every disagreement as something that must be won',
    ]),
    priorityFollowUp: {
      prompt:
        'Of the patterns you selected, which two would be most difficult for you to move past?',
      selectionCount: 2,
      unordered: true,
    },
  }),
];

export const CATEGORY_04: CategoryDefinition = {
  id: CATEGORY_KEY,
  number: 4,
  title: 'Conflict & Repair',
  status: 'locked',
  lockedProductDecisions: CATEGORY_04_LOCKED_PRODUCT_DECISIONS,
  formatDistribution: CATEGORY_04_FORMAT_DISTRIBUTION,
  questions: QUESTIONS,
};
