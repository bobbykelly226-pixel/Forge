'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Mic, Square, X } from 'lucide-react';
import { MESSAGE_ATTACHMENT_MAX_BYTES } from '@/lib/conversations/constants';
import { chooseVoiceRecordingType, formatVoiceTime, VOICE_MAX_SECONDS } from '@/lib/conversations/voice';

type Props = { onClose: () => void; onSend: (file: File) => Promise<boolean> };
type Phase = 'idle' | 'opening' | 'recording' | 'preview' | 'sending';

export default function VoiceRecorder({ onClose, onSend }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const generation = useRef(0);
  const alive = useRef(true);
  const busy = useRef(false);
  const preview = useRef<string | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [seconds, setSeconds] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState('');

  const releaseMicrophone = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    stream.current?.getTracks().forEach(track => track.stop());
    stream.current = null;
  }, []);
  const stop = useCallback(() => {
    if (recorder.current?.state === 'recording') recorder.current.stop();
    releaseMicrophone();
  }, [releaseMicrophone]);
  function discard() {
    generation.current++;
    stop();
    busy.current = false;
    if (preview.current) URL.revokeObjectURL(preview.current);
    preview.current = null;
    setFile(null); setUrl(null); setSeconds(0); setPhase('idle');
  }
  useEffect(() => {
    alive.current = true;
    dialog.current?.showModal();
    const hidden = () => {
      if (document.visibilityState === 'hidden' && (stream.current || recorder.current?.state === 'recording' || busy.current && !preview.current)) {
        generation.current++;
        stop(); busy.current = false;
        setPhase('idle'); setSeconds(0);
        setError('Recording was interrupted. Tap Record to start again.');
      }
    };
    document.addEventListener('visibilitychange', hidden);
    return () => {
      alive.current = false;
      // This is an operation counter, not a DOM ref. Invalidate pending permission requests.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      generation.current++;
      stop();
      if (preview.current) URL.revokeObjectURL(preview.current);
      document.removeEventListener('visibilitychange', hidden);
    };
  }, [stop]);

  async function start() {
    if (busy.current) return;
    setError('');
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setError('Voice recording is not supported here. Open Forge in Safari or Chrome to record a message.'); return;
    }
    const type = chooseVoiceRecordingType(t => MediaRecorder.isTypeSupported(t));
    if (!type) { setError('This browser cannot record a supported voice message. Try Safari or Chrome.'); return; }
    discard();
    const attempt = ++generation.current;
    busy.current = true; setPhase('opening');
    try {
      const media = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      if (!alive.current || attempt !== generation.current) { media.getTracks().forEach(track => track.stop()); return; }
      stream.current = media;
      const recording = new MediaRecorder(media, { mimeType: type, audioBitsPerSecond: 64000 });
      recorder.current = recording;
      const chunks: Blob[] = [];
      let bytes = 0;
      const fail = (message: string) => {
        if (!alive.current || attempt !== generation.current) return;
        generation.current++; stop(); busy.current = false; setPhase('idle'); setError(message);
      };
      recording.ondataavailable = event => {
        if (attempt !== generation.current || !event.data.size) return;
        bytes += event.data.size;
        if (bytes > MESSAGE_ATTACHMENT_MAX_BYTES) { fail('That recording is too large. Please record a shorter message.'); return; }
        chunks.push(event.data);
      };
      recording.onerror = () => fail('Recording failed. Please try again.');
      media.getAudioTracks().forEach(track => { track.onended = () => fail('The microphone disconnected. Please record again.'); });
      recording.onstop = () => {
        if (!alive.current || attempt !== generation.current) return;
        releaseMicrophone(); busy.current = false;
        if (!bytes) { setPhase('idle'); setError('No audio was recorded. Please try again.'); return; }
        const mime = recording.mimeType.split(';')[0];
        const recorded = new File(chunks, `voice-message.${mime === 'audio/mp4' ? 'm4a' : 'webm'}`, { type: mime });
        const nextUrl = URL.createObjectURL(recorded);
        preview.current = nextUrl;
        setFile(recorded); setUrl(nextUrl); setPhase('preview');
      };
      recording.start(250);
      setPhase('recording');
      const started = performance.now();
      timer.current = setInterval(() => {
        const elapsed = (performance.now() - started) / 1000;
        setSeconds(Math.min(VOICE_MAX_SECONDS, Math.floor(elapsed)));
        // Leave a little room for the final encoder packet under the server limit.
        if (elapsed >= (VOICE_MAX_SECONDS - 0.5)) stop();
      }, 100);
    } catch (cause) {
      if (!alive.current || attempt !== generation.current) return;
      releaseMicrophone(); busy.current = false; setPhase('idle');
      setError(cause instanceof DOMException && cause.name === 'NotAllowedError'
        ? 'Allow microphone access in your browser settings, then try again.'
        : 'The microphone could not start. Check that it is connected and try again.');
    }
  }
  async function send() {
    if (!file || busy.current) return;
    busy.current = true; setPhase('sending'); setError('');
    try {
      if (await onSend(file)) { if (alive.current) onClose(); }
      else if (alive.current) { setPhase('preview'); setError('Voice message could not be sent. Your recording is still here—try Send again.'); }
    } catch {
      if (alive.current) { setPhase('preview'); setError('Sending was interrupted. Your recording is still here—try again.'); }
    } finally { busy.current = false; }
  }
  return <dialog ref={dialog} aria-labelledby="voice-recorder-title" onCancel={event => { event.preventDefault(); if (phase !== 'sending') onClose(); }} className="m-auto w-[calc(100%_-_2rem)] max-w-md rounded-xl border border-[#0B2D5C]/20 bg-[#E6E6E7] p-5 text-[#0B2D5C] backdrop:bg-black/50">
    <div className="flex items-center justify-between gap-3">
      <h2 id="voice-recorder-title" className="text-lg font-semibold">Voice message</h2>
      <button type="button" onClick={onClose} disabled={phase === 'sending'} aria-label="Close voice recorder" className="flex h-11 w-11 items-center justify-center rounded-lg disabled:opacity-50"><X aria-hidden="true" className="h-5 w-5" /></button>
    </div>
    <p className="mt-2 text-sm">Record up to 5 minutes. Listen before you send.</p>
    <div className="my-5 rounded-lg border border-[#0B2D5C]/15 bg-[#F7F7F7] p-4">
      {url ? <audio src={url} controls preload="metadata" aria-label="Preview your voice message" className="w-full" />
        : <p role="status" className="flex items-center gap-2"><Mic className={`h-5 w-5 ${phase === 'recording' ? 'text-red-700' : ''}`} aria-hidden="true" />{phase === 'recording' ? `Recording · ${formatVoiceTime(seconds)} / ${formatVoiceTime(VOICE_MAX_SECONDS)}` : phase === 'opening' ? 'Waiting for microphone access…' : 'Ready when you are.'}</p>}
    </div>
    {error && <p role="alert" className="mb-4 text-sm">{error}</p>}
    <div className="flex flex-wrap justify-end gap-2">
      {phase === 'recording' ? <button type="button" onClick={stop} className="flex min-h-11 items-center gap-2 rounded-lg bg-[#0B2D5C] px-4 text-white"><Square className="h-4 w-4" aria-hidden="true" />Stop recording</button>
        : file ? <><button type="button" onClick={discard} disabled={phase === 'sending'} className="min-h-11 rounded-lg border border-[#0B2D5C]/30 px-4 disabled:opacity-50">Record again</button><button type="button" onClick={() => void send()} disabled={phase === 'sending'} className="min-h-11 rounded-lg bg-[#0B2D5C] px-4 text-white disabled:opacity-50">{phase === 'sending' ? 'Sending…' : 'Send voice message'}</button></>
          : <button type="button" onClick={() => void start()} disabled={phase === 'opening'} className="min-h-11 rounded-lg bg-[#0B2D5C] px-4 text-white disabled:opacity-50">Record</button>}
    </div>
  </dialog>;
}
