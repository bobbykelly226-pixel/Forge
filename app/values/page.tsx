'use client';

import Footer from '@/components/Footer';
import Header from '../../components/Header';
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
      <Footer />
    </div>
  );
}
