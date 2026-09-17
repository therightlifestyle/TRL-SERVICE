import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { gzipSync } from 'node:zlib';
import { beforeAll, describe, expect, it } from 'vitest';
import { buildOnce } from './helpers/build-once';

/*
 * Gate 5 performance budget (D-020).
 *
 * Lighthouse cannot run in the authoring sandbox (Playwright's browser CDN is
 * unreachable, so no Chromium exists) and the site is not deployed, so the
 * Gate 5 performance audit is a deterministic one over the build output rather
 * than a synthetic-scoring one. This file is the durable half of that audit:
 * it pins what the audit measured, so a change that quietly doubles the page
 * weight or reintroduces client JavaScript fails CI instead of silently
 * regressing.
 *
 * Measured baseline at the Gate 5 review (2026-09-17), heaviest page first —
 * home, 53.4 KB of HTML + CSS uncompressed / 17.5 KB compressed, 48.5 KB of
 * fonts, and zero bytes of JavaScript anywhere in the client build:
 *
 *   page                   html    gzip  inlineCSS  linkedCSS    total
 *   /                     35378    7268       7213      10796    53387
 *   /offers/              24660    5420       5670      10796    41126
 *   /ai-solutions/        18809    4648       5231      10796    34836
 *   /services/            17563    4509       4119      10796    32478
 *   /about/               13371    3573       3136      10796    27303
 *   /contact/sent/        10921    2862       3297      10796    25014
 *   /privacy/             11342    3358       1598      10796    23736
 *   /terms/               10319    2995       1598      10796    22713
 *   /404.html              9281    2445       2266      10796    22343
 *
 * A budget the code already meets is not a target to grow into: the ceilings
 * below are set well above the measurements so they fail on a real regression
 * (a framework or font added to the client build, a page doubling in size) and
 * not on honest content edits. Raising one is a deliberate act that this
 * comment should be updated to match.
 */

const DIST = join(process.cwd(), 'dist', 'client');

/** Every prerendered page, plus the Worker-independent 404 document. */
const pages = [
  'index.html',
  '404.html',
  'about/index.html',
  'ai-solutions/index.html',
  'contact/sent/index.html',
  'offers/index.html',
  'privacy/index.html',
  'services/index.html',
  'terms/index.html',
];

/** Ceilings in bytes. Uncompressed HTML + all CSS the page references. */
const PAGE_BUDGET_BYTES = 80_000;
/** Ceiling on the HTML alone once gzipped — the number a visitor pays for. */
const PAGE_GZIP_BUDGET_BYTES = 12_000;
/** Both self-hosted subsets, which are render-critical on every route. */
const FONT_BUDGET_BYTES = 64_000;

function listFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter((entry) => entry.isFile())
    .map((entry) => relative(dir, join(entry.parentPath, entry.name)));
}

beforeAll(() => {
  buildOnce();
}, 180_000);

describe('the browser bundle ships no JavaScript', () => {
  it('emits no .js, .mjs, or .cjs file to dist/client', () => {
    // D-010 is the Gate 3 baseline ("zero client JavaScript") and the static
    // CSP enforces it in the browser with `script-src 'none'`. Both would be
    // satisfied by a build that emitted dead JavaScript nobody loads, so the
    // artifact is pinned too: a bundler emitting client JS is a regression
    // signal even before it is referenced. /contact/'s Turnstile script comes
    // from challenges.cloudflare.com at runtime, never from this directory.
    const scripts = listFiles(DIST).filter((file) => /\.(?:js|mjs|cjs)$/.test(file));
    expect(scripts, `client JavaScript emitted: ${scripts.join(', ')}`).toEqual([]);
  });

  it('references no script element other than the JSON-LD data block', () => {
    // The artifact check above and this one fail differently: a bundler that
    // emitted client JS but never referenced it, versus a page that started
    // referencing one that already existed. Both are D-010 regressions.
    for (const page of pages) {
      const html = readFileSync(join(DIST, page), 'utf8');
      for (const tag of [...html.matchAll(/<script\b[^>]*>/g)].map((m) => m[0])) {
        expect(tag, `${page}: unexpected executable script`).toMatch(
          /type="application\/ld\+json"/,
        );
      }
    }
  });
});

describe('render-critical fonts', () => {
  it('preloads both self-hosted subsets on every page', () => {
    // Newsreader sets h1/h2 and Manrope sets body copy, so both faces are on
    // the critical path for the largest text on the page. A partial preload
    // list is the regression this catches — it is invisible in the rendered
    // result and only shows up as a later font swap.
    const expected = [
      '/fonts/manrope-latin-wght-normal.woff2',
      '/fonts/newsreader-latin-500-normal.woff2',
    ];

    for (const page of pages) {
      const html = readFileSync(join(DIST, page), 'utf8');
      const preloads = [...html.matchAll(/<link\b[^>]*rel="preload"[^>]*>/g)].map((m) => m[0]);

      for (const href of expected) {
        const tag = preloads.find((candidate) => candidate.includes(`href="${href}"`));
        expect(tag, `${page} does not preload ${href}`).toBeDefined();
        // Font preloads must be anonymous-mode and typed, or the browser
        // cannot match them to the real request and fetches the file twice.
        expect(tag).toContain('as="font"');
        expect(tag).toContain('type="font/woff2"');
        expect(tag).toContain('crossorigin');
      }
    }
  });

  it('declares font-display: swap for every face', () => {
    // Without `swap` the text is invisible (FOIT) until the font arrives —
    // the exact cost preloading is meant to remove.
    const tokens = readFileSync(join(process.cwd(), 'src', 'styles', 'tokens.css'), 'utf8');
    const faces = [...tokens.matchAll(/@font-face\s*\{[^}]*\}/g)].map((m) => m[0]);

    // Guards the parse as much as the fonts: if the token file is restructured
    // so this regex stops matching, the loop below would pass vacuously.
    expect(faces.length, 'no @font-face block found in tokens.css').toBeGreaterThan(0);
    for (const face of faces) {
      expect(face).toContain('font-display: swap');
    }
  });

  it('keeps the font payload inside budget', () => {
    const fonts = listFiles(join(DIST, 'fonts'))
      .filter((file) => file.endsWith('.woff2'))
      .map((file) => statSync(join(DIST, 'fonts', file)).size)
      .reduce((sum, size) => sum + size, 0);

    expect(fonts, 'font payload grew past the pinned budget').toBeLessThanOrEqual(
      FONT_BUDGET_BYTES,
    );
  });
});

describe('page weight', () => {
  it('keeps every page inside the HTML + CSS budget', () => {
    for (const page of pages) {
      const html = readFileSync(join(DIST, page), 'utf8');
      // Astro inlines small scoped style blocks and links the rest; both are
      // bytes the visitor waits on, so both count.
      const inline = [...html.matchAll(/<style>[\s\S]*?<\/style>/g)].map(
        (m) => m[0].length,
      );
      const linked = [...html.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map((m) =>
        statSync(join(DIST, m[1].replace(/^\//, ''))).size,
      );
      const total = html.length + inline.reduce((a, b) => a + b, 0) + linked.reduce((a, b) => a + b, 0);

      expect(total, `${page} exceeds the ${PAGE_BUDGET_BYTES}-byte budget`).toBeLessThanOrEqual(
        PAGE_BUDGET_BYTES,
      );
    }
  });

  it('keeps every page inside the compressed HTML budget', () => {
    // The uncompressed number is what the browser parses; the compressed one
    // is what the visitor downloads. Both can regress independently.
    for (const page of pages) {
      const html = readFileSync(join(DIST, page), 'utf8');
      const gzipped = gzipSync(html, { level: 9 }).length;

      expect(
        gzipped,
        `${page} exceeds the ${PAGE_GZIP_BUDGET_BYTES}-byte compressed budget`,
      ).toBeLessThanOrEqual(PAGE_GZIP_BUDGET_BYTES);
    }
  });
});
