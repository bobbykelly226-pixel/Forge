import { SURVEY_QUESTIONS } from './questions';

export type SurveyResults = {
  total: number;
  counts: { question: string; answer: string; count: number }[];
  written_total: number;
  page: number;
  feedback: { id: string; submitted_at: string; worthwhile: string | null; feature: string | null }[];
};

export function surveyChoiceRows(questionId: string, results: SurveyResults) {
  const question = SURVEY_QUESTIONS.find(q => q.id === questionId);
  return (question?.options ?? []).map(answer => {
    const count = results.counts.find(row => row.question === questionId && row.answer === answer)?.count ?? 0;
    return { answer, count, percent: results.total ? Math.round(count / results.total * 100) : 0 };
  });
}

export function surveyResultsPage(value: string | undefined): number {
  const page = Number(value ?? '1');
  return Number.isSafeInteger(page) && page > 0 && page <= 100000 ? page : 1;
}
