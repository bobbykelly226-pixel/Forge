import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
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
  // Keep the unfinished intake off Production until storage and abuse protection are ready.
  if (process.env.NODE_ENV === 'production') notFound();
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/" aria-label="Forge home"><Image src="/Logos/forgedinlife-header-light.png" alt="Forge" width={220} height={82} priority /></Link>
        <span>Strong Values. Strong Connections.</span>
      </header>
      <main className={styles.main}>
        <div className={styles.intro}>
          <p className={styles.eyebrow}>Your experience matters</p>
          <h1>Help shape a better dating experience</h1>
          <p>Tell us what has worked, what hasn’t, and what you wish dating apps did differently.</p>
          <p className={styles.note}>About 3 minutes. No name, email, or Forge account required. Please don’t include identifying details in written answers.</p>
        </div>
        <SurveyForm />
      </main>
      <footer className={styles.footer}><Link href="/privacy">Privacy Policy</Link><Link href="/">About Forge</Link></footer>
    </div>
  );
}
