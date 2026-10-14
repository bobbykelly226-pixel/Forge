import Footer from '@/components/Footer';
import type { Metadata } from 'next';
import Header from '@/components/Header';
import SurveyForm from '@/components/survey/SurveyForm';
import styles from './survey.module.css';

export const metadata: Metadata = {
  title: 'Help shape a better dating experience | Forge',
  description: 'Share what has worked, what hasn’t, and what you wish dating apps did differently. About 3 minutes, no account required.',
  alternates: { canonical: '/survey' },
  openGraph: { title: 'Help shape a better dating experience', description: 'A short Forge survey. No account required.', url: '/survey' },
  robots: { index: false, follow: false },
};

export default function SurveyPage() {
  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.main}>
        <div className={styles.intro}>
          <p className={styles.eyebrow}>Your experience matters</p>
          <h1>Help shape a better <em>dating experience.</em></h1>
          <p className={styles.lead}>Tell us what has worked, what hasn’t, and what you wish dating apps did differently.</p>
          <div className={styles.invitation}>
            <strong>A few minutes. A real voice.</strong>
            <p>About 3 minutes. No name, email, or Forge account required. Please don’t include identifying details in written answers.</p>
          </div>
          <details className={styles.privacy}><summary>How we protect your feedback</summary><p>Answers are not linked to a Forge account. A temporary security cookie and short lived abuse checks protect submissions. Basic hosting logs may include connection information.</p></details>
        </div>
        <SurveyForm />
      </main>
      <Footer />
    </div>
  );
}
