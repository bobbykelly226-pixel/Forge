import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { chooseVoiceRecordingType, validVoiceMedia } from '../conversations/voice';
import { inspectVoice } from '../conversations/inspect-voice';
import { validateMessageAttachment } from '../conversations/attachments';

test('voice format negotiation supports Safari MP4 and Chromium WebM and fails closed', () => {
  assert.equal(chooseVoiceRecordingType(t => t === 'audio/mp4'), 'audio/mp4');
  assert.equal(chooseVoiceRecordingType(t => t === 'audio/webm;codecs=opus'), 'audio/webm;codecs=opus');
  assert.equal(chooseVoiceRecordingType(() => false), null);
});
test('voice accepts only finite bounded durations and matching containers/codecs', () => {
  assert.equal(validVoiceMedia(60, 'mp4', 'aac', 'audio/mp4'), true);
  for (const duration of [0, -1, 60.001, NaN, Infinity]) assert.equal(validVoiceMedia(duration, 'mp4', 'aac', 'audio/mp4'), false);
  assert.equal(validVoiceMedia(2, 'mp4', 'aac', 'audio/webm'), false);
  assert.equal(validVoiceMedia(2, 'webm', 'vorbis', 'audio/webm'), false);
});
test('actual MP4/WebM voice recordings pass; long, malformed and video content fail', async () => {
  for (const [name, mime, accepted] of [
    ['voice/short.m4a', 'audio/mp4', true], ['voice/short.webm', 'audio/webm', true],
    ['voice/long.m4a', 'audio/mp4', false], ['voice/short.m4a', 'audio/webm', false],
    ['video/short.mp4', 'audio/mp4', false], ['video/short.webm', 'audio/webm', false],
  ] as const) {
    const bytes = await readFile(new URL(`./fixtures/${name}`, import.meta.url));
    assert.equal((await inspectVoice(new Blob([bytes]), mime)) !== null, accepted, name + mime);
  }
  assert.equal(await inspectVoice(new Blob(['not audio']), 'audio/mp4'), null);
  assert.equal(await inspectVoice(new Blob([new Uint8Array(10 * 1024 * 1024 + 1)]), 'audio/mp4'), null);
});
test('composer accepts recorded audio and rejects new video attachments', () => {
  for (const type of ['audio/mp4', 'audio/webm']) assert.equal(validateMessageAttachment({ name: 'voice', size: 1200, type }), null);
  for (const type of ['video/mp4', 'video/webm']) assert.ok(validateMessageAttachment({ name: 'clip', size: 1200, type }));
});
