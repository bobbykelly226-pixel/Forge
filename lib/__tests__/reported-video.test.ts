import assert from 'node:assert/strict';
import test from 'node:test';
import { matchesReportedVideo, reportedVideoEvidencePath, reportedVideoMessageId } from '../operator/reported-video';
const id = '11111111-2222-4333-8444-555555555555';
test('accepts only an anchored exact video message reference', () => {
  assert.equal(reportedVideoMessageId(`Reported video message: ${id}\nDetails`), id);
  assert.equal(reportedVideoMessageId(`Some text\nReported video message: ${id}`), null);
  assert.equal(reportedVideoMessageId('Reported video message: ../../private'), null);
  assert.equal(reportedVideoMessageId(`Reported video message: ${id}extra`), null);
  assert.equal(reportedVideoMessageId(null), null);
});
test('creates deterministic private evidence paths without member-controlled names', () => {
  assert.equal(
    reportedVideoEvidencePath(id, 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee', 'video/webm'),
    `${id}/aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee.webm`
  );
  assert.equal(
    reportedVideoEvidencePath(id, 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee', 'video/mp4'),
    `${id}/aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee.mp4`
  );
});
test('rejects cross-conversation, cross-sender and mismatched attachment references', () => {
  const scope = { conversationId: 'conversation', reportedUserId: 'sender', messageId: id };
  const attachment = { conversation_id: 'conversation', sender_id: 'sender', message_id: id, storage_path: 'conversation/sender/clip.mp4', mime_type: 'video/mp4' };
  assert.equal(matchesReportedVideo(scope, attachment), true);
  for (const change of [{ conversation_id: 'other' }, { sender_id: 'other' }, { message_id: 'other' }, { storage_path: 'conversation/other/clip.mp4' }, { storage_path: 'conversation/sender/../clip.mp4' }, { mime_type: 'image/png' }]) {
    assert.equal(matchesReportedVideo(scope, { ...attachment, ...change }), false);
  }
});
