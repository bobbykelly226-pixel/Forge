'use client';

import { useActionState } from 'react';

import { submitSafetyAppealAction } from '@/app/actions/safety-appeal';
import type { SafetyAppealActionState } from '@/app/actions/safety-appeal';

const INITIAL_STATE: SafetyAppealActionState = { success: false, message: '' };

export default function SafetyAppealForm({ reportId }: { reportId: string }) {
  const [state, formAction, pending] = useActionState(submitSafetyAppealAction, INITIAL_STATE);
  return (
    <form action={formAction} className="mt-8 rounded-[1.75rem] border border-[#0B2D5C]/10 bg-white p-5 shadow-[0_16px_45px_rgba(11,45,92,0.07)] sm:p-7">
      <input type="hidden" name="report_id" value={reportId} />
      <p className="rounded-2xl bg-[#F6F8FB] px-4 py-3 font-mono text-xs text-[#667085]">Report reference: {reportId}</p>
      <label htmlFor="appeal-details" className="mt-5 block text-sm font-semibold text-[#0B2D5C]">Why should this decision be reconsidered?</label>
      <p className="mt-1 text-xs leading-relaxed text-[#667085]">Share relevant facts or context. Do not include passwords, authentication codes, or unrelated sensitive information.</p>
      <textarea id="appeal-details" name="details" required minLength={10} maxLength={2000} rows={8} disabled={pending} className="mt-3 w-full resize-y rounded-2xl border border-[#0B2D5C]/15 px-4 py-3 text-sm text-[#1A2332] outline-none focus:border-[#0B2D5C]/45 focus:ring-2 focus:ring-[#0B2D5C]/10" />
      {state.message ? <p role={state.success ? 'status' : 'alert'} className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${state.success ? 'border-[#2E7D5B]/20 bg-[#F0F8F4] text-[#236548]' : 'border-[#B42318]/20 bg-[#FFF5F4] text-[#9B1C1C]'}`}>{state.message}</p> : null}
      <button type="submit" disabled={pending || state.success} className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-[#0B2D5C] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#123E78] disabled:cursor-not-allowed disabled:opacity-55">{pending ? 'Submitting appeal…' : 'Submit appeal'}</button>
    </form>
  );
}
