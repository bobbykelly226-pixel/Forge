import Footer from '@/components/Footer';
import Header from '../components/Header';
import Link from 'next/link';
import styles from './home.module.css';

const coreValues = [
  { title: 'FAITH', icon: '/icon-faith.png', description: 'Build a relationship with a foundation that matters.' },
  { title: 'FAMILY', icon: '/icon-family.png', description: 'Find someone who values family as much as you do.' },
  { title: 'SERVICE', icon: '/icon-service.png', description: 'Connect with people who lead with purpose and give with heart.' },
  { title: 'COMMITMENT', icon: '/icon-commitment.png', description: 'Look for relationships built on loyalty, trust, and lasting commitment.' },
  { title: 'INTEGRITY', icon: '/icon-integrity.png', description: 'Find someone whose actions match their values and words.' },
  { title: 'RESPONSIBILITY', icon: '/icon-responsibility.png', description: 'Connect with people who take ownership of their lives and future.' },
];

export default function Home() {
  return (
    <div className={styles.home}>
      <Header />

      <main>
        <section className={styles.hero} aria-labelledby="home-heading">
          <div className={styles.heroImage} aria-hidden="true" />
          <div className={styles.heroCopy}>
            <span className={styles.heroAccent} aria-hidden="true" />
            <h1 id="home-heading">Strong Values.<span>Strong Connections.</span></h1>
            <p>
              <span className={styles.heroLead}>Forge was built for people who believe the strongest relationships begin with shared values.</span>
              <span className={styles.heroDetail}>If you&apos;re looking for something rooted in faith, family, commitment, and purpose, you&apos;re in the right place.</span>
            </p>
          </div>
          <div className={styles.heroRule} aria-hidden="true" />
        </section>

        <section className={styles.values} aria-labelledby="values-heading">
          <div className={styles.sectionShell}>
            <div className={styles.sectionIntro}>
              <span className={styles.sectionEyebrow}>WHAT GUIDES US</span>
              <h2 id="values-heading">Our Core <em>Values</em></h2>
            </div>
            <div className={styles.valueGrid}>
              {coreValues.map((value, index) => (
                <article className={styles.valueCard} key={value.title}>
                  <span className={styles.valueNumber} aria-hidden="true">0{index + 1}</span>
                  <div className={styles.valueIcon}><img src={value.icon} alt="" /></div>
                  <h3>{value.title}</h3>
                  <p>{value.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.about} aria-labelledby="about-heading">
          <div className={styles.aboutGrid}>
            <div className={styles.aboutCopy}>
              <span className={styles.sectionEyebrow}>ABOUT FORGE</span>
              <h2 id="about-heading">Meaningful relationships don’t happen by chance.<br /><span>They are forged in life.</span></h2>
              <p>
                Forge is a values-first dating platform for people who are tired of surface-level connections and ready for something real.
                We believe the strongest relationships are built on shared values, mutual respect, and a commitment to something greater than ourselves.
              </p>
              <Link href="/about" className={styles.aboutLink}>Learn More About Forge <span aria-hidden="true">→</span></Link>
            </div>
            <div className={styles.aboutMark}>
              <img src="/Logos/forgedinlife-full-dark.png" alt="Forge" />
            </div>
          </div>
        </section>

        <section className={styles.surveyInvitation} aria-labelledby="survey-invitation-heading">
          <div className={styles.sectionShell}>
            <span className={styles.sectionEyebrow}>YOUR EXPERIENCE MATTERS</span>
            <h2 id="survey-invitation-heading">Help shape <em>Forge.</em></h2>
            <p>What has worked, what hasn’t, and what do you wish dating apps did differently? Share your thoughts in our short survey, no name, email, or account required.</p>
            <Link href="/survey" className={styles.surveyLink}>Take the 3 minute survey</Link>
          </div>
        </section>

        <section className={styles.invitation} aria-labelledby="invitation-heading">
          <div className={styles.invitationInner}>
            <h2 id="invitation-heading">Ready to find something more meaningful?</h2>
            <Link href="/founding-beta" className={styles.invitationLink}>Join the Founding Beta</Link>
            <p>Already have an account? <Link href="/login">Log in</Link></p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
