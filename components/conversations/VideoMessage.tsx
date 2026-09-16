'use client';
import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MESSAGE_ATTACHMENT_BUCKET } from '@/lib/conversations/constants';

export default function VideoMessage({ path, localUrl }: { path: string; localUrl?: string }) {
  const player = useRef<HTMLVideoElement>(null);
  const alive = useRef(true);
  const [url, setUrl] = useState<string | null>(localUrl ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const load = async () => {
    if (busy) return;
    setBusy(true); setError('');
    try {
      const { data, error: failure } = await createClient().storage.from(MESSAGE_ATTACHMENT_BUCKET).createSignedUrl(path, 60);
      if (!alive.current) return;
      if (failure || !data?.signedUrl) { setError('Video is unavailable. You may no longer have access.'); return; }
      setUrl(data.signedUrl);
    } catch { if (alive.current) setError('Video could not load. Please try again.'); }
    finally { if (alive.current) setBusy(false); }
  };
  return <div className="w-full min-w-48 max-w-sm">
    {url ? <video ref={player} key={url} src={url} controls autoPlay={!localUrl} playsInline preload="metadata" aria-label="Video message" className="max-h-80 w-full rounded-xl bg-black" onError={() => { setUrl(null); setError('Video could not play. Tap to reload it.'); }} />
      : <button type="button" disabled={busy} onClick={() => void load()} className="min-h-12 rounded-lg border border-current px-4 py-3">{busy ? 'Loading video…' : '▶ Play video'}</button>}
    {error && <p role="status" className="mt-2 text-sm">{error}</p>}
  </div>;
}
