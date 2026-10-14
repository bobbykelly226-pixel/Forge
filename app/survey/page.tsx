import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
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
      <header className={styles.header}><div className={styles.headerInner}>
        <Image src="/Logos/forgedinlife-header-light.png" alt="Forge, Forged in Life" width={260} height={97} priority />
        <p>Strong Values. Strong Connections.</p>
      </div></header>
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
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <Link href="/" aria-label="Forge home"><Image src="/Logos/forgedinlife-header-light.png" alt="Forge" width={180} height={67} /></Link>
          <nav aria-label="Survey footer">
            <Link href="/about">About Forge</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/community-standards">Community Standards</Link>
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/terms">Terms of Service</Link>
          </nav>
        </div>
        <p className={styles.copyright}>© 2026 Forged In Life. All rights reserved.</p>
      </footer>
    </div>
  );
}
