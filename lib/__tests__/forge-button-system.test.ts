import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const css = () => readFileSync(join(process.cwd(), 'app/globals.css'), 'utf8');
const page = () =>
  readFileSync(join(process.cwd(), 'app/internal/visual-system/page.tsx'), 'utf8');
const sigV6 = () =>
  readFileSync(join(process.cwd(), 'components/ui/ForgeSignatureV6.tsx'), 'utf8');
const reviewV6 = () =>
  readFileSync(join(process.cwd(), 'components/internal/SignatureV6Review.tsx'), 'utf8');
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

describe('Forge Signature V6 navy review', () => {
  it('primary review renders ForgeSignatureV6', () => {
    const p = page();
    assert.match(p, /import SignatureV6Review from '@\/components\/internal\/SignatureV6Review'/);
    assert.match(p, /<SignatureV6Review\s*\/>/);
    assert.match(p, /Implementation candidate — Signature V6/);
    const body = p.slice(p.indexOf('export default function VisualSystemPage'));
    const primary = body.slice(0, body.indexOf('Historical experiments'));
    assert.match(primary, /<SignatureV6Review\s*\/>/);
    assert.doesNotMatch(primary, /<SignatureV5Review|<ForgeSignatureV5|<SignatureV4Review/);
  });

  it('has data-visual-candidate="forge-signature-v6"', () => {
    const s = sigV6();
    assert.match(s, /dataCandidate:\s*'forge-signature-v6'/);
    assert.match(s, /'data-visual-candidate':\s*SIGNATURE_V6_COMPARE\.dataCandidate/);
  });

  it('V5 is absent from the primary candidate position', () => {
    const p = page();
    const body = p.slice(p.indexOf('export default function VisualSystemPage'));
    const primary = body.slice(0, body.indexOf('Historical experiments'));
    assert.doesNotMatch(primary, /Signature V5|ForgeSignatureV5|SignatureV5Review|forge-premium-btn/);
    assert.match(p, /Signature V5 — removed \(rejected\)/);
    assert.equal(existsSync(join(process.cwd(), 'components/ui/ForgeSignatureV5.tsx')), false);
    assert.equal(
      existsSync(join(process.cwd(), 'components/internal/SignatureV5Review.tsx')),
      false
    );
    assert.doesNotMatch(css(), /\.forge-premium-btn\b/);
  });

  it('viewBox and outer geometry match the supplied SVG exactly', () => {
    const s = sigV6();
    assert.match(s, /viewBox="0 0 360 127"/);
    assert.match(s, /viewBox:\s*'0 0 360 127'/);
    assert.match(s, /x="1\.5"/);
    assert.match(s, /y="1\.5"/);
    assert.match(s, /width="357"/);
    assert.match(s, /height="124"/);
    assert.match(s, /rx="6"/);
    assert.match(s, /strokeWidth="3"/);
    assert.match(s, /fill="#1A1C22"/);
  });

  it('bright-chrome retains every supplied stop and color', () => {
    const s = sigV6();
    assert.match(s, /stopColor="#FFFFFF"/);
    assert.match(s, /offset="8%"[\s\S]*?stopColor="#E2E5EC"/);
    assert.match(s, /stopColor="#A3A8B5"/);
    assert.match(s, /stopColor="#5A5E6B"/);
    assert.match(s, /stopColor="#141518"/);
    assert.match(s, /stopColor="#F5F7FA"/);
    assert.match(s, /stopColor="#9CA2B0"/);
    assert.match(s, /stopColor="#222429"/);
  });

  it('graphite and face geometry match exactly', () => {
    const s = sigV6();
    assert.match(s, /x="4\.5"/);
    assert.match(s, /y="4\.5"/);
    assert.match(s, /width="351"/);
    assert.match(s, /height="118"/);
    assert.match(s, /rx="4\.5"/);
    assert.match(s, /stroke="#090B0E"/);
    assert.match(s, /strokeWidth="1\.5"/);
    assert.match(s, /x="6"/);
    assert.match(s, /y="6"/);
    assert.match(s, /width="348"/);
    assert.match(s, /height="115"/);
    assert.match(s, /rx="3\.5"/);
  });

  it('deep-glass-navy and filter values match exactly', () => {
    const s = sigV6();
    assert.match(s, /stopColor="#0E2447"/);
    assert.match(s, /stopColor="#07152B"/);
    assert.match(s, /stopColor="#020813"/);
    assert.match(s, /stdDeviation="2"/);
    assert.match(s, /floodOpacity="0\.35"/);
  });

  it('reflection path and specular line match exactly', () => {
    const s = sigV6();
    assert.match(
      s,
      /d="M 9 10 Q 9 7 14 7 L 346 7 Q 351 7 351 10 L 351 22 C 351 14 9 14 9 22 Z"/
    );
    assert.match(s, /fillOpacity="0\.22"/);
    assert.match(s, /x1="12"/);
    assert.match(s, /y1="8"/);
    assert.match(s, /x2="348"/);
    assert.match(s, /y2="8"/);
    assert.match(s, /strokeOpacity="0\.5"/);
    assert.match(s, /strokeWidth="1"/);
  });

  it('SVG IDs are unique per instance via useId', () => {
    const s = sigV6();
    assert.match(s, /useId\(\)/);
    assert.match(s, /bright-chrome-\$\{uid\}/);
    assert.match(s, /deep-glass-navy-\$\{uid\}/);
    assert.match(s, /crisp-inner-glow-\$\{uid\}/);
  });

  it('SVG is aria-hidden and pointer-events none; label is HTML text', () => {
    const s = sigV6();
    assert.match(s, /aria-hidden="true"/);
    assert.match(s, /focusable="false"/);
    assert.match(s, /pointerEvents="none"/);
    assert.match(s, /className="v6-text"/);
    assert.doesNotMatch(s, /<text[\s>]/);
    assert.match(css(), /\.forge-signature-v6 \.v6-chassis[\s\S]*pointer-events:\s*none/);
  });

  it('button and Link behavior work', () => {
    const s = sigV6();
    assert.match(s, /<button/);
    assert.match(s, /<Link/);
    assert.match(s, /loading\?:/);
    assert.match(s, /disabled\?:/);
  });

  it('exact comparison dimensions remain 360 × 127', () => {
    const s = sigV6();
    const r = reviewV6();
    assert.match(s, /widthPx:\s*360/);
    assert.match(s, /heightPx:\s*127/);
    assert.match(r, /width: widthPx/);
    assert.match(r, /height: heightPx/);
    assert.match(css(), /\.forge-signature-v6\s*\{[\s\S]*?width:\s*360px/);
    assert.match(css(), /\.forge-signature-v6\s*\{[\s\S]*?height:\s*127px/);
    assert.match(css(), /font-size:\s*26px/);
    assert.match(css(), /letter-spacing:\s*0\.14em/);
  });

  it('no product route imports ForgeSignatureV6', () => {
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
        if (src.includes('ForgeSignatureV6') || src.includes('forge-signature-v6')) {
          offenders.push(file.replace(process.cwd() + '/', ''));
        }
      }
    }
    for (const file of ['app/page.tsx', 'app/layout.tsx']) {
      try {
        const src = readFileSync(join(process.cwd(), file), 'utf8');
        if (src.includes('ForgeSignatureV6') || src.includes('forge-signature-v6')) {
          offenders.push(file);
        }
      } catch {
        /* missing */
      }
    }
    assert.deepEqual(offenders, [], `Found: ${offenders.join(', ')}`);
  });

  it('Tier 2 and Tier 3 files remain unchanged', () => {
    const btn = forgeBtn();
    assert.match(btn, /forge-btn--tier2/);
    assert.match(btn, /forge-btn--tier3/);
    assert.match(css(), /\.forge-btn--tier2-on-dark/);
    assert.match(css(), /\.forge-btn--tier2-on-white/);
    assert.match(css(), /\.forge-btn--tier3/);
    const s = sigV6();
    assert.doesNotMatch(s, /tier2|tier3|Tier 2|Tier 3/i);
  });

  it('internal review route remains protected in production', () => {
    const p = page();
    assert.match(p, /robots:\s*\{[\s\S]*index:\s*false[\s\S]*follow:\s*false/);
  });
});
