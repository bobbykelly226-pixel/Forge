import { redirect } from 'next/navigation';

/** Legacy short waitlist URL — Forge now uses direct signup. */
export default function WaitRedirect() {
  redirect('/signup');
}
