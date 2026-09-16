'use client';
import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MESSAGE_ATTACHMENT_BUCKET } from '@/lib/conversations/constants';
import { openViewOnceVideoAction } from '@/app/actions/view-once-video';

type Props = {
  path: string;
  localUrl?: string;
  attachmentId: string | null;
  viewOnce: boolean;
  viewedAt: string | null;
  isSent: boolean;
};

export default function VideoMessage({ path, localUrl, attachmentId, viewOnce, viewedAt, isSent }: Props) {
  const player = useRef<HTMLVideoElement>(null);
  const alive = useRef(true);
  const [url, setUrl] = useState<string | null>(viewOnce ? null : localUrl ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [consumed, setConsumed] = useState(Boolean(viewedAt));
  const isConsumed = consumed || Boolean(viewedAt);
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

  const openOnce = async () => {
    if (busy || !attachmentId || isConsumed) return;
    setBusy(true); setError('');
    try {
      const result = await openViewOnceVideoAction(attachmentId);
      if (!alive.current) return;
      if (!result.success) {
        if (result.consumed) setConsumed(true);
        setError(result.message);
        return;
      }
      setConsumed(true);
      setUrl(result.url);
    } catch {
      if (alive.current) setError('This video could not be opened.');
    } finally {
      if (alive.current) setBusy(false);
    }
  };

  if (viewOnce && isSent) {
    return <div className="min-w-48 rounded-xl border border-current/20 px-4 py-3">
      <p className="font-semibold">View Once video</p>
      <p className="mt-1 text-sm opacity-75">{viewedAt ? 'Viewed' : 'Sent, not opened yet'}</p>
    </div>;
  }

  if (viewOnce && !url) {
    return <div className="min-w-48 max-w-sm">
      {isConsumed ? <div className="rounded-xl border border-current/20 px-4 py-3"><p className="font-semibold">Video viewed</p><p className="mt-1 text-sm opacity-75">This View Once video is no longer available.</p></div>
        : <button type="button" disabled={busy || !attachmentId} onClick={() => void openOnce()} className="min-h-12 rounded-lg border border-current px-4 py-3 text-left"><span className="block font-semibold">{busy ? 'Opening video…' : '▶ Open View Once video'}</span><span className="mt-1 block text-sm opacity-75">You can open this one time.</span></button>}
      {error && <p role="status" className="mt-2 text-sm">{error}</p>}
    </div>;
  }

  return <div className="w-full min-w-48 max-w-sm">
    {url ? <video ref={player} key={url} src={url} controls autoPlay={!localUrl} playsInline preload="metadata" aria-label={viewOnce ? 'View Once video message' : 'Video message'} className="max-h-80 w-full rounded-xl bg-black" onEnded={() => { if (viewOnce) { setUrl(null); setConsumed(true); } }} onError={() => { setUrl(null); setError(viewOnce ? 'Video playback failed. This View Once video is no longer available.' : 'Video could not play. Tap to reload it.'); }} />
      : <button type="button" disabled={busy} onClick={() => void load()} className="min-h-12 rounded-lg border border-current px-4 py-3">{busy ? 'Loading video…' : '▶ Play video'}</button>}
    {error && <p role="status" className="mt-2 text-sm">{error}</p>}
  </div>;
}
