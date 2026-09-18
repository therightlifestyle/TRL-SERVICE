import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/*
 * Reads facts out of the real build output instead of asserting hardcoded ones.
 *
 * The canonical origin is a build variable, not a project fact (D-021), so a
 * test that hardcoded a domain would either encode a domain the founder does not
 * own or fail against a correctly built artifact. These helpers take the origin
 * from the artifact itself and then let the tests assert that everything agrees
 * with it — one origin, everywhere, and no contradictions between the page
 * directives, robots.txt, and the sitemap.
 */

export const DIST = join(process.cwd(), 'dist', 'client');

function readDist(relativePath: string): string {
  return readFileSync(join(DIST, relativePath), 'utf8');
}

/** The single canonical origin this build was produced with. */
export function readBuildOrigin(): string {
  const html = readDist('index.html');

  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  if (!canonical) throw new Error('dist/client/index.html has no canonical link');

  const ogUrl = html.match(/<meta property="og:url" content="([^"]+)"/)?.[1];
  const schemaUrl = html.match(/"url":\s*"([^"]+)"/)?.[1];
  const origin = new URL(canonical).origin;

  // If these ever disagree the artifact carries two different origins, which is
  // the class of bug this helper exists to make visible.
  for (const [label, value] of [
    ['og:url', ogUrl],
    ['JSON-LD url', schemaUrl],
  ] as const) {
    if (value !== undefined && new URL(value).origin !== origin) {
      throw new Error(`${label} (${value}) does not use the canonical origin ${origin}`);
    }
  }

  return origin;
}

/** The built robots.txt, verbatim. */
export function readRobotsTxt(): string {
  return readDist('robots.txt');
}

/**
 * Whether this build allows indexing. Derived from robots.txt rather than from
 * the environment, so it reflects what the artifact actually says — and is the
 * same signal a crawler reads.
 */
export function buildAllowsIndexing(): boolean {
  return readRobotsTxt().includes('Sitemap:');
}
