import type {
  AnswerChoiceDefinition,
  CategoryDefinition,
  QuestionDefinition,
} from '@/lib/questionnaire/types';

type ChoiceSpec =
  | number
  | {
      from: number;
      label: string;
    };

type QuestionCalibration = {
  prompt: string;
  choices?: readonly ChoiceSpec[];
};

type CategoryCalibration = {
  keep: readonly number[];
  questions: Readonly<Record<number, QuestionCalibration>>;
};

function choiceSpecs(
  indexes: readonly number[],
  labels: Readonly<Record<number, string>> = {}
): ChoiceSpec[] {
  return indexes.map((from) =>
    labels[from] ? { from, label: labels[from] } : from
  );
}

function buildCalibratedChoices(
  question: QuestionDefinition,
  specs: readonly ChoiceSpec[]
): AnswerChoiceDefinition[] {
  return specs.map((spec, index) => {
    const sourceIndex = typeof spec === 'number' ? spec : spec.from;
    const source = question.choices[sourceIndex - 1];
    if (!source) {
      throw new Error(
        `Missing source choice ${sourceIndex} for calibrated question ${question.id}`
      );
    }
    return {
      ...source,
      id: `${question.id}_c${String(index + 1).padStart(2, '0')}`,
      label: typeof spec === 'number' ? source.label : spec.label,
      displayOrder: index + 1,
    };
  });
}

function calibrateQuestion(
  base: QuestionDefinition,
  number: number,
  calibration: QuestionCalibration
): QuestionDefinition {
  const withoutPriority: QuestionDefinition = { ...base };
  delete withoutPriority.priorityFollowUp;
  return {
    ...withoutPriority,
    number,
    prompt: calibration.prompt,
    choices: calibration.choices
      ? buildCalibratedChoices(base, calibration.choices)
      : base.choices.map((choice, index) => ({
          ...choice,
          id: `${base.id}_c${String(index + 1).padStart(2, '0')}`,
          displayOrder: index + 1,
        })),
  };
}

const CALIBRATION: Readonly<Record<number, CategoryCalibration>> = {
  1: {
    keep: [1, 2, 3, 4, 5, 6, 8, 10],
    questions: {
      1: { prompt: 'What kind of relationship are you hoping to build?' },
      2: { prompt: 'How important is marriage in the future you want?' },
      3: { prompt: 'What pace feels right when starting a relationship?' },
      4: { prompt: 'When would you want a relationship to become exclusive?' },
      5: {
        prompt: 'What does commitment mean most to you?',
        choices: choiceSpecs([1, 2, 3, 4, 5, 6, 7, 8]),
      },
      6: {
        prompt: 'What tells you that you are ready for a serious relationship?',
        choices: choiceSpecs([1, 2, 3, 4, 5, 6, 7, 8]),
      },
      8: {
        prompt: "Which parts of the future need to align with a partner's?",
        choices: choiceSpecs(
          [1, 2, 3, 4, 5, 7, 8, 12],
          {
            5: 'Financial goals and preferred lifestyle',
          }
        ),
      },
      10: {
        prompt: 'What must be present for you to choose a lasting partnership?',
        choices: choiceSpecs([1, 2, 3, 4, 5, 6, 7, 8]),
      },
    },
  },
  2: {
    keep: [1, 2, 3, 4, 6, 7, 9, 10],
    questions: {
      1: {
        prompt: 'Which values guide how you try to live?',
        choices: choiceSpecs([1, 2, 3, 4, 5, 7, 9, 10]),
      },
      2: { prompt: 'When you fall short of your values, what do you do first?' },
      3: { prompt: 'What should happen when a promise becomes hard to keep?' },
      4: { prompt: 'If you meant well but still hurt someone, what matters most?' },
      6: { prompt: 'How do you think about personal responsibility?' },
      7: { prompt: 'How comfortable are you admitting you were wrong?' },
      9: {
        prompt: 'Which character traits matter most in a long-term partner?',
        choices: choiceSpecs([1, 3, 4, 5, 6, 10, 12, 13]),
      },
      10: {
        prompt: "If a partner's actions do not match their values, what matters most?",
      },
    },
  },
  3: {
    keep: [1, 2, 3, 4, 5, 6, 7, 10],
    questions: {
      1: { prompt: 'When something is bothering you, when do you want to talk about it?' },
      2: { prompt: 'How directly should a partner raise a difficult concern?' },
      3: {
        prompt: 'What helps you feel heard in an important conversation?',
        choices: choiceSpecs([1, 2, 3, 4, 6, 7, 9, 10]),
      },
      4: { prompt: 'When a partner shares a problem, what do you usually do first?' },
      5: { prompt: 'How much contact do you like during a typical day apart?' },
      6: { prompt: 'How comfortable are you sharing vulnerable feelings?' },
      7: {
        prompt: 'What do you most want to be able to share with a partner?',
        choices: choiceSpecs(
          [1, 2, 3, 5, 6, 8, 9, 10],
          {
            9: 'Faith, prayer, or deeply personal reflections',
          }
        ),
      },
      10: {
        prompt: 'Which communication habits matter most to you in a partner?',
        choices: choiceSpecs([1, 2, 3, 5, 6, 7, 8, 12]),
      },
    },
  },
  4: {
    keep: [1, 2, 3, 4, 6, 7, 8, 10],
    questions: {
      1: { prompt: 'When tension starts, what are you most likely to do?' },
      2: { prompt: 'If a disagreement gets too heated, what should happen next?' },
      3: {
        prompt: 'What makes a compromise fair?',
        choices: choiceSpecs([2, 3, 4, 5, 6, 7, 8, 9]),
      },
      4: { prompt: 'If you cannot fully agree, what outcome is acceptable?' },
      6: {
        prompt: 'What makes an apology feel sincere?',
        choices: choiceSpecs([1, 2, 3, 4, 5, 6, 7, 8]),
      },
      7: { prompt: 'When someone truly takes responsibility, how does forgiveness work for you?' },
      8: {
        prompt: 'If the same conflict keeps coming back, what should happen next?',
        choices: choiceSpecs(
          [1, 2, 3, 4, 5, 6],
          {
            5: 'Pray together or seek counseling or trusted guidance',
          }
        ),
      },
      10: {
        prompt: 'Which conflict patterns would make you question the relationship?',
        choices: choiceSpecs([1, 2, 3, 4, 5, 6, 9, 11]),
      },
    },
  },
  5: {
    keep: [1, 2, 3, 4, 5, 6, 8, 10],
    questions: {
      1: {
        prompt: 'What should exclusivity mean in a committed relationship?',
        choices: choiceSpecs([1, 2, 3, 4, 5, 6, 7, 8]),
      },
      2: { prompt: 'How should a couple divide everyday responsibilities?' },
      3: { prompt: 'If one person carries more for a while, what should happen?' },
      4: { prompt: 'How much independence should each partner keep?' },
      5: {
        prompt: 'Which decisions should a couple discuss before acting?',
        choices: choiceSpecs([1, 2, 3, 4, 5, 6, 8, 10]),
      },
      6: {
        prompt: 'When a couple strongly disagrees on a major decision, what should guide them?',
        choices: choiceSpecs(
          [1, 2, 3, 4, 5, 6, 7],
          {
            6: 'Pray, reflect, or seek trusted counsel before deciding',
          }
        ),
      },
      8: {
        prompt: 'What does being dependable in a relationship look like?',
        choices: choiceSpecs([1, 2, 3, 4, 6, 7, 8, 9]),
      },
      10: {
        prompt: 'If a relationship stays difficult, what should decide whether to keep working on it?',
        choices: choiceSpecs(
          [1, 2, 3, 4, 6, 7, 8, 9],
          {
            8: 'Whether counseling, prayer, or trusted guidance could help',
          }
        ),
      },
    },
  },
  6: {
    keep: [2, 4, 5, 6, 7, 8, 9, 10],
    questions: {
      2: {
        prompt: 'Which boundaries with extended family matter most?',
        choices: choiceSpecs([1, 2, 3, 4, 5, 6, 7, 10]),
      },
      4: { prompt: 'Which ways of building a family would you truly consider?' },
      5: { prompt: 'If having biological children became difficult, what would you want to do?' },
      6: { prompt: 'How should parenting responsibilities be divided?' },
      7: {
        prompt: 'What should guide discipline and expectations for children?',
        choices: choiceSpecs(
          [1, 2, 3, 4, 5, 6],
          {
            6: 'Shared faith, values, and age-appropriate guidance',
          }
        ),
      },
      8: { prompt: 'When parents disagree about a child, what should happen?' },
      9: { prompt: 'If a partner already has children, what role should you have?' },
      10: {
        prompt: 'Which family or parenting differences could be dealbreakers?',
        choices: choiceSpecs(
          [1, 3, 4, 5, 6, 7, 9, 10],
          {
            5: 'Major disagreement about discipline, faith, or core family values',
          }
        ),
      },
    },
  },
  7: {
    keep: [1, 2, 3, 4, 5, 6, 9, 10],
    questions: {
      1: { prompt: 'How would you describe the role of faith or spirituality in your life?' },
      2: { prompt: 'Which faith, spiritual, or nonreligious tradition best describes you?' },
      3: {
        prompt: 'Which faith or spiritual practices are part of your life?',
        choices: choiceSpecs([1, 2, 3, 4, 5, 6, 7, 8, 12, 15, 16]),
      },
      4: { prompt: 'How important is it that a partner shares your beliefs?' },
      5: {
        prompt: 'Where do you and a partner most need faith or worldview alignment?',
        choices: choiceSpecs([1, 3, 4, 5, 6, 7, 8, 11]),
      },
      6: {
        prompt: 'If your beliefs differ, what would keep the relationship healthy?',
        choices: choiceSpecs([1, 2, 3, 4, 5, 6, 8, 9]),
      },
      9: { prompt: 'If children are involved, how should faith or worldview be taught?' },
      10: {
        prompt: 'Which faith or worldview differences could be dealbreakers?',
        choices: choiceSpecs([1, 2, 3, 4, 5, 7, 8, 14]),
      },
    },
  },
  8: {
    keep: [1, 2, 3, 4, 5, 6, 7, 10],
    questions: {
      1: {
        prompt: 'How would you describe your political outlook?',
        choices: choiceSpecs([5, 6, 7, 3, 4, 8, 2, 1, 9, 10, 11, 12, 13]),
      },
      2: { prompt: 'How important is it that a partner shares your political outlook?' },
      3: {
        prompt: 'How are you involved in civic or political life?',
        choices: choiceSpecs([1, 2, 3, 4, 5, 6, 9, 12, 13, 15, 16]),
      },
      4: {
        prompt: 'Which civic principles matter most to you?',
        choices: choiceSpecs([1, 3, 5, 6, 7, 10, 14, 15]),
      },
      5: {
        prompt: 'Which public issues most need alignment in a relationship?',
        choices: choiceSpecs([1, 5, 6, 7, 8, 10, 15, 16]),
      },
      6: { prompt: 'When partners disagree politically, what should guide the conversation?' },
      7: { prompt: 'How much political discussion do you want at home?' },
      10: {
        prompt: 'Which political differences could be dealbreakers?',
        choices: choiceSpecs([1, 2, 3, 4, 7, 8, 11, 12]),
      },
    },
  },
  9: {
    keep: [1, 2, 3, 4, 5, 6, 7, 10],
    questions: {
      1: { prompt: 'How important is serving or helping others in your life?' },
      2: {
        prompt: 'How do you currently serve or contribute?',
        choices: choiceSpecs(
          [1, 2, 3, 4, 5, 6, 7, 8, 11, 16, 17, 18, 19],
          {
            4: 'Serving through a church, faith community, or spiritual community',
          }
        ),
      },
      3: {
        prompt: 'What motivates you to help or serve others?',
        choices: choiceSpecs([1, 2, 3, 4, 5, 6, 10, 15]),
      },
      4: { prompt: 'How important is it that a partner values service?' },
      5: { prompt: 'How much service would you want to do together as a couple?' },
      6: { prompt: 'How should a couple balance service with home and relationship needs?' },
      7: { prompt: 'How should charitable giving be handled as a couple?' },
      10: {
        prompt: 'Which differences about service could be dealbreakers?',
        choices: choiceSpecs([1, 2, 3, 4, 5, 6, 11, 14]),
      },
    },
  },
  10: {
    keep: [1, 2, 3, 4, 5, 6, 7, 10],
    questions: {
      1: {
        prompt: 'What builds trust for you?',
        choices: choiceSpecs(
          [1, 2, 3, 4, 5, 8, 11, 15],
          {
            11: 'Living consistently with faith or principles even when no one is watching',
          }
        ),
      },
      2: {
        prompt: 'What should partners be honest about?',
        choices: choiceSpecs([1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 14, 15]),
      },
      3: { prompt: 'How should privacy work in a committed relationship?' },
      4: { prompt: 'If the truth may hurt, what should guide how it is shared?' },
      5: { prompt: 'If you gave a partner wrong or incomplete information, what should you do?' },
      6: { prompt: 'If a partner keeps breaking commitments, what matters most?' },
      7: {
        prompt: 'After a serious breach of trust, what should guide the next step?',
        choices: choiceSpecs(
          [1, 2, 3, 4, 5, 6, 7],
          {
            4: 'Repair may include forgiveness, prayer, counseling, and firm boundaries',
          }
        ),
      },
      10: {
        prompt: 'Which trust or integrity problems could be dealbreakers?',
        choices: choiceSpecs([1, 2, 3, 4, 5, 6, 7, 8]),
      },
    },
  },
};

export function buildCalibratedCategories(
  categories: readonly CategoryDefinition[]
): CategoryDefinition[] {
  return categories.map((category) => {
    const calibration = CALIBRATION[category.number];
    if (!calibration) {
      throw new Error(`Missing calibration for category ${category.number}`);
    }

    const questions = calibration.keep.map((sourceNumber, index) => {
      const base = category.questions.find(
        (question) => question.number === sourceNumber
      );
      if (!base) {
        throw new Error(
          `Missing source question ${category.number}.${sourceNumber}`
        );
      }
      const questionCalibration = calibration.questions[sourceNumber];
      if (!questionCalibration) {
        throw new Error(
          `Missing calibration for question ${category.number}.${sourceNumber}`
        );
      }
      return calibrateQuestion(base, index + 1, questionCalibration);
    });

    return {
      ...category,
      questions,
      lockedProductDecisions: [
        'The calibrated catalog contains eight focused questions in this category.',
        'Question wording should be direct, respectful, and understandable without clinical language.',
        'Faith-informed answers appear where they naturally affect relationship choices.',
        'The selected base answers carry the alignment signal; no separate priority follow-up is used.',
      ],
      formatDistribution: Object.fromEntries(
        questions.reduce<Map<string, number[]>>((map, question) => {
          const values = map.get(question.formatLabel) ?? [];
          values.push(question.number);
          map.set(question.formatLabel, values);
          return map;
        }, new Map())
      ),
    };
  });
}
