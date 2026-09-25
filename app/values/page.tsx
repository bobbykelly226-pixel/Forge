'use client';

import Header from '../../components/Header';
import Link from 'next/link';
import styles from '../editorial.module.css';

const values = [
  {
    title: 'Faith',
    icon: '/icon-faith.png',
    description: 'We welcome people from every faith background who believe spiritual values play an important role in building meaningful relationships and living a purposeful life.',
  },
  {
    title: 'Family',
    icon: '/icon-family.png',
    description: "Strong families strengthen communities. Whether you're hoping to start a family, grow one, or simply cherish the relationships you already have, family matters here.",
  },
  {
    title: 'Service',
    icon: '/icon-service.png',
    description: 'Many people drawn to Forge dedicate their lives to serving others, including first responders, members of the military, healthcare professionals, teachers, and community leaders.',
  },
  {
    title: 'Commitment',
    icon: '/icon-commitment.png',
    description: 'Meaningful relationships require consistency, commitment, and the willingness to grow together through every season of life.',
  },
  {
    title: 'Integrity',
    icon: '/icon-integrity.png',
    description: 'Honesty, authenticity, and trust are the foundation of every lasting relationship. We believe character matters just as much as compatibility.',
  },
  {
    title: 'Personal Responsibility',
    icon: '/icon-responsibility.png',
    description: 'Healthy relationships begin with personal responsibility. Accountability, self-awareness, and continuous growth help create stronger partners and stronger relationships.',
  },
] as const;

export default function Values() {
  return (
    <div className={styles.page}>
      <Header />
      <main>
        <section className={`${styles.hero} ${styles.valuesHero}`} aria-labelledby="values-heading">
          <div className={styles.heroShell} style={{ gridTemplateColumns: '1fr', minHeight: 'auto' }}>
            <div className={styles.heroCopy}>
              <span className={styles.eyebrow}>WHAT GUIDES US</span>
              <h1 id="values-heading">Our Core <em>Values.</em></h1>
              <p className={styles.heroLead}>Shared values create a stronger starting point for meaningful connection.</p>
            </div>
          </div>
          <div className={styles.heroRule} aria-hidden="true" />
        </section>

        <section className={styles.valuesSection} aria-label="The six core values">
          <div className={styles.shell}>
            <div className={styles.valueGrid}>
              {values.map((value, index) => (
                <article className={styles.valueCard} key={value.title}>
                  <span className={styles.valueNumber} aria-hidden="true">0{index + 1}</span>
                  <span className={styles.valueIcon}><img src={value.icon} alt="" /></span>
                  <h2>{value.title}</h2>
                  <p>{value.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.valuesClosing}>
          <p>Strong Values. <em>Strong Connections.</em></p>
        </section>
      </main>
      {/* Footer */}
      <footer className="bg-[#0B2D5C] text-white/80 py-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div>
              <img src="/Logos/forgedinlife-header-light.png" alt="Forge" className="h-12 w-auto" />
            </div>

            <div className="flex flex-wrap justify-center gap-x-10 gap-y-2 text-sm">
              <Link href="/about" className="hover:text-white transition">About</Link>
              <Link href="/values" className="hover:text-white transition">Values</Link>
              <Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-white transition">Terms of Service</Link>
              <Link href="/contact" className="hover:text-white transition">Contact</Link>
            </div>

            <div className="flex gap-8 text-2xl">
              <a
    href="https://www.facebook.com/profile.php?id=61591000607513"
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Facebook"
    className="hover:text-white transition"
  >
    <svg
      className="h-8 w-8"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M22 12.06C22 6.48 17.52 2 11.94 2S2 6.48 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.84c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.23.2 2.23.2v2.45h-1.26c-1.24 0-1.63.77-1.63 1.56v1.9h2.77l-.44 2.91h-2.33V22C18.34 21.24 22 17.08 22 12.06z" />
    </svg>
  </a>
              <a
    href="https://www.instagram.com/forgedconnections/"
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Instagram"
    className="hover:text-white transition"
  >
    <svg
      className="h-8 w-8"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M7.75 2h8.5A5.76 5.76 0 0 1 22 7.75v8.5A5.76 5.76 0 0 1 16.25 22h-8.5A5.76 5.76 0 0 1 2 16.25v-8.5A5.76 5.76 0 0 1 7.75 2zm0 2A3.76 3.76 0 0 0 4 7.75v8.5A3.76 3.76 0 0 0 7.75 20h8.5A3.76 3.76 0 0 0 20 16.25v-8.5A3.76 3.76 0 0 0 16.25 4h-8.5zM12 7.35A4.65 4.65 0 1 1 12 16.65 4.65 4.65 0 0 1 12 7.35zm0 2A2.65 2.65 0 1 0 12 14.65 2.65 2.65 0 0 0 12 9.35zm5.1-2.3a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2z" />
    </svg>
  </a>
            </div>
          </div>

          <div className="text-center text-xs text-white/60 mt-6">
            © 2026 Forged In Life. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}