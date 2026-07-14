import { redirect } from 'next/navigation';

/**
 * Legacy mock Jessica route. Live Discovery uses /discovery/profile/[profileId].
 * Kept only so old links land calmly instead of 404.
 */
export default function LegacyDiscoveryProfilePage() {
  redirect('/discovery');
}
