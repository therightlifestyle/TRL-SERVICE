# TRL — Session Handoff

_Last updated: 2026-09-17 (Gate 5 close)._ 

## Latest session: Gate 5 completed — dependencies, performance/SEO, observability, analytics

PR #8 is **merged into `main`** (merge commit `3194c03`) with all three CI jobs green, and the
`pages build and deployment` run on `main` is green as well — the `_config.yml` containment holds.
This session started from that commit and closed the four items Gate 5 had left, recording them in
`docs/TRL_GATE5_REVIEW.md`:

1. **Dependency re-review.** 0 advisories on both the full tree and production-only; 3 production
   dependencies, all exact-pinned; 345 installed packages, every one declaring a licence. The
   non-permissive licences were named and located (MPL-2.0: `lightningcss` via `vite`, `axe-core`;
   LGPL-3.0-or-later and Apache+LGPL+MIT: `@img/sharp*` via `astro > sharp`; Python-2.0, BlueOak,
   CC0 elsewhere) and then verified **absent from both shipped artifacts**: no
   `sharp`/`libvips`/`lightningcss` reference in the 688 KB Worker bundle, and no JavaScript in
   `dist/client` at all. TypeScript 6.0.3 → 7.0.2 and wrangler 4.133.0 → 4.134.0 are recorded as
   reviewed-and-deferred.
2. **Performance audit, measured.** Every page weighed from the real build output and the preview's
   response headers. Two defects found and fixed: the **display font was not preloaded** (Newsreader
   sets every `h1`/`h2`; only Manrope was preloaded) and **fonts had no cache policy** (measured as
   `public, max-age=0, must-revalidate`, revalidating 48 KB per visit). Added
   `tests/unit/build-budget.test.ts` (7 tests) so the numbers are pinned, not just reported.
3. **SEO audit** re-verified end to end: real `404` status, `robots.txt` + a six-URL sitemap that
   excludes the `noindex` pages, per-page canonical/OG/JSON-LD, `/about` → `307` → `/about/`. No
   `og:image`, deliberately — no approved imagery exists.
4. **Observability review.** Verified that `observability` survives into the generated deploy config
   and that the `ratelimits` array is where the founder's binding will land. Documented the exact
   log contract (one PII-free JSON line per request; 7 outcomes, 11 reasons) and the gaps: no push
   alert on `system-error`, no uptime check, plan-bounded retention (Free: 3 days), no client-side
   error signal. The inbox remains the system of record and the de facto alert.
5. **Analytics: founder decision — none in Phase 1 (D-019).** Cloudflare Web Analytics was
   considered and declined because it still injects a third-party script.

## The finding worth carrying forward

**Cloudflare `_headers` rules merge; they do not override.** Pinning the HTML revalidating default
with a `Cache-Control` on `/*` produced a single response field carrying two `max-age` directives
(`public, max-age=0, must-revalidate, public, max-age=31536000, immutable`), which RFC 9111 says a
cache must treat as stale — silently defeating the specific rule it was meant to sit beneath. It
also suppressed the adapter's injected `/_astro/*` rule, because `@astrojs/cloudflare` stands down
whenever an existing rule already sets `Cache-Control` on a match. The configuration was reverted
on that evidence and is now prohibited in writing, in `public/_headers` and in D-020. **Never set
`Cache-Control` on the catch-all rule in this repository.**

## Current status

Gates 0–5 complete. **Gate 6 — Deployment Readiness is the active gate.** Nothing is deployed; no
hosting, Turnstile, Resend, domain, or DNS change exists, and no credentials exist anywhere in the
repository. The site builds to a deployable artifact that has never been uploaded.

| Gate | State |
| --- | --- |
| 0–4 Repository reset, architecture, design system, core website, business flow | Complete (merged) |
| 5 Production hardening | Complete — headers/CSP (D-018), rate limiter, dependency review, performance/SEO, observability, analytics decision (D-019), cache policy (D-020) |
| 6–8 Deployment readiness, final verification, founder launch approval | Not started — the deployment gate |

## This session's changes

- `src/layouts/BaseLayout.astro` — preloads both render-critical font subsets (Newsreader added),
  with `as`/`type`/`crossorigin` and a comment explaining why a partial preload list is the bug.
- `public/_headers` — added the `/fonts/*` immutable cache rule; documented why the catch-all sets
  no `Cache-Control`, why the documents revalidate, and what the font-cache contract is.
- `tests/unit/build-budget.test.ts` — new: zero client JS, no executable `<script>` beyond JSON-LD,
  both preloads on all nine pages, `font-display: swap`, and three byte ceilings.
- `tests/unit/security-headers.test.ts` — the `_headers` rule-set assertion now expects the
  three-rule set, plus a new test pinning the font cache rule.
- `docs/TRL_GATE5_REVIEW.md` — new: the three reviews and the analytics decision with their evidence.
- `docs/TRL_DECISIONS.md` — **D-019** (no analytics in Phase 1), **D-020** (cache policy).
- Operating state, phase-1 plan, architecture, security, deployment, changelog, and this handoff
  updated to the post-Gate-5 state; `TRL_DEPLOYMENT.md` also corrected — the generated deploy config
  is `dist/server/wrangler.json`, not `dist/client/wrangler.json`.

## Verification (re-run this session)

- `npm run typecheck` → `astro check`: **0 errors, 0 warnings, 0 hints** (45 files).
- `npm run test:unit` → **241 tests passing** across 7 files (was 233; +7 build budget, +1 font cache
  rule). `npm audit` and `npm audit --omit=dev` → 0 vulnerabilities.
- `npm run build` → clean; `dist/client/_headers` carries three rules (`/*`, the adapter-injected
  `/_astro/*`, `/fonts/*`) with **one** `Cache-Control` per response.
- Against `astro preview` (workerd): `/`, `/about/`, `/404.html`, `robots.txt`, the sitemap, and the
  favicon answer `public, max-age=0, must-revalidate` and answer `304` to a matching
  `If-None-Match`; `/_astro/*` and `/fonts/*` answer `public, max-age=31536000, immutable`; unknown
  routes answer a real `404`; `/contact/` answers the contact CSP with the Turnstile exception; the
  home page's two font preloads are present in the built HTML.
- **The browser suite still cannot run in the sandbox** (no browser binaries and no CDN reachability),
  so CI remains the only place the e2e suite executes. It must pass on CI before this merge.

## Remaining work

- **Gate 6 — Deployment Readiness** (documentation and readiness only, under the no-deploy constraint).
- **Deployment gate (founder actions, all blocked on accounts):** Cloudflare/Turnstile/Resend accounts;
  production keys; DNS and the custom domain; one real enquiry end-to-end; the rate-limit
  `namespace_id` and its burst check; framing/HSTS platform rules; disable GitHub Pages (Settings →
  Pages) after which `_config.yml` can be deleted.
- **Manual accessibility pass** — needs a human with a browser and a screen reader
  (`TRL_MANUAL_ACCESSIBILITY_PASS.md`). Not performed, and not counted as performed.
- **Gate 7** — Lighthouse/real-device run against the deployed origin (impossible here: no browser,
  no public origin).

## Known issues and risks

- Rate limiting fails open until the founder provisions the namespace. That is the documented
  posture, not an accident (`TRL_RATE_LIMITING.md`).
- Email delivery is unverified with real credentials; Turnstile and delivery are fail-closed per
  deployment config, which is why an unconfigured deployment refuses rather than pretends.
- Page copy remains founder-unreviewed; legal pages are labelled `noindex` drafts.
- The preview and build log `Unable to fetch the Request.cf object!` plus a TLS warning — sandbox
  network noise, present since before Gate 5.
- `og:image` is absent; if wanted, it needs a founder-approved asset.

## Git

- Branch: `arena/01a0b0b5-trl-service`, based on `main` at `3194c03` (the PR #8 merge).
- Commit, push to that branch, and open the PR; CI must be green before merge.

## NEXT SINGLE ACTION

Commit this Gate 5 close, push `arena/01a0b0b5-trl-service`, open the PR, and confirm all three CI
jobs pass (the e2e job is the only place the browser suite runs). Then begin **Gate 6 — Deployment
Readiness**: turn the deployment checklist into procedure, with no account, DNS change, or
deployment until the founder authorizes it.
