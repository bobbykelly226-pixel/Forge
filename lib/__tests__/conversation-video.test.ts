import assert from 'node:assert/strict';
import test from 'node:test';
import { chooseRecordingType, validateVideoProbe } from '../conversations/video';
const valid = { streams: [{ codec_type: 'video', codec_name: 'h264', width: 640, height: 480 }, { codec_type: 'audio', codec_name: 'aac' }], format: { duration: '14.8', format_name: 'mov,mp4,m4a,3gp,3g2,mj2' } };
test('negotiates an available recording format and fails closed without one', () => {
 assert.equal(chooseRecordingType(t => t === 'video/webm;codecs=vp8,opus'), 'video/webm;codecs=vp8,opus');
 assert.equal(chooseRecordingType(() => false), null);
});
test('accepts an inspected short MP4 with sound', () => assert.equal(validateVideoProbe(valid, 'video/mp4'), true));
test('rejects over-limit, missing, zero and non-finite durations', () => {
 for (const duration of ['15.01', '60', '0', '-1', 'NaN', 'Infinity', undefined]) {
  assert.equal(validateVideoProbe({ ...valid, format: { ...valid.format, duration } }, 'video/mp4'), false);
 }
});
test('rejects mismatched MIME, unsupported codec, excessive dimensions, and missing audio', () => {
 assert.equal(validateVideoProbe(valid, 'video/webm'), false);
 assert.equal(validateVideoProbe({ ...valid, streams: [valid.streams[0]] }, 'video/mp4'), false);
 assert.equal(validateVideoProbe({ ...valid, streams: [{ ...valid.streams[0], width: 4000 }, valid.streams[1]] }, 'video/mp4'), false);
 assert.equal(validateVideoProbe({ ...valid, streams: [{ ...valid.streams[0], codec_name: 'hevc' }, valid.streams[1]] }, 'video/mp4'), false);
});
test('accepts browser WebM with VP8 and Opus after duration inspection', () => {
 assert.equal(validateVideoProbe({ format: { duration: '14.6', format_name: 'matroska,webm' }, streams: [{ codec_type: 'video', codec_name: 'vp8', width: 640, height: 480 }, { codec_type: 'audio', codec_name: 'opus' }] }, 'video/webm'), true);
});

import { readFile } from 'node:fs/promises';
import { inspectVideo } from '../conversations/inspect-video';
test('inspects actual MP4/WebM bytes and rejects a 16-second recording', async () => {
 for (const [name, mime, expected] of [['short.mp4', 'video/mp4', true], ['short.webm', 'video/webm', true], ['long.mp4', 'video/mp4', false]] as const) {
  const bytes = await readFile(new URL(`./fixtures/video/${name}`, import.meta.url));
  assert.equal((await inspectVideo(new Blob([bytes]), mime)) !== null, expected, name);
 }
});
test('server inspection rejects invalid bytes and MIME spoofing', async () => {
 assert.equal(await inspectVideo(new Blob(['not video']), 'video/mp4'), null);
 const bytes = await readFile(new URL('./fixtures/video/short.mp4', import.meta.url));
 assert.equal(await inspectVideo(new Blob([bytes]), 'video/webm'), null);
});
