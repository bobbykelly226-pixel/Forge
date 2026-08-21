import LegalDocumentShell from '@/components/legal/LegalDocumentShell';
import { getLegalDocument } from '@/lib/legal/documents';

const document = getLegalDocument('sensitive_data_consent');

export default function SensitiveDataConsentPage() {
  return (
    <LegalDocumentShell {...document}>
      <p>
        Forge is a values-first dating service. To provide compatibility, profile,
        communication, safety, and support features, Forge processes information that may be
        sensitive or deeply personal. This consent explains that processing separately from
        the general Privacy Policy.
      </p>

      <h2>Information covered</h2>
      <p>The information you choose to provide may include:</p>
      <ul>
        <li>relationship intentions, preferences, compatibility answers, and personal boundaries;</li>
        <li>sex, dating interests, family circumstances, faith, political views, and values;</li>
        <li>date of birth, general location, profile details, photos, and identity-related information;</li>
        <li>private messages, attachments, safety reports, report evidence, feedback, and appeals.</li>
      </ul>

      <h2>How Forge uses it</h2>
      <ul>
        <li>to create and display the profile choices you authorize;</li>
        <li>to calculate compatibility and determine eligible Discovery introductions;</li>
        <li>to provide messaging, account, support, and safety features;</li>
        <li>to investigate reports, enforce standards, prevent abuse, and preserve audit evidence;</li>
        <li>to operate, secure, troubleshoot, and improve Forge as described in the Privacy Policy.</li>
      </ul>

      <h2>Your choices</h2>
      <p>
        Optional questions may be skipped or withheld when the product offers that choice.
        Public profile visibility and private matching use are separate where Forge provides
        separate controls. Information required for age, eligibility, security, or safety may
        be necessary to use particular features.
      </p>

      <h2>Your consent</h2>
      <p>
        By affirmatively accepting this document, you consent to Forge processing the covered
        information for the purposes above and according to the current Privacy Policy. Forge
        records the version and time of your consent. A material change requires a new
        acceptance before member features continue.
      </p>

      <p>
        This consent does not authorize Forge to sell your personal information. Questions or
        privacy requests may be sent to support@forgedinlife.com.
      </p>
    </LegalDocumentShell>
  );
}
