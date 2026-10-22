export const VOICE_MAX_SECONDS = 60;
export const VOICE_MIME_TYPES = ['audio/mp4', 'audio/webm'] as const;

export function chooseVoiceRecordingType(supports: (type: string) => boolean): string | null {
  return ['audio/mp4;codecs=mp4a.40.2', 'audio/webm;codecs=opus', 'audio/mp4', 'audio/webm'].find(supports) ?? null;
}

export function validVoiceMedia(duration: number, container: string, codec: string | null, mime: string): boolean {
  return Number.isFinite(duration) && duration > 0 && duration <= VOICE_MAX_SECONDS
    && ((mime === 'audio/mp4' && container === 'mp4' && codec === 'aac')
      || (mime === 'audio/webm' && container === 'webm' && codec === 'opus'));
}
