import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { JSDOM } from 'jsdom';
import { beforeAll, describe, expect, it } from 'vitest';
import { buildOnce } from './helpers/build-once';
import { buildAllowsIndexing, DIST, readBuildOrigin, readRobotsTxt } from './helpers/build-artifacts';

/*
 * Structural and accessibility checks against the real build output.
 *
 * axe-core runs here on the static HTML so semantics, landmarks, headings, names,
 * and ARIA usage are verified in every pull request without a browser download.
 * Rendered-state checks that need a real engine — colour contrast as painted,
 * focus visibility, reflow at 320px, and keyboard behaviour — live in the
 * Playwright suite in tests/e2e and are not duplicated here.
 *
 * Since Gate 4, /contact/ is the one server-rendered route (it processes the
 * form POST), so it has no static HTML here: its structure, states, and the
 * enabled form are asserted by the Playwright suite in tests/e2e/contact-form.spec.ts.
 * Static assets now build to dist/client (the Workers adapter layout).
 */

const pages = [
  { path: 'index.html', route: '/' },
  { path: 'services/index.html', route: '/services/' },
  { path: 'ai-solutions/index.html', route: '/ai-solutions/' },
  { path: 'offers/index.html', route: '/offers/' },
  { path: 'about/index.html', route: '/about/' },
  { path: 'contact/sent/index.html', route: '/contact/sent/' },
  { path: 'privacy/index.html', route: '/privacy/' },
  { path: 'terms/index.html', route: '/terms/' },
  { path: '404.html', route: '/404' },
];

let ORIGIN = '';

function load(page: string): JSDOM {
  return new JSDOM(readFileSync(join(DIST, page), 'utf8'), {
    url: `${ORIGIN}${page === 'index.html' ? '/' : `/${page}`}`,
    pretendToBeVisual: true,
    runScripts: 'outside-only',
  });
}

beforeAll(() => {
  buildOnce();
  ORIGIN = readBuildOrigin();
}, 180_000);

describe('build output', () => {
  it('emits every approved route', () => {
    for (const page of pages) {
      expect(existsSync(join(DIST, page.path)), `${page.path} missing`).toBe(true);
    }
  });

  it('emits robots.txt and a sitemap index', () => {
    expect(existsSync(join(DIST, 'robots.txt'))).toBe(true);
    expect(existsSync(join(DIST, 'sitemap-index.xml'))).toBe(true);
  });

  it('states one crawl policy, and never the disallow-and-noindex trap', () => {
    // Gate 6 (D-022). While indexing is off, crawling must stay ALLOWED: a
    // `Disallow: /` would stop crawlers from reading the noindex directive that
    // actually keeps the deployment out of results, and a URL discovered via an
    // external link could still be listed as "indexed, though blocked by
    // robots.txt". `Noindex:` in robots.txt is not a directive and is never used.
    const robots = readRobotsTxt();
    expect(robots).toContain('User-agent: *');
    expect(robots).toContain('Allow: /');
    expect(robots).not.toContain('Disallow');
    expect(robots).not.toMatch(/^Noindex:/m);

    // The sitemap is advertised only when indexing is on: pointing crawlers at a
    // sitemap for a site that must not be listed is a contradiction.
    expect(robots.includes('Sitemap:')).toBe(buildAllowsIndexing());
    if (buildAllowsIndexing()) {
      expect(robots).toContain(`Sitemap: ${ORIGIN}/sitemap-index.xml`);
    }
  });

  it('self-hosts the fonts with their licences', () => {
    for (const file of [
      'fonts/manrope-latin-wght-normal.woff2',
      'fonts/newsreader-latin-500-normal.woff2',
      'fonts/Manrope-OFL.txt',
      'fonts/Newsreader-OFL.txt',
    ]) {
      expect(existsSync(join(DIST, file)), `${file} missing`).toBe(true);
    }
  });

  it('loads no third-party runtime resources', () => {
    // Resource loads (scripts, styles, images, frames, preloads) pull from the
    // network on page view; plain anchors only navigate when clicked and are
    // covered by the external-link test below.
    const resourceLoads =
      /<(?:script|link|img|iframe|audio|video|source|embed|object|track)[^>]+(?:src|href)="(https?:\/\/[^"]+)"/g;

    for (const page of pages) {
      const html = readFileSync(join(DIST, page.path), 'utf8');
      const externals = [...html.matchAll(resourceLoads)]
        .map((match) => match[1])
        .filter((url) => !url.startsWith(ORIGIN));
      expect(externals, `${page.path} loads a third-party resource`).toEqual([]);
    }
  });

  it('links off-site only where approved', () => {
    // The only sanctioned outbound links are the WhatsApp deep links on every
    // page and the Cloudflare privacy-policy disclosure on the legal draft.
    for (const page of pages) {
      const html = readFileSync(join(DIST, page.path), 'utf8');
      const anchors = [...html.matchAll(/<a[^>]+href="(https?:\/\/[^"]+)"/g)]
        .map((match) => match[1])
        .filter((url) => !url.startsWith(ORIGIN) && !url.startsWith('https://wa.me/'));

      if (page.route === '/privacy/') {
        expect(anchors).toEqual(['https://www.cloudflare.com/privacypolicy/']);
      } else {
        expect(anchors, `${page.path} has unexpected off-site links`).toEqual([]);
      }
    }
  });

  it('builds the sitemap from the configured origin, without the noindex pages', () => {
    const sitemap = readFileSync(join(DIST, 'sitemap-0.xml'), 'utf8');
    expect(sitemap).toContain(`${ORIGIN}/offers/`);
    expect(sitemap).toContain(`${ORIGIN}/contact/`);
    expect(sitemap).not.toContain('/privacy/');
    expect(sitemap).not.toContain('/terms/');
    expect(sitemap).not.toContain('/contact/sent/');

    // Every URL in the sitemap belongs to the one configured origin.
    for (const loc of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)) {
      expect(new URL(loc[1]).origin).toBe(ORIGIN);
    }
  });
});

describe.each(pages)('$route', ({ path, route }) => {
  it('has a descriptive title, description, and canonical URL', () => {
    const { window } = load(path);
    const doc = window.document;

    expect(doc.title.endsWith('TRL · The Right Lifestyle')).toBe(true);
    expect(doc.title.length).toBeGreaterThan('TRL · The Right Lifestyle'.length + 3);

    const description = doc
      .querySelector('meta[name="description"]')
      ?.getAttribute('content');
    expect(description?.length ?? 0).toBeGreaterThan(50);

    const canonical = doc.querySelector('link[rel="canonical"]')?.getAttribute('href');
    expect(canonical?.startsWith(ORIGIN)).toBe(true);
  });

  it('has landmarks, exactly one h1, and no skipped heading levels', () => {
    const { window } = load(path);
    const doc = window.document;

    expect(doc.querySelectorAll('header').length).toBeGreaterThan(0);
    expect(doc.querySelectorAll('main').length).toBe(1);
    expect(doc.querySelectorAll('footer').length).toBe(1);
    expect(doc.querySelectorAll('h1').length).toBe(1);

    const levels = [...doc.querySelectorAll('main h1, main h2, main h3, main h4')].map(
      (heading) => Number(heading.tagName[1]),
    );
    let previous = levels[0] ?? 1;
    for (const level of levels) {
      expect(level - previous, `heading jump on ${route}`).toBeLessThanOrEqual(1);
      previous = level;
    }
  });

  it('starts with a skip link and exposes the wordmark by name', () => {
    const { window } = load(path);
    const doc = window.document;

    const first = doc.querySelector('body a, body button');
    expect(first?.getAttribute('href')).toBe('#main');

    const wordmark = doc.querySelector('header a[rel="home"]');
    expect(wordmark?.getAttribute('aria-label')).toBe('TRL — The Right Lifestyle');
  });

  it('carries the indexing policy that matches robots.txt', () => {
    // Gate 6 (D-022): while indexing is off, every page must say noindex. When it
    // is on, only the pages that are noindex by design stay excluded — the legal
    // drafts, the confirmation page, and the 404 document.
    const { window } = load(path);
    const robotsMeta =
      window.document.querySelector('meta[name="robots"]')?.getAttribute('content') ?? null;

    const noindexByDesign = ['/404', '/privacy/', '/terms/', '/contact/sent/'];
    const expected = !buildAllowsIndexing() || noindexByDesign.includes(route);

    expect(robotsMeta, `${route} indexing state`).toBe(expected ? 'noindex, follow' : null);
  });

  it('has no generic link text', () => {
    const { window } = load(path);
    const banned = ['click here', 'read more', 'learn more', 'here', 'more'];

    for (const link of window.document.querySelectorAll('a')) {
      const label = (link.textContent ?? '').trim().toLowerCase();
      if (!label) continue;
      expect(banned, `generic link text on ${route}`).not.toContain(label);
    }
  });

  it('gives every decorative graphic aria-hidden and every image alt text', () => {
    const { window } = load(path);

    for (const graphic of window.document.querySelectorAll('.systems-graphic')) {
      expect(graphic.getAttribute('aria-hidden')).toBe('true');
    }
    for (const image of window.document.querySelectorAll('img')) {
      expect(image.hasAttribute('alt')).toBe(true);
    }
  });

  it('passes axe-core static checks for WCAG 2.2 A and AA', async () => {
    const { window } = load(path);
    const axeSource = readFileSync(
      join(process.cwd(), 'node_modules', 'axe-core', 'axe.min.js'),
      'utf8',
    );
    window.eval(axeSource);

    const results = await (window as unknown as { axe: any }).axe.run(window.document, {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
      },
      // Contrast depends on painted pixels, which jsdom does not produce; the
      // token pairings are asserted numerically in design-tokens.test.ts and the
      // rendered result is checked by the Playwright axe run.
      rules: { 'color-contrast': { enabled: false } },
    });

    expect(
      results.violations.map((violation: { id: string }) => violation.id),
    ).toEqual([]);
  }, 60_000);
});

describe('contact route', () => {
  it('is server-rendered, not emitted as static HTML', () => {
    // /contact/ must handle POST, so it must never silently become a
    // prerendered page again — that would ship a form whose submissions 405.
    expect(existsSync(join(DIST, 'contact', 'index.html'))).toBe(false);
    expect(existsSync(join(DIST, 'contact', 'sent', 'index.html'))).toBe(true);
  });
});

describe('contact confirmation page', () => {
  it('is marked noindex and states what happens next', () => {
    const { window } = load('contact/sent/index.html');
    const doc = window.document;

    expect(doc.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe(
      'noindex, follow',
    );
    expect(doc.querySelector('h1')?.textContent).toContain('Your enquiry was sent');
    // No response-time promise is made (journey J2: none may be invented).
    expect(doc.body.textContent).not.toMatch(/within \d+ (hours|days|minutes)/i);
  });
});

describe('legal drafts', () => {
  it.each(['privacy/index.html', 'terms/index.html'])(
    '%s is marked noindex and labelled as a draft',
    (page) => {
      const { window } = load(page);
      const doc = window.document;

      expect(doc.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe(
        'noindex, follow',
      );
      expect(doc.body.textContent).toContain('Draft');
    },
  );
});
