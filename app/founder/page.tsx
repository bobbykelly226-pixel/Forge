'use client';

import Footer from '@/components/Footer';
import Header from '../../components/Header';
import styles from '../editorial.module.css';

export default function Founder() {
  return (
    <div className={styles.page}>
      <Header />
      <main>
        <section className={styles.hero} aria-labelledby="founder-heading">
          <div className={styles.heroShell}>
            <div className={styles.heroCopy}>
              <span className={styles.eyebrow}>MEET THE FOUNDER</span>
              <h1 id="founder-heading">Why I Built <em>Forge.</em></h1>
              <p className={styles.heroLead}>Every meaningful journey begins with a story. Here&apos;s mine.</p>
            </div>
            <div className={styles.heroArt}>
              <blockquote>What if there was a better way?</blockquote>
            </div>
          </div>
          <div className={styles.heroRule} aria-hidden="true" />
        </section>

        <section className={styles.storySection} aria-label="Bobby's story">
          <div className={styles.story}>
            <p className={styles.storyOpening}>Several years ago, after my marriage ended, I found myself stepping back into the world of modern dating. Like many people, I downloaded the popular apps hoping to find a genuine connection.</p>
            <p>Along the way, I met some wonderful people, but I kept running into the same challenge. The things that mattered most to me weren&apos;t easy to find. I could quickly learn someone&apos;s favorite restaurant, their hobbies, or where they liked to travel. But it was much harder to discover the things that truly shape a relationship, faith, family, integrity, service, commitment, and the values that guide someone&apos;s life.</p>
            <p>I wasn&apos;t looking for everyone to think like me. I simply wanted a better way to find people who shared similar principles and were searching for something lasting.</p>
            <blockquote className={styles.storyQuote}>
              <p>Eventually, I found myself asking one simple question.<br />What if there was a better way?</p>
            </blockquote>
            <p>That question eventually became Forge.</p>
            <p>For more than twenty years, I&apos;ve dedicated my career to serving others, as an EMT, a police officer, and now as a registered nurse. I&apos;m also the proud father of two incredible daughters. Those experiences have continually reinforced something I&apos;ve always believed: The strongest relationships aren&apos;t built on perfect compatibility. They&apos;re built on shared values, mutual respect, trust, and a commitment to something greater than ourselves.</p>
            <p>Those aren&apos;t just ideals. They&apos;re principles I&apos;ve tried to live by. And they became the foundation for Forge.</p>
            <p>Forge isn&apos;t about telling people what they should believe. It&apos;s about creating a place where people can be honest about who they are, what they value, and the kind of future they hope to build with someone else.</p>
            <p>My hope is that Forge becomes more than another dating platform. I hope it becomes a community where people who value authenticity, commitment, faith, family, integrity, and meaningful connection finally feel at home.</p>
            <p>Thank you for taking the time to learn my story. Whether you&apos;re here because you&apos;re curious, because you share these values, or because you&apos;re simply looking for something real... Welcome.</p>
          </div>
        </section>

        <section className={styles.founderClosing}>
          <div className={styles.founderClosingInner}>
            <p className={styles.closingLine}>Because meaningful relationships aren&apos;t forged by chance.</p>
            <p className={styles.closingAccent}>They&apos;re Forged In Life.</p>
            <div className={styles.signature}>
              <p>Bobby</p>
              <p>Founder, Forged In Life</p>
            </div>
          </div>
        </section>
      </main>
      {/* Footer */}
      <Footer />
    </div>
  );
}
