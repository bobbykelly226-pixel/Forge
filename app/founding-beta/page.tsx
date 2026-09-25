import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, MessageCircle, ShieldCheck, Sparkles } from 'lucide-react';

import Header from '@/components/Header';
import FoundingBetaRequestForm from '@/components/founding-beta/FoundingBetaRequestForm';
import styles from './founding-beta.module.css';

export const metadata: Metadata = {
  title: 'Forge Founding Beta Invitation',
  description: 'Request a personal invitation to help shape the Forge Founding Beta.',
  robots: { index: false, follow: false },
};

const benefits = [
  { icon: Sparkles, title: 'Early access', copy: 'Experience Forge before the broader public launch.' },
  { icon: MessageCircle, title: 'A real voice', copy: 'Your feedback will directly shape what Forge becomes.' },
  { icon: ShieldCheck, title: 'Intentional community', copy: 'Every Founding Beta request is reviewed before an invitation is issued.' },
] as const;

export default function FoundingBetaPage() {
  return (
    <div className={styles.beta}>
      <Header />
      <main>
        <section className={styles.hero} aria-labelledby="beta-heading">
          <div className={styles.heroPhoto} role="img" aria-label="A couple overlooking the mountains at sunset" />
          <div className={styles.heroInner}>
            <div className={styles.heroCopy}>
              <p className={styles.eyebrow}>A personal invitation to help build something meaningful</p>
              <h1 id="beta-heading">You’re invited to the <span>Forge Founding Beta.</span></h1>
              <p className={styles.heroLead}>Forge is a values-first dating platform for people seeking meaningful relationships.</p>
              <p className={styles.heroDetail}>Founding members will help us test the experience, strengthen the community, and shape the path to launch.</p>
              <p className={styles.tagline}>Strong Values. Strong Connections.</p>
              <a href="#request" className={styles.heroLink}>Request your invitation <ArrowRight size={18} aria-hidden="true" /></a>
            </div>
          </div>
          <div className={styles.heroRule} aria-hidden="true" />
        </section>

        <section className={styles.benefits} aria-labelledby="benefits-heading">
          <div className={styles.shell}>
            <span className={styles.eyebrow}>THE FOUNDING BETA</span>
            <h2 id="benefits-heading">Help shape <em>what comes next.</em></h2>
            <div className={styles.benefitGrid}>
              {benefits.map(({ icon: Icon, title, copy }, index) => (
                <article key={title} className={styles.benefitCard}>
                  <span className={styles.benefitNumber} aria-hidden="true">0{index + 1}</span>
                  <span className={styles.benefitIcon}><Icon size={29} aria-hidden="true" /></span>
                  <h3>{title}</h3>
                  <p>{copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="request" className={styles.request} aria-labelledby="request-heading">
          <div className={styles.requestGrid}>
            <div className={styles.requestCopy}>
              <p className={styles.eyebrow}>Founding member request</p>
              <h2 id="request-heading">Help forge the experience <span>from the beginning.</span></h2>
              <p>
                We are intentionally beginning with a small, balanced group. This is not a popularity contest and it is not first-come, first-served. We are looking for thoughtful adults who genuinely want meaningful connection and are willing to tell us what works and what does not.
              </p>
              <div className={styles.next}>
                <strong>What happens next?</strong>
                <p>Forge privately reviews each request, then sends a seven-day, single-use invitation to the email submitted.</p>
              </div>
            </div>
            <FoundingBetaRequestForm />
          </div>
        </section>
      </main>
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <Link href="/" aria-label="Forge home"><img src="/Logos/forgedinlife-header-light.png" alt="Forge" /></Link>
          <nav aria-label="Footer">
            <Link href="/">Home</Link>
            <Link href="/about">About</Link>
            <Link href="/community-standards">Community Standards</Link>
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/terms">Terms of Service</Link>
            <Link href="/contact">Contact</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
