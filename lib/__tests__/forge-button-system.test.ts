import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { describe, it } from 'node:test';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const css = () => readFileSync(join(process.cwd(), 'app/globals.css'), 'utf8');
const page = () =>
  readFileSync(join(process.cwd(), 'app/internal/visual-system/page.tsx'), 'utf8');
const sigV4 = () =>
  readFileSync(join(process.cwd(), 'components/ui/ForgeSignatureV4.tsx'), 'utf8');
const reviewV4 = () =>
  readFileSync(join(process.cwd(), 'components/internal/SignatureV4Review.tsx'), 'utf8');
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

describe('Forge Signature V4 navy review', () => {
  it('primary candidate renders ForgeSignatureV4', () => {
    const p = page();
    assert.match(p, /import SignatureV4Review from '@\/components\/internal\/SignatureV4Review'/);
    assert.match(p, /import \{ SIGNATURE_V4_COMPARE \} from '@\/components\/ui\/ForgeSignatureV4'/);
    assert.match(p, /<SignatureV4Review\s*\/>/);
    assert.match(p, /Implementation candidate — Signature V4/);
    const body = p.slice(p.indexOf('export default function VisualSystemPage'));
    const primary = body.slice(0, body.indexOf('Historical experiments'));
    assert.match(primary, /<SignatureV4Review\s*\/>/);
    assert.doesNotMatch(primary, /<SignatureV3Review/);
    assert.doesNotMatch(primary, /<ForgeSignatureV3/);
    assert.doesNotMatch(primary, /variant="referenceFaithful"/);
  });

  it('has data-visual-candidate="forge-signature-v4"', () => {
    const s = sigV4();
    assert.match(s, /dataCandidate:\s*'forge-signature-v4'/);
    assert.match(s, /'data-visual-candidate':\s*SIGNATURE_V4_COMPARE\.dataCandidate/);
  });

  it('V3 does not render in the primary candidate slot', () => {
    const p = page();
    const body = p.slice(p.indexOf('export default function VisualSystemPage'));
    const primary = body.slice(0, body.indexOf('Historical experiments'));
    assert.doesNotMatch(primary, /<SignatureV3Review|<ForgeSignatureV3|Signature V3 \(superseded\)/);
    assert.match(p, /Historical experiments — not current candidate/);
    assert.match(p, /Signature V3 \(superseded\)/);
  });

  it('exact approved navy crop remains unchanged', () => {
    const cropPath = join(process.cwd(), 'public/internal/forge-button-navy-reference-crop.png');
    assert.ok(existsSync(cropPath));
    const buf = readFileSync(cropPath);
    const w = buf.readUInt32BE(16);
    const h = buf.readUInt32BE(20);
    assert.equal(w, 654);
    assert.equal(h, 230);
    const hash = createHash('sha256').update(buf).digest('hex');
    // Locked — do not regenerate or redraw this crop
    assert.equal(hash, '4c12210f9c56bddcf26bca0fd49c6f1f87c858ebce11e6d4aeefc5af920af211');
    const s = sigV4();
    assert.match(s, /cropPath:\s*'\/internal\/forge-button-navy-reference-crop\.png'/);
  });

  it('SVG uses multiple independent chrome layers (not a single flat stroke)', () => {
    const s = sigV4();
    assert.match(s, /frameMask/);
    assert.match(s, /lipMask/);
    assert.match(s, /channelMask/);
    assert.match(s, /metalVert|sigv4-metal-v/);
    assert.match(s, /leftSpec|sigv4-left/);
    assert.match(s, /rightSteel|sigv4-right/);
    assert.match(s, /upperBright|sigv4-upper/);
    assert.match(s, /lowerDepth|sigv4-lower/);
    assert.match(s, /Bright outer polished lip/);
    assert.match(s, /Main chrome chassis ring/);
    // Suggested vertical stop structure present
    assert.match(s, /#FDFEFF/);
    assert.match(s, /#2D343B/);
    assert.match(s, /offset="3%"/);
  });

  it('inner chrome rim, specular line, graphite channel, and navy face are separate', () => {
    const s = sigV4();
    assert.match(s, /Bright inner chrome bevel/);
    assert.match(s, /Ultra-fine inner white specular|Ultra-fine glass specular/);
    assert.match(s, /Graphite channel/);
    assert.match(s, /Recessed navy glass face/);
    assert.match(s, /#1A222B/);
    assert.match(s, /#0B2D5C/);
    assert.match(s, /#1B4D82/);
    assert.match(s, /opacity="0\.4"/); // specular line
  });

  it('HTML label remains outside SVG; SVG is aria-hidden and pointer-events none', () => {
    const s = sigV4();
    assert.match(s, /forge-sig-v4__label/);
    assert.match(s, /aria-hidden="true"/);
    assert.match(s, /focusable="false"/);
    assert.match(s, /pointer-events:\s*none|pointer-events="none"|forge-sig-v4__svg/);
    assert.doesNotMatch(s, /<text[\s>]/);
    assert.match(css(), /\.forge-sig-v4__svg[\s\S]*pointer-events:\s*none/);
  });

  it('button and Link remain real interactive elements', () => {
    const s = sigV4();
    assert.match(s, /<button/);
    assert.match(s, /<Link/);
  });

  it('overlay comparison remains internal-only', () => {
    const r = reviewV4();
    assert.match(r, /Overlay reference/);
    assert.match(r, /pointer-events-none/);
    assert.match(r, /opacity:\s*0\.5/);
    assert.match(r, /aria-hidden="true"/);
    assert.doesNotMatch(r, /<ForgeSignatureV4[^>]*>\s*<Image/);
  });

  it('uses viewBox 0 0 654 230 and compare dimensions 360×127', () => {
    const s = sigV4();
    assert.match(s, /viewBox:\s*'0 0 654 230'/);
    assert.match(s, /widthPx:\s*360/);
    assert.match(s, /heightPx:\s*Math\.round\(\(360 \* 230\) \/ 654\)/);
    assert.match(s, /OUTER_RX = 22/);
    assert.match(s, /BEVEL_RX = 16/);
    assert.match(s, /FACE_RX = 11/);
  });

  it('no product route imports ForgeSignatureV4', () => {
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
        if (src.includes('ForgeSignatureV4') || src.includes('forge-signature-v4')) {
          offenders.push(file.replace(process.cwd() + '/', ''));
        }
      }
    }
    for (const file of ['app/page.tsx', 'app/layout.tsx']) {
      try {
        const src = readFileSync(join(process.cwd(), file), 'utf8');
        if (src.includes('ForgeSignatureV4') || src.includes('forge-signature-v4')) {
          offenders.push(file);
        }
      } catch {
        /* missing */
      }
    }
    assert.deepEqual(offenders, [], `Found: ${offenders.join(', ')}`);
  });

  it('Tier 2 and Tier 3 files remain unchanged in ownership', () => {
    const btn = forgeBtn();
    assert.match(btn, /forge-btn--tier2/);
    assert.match(btn, /forge-btn--tier3/);
    const s = sigV4();
    assert.doesNotMatch(s, /tier2|tier3|Tier 2|Tier 3/i);
    assert.match(css(), /\.forge-btn--tier2-on-dark/);
    assert.match(css(), /\.forge-btn--tier2-on-white/);
  });

  it('production access rules remain intact', () => {
    const p = page();
    assert.match(p, /robots:\s*\{[\s\S]*index:\s*false[\s\S]*follow:\s*false/);
  });
});
