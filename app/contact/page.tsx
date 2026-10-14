import Footer from '@/components/Footer';
import Header from '../../components/Header';
import Link from 'next/link';

export default function Contact() {
  return (
    <div className="min-h-screen bg-[#F8F6F2] text-[#222222]">
      <Header />

      <div className="pt-20 pb-20 max-w-3xl mx-auto px-6 text-center">
        <h1 className="text-5xl font-bold tracking-tight text-[#0B2D5C] mb-10">Contact Us</h1>

        <div className="prose prose-lg max-w-2xl mx-auto text-[#444444] space-y-8">
          <p className="text-xl">
            We would love to hear from you.
          </p>

          <p>
            Forge is currently in founding beta. Use the private in-app form for product help and feedback, or email us when you cannot sign in.
          </p>

          <div className="rounded-2xl border border-[#0B2D5C]/10 bg-white/75 px-5 py-6">
            <h2 className="text-3xl font-semibold text-[#0B2D5C] mb-4">Beta Product Support</h2>
            <p className="text-lg">
              Signed-in beta members can privately report something broken or confusing, ask for help, or share an idea.
            </p>
            <Link
              href="/feedback"
              className="mt-5 inline-flex rounded-2xl bg-[#0B2D5C] px-5 py-3 font-semibold text-white no-underline hover:bg-[#0A2540]"
            >
              Send Beta Feedback
            </Link>
          </div>

          <div className="pt-6 border-t border-[#0B2D5C]/10">
            <h2 className="text-3xl font-semibold text-[#0B2D5C] mb-4">General Inquiries</h2>
            <p className="text-lg">
              For general questions, launch support, feedback, or Forge updates, contact:
            </p>
            <p className="text-xl sm:text-2xl font-semibold text-[#0B2D5C] mt-6 break-words">
              <a href="mailto:hello@forgedinlife.com" className="hover:underline">hello@forgedinlife.com</a>
            </p>
          </div>

          <div className="pt-6 border-t border-[#0B2D5C]/10">
            <h2 className="text-3xl font-semibold text-[#0B2D5C] mb-4">Support and Policy Questions</h2>
            <p className="text-lg">
              For privacy, terms, or account-access questions—including when you cannot sign in—contact:
            </p>
            <p className="text-xl sm:text-2xl font-semibold text-[#0B2D5C] mt-6 break-words">
              <a href="mailto:support@forgedinlife.com" className="hover:underline">support@forgedinlife.com</a>
            </p>
          </div>

          <p className="pt-8 text-lg">
            Member or safety concerns should use Report or Block from the relevant profile or conversation. Product feedback never replaces Forge&apos;s safety tools.
          </p>
        </div>
      </div>

      {/* Footer - unchanged */}
      <Footer />
    </div>
  );
}
