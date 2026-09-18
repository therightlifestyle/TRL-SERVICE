# TRL — Phase 1 Execution Plan

## Objective

Create a truthful, professional, launch-ready foundation for TRL's AI automation and business-systems service offering.

## Sequence by gate

### Gate 0 — Repository Reset — complete (2026-09-17)

- Establish project memory and source-of-truth hierarchy.
- Record baseline, constraints, decisions, and handoff process.
- Confirm no existing implementation or tests are being discarded.

### Gate 1 — Architecture — complete (2026-09-17)

- Confirm user journeys and release scope. — Recorded in `TRL_USER_JOURNEYS.md`; scope founder-approved (D-008).
- Propose and record the smallest suitable technical stack. — Astro with TypeScript, founder-approved (D-005).
- Define page/content boundaries, contact flow, data handling, environments, and test strategy. — Recorded in `TRL_ARCHITECTURE.md`.
- Obtain founder input only for strategic/provider/ownership decisions. — Stack, hosting, contact delivery, and scope approved in session (D-005–D-008).

### Gate 2 — Design System — complete (2026-09-17)

- Defined typography, colors, spacing, layout, components, focus states, responsive rules, and reduced-motion behavior in `TRL_DESIGN_SYSTEM.md`.
- Validated the system against the premium, minimal, precise, trustworthy TRL positioning.
- Founder confirmed the direction: quiet authority, light-first, text-only wordmark, abstract systems graphics (D-009).

### Gate 3 — Core Website — complete (2026-09-17)

- Scaffolded Astro 7.3.3 with TypeScript, a committed lockfile, and no CSS or animation framework.
- Implemented the design token layer and the accessible layout and component primitives from `TRL_DESIGN_SYSTEM.md`.
- Built Home, Services, AI Solutions, Offers, About, Contact, Privacy, Terms, and a 404 page with truthful content and approved pricing and contact details only.
- Added semantic structure, per-page metadata, canonical URLs, JSON-LD limited to approved facts, robots.txt, and a sitemap that excludes the noindex legal drafts.
- Established GitHub Actions CI: typecheck, build, unit and static accessibility tests, Playwright end-to-end and browser accessibility tests, and a dependency audit.
- Rendered no fake proof and no inactive controls: the contact form is visibly and semantically disabled with an explanatory notice until its Gate 4 endpoint exists.

### Gate 4 — Business Flow — complete (2026-09-17)

- Implemented the contact endpoint as the single server-rendered route (`/contact/`, D-014): same-origin POST handling via Astro's built-in `checkOrigin`, honeypot, Cloudflare Turnstile verification, server-side validation with exact length limits, fail-closed Resend delivery, generic errors, and PII-free outcome logging — all as pure, unit-tested logic in `src/lib/contact.ts`.
- Enabled the form with accessible states: error summary that takes focus and links to fields, per-field errors with `aria-invalid`/`aria-describedby`, preserved input on every failure, a `noindex` confirmation page on success, and an honest disabled state when a deployment is unconfigured.
- Replaced the disabled-state assertions in both test suites with submission, error-summary, and outcome coverage; the browser suite runs the real flow with Cloudflare's published dummy Turnstile keys (D-016).
- Recorded Resend free-tier restrictions in `TRL_ARCHITECTURE.md` (3,000/month, 100/day, unverified-domain sender and recipient restrictions) and the qualification-to-repeat workflow in `TRL_USER_JOURNEYS.md`.
- Updated the privacy draft to disclose Turnstile and Resend processing truthfully.
- Remaining for the deployment gate: real-credential delivery verification (no Resend or Turnstile account exists yet — founder action), platform rate limiting, and the production Turnstile keys.

### Gate 5 — Production Hardening — complete (2026-09-17)

- Security headers and CSP: **implemented (D-018).** `src/lib/security.ts` is the single source; `public/_headers` applies the common headers + the static-pages CSP (`script-src 'none'`) to static-asset responses, and `src/middleware.ts` applies the contact CSP with the sanctioned Turnstile exception (`challenges.cloudflare.com` in `script-src`/`frame-src`) to Worker-rendered `/contact/`. Unit-pinned and e2e-asserted.
- Abuse prevention: Turnstile, honeypot, and origin checks were in place at Gate 4; the platform rate limiter is now **implemented, not just planned** — `handleContactPost` takes an optional `checkRateLimit`, `createRateLimitCheck` wraps the Workers binding in the fail-open contract, over-limit answers `429` with the same generic input-preserving state as `503`, and `wrangler.jsonc` carries the `ratelimits` block commented out pending the founder's account-scoped `namespace_id` (`TRL_RATE_LIMITING.md`).
- Accessibility: the manual keyboard/zoom/screen-reader pass remains **scheduled** in `TRL_MANUAL_ACCESSIBILITY_PASS.md`, including the real-Turnstile-widget checks D-017 took out of automation. It is a human step and is not counted as performed.
- Dependency re-review: 0 advisories, 3 exact-pinned production dependencies, every installed package declaring a licence, and no copyleft code in either shipped artifact — recorded in `TRL_GATE5_REVIEW.md`.
- Performance/SEO: measured from the real build output rather than scored (Lighthouse needs a browser and a deployed origin, so the synthetic run belongs to Gate 7). Two defects found and fixed — the display font was not preloaded, and fonts had no cache policy — and the byte budgets are now pinned by `tests/unit/build-budget.test.ts` (D-020). SEO signals re-verified end to end.
- Observability: `observability` verified through to the generated deploy config; the PII-free log contract and its gaps documented, with Cloudflare's plan limits recorded (`TRL_GATE5_REVIEW.md`).
- Analytics: **founder decision — none in Phase 1 (D-019).**

### Gate 6 — Deployment Readiness (active)

- Document environment variables, hosting setup, domain readiness, backups, rollback, recovery, and controlled deployment.
- **Repository-side work: complete.** `TRL_DEPLOYMENT.md` is now an operational
  runbook (verified deploy path, the complete variable table, rollback/recovery,
  monitoring, retention); `TRL_GATE6_FOUNDER_CHECKLIST.md` is the ordered action
  list; the canonical origin is a required build variable instead of an unowned
  domain (D-021); indexing is off by default with a one-variable switch (D-022);
  no account-scoped identifier is committed (D-023); `npm run preflight` and a
  `wrangler deploy --dry-run` CI step validate the deployable artifact on every
  pull request. **Gate 6 closes when the founder's steps are ticked** — account,
  first deploy, one real enquiry delivered, rate limiter enforcing.

### Gate 7 — Final Verification

- Run functional, responsive, accessibility, security, performance, content, and repository cleanliness checks.

### Gate 8 — Founder Launch Approval

- Founder alone decides whether the system goes public.

## Immediate next action

**Gate 6 — Deployment Readiness.** Gate 5 is complete, so the next work is documentation and readiness rather than more hardening: environment variables and platform setup, domain readiness, backup/rollback/recovery, preview verification, and the controlled-deployment procedure — all of which is founder-authorized work, with no account, DNS change, or deployment until the founder authorizes it. `TRL_DEPLOYMENT.md` already carries the deployment-gate checklist and direction; Gate 6 turns the parts of it still marked "planned" into procedure.

**Nothing is deployed, and no credentials exist yet.** Every remaining item that needs a real account is a founder action attached to the deployment gate: real-credential delivery verification, production Turnstile keys, the rate-limit `namespace_id` plus its burst check, framing/HSTS platform rules, disabling GitHub Pages, and the optional `og:image`. The manual accessibility pass also needs a human with a browser. None of these can be closed from inside the repository, and none of them should be faked.
