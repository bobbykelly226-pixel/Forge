import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const css = () => readFileSync(join(process.cwd(), 'app/globals.css'), 'utf8');
const page = () =>
  readFileSync(join(process.cwd(), 'app/internal/visual-system/page.tsx'), 'utf8');
const sig = () =>
  readFileSync(join(process.cwd(), 'components/ui/ForgeSignatureV3.tsx'), 'utf8');
const review = () =>
  readFileSync(join(process.cwd(), 'components/internal/SignatureV3Review.tsx'), 'utf8');
const forgeBtn = () =>
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

describe('Forge Signature V3 navy review', () => {
  it('primary implementation area renders ForgeSignatureV3', () => {
    const p = page();
    assert.match(p, /import SignatureV3Review from '@\/components\/internal\/SignatureV3Review'/);
    assert.match(p, /import \{ SIGNATURE_V3_COMPARE \} from '@\/components\/ui\/ForgeSignatureV3'/);
    assert.match(p, /<SignatureV3Review\s*\/>/);
    assert.match(p, /Implementation candidate — Signature V3/);
    // Primary section must not mount referenceFaithful as the candidate
    const primary = p.slice(0, p.indexOf('Historical experiments'));
    assert.match(primary, /SignatureV3Review/);
    assert.doesNotMatch(primary, /variant="referenceFaithful"/);
    assert.doesNotMatch(primary, /variant="experimental"/);
  });

  it('primary candidate has data-visual-candidate="forge-signature-v3"', () => {
    const s = sig();
    const r = review();
    assert.match(s, /data-visual-candidate['"]:\s*SIGNATURE_V3_COMPARE\.dataCandidate|data-visual-candidate=\{?SIGNATURE_V3_COMPARE|['"]data-visual-candidate['"]:\s*['"]forge-signature-v3['"]/);
    assert.match(s, /dataCandidate:\s*'forge-signature-v3'/);
    assert.match(r, /ForgeSignatureV3/);
    assert.match(s, /'data-visual-candidate':\s*SIGNATURE_V3_COMPARE\.dataCandidate/);
  });

  it('exact navy reference crop uses the approved source asset', () => {
    assert.ok(
      existsSync(join(process.cwd(), 'public/internal/forge-button-navy-reference-crop.png'))
    );
    assert.ok(
      existsSync(join(process.cwd(), 'public/internal/forge-button-approved-reference.png'))
    );
    const s = sig();
    assert.match(s, /cropPath:\s*'\/internal\/forge-button-navy-reference-crop\.png'/);
    assert.match(s, /cropSource:\s*'\/internal\/forge-button-approved-reference\.png'/);
  });

  it('reference and implementation render with the same comparison dimensions', () => {
    const s = sig();
    const r = review();
    assert.match(s, /widthPx:\s*360/);
    assert.match(s, /heightPx:\s*Math\.round\(\(360 \* 230\) \/ 654\)/);
    assert.match(r, /width: widthPx/);
    assert.match(r, /height: heightPx/);
    assert.match(css(), /\.forge-sig-v3--compare/);
  });

  it('overlay mode is internal-review only and decorative', () => {
    const r = review();
    assert.match(r, /Overlay reference/);
    assert.match(r, /pointer-events-none|pointer-events:\s*none/);
    assert.match(r, /opacity:\s*0\.5/);
    assert.match(r, /aria-hidden="true"/);
    assert.match(r, /design-review tool/i);
    // Overlay Image is a sibling, not a child of ForgeSignatureV3
    assert.doesNotMatch(r, /<ForgeSignatureV3[^>]*>\s*<Image/);
  });

  it('interactive control remains a real button or Link with aria-hidden SVG and HTML label', () => {
    const s = sig();
    assert.match(s, /<button/);
    assert.match(s, /<Link/);
    assert.match(s, /aria-hidden="true"/);
    assert.match(s, /forge-sig-v3__label/);
    assert.doesNotMatch(s, /<text[\s>]/);
  });

  it('uses unique Signature V3 SVG gradient id prefixes (no shared stale IDs)', () => {
    const s = sig();
    assert.match(s, /sigv3-metal-/);
    assert.match(s, /sigv3-face-/);
    assert.match(s, /sigv3-glass-/);
    assert.match(s, /useId\(\)/);
    assert.doesNotMatch(s, /rf-metal-|forge-metal-/);
  });

  it('no production-facing route imports ForgeSignatureV3', () => {
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
        if (src.includes('ForgeSignatureV3') || src.includes('forge-signature-v3')) {
          offenders.push(file.replace(process.cwd() + '/', ''));
        }
      }
    }
    for (const file of ['app/page.tsx', 'app/layout.tsx']) {
      try {
        const src = readFileSync(join(process.cwd(), file), 'utf8');
        if (src.includes('ForgeSignatureV3') || src.includes('forge-signature-v3')) {
          offenders.push(file);
        }
      } catch {
        /* missing */
      }
    }
    assert.deepEqual(offenders, [], `Found: ${offenders.join(', ')}`);
  });

  it('Tier 2 and Tier 3 were not changed in this Signature V3 pass', () => {
    const btn = forgeBtn();
    // ForgeButton still owns Tier 2/3; Signature V3 does not redefine them
    assert.match(btn, /forge-btn--tier2/);
    assert.match(btn, /forge-btn--tier3/);
    const s = sig();
    assert.doesNotMatch(s, /tier2|tier3|Tier 2|Tier 3/i);
    const styles = css();
    assert.match(styles, /\.forge-btn--tier2-on-dark/);
    assert.match(styles, /\.forge-btn--tier2-on-white/);
  });

  it('internal route remains unavailable via robots', () => {
    const p = page();
    assert.match(p, /robots:\s*\{[\s\S]*index:\s*false[\s\S]*follow:\s*false/);
  });

  it('keeps historical experiments clearly separated below the primary review', () => {
    const p = page();
    const hist = p.indexOf('Historical experiments');
    const primary = p.indexOf('SignatureV3Review');
    assert.ok(primary >= 0 && hist > primary);
  });
});
