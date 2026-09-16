export const VIDEO_MAX_SECONDS = 15;
export const VIDEO_MIME_TYPES = ['video/mp4', 'video/webm'] as const;
export function chooseRecordingType(supported: (type: string) => boolean): string | null {
  return ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/webm;codecs=vp8,opus', 'video/mp4', 'video/webm'].find(supported) ?? null;
}
export function validateVideoProbe(probe: { streams?: Array<{ codec_type?: string; codec_name?: string; duration?: string; width?: number; height?: number }>; format?: { duration?: string; format_name?: string } }, mime: string): boolean {
  const streams = probe.streams ?? [];
  const video = streams.filter(s => s.codec_type === 'video');
  const audio = streams.filter(s => s.codec_type === 'audio');
  const duration = Number(probe.format?.duration);
  const format = probe.format?.format_name ?? '';
  return Number.isFinite(duration) && duration > 0 && duration <= VIDEO_MAX_SECONDS
    && video.length === 1 && audio.length === 1 && streams.length === 2
    && (video[0].width ?? 0) > 0 && (video[0].width ?? 0) <= 1920
    && (video[0].height ?? 0) > 0 && (video[0].height ?? 0) <= 1920
    && streams.every(s => s.duration === undefined || (Number.isFinite(Number(s.duration)) && Number(s.duration) <= VIDEO_MAX_SECONDS))
    && ((mime === 'video/mp4' && format.includes('mp4') && video[0].codec_name === 'h264' && audio[0].codec_name === 'aac')
      || (mime === 'video/webm' && format.includes('webm') && ['vp8', 'vp9'].includes(video[0].codec_name ?? '') && audio[0].codec_name === 'opus'));
}
