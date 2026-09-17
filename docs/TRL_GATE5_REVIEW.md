# TRL — Gate 5 Review: dependencies, performance/SEO, observability

_Last updated: 2026-09-17 (Gate 5 close — the three reviews and the analytics decision)._

Gate 5's plan listed four items beyond the delivered security headers, rate limiter, and
scheduled accessibility pass: a dependency re-review, a performance/SEO audit, a
monitoring/observability review, and the founder's analytics decision. This document records
all four, with the evidence each conclusion rests on.

## Method, and what this audit is not

**Lighthouse did not run.** The authoring sandbox has no browser (Playwright's browser CDN is
unreachable, so no Chromium exists) and the site is not deployed, so there is no origin to score.
The performance and SEO audits below are therefore *deterministic* — byte counts read from the
real build output, and response headers and status codes read from `astro preview`, which serves
the production build in the workerd runtime. The synthetic-scoring run belongs to Gate 7, against
the deployed domain on a real device profile.

What is measured here does not decay into a one-off: the numbers that matter are pinned by
`tests/unit/build-budget.test.ts`, so they fail CI if they regress.

## 1. Dependency re-review

**Advisories: none.** `npm audit` and `npm audit --omit=dev --audit-level=low` both report
0 vulnerabilities. CI runs the production audit at `--audit-level=high` (failing) and a
full-tree audit at `--audit-level=moderate` (advisory) on every pull request.

**Surface: three production dependencies, all exact-pinned.**

| | Packages |
| --- | --- |
| Production | `astro` 7.3.3, `@astrojs/cloudflare` 14.3.2, `@astrojs/sitemap` 3.7.4 |
| Development | `@astrojs/check`, `@axe-core/playwright`, `@playwright/test`, `@types/jsdom`, `axe-core`, `jsdom`, `typescript` 6.0.3, `vitest`, `wrangler` 4.133.0 |

`npm ci` installs exactly the committed lockfile and fails if `package.json` and the lock have
drifted, so the tree CI builds is the tree reviewed here.

**Licences: every package declares one.** Of 345 installed package manifests, 0 are undeclared.
The distribution is MIT 282, ISC 15, Apache-2.0 14, BSD-2-Clause 9, BSD-3-Clause 5, MPL-2.0 5,
MIT-or-Apache-2.0 3, BlueOak-1.0.0 3, MIT-0 2, LGPL-3.0-or-later 2, CC0-1.0 2, and one each of
`Apache-2.0 AND LGPL-3.0-or-later AND MIT`, Python-2.0, and 0BSD. The non-permissive names are
worth naming explicitly, with where they sit:

- **MPL-2.0** — `lightningcss` (reached via `@astrojs/cloudflare > vite`), `axe-core`, and
  `@axe-core/playwright`. File-level copyleft: it obliges changes to *that library's* files, not
  to the output built with it. All three are build/test-time; none is modified.
- **LGPL-3.0-or-later** — `@img/sharp-libvips-*` and `@img/sharp-wasm32`, reached via
  `astro > sharp`, Astro's image pipeline. Unmodified prebuilt binaries, loaded dynamically at
  build time.
- **Python-2.0** (`argparse`), **BlueOak-1.0.0** (`lru-cache`, `sax`, `common-ancestor-path`),
  **CC0-1.0** (`mdn-data`, `@speed-highlight/core`) — permissive or public-domain-equivalent.

**Verified rather than assumed:** the shipped Worker bundle (`dist/server`, 688,038 bytes)
contains no `sharp`, `libvips`, or `lightningcss` reference at all, and `dist/client` contains no
JavaScript file. No copyleft code reaches a visitor's browser, and none is in the runtime path.

**Version drift reviewed and deliberately deferred.** `npm outdated` reports only TypeScript
6.0.3 → 7.0.2 (a major) and wrangler 4.133.0 → 4.134.0 (a minor). Neither is hardening work: a
compiler major mid-gate is risk without benefit, and nothing in this gate needs the wrangler
bump. Astro, the Cloudflare adapter, the sitemap integration, Playwright, vitest, and axe are all
current. This is a recorded decision, not an oversight.

**One review note.** Three dev dependencies (`@types/jsdom`, `jsdom`, `axe-core`) carry caret
ranges where everything else is exact-pinned. Because CI installs with `npm ci`, the ranges never
take effect there; they only matter for an interactive `npm install`. Left as-is so the lockfile
is not churned for a cosmetic change.

## 2. Performance audit (measured)

Source: the real build output in `dist/client`, plus response headers from the running preview.
Uncompressed HTML plus every stylesheet the page references (Astro inlines small scoped component
styles and links the rest — both are bytes the visitor waits on). Gzip is of the HTML alone.

| Page | HTML | HTML gzip | inline CSS | linked CSS | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| `/` | 35,378 | 7,268 | 7,213 | 10,796 | 53,387 |
| `/offers/` | 24,660 | 5,420 | 5,670 | 10,796 | 41,126 |
| `/ai-solutions/` | 18,809 | 4,648 | 5,231 | 10,796 | 34,836 |
| `/services/` | 17,563 | 4,509 | 4,119 | 10,796 | 32,478 |
| `/about/` | 13,371 | 3,573 | 3,136 | 10,796 | 27,303 |
| `/contact/sent/` | 10,921 | 2,862 | 3,297 | 10,796 | 25,014 |
| `/privacy/` | 11,342 | 3,358 | 1,598 | 10,796 | 23,736 |
| `/terms/` | 10,319 | 2,995 | 1,598 | 10,796 | 22,713 |
| `404.html` | 9,281 | 2,445 | 2,266 | 10,796 | 22,343 |

Plus 48,460 bytes of fonts for both self-hosted subsets (Newsreader 23,624; Manrope 24,836), each
with `font-display: swap` and a latin `unicode-range` subset. **Zero bytes of JavaScript** are
shipped to the browser, on every route.

The heaviest page — home, the one that has to make the first impression — is 53.4 KB
uncompressed, 17.5 KB compressed, under 102 KB including both fonts. That is the whole site.

### Two defects found, both fixed

**A. Only one of the two render-critical fonts was preloaded.** `BaseLayout.astro` preloaded
Manrope but not Newsreader — and Newsreader sets every `h1`/`h2`, including the hero headline, so
the largest text on the page was waiting on a font the browser could only discover after parsing
the stylesheet and computing styles. On a cold cache that is an extra round trip on the critical
path, visible as a swap from the Georgia fallback. Fixed: both faces are preloaded, with
`as="font"`, `type="font/woff2"`, and `crossorigin` (without the matching anonymous mode the
browser fetches the file twice).

**B. Fonts had no cache policy.** Measured against the preview: `/_astro/*` correctly served
`Cache-Control: public, max-age=31536000, immutable`, but `/fonts/*`, the favicon, `robots.txt`,
and the sitemap all fell through to the platform default `public, max-age=0, must-revalidate` — so
48 KB of render-critical fonts was re-fetched or revalidated on every visit, for the files that
least often change. Fixed with a `/fonts/*` rule in `public/_headers`, pinned by a unit test.

### One candidate fix tried, measured, and reverted

Pinning the HTML default explicitly (a `Cache-Control` on `/*`) was attempted and **reverted on
evidence**. Two reasons, both measured:

1. **Rules merge; they do not override.** With `Cache-Control` on both `/*` and `/_astro/*`, the
   preview returned a single field carrying two directives:
   `public, max-age=0, must-revalidate, public, max-age=31536000, immutable`. RFC 9111 says a
   cache that sees multiple `max-age` directives must treat the response as stale — so the
   "explicit" configuration silently defeated the specific rule it was meant to sit beneath.
2. **It suppressed the adapter's own rule.** `@astrojs/cloudflare` injects its immutable
   `/_astro/*` rule only while no existing rule already sets `Cache-Control` on a match, and stands
   down silently (debug-level log) otherwise. The catch-all rule therefore removed the hashed-asset
   cache entirely.

The rule now stands: **the catch-all sets no `Cache-Control`**, only the specific patterns do. The
reasoning is written into `public/_headers` so the next person does not repeat the experiment.

### Why the HTML default is correct, not merely default

Documents are not content-hashed while the stylesheets they reference are. A document served from
a stale cache would point at a stylesheet that no longer exists and render unstyled. Answering
each navigation with a 304 against the ETag (verified: `If-None-Match` → 304) keeps documents and
assets in step, and costs one conditional request on a site whose pages are 9–35 KB.

### Durable guard

`tests/unit/build-budget.test.ts` — 7 tests pinning: zero `.js`/`.mjs`/`.cjs` in `dist/client`;
no executable `<script>` on any page other than the JSON-LD data block; both font preloads present
and correctly typed on all nine pages; `font-display: swap` on every `@font-face`; and byte
ceilings with real headroom above the measurements (80 KB HTML + CSS, 12 KB compressed HTML,
64 KB fonts) so they fail on a framework or a font sneaking into the client build, not on honest
content edits.

## 3. SEO audit

Checked against the live preview and the build output. Everything below was re-verified this
session rather than carried forward from Gate 3:

- **A real 404.** An unknown route returns HTTP `404` with the 404 document — not a `200` soft
  not-found — and that document carries `noindex, follow`. The browser suite asserts the same.
- **`robots.txt`** serves `Allow: /` plus the sitemap URL; **`sitemap-0.xml`** contains exactly the
  six indexable URLs (`/`, `/about/`, `/ai-solutions/`, `/contact/`, `/offers/`, `/services/`).
  The `noindex` pages are excluded by the integration's filter, so the sitemap and the meta
  directive cannot contradict each other.
- **Per page:** title, meta description, canonical URL, Open Graph type/site/title/description/url,
  `twitter:card`, `<html lang="en">`, viewport, `theme-color`, and a JSON-LD `Organization` block
  limited to approved facts. All pinned by tests, including the content-invariant suite that fails
  on any unapproved price or contact detail.
- **Canonicalisation:** `/about` answers `307` → `/about/`, matching `trailingSlash: 'always'` and
  the canonical URLs the pages emit.
- **Deliberate gaps.** No `og:image` and no per-page social card: no approved imagery exists
  (D-009 is a text wordmark plus abstract SVG graphics), and generating one would invent a brand
  asset the founder has not approved. Recorded as an optional founder item for launch rather than
  a defect. Indexable pages carry no `robots` meta, which is the intended default.

## 4. Monitoring and observability review

**What is wired, verified end to end.** `wrangler.jsonc` sets `observability: { enabled: true }`,
and the adapter's generated deploy config — `dist/server/wrangler.json` — was checked directly:
it inherits from the repository root and carries `"observability":{"enabled":true}` through to
deploy. (The same check confirms the deployment-gate instruction to uncomment the `ratelimits`
block works: the generated config currently reads `"ratelimits":[]` and takes whatever the root
config declares.) Note for readers of `TRL_DEPLOYMENT.md`: the generated config lives at
`dist/server/wrangler.json`, not `dist/client/` — `.assetsignore` exists precisely to keep it out
of the served assets.

**The log contract.** Exactly one structured JSON line per contact request, emitted by
`createContactDeps` via `console.log`:

```json
{"event":"contact","requestId":"<uuid>","outcome":"accepted"}
```

Seven outcomes (`accepted`, `rejected-rate-limit`, `rejected-honeypot`, `rejected-turnstile`,
`invalid`, `bad-request`, `system-error`) and eleven reasons across them
(`content-type`, `unparseable`, `missing-token`, `verification-rejected`, `verification-network`,
`unconfigured-turnstile`, `unconfigured-delivery`, `delivery-failed`, `delivery-network`,
`rate-limiter-error`). No submitted value, address, token, or credential — asserted by the
log-hygiene test, which fails if the visitor's own input appears in any line. A degraded rate
limiter emits its own `system-error`/`rate-limiter-error` line under a fixed
`requestId: "rate-limiter"`.

**What that gives the founder.** Enough to answer "did this enquiry arrive, and if not, why?" for
any request in the retention window: the outcome names the exact stage that refused it, and the
`system-error` reasons separate "we were misconfigured" from "the provider failed". Static asset
requests and 404s are visible as platform request metrics, not as application logs.

**What is missing, stated plainly — and where each gap is closed.** The honest summary is that
this is *diagnostic* observability, not *alerting* observability, and in Phase 1 that is a
deliberate trade rather than an oversight: the enquiry email landing in the founder's inbox
(D-007) is the de facto alert, and the monitoring question that actually matters — "did a real
customer's message reach me?" — is answered by the inbox before any dashboard.

| Gap | Effect | Where it is handled |
| --- | --- | --- |
| No push alert on `system-error` | A delivery outage is noticed when a customer does not hear back, not when it starts | Deployment gate: founder watches Workers Logs after launch; the real-enquiry checklist item is the first end-to-end proof |
| Log retention is plan-bounded | On Workers Free, log events are retained 3 days (200,000 events/day); Workers Paid raises it to 7 days and allows Logpush | Cloudflare's published limits, verified: Free 3 days / Paid 7 days, Logpush Paid-only. Ample for Phase 1 volume; revisit if volume grows |
| No uptime/availability check | A site outage is noticed by the founder or a visitor | Deployment gate: Cloudflare's own dashboard, plus the founder's normal channels |
| No client-side error signal | A visitor whose Turnstile widget never renders produces no server log (no POST happens) | The manual accessibility pass covers the widget's real rendering; e2e covers the form's server-side refusal paths |
| No analytics at all | No traffic, conversion, or funnel data | Founder decision, below (D-019) |

**Paid-plan triggers, recorded so the decision is not accidental:** 3-day-to-7-day retention and
Logpush require Workers Paid ($5/month); the free plan's 100,000 requests/day and 10 ms CPU per
invocation are orders of magnitude above what this site will see at launch. Nothing in Phase 1
needs them.

## 5. Analytics decision (D-019)

Put to the founder at Gate 5 close, and answered: **Phase 1 ships with no analytics.** The site
keeps the posture it was built with — zero client JavaScript, `script-src 'none'` on every static
page, no cookies, and a privacy draft whose "no analytics or tracking of any kind" statement stays
literally true. Nothing needs loosening in the CSP, adding to the privacy disclosure, or gating
behind consent. Success is measured from signals that already exist and are already private: the
inbox, WhatsApp, and Cloudflare's free per-request metrics in the dashboard. Revisit at Gate 7 or
when Phase 2 begins, when the question becomes what to measure rather than whether to.

## 6. Still open, and deliberately not done here

- **Lighthouse / real-device performance run** — Gate 7, against the deployed domain (needs a
  browser and a public origin).
- **Manual keyboard/zoom/screen-reader pass** — human, scheduled in
  `TRL_MANUAL_ACCESSIBILITY_PASS.md`.
- **Deployment-gate founder actions** — real-credential delivery, production Turnstile keys, the
  rate-limit `namespace_id` plus its burst check, framing/HSTS platform rules, and disabling
  GitHub Pages. Tracked in `TRL_DEPLOYMENT.md`.
- **Optional, not required:** a founder-approved social card image for `og:image`.
