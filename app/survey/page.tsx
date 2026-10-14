import Footer from '@/components/Footer';
import type { Metadata } from 'next';
import Header from '@/components/Header';
import SurveyContent from '@/components/survey/SurveyContent';
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
      <SurveyContent />
      <Footer />
    </div>
  );
}
