import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const css = () => readFileSync(join(process.cwd(), 'app/globals.css'), 'utf8');
const page = () =>
  readFileSync(join(process.cwd(), 'app/internal/visual-system/page.tsx'), 'utf8');
const component = () =>
  readFileSync(join(process.cwd(), 'components/ui/ForgeButton.tsx'), 'utf8');
const chassis = () =>
  readFileSync(join(process.cwd(), 'components/ui/ForgeButtonReferenceChassis.tsx'), 'utf8');

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

describe('Forge button — referenceFaithful candidate', () => {
  it('uses an independent SVG structure for the new candidate', () => {
    const svg = chassis();
    const btn = component();
    assert.match(svg, /viewBox=\{`0 0 \$\{W\} \$\{H\}`\}|viewBox=\{`0 0 \$\{W\}/);
    assert.match(svg, /ForgeButtonReferenceChassis|REFERENCE_FAITHFUL_PROPORTIONS/);
    assert.match(svg, /frameMask|channelMask/);
    assert.match(svg, /linearGradient/);
    assert.match(btn, /referenceFaithful/);
    assert.match(btn, /ForgeButtonReferenceChassis/);
    assert.match(btn, /variant/);
  });

  it('keeps real text as HTML, not SVG paths', () => {
    const btn = component();
    const svg = chassis();
    assert.match(btn, /forge-btn__label/);
    assert.doesNotMatch(svg, /<text[\s>]/);
    assert.match(btn, /\{children\}/);
  });

  it('marks SVG layers decorative and aria-hidden', () => {
    const btn = component();
    const svg = chassis();
    assert.match(btn, /forge-btn-rf__art" aria-hidden="true"/);
    assert.match(svg, /aria-hidden="true"/);
    assert.match(svg, /pointer-events:\s*none|focusable="false"/);
  });

  it('shows the smooth rounded-rectangle reference (not angular/chamfered copy)', () => {
    const review = page();
    const svg = chassis();
    assert.match(review, /Actual approved reference|sole visual source of truth/i);
    assert.match(review, /smooth chrome rounded-rectangle/i);
    assert.match(review, /not the prior angular\/chamfered/i);
    assert.match(review, /no bottom silver rail/i);
    assert.match(review, /\/internal\/forge-button-approved-reference\.png/);
    assert.ok(
      existsSync(join(process.cwd(), 'public/internal/forge-button-approved-reference.png'))
    );
    // Controlled corner family — not the prior bulbous 11/60 ratio
    assert.match(svg, /OUTER_RX = 7\.5/);
    assert.doesNotMatch(svg, /OUTER_RX = 11/);
    // Reference asset must not appear on product entry points
    for (const file of ['app/page.tsx', 'app/layout.tsx', 'app/profile/page.tsx']) {
      try {
        const src = readFileSync(join(process.cwd(), file), 'utf8');
        assert.doesNotMatch(src, /forge-button-approved-reference/);
      } catch {
        /* optional path */
      }
    }
  });

  it('omits the detached bottom silver rail under the chassis', () => {
    const svg = chassis();
    // Old rail sat on the outer bottom edge at H - 1.4 spanning a wide band
    assert.doesNotMatch(svg, /H - 1\.4/);
    assert.doesNotMatch(svg, /Bottom polish catch/);
    assert.match(svg, /NOT a detached rail|no heavy bottom rail/i);
  });

  it('uses a broad soft glass reflection without an isolated oval sticker', () => {
    const svg = chassis();
    assert.match(svg, /Broad soft upper-face glass|Broad soft glass reflection/);
    assert.doesNotMatch(svg, /<ellipse/);
  });

  it('does not use the reference image as the interactive control', () => {
    const review = page();
    assert.match(review, /not an\s+interactive control/i);
    assert.match(
      review,
      /<Image[\s\S]*?src="\/internal\/forge-button-approved-reference\.png"/
    );
    assert.doesNotMatch(review, /<ForgeButton[^>]*>\s*<Image/);
    assert.doesNotMatch(
      review,
      /<ForgeButton[^>]*src="\/internal\/forge-button-approved-reference/
    );
  });

  it('standard candidate is taller than the old 48px experiment', () => {
    const styles = css();
    const svg = chassis();
    assert.match(styles, /\.forge-btn--rf\.forge-btn--tier1[\s\S]*?--forge-btn-height:\s*58px/);
    assert.match(styles, /\.forge-btn--experimental\.forge-btn--tier1[\s\S]*?--forge-btn-height:\s*48px/);
    assert.match(svg, /standardHeightPx:\s*58/);
  });

  it('labels compact size as experimental', () => {
    const review = page();
    const styles = css();
    assert.match(review, /Compact experimental/);
    assert.match(review, /not automatically approved/i);
    assert.match(styles, /\.forge-btn--rf\.forge-btn--compact[\s\S]*?--forge-btn-height:\s*48px/);
  });

  it('Tier 2 on navy is not a filled navy block', () => {
    const styles = css();
    const dark = styles.match(/\.forge-btn--tier2-on-dark\s*\{[^}]+\}/)?.[0] ?? '';
    assert.ok(dark.length > 0);
    assert.match(dark, /rgba\(255,\s*255,\s*255,\s*0\.0[4-9]/);
    assert.match(dark, /border:\s*1px solid rgba\(232,\s*235,\s*240,\s*0\.78\)/);
    assert.doesNotMatch(dark, /background:\s*(var\(--forge-navy\)|#0[Bb]2[Dd]5[Cc])/);
  });

  it('Tier 2 on white retains full text contrast', () => {
    const styles = css();
    const white = styles.match(/\.forge-btn--tier2-on-white\s*\{[^}]+\}/)?.[0] ?? '';
    assert.match(white, /color:\s*var\(--forge-navy\)/);
    assert.match(white, /background:\s*var\(--forge-app-background/);
    assert.doesNotMatch(white, /opacity:\s*0\.\d/);
  });

  it('interaction states preserve dimensions', () => {
    const styles = css();
    const btn = component();
    assert.match(btn, /loading\?:/);
    assert.match(btn, /data-loading/);
    assert.match(styles, /\[data-loading='true'\]/);
    assert.match(styles, /--forge-btn-height:\s*58px/);
    assert.match(styles, /--forge-btn-height:\s*68px/);
  });

  it('keeps reduced-motion behavior', () => {
    assert.match(css(), /prefers-reduced-motion:\s*reduce/);
  });

  it('hosts candidate review sections on /internal/visual-system', () => {
    const review = page();
    assert.match(review, /Implementation candidate/);
    assert.match(review, /Enlarged detail/);
    assert.match(review, /Surface matrix/);
    assert.match(review, /referenceFaithful/);
    assert.match(review, /variant="experimental"/);
  });

  it('confirms no product routes use the candidate', () => {
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
        if (
          src.includes('ForgeButton') ||
          src.includes('forge-btn--rf') ||
          src.includes('referenceFaithful') ||
          src.includes('ForgeButtonReferenceChassis')
        ) {
          offenders.push(file.replace(process.cwd() + '/', ''));
        }
      }
    }
    for (const file of ['app/page.tsx', 'app/layout.tsx']) {
      try {
        const src = readFileSync(join(process.cwd(), file), 'utf8');
        if (src.includes('ForgeButton') || src.includes('referenceFaithful')) {
          offenders.push(file);
        }
      } catch {
        /* missing */
      }
    }
    assert.deepEqual(
      offenders,
      [],
      `Candidate must not roll out to product routes. Found: ${offenders.join(', ')}`
    );
  });

  it('documents production-safe robots rules for the internal route', () => {
    const review = page();
    assert.match(review, /robots:\s*\{[\s\S]*index:\s*false[\s\S]*follow:\s*false/);
  });
});
