// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import cloudflare from '@astrojs/cloudflare';

/*
 * The canonical origin, required for a build.
 *
 * This used to default to `https://therightlifestyle.com`. That domain is
 * *intended* but not owned (Gate 6), so defaulting to it made every build assert
 * a canonical origin, a sitemap, and an Organization URL that the business
 * cannot back — and it silently produced the wrong origin on any deploy that was
 * not the real domain. There is no default now: `astro build` refuses to run
 * without an explicit `PUBLIC_SITE_URL` (D-021).
 *
 * `process.env` only — this is the one thing in the project that a `.env` file
 * cannot supply, because Astro and Vite load `.env` files *after* the config
 * module is evaluated. It must be a real environment variable: exported in a
 * shell, set by CI, or set as a build variable on the hosting platform.
 * See docs/TRL_DEPLOYMENT.md.
 */
const site = process.env.PUBLIC_SITE_URL?.trim() || undefined;

const BUILD_GUARD_HINT = [
  'PUBLIC_SITE_URL is not set, so this build has no canonical origin.',
  '',
  'Canonical URLs, Open Graph URLs, the sitemap, and robots.txt all derive from',
  'it, and the intended domain (therightlifestyle.com) is not owned — so there',
  'is no honest default to fall back to.',
  '',
  'Set it as a real environment variable (not in .env — the config is evaluated',
  'before .env files are read) and build again:',
  '',
  '  PUBLIC_SITE_URL="https://<your-worker>.<your-subdomain>.workers.dev" npm run build',
  '',
  'See docs/TRL_DEPLOYMENT.md for the value to use at each stage.',
].join('\n');

/*
 * `astro:build:start` fires for builds only, so this guard never blocks
 * `astro dev` (where the request's own origin is used) and never blocks
 * `astro check`. Both states of the indexing flag are legitimate; an
 * unrecognised value is not, and is the one mistake whose consequence
 * (an indexable interim host, or invisibility after the domain goes live)
 * is expensive to undo.
 */
const deploymentGuard = {
  name: 'trl-deployment-guard',
  hooks: {
    'astro:build:start': () => {
      if (!site) throw new Error(BUILD_GUARD_HINT);

      let parsed;
      try {
        parsed = new URL(site);
      } catch {
        throw new Error(
          `PUBLIC_SITE_URL is not a valid absolute URL: ${JSON.stringify(site)}\n\n` +
            'Expected something like https://example.workers.dev — no path, no trailing slash.',
        );
      }
      if (!/^https?:$/.test(parsed.protocol)) {
        throw new Error(
          `PUBLIC_SITE_URL must be http or https, got ${JSON.stringify(parsed.protocol)}.`,
        );
      }
      if (parsed.pathname !== '/' || parsed.search || parsed.hash) {
        throw new Error(
          `PUBLIC_SITE_URL must be an origin only, without a path, query, or fragment: ${JSON.stringify(site)}`,
        );
      }

      const flag = (process.env.PUBLIC_ALLOW_INDEXING ?? '').trim().toLowerCase();
      if (flag && flag !== 'true' && flag !== 'false') {
        throw new Error(
          `PUBLIC_ALLOW_INDEXING must be exactly "true" or "false" (or unset, which means false). Got ${JSON.stringify(
            process.env.PUBLIC_ALLOW_INDEXING,
          )}.`,
        );
      }
    },
  },
};

export default defineConfig({
  site,
  // D-005: static output with exactly one server-rendered route. Every page is
  // prerendered HTML except /contact/, which opts out with `prerender = false`
  // so it can process the form POST server-side (Gate 4).
  output: 'static',
  adapter: cloudflare(),
  trailingSlash: 'always',
  build: {
    format: 'directory',
  },
  prefetch: false,
  integrations: [
    deploymentGuard,
    sitemap({
      // Pages that carry a noindex directive are kept out of the sitemap so the
      // two signals cannot contradict each other. The legal pages are drafts
      // pending review (docs/TRL_OPERATING_STATE.md open questions), and
      // /contact/sent/ is a utility confirmation page, not content.
      filter: (page) =>
        !['/404', '/privacy/', '/terms/', '/contact/sent/'].some((excluded) =>
          page.includes(excluded),
        ),
    }),
  ],
  devToolbar: {
    enabled: false,
  },
  server: {
    host: true,
    // The Arena preview proxies both `astro dev` and `astro preview` under an
    // e2b.app host. Astro resolves this one key for BOTH: the dev container
    // passes it to Vite's server, and the preview entrypoint receives it as
    // `allowedHosts` (astro/dist/core/preview/index.js). Vite's own
    // `vite.server.allowedHosts` is NOT read by `astro preview`, which needs
    // `preview.allowedHosts` — so the setting has to live here.
    allowedHosts: true,
  },
});
