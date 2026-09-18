/**
 * Search-engine visibility (Gate 6, D-022).
 *
 * The first deployment is an interim `*.workers.dev` origin and the intended
 * domain is not owned, so the site ships **invisible to search engines by
 * default**. Only the exact, explicit value `PUBLIC_ALLOW_INDEXING=true` turns
 * indexing on, and the recommended moment to set it is the same day the real
 * domain goes live — a `workers.dev` host that gets indexed competes with the
 * site's own future domain, and undoing that takes weeks, not minutes.
 *
 * Everything here is pure except `indexingEnabled()`, which is the single reader
 * of the build-time variable, so both the layout and the robots endpoint
 * necessarily agree with each other and the policy can be tested in both states
 * without building the site twice.
 *
 * The value is read through `import.meta.env` (Vite), which resolves it from a
 * real environment variable *or* a `.env` file at build time — so it works
 * identically for a local build and for the hosting platform's build variables.
 */

/** The build-time variable that controls indexing. Never a secret. */
export const INDEXING_VARIABLE = 'PUBLIC_ALLOW_INDEXING';

/**
 * Parses the flag. Anything other than the exact string `true` (case- and
 * whitespace-insensitive) means "do not index" — a typo, a stale value, or a
 * missing variable must all fail towards invisibility, never towards exposure.
 */
export function parseIndexingFlag(value: string | null | undefined): boolean {
  return (value ?? '').trim().toLowerCase() === 'true';
}

/** True when this build was explicitly told to allow indexing. */
export function indexingEnabled(): boolean {
  return parseIndexingFlag(import.meta.env.PUBLIC_ALLOW_INDEXING as string | undefined);
}

/**
 * The `robots` meta content for a page, or `null` when the page should not carry
 * one. A page-level `noindex` (legal drafts, the confirmation page) holds in
 * both states, so enabling indexing later never accidentally exposes a draft.
 */
export function robotsMetaContent(options: {
  indexing: boolean;
  pageNoindex?: boolean;
}): string | null {
  if (!options.indexing || options.pageNoindex) return 'noindex, follow';
  return null;
}

/**
 * Builds `robots.txt` from the same two facts the pages use, so the crawl
 * policy, the page policy, and the sitemap cannot contradict each other.
 *
 * Note the deliberate choice in the indexing-off branch: crawling is **allowed**
 * even though nothing should be indexed. robots.txt governs crawling, not
 * indexing, and the two standard ways of getting this wrong both hurt:
 *
 *   1. `Disallow: /` would stop crawlers from ever fetching a page, so they
 *      would never read the `noindex` directive those pages carry — and a URL
 *      discovered through an external link can still be listed in results as
 *      "indexed, though blocked by robots.txt". That is the exact outcome this
 *      deployment is trying to avoid.
 *   2. `Noindex:` in robots.txt is not a directive: Google dropped support for
 *      it on 2019-09-01 and it does nothing anywhere.
 *
 * So the page-level `noindex` (see robotsMetaContent and the layout) is the
 * mechanism that does the work, and robots.txt stays out of its way. The sitemap
 * is advertised only when indexing is on — pointing crawlers at a sitemap for a
 * site that must not be listed is a contradiction, not a hint.
 */
export function robotsTxt(options: { indexing: boolean; origin: string }): string {
  if (!options.indexing) {
    return [
      '# TRL — The Right Lifestyle',
      '#',
      '# INDEXING IS OFF for this deployment. It is not served from the intended',
      '# domain yet, so every page carries a noindex directive and must not be',
      '# listed in search results. See docs/TRL_DEPLOYMENT.md (D-022).',
      '#',
      '# Crawling is allowed on purpose. robots.txt controls crawling, not',
      '# indexing: blocking it here would stop crawlers from reading the noindex',
      '# directive that does the actual work, and a URL found through an external',
      '# link could still be listed as "indexed, though blocked by robots.txt".',
      '# (Noindex: in robots.txt is not a directive — Google removed support for',
      '# it in 2019 — so it is not used.)',
      '',
      'User-agent: *',
      'Allow: /',
      '',
    ].join('\n');
  }

  return [
    '# TRL — The Right Lifestyle',
    '#',
    '# Indexing is on. The utility and draft pages are excluded from the sitemap',
    '# and also carry a noindex directive on the page itself.',
    '',
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${options.origin}/sitemap-index.xml`,
    '',
  ].join('\n');
}
