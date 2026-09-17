// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import cloudflare from '@astrojs/cloudflare';

// The canonical production origin. Overridden per environment with PUBLIC_SITE_URL.
// No deployment exists yet (see docs/TRL_DEPLOYMENT.md); this value only shapes
// canonical URLs, the sitemap, and robots.txt output.
const site = process.env.PUBLIC_SITE_URL ?? 'https://therightlifestyle.com';

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
