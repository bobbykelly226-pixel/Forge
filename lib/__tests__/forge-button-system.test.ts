import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const css = () => readFileSync(join(process.cwd(), 'app/globals.css'), 'utf8');
const page = () =>
  readFileSync(join(process.cwd(), 'app/internal/visual-system/page.tsx'), 'utf8');
const component = () =>
  readFileSync(join(process.cwd(), 'components/ui/ForgeButton.tsx'), 'utf8');

function collectTsFiles(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.next' || name === '.git') continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) collectTsFiles(full, acc);
    else if (/\.(tsx?|jsx?)$/.test(name)) acc.push(full);
  }
  return acc;
}

describe('Forge button visual system — corrected metallic construction', () => {
  it('locks Tier 1 outer radius to exact approved 4px token', () => {
    const styles = css();
    assert.match(styles, /--forge-btn-outer-radius:\s*4px/);
    assert.match(styles, /\.forge-btn\s*\{[\s\S]*?border-radius:\s*var\(--forge-btn-outer-radius\)/);
    assert.doesNotMatch(styles, /--forge-btn-radius:\s*0\.375rem/);
    assert.doesNotMatch(styles, /approximately 6px|~6px/);
  });

  it('locks Tier 1 inner face to exact approved 3px token', () => {
    const styles = css();
    assert.match(styles, /--forge-btn-inner-radius:\s*3px/);
    assert.match(
      styles,
      /\.forge-btn__face\s*\{[\s\S]*?border-radius:\s*var\(--forge-btn-inner-radius\)/
    );
  });

  it('locks Tier 2 to exact approved 4px token', () => {
    const styles = css();
    assert.match(styles, /--forge-btn-radius:\s*4px/);
    assert.match(
      styles,
      /\.forge-btn--tier2\s*\{[\s\S]*?border-radius:\s*var\(--forge-btn-radius\)/
    );
  });

  it('does not allow rounded-full or large-radius classes on major button layers', () => {
    const styles = css();
    const btn = component();
    const review = page();

    // Major silhouette layers must stay micro-radius (not pills)
    const majorBlocks = [
      styles.match(/\.forge-btn\s*\{[^}]+\}/)?.[0] ?? '',
      styles.match(/\.forge-btn__face\s*\{[^}]+\}/)?.[0] ?? '',
      styles.match(/\.forge-btn--tier1\s*\{[^}]+\}/)?.[0] ?? '',
      styles.match(/\.forge-btn--tier2\s*\{[^}]+\}/)?.[0] ?? '',
      styles.match(/\.forge-btn--block\s*\{[^}]+\}/)?.[0] ?? '',
    ];
    for (const block of majorBlocks) {
      assert.ok(block.length > 0);
      assert.doesNotMatch(block, /border-radius:\s*(9999?px|50%|999rem|1rem|1\.25rem)/);
      assert.doesNotMatch(block, /rounded-(full|2xl|xl|lg|md)/);
    }

    assert.doesNotMatch(btn, /rounded-(full|2xl|xl|lg|md)/);
    assert.doesNotMatch(review, /<ForgeButton[^>]*className="[^"]*rounded-/);
  });

  it('link and button implementations share the same geometry structure', () => {
    const btn = component();
    assert.match(btn, /forge-btn__face/);
    assert.match(btn, /forge-btn__label/);
    assert.match(btn, /href/);
    assert.match(btn, /<button/);
    assert.match(btn, /<Link/);
    assert.match(btn, /ButtonContents/);
  });

  it('loading preserves geometry and dimensions via data-loading', () => {
    const styles = css();
    const btn = component();
    assert.match(btn, /loading\?:/);
    assert.match(btn, /data-loading/);
    assert.match(btn, /aria-busy/);
    assert.match(styles, /\.forge-btn--tier1\[data-loading='true'\]/);
    assert.match(styles, /\.forge-btn__spinner/);
  });

  it('disabled preserves geometry without opacity-only communication', () => {
    const styles = css();
    assert.match(styles, /\.forge-btn--tier1:disabled/);
    assert.match(styles, /flattened|quieter|Unavailable|disabled/i);
    // Disabled must not rely solely on opacity on the root
    const disabledBlock = styles.match(
      /\.forge-btn--tier1:disabled[\s\S]*?\.forge-btn--tier1-face-soft-slate/
    );
    assert.ok(disabledBlock);
    assert.doesNotMatch(
      styles.match(/\.forge-btn:disabled[\s\S]*?@media/)?.[0] ?? '',
      /opacity:\s*0\.\d+/
    );
  });

  it('focus does not create a rounded outer wrapper', () => {
    const styles = css();
    assert.match(styles, /\.forge-btn:focus-visible\s*\{[^}]*outline:\s*2px solid/);
    assert.match(styles, /outline-offset:\s*3px/);
    assert.doesNotMatch(
      styles,
      /\.forge-btn:focus-visible\s*\{[^}]*border-radius:\s*(999|50%|1rem|1\.25rem)/
    );
  });

  it('mobile full-width retains the same 4px radius', () => {
    const styles = css();
    assert.match(styles, /\.forge-btn--block\s*\{[\s\S]*?border-radius:\s*var\(--forge-btn-outer-radius\)/);
    assert.doesNotMatch(styles, /\.forge-btn--block[^{]*\{[^}]*border-radius:\s*(999|50%|0\.5rem|0\.75rem|1rem)/);
  });

  it('dark-surface Tier 1 uses Soft Slate treatment', () => {
    const styles = css();
    const btn = component();
    const review = page();
    assert.match(styles, /\.forge-btn--tier1-on-dark|\.forge-btn--tier1-face-soft-slate/);
    assert.match(btn, /soft-slate/);
    assert.match(btn, /onDark/);
    assert.match(btn, /forge-btn--tier1-on-dark/);
    assert.match(review, /onDark/);
    assert.match(review, /Soft Slate face/);
  });

  it('navy-faced Tier 1 is not the approved treatment on deep navy', () => {
    const review = page();
    assert.match(review, /navy-faced Tier 1 on navy is rejected/);
    assert.match(review, /official dark-surface hierarchy/i);
    assert.match(review, /Soft Slate face/);
  });

  it('includes reduced-motion rules', () => {
    const styles = css();
    assert.match(styles, /prefers-reduced-motion:\s*reduce/);
    assert.match(styles, /\.forge-btn[\s\S]*?animation:\s*none/);
  });

  it('documents exact typography for Tier 1', () => {
    const styles = css();
    assert.match(styles, /font-size:\s*14px/);
    assert.match(styles, /font-weight:\s*500/);
    assert.match(styles, /letter-spacing:\s*0\.12em/);
    assert.match(styles, /text-transform:\s*uppercase/);
  });

  it('hosts the correction review at /internal/visual-system with comparison', () => {
    const review = page();
    assert.match(review, /robots:\s*\{[\s\S]*index:\s*false/);
    assert.match(review, /ForgeAppCanvas/);
    assert.match(review, /ForgeButton/);
    assert.match(review, /Corrected vs rejected|corrected forged metallic/i);
    assert.match(review, /Rejected — plain navy gradient|RejectedPlainButton|plain navy gradient/i);
    assert.match(review, /Red \(reference only\)/);
    assert.match(review, /Do not use as ordinary primary/);
  });

  it('confirms no broader product-route rollout has occurred', () => {
    const productDirs = [
      'app/profile',
      'app/discovery',
      'app/onboarding',
      'app/connections',
      'app/waitlist',
      'app/wait',
      'app/auth',
      'app/login',
      'app/signup',
      'app/join',
      'app/about',
      'app/founder',
      'app/values',
      'app/contact',
      'components/profile',
      'components/discovery',
      'components/connections',
    ];
    const offenders: string[] = [];
    for (const dir of productDirs) {
      const full = join(process.cwd(), dir);
      try {
        if (!statSync(full).isDirectory()) continue;
      } catch {
        continue;
      }
      for (const file of collectTsFiles(full)) {
        const src = readFileSync(file, 'utf8');
        if (src.includes('ForgeButton') || src.includes('forge-btn--tier')) {
          offenders.push(file.replace(process.cwd() + '/', ''));
        }
      }
    }
    // Also check marketing-ish root pages
    for (const file of ['app/page.tsx', 'app/layout.tsx']) {
      try {
        const src = readFileSync(join(process.cwd(), file), 'utf8');
        if (src.includes('ForgeButton') || src.includes('forge-btn--tier')) {
          offenders.push(file);
        }
      } catch {
        /* missing */
      }
    }
    assert.deepEqual(
      offenders,
      [],
      `ForgeButton must not be rolled out to product routes yet. Found: ${offenders.join(', ')}`
    );
  });
});
