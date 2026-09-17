# TRL — Operating State

_Last updated: 2026-09-17 (Gate 5 — Production Hardening complete. Next: Gate 6, Deployment Readiness.)_

## Current phase

**Phase 1 — Professional service foundation and commercial entry point.**

## Current gate

**Gate 5 — Production Hardening is complete.** Security headers and CSP (D-018), the contact-endpoint rate limiter, the dependency re-review, the performance/SEO audit, the monitoring/observability review, and the founder's analytics decision (D-019 — Phase 1 ships with none) are all done; the four reviews are recorded in `TRL_GATE5_REVIEW.md`, and the manual accessibility pass remains scheduled for a human with a browser (`TRL_MANUAL_ACCESSIBILITY_PASS.md`). Gate 0 (Repository Reset), Gate 1 (Architecture), Gate 2 (Design System), Gate 3 (Core Website), and Gate 4 (Business Flow) are complete. **Gate 6 — Deployment Readiness is the active gate.**

## Status

- Architecture: recorded and founder-approved in `TRL_ARCHITECTURE.md` — Astro with TypeScript, Cloudflare, email-only inquiry delivery, full core site scope. Gate 4 refined the platform shape to Cloudflare Workers with static assets (D-014, recorded for founder review).
- User journeys and first-release scope: recorded in `TRL_USER_JOURNEYS.md`, now including the qualification-to-repeat founder workflow.
- Design system: recorded in `TRL_DESIGN_SYSTEM.md`; founder-confirmed direction is quiet authority, light-first, a text-only wordmark, and abstract systems graphics.
- Website: implemented. Astro 7.3.3 with TypeScript, a committed lockfile, the design token layer, accessible layout primitives and components, and all routes with truthful content, per-page metadata, canonical URLs, JSON-LD, robots.txt, and a sitemap. Eight routes prerender; `/contact/` is the one server-rendered route.
- Lead capture/contact workflow: **implemented.** The form POSTs to the server-rendered `/contact/` route with honeypot, Turnstile, server-side validation, fail-closed Resend delivery, accessible error states with preserved input, and a noindex confirmation page. Delivery with **real** credentials is unverified because no Resend or Turnstile account exists — that is a founder action at the deployment gate.
- CI: GitHub Actions runs typecheck, build, unit/static-accessibility tests, Playwright end-to-end and browser accessibility tests, and a dependency audit on every pull request.
- Production hardening (Gate 5): **complete.** Security headers and CSP are implemented as a dual-write (D-018) — `public/_headers` for static responses (`script-src 'none'`) and `src/middleware.ts` for the Worker-rendered `/contact/` (the static CSP plus the `challenges.cloudflare.com` Turnstile exception). Rate limiting for `POST /contact/` is **implemented**, not just planned: the endpoint reads `env.CONTACT_RATE_LIMITER`, answers `429` with the same generic preserved-input state as `503`, and fails open by contract when the binding is absent — the `ratelimits` block in `wrangler.jsonc` stays commented out pending the founder's account-scoped `namespace_id`. The performance/SEO audit found and fixed two defects (the unpreloaded display font, and fonts with no cache policy) and pinned the measured budgets in `tests/unit/build-budget.test.ts`; the dependency re-review found no advisories and verified no copyleft code in either shipped artifact; the observability review verified that Workers Logs are enabled in the generated deploy config and documented the log contract and its gaps. Analytics: **none in Phase 1** (D-019). All four reviews are in `TRL_GATE5_REVIEW.md`. The manual accessibility pass, including the real Turnstile widget's rendering/size (D-017), is scheduled in `TRL_MANUAL_ACCESSIBILITY_PASS.md` and is a human step.
- Payment integration: not started; offer presentation is payment-ready without a provider.
- Deployment: not started; no hosting, email, or domain accounts, keys, or DNS changes exist.
- Production launch: not authorized.

## Active constraints

- Do not build the entire long-term TRL ecosystem in Phase 1.
- Do not invent pricing, claims, credentials, proof, or infrastructure ownership decisions. The approved facts live in `src/lib/site.ts` and are asserted by the content-invariant tests.
- Implement the founder-confirmed design direction and semantic tokens from `TRL_DESIGN_SYSTEM.md`; record intentional deviations.
- Do not deploy publicly, create hosting/email accounts, or modify DNS without explicit founder authorization.
- Add dependencies only as recorded in the architecture, and keep the committed lockfile reviewed.
- Do not render a control that does not do what it says. The contact form is live only where it is actually configured; an unconfigured deployment renders it disabled with a notice.

## Gate 4 exit criteria — met, with two explicitly deferred items

| Criterion | Status |
| --- | --- |
| Same-origin submissions with server-side validation, honeypot, and Turnstile checks | Met — Astro `checkOrigin` + honeypot + Turnstile siteverify, all unit- and e2e-tested |
| Generic error handling, no internals leaked | Met — `400/403/405/415/422/503` states verified locally and in CI; log-hygiene unit test |
| Form enabled with accessible per-field errors, error summary that takes focus, preserved input | Met — asserted by the browser suite in a real engine |
| Announced success state | Met — PRG redirect to the static `/contact/sent/` page |
| Email delivery works with real credentials outside CI | **Deferred — founder action.** No Resend account exists (accounts are founder-only). The delivery contract is unit-tested; the deployment-gate checklist includes sending one real enquiry end-to-end |
| Provider free-tier sending restrictions recorded | Met — recorded in `TRL_ARCHITECTURE.md` from Resend's published documentation; live-account confirmation deferred with the item above |
| Qualification-to-repeat workflow documented | Met — `TRL_USER_JOURNEYS.md` |

## Gate 3 exit criteria — met

| Criterion | Status |
| --- | --- |
| Astro project with a reviewed, committed lockfile | Met — Astro 7.3.3, `package-lock.json` committed, 0 vulnerabilities in `npm audit` |
| CI established | Met — `.github/workflows/ci.yml`: typecheck, build, unit, e2e, dependency audit |
| Design tokens implemented | Met — `src/styles/tokens.css`, pinned and contrast-tested in `tests/unit/design-tokens.test.ts` |
| Core accessible components implemented | Met — skip link, header/nav, wordmark, button, card, offer card, section/page intro, step list, notice, form field, footer, WhatsApp affordance, systems graphic |
| Core routes render with truthful content | Met — nine routes; approved prices and contact details only; no fabricated proof |
| Semantic structure, metadata, canonical, robots, sitemap | Met — one h1 per page, ordered headings, landmarks, per-page title/description, canonical URLs, JSON-LD limited to approved facts, robots.txt, sitemap excluding noindex drafts |
| Typecheck, build, and unit checks pass | Met — `astro check` 0 errors; build 9 pages; 155 unit tests pass |
| Applicable end-to-end checks | Met — the Playwright suite runs on CI across desktop and mobile projects. Its first run caught an undersized standalone link, which was fixed. Browser binaries cannot be downloaded in the authoring sandbox, so CI is the only place this suite executes. |

## Open questions requiring founder approval

- Analytics provider or none — **resolved at Gate 5: none in Phase 1 (D-019).** Revisit at Gate 7 or when Phase 2 begins.
- The rate-limit binding's `namespace_id` (account-scoped integer) and the Cloudflare account that provisions it — deployment gate (`TRL_RATE_LIMITING.md`).
- Framing protection (`X-Frame-Options`/`frame-ancestors`) and HSTS as platform rules on the final domain — deployment gate (D-018 note).
- GitHub Pages is still enabled with the legacy Jekyll builder sourced from `main`; the founder should disable it or switch its source to "GitHub Actions" in Settings → Pages (the repository token gets `403`). `_config.yml` contains it until then (`TRL_DEPLOYMENT.md`).
- Optional, if wanted before launch: a founder-approved image for `og:image`, currently absent because no imagery is approved (`TRL_GATE5_REVIEW.md`).
- Payment provider and payment/account ownership (after first release).
- Final legal text and jurisdiction-specific requirements. The Privacy and Terms pages are published as clearly labelled drafts and are `noindex` until reviewed; Gate 4 added truthful Turnstile and Resend disclosures to the privacy draft.
- Any founder biography, credentials, or imagery beyond facts already approved.
- Public launch timing and approval.
- The D-014 platform refinement (Cloudflare Workers with static assets as the concrete form of the approved Cloudflare hosting direction).
