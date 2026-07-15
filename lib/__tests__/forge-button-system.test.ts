import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const css = () => readFileSync(join(process.cwd(), 'app/globals.css'), 'utf8');
const page = () =>
  readFileSync(join(process.cwd(), 'app/internal/visual-system/page.tsx'), 'utf8');
const sigV5 = () =>
  readFileSync(join(process.cwd(), 'components/ui/ForgeSignatureV5.tsx'), 'utf8');
const reviewV5 = () =>
  readFileSync(join(process.cwd(), 'components/internal/SignatureV5Review.tsx'), 'utf8');
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

describe('Forge Signature V5 navy review', () => {
  it('primary review renders ForgeSignatureV5', () => {
    const p = page();
    assert.match(p, /import SignatureV5Review from '@\/components\/internal\/SignatureV5Review'/);
    assert.match(p, /<SignatureV5Review\s*\/>/);
    assert.match(p, /Implementation candidate — Signature V5/);
    const body = p.slice(p.indexOf('export default function VisualSystemPage'));
    const primary = body.slice(0, body.indexOf('Historical experiments'));
    assert.match(primary, /<SignatureV5Review\s*\/>/);
    assert.doesNotMatch(primary, /<SignatureV4Review|<ForgeSignatureV4|<SignatureV3Review/);
  });

  it('has data-visual-candidate="forge-signature-v5"', () => {
    const s = sigV5();
    assert.match(s, /dataCandidate:\s*'forge-signature-v5'/);
    assert.match(s, /'data-visual-candidate':\s*SIGNATURE_V5_COMPARE\.dataCandidate/);
  });

  it('V4 is not rendered in the primary candidate slot', () => {
    const p = page();
    const body = p.slice(p.indexOf('export default function VisualSystemPage'));
    const primary = body.slice(0, body.indexOf('Historical experiments'));
    assert.doesNotMatch(primary, /Signature V4|ForgeSignatureV4|SignatureV4Review/);
    assert.match(p, /Signature V4 — removed \(rejected\)/);
    assert.equal(existsSync(join(process.cwd(), 'components/ui/ForgeSignatureV4.tsx')), false);
    assert.equal(
      existsSync(join(process.cwd(), 'components/internal/SignatureV4Review.tsx')),
      false
    );
    assert.doesNotMatch(css(), /\.forge-sig-v4\b/);
  });

  it('viewBox and outer geometry match the supplied SVG exactly', () => {
    const s = sigV5();
    assert.match(s, /viewBox="0 0 360 127"/);
    assert.match(s, /viewBox:\s*'0 0 360 127'/);
    assert.match(s, /x="0\.5"/);
    assert.match(s, /y="0\.5"/);
    assert.match(s, /width="359"/);
    assert.match(s, /height="126"/);
    assert.match(s, /rx="6"/);
    assert.match(s, /strokeWidth="5"/);
    assert.match(s, /fill="#181A1F"/);
  });

  it('graphite rect, face, chrome stops, navy stops, glass path, specular line are exact', () => {
    const s = sigV5();
    assert.match(s, /x="5\.5"/);
    assert.match(s, /y="5\.5"/);
    assert.match(s, /width="349"/);
    assert.match(s, /height="116"/);
    assert.match(s, /rx="5"/);
    assert.match(s, /stroke="#2B2E36"/);
    assert.match(s, /strokeWidth="1\.5"/);
    assert.match(s, /x="7"/);
    assert.match(s, /y="7"/);
    assert.match(s, /width="346"/);
    assert.match(s, /height="112"/);
    assert.match(s, /rx="4"/);
    // chrome stops
    assert.match(s, /stopColor="#FFFFFF"/);
    assert.match(s, /stopColor="#A3A8B5"/);
    assert.match(s, /stopColor="#4A4E5A"/);
    assert.match(s, /stopColor="#1F2126"/);
    assert.match(s, /stopColor="#E2E5EC"/);
    assert.match(s, /stopColor="#737885"/);
    assert.match(s, /stopColor="#141518"/);
    // navy stops
    assert.match(s, /stopColor="#0E254A"/);
    assert.match(s, /stopColor="#081730"/);
    assert.match(s, /stopColor="#030A16"/);
    // glass path
    assert.match(
      s,
      /d="M 12 12 Q 12 9 17 9 L 343 9 Q 348 9 348 12 L 348 24 C 348 15 12 15 12 24 Z"/
    );
    assert.match(s, /fillOpacity="0\.25"/);
    // specular line
    assert.match(s, /x1="16"/);
    assert.match(s, /y1="10"/);
    assert.match(s, /x2="344"/);
    assert.match(s, /y2="10"/);
    assert.match(s, /strokeOpacity="0\.4"/);
    assert.match(s, /strokeWidth="1"/);
  });

  it('SVG IDs are unique per instance via useId', () => {
    const s = sigV5();
    assert.match(s, /useId\(\)/);
    assert.match(s, /chrome-rim-\$\{uid\}|chromeRim = `chrome-rim-\$\{uid\}`/);
    assert.match(s, /glass-navy-\$\{uid\}|glassNavy = `glass-navy-\$\{uid\}`/);
    assert.match(s, /inner-glow-\$\{uid\}|innerGlow = `inner-glow-\$\{uid\}`/);
  });

  it('SVG is aria-hidden and pointer-events none; label is HTML text', () => {
    const s = sigV5();
    assert.match(s, /aria-hidden="true"/);
    assert.match(s, /focusable="false"/);
    assert.match(s, /className="btn-text"/);
    assert.doesNotMatch(s, /<text[\s>]/);
    assert.match(css(), /\.forge-premium-btn \.btn-chassis[\s\S]*pointer-events:\s*none/);
  });

  it('real button and Link behavior work', () => {
    const s = sigV5();
    assert.match(s, /<button/);
    assert.match(s, /<Link/);
    assert.match(s, /loading\?:/);
    assert.match(s, /disabled\?:/);
  });

  it('comparison dimensions are exactly 360 × 127', () => {
    const s = sigV5();
    const r = reviewV5();
    assert.match(s, /widthPx:\s*360/);
    assert.match(s, /heightPx:\s*127/);
    assert.match(r, /width: widthPx/);
    assert.match(r, /height: heightPx/);
    assert.match(css(), /\.forge-premium-btn\s*\{[\s\S]*?width:\s*360px/);
    assert.match(css(), /\.forge-premium-btn\s*\{[\s\S]*?height:\s*127px/);
  });

  it('no product route imports ForgeSignatureV5', () => {
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
        if (src.includes('ForgeSignatureV5') || src.includes('forge-signature-v5')) {
          offenders.push(file.replace(process.cwd() + '/', ''));
        }
      }
    }
    for (const file of ['app/page.tsx', 'app/layout.tsx']) {
      try {
        const src = readFileSync(join(process.cwd(), file), 'utf8');
        if (src.includes('ForgeSignatureV5') || src.includes('forge-signature-v5')) {
          offenders.push(file);
        }
      } catch {
        /* missing */
      }
    }
    assert.deepEqual(offenders, [], `Found: ${offenders.join(', ')}`);
  });

  it('Tier 2 and Tier 3 remain untouched', () => {
    const btn = forgeBtn();
    assert.match(btn, /forge-btn--tier2/);
    assert.match(btn, /forge-btn--tier3/);
    assert.match(css(), /\.forge-btn--tier2-on-dark/);
    assert.match(css(), /\.forge-btn--tier2-on-white/);
    assert.match(css(), /\.forge-btn--tier3/);
    const s = sigV5();
    assert.doesNotMatch(s, /tier2|tier3|Tier 2|Tier 3/i);
  });

  it('internal review route remains protected in production', () => {
    const p = page();
    assert.match(p, /robots:\s*\{[\s\S]*index:\s*false[\s\S]*follow:\s*false/);
  });
});
