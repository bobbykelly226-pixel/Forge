import { ConnectionsHubProvider } from '@/components/connections/ConnectionsHubProvider';

export default function ConnectionsLayout({ children }: { children: React.ReactNode }) {
  return <ConnectionsHubProvider>{children}</ConnectionsHubProvider>;
}
