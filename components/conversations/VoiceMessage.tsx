'use client';

import { useRef, useState } from 'react';
import { Mic } from 'lucide-react';
import { MESSAGE_ATTACHMENT_BUCKET } from '@/lib/conversations/constants';
import { createClient } from '@/lib/supabase/client';

export default function VoiceMessage({ path, localUrl }: { path: string; localUrl?: string }) {
  const [url, setUrl] = useState<string | null>(localUrl ?? null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const loading = useRef(false);
  async function load() {
    if (loading.current) return;
    loading.current = true;
    setBusy(true); setError('');
    try {
      const { data, error: failure } = await createClient().storage.from(MESSAGE_ATTACHMENT_BUCKET).createSignedUrl(path, 120);
      if (failure || !data?.signedUrl) throw new Error('unavailable');
      setUrl(data.signedUrl);
    } catch { setError('Voice message could not load. Try again.'); }
    finally { loading.current = false; setBusy(false); }
  }
  return <div className="w-64 max-w-full space-y-2">
    <p className="flex items-center gap-2 text-sm font-semibold"><Mic className="h-4 w-4" aria-hidden="true" />Voice message</p>
    {url ? <audio key={url} src={url} controls autoPlay={!localUrl} preload="metadata" aria-label="Voice message" className="h-11 w-full"
      onError={() => { setUrl(null); setError('This voice message could not play. Tap Listen to try again.'); }} />
      : <button type="button" disabled={busy} onClick={() => void load()} className="min-h-11 rounded-lg border border-current px-3 text-sm">{busy ? 'Preparing…' : 'Listen'}</button>}
    {error && <p role="alert" className="text-xs">{error}</p>}
  </div>;
}
