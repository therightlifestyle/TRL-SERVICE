import { describe, expect, it } from 'vitest';
import {
  INDEXING_VARIABLE,
  parseIndexingFlag,
  robotsMetaContent,
  robotsTxt,
} from '../../src/lib/indexing';
import {
  buildAllowsIndexing,
  readBuildOrigin,
  readRobotsTxt,
} from './helpers/build-artifacts';

/*
 * Gate 6 (D-022): search-engine visibility.
 *
 * The artifact is only ever built in one of the two states, so the state that
 * was *not* built is covered here as pure functions — both states are asserted
 * in every run, and the built artifact is asserted to agree with the policy that
 * produced it.
 */

const ORIGIN = 'https://example.workers.dev';

describe('the flag fails towards invisibility', () => {
  it('turns indexing on only for the exact string "true"', () => {
    expect(parseIndexingFlag('true')).toBe(true);
    expect(parseIndexingFlag('  TRUE  ')).toBe(true);
  });

  it.each([
    ['undefined (unset)', undefined],
    ['empty', ''],
    ['any other word', 'yes'],
    ['a truthy-looking number', '1'],
    ['false', 'false'],
    ['a typo', 'ture'],
  ])('treats %s as "do not index"', (_label, value) => {
    expect(parseIndexingFlag(value)).toBe(false);
  });

  it('is controlled by a documented, non-secret variable name', () => {
    expect(INDEXING_VARIABLE).toBe('PUBLIC_ALLOW_INDEXING');
  });
});

describe('page-level robots directives', () => {
  it('marks every page noindex while indexing is off', () => {
    expect(robotsMetaContent({ indexing: false })).toBe('noindex, follow');
    expect(robotsMetaContent({ indexing: false, pageNoindex: true })).toBe('noindex, follow');
  });

  it('omits the directive when indexing is on, except on noindex-by-design pages', () => {
    expect(robotsMetaContent({ indexing: true })).toBeNull();
    expect(robotsMetaContent({ indexing: true, pageNoindex: true })).toBe('noindex, follow');
  });
});

describe('robots.txt', () => {
  it('never blocks crawling while indexing is off, and never advertises a sitemap', () => {
    // The trap this avoids: `Disallow: /` + noindex means crawlers can never read
    // the noindex directive, and a URL found through an external link can still
    // be listed as "indexed, though blocked by robots.txt".
    const body = robotsTxt({ indexing: false, origin: ORIGIN });

    expect(body).toContain('User-agent: *');
    expect(body).toContain('Allow: /');
    expect(body).not.toContain('Disallow');
    expect(body).not.toContain('Sitemap:');
    expect(body).not.toMatch(/^Noindex:/m);
  });

  it('allows crawling and advertises the sitemap when indexing is on', () => {
    const body = robotsTxt({ indexing: true, origin: ORIGIN });

    expect(body).toContain('Allow: /');
    expect(body).not.toContain('Disallow');
    expect(body).toContain(`Sitemap: ${ORIGIN}/sitemap-index.xml`);
  });

  it('derives the sitemap URL from the configured origin, not a hardcoded domain', () => {
    const body = robotsTxt({ indexing: true, origin: 'https://staging.workers.dev' });
    expect(body).toContain('Sitemap: https://staging.workers.dev/sitemap-index.xml');
  });
});

describe('the built artifact agrees with the policy', () => {
  it('published the crawl policy for the state it was built in', () => {
    // Both branches are exercised across runs, since CI builds with the default
    // (off) and the domain-go-live build turns it on (D-022).
    const robots = readRobotsTxt();

    expect(robots).toContain('Allow: /');
    expect(robots).not.toContain('Disallow');
    expect(robots.includes('Sitemap:')).toBe(buildAllowsIndexing());
  });

  it('uses the configured PUBLIC_SITE_URL as its one canonical origin', () => {
    // This catches the failure that matters at the deployment gate: a build made
    // with one origin and tested or deployed against another. Skipped only when
    // no origin was exported for this run — then the artifact's own origin is the
    // only available truth, and the consistency checks in the other suites apply.
    const configured = process.env.PUBLIC_SITE_URL;
    if (!configured) return;

    expect(readBuildOrigin()).toBe(new URL(configured).origin);
  });
});
