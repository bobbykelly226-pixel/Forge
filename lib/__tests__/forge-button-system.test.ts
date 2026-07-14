import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('Forge button visual system', () => {
  it('defines restrained rectangular geometry — not pills', () => {
    const css = readFileSync(join(process.cwd(), 'app/globals.css'), 'utf8');
    assert.match(css, /\.forge-btn\s*\{/);
    assert.match(css, /--forge-btn-radius:\s*0\.375rem/);
    assert.match(css, /\.forge-btn--tier1/);
    assert.match(css, /\.forge-btn--tier2/);
    assert.match(css, /\.forge-btn--tier3/);
    assert.doesNotMatch(css, /\.forge-btn[^{]*\{[^}]*border-radius:\s*9999px/);
    assert.doesNotMatch(css, /\.forge-btn[^{]*\{[^}]*border-radius:\s*999px/);
    assert.match(css, /prefers-reduced-motion/);
  });

  it('keeps navy metallic as Tier 1 and red as material reference only', () => {
    const css = readFileSync(join(process.cwd(), 'app/globals.css'), 'utf8');
    const page = readFileSync(
      join(process.cwd(), 'app/internal/visual-system/page.tsx'),
      'utf8'
    );
    assert.match(css, /forge-navy/);
    assert.match(css, /tier1-face-red/);
    assert.match(page, /Red \(reference only\)/);
    assert.match(page, /Do not use as ordinary primary/);
    assert.match(page, /View My Profile/);
    assert.match(page, /Browse Gallery/);
    assert.match(page, /Learn More/);
  });

  it('exports ForgeButton with three tiers and link support', () => {
    const component = readFileSync(
      join(process.cwd(), 'components/ui/ForgeButton.tsx'),
      'utf8'
    );
    assert.match(component, /tier\?: ForgeButtonTier/);
    assert.match(component, /forge-btn--tier\$\{props\.tier\}/);
    assert.match(component, /href/);
    assert.match(component, /focus-visible|forge-btn/);
  });

  it('hosts the review surface at /internal/visual-system', () => {
    const page = readFileSync(
      join(process.cwd(), 'app/internal/visual-system/page.tsx'),
      'utf8'
    );
    assert.match(page, /robots:\s*\{[\s\S]*index:\s*false/);
    assert.match(page, /ForgeAppCanvas/);
    assert.match(page, /ForgeButton/);
    assert.match(page, /Soft Slate/);
  });
});
