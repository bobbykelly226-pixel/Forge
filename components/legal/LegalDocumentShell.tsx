import Footer from '@/components/Footer';
import Header from '@/components/Header';
import LegalDocumentAcceptanceAction from '@/components/legal/LegalDocumentAcceptanceAction';
import type { LegalDocumentKey } from '@/lib/legal/documents';
import type { ReactNode } from 'react';

export default function LegalDocumentShell({
  title,
  version,
  effectiveDate,
  documentKey,
  children,
}: {
  title: string;
  version: string;
  effectiveDate: string;
  documentKey: LegalDocumentKey;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F8F6F2] text-[#222222]">
      <Header />
      <main className="mx-auto max-w-4xl px-6 pb-20 pt-20">
        <h1 className="mb-5 text-5xl font-bold tracking-tight text-[#0B2D5C]">
          {title}
        </h1>
        <p className="mb-8 text-sm text-[#666666]">
          Version {version} · Effective {effectiveDate}
        </p>
        <div className="legal-document-content prose max-w-none text-lg leading-8 text-[#444444]">
          {children}
        </div>
        <LegalDocumentAcceptanceAction documentKey={documentKey} />
      </main>

      <style>{`
        .legal-document-content p {
          margin-bottom: 1rem;
        }

        .legal-document-content h2 {
          margin-top: 2rem;
          margin-bottom: 0.75rem;
          color: #0B2D5C;
          font-size: 1.875rem;
          font-weight: 600;
          line-height: 2.25rem;
        }

        .legal-document-content ul {
          margin-bottom: 2rem;
          list-style-type: disc;
          padding-left: 1.5rem;
        }

        .legal-document-content li {
          padding-left: 0.25rem;
        }

        .legal-document-content li + li {
          margin-top: 0.5rem;
        }
      `}</style>

      <Footer />
    </div>
  );
}
