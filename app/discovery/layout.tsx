import { DiscoveryActionsProvider } from '@/components/discovery/DiscoveryActionsProvider';

export default function DiscoveryLayout({ children }: { children: React.ReactNode }) {
  return <DiscoveryActionsProvider>{children}</DiscoveryActionsProvider>;
}
