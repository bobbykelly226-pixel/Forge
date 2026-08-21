import LegalDocumentShell from '@/components/legal/LegalDocumentShell';
import { getLegalDocument } from '@/lib/legal/documents';

const document = getLegalDocument('community_standards');

export default function CommunityStandardsPage() {
  return (
    <LegalDocumentShell {...document}>
      <p>
        Forge is built for intentional, respectful relationships. Every member is
        responsible for protecting the dignity, privacy, and safety of other people.
      </p>

      <h2>Be honest and authentic</h2>
      <ul>
        <li>Use your own identity, age, photos, and accurate relationship information.</li>
        <li>Do not impersonate another person or create deceptive or duplicate accounts.</li>
        <li>Do not misrepresent relationship status, intentions, or material safety information.</li>
      </ul>

      <h2>Treat people with dignity</h2>
      <ul>
        <li>No harassment, threats, stalking, coercion, bullying, or degrading conduct.</li>
        <li>No hateful or discriminatory attacks against a person or protected group.</li>
        <li>No sexual pressure, exploitation, non-consensual content, or unwanted explicit material.</li>
        <li>Respect boundaries, refusals, blocks, ended conversations, and requests for no contact.</li>
      </ul>

      <h2>Protect privacy and safety</h2>
      <ul>
        <li>Do not publish or threaten to publish another person&apos;s private information.</li>
        <li>Do not share private messages, photos, reports, or account information without authorization.</li>
        <li>Do not use Forge to facilitate violence, exploitation, fraud, illegal activity, or self-harm encouragement.</li>
        <li>Report urgent danger to emergency services; Forge reporting is not an emergency-response service.</li>
      </ul>

      <h2>No manipulation or commercial abuse</h2>
      <ul>
        <li>No scams, financial solicitation, spam, mass outreach, or recruitment schemes.</li>
        <li>No bots, scraping, account trading, security bypasses, or unauthorized automation.</li>
      </ul>

      <h2>Moderation and appeals</h2>
      <p>
        Forge may review reports and available evidence, preserve safety records, warn or
        restrict accounts, remove content, suspend access, or remove an account when needed
        to protect members or the service. Members may submit an appeal through the available
        Forge appeal process. Outcomes depend on the facts, severity, pattern, and safety risk.
      </p>

      <p>
        These standards supplement the Terms of Service. They do not limit emergency action,
        lawful reporting, evidence preservation, or cooperation with valid legal process.
      </p>
    </LegalDocumentShell>
  );
}
