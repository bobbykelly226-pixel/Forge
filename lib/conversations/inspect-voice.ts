import { BlobSource, Input, MP4, WEBM } from 'mediabunny';
import { MESSAGE_ATTACHMENT_MAX_BYTES } from './constants';
import { validVoiceMedia, VOICE_MIME_TYPES } from './voice';

/** Inspect the uploaded bytes; client MIME and duration are never sufficient. */
export async function inspectVoice(blob: Blob, mime: string): Promise<number | null> {
  if (!blob.size || blob.size > MESSAGE_ATTACHMENT_MAX_BYTES || !(VOICE_MIME_TYPES as readonly string[]).includes(mime)) return null;
  const input = new Input({ source: new BlobSource(blob), formats: [MP4, WEBM] });
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      (async () => {
        const [tracks, format, duration] = await Promise.all([input.getTracks(), input.getFormat(), input.computeDuration()]);
        if (tracks.length !== 1 || !tracks[0].isAudioTrack()) return null;
        const codec = await tracks[0].getCodec();
        return validVoiceMedia(duration, format === MP4 ? 'mp4' : format === WEBM ? 'webm' : '', codec, mime) ? duration : null;
      })(),
      new Promise<null>(resolve => { timer = setTimeout(() => { input.dispose(); resolve(null); }, 8000); }),
    ]);
  } catch { return null; }
  finally { if (timer) clearTimeout(timer); input.dispose(); }
}
