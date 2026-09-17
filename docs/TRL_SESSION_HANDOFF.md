# TRL — Session Handoff

_Last updated: 2026-09-17 (Gate 5 session, part 2)._

## Latest session (part 2): rate limiting wired, Pages build repaired

PR #7 **merged** and all three CI jobs passed — including the e2e/browser job, so the static-page header assertions flagged as the likely failure point held up. This follow-on session did two things:

1. **The rate limit is now implemented**, not just planned. `handleContactPost` takes an optional `checkRateLimit`; `createRateLimitCheck` wraps the binding fail-open; the contact page passes `cfEnv.CONTACT_RATE_LIMITER`. Over-limit → `429` with the same generic input-preserving state as `503`. **One deliberate deviation from the plan:** the check runs after body parsing rather than literally first, because a pre-parse check cannot also echo the visitor's input back; parsing spends nothing and Turnstile/Resend still come after, so the cost ceiling is unchanged. `wrangler.jsonc` holds the `ratelimits` block **commented out** — `namespace_id` is account-scoped and no account exists, so it stays unfabricated. 233 unit tests pass, `astro check` clean, and the real preview still answers `503` on POST (fail-open proven).
2. **`main`'s red `pages build and deployment` is explained and contained.** GitHub Pages runs the legacy Jekyll builder over the repo root; Jekyll parses `.astro` files' `---` fence as front matter and chokes. Added `_config.yml` excluding the app source. **The real fix is a founder action** — disable Pages or set its source to GitHub Actions in Settings → Pages; the repo token gets `403` on the Pages API. Tracked in `TRL_DEPLOYMENT.md`.

## Current status

Gate 4 — Business Flow is **merged into `main`** (PR #5, merge commit `c5cbbaf`) and `main` was repaired by PR #6 (the post-#5 correction session). This session opened **Gate 5 — Production Hardening** and landed its first three deliverables:

1. **Security headers and the CSP are implemented (D-018).** `src/lib/security.ts` is the single source of truth; `public/_headers` (committed, copied to `dist/client/_headers` at build) applies the common headers plus the **static-pages CSP** (`script-src 'none'`) to every static-asset response, and `src/middleware.ts` applies the **contact CSP** — the static policy plus D-015's one sanctioned exception, `script-src`/`frame-src` from `https://challenges.cloudflare.com` — to Worker-rendered `/contact/` responses. Verified empirically against the real preview: static routes serve the `'none'` policy, `/contact/` GET and POST serve the Turnstile policy.
2. **The rate-limit plan for `POST /contact/`** is fixed in `docs/TRL_RATE_LIMITING.md`: a Workers `ratelimits` binding (`CONTACT_RATE_LIMITER`, `10 / 10s`, keyed on `cf-connecting-ip`) checked first in the POST pipeline, failing to the generic preserved-input state, fail-open when the binding is absent or degraded. It is a **plan, not committed config**, because `namespace_id` is an account-scoped founder value (no Cloudflare account exists) — committing a made-up one would fabricate infrastructure.
3. **The manual accessibility pass is scheduled** in `docs/TRL_MANUAL_ACCESSIBILITY_PASS.md`, and now **includes the real Turnstile widget's rendering and size checks** that D-017 took out of automation: keyboard operability, 200%-zoom/320px fit of the `compact` widget (the 280px-column-vs-300px-minimum question), and the screen-reader announcement.

Nothing is deployed and no provider accounts exist, so delivery with real credentials remains the founder's deployment-gate step.

## Current phase and gate

Phase 1 — Professional service foundation and commercial entry point.

Completed: Gates 0–4. **Gate 5 — Production Hardening is in progress** (three deliverables landed below).

## How the headers work (D-018) — read this before touching them

The deployment boundary is Cloudflare Workers **with static assets**, which splits responses into two paths that never meet:

- **Static responses** (the eight prerendered routes, `/contact/sent/`, fonts, CSS, robots, sitemap) are served by the ASSETS binding **before Worker code runs**, so `_headers` rules apply. That file is `public/_headers`, mirror-pinned to `src/lib/security.ts`.
- **Worker responses** (`/contact/` GET/POST and its error/redirect responses) do **not** receive `_headers` rules (Cloudflare documents this; the adapter's handler confirms it). `src/middleware.ts` therefore sets the contact CSP there.

`X-Frame-Options`/`frame-ancestors` and HSTS are deliberately **not** in either path (the preview harness embeds the site cross-origin; HSTS on a temporary host would lock a bad decision into browsers). They are platform rules for the deployment gate.

## This session's changes

- Added `src/lib/security.ts` (canonical headers + both CSPs + `withSecurityHeaders`), `src/middleware.ts`, `public/_headers`.
- Removed the Turnstile `Response`-header additions from `src/pages/contact.astro` (the middleware now owns them once, for every Worker response).
- Added `tests/unit/security-headers.test.ts` (policy contents, `withSecurityHeaders`, and the `_headers` mirror — reads `dist/client/_headers`, so it builds if absent) and two e2e tests in `tests/e2e/content.spec.ts` (static-page headers + the contact-CSP Turnstile exception).
- Authored `docs/TRL_RATE_LIMITING.md` and `docs/TRL_MANUAL_ACCESSIBILITY_PASS.md`; recorded **D-018** in the decision log; updated security, architecture, deployment, operating-state, phase-1-plan, and README-adjacent docs.
- **Local verification:** `astro check` 0 errors/0 warnings/0 hints (43 files); **220 unit tests passing**; curl against the real preview shows all three header paths correct (static 200, contact 200, contact POST 303). E2E could not run here (no browser CDN reachability — see known issues); it must pass on CI.

## Remaining work

- **Founder action outstanding:** disable GitHub Pages (or switch its source to GitHub Actions); then `_config.yml` can be deleted.
- **Gate 5 remainder:** dependency re-review; Lighthouse/performance + SEO audit; monitoring/observability review (the `wrangler.jsonc` `observability` flag is on); the analytics founder decision. Then **Gates 6–8** (deployment readiness, final verification, founder launch approval).
- **Deployment gate (founder):** create Cloudflare/Turnstile/Resend accounts; production keys; sender-domain verification (DNS change — explicit authorization); real enquiry end-to-end; rate-limit `namespace_id` + burst-check; framing/HSTS platform rules; run `TRL_MANUAL_ACCESSIBILITY_PASS.md`.

## Known issues and risks

- **The e2e suite cannot run in the authoring sandbox** — the Playwright browser CDN and `challenges.cloudflare.com` are both unreachable; CI is the only place the browser suite executes. The two new header e2e tests therefore only run on CI.
- **The real Turnstile widget is not covered by automation** (D-017) — now on the scheduled manual pass, listed above.
- **Rate limit is a plan** until the founder's account exists; its code path (a `limitOutcome` dependency at the head of `handleContactPost`) is designed but **not yet written** — do not wire it before the account exists, and follow the fail-open posture when doing so (`TRL_RATE_LIMITING.md`).
- Email delivery unverified with real credentials (founder step). Turnstile/delivery remain fail-closed per-deployment config.
- Page copy remains founder-unreviewed. No manual keyboard/zoom/screen-reader pass has yet been performed (now scheduled).
- The preview runtime logs `Unable to fetch the Request.cf object!` and a TLS-warning line during local prerender/preview — pre-existing sandbox noise, not caused by this gate.

## Decisions recorded this session

- **D-018** — dual-write response headers/CSP with the single sanctioned Turnstile exception (see `TRL_DECISIONS.md` for the full record).

## Verification

Re-run this session:

- `npm run typecheck` → `astro check`: **0 errors, 0 warnings, 0 hints** (43 files).
- `npm run test:unit` → **220 tests passing** across 6 files (was 203 at Gate 4; +17 security-header tests).
- `npm run build` → clean; `dist/client/_headers` contains the catch-all rule plus the adapter-injected immutable `/_astro/*` rule, and `dist/server/entry.mjs` bundles the middleware.
- Against live `npx astro preview`: `GET /` and `GET /offers/` → 200 with the static CSP (`script-src 'none'`) + `X-Content-Type-Options: nosniff` + `Referrer-Policy` + `Permissions-Policy`; `GET /contact/` and `POST /contact/` (honeypot, 303) → the contact CSP with `script-src https://challenges.cloudflare.com` and `frame-src https://challenges.cloudflare.com`.
- CI is the authority for the browser suite, including the two new header assertions.

## Git

- Branch: `arena/01a0b073-trl-service`.
- Gate 5 progress since the PR #6 merge commit `fc67731`; commit/push/PR this branch when the gate's remaining reviews are done. GitHub authentication is working (`gh auth status`, `git ls-remote origin`).

## NEXT SINGLE ACTION

Push this branch and open the PR so CI runs the new header tests, then complete the remaining Gate 5 reviews (dependency re-review, Lighthouse/performance + SEO, monitoring) and hand the analytics decision to the founder. Keep the rate limiter unwired until the founder's Cloudflare account supplies a `namespace_id`.
