import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

import {
  createAttachmentPath,
  formatAttachmentSize,
  isImageAttachment,
  sanitizeAttachmentName,
  validateMessageAttachment,
} from '@/lib/conversations/attachments';
import {
  MESSAGE_ATTACHMENT_MAX_BYTES,
  MESSAGE_EMOJI_OPTIONS,
} from '@/lib/conversations/constants';

function read(path: string) {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

describe('conversation attachment validation', () => {
  it('accepts supported photos and documents within the limit', () => {
    assert.equal(
      validateMessageAttachment({ name: 'photo.jpg', type: 'image/jpeg', size: 1024 }),
      null
    );
    assert.equal(
      validateMessageAttachment({
        name: 'notes.docx',
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size: MESSAGE_ATTACHMENT_MAX_BYTES,
      }),
      null
    );
  });

  it('rejects unsafe types, empty files, and oversized files', () => {
    assert.match(
      validateMessageAttachment({ name: 'page.svg', type: 'image/svg+xml', size: 100 }) ?? '',
      /JPG/
    );
    assert.match(
      validateMessageAttachment({ name: 'empty.txt', type: 'text/plain', size: 0 }) ?? '',
      /empty/
    );
    assert.match(
      validateMessageAttachment({
        name: 'large.pdf',
        type: 'application/pdf',
        size: MESSAGE_ATTACHMENT_MAX_BYTES + 1,
      }) ?? '',
      /10 MB/
    );
  });

  it('builds user-scoped, conversation-scoped storage paths', () => {
    assert.equal(sanitizeAttachmentName('../../family photo?.jpg'), '..-..-family photo-.jpg');
    assert.equal(
      createAttachmentPath('conversation-id', 'user-id', 'family photo.jpg', 'object-id'),
      'conversation-id/user-id/object-id-family photo.jpg'
    );
  });

  it('formats attachment presentation values', () => {
    assert.equal(isImageAttachment('image/webp'), true);
    assert.equal(isImageAttachment('application/pdf'), false);
    assert.equal(formatAttachmentSize(1024), '1 KB');
    assert.equal(formatAttachmentSize(2.5 * 1024 * 1024), '2.5 MB');
  });
});

describe('conversation attachment security and UI wiring', () => {
  it('uses a private bucket with participant-scoped RLS and verified metadata', () => {
    const migration = read(
      'supabase/migrations/20260729144722_conversation_media_v1.sql'
    );
    const canonicalization = read(
      'supabase/migrations/20260729170000_conversation_media_canonicalization.sql'
    );
    assert.match(migration, /'conversation-attachments'[\s\S]*false/);
    assert.match(migration, /create table if not exists public\.message_attachments/);
    assert.match(migration, /conversation_participants/);
    assert.match(migration, /storage\.foldername\(name\)/);
    assert.match(migration, /\(select auth\.uid\(\)\)::text/);
    assert.match(migration, /storage\.objects o/);
    assert.match(migration, /storage_path'\) not like p_conversation_id::text/);
    assert.match(migration, /forge_users_blocked/);
    assert.doesNotMatch(migration, /image\/svg\+xml/);
    assert.match(canonicalization, /drop column if exists attachment_path/);
    assert.match(canonicalization, /message_attachments a/);
  });

  it('wires upload, signed previews, file cards, and emoji insertion', () => {
    const thread = read('components/conversations/ConversationThread.tsx');
    const attachment = read('components/conversations/MessageAttachment.tsx');
    assert.match(thread, /MESSAGE_ATTACHMENT_BUCKET/);
    assert.match(thread, /\.upload\(/);
    assert.match(thread, /type="file"/);
    assert.match(thread, /MessageAttachment/);
    assert.match(thread, /MESSAGE_EMOJI_OPTIONS\.map/);
    assert.ok(MESSAGE_EMOJI_OPTIONS.includes('❤️'));
    assert.match(attachment, /createSignedUrl/);
    assert.match(attachment, /target="_blank"/);
    assert.match(attachment, /download=\{name\}/);
  });

  it('keeps open threads current and never sends a stale composer value', () => {
    const thread = read('components/conversations/ConversationThread.tsx');
    assert.match(thread, /composerTextRef\.current = next/);
    assert.match(thread, /sendMessage\(event\.currentTarget\.value\)/);
    assert.match(thread, /setInterval\(\(\) =>/);
    assert.match(thread, /void refreshMessages\(\)/);
    assert.match(thread, /!hasTwoWayExchange/);
    assert.doesNotMatch(thread, /Forge connection context/i);
  });
});
