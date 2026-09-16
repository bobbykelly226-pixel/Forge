import { BlobSource, Input, MP4, WEBM } from 'mediabunny';
import { MESSAGE_ATTACHMENT_MAX_BYTES } from './constants';
import { validateVideoProbe } from './video';

/** Parses the uploaded bytes on the server. Never accepts client-supplied duration. */
export async function inspectVideo(blob: Blob, mime: string): Promise<number | null> {
  if (!blob.size || blob.size > MESSAGE_ATTACHMENT_MAX_BYTES || !['video/mp4', 'video/webm'].includes(mime)) return null;
  const input = new Input({ source: new BlobSource(blob), formats: [MP4, WEBM] });
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      (async () => {
        const [tracks, format, duration] = await Promise.all([input.getTracks(), input.getFormat(), input.computeDuration()]);
        const videos = tracks.filter(t => t.isVideoTrack());
        const audios = tracks.filter(t => t.isAudioTrack());
        if (tracks.length !== 2 || videos.length !== 1 || audios.length !== 1) return null;
        const [videoCodec, audioCodec, width, height] = await Promise.all([
          videos[0].getCodec(), audios[0].getCodec(), videos[0].getDisplayWidth(), videos[0].getDisplayHeight(),
        ]);
        const probe = {
          format: { duration: String(duration), format_name: format === MP4 ? 'mp4' : format === WEBM ? 'webm' : '' },
          streams: [{ codec_type: 'video', codec_name: videoCodec === 'avc' ? 'h264' : videoCodec ?? '', width, height }, { codec_type: 'audio', codec_name: audioCodec ?? '' }],
        };
        return validateVideoProbe(probe, mime) ? duration : null;
      })(),
      new Promise<null>(resolve => { timer = setTimeout(() => { input.dispose(); resolve(null); }, 8000); }),
    ]);
  } catch { return null; }
  finally { if (timer) clearTimeout(timer); input.dispose(); }
}
