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

### Gate 5 — Production Hardening (in progress, 2026-09-17)

- Security headers and CSP: **implemented (D-018).** `src/lib/security.ts` is the single source; `public/_headers` applies the common headers + the static-pages CSP (`script-src 'none'`) to static-asset responses, and `src/middleware.ts` applies the contact CSP with the sanctioned Turnstile exception (`challenges.cloudflare.com` in `script-src`/`frame-src`) to Worker-rendered `/contact/`. Unit-pinned and e2e-asserted.
- Abuse prevention: Turnstile, honeypot, and origin checks were in place at Gate 4. The platform rate-limit plan for `POST /contact/` is **planned** in `TRL_RATE_LIMITING.md` (binding, key, limit, order, and user-facing behaviour fixed; account-scoped `namespace_id` is a founder action at the deployment gate).
- Accessibility: the manual keyboard/zoom/screen-reader pass is **scheduled** in `TRL_MANUAL_ACCESSIBILITY_PASS.md`, including the real-Turnstile-widget eyeball checks D-017 took out of automation.
- Remaining in this gate: dependency re-review, performance/SEO (Lighthouse at Gates 5 and 7), monitoring/observability review, and the analytics founder decision.

### Gate 6 — Deployment Readiness

- Document environment variables, hosting setup, domain readiness, backups, rollback, recovery, and controlled deployment.

### Gate 7 — Final Verification

- Run functional, responsive, accessibility, security, performance, content, and repository cleanliness checks.

### Gate 8 — Founder Launch Approval

- Founder alone decides whether the system goes public.

## Immediate next action

Continue Gate 5 — Production Hardening from the three deliverables landed in this session (security headers/CSP implemented, rate-limit plan fixed, manual accessibility pass scheduled). Next: re-run the dependency audit and observe this branch's CI (typecheck → build → 220 unit tests → e2e including the new header assertions); then the remaining Gate 5 reviews — performance/SEO, monitoring/observability — and the open analytics founder decision. Real-credential delivery verification, production Turnstile keys, the rate-limit `namespace_id`, and framing/HSTS platform rules remain founder actions attached to the deployment gate.
