'use client';

import { useState } from 'react';
import { openReportedVideoAction } from '@/app/actions/reported-video';

export default function ReportedVideoReview({ reportId }: { reportId: string }) {
  const [videos, setVideos] = useState<{ id: string; url: string; mimeType: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const open = async () => {
    if (busy) return;
    setBusy(true); setError(''); setVideos([]);
    try {
      const result = await openReportedVideoAction(reportId);
      if (result.success) setVideos(result.videos);
      else setError(result.message);
    } catch { setError('Media could not load. Please try again.'); }
    finally { setBusy(false); }
  };
  return <section className="rounded-2xl border border-[#0B2D5C]/15 bg-white p-5 sm:p-7">
    <h2 className="text-xl font-semibold text-[#0B2D5C]">Reported voice or video</h2>
    <p className="mt-2 text-sm text-black">Review the preserved evidence copy. Access is checked each time you open it, and the private link expires after one minute.</p>
    <button type="button" disabled={busy} onClick={() => void open()} className="mt-4 min-h-11 rounded-lg bg-[#0B2D5C] px-4 py-2 text-white">{busy ? 'Opening media…' : videos.length ? 'Reload reported media' : 'Open reported media'}</button>
    {error && <p role="alert" className="mt-3 text-sm text-black">{error}</p>}
    {videos.map(video => video.mimeType.startsWith('audio/') ? <audio key={video.url} src={video.url} controls preload="none" aria-label="Reported voice message" className="mt-4 w-full" onError={() => { setVideos([]); setError('Playback failed or the private link expired. Open the reported media again.'); }} /> : <video key={video.url} src={video.url} controls playsInline preload="none" aria-label="Reported conversation video" className="mt-4 max-h-96 w-full rounded-lg bg-black" onError={() => { setVideos([]); setError('Playback failed or the private link expired. Open the reported media again.'); }} />)}
  </section>;
}
