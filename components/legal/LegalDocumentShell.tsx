import Header from '@/components/Header';
import Image from 'next/image';
import Link from 'next/link';
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
        <h1 className="mb-5 text-5xl font-bold tracking-tight text-[#0B2D5C]">
          {title}
        </h1>
        <p className="mb-8 text-sm text-[#666666]">
          Version {version} · Effective {effectiveDate}
        </p>
        <div className="legal-document-content max-w-none leading-8 text-[#444444]">
          {children}
        </div>
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

      <footer className="bg-[#0B2D5C] py-8 text-white/80">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
            <div>
              <Image
                src="/Logos/forgedinlife-header-light.png"
                alt="Forge"
                width={240}
                height={64}
                className="h-12 w-auto"
              />
            </div>

            <div className="flex flex-wrap justify-center gap-x-10 gap-y-2 text-sm">
              <Link href="/about" className="transition hover:text-white">About</Link>
              <Link href="/values" className="transition hover:text-white">Values</Link>
              <Link href="/privacy" className="transition hover:text-white">Privacy Policy</Link>
              <Link href="/terms" className="transition hover:text-white">Terms of Service</Link>
              <Link href="/contact" className="transition hover:text-white">Contact</Link>
            </div>

            <div className="flex gap-8 text-2xl">
              <a
                href="https://www.facebook.com/profile.php?id=61591000607513"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="transition hover:text-white"
              >
                <svg className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M22 12.06C22 6.48 17.52 2 11.94 2S2 6.48 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.84c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.23.2 2.23.2v2.45h-1.26c-1.24 0-1.63.77-1.63 1.56v1.9h2.77l-.44 2.91h-2.33V22C18.34 21.24 22 17.08 22 12.06z" />
                </svg>
              </a>
              <a
                href="https://www.instagram.com/forgedconnections/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="transition hover:text-white"
              >
                <svg className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M7.75 2h8.5A5.76 5.76 0 0 1 22 7.75v8.5A5.76 5.76 0 0 1 16.25 22h-8.5A5.76 5.76 0 0 1 2 16.25v-8.5A5.76 5.76 0 0 1 7.75 2zm0 2A3.76 3.76 0 0 0 4 7.75v8.5A3.76 3.76 0 0 0 7.75 20h8.5A3.76 3.76 0 0 0 20 16.25v-8.5A3.76 3.76 0 0 0 16.25 4h-8.5zM12 7.35A4.65 4.65 0 1 1 12 16.65 4.65 4.65 0 0 1 12 7.35zm0 2A2.65 2.65 0 1 0 12 14.65 2.65 2.65 0 0 0 12 9.35zm5.1-2.3a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2z" />
                </svg>
              </a>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-white/60">
            © 2026 Forged In Life. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
