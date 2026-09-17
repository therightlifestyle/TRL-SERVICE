# TRL — Session Handoff

_Last updated: 2026-09-17 (Gate 6 close — repository-side deployment
procedures, deploy-config artifact pin, and the explicit repository /
founder split.)_

## Latest session: Gate 6 completed on the repository side — deployment-readiness procedures

Gates 0–5 are complete and merged into `main`. **Gate 6 — Deployment
Readiness is complete on the repository side** and **Gate 7 — Final
Verification is the active gate**. The deployment-gate checklist is now
procedure in `docs/TRL_DEPLOYMENT.md`, with an explicit split at the top
between work the repository can close (this session's work) and work only
the founder can do (every remaining step).

### What this session recorded as done

1. **Repository-side procedures in `docs/TRL_DEPLOYMENT.md`** — environment-
   variable inventory, production deployment procedure, preview verification
   procedure, smoke-test procedure, rollback procedure, recovery procedure,
   backup / repository-recovery guidance, domain/DNS readiness checklist,
   Cloudflare deployment checklist, Turnstile production-key checklist,
   Resend production-email checklist, rate-limit namespace configuration
   checklist, final platform security checklist (framing protection + HSTS),
   and a numbered GitHub Pages / Jekyll transition procedure. The split
   between repository-completable and founder-only work is recorded at the
   top of that file.
2. **Deploy-config artifact pin** — new `tests/unit/wrangler-config.test.ts`
   (4 tests): `wrangler.jsonc` parses to the founder-supplied runtime config
   and carries no `ratelimits` JSON key (the binding lives in a comment);
   the rate-limit comment carries the documented block with a
   `<founder-supplied ...>` placeholder and no integer-shaped
   `namespace_id` may be committed (catches infrastructure fabrication); no
   production credentials (Turnstile sitekey/secret, Resend API key,
   contact email) appear anywhere in `wrangler.jsonc`; the generated
   `dist/server/wrangler.json` carries `observability: { enabled: true }`
   through.
3. **Decision recorded — D-021** in `docs/TRL_DECISIONS.md`: the explicit
   repository / founder split and the rationale that Gate 6 does not invent
   any of the things the founder owns.
4. **Operating state, phase-1 plan, decisions, deployment, and changelog
   updated** to the post-Gate-6 state. The "Open questions requiring founder
   approval" list in `TRL_OPERATING_STATE.md` now points every deployment-
   gate item at the specific procedure in `TRL_DEPLOYMENT.md`.

### What this session did not do (and why)

- No accounts created. No DNS changes. No deployment. No secrets in the
  repository, no fake credentials, no fabricated infrastructure.
- No edits to `wrangler.jsonc`'s `namespace_id` value (it is still
  `<founder-supplied positive integer, as a string>` in a comment).
- No edits to `_config.yml`; the GitHub Pages transition is founder-owned.
- No edits to `public/_headers` for framing protection or HSTS — those are
  platform rules on the final HTTPS domain, deliberately not in the
  application code (D-018).
- No edits to the rate-limit binding's `limit` / `period` values — those
  are set (`10 / 10s`) and pinned by `TRL_RATE_LIMITING.md` and the
  existing unit tests.

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

Gates 0–6 complete. **Gate 7 — Final Verification is the active gate.** Nothing is deployed; no
hosting, Turnstile, Resend, domain, or DNS change exists, and no credentials exist anywhere in the
repository. The site builds to a deployable artifact that has never been uploaded.

| Gate | State |
| --- | --- |
| 0–4 Repository reset, architecture, design system, core website, business flow | Complete (merged) |
| 5 Production hardening | Complete — headers/CSP (D-018), rate limiter, dependency review, performance/SEO, observability, analytics decision (D-019), cache policy (D-020) |
| 6 Deployment readiness | Complete (repository side) — procedures in `TRL_DEPLOYMENT.md`, deploy-config artifact pin in `tests/unit/wrangler-config.test.ts`, decision D-021 |
| 7 Final verification | Not started — needs a deployed preview and a human with a browser |
| 8 Founder launch approval | Not started — founder only |

## This session's changes

- `docs/TRL_DEPLOYMENT.md` — expanded from a deployment-gate checklist into
  full procedure: build → configure → preview → verify → deploy → smoke
  test, plus rollback, recovery, backup/repository-recovery, domain/DNS
  readiness, Cloudflare / Turnstile / Resend / rate-limit / final
  platform-security checklists, and a numbered GitHub Pages transition
  procedure. Repository-completable and founder-only work are now two
  explicit lists at the top.
- `tests/unit/wrangler-config.test.ts` — new: 4 tests pinning the
  deploy-config artifacts (the `ratelimits` comment, no fabricated
  `namespace_id`, no production credentials, `observability` in the
  generated deploy config).
- `docs/TRL_OPERATING_STATE.md` — advanced from Gate 6 active to Gate 6
  complete (repository side) and Gate 7 active. Every open question now
  points at the specific procedure in `TRL_DEPLOYMENT.md`.
- `docs/TRL_PHASE_1_PLAN.md` — Gate 6 is now recorded as complete on the
  repository side with a procedure-by-procedure summary; Gate 7 is active.
- `docs/TRL_DECISIONS.md` — **D-021** (the repository / founder split at
  Gate 6).
- `docs/TRL_CHANGELOG.md` — new entry recording the Gate 6 close.

## Verification (re-run this session)

- `npm run typecheck` → `astro check`: **0 errors, 0 warnings, 0 hints** (46 files; +1 for the new test).
- `npm run test:unit` → **245 tests passing** across 8 files (was 241; +4 from the new wrangler-config suite). The existing security-headers, build-budget, contact-endpoint, contact-validation, design-tokens, content-invariants, and rendered-pages suites all pass unchanged. `npm audit` and `npm audit --omit=dev` → 0 vulnerabilities.
- `npm run build` clean; `dist/client/_headers` continues to carry three rules with **one** `Cache-Control` per response; the generated `dist/server/wrangler.json` continues to read `"ratelimits":[]` and to carry `observability` through, exactly as `TRL_GATE5_REVIEW.md` recorded.
- **The browser suite still cannot run in the sandbox** (no browser binaries and no CDN reachability), so CI remains the only place the e2e suite executes. It must pass on CI before any merge.

## Remaining work

- **Gate 7 — Final Verification** — needs the founder's deployed preview (or production) and a human with a browser. The repository is ready for it: the manual accessibility pass (`TRL_MANUAL_ACCESSIBILITY_PASS.md`) and the Lighthouse / real-device run (Gate 7 / `TRL_GATE5_REVIEW.md`) are scheduled there. One real enquiry end-to-end (D-016) and the rate-limit burst check on the deployed origin are also Gate 7.
- **Deployment gate (founder actions, all blocked on accounts):** Cloudflare / Turnstile / Resend accounts; production keys; DNS and the custom domain; one real enquiry end-to-end; the rate-limit `namespace_id` and its burst check; framing/HSTS platform rules; disable GitHub Pages (Settings → Pages) after which `_config.yml` can be deleted. The full checklist is at the end of `TRL_DEPLOYMENT.md`.
- **Manual accessibility pass** — needs a human with a browser and a screen reader (`TRL_MANUAL_ACCESSIBILITY_PASS.md`). Not performed, and not counted as performed.
- **Gate 8** — founder alone decides whether the system goes public.

## Known issues and risks

- Rate limiting fails open until the founder provisions the namespace. That is the documented
  posture, not an accident (`TRL_RATE_LIMITING.md`).
- Email delivery is unverified with real credentials; Turnstile and delivery are fail-closed per
  deployment config, which is why an unconfigured deployment refuses rather than pretends.
- Page copy remains founder-unreviewed; legal pages are labelled `noindex` drafts.
- The preview and build log `Unable to fetch the Request.cf object!` plus a TLS warning — sandbox
  network noise, present since before Gate 5.
- `og:image` is absent; if wanted, it needs a founder-approved asset.
- The deployment documentation in `TRL_DEPLOYMENT.md` is comprehensive but **must be read as a
  procedure, not a self-executing checklist**: every founder-only checkbox requires a real account,
  a real DNS change, or a real secret that the repository does not own.

## Git

- Branch: `arena/01a0b0cb-trl-service`, based on `main` at `aaef3bf` (the PR #9 merge).
- Commit, push to that branch, and open the PR; CI must be green before merge.

## NEXT SINGLE ACTION

Commit this Gate 6 close, push `arena/01a0b0cb-trl-service`, open the PR, and confirm all three CI
jobs pass (the e2e job is the only place the browser suite runs). The repository is now ready for
the founder's deployment-gate actions — every step is in `TRL_DEPLOYMENT.md`, and the
deploy-config artifact is pinned. The next agent session, when one begins, should run **Gate 7 —
Final Verification** against the founder's deployed preview: Lighthouse / real-device performance,
the manual accessibility pass, one real enquiry end-to-end (D-016), and the rate-limit burst
check.
