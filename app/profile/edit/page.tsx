import { redirect } from 'next/navigation';

type PageProps = {
  searchParams?: Promise<{ section?: string }>;
};

/**
 * Compatibility route — editing now lives on /profile.
 * Preserves old links without maintaining a second editor.
 */
export default async function ProfileEditRedirectPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};
  const section = params.section?.trim();
  if (section) {
    redirect(`/profile?section=${encodeURIComponent(section)}`);
  }
  redirect('/profile');
}
