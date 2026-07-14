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

describe('Forge button visual system — substantial metallic chassis', () => {
  it('Tier 1 uses multiple visible metallic layers', () => {
    const styles = css();
    const btn = component();
    assert.match(styles, /\.forge-btn__chassis/);
    assert.match(styles, /\.forge-btn__bevel/);
    assert.match(styles, /\.forge-btn__face/);
    assert.match(styles, /\.forge-btn__glass/);
    assert.match(btn, /MetallicChassis/);
    assert.match(btn, /forge-btn__bevel/);
    assert.match(btn, /forge-btn__glass/);
    assert.match(btn, /forge-btn__chassis-svg|<svg/);
  });

  it('Tier 1 frame is not a single flat border', () => {
    const styles = css();
    assert.match(styles, /--forge-btn-chassis-thickness:\s*4\.5px/);
    assert.match(styles, /linear-gradient\([\s\S]*#68727[dD]/);
    assert.match(styles, /#ffffff|#FFFFFF/);
    assert.match(styles, /#4[cC]5661/);
    // Must not rely on a lone flat border for the metallic look
    const tier1 = styles.match(/\.forge-btn--tier1\s*\{[^}]+\}/)?.[0] ?? '';
    assert.ok(tier1.includes('background') || tier1.includes('box-shadow'));
    assert.doesNotMatch(tier1, /border:\s*1px solid\s+#?[89a-fA-F]{3,6}\s*;/);
  });

  it('inner recessed face exists separately from the chassis', () => {
    const styles = css();
    const btn = component();
    assert.match(styles, /\.forge-btn--tier1\s+\.forge-btn__face/);
    assert.match(styles, /--forge-btn-inner-radius:\s*2\.5px/);
    assert.match(styles, /--forge-btn-outer-radius:\s*4px/);
    assert.match(btn, /forge-btn__face/);
    assert.match(btn, /forge-btn__chassis/);
  });

  it('graphite separator exists', () => {
    const styles = css();
    assert.match(styles, /#26303[aA]/);
    assert.match(styles, /graphite separator/i);
    assert.match(styles, /\.forge-btn__bevel/);
  });

  it('glass reflection is limited to the upper portion', () => {
    const styles = css();
    assert.match(styles, /\.forge-btn__glass\s*\{[\s\S]*?height:\s*48%/);
    assert.doesNotMatch(styles, /\.forge-btn__glass\s*\{[^}]*height:\s*100%/);
  });

  it('Soft Slate and white use navy-faced Tier 1', () => {
    const review = page();
    assert.match(review, /Soft Slate — navy Tier 1/);
    assert.match(review, /White — navy Tier 1/);
    assert.match(review, /surface="soft-slate"/);
    assert.match(review, /surface="white"/);
  });

  it('deep navy uses Soft Slate-faced Tier 1', () => {
    const styles = css();
    const btn = component();
    const review = page();
    assert.match(styles, /\.forge-btn--tier1-face-soft-slate|\.forge-btn--tier1-on-dark/);
    assert.match(btn, /soft-slate/);
    assert.match(review, /Soft Slate Tier 1/);
    assert.match(review, /surface="navy"/);
  });

  it('Tier 2 on white uses Soft Slate/pale fill', () => {
    const styles = css();
    assert.match(styles, /\.forge-btn--tier2-on-white/);
    assert.match(
      styles,
      /\.forge-btn--tier2-on-white\s*\{[\s\S]*?background:\s*var\(--forge-app-background/
    );
  });

  it('Tier 2 on deep navy is not a filled navy button', () => {
    const styles = css();
    const dark = styles.match(/\.forge-btn--tier2-on-dark\s*\{[^}]+\}/)?.[0] ?? '';
    assert.ok(dark.length > 0);
    assert.match(dark, /rgba\(255,\s*255,\s*255/);
    assert.doesNotMatch(dark, /background:\s*var\(--forge-navy\)/);
    assert.doesNotMatch(dark, /background:\s*#0[Bb]2[Dd]5[Cc]/);
  });

  it('Tier 2 dark variant uses light/silver outline', () => {
    const styles = css();
    const dark = styles.match(/\.forge-btn--tier2-on-dark\s*\{[^}]+\}/)?.[0] ?? '';
    assert.match(dark, /border-color:\s*rgba\(232,\s*235,\s*240/);
    assert.match(dark, /#f7f9fc|#F7F9FC|color:\s*#f7f9fc/i);
  });

  it('Tier 3 remains text-only', () => {
    const styles = css();
    const t3 = styles.match(/\.forge-btn--tier3\s*\{[^}]+\}/)?.[0] ?? '';
    assert.match(t3, /background:\s*transparent/);
    assert.match(t3, /border:\s*none/);
    assert.match(t3, /min-height:\s*44px/);
  });

  it('button and link semantics remain correct', () => {
    const btn = component();
    assert.match(btn, /<button/);
    assert.match(btn, /<Link/);
    assert.match(btn, /aria-busy/);
    assert.match(btn, /aria-disabled/);
  });

  it('loading and disabled preserve dimensions', () => {
    const styles = css();
    const btn = component();
    assert.match(btn, /loading\?:/);
    assert.match(btn, /data-loading/);
    assert.match(styles, /\.forge-btn--tier1\[data-loading='true'\]/);
    assert.match(styles, /\.forge-btn--tier1:disabled:not\(\[data-loading='true'\]\)/);
    assert.match(styles, /--forge-btn-height:\s*48px/);
  });

  it('mobile retains the same geometry', () => {
    const styles = css();
    assert.match(styles, /\.forge-btn--block\s*\{[\s\S]*?border-radius:\s*var\(--forge-btn-outer-radius\)/);
    assert.match(styles, /--forge-btn-outer-radius:\s*4px/);
    assert.match(styles, /--forge-btn-chassis-thickness:\s*4\.5px/);
    assert.doesNotMatch(styles, /\.forge-btn--block[^{]*\{[^}]*border-radius:\s*(999|50%|1rem)/);
  });

  it('includes reduced-motion behavior', () => {
    const styles = css();
    assert.match(styles, /prefers-reduced-motion:\s*reduce/);
  });

  it('locks Tier 2 to 4px radius token', () => {
    const styles = css();
    assert.match(styles, /--forge-btn-radius:\s*4px/);
    assert.match(
      styles,
      /\.forge-btn--tier2\s*\{[\s\S]*?border-radius:\s*var\(--forge-btn-radius\)/
    );
  });

  it('hosts the metallic reconstruction review at /internal/visual-system', () => {
    const review = page();
    assert.match(review, /robots:\s*\{[\s\S]*index:\s*false/);
    assert.match(review, /Approved reference target|metallic rendering/i);
    assert.match(review, /Primary surface matrix/);
    assert.match(review, /Metallic detail/);
    assert.match(review, /Red \(reference only\)/);
    assert.match(review, /Do not use as ordinary primary/);
  });

  it('confirms no production routes use ForgeButton yet', () => {
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
