'use client';

import { useState } from 'react';
import SurveyForm from './SurveyForm';
import styles from '@/app/survey/survey.module.css';

function FeedbackPrivacy() {
  return <details className={styles.privacy}><summary>How we protect your feedback</summary><p>Answers are not linked to a Forge account. A temporary security cookie and short lived abuse checks protect submissions. Basic hosting logs may include connection information.</p></details>;
}

export default function SurveyContent() {
  const [showIntro, setShowIntro] = useState(true);
  return (
    <main className={`${styles.main} ${showIntro ? '' : styles.mainActive}`}>
      {showIntro ? <div className={styles.intro}>
        <p className={styles.eyebrow}>Your experience matters</p>
        <h1>Help shape a better <em>dating experience.</em></h1>
        <p className={styles.lead}>Tell us what has worked, what hasn’t, and what you wish dating apps did differently.</p>
        <div className={styles.invitation}>
          <strong>A few minutes. A real voice.</strong>
          <p>About 3 minutes. No name, email, or Forge account required. Please don’t include identifying details in written answers.</p>
        </div>
        <FeedbackPrivacy />
      </div> : <h1 className={styles.compactTitle}>Forge feedback survey</h1>}
      <SurveyForm onStageChange={stage => setShowIntro(stage === 0)} />
      {!showIntro && <FeedbackPrivacy />}
    </main>
  );
}
