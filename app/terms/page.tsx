'use client';

import Header from '../../components/Header';
import Link from 'next/link';

export default function Terms() {
  return (
    <div className="min-h-screen bg-[#F8F6F2] text-[#222222]">
      <Header />

      <main className="pt-14 pb-16 max-w-3xl mx-auto px-6">
        <h1 className="text-5xl font-bold tracking-tight text-[#0B2D5C] mb-5">
          Terms of Service
        </h1>

        <p className="text-sm text-[#666666] mb-8">
          Last updated: July 2026
        </p>

        <div className="prose prose-lg max-w-none text-[#444444] leading-8">
          <p className="mb-4">
            Welcome to Forge. Forge is operated by Forged In Life and is a values-first dating platform focused on helping people build meaningful connections through shared values, character, faith, trust, commitment, and purpose.
          </p>

          <p className="mb-4">
            These Terms of Service explain the basic rules that apply when you visit our website, create a Forge account, submit information through our forms, or interact with Forge-related services.
          </p>

          <p className="mb-8">
            By using the Forge website or creating an account, you agree to these Terms. If you do not agree, please do not use the website or create an account.
          </p>

          <h2 className="text-3xl font-semibold text-[#0B2D5C] mt-8 mb-3">
            Service Status
          </h2>

          <p className="mb-4">
            Forge is currently preparing for beta. Features, availability, and experience may change as the product develops.
          </p>

          <p className="mb-4">
            Forge may change, delay, pause, limit, reject, remove, or discontinue any part of the website, account features, communications, or services at any time.
          </p>

          <p className="mb-8">
            We may accept, deny, remove, or limit account registrations at our discretion, including submissions that appear false, abusive, automated, duplicative, suspicious, or inconsistent with these Terms.
          </p>

          <h2 className="text-3xl font-semibold text-[#0B2D5C] mt-8 mb-3">
            Eligibility
          </h2>

          <p className="mb-4">
            Forge is intended for adults 18 years of age and older.
          </p>

          <p className="mb-8">
            You should not use the website or create an account if you are under 18. We do not intend for minors to use Forge.
          </p>

          <h2 className="text-3xl font-semibold text-[#0B2D5C] mt-8 mb-3">
            Information You Provide
          </h2>

          <p className="mb-4">
            When you create an account or contact us, you agree to provide information that is accurate and that you are authorized to submit.
          </p>

          <p className="mb-8">
            You agree not to submit false, misleading, abusive, unlawful, unauthorized, or fraudulent information through the website, account forms, email systems, or related communication channels.
          </p>

          <h2 className="text-3xl font-semibold text-[#0B2D5C] mt-8 mb-3">
            Acceptable Use
          </h2>

          <p className="mb-3">
            You agree not to misuse the Forge website, accounts, forms, email systems, backend systems, technical infrastructure, or related services.
          </p>

          <p className="mb-3">
            This includes, but is not limited to:
          </p>

          <ul className="list-disc pl-6 space-y-2 mb-8">
            <li>Submitting false or misleading information</li>
            <li>Submitting information on behalf of another person without permission</li>
            <li>Attempting to access systems, data, code, databases, admin areas, accounts, dashboards, API keys, environment variables, logs, or infrastructure without permission</li>
            <li>Attempting to probe, scan, test, bypass, interfere with, or compromise the security of the website or related systems</li>
            <li>Attempting to reverse engineer, scrape, copy, crawl, overload, disrupt, or automate use of the website or account system</li>
            <li>Using bots, scripts, spam tools, fake submissions, disposable abuse patterns, or automated systems to interact with Forge</li>
            <li>Uploading, submitting, transmitting, or attempting to introduce malicious code, harmful files, malware, viruses, or harmful requests</li>
            <li>Interfering with the operation, reliability, security, or performance of the website, forms, email systems, database, hosting, or related services</li>
            <li>Impersonating another person, business, organization, or representative of Forge</li>
            <li>Using Forge for unlawful, harmful, abusive, harassing, fraudulent, or deceptive purposes</li>
          </ul>

          <h2 className="text-3xl font-semibold text-[#0B2D5C] mt-8 mb-3">
            Security and System Integrity
          </h2>

          <p className="mb-4">
            You may not attempt to access, modify, damage, disrupt, overload, or interfere with any Forge system, server, database, codebase, form endpoint, administrative tool, email system, analytics tool, hosting environment, or third-party service connected to Forge.
          </p>

          <p className="mb-4">
            You may not attempt to discover, extract, use, or expose API keys, environment variables, database credentials, private repository information, admin credentials, or other non-public technical information.
          </p>

          <p className="mb-4">
            We may monitor, block, rate limit, filter, reject, remove, or investigate activity that appears suspicious, abusive, automated, fraudulent, or harmful to Forge, our users, our systems, or our service providers.
          </p>

          <p className="mb-8">
            Nothing in these Terms gives you permission to access any non-public part of Forge, its backend systems, source code, database, accounts, infrastructure, or third-party services.
          </p>

          <h2 className="text-3xl font-semibold text-[#0B2D5C] mt-8 mb-3">
            Email Communications
          </h2>

          <p className="mb-4">
            By creating an account, you agree that Forge may send you account confirmation emails, security notices, product updates, and other Forge-related communications.
          </p>

          <p className="mb-8">
            You may request to stop receiving non-essential Forge updates at any time. If unsubscribe tools are added in the future, you may also use those tools to manage your email preferences.
          </p>

          <h2 className="text-3xl font-semibold text-[#0B2D5C] mt-8 mb-3">
            Privacy
          </h2>

          <p className="mb-4">
            Your use of the Forge website and account services is also governed by our{' '}
            <Link href="/privacy" className="text-[#0B2D5C] font-semibold hover:underline">
              Privacy Policy
            </Link>.
          </p>

          <p className="mb-8">
            Please review the Privacy Policy to understand how Forge collects, uses, stores, and protects information submitted through the website.
          </p>

          <h2 className="text-3xl font-semibold text-[#0B2D5C] mt-8 mb-3">
            Intellectual Property
          </h2>

          <p className="mb-4">
            The Forge name, Forged In Life name, logos, branding, website design, written content, visual content, page layouts, graphics, and related materials are owned by Forged In Life or used with permission.
          </p>

          <p className="mb-8">
            You may not copy, reproduce, modify, distribute, display, sell, exploit, or use Forge branding, website content, visual materials, or related intellectual property without written permission, except as allowed by law.
          </p>

          <h2 className="text-3xl font-semibold text-[#0B2D5C] mt-8 mb-3">
            Third-Party Services
          </h2>

          <p className="mb-4">
            Forge may use third-party services for website hosting, database storage, authentication, email delivery, analytics, security, performance monitoring, domain management, and other operational needs.
          </p>

          <p className="mb-8">
            Forge is not responsible for third-party websites, platforms, tools, services, outages, policies, or actions that are not owned or controlled by Forged In Life.
          </p>

          <h2 className="text-3xl font-semibold text-[#0B2D5C] mt-8 mb-3">
            No Professional Advice
          </h2>

          <p className="mb-4">
            The Forge website and related content are provided for general informational and product purposes only.
          </p>

          <p className="mb-8">
            Nothing on the website should be interpreted as legal, financial, medical, therapeutic, counseling, relationship, safety, religious, or professional advice.
          </p>

          <h2 className="text-3xl font-semibold text-[#0B2D5C] mt-8 mb-3">
            No Guarantees
          </h2>

          <p className="mb-4">
            Forge is provided on an as available and as developed basis.
          </p>

          <p className="mb-8">
            We do not guarantee that the website, accounts, emails, forms, features, or related services will always be available, uninterrupted, error-free, secure, accurate, complete, or suitable for your expectations.
          </p>

          <h2 className="text-3xl font-semibold text-[#0B2D5C] mt-8 mb-3">
            Limitation of Liability
          </h2>

          <p className="mb-4">
            To the fullest extent permitted by law, Forged In Life and Forge will not be liable for indirect, incidental, consequential, special, punitive, exemplary, or similar damages arising from your use of, or inability to use, the website, accounts, forms, emails, content, or services.
          </p>

          <p className="mb-8">
            This includes, but is not limited to, loss of data, lost opportunities, service interruptions, technical issues, email delivery issues, unauthorized access, third-party service problems, or reliance on website content.
          </p>

          <h2 className="text-3xl font-semibold text-[#0B2D5C] mt-8 mb-3">
            Indemnification
          </h2>

          <p className="mb-8">
            You agree to be responsible for claims, damages, losses, liabilities, costs, or expenses arising from your misuse of the website, violation of these Terms, violation of another person’s rights, unauthorized access attempts, abusive activity, or unlawful conduct related to Forge.
          </p>

          <h2 className="text-3xl font-semibold text-[#0B2D5C] mt-8 mb-3">
            Changes to the Website or Terms
          </h2>

          <p className="mb-4">
            Forge may update the website, account features, services, or these Terms as the project grows.
          </p>

          <p className="mb-8">
            When we update these Terms, we will revise the “Last updated” date at the top of this page. Continued use of the website after changes are posted means you accept the updated Terms.
          </p>

          <h2 className="text-3xl font-semibold text-[#0B2D5C] mt-8 mb-3">
            Governing Law
          </h2>

          <p className="mb-8">
            These Terms are intended to be governed by the laws of the State of Colorado, without regard to conflict of law principles, unless another jurisdiction’s laws are required to apply.
          </p>

          <h2 className="text-3xl font-semibold text-[#0B2D5C] mt-8 mb-3">
            Contact Us
          </h2>

          <p className="mb-4">
            If you have questions about these Terms of Service, please contact us at:
          </p>

          <p className="text-xl font-semibold text-[#0B2D5C] mb-0">
            <a href="mailto:support@forgedinlife.com" className="hover:underline">
              support@forgedinlife.com
            </a>
          </p>
        </div>
      </main>

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
