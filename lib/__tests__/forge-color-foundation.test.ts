import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('Forge Soft Slate color foundation', () => {
  it('keeps Soft Slate as the authenticated application canvas', () => {
    const css = readFileSync(join(process.cwd(), 'app/globals.css'), 'utf8');
    assert.match(css, /--forge-app-background:\s*#E8EBF0/i);
    assert.match(css, /--forge-navy:\s*#0b2d5c/i);
    assert.match(css, /--forge-silver:/i);
    assert.match(css, /--forge-red:\s*#d62828/i);
    assert.match(css, /marketing cream/i);
    assert.match(css, /\.forge-app-canvas/);
  });

  it('uses navy — not red — for profile primary actions', () => {
    const workspace = readFileSync(
      join(process.cwd(), 'components/profile/ProfileWorkspace.tsx'),
      'utf8'
    );
    const crop = readFileSync(
      join(process.cwd(), 'components/profile/ProfilePhotoCropDialog.tsx'),
      'utf8'
    );
    const preview = readFileSync(
      join(process.cwd(), 'components/profile/SelfProfilePreviewCard.tsx'),
      'utf8'
    );

    assert.match(workspace, /bg-\[#0B2D5C\][\s\S]{0,240}Save section/);
    assert.doesNotMatch(workspace, /bg-\[#D62828\][\s\S]{0,240}Save section/);
    assert.match(crop, /bg-\[#0B2D5C\][\s\S]{0,240}Confirm photo/);
    assert.doesNotMatch(crop, /bg-\[#D62828\]/);
    assert.match(preview, /Manage My Profile/);
    assert.match(preview, /bg-\[#0B2D5C\][\s\S]{0,240}Manage My Profile/);
    assert.doesNotMatch(preview, /bg-\[#D62828\]/);
  });

  it('keeps red available for selective accents and destructive photo remove', () => {
    const manager = readFileSync(
      join(process.cwd(), 'components/profile/ProfilePhotoManager.tsx'),
      'utf8'
    );
    const hub = readFileSync(
      join(process.cwd(), 'components/profile/MyProfileHub.tsx'),
      'utf8'
    );
    assert.match(manager, /text-\[#D62828\]/);
    assert.match(hub, /text-\[#D62828\]/);
  });

  it('does not use cream as the primary profile workspace surface fill', () => {
    const workspace = readFileSync(
      join(process.cwd(), 'components/profile/ProfileWorkspace.tsx'),
      'utf8'
    );
    const manager = readFileSync(
      join(process.cwd(), 'components/profile/ProfilePhotoManager.tsx'),
      'utf8'
    );
    assert.doesNotMatch(workspace, /bg-\[#F8F6F2\]/);
    assert.doesNotMatch(manager, /bg-\[#F8F6F2\]/);
    assert.match(workspace, /bg-\[#EEF2F7\]/);
  });
});
