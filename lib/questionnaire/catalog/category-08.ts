import { createCategoryBuilders } from '@/lib/questionnaire/catalog/build-category';
import type { CategoryDefinition, QuestionDefinition } from '@/lib/questionnaire/types';

export const CATEGORY_08_PARENTING_ELIGIBILITY_ID = 'elig_parenting_role_c08';

export const CATEGORY_08_PARENTING_ELIGIBILITY = {
  id: CATEGORY_08_PARENTING_ELIGIBILITY_ID,
  ruleKey: 'parenting_role_display_c08',
  description:
    'Display only when the user has children, wants or may want children, or is open to a future parenting or stepparenting role.',
  condition: {
    type: 'profile_predicate' as const,
    predicateKey: 'open_to_parenting_or_stepparenting_role',
  },
};

const { buildChoices, q, categoryKey: CATEGORY_KEY } = createCategoryBuilders(
  'politics_civic_life_social_issues'
);

/**
 * Locked product decisions for Category 8 after the 10 question reduction.
 */
export const CATEGORY_08_LOCKED_PRODUCT_DECISIONS = [
  'Former Q1 was removed because political identity, actual participation, and desired relationship discussion provide more specific information.',
  'Former Q10 was removed because the retained civic choice question captures autonomy and relationship boundaries without narrowing the scenario to public advocacy.',
  'Former Q11 was removed because political news and social media habits are narrower than the retained political discussion question.',
  'Former Q12 was removed because general family and social boundaries are addressed elsewhere.',
  'Former Q14 was removed because partner similarity, issue compatibility, and serious incompatibilities already capture workable political difference.',
  'Multiselect questions are not fully ranked. Only Q4, Q5, and Q10 receive a lightweight “choose the two most important” follow up.',
  'Q9 is gated by parenting eligibility and does not display for users outside that predicate.',
  'Written responses are excluded because this category has no defined use for them at launch.',
  'Structured answers power alignment; follow up priorities determine added weight.',
] as const;

export const CATEGORY_08_FORMAT_DISTRIBUTION = {
  'Structured identity selection': [1],
  'Importance scale': [2],
  'Select all that apply': [3],
  'Limited multiselect': [4, 5, 10],
  'Scenario based choice': [6],
  'Discussion frequency range with separate no preference response': [7],
  'Autonomy range': [8],
  'Conditional scenario based choice': [9],
  'Written response': [],
} as const;

const QUESTIONS: QuestionDefinition[] = [
  q({
    number: 1,
    prompt: 'How would you describe your current political identity?',
    formatLabel: 'Structured identity selection',
    responseBehavior: 'structured_identity',
    structuredIdentity: {
      allowsRefinement: true,
      allowsUserSuppliedIdentity: true,
      privacy: {
        userControlsPublicDisplay: true,
        userControlsPrivateMatchingUse: true,
      },
    },
    minSelections: 1,
    maxSelections: 1,
    alignmentPurpose:
      'Records self identified political orientation without assuming that the label reveals the respondent’s specific beliefs, values, voting behavior, or relationship expectations.',
    choices: buildChoices(1, [
      'Progressive',
      'Liberal',
      'Moderate',
      'Centrist',
      'Conservative',
      'Libertarian',
      'Independent',
      'Politically mixed',
      'Politically unaffiliated',
      'Apolitical',
      'Exploring or uncertain',
      'Another political identity',
      'Prefer not to identify',
    ]),
  }),
  q({
    number: 2,
    prompt:
      'How important is it that a long term partner shares your general political outlook?',
    formatLabel: 'Importance scale',
    responseBehavior: 'scale_range',
    minSelections: 1,
    maxSelections: 1,
    contextNote:
      'Shared political outlook may mean similar labels, values, issue positions, priorities, or expectations for civic life. Later questions clarify which forms of agreement matter to the respondent.',
    alignmentPurpose:
      'Measures the importance of political similarity without treating political identity as a complete compatibility judgment.',
    choices: buildChoices(2, [
      'Essential. I need substantial political agreement',
      'Very important. I strongly prefer similar political beliefs, with limited room for major differences',
      'Important. Shared foundations matter, although some meaningful differences are acceptable',
      'Somewhat important. Compatible values matter more than matching political positions',
      'Not especially important. I am comfortable with substantial political differences',
      'Not important. Political similarity is not a relationship requirement for me',
    ]),
  }),
  q({
    number: 3,
    prompt:
      'Which aspects of political or civic life are currently part of how you participate?',
    formatLabel: 'Select all that apply',
    responseBehavior: 'multi_select',
    selectAllThatApply: true,
    minSelections: 0,
    maxSelections: null,
    implementationNote:
      'This is an unrestricted multi select. An unselected activity does not indicate opposition to it.',
    alignmentPurpose:
      'Identifies lived political and civic involvement rather than relying entirely on identity labels.',
    choices: buildChoices(
      3,
      [
        'Voting in national elections',
        'Voting in state or local elections',
        'Following political or public affairs news',
        'Discussing political or social issues',
        'Contacting elected officials or participating in public comment',
        'Volunteering for campaigns or civic organizations',
        'Donating to candidates, causes, or advocacy organizations',
        'Attending demonstrations, rallies, meetings, or public events',
        'Participating in community boards, associations, or local government',
        'Supporting issue based advocacy',
        'Helping with voter registration or civic education',
        'Serving through the military, public safety, public service, or another civic institution',
        'Community service that is not primarily political',
        'Avoiding formal political involvement while remaining privately informed',
        'None of these currently apply to me',
        'Another form of civic participation',
      ],
      {
        15: { mutuallyExclusive: true },
      }
    ),
  }),
  q({
    number: 4,
    prompt:
      'Which political or civic principles matter most to you in a long term relationship?',
    formatLabel: 'Select up to five',
    responseBehavior: 'multi_select',
    minSelections: 1,
    maxSelections: 5,
    alignmentPurpose:
      'Identifies the foundations beneath political labels and determines which principles carry the greatest relationship significance.',
    choices: buildChoices(4, [
      'Personal freedom and individual rights',
      'Equal treatment and protection under the law',
      'Public safety and community stability',
      'Compassion and protection for vulnerable people',
      'Personal responsibility and accountability',
      'Economic opportunity and financial security',
      'Limited government and individual independence',
      'Effective government and reliable public institutions',
      'Fairness in laws, systems, and opportunities',
      'Respect for constitutional or democratic processes',
      'National security and responsible international leadership',
      'Local control and community decision making',
      'Environmental stewardship',
      'Religious liberty and freedom of conscience',
      'Civil discussion across disagreement',
      'Willingness to reconsider beliefs when credible evidence changes',
    ]),
    priorityFollowUp: {
      prompt:
        'Of the principles you selected, which two allow the least room for compromise?',
      selectionCount: 2,
      unordered: true,
    },
  }),
  q({
    number: 5,
    prompt:
      'Which public issues would be most important for you and a partner to approach compatibly?',
    formatLabel: 'Select up to five',
    responseBehavior: 'multi_select',
    minSelections: 1,
    maxSelections: 5,
    implementationNote:
      'Selecting an issue means agreement or compatibility matters to the respondent. It does not reveal which position the respondent holds.',
    alignmentPurpose:
      'Identifies the public issues most likely to affect relationship compatibility without asking Forge to decide the correct position.',
    choices: buildChoices(5, [
      'The economy, employment, and cost of living',
      'Taxes, government spending, and public assistance',
      'Healthcare and access to care',
      'Education and the role of schools',
      'Public safety, policing, and the justice system',
      'Firearms and public safety policy',
      'Immigration and border policy',
      'Abortion and reproductive policy',
      'LGBTQ+ rights and related public policy',
      'Religious liberty and freedom of conscience',
      'Race, discrimination, and equal protection',
      'Climate, energy, and environmental policy',
      'National defense and foreign policy',
      'Elections, voting, and democratic institutions',
      'The role and size of government',
      'Freedom of speech and expression',
      'Labor, business, and economic regulation',
      'Housing and community development',
    ]),
    priorityFollowUp: {
      prompt:
        'Of the issues you selected, which two would be most difficult to navigate if you and your partner substantially disagreed?',
      selectionCount: 2,
      unordered: true,
    },
  }),
  q({
    number: 6,
    prompt:
      'When you and a partner disagree about a political or social issue, what should guide the conversation most strongly?',
    formatLabel: 'Scenario based choice',
    responseBehavior: 'scenario_choice',
    minSelections: 1,
    maxSelections: 1,
    alignmentPurpose:
      'Measures the respondent’s leading approach to political disagreement, including curiosity, evidence, independence, practicality, emotional regulation, and recognition of genuine incompatibility.',
    choices: buildChoices(6, [
      'Seek to understand the values and experiences behind each person’s position',
      'Examine evidence and reasoning together before reaching conclusions',
      'Protect each person’s freedom to hold a different view',
      'Identify the shared principles that remain beneath the disagreement',
      'Avoid forcing resolution when the issue does not materially affect the relationship',
      'Determine whether the disagreement changes an important shared decision',
      'Pause the discussion if it becomes unproductive and return to it respectfully',
      'Recognize when a disagreement reveals a fundamental incompatibility that discussion cannot resolve',
    ]),
  }),
  q({
    number: 7,
    prompt:
      'What level of political discussion would you ideally want within a long term relationship?',
    formatLabel: 'Discussion frequency range with separate no preference response',
    responseBehavior: 'scale_range',
    minSelections: 1,
    maxSelections: 1,
    allowedSpecialResponseStates: ['no_preference'],
    implementationNote:
      '“No particular preference” is not part of the ordered frequency range and should be stored as a separate response state.',
    alignmentPurpose:
      'Measures preferred frequency and depth of political conversation without assuming that greater political discussion produces a healthier relationship.',
    choices: buildChoices(
      7,
      [
        'Frequent and in depth discussion as a regular part of the relationship',
        'Regular discussion of major events, policies, and social issues',
        'Occasional discussion when something important arises',
        'Limited discussion focused mainly on issues affecting our household or future',
        'Very little political discussion because I prefer to keep it outside the relationship',
        'No particular preference. Discussion can vary according to our interests and circumstances',
      ],
      {
        6: { specialResponseState: 'no_preference' },
      }
    ),
  }),
  q({
    number: 8,
    prompt:
      'How should a couple handle voting, political affiliation, and personal civic choices?',
    formatLabel: 'Autonomy range',
    responseBehavior: 'scale_range',
    minSelections: 1,
    maxSelections: 1,
    contextNote:
      'No partner is entitled to control another person’s vote, demand proof of a ballot choice, interfere with lawful participation, or punish someone for exercising political autonomy.',
    alignmentPurpose:
      'Measures expectations for shared civic participation, political privacy, influence, independence, and personal freedom.',
    choices: buildChoices(8, [
      'Strongly encourage shared political participation and generally support the same candidates or causes',
      'Discuss major choices together while respecting each person’s final decision',
      'Share information and perspectives without expecting political agreement',
      'Keep individual voting and political choices largely private unless both want to discuss them',
      'Maintain substantially separate political lives',
      'Political participation should remain entirely voluntary and personally determined',
    ]),
  }),
  q({
    number: 9,
    prompt:
      'If children were part of the relationship, how should politics and civic life primarily be approached in their upbringing?',
    formatLabel: 'Conditional scenario based choice',
    responseBehavior: 'scenario_choice',
    minSelections: 1,
    maxSelections: 1,
    eligibilityRuleId: CATEGORY_08_PARENTING_ELIGIBILITY_ID,
    conditional: {
      kind: 'conditional_scenario',
      requiresEligibilityRuleId: CATEGORY_08_PARENTING_ELIGIBILITY_ID,
    },
    contextNote:
      'Children should not be used as messengers, pressured to take sides between parents, or treated as disloyal for developing their own views. Parents should substantially agree on age appropriate civic education and respectful discussion.',
    alignmentPurpose:
      'Identifies the respondent’s leading expectation for political socialization, civic education, exposure to differing views, parental influence, and a child’s developing independence.',
    choices: buildChoices(9, [
      'Teach the family’s shared political or civic principles clearly',
      'Teach the family’s principles while respectfully explaining other perspectives',
      'Present multiple perspectives and encourage children to form their own views as they mature',
      'Focus primarily on civic responsibility, history, and critical thinking rather than political identity',
      'Allow each parent to share their views without requiring the child to adopt either position',
      'Keep partisan politics limited while discussing issues that directly affect the family or community',
      'Avoid intentionally shaping a child’s political identity and allow their interest to develop naturally',
    ]),
  }),
  q({
    number: 10,
    prompt:
      'Which political or civic differences would most seriously threaten long term compatibility?',
    formatLabel: 'Select up to five',
    responseBehavior: 'multi_select',
    minSelections: 1,
    maxSelections: 5,
    alignmentPurpose:
      'Identifies essential political boundaries and high impact incompatibilities without judging the respondent’s political identity.',
    choices: buildChoices(10, [
      'Pressure to adopt, conceal, or abandon my political beliefs',
      'Attempts to control my vote or political participation',
      'Repeated contempt toward people who hold my views',
      'Incompatible positions on an issue that directly affects my rights, safety, family, or future',
      'Incompatible expectations for how children should learn about politics or civic life',
      'Political activity that repeatedly destabilizes the household',
      'Refusal to respect lawful political or civic participation',
      'Treating every disagreement as proof of bad character',
      'Repeatedly sharing private political information about me without permission',
      'Expecting relatives, friends, or political communities to control relationship decisions',
      'Using political beliefs to justify coercion, discrimination, threats, humiliation, or harmful conduct',
      'Supporting political violence or intimidation',
      'Refusing any respectful discussion of issues that materially affect the relationship',
      'Extreme political media use that repeatedly displaces responsibilities or damages the relationship',
      'Fundamental differences concerning rights, dignity, freedom, fairness, or responsibility that materially affect our shared life',
    ]),
    priorityFollowUp: {
      prompt:
        'Of the differences you selected, which two would be most difficult for you to move past?',
      selectionCount: 2,
      unordered: true,
    },
  }),
];

export const CATEGORY_08: CategoryDefinition = {
  id: CATEGORY_KEY,
  number: 8,
  title: 'Politics, Civic Life & Social Issues',
  status: 'locked',
  lockedProductDecisions: CATEGORY_08_LOCKED_PRODUCT_DECISIONS,
  formatDistribution: CATEGORY_08_FORMAT_DISTRIBUTION,
  questions: QUESTIONS,
};
