# TRL — Session Handoff

_Last updated: 2026-09-19 (Gate 6 — Deployment Readiness, repository side complete)._

## Latest session: Gate 6 — Deployment Readiness (repository side)

The session started from `main` at `aaef3bf` (the PR #9 merge, Gate 5 close) and did
**not** restart, re-architect, or extend the product. It removed the last assumptions
between the finished system and a real deployment, and verified the deploy path against
the runtime that will actually serve it.

1. **The unowned domain is out of the build (D-021).** `astro.config.mjs` defaulted to
   `https://therightlifestyle.com`, so every build asserted a canonical origin, an OG URL,
   an `Organization.url`, a sitemap, and a `robots.txt` sitemap pointer for a domain the
   founder does not own. `PUBLIC_SITE_URL` is now **required, with no default**: a build
   without it exits 1 before writing output, with a message naming the fix. It is read from
   `process.env` only — Astro evaluates the config before Vite loads `.env`, which was
   verified rather than assumed.
2. **Search-engine visibility is off by default (D-022).** `PUBLIC_ALLOW_INDEXING` turns
   indexing on only for the exact string `true`; everything else, including unset, means
   off. While off, every page carries `noindex, follow` and `robots.txt` does not advertise
   the sitemap. Crawling stays *allowed*, deliberately: `robots.txt` governs crawling, and
   `Disallow: /` would prevent crawlers from reading the `noindex` directive that does the
   work.
3. **`robots.txt` is generated, not committed.** The committed file carried the unowned
   domain; `src/pages/robots.txt.ts` now derives the policy from the origin and the flag, so
   the crawl policy, the page directives, and the sitemap cannot contradict each other.
4. **No account-scoped identifier is committed (D-023).** No `account_id`, and the commented
   `ratelimits` template stays unfilled. Both are asserted, not just documented.
5. **The deploy path is verified, not inferred.** `wrangler deploy --dry-run` (no
   credentials) resolves the adapter's generated config and reports the 31-asset, 662 KiB
   upload with its bindings; it now runs in CI on every pull request.
6. **The artifact was exercised on the real runtime.** `wrangler dev` (`workerd`) confirmed
   the header rules, per-route CSPs, cache policy, a real 404 with the custom page, the
   disabled unconfigured form state, the `403` for a foreign origin, the `503` delivery
   boundary with input preserved, and **404 for `/wrangler.json`, `/.dev.vars`, `/_headers`**.
7. **Documentation became operational.** `TRL_DEPLOYMENT.md` is a runbook (variable table,
   two-stage origin plan, verification commands, rollback/recovery, monitoring, retention,
   and a verification log); `TRL_GATE6_FOUNDER_CHECKLIST.md` is the ordered action list;
   `npm run preflight` validates the whole build configuration offline.

## The finding worth carrying forward

**`process.env` in `astro.config.mjs` is not fed by `.env`.** Vite loads `.env` files after
the config module is evaluated, so a build variable that the config must see — here,
`PUBLIC_SITE_URL` — has to be a real environment variable. This was quietly false in the
repository before Gate 6: `.env.example` implied a copied `.env` would set the build origin,
and it never did. Values read through `import.meta.env` (`PUBLIC_ALLOW_INDEXING`) *are* fed
by `.env`, with real environment variables taking precedence. Both behaviours were verified
by building with each source.

## The second finding worth carrying forward

**The intuitive noindex implementation is the wrong one.** `Disallow: /` plus a `noindex`
meta tag does not reliably keep a site out of search results: the disallow stops crawlers
from ever fetching the page, so they never read the `noindex` directive, and a URL
discovered through an external link can still be listed as *"indexed, though blocked by
robots.txt"*. `Noindex:` inside `robots.txt` is not a directive at all (Google removed it on
2019-09-01). Allowing the crawl and serving `noindex` is what actually works, and that is
what D-022 implements.

## Current status

Gates 0–5 complete. **Gate 6 — Deployment Readiness: repository side complete; the remaining
steps are founder actions.** Nothing is deployed; no hosting, Turnstile, Resend, domain, or
DNS change exists, and no credentials exist anywhere in the repository.

| Gate | State |
| --- | --- |
| 0–4 Repository reset, architecture, design system, core website, business flow | Complete (merged) |
| 5 Production hardening | Complete — headers/CSP (D-018), rate limiter, dependency review, performance/SEO, observability, analytics decision (D-019), cache policy (D-020) |
| 6 Deployment readiness | **Repository side complete** — required origin (D-021), indexing policy (D-022), no committed account identifiers (D-023), runbook + founder checklist, preflight, CI deploy-artifact check. Closes when the founder's steps are ticked |
| 7 Final verification | Not started — needs a deployed origin, a real device, and a human |
| 8 Founder launch approval | Not started — the founder's call |

## This session's changes

- `astro.config.mjs` — required origin with a `trl-deployment-guard` `astro:build:start`
  hook validating presence, scheme, and origin-only shape, plus the indexing flag value.
- `src/lib/indexing.ts` (new) — the visibility policy as pure functions.
- `src/pages/robots.txt.ts` (new) — generated `robots.txt`; `public/robots.txt` deleted.
- `src/layouts/BaseLayout.astro` — canonical/OG/JSON-LD derive from `Astro.site`; the
  `robots` meta comes from the policy, preserving the permanent `noindex` on drafts.
- `src/lib/site.ts` — `domain` and `defaultOrigin` removed.
- `scripts/preflight.mjs` (new) + `npm run preflight`.
- `wrangler.jsonc` — corrected the generated-config path (again — the Gate 5 fix had drifted
  back) and documented the redirect, the absent `account_id`, and the auto-provisioned
  bindings.
- `.github/workflows/ci.yml` — `PUBLIC_SITE_URL=https://ci.invalid`, `PUBLIC_ALLOW_INDEXING=false`,
  a preflight step, and a `wrangler deploy --dry-run` step.
- `playwright.config.ts` — supplies a local origin to the e2e build.
- `.env.example` — corrected: it no longer implies `.env` sets the build origin.
- Tests: `helpers/build-artifacts.ts`, `robots-policy.test.ts`, `deployment-config.test.ts`
  (new); `rendered-pages`, `security-headers`, `content-invariants`, `helpers/build-once`
  updated to derive the origin from the artifact instead of asserting a domain.
- Docs: `TRL_DEPLOYMENT.md` rewritten, `TRL_GATE6_FOUNDER_CHECKLIST.md` new, `TRL_DECISIONS.md`
  (D-021/D-022/D-023), operating state, phase-1 plan, architecture, master context, manual
  accessibility pass, changelog, README.

## Verification (re-run this session)

- `npm run typecheck` → `astro check`: **0 errors, 0 warnings, 0 hints** (47 files).
- `npm run test:unit` → **275 tests passing** across 9 files (was 241 across 7).
- The CI verify job reproduced end to end locally: preflight → typecheck → build → unit →
  `wrangler deploy --dry-run` (exit 0).
- Build guard: a build without `PUBLIC_SITE_URL` exits **1** and produces no `dist/`.
- Both indexing states built and compared: default off (every page `noindex`, `Allow: /`
  with no sitemap line) and on (`noindex` only on the drafts, confirmation, and 404 pages;
  sitemap advertised).
- Real runtime (`wrangler dev`): header rules parsed; per-route CSPs; single-valued
  `Cache-Control` per asset class; 404 status with the custom page; configuration files 404.
- **The browser suite still cannot run in the sandbox** (no browser binaries), so CI remains
  the only place the e2e suite executes. It must pass on CI before this merge.

## Remaining work

- **Gate 6 closure — founder actions, in order:** `docs/TRL_GATE6_FOUNDER_CHECKLIST.md`
  Steps 1–7: Cloudflare account and Worker, Turnstile, Resend, one real enquiry delivered to
  the inbox (closes the item outstanding since Gate 4), the rate-limit `namespace_id` and its
  burst check, and disabling GitHub Pages so `_config.yml` can be deleted.
- **Stage B (needs a domain):** attach the custom domain, add HSTS and framing rules (which
  a `workers.dev` host cannot have at all — no DNS zone), set `PUBLIC_SITE_URL` to the real
  origin and `PUBLIC_ALLOW_INDEXING=true`, then re-run the verification list.
- **Manual accessibility pass** — needs a human with a browser and a screen reader
  (`TRL_MANUAL_ACCESSIBILITY_PASS.md`). Not performed, and not counted as performed.
- **Gate 7** — real-device performance and the final checks against a deployed origin.

## Known issues and risks

- Rate limiting fails open until the founder provisions the namespace — the documented
  posture (`TRL_RATE_LIMITING.md`), and `npm run preflight` warns about it.
- Email delivery is unverified with real credentials; the form refuses honestly when
  unconfigured rather than pretending.
- Nothing is monitored: no uptime check and no alerting (D-019). The inbox is the de facto
  alert, and that trade is written down in `TRL_DEPLOYMENT.md` §9.
- Page copy remains founder-unreviewed; legal pages are labelled `noindex` drafts.
- `og:image` is absent; if wanted, it needs a founder-approved asset.
- The preview and build log `Unable to fetch the Request.cf object!` plus a TLS warning —
  sandbox network noise, present since before Gate 5.

## Git

- Branch: `arena/01a0b625-trl-service`, based on `main` at `aaef3bf` (the PR #9 merge).
- Commit, push to that branch, and open the PR; CI must be green before merge.

## NEXT SINGLE ACTION

Open the PR for this Gate 6 work and confirm all three CI jobs pass. Then hand
`docs/TRL_GATE6_FOUNDER_CHECKLIST.md` to the founder and walk Step 1 — the Cloudflare account
and the first `workers.dev` deploy — because from that point the repository stops being able
to make progress on its own: every remaining Gate 6 item needs an account, and every Gate 7
item needs a deployed origin.
