'use client';

import Footer from '@/components/Footer';
import Header from '../../components/Header';
import { getLegalDocument } from '@/lib/legal/documents';
import LegalDocumentAcceptanceAction from '@/components/legal/LegalDocumentAcceptanceAction';

const document = getLegalDocument('privacy');

export default function Privacy() {
  return (
    <div className="min-h-screen bg-[#F8F6F2] text-[#222222]">
      <Header />

      <main className="pt-14 pb-16 max-w-3xl mx-auto px-6">
        <h1 className="text-5xl font-bold tracking-tight text-[#0B2D5C] mb-5">
          Privacy Policy
        </h1>

        <p className="text-sm text-[#666666] mb-8">
          Version {document.version} · Effective {document.effectiveDate}
        </p>

        <div className="prose prose-lg max-w-none text-[#444444] leading-8">
          <p className="mb-4">
            Forged In Life operates Forge, a values-first dating platform focused on helping people build meaningful connections through shared values, character, faith, trust, commitment, and purpose.
          </p>

          <p className="mb-4">
            This Privacy Policy explains what information we collect, how we use it, how we protect it, and the choices available to you when you visit our website, create an account, or use Forge-related services.
          </p>

          <p className="mb-8">
            This Privacy Policy applies to the Forge website and account experience. As Forge grows — including matching features, mobile apps, or additional services — this policy may be updated to reflect those changes.
          </p>

          <h2 className="text-3xl font-semibold text-[#0B2D5C] mt-8 mb-3">
            Information We Collect
          </h2>

          <p className="mb-3">
            When you create a Forge account, complete your profile, or contact us, we may collect:
          </p>

          <ul className="list-disc pl-6 space-y-2 mb-5">
            <li>Your name and email address</li>
            <li>Account credentials and authentication data</li>
            <li>Profile information you choose to provide</li>
            <li>Any information you choose to submit through our forms or messages</li>
          </ul>

          <p className="mb-4">
            We may also receive basic technical information related to your visit, such as general usage activity, device type, browser type, pages visited, referral source, approximate location, and similar website performance information.
          </p>

          <p className="mb-8">
            We do not currently collect payment information, government identification numbers, or Social Security numbers through the Forge website.
          </p>

          <h2 className="text-3xl font-semibold text-[#0B2D5C] mt-8 mb-3">
            How We Use Your Information
          </h2>

          <p className="mb-3">
            We may use the information we collect to:
          </p>

          <ul className="list-disc pl-6 space-y-2 mb-5">
            <li>Create and manage your Forge account</li>
            <li>Provide authentication, onboarding, and profile features</li>
            <li>Send account-related emails such as confirmation and security notices</li>
            <li>Send occasional product updates about Forge</li>
            <li>Respond to questions or requests</li>
            <li>Improve the website and user experience</li>
            <li>Monitor website performance</li>
            <li>Help prevent spam, abuse, or misuse of the website</li>
            <li>Maintain basic records related to your account and service use</li>
          </ul>

          <p className="mb-8">
            We do not sell your personal information.
          </p>

          <h2 className="text-3xl font-semibold text-[#0B2D5C] mt-8 mb-3">
            Email Communications
          </h2>

          <p className="mb-4">
            If you create an account or contact us, we may email you about account activity, Forge updates, product availability, and related announcements.
          </p>

          <p className="mb-8">
            You may request to stop receiving non-essential Forge updates at any time. If unsubscribe tools are added in the future, you may also use those tools to manage your email preferences.
          </p>

          <h2 className="text-3xl font-semibold text-[#0B2D5C] mt-8 mb-3">
            How We Share Information
          </h2>

          <p className="mb-4">
            We do not sell, rent, or trade your personal information.
          </p>

          <p className="mb-4">
            We may share limited information with trusted service providers that help us operate the website, manage accounts, send emails, host the site, store data, analyze site performance, or protect the site from misuse.
          </p>

          <p className="mb-4">
            These providers may only access information needed to perform their services for Forge.
          </p>

          <p className="mb-8">
            We may also disclose information if required by law, legal process, or a reasonable request from a government authority, or if needed to protect the rights, safety, or security of Forge, our users, or others.
          </p>

          <h2 className="text-3xl font-semibold text-[#0B2D5C] mt-8 mb-3">
            Data Storage and Security
          </h2>

          <p className="mb-4">
            We take reasonable steps to protect the information submitted through the Forge website. These steps may include using trusted service providers, access controls, secure hosting, and other technical or organizational safeguards.
          </p>

          <p className="mb-8">
            However, no website, online service, database, or electronic storage system can be guaranteed to be completely secure.
          </p>

          <h2 className="text-3xl font-semibold text-[#0B2D5C] mt-8 mb-3">
            Data Retention
          </h2>

          <p className="mb-4">
            We keep account and service information for as long as needed to provide Forge, communicate about the product, improve the website, comply with legal obligations, resolve disputes, or maintain appropriate business records.
          </p>

          <p className="mb-8">
            You may request account deletion or data removal as described in the Contact Us section below.
          </p>

          <h2 className="text-3xl font-semibold text-[#0B2D5C] mt-8 mb-3">
            Your Choices
          </h2>

          <p className="mb-3">
            You may ask us to:
          </p>

          <ul className="list-disc pl-6 space-y-2 mb-5">
            <li>Delete or deactivate your Forge account</li>
            <li>Stop sending non-essential Forge updates</li>
            <li>Correct basic contact or profile information</li>
            <li>Delete information associated with your account, where applicable</li>
          </ul>

          <p className="mb-8">
            Some information may be retained if needed for legal, security, fraud prevention, or legitimate business record purposes.
          </p>

          <h2 className="text-3xl font-semibold text-[#0B2D5C] mt-8 mb-3">
            Cookies and Analytics
          </h2>

          <p className="mb-4">
            Forge may use basic website tools, cookies, analytics, or similar technologies to understand how visitors use the site, improve performance, and support authentication.
          </p>

          <p className="mb-8">
            These tools may collect general technical information such as browser type, device type, pages visited, referral source, and general usage patterns.
          </p>

          <p className="mb-8">
            Forge uses Vercel Web Analytics and Speed Insights to measure aggregate product usage and performance. Before analytics events are sent, Forge removes query strings, URL fragments, profile identifiers, conversation identifiers, and authentication tokens. Forge does not send names, email addresses, profile answers, exact locations, profile text, message content, feedback text, report details, photos, or file names to these analytics tools. Preview and testing traffic is excluded from launch analytics.
          </p>

          <h2 className="text-3xl font-semibold text-[#0B2D5C] mt-8 mb-3">
            Children and Age Restrictions
          </h2>

          <p className="mb-4">
            Forge is intended for adults 18 years of age and older.
          </p>

          <p className="mb-8">
            We do not knowingly collect personal information from children under 13. We also do not intend for minors to create Forge accounts. If we learn that we have collected information from a child or minor, we will take reasonable steps to delete that information.
          </p>

          <h2 className="text-3xl font-semibold text-[#0B2D5C] mt-8 mb-3">
            Third-Party Services
          </h2>

          <p className="mb-4">
            Forge may use third-party services for website hosting, database storage, authentication, email delivery, analytics, security, and website performance.
          </p>

          <p className="mb-8">
            These services may process limited information as needed to support the website and account system.
          </p>

          <h2 className="text-3xl font-semibold text-[#0B2D5C] mt-8 mb-3">
            Changes to This Policy
          </h2>

          <p className="mb-8">
            We may update this Privacy Policy as Forge grows or as our services change. When we update the policy, we will revise the “Last updated” date at the top of this page.
          </p>

          <h2 className="text-3xl font-semibold text-[#0B2D5C] mt-8 mb-3">
            Contact Us
          </h2>

          <p className="mb-4">
            If you have questions about this Privacy Policy or how your information is handled, please contact us at:
          </p>

          <p className="text-xl font-semibold text-[#0B2D5C] mb-0">
            <a href="mailto:support@forgedinlife.com" className="hover:underline">
              support@forgedinlife.com
            </a>
          </p>
        </div>
        <LegalDocumentAcceptanceAction documentKey={document.key} />
      </main>

      <Footer />
    </div>
  );
}
