import { redirect } from 'next/navigation';

/** Legacy waitlist URL — Forge now uses direct signup. */
export default function WaitlistRedirect() {
  redirect('/signup');
}
