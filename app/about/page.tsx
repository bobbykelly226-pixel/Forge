'use client';

import Footer from '@/components/Footer';
import Header from '../../components/Header';
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
      <Footer />
    </div>
  );
}
