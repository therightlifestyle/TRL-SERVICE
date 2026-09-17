// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// The canonical production origin. Overridden per environment with PUBLIC_SITE_URL.
// No deployment exists yet (see docs/TRL_DEPLOYMENT.md); this value only shapes
// canonical URLs, the sitemap, and robots.txt output.
const site = process.env.PUBLIC_SITE_URL ?? 'https://therightlifestyle.com';

export default defineConfig({
  site,
  output: 'static',
  trailingSlash: 'always',
  build: {
    format: 'directory',
  },
  prefetch: false,
  integrations: [
    sitemap({
      // Pages that carry a noindex directive are kept out of the sitemap so the
      // two signals cannot contradict each other. The legal pages are drafts
      // pending review (docs/TRL_OPERATING_STATE.md open questions).
      filter: (page) =>
        !['/404', '/privacy/', '/terms/'].some((excluded) => page.includes(excluded)),
    }),
  ],
  devToolbar: {
    enabled: false,
  },
  server: {
    host: true,
  },
  vite: {
    // The Arena preview proxies the dev server under an e2b.app host.
    server: {
      allowedHosts: true,
    },
  },
});
