import Header from '@/components/Header';
import type { ReactNode } from 'react';

export default function LegalDocumentShell({
  title,
  version,
  effectiveDate,
  children,
}: {
  title: string;
  version: string;
  effectiveDate: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F8F6F2] text-[#222222]">
      <Header />
      <main className="mx-auto max-w-3xl px-6 pb-16 pt-14">
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-[#0B2D5C] sm:text-5xl">
          {title}
        </h1>
        <p className="mb-8 text-sm text-[#666666]">
          Version {version} · Effective {effectiveDate}
        </p>
        <div className="prose prose-lg max-w-none leading-8 text-[#444444]">{children}</div>
      </main>
    </div>
  );
}
