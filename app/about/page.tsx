'use client';

import Header from '../../components/Header';
import Link from 'next/link';
import styles from '../editorial.module.css';

export default function About() {
  return (
    <div className={styles.page}>
      <Header />
      <main>
        <section className={styles.hero} aria-labelledby="about-heading">
          <div className={styles.heroShell}>
            <div className={styles.heroCopy}>
              <span className={styles.eyebrow}>ABOUT FORGE</span>
              <h1 id="about-heading">About <em>Forge.</em></h1>
              <p className={styles.heroLead}>
                Forge is a dating platform for people who value faith, family, commitment, and genuine connection
                over hookup culture and endless swiping.
              </p>
            </div>
            <div className={styles.heroArt}>
              <img src="/Logos/forgedinlife-full-dark.png" alt="Forge" />
            </div>
          </div>
          <div className={styles.heroRule} aria-hidden="true" />
        </section>

        <section className={styles.section} aria-labelledby="built-heading">
          <div className={`${styles.shell} ${styles.split}`}>
            <div className={styles.sectionTitle}>
              <span className={styles.eyebrow}>OUR PURPOSE</span>
              <h2 id="built-heading">Built for <em>Meaningful Relationships</em></h2>
            </div>
            <div className={styles.copy}>
              <p>
                We believe the strongest relationships begin with shared values. While many dating apps prioritize
                volume and superficial interactions, Forge is designed to help people connect through what matters most:
                character, purpose, beliefs, and long-term compatibility.
              </p>
            </div>
          </div>
        </section>

        <section className={`${styles.section} ${styles.sectionSoft}`} aria-labelledby="who-heading">
          <div className={`${styles.shell} ${styles.split}`}>
            <div className={styles.sectionTitle}>
              <span className={styles.eyebrow}>THE COMMUNITY</span>
              <h2 id="who-heading">Who Forge <em>Is For</em></h2>
            </div>
            <div className={styles.copy}>
              <p>
                Forge is for people seeking something more intentional. Whether you&apos;re a professional, first responder,
                military member, healthcare worker, parent, entrepreneur, blue-collar worker, person of faith, or simply
                someone who values commitment and authenticity, Forge was created with you in mind.
              </p>
              <div className={styles.mission}>
                <p>
                  Our mission is simple: <strong>Strong Values. Strong Connections.</strong><br />
                  We believe meaningful relationships are forged through shared values, mutual respect,
                  and a genuine desire to build something lasting.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className={`${styles.section} ${styles.sectionCream}`} aria-labelledby="name-heading">
          <div className={`${styles.shell} ${styles.split}`}>
            <div className={styles.sectionTitle}>
              <span className={styles.eyebrow}>THE PHILOSOPHY</span>
              <h2 id="name-heading">The Meaning Behind <em>Our Name</em></h2>
            </div>
            <div className={styles.copy}>
              <p>
                Forge is more than a name. It represents the belief that the strongest things in life are built with intention, guided by character, and created to last. We believe meaningful relationships grow the same way. They are built through shared values, mutual respect, trust, faith, commitment, and a genuine desire to build a life together.
              </p>
              <p>
                Forge is the platform where those connections begin. Forged In Life is the philosophy behind it. It reflects our belief that life&apos;s strongest relationships are not built on chance alone. They are shaped by the choices we make, the values we live by, and the lives we build together.
              </p>
              <p>Because meaningful relationships aren&apos;t simply found.</p>
              <p className={styles.brandLine}>They&apos;re Forged In Life.</p>
            </div>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="why-heading">
          <div className={`${styles.shell} ${styles.split}`}>
            <div className={styles.sectionTitle}>
              <span className={styles.eyebrow}>WHY FORGE EXISTS</span>
              <h2 id="why-heading">Why We <em>Built Forge</em></h2>
            </div>
            <div className={styles.copy}>
              <p>
                Many people feel disconnected from modern dating culture. Endless swiping, casual interactions,
                and surface-level matching often leave people frustrated and discouraged.
              </p>
              <p>
                Forge was created as an alternative, a place where values come first and meaningful relationships
                can grow from a strong foundation.
              </p>
            </div>
          </div>
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