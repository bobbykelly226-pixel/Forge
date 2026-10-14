'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { SURVEY_QUESTIONS, SURVEY_VERSION, selectSurveyOption } from '@/lib/survey/questions';
import styles from '@/app/survey/survey.module.css';

export default function SurveyForm() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [error, setError] = useState('');
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [website, setWebsite] = useState('');
  const submitting = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const question = SURVEY_QUESTIONS[step];
  const selected = answers[question.id] ?? [];
  const optional = question.kind === 'text';
  const last = step === SURVEY_QUESTIONS.length - 1;

  useEffect(() => {
    let active = true;
    fetch('/api/survey', { cache: 'no-store' }).then(response => response.json()).then(result => {
      if (active && result.success && typeof result.id === 'string') setSubmissionId(result.id);
    }).catch(() => {});
    return () => { active = false; };
  }, []);

  async function submit() {
    if (submitting.current) return;
    submitting.current = true;
    setPending(true);
    setError('');
    try {
      let id = submissionId;
      if (!id) {
        const session = await fetch('/api/survey', { cache: 'no-store' }).then(response => response.json());
        if (!session.success || typeof session.id !== 'string') throw new Error();
        id = session.id;
        setSubmissionId(id);
      }
      const response = await fetch('/api/survey', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, version: SURVEY_VERSION, answers, website }) });
      const result = await response.json();
      if (!response.ok || !result.success) { setError(result.message ?? 'Your feedback could not be saved. Please try again.'); return; }
      setSuccess(true);
      requestAnimationFrame(() => heading.current?.focus());
    } catch { setError('Your feedback could not be saved. Your answers are still here, please try again.'); }
    finally { submitting.current = false; setPending(false); }
  }

  if (success) return <section className={styles.form} role="status"><h2 ref={heading} tabIndex={-1} className={styles.question}>Thank you. Your feedback will help guide Forge’s priorities.</h2><p>Interested in trying Forge? Exploring the beta is optional and separate from this survey.</p><Link href="/founding-beta" className={styles.betaLink}>Explore the Forge beta</Link><p className={styles.note}>Your response has been saved. No signup is needed.</p></section>;

  function move(next: number) {
    setError('');
    setStep(next);
    requestAnimationFrame(() => {
      heading.current?.focus({ preventScroll: true });
      heading.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
    });
  }

  return (
    <form className={styles.form} onSubmit={event => {
      event.preventDefault();
      if (!optional && !selected.length) {
        setError('Please choose an answer to continue.');
        return;
      }
      if (!last) move(step + 1);
      else void submit();
    }}>
      <div className={styles.honeypot} aria-hidden="true"><label htmlFor="survey-website">Leave this field empty</label><input id="survey-website" name="website" type="text" tabIndex={-1} autoComplete="off" value={website} onChange={event => setWebsite(event.target.value)} /></div>
      <div className={styles.progressRow}><span>Question {step + 1} of {SURVEY_QUESTIONS.length}</span><span>{optional ? 'Optional' : question.kind === 'multiple' ? 'Choose up to three' : 'Choose one'}</span></div>
      <progress className={styles.progress} value={step + 1} max={SURVEY_QUESTIONS.length} aria-label="Survey progress" />
      <h2 ref={heading} tabIndex={-1} className={styles.question} id="survey-question">{question.title}</h2>
      {optional ? (
        <div>
          <label htmlFor={question.id} className={styles.note}>Optional short answer</label>
          <textarea id={question.id} className={styles.textarea} value={selected[0] ?? ''} maxLength={1000} rows={5} onChange={event => setAnswers(previous => ({ ...previous, [question.id]: [event.target.value] }))} aria-describedby="survey-text-note" />
          <p id="survey-text-note" className={styles.note}>Please leave out names and contact details. {(selected[0] ?? '').length}/1000 characters.</p>
        </div>
      ) : (
        <fieldset className={styles.choices} aria-labelledby="survey-question" aria-describedby={error ? 'survey-error' : undefined}>
          {question.options?.map(option => {
            const checked = selected.includes(option);
            const capped = pending || (!checked && selected.length >= 3 && !question.exclusive?.includes(option));
            return (
              <label key={option} className={`${styles.choice} ${checked ? styles.selected : ''}`}>
                <input type={question.kind === 'single' ? 'radio' : 'checkbox'} name={question.id} value={option} checked={checked} disabled={capped} onChange={() => {
                  setAnswers(previous => ({ ...previous, [question.id]: selectSurveyOption(question, previous[question.id] ?? [], option) }));
                  setError('');
                }} />
                <span>{option}</span>
              </label>
            );
          })}
        </fieldset>
      )}
      {question.kind === 'multiple' && <p className={styles.note} aria-live="polite">{selected.length} selected{selected.length === 3 ? ', deselect an answer to choose another.' : '.'}</p>}
      {error && <p className={styles.error} id="survey-error" role="alert">{error}</p>}
      <div className={styles.actions}>
        {step > 0 && <button className={styles.back} type="button" disabled={pending} onClick={() => move(step - 1)}>Back</button>}
        <button className={styles.next} type="submit" disabled={pending}>{pending ? 'Saving feedback…' : last ? 'Submit feedback' : optional && !selected[0]?.trim() ? 'Skip and continue' : 'Continue'}</button>
      </div>
      {pending && <p className={styles.note} role="status">Saving your feedback.</p>}
    </form>
  );
}
