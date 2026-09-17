import type { Metadata } from 'next';
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
    <div className="min-h-screen bg-[#A9ADB3] text-[#0B2D5C]">
      <Header />
      <main>
        <section className="border-b border-[#0B2D5C]/20 bg-[#0B2D5C] px-5 py-14 text-white sm:py-20">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#C4AE68]">A personal invitation to help build something meaningful</p>
            <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-6xl">You’re invited to request access to the Forge Founding Beta.</h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/85 sm:text-xl">
              Forge is a values-first dating platform for people seeking meaningful relationships. Founding members will help us test the experience, strengthen the community, and shape the path to launch.
            </p>
            <a href="#request" className="mt-8 inline-flex items-center gap-2 border border-white bg-white px-6 py-3.5 font-semibold text-[#0B2D5C]">
              Request your invitation <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-4 px-5 py-8 sm:grid-cols-3 sm:px-6 sm:py-10">
          {benefits.map(({ icon: Icon, title, copy }) => (
            <article key={title} className="border border-[#0B2D5C] bg-[#E6E6E7] p-5">
              <Icon className="h-7 w-7 text-[#C92027]" aria-hidden="true" />
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
            <div className="mt-6 border-l-4 border-[#C92027] bg-[#E6E6E7] p-5 text-black">
              <strong className="text-[#0B2D5C]">What happens next?</strong>
              <p className="mt-2 leading-relaxed">Forge privately reviews each request. Selected members receive a seven-day, single-use invitation tied to the email they submitted.</p>
            </div>
          </div>
          <FoundingBetaRequestForm />
        </section>
      </main>
    </div>
  );
}
