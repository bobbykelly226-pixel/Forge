'use client';

import { useEffect, useRef, useState } from 'react';
import { chooseRecordingType, VIDEO_MAX_SECONDS } from '@/lib/conversations/video';
import { MESSAGE_ATTACHMENT_MAX_BYTES } from '@/lib/conversations/constants';

export default function VideoRecorder({ onSend, onClose }: { onSend: (file: File, options: { viewOnce: boolean }) => Promise<boolean>; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const preview = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const alive = useRef(true);
  const generation = useRef(0);
  const discard = useRef(false);
  const busy = useRef(false);
  const [phase, setPhase] = useState<'idle' | 'opening' | 'ready' | 'recording' | 'review' | 'sending'>('idle');
  const [remaining, setRemaining] = useState(VIDEO_MAX_SECONDS);
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [needsReload, setNeedsReload] = useState(false);
  const [viewOnce, setViewOnce] = useState(false);

  const stop = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    if (recorder.current?.state === 'recording') recorder.current.stop();
    stream.current?.getTracks().forEach(track => { track.onended = null; track.stop(); });
    stream.current = null;
  };
  useEffect(() => {
    alive.current = true;
    const generationRef = generation;
    dialog.current?.showModal();
    const interrupt = () => { if (document.hidden && stream.current) { generation.current++; discard.current = true; stop(); if (alive.current) { setPhase('idle'); setError('Recording interrupted. Please record again.'); } } };
    document.addEventListener('visibilitychange', interrupt);
    return () => { alive.current = false; generationRef.current++; discard.current = true; stop(); document.removeEventListener('visibilitychange', interrupt); };
  }, []);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);

  const openCamera = async () => {
    if (busy.current) return;
    // SPA navigation keeps the entry document's restrictive media policy.
    // Reload this conversation to obtain its conversation-only permissions.
    const policy = (document as Document & { featurePolicy?: { allowsFeature: (feature: string) => boolean } }).featurePolicy;
    if (policy && (!policy.allowsFeature('camera') || !policy.allowsFeature('microphone'))) {
      setNeedsReload(true);
      setError('Reload this conversation to enable video recording. Copy any unsent message first; then reopen the video button after reloading.');
      return;
    }
    setNeedsReload(false);
    busy.current = true;
    const attempt = ++generation.current;
    stop(); setFile(null); setUrl(''); setError(''); setPhase('opening');
    try {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined' || !chooseRecordingType(type => MediaRecorder.isTypeSupported(type))) throw new Error('unsupported');
      const media = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 24, max: 30 } }, audio: true });
      if (!alive.current || attempt !== generation.current || document.hidden) { media.getTracks().forEach(t => t.stop()); if (alive.current) setPhase('idle'); return; }
      stream.current = media;
      media.getTracks().forEach(track => { track.onended = () => { discard.current = true; stop(); if (alive.current) { setPhase('idle'); setError('Camera or microphone disconnected. Please try again.'); } }; });
      await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
      if (preview.current) { preview.current.srcObject = media; await preview.current.play(); }
      setPhase('ready');
    } catch (cause) {
      stop();
      const name = cause instanceof Error ? cause.name : '';
      let message = 'Camera and microphone could not open. Please try again.';
      if (name === 'NotAllowedError' || name === 'SecurityError') message = 'Camera or microphone access is blocked. Allow both in this site’s browser permissions, then reload this page and try again. Your device or workplace settings may also restrict access.';
      else if (name === 'NotFoundError') message = 'No camera or microphone was found. Connect both, or try recording on your phone.';
      else if (name === 'NotReadableError' || name === 'AbortError') message = 'Your camera or microphone is unavailable. Close other apps using it, check device permissions, and try again.';
      else if (cause instanceof Error && cause.message === 'unsupported') message = 'This browser does not support video recording. Try an updated browser or another device.';
      if (alive.current) { setPhase('idle'); setError(message); }
    } finally { busy.current = false; }
  };
  const record = () => {
    if (!stream.current || recorder.current?.state === 'recording') return;
    const mimeType = chooseRecordingType(type => MediaRecorder.isTypeSupported(type));
    if (!mimeType) return;
    const chunks: Blob[] = [];
    let bytes = 0;
    discard.current = false;
    try {
      const current = new MediaRecorder(stream.current, { mimeType, videoBitsPerSecond: 1_000_000, audioBitsPerSecond: 64_000 });
      recorder.current = current;
      current.ondataavailable = event => { if (event.data.size) { chunks.push(event.data); bytes += event.data.size; if (bytes > MESSAGE_ATTACHMENT_MAX_BYTES) { discard.current = true; stop(); setPhase('idle'); setError('That clip is too large. Please try again.'); } } };
      current.onerror = () => { discard.current = true; stop(); if (alive.current) { setPhase('idle'); setError('Recording failed. Please try again.'); } };
      current.onstop = () => {
        if (!alive.current || discard.current) return;
        const type = current.mimeType.split(';')[0];
        const clip = new File(chunks, `video-hello.${type === 'video/mp4' ? 'mp4' : 'webm'}`, { type });
        if (!clip.size || clip.size > MESSAGE_ATTACHMENT_MAX_BYTES) { setPhase('idle'); setError('That clip could not be saved. Please try again.'); return; }
        if (preview.current) preview.current.srcObject = null;
        setFile(clip); setUrl(URL.createObjectURL(clip)); setPhase('review');
      };
      current.start(200); setPhase('recording'); setRemaining(VIDEO_MAX_SECONDS);
      const started = performance.now();
      // Leave a small encoding margin; the server rejects anything over 15 seconds.
      timer.current = setInterval(() => { const elapsed = performance.now() - started; setRemaining(Math.max(0, Math.ceil((15000 - elapsed) / 1000))); if (elapsed >= 14500) stop(); }, 50);
    } catch { stop(); setPhase('idle'); setError('Recording could not start. Please try again.'); }
  };
  const send = async () => {
    if (!file || busy.current) return;
    busy.current = true; setPhase('sending'); setError('');
    try { if (await onSend(file, { viewOnce })) { onClose(); return; } setError('Video could not be sent. Your clip is here so you can retry.'); }
    catch { setError('Video could not be sent. Please retry.'); }
    finally { busy.current = false; if (alive.current) setPhase('review'); }
  };
  return <dialog ref={dialog} onCancel={event => { event.preventDefault(); if (phase !== 'sending') onClose(); }} aria-labelledby="video-hello-title" className="fixed m-auto max-h-[calc(100dvh-1rem)] w-[min(94vw,480px)] overflow-y-auto rounded-2xl bg-[#E6E6E7] p-3 text-[#0B2D5C] backdrop:bg-black/60 sm:max-h-[90dvh] sm:p-4">
    <div className="flex items-center justify-between gap-3"><h2 id="video-hello-title" className="text-xl font-semibold">Video “Hello”</h2><button type="button" disabled={phase === 'sending'} onClick={onClose} aria-label="Close video recorder" className="min-h-11 min-w-11">✕</button></div>
    {phase !== 'recording' && <>
      <p className="my-2">Send a quick, personal hello in a video up to 15 seconds. Review before sending.</p>
      <p className="mt-3 text-sm text-black"><strong>Keep it respectful.</strong> Nudity, sexually explicit content, harassment, and threats are not allowed. Violations may result in account suspension or removal. <a data-text-link href="/community-standards" target="_blank" rel="noopener noreferrer" aria-label="Community Standards, opens in a new tab" className="underline">Community Standards <span aria-hidden="true">↗</span></a></p>
    </>}
    {url ? <video key={url} src={url} controls playsInline preload="metadata" aria-label="Review your video" className="max-h-[38dvh] w-full rounded-xl bg-black object-contain sm:max-h-[45dvh]" /> : <video ref={preview} muted playsInline autoPlay aria-label="Camera preview" className="max-h-[38dvh] w-full rounded-xl bg-black object-contain sm:max-h-[45dvh]" />}
    {phase === 'review' && <fieldset className="mt-4 rounded-xl border border-[#0B2D5C]/15 bg-white p-3 text-black">
      <legend className="px-1 text-sm font-semibold text-[#0B2D5C]">Choose how it can be viewed</legend>
      <label className="mt-2 flex min-h-11 cursor-pointer items-start gap-3"><input type="radio" name="video-delivery" checked={!viewOnce} onChange={() => setViewOnce(false)} className="mt-1" /><span><strong>Keep in conversation</strong><span className="block text-sm">It can be played again later.</span></span></label>
      <label className="mt-2 flex min-h-11 cursor-pointer items-start gap-3"><input type="radio" name="video-delivery" checked={viewOnce} onChange={() => setViewOnce(true)} className="mt-1" /><span><strong>View Once</strong><span className="block text-sm">It disappears after the recipient opens it. They may still be able to record their screen.</span></span></label>
    </fieldset>}
    {phase === 'recording' && <p role="status" className="my-3 text-center text-xl font-semibold">Recording · {remaining}s remaining</p>}
    {error && <p role="alert" className="my-3">{error}</p>}
    <div className="sticky bottom-0 -mx-3 -mb-3 mt-3 flex flex-wrap justify-end gap-3 bg-[#E6E6E7] px-3 py-3 sm:-mx-4 sm:-mb-4 sm:mt-4 sm:px-4 sm:py-4 [&>button]:min-h-11 [&>button]:rounded-lg [&>button]:bg-[#0B2D5C] [&>button]:px-4 [&>button]:py-2 [&>button]:text-white">
      {phase === 'idle' && (needsReload ? <button type="button" onClick={() => window.location.reload()}>Reload conversation</button> : <button type="button" onClick={() => void openCamera()}>Enable camera & microphone</button>)}
      {phase === 'opening' && <p role="status">Opening camera…</p>}
      {phase === 'ready' && <button type="button" onClick={record}>Record</button>}
      {phase === 'recording' && <button type="button" onClick={stop}>Stop recording</button>}
      {phase === 'review' && <><button type="button" onClick={() => void openCamera()}>Retake</button><button type="button" onClick={() => void send()}>Send video</button></>}
      {phase === 'sending' && <p role="status">Sending video…</p>}
    </div>
  </dialog>;
}
