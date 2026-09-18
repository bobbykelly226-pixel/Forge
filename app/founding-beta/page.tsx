import type { Metadata } from 'next';
import Image from 'next/image';
import { ArrowRight, MessageCircle, ShieldCheck, Sparkles } from 'lucide-react';

import Header from '@/components/Header';
import FoundingBetaRequestForm from '@/components/founding-beta/FoundingBetaRequestForm';

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
    <div className="min-h-screen bg-[linear-gradient(180deg,#A9ADB3_0%,#D4D5D7_48%,#A9ADB3_100%)] text-[#0B2D5C]">
      <Header />
      <main>
        <section className="bg-[#0B2D5C] px-4 py-5 sm:px-6 sm:py-8">
          <div className="relative mx-auto min-h-[560px] max-w-7xl overflow-hidden rounded-[2rem] border border-white/20 shadow-[0_24px_70px_rgba(5,19,40,0.35)] sm:min-h-[620px]">
            <Image src="/hero-couple.png" alt="A couple overlooking the mountains at sunset" fill priority className="object-cover object-[62%_center]" sizes="100vw" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,19,40,0.94)_0%,rgba(11,45,92,0.82)_38%,rgba(11,45,92,0.22)_72%,rgba(11,45,92,0.08)_100%)]" />
            <div className="relative flex min-h-[560px] items-center px-6 py-14 sm:min-h-[620px] sm:px-12 lg:px-16">
              <div className="max-w-2xl text-white">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#E0CC88]">A personal invitation to help build something meaningful</p>
                <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-6xl">You’re invited to the Forge Founding Beta.</h1>
                <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/90 sm:text-xl">
                  Forge is a values-first dating platform for people seeking meaningful relationships. Founding members will help us test the experience, strengthen the community, and shape the path to launch.
                </p>
                <p className="mt-6 text-xl font-semibold text-[#F1E5BB]">Strong Values. Strong Connections.</p>
                <a href="#request" className="mt-8 inline-flex items-center gap-2 rounded-full border border-white bg-white px-6 py-3.5 font-semibold text-[#0B2D5C] shadow-lg transition hover:-translate-y-0.5 hover:bg-[#F7F7F7]">
                  Request your invitation <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-4 px-5 py-10 sm:grid-cols-3 sm:px-6 sm:py-12">
          {benefits.map(({ icon: Icon, title, copy }) => (
            <article key={title} className="rounded-[1.5rem] border border-[#0B2D5C]/35 bg-[#E6E6E7] p-6 shadow-[0_12px_30px_rgba(11,45,92,0.10)]">
              <span className="inline-flex rounded-full bg-white p-3 shadow-sm"><Icon className="h-6 w-6 text-[#C92027]" aria-hidden="true" /></span>
              <h2 className="mt-4 text-xl font-bold text-[#0B2D5C]">{title}</h2>
              <p className="mt-2 leading-relaxed text-black">{copy}</p>
            </article>
          ))}
        </section>

        <section id="request" className="mx-auto grid max-w-6xl gap-8 px-5 pb-16 pt-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-start lg:pb-24">
          <div className="lg:sticky lg:top-32">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#C92027]">Founding member request</p>
            <h2 className="mt-3 text-4xl font-bold tracking-tight text-[#0B2D5C]">Help forge the experience from the beginning.</h2>
            <p className="mt-5 text-lg leading-relaxed text-black">
              We are intentionally beginning with a small, balanced group. This is not a popularity contest and it is not first-come, first-served. We are looking for thoughtful adults who genuinely want meaningful connection and are willing to tell us what works and what does not.
            </p>
            <div className="mt-6 rounded-r-2xl border-l-4 border-[#C92027] bg-[#E6E6E7] p-5 text-black shadow-[0_10px_24px_rgba(11,45,92,0.08)]">
              <strong className="text-[#0B2D5C]">What happens next?</strong>
              <p className="mt-2 leading-relaxed">Forge privately reviews each request, then sends a seven-day, single-use invitation to the email submitted.</p>
            </div>
          </div>
          <FoundingBetaRequestForm />
        </section>
      </main>
    </div>
  );
}
