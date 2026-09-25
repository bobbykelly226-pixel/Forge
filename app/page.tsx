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

        <section className={styles.invitation} aria-labelledby="invitation-heading">
          <div className={styles.invitationInner}>
            <h2 id="invitation-heading">Ready to find something more meaningful?</h2>
            <Link href="/founding-beta" className={styles.invitationLink}>Request Founding Beta Access</Link>
            <p>Already have an account? <Link href="/login">Log in</Link></p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#0B2D5C] text-white/80 py-8 border-t border-white/10">
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
              <Link href="/community-standards" className="hover:text-white transition">Community Standards</Link>
              <Link href="/contact" className="hover:text-white transition">Contact</Link>
              <Link
                href="/login?redirectTo=/internal"
                className="text-white/65 transition hover:text-white"
              >
                Administrator Login
              </Link>
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
