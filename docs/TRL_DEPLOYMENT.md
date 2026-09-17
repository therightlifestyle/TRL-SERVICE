# TRL — Deployment

_Last updated: 2026-09-17 (Gate 5 in progress — security headers/CSP implemented; rate limiting planned)._

## Current status

No hosting account, domain change, DNS record, email-provider account, payment account, or production deployment has been configured. Nothing has been purchased or created. In particular, **no Turnstile or Resend account exists**, so the site's production keys are not yet obtainable; the endpoint is built, tested against Cloudflare's published dummy keys, and ready for real configuration.

The application now produces a deployable artifact: `npm run build` emits the static site to `dist/client/` (8 prerendered routes plus `robots.txt`, the sitemap, the favicon, and the self-hosted fonts) and the Workers server entry to `dist/server/`, with the adapter-generated deploy config at `dist/client/wrangler.json`. It has never been uploaded anywhere. `PUBLIC_SITE_URL` overrides the canonical origin at build time; it defaults to `https://therightlifestyle.com`.

## Selected direction (founder-approved 2026-09-17, D-006; platform shape refined at Gate 4, D-014)

- **Host:** Cloudflare. The concrete platform is **Workers with static assets** via `@astrojs/cloudflare` — by 2026 this is Cloudflare's recommended path for new full-stack projects and what the Astro 7 adapter targets; classic Pages remains supported but is in maintenance mode. Same vendor, same free-tier posture, one deployment for static pages and the `/contact/` endpoint. The founder approved "Cloudflare Pages" at Gate 1; this refinement is recorded for review in D-014.
- **Build:** `npm run build`. Output directory `dist/client` with the server entry alongside; the adapter emits the full deploy configuration itself.
- **Environment variables (runtime, set in the hosting platform, never committed):** `PUBLIC_TURNSTILE_SITEKEY`, `TURNSTILE_SECRET`, `RESEND_API_KEY`, `CONTACT_TO_EMAIL` (the approved address), `RESEND_FROM_EMAIL` (`onboarding@resend.dev` until the domain is verified — see the free-tier restrictions in `TRL_ARCHITECTURE.md`). Plus the build-time `PUBLIC_SITE_URL`. Local development uses `.dev.vars` copied from `.dev.vars.example` (dummy Turnstile keys, no delivery).
- **Account, domain, and DNS ownership:** the founder. Account creation, DNS changes, and deployment happen only at the deployment gate with explicit founder authorization.

## Deployment-gate checklist (to be completed before launch)

- [ ] Founder creates the Cloudflare account and connects the repository (Workers Builds).
- [ ] Founder creates a Turnstile widget for the production domain and sets the real sitekey/secret as platform variables.
- [ ] Founder creates the Resend account, confirms the free-tier restrictions recorded in `TRL_ARCHITECTURE.md`, sets the API key, and decides the from-address (`onboarding@resend.dev` first; `hello@therightlifestyle.com` after domain verification — a DNS change requiring explicit authorization).
- [ ] Deploy a preview, submit a real enquiry, and confirm it arrives in `officialtrlservice@gmail.com` with reply-to set correctly (the D-016 manual verification).
- [ ] Verify the unconfigured-state behaviour disappears once variables are set (the form must render enabled).
- [ ] Configure the custom domain and HTTPS on `therightlifestyle.com` (DNS change — founder authorization required).
- [ ] Provision the rate limiter: **uncomment the `ratelimits` block already present in `wrangler.jsonc`**, set the founder-chosen `namespace_id`, and deploy — the enforcing code is committed and picks the binding up automatically. Then run the `TRL_RATE_LIMITING.md` burst-check (20 POSTs → over-limit generic state → normal submission after the window).
- [ ] Add the gate-5 platform rules: `X-Frame-Options`/CSP `frame-ancestors` pinning and `Strict-Transport-Security` on the final HTTPS domain (held out of the code so the preview harness and any temporary host never lock a bad decision into browsers, D-018 note).
- [ ] Confirm the edge applies `public/_headers` to static responses and the Worker applies the contact CSP to `/contact/` (e2e-asserted in CI; re-checked on the real deploy).

## Planned deployment documentation

Before a release is proposed, this file must additionally document:

- health checks and monitoring;
- backup and retention behavior (trivial by design — no application data store);
- rollback and recovery procedure;
- staging/preview verification;
- launch approval checklist.

## GitHub Pages (not a deployment target — disable it)

GitHub Pages is enabled on this repository with the **legacy Jekyll builder**
sourced from `main`, so every push to `main` runs `jekyll build` over the
repository root and publishes to `therightlifestyle.github.io/TRL-SERVICE/`.
That is not a deployment target for this project: the site is built with Astro
and deployed to Cloudflare Workers with static assets (D-014).

Left alone, the Jekyll build **fails on every merge**. Jekyll treats any file
whose first line is `---` as a page with YAML front matter and renders the rest
through Liquid; every `.astro` file opens with exactly that fence wrapped
around JavaScript, so the build dies during "Generating...". The red
`pages build and deployment` runs after each merge are this, not a CI problem —
the CI workflow itself is green.

A minimal `_config.yml` is committed to keep `main` green, excluding `src/`,
`tests/`, `public/`, and the tooling configs so Jekyll only sees the Markdown
documentation. It is containment, not the fix.

- [ ] **Founder action:** in Settings → Pages, either disable Pages or change
      the source to "GitHub Actions". The repository token cannot change Pages
      settings (`403 Resource not accessible by integration`), so this cannot
      be automated from here. Once done, `_config.yml` can be deleted.

## Operational rule

Do not place credentials in this repository or request them in chat. Do not modify DNS, payment accounts, or production infrastructure without explicit founder authorization.
