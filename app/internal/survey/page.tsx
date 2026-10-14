import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import ForgeAppCanvas from '@/components/ForgeAppCanvas';
import { isForgeOperatorUser } from '@/lib/operator/access';
import { getOperatorMfaState } from '@/lib/operator/mfa';
import { createClient } from '@/lib/supabase/server';
import { loadSurveyResults } from '@/lib/survey/load-results';
import { surveyChoiceRows, surveyResultsPage } from '@/lib/survey/results';
import { SURVEY_QUESTIONS } from '@/lib/survey/questions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Dating Experience Survey Results | Forge', robots: { index: false, follow: false } };

export default async function SurveyResultsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirectTo=/internal/survey');
  if (!isForgeOperatorUser(user)) notFound();
  const mfa = await getOperatorMfaState(supabase);
  if (mfa.status !== 'verified') redirect('/internal/operator-security?redirectTo=/internal/survey');
  const page = surveyResultsPage((await searchParams).page);
  const results = await loadSurveyResults(page);
  return (
    <ForgeAppCanvas>
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
        <Link href="/internal" className="font-semibold text-[#0B2D5C] underline">Back to Administrator Home</Link>
        <h1 className="mt-6 text-3xl font-semibold text-[#0B2D5C]">Dating Experience Survey</h1>
        <p className="mt-2 text-black">Private results from the seven question survey. Responses are separate from member accounts.</p>
        {!results ? <p role="alert" className="mt-6 border border-[#0B2D5C] bg-[#E6E6E7] p-5 text-black">Results could not be loaded. Please try again.</p> : <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <section className="rounded-md border border-[#0B2D5C] bg-[#E6E6E7] p-5"><h2 className="text-sm font-semibold text-[#0B2D5C]">Total responses</h2><p className="mt-2 text-4xl font-semibold text-[#0B2D5C]">{results.total}</p></section>
            <section className="rounded-md border border-[#0B2D5C] bg-[#E6E6E7] p-5"><h2 className="text-sm font-semibold text-[#0B2D5C]">Responses with written feedback</h2><p className="mt-2 text-4xl font-semibold text-[#0B2D5C]">{results.written_total}</p></section>
          </div>
          {!results.total && <p className="mt-5 text-black">No responses yet. Results will appear here once people submit the survey.</p>}
          <p className="mt-5 text-sm text-black">Percentages use all submitted responses. People can select up to three answers on some questions, so those percentages can total more than 100%. Written feedback is shown exactly as submitted.</p>
          <div className="mt-6 space-y-5">
            {SURVEY_QUESTIONS.filter(q => q.options).map(question => <section key={question.id} className="rounded-md border border-[#0B2D5C] bg-[#E6E6E7] p-4 sm:p-6">
              <h2 className="mb-4 text-lg font-semibold text-[#0B2D5C]">{SURVEY_QUESTIONS.indexOf(question) + 1}. {question.title}</h2>
              <table className="w-full text-left text-sm text-black"><caption className="sr-only">Answer counts and percentages</caption><thead><tr className="border-b border-[#0B2D5C]/30"><th scope="col" className="pb-3 pr-3">Answer</th><th scope="col" className="pb-3 px-2 text-right">Count</th><th scope="col" className="pb-3 pl-2 text-right">Percent</th></tr></thead><tbody>{surveyChoiceRows(question.id, results).map(row => <tr key={row.answer} className="border-b border-[#0B2D5C]/15 last:border-0"><th scope="row" className="py-3 pr-3 font-normal">{row.answer}</th><td className="px-2 text-right tabular-nums">{row.count}</td><td className="pl-2 text-right tabular-nums">{row.percent}%</td></tr>)}</tbody></table>
            </section>)}
          </div>
          <section className="mt-8" aria-labelledby="written-feedback"><h2 id="written-feedback" className="text-2xl font-semibold text-[#0B2D5C]">Written feedback</h2><p className="mt-2 text-sm text-black">Newest first, up to 50 responses per page. Use these answers to identify recurring themes.</p>
            {!results.feedback.length && <p className="mt-4 text-black">No written feedback on this page.</p>}
            <div className="mt-4 space-y-4">{results.feedback.map((response, index) => <article key={response.id} className="rounded-md border border-[#0B2D5C] bg-[#E6E6E7] p-5"><h3 className="font-semibold text-[#0B2D5C]">Response {(page - 1) * 50 + index + 1}</h3><p className="mt-1 text-xs text-[#424B56]">{new Date(response.submitted_at).toLocaleDateString('en-US', { timeZone: 'America/Denver', year: 'numeric', month: 'short', day: 'numeric' })}</p>{response.worthwhile && <div className="mt-4"><h4 className="font-semibold text-[#0B2D5C]">What would make dating worthwhile?</h4><p className="mt-2 whitespace-pre-wrap break-words text-black">{response.worthwhile}</p></div>}{response.feature && <div className="mt-4"><h4 className="font-semibold text-[#0B2D5C]">Requested feature or change</h4><p className="mt-2 whitespace-pre-wrap break-words text-black">{response.feature}</p></div>}</article>)}</div>
            <nav aria-label="Written feedback pages" className="mt-5 flex flex-wrap gap-5">{page > 1 && <Link href={`/internal/survey?page=${page - 1}`} className="inline-flex min-h-11 items-center font-semibold text-[#0B2D5C] underline">Previous page</Link>}{page * 50 < results.written_total && <Link href={`/internal/survey?page=${page + 1}`} className="inline-flex min-h-11 items-center font-semibold text-[#0B2D5C] underline">Next page</Link>}</nav>
          </section>
        </>}
      </main>
    </ForgeAppCanvas>
  );
}
