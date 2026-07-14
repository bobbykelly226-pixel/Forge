import { CharacterSignalsProvider } from '@/components/character-signals/CharacterSignalsProvider';

export default function CharacterSignalsLayout({ children }: { children: React.ReactNode }) {
  return <CharacterSignalsProvider>{children}</CharacterSignalsProvider>;
}
