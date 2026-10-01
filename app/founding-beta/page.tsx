import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, MessageCircle, ShieldCheck, Sparkles } from 'lucide-react';

import Header from '@/components/Header';
import BetaWaitlistForm from '@/components/founding-beta/BetaWaitlistForm';
import { loadBetaCapacity } from '@/lib/operator/beta-enrollment';
import { isBetaFull } from '@/lib/auth/beta-enrollment';

export const dynamic = 'force-dynamic';
import styles from './founding-beta.module.css';

export const metadata: Metadata = {
  title: 'Join the Forge Founding Beta',
  description: 'Join the Forge Founding Beta and help shape a more intentional dating experience.',
  robots: { index: false, follow: false },
};

const benefits = [
  { icon: Sparkles, title: 'Early access', copy: 'Experience Forge before the broader public launch.' },
  { icon: MessageCircle, title: 'A real voice', copy: 'Your feedback will directly shape what Forge becomes.' },
  { icon: ShieldCheck, title: 'Intentional community', copy: 'Email verification and photo review help keep the community intentional.' },
] as const;

export default async function FoundingBetaPage() {
  const capacity = await loadBetaCapacity();
  const full = capacity ? isBetaFull(capacity) : false;
  return (
    <div className={styles.beta}>
      <Header />
      <main>
        <section className={styles.hero} aria-labelledby="beta-heading">
          <div className={styles.heroPhoto} role="img" aria-label="A couple overlooking the mountains at sunset" />
          <div className={styles.heroInner}>
            <div className={styles.heroCopy}>
              <p className={styles.eyebrow}>Help build something meaningful</p>
              <h1 id="beta-heading">Join the <span>Forge Founding Beta.</span></h1>
              <p className={styles.heroLead}>Forge is a values-first dating platform for people seeking meaningful relationships.</p>
              <p className={styles.heroDetail}>Founding members will help us test the experience, strengthen the community, and shape the path to launch.</p>
              <p className={styles.tagline}>Strong Values. Strong Connections.</p>
              <Link href={full ? "#request" : "/signup"} className={styles.heroLink}>{full ? "Join the waitlist" : "Create your account"} <ArrowRight size={18} aria-hidden="true" /></Link>
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
              <p className={styles.eyebrow}>Become a founding member</p>
              <h2 id="request-heading">Help forge the experience <span>from the beginning.</span></h2>
              <p>
                We are beginning with a small group of adults seeking meaningful connection. Create your account directly and help us test the experience. Tell us what works, what is confusing, and what could be better.
              </p>
              <div className={styles.next}>
                <strong>What happens next?</strong>
                <p>Create your account, confirm your email, then complete your profile. You do not need to request access or wait for approval.</p>
              </div>
            </div>
            <div>{full ? <BetaWaitlistForm /> : <section className="border border-[#0B2D5C] bg-[#E6E6E7] p-7 sm:p-10"><h3 className="text-3xl font-bold text-[#0B2D5C]">Ready to join?</h3><p className="mt-4 text-lg leading-relaxed text-black">You’re welcome to join the Founding Beta. Sign up with your email and password, then check your inbox and spam folder for your confirmation email.</p><Link href="/signup" className="mt-6 inline-flex rounded-lg bg-[#0B2D5C] px-6 py-4 font-semibold text-white">Create your account</Link><p className="mt-5 text-black">Already joined? <Link href="/login" className="font-semibold text-[#0B2D5C] underline">Sign in</Link></p></section>}</div>
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
