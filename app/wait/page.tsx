import { redirect } from 'next/navigation';

/** Preserve the short waitlist URL for Founding Beta recruitment materials. */
export default function WaitRedirect() {
  redirect('/waitlist');
}
