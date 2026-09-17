# TRL — Operating State

_Last updated: 2026-09-17_

## Current phase

**Phase 1 — Professional service foundation and commercial entry point.**

## Current gate

**Gate 4 — Business Flow** is the active gate for the next session. Gate 0 (Repository Reset), Gate 1 (Architecture), Gate 2 (Design System), and Gate 3 (Core Website) are complete.

## Status

- Architecture: recorded and founder-approved in `TRL_ARCHITECTURE.md` — Astro with TypeScript, Cloudflare Pages, email-only inquiry delivery, full core site scope.
- User journeys and first-release scope: recorded in `TRL_USER_JOURNEYS.md`.
- Design system: recorded in `TRL_DESIGN_SYSTEM.md`; founder-confirmed direction is quiet authority, light-first, a text-only wordmark, and abstract systems graphics.
- Website: **implemented as a static build.** Astro 7.3.3 with TypeScript, a committed lockfile, the design token layer, accessible layout primitives and components, and all nine routes (Home, Services, AI Solutions, Offers, About, Contact, Privacy, Terms, 404) with truthful content, per-page metadata, canonical URLs, JSON-LD, robots.txt, and a sitemap.
- Lead capture/contact workflow: **the form structure is rendered but deliberately disabled** — no server endpoint exists yet. Email and WhatsApp are the live channels and appear before the form on every relevant page. Implementing submission is Gate 4 work.
- CI: GitHub Actions runs typecheck, build, unit/static-accessibility tests, Playwright end-to-end and browser accessibility tests, and a dependency audit on every pull request.
- Payment integration: not started; offer presentation is payment-ready without a provider.
- Deployment: not started; no hosting, email, or domain accounts, keys, or DNS changes exist.
- Production launch: not authorized.

## Active constraints

- Do not build the entire long-term TRL ecosystem in Phase 1.
- Do not invent pricing, claims, credentials, proof, or infrastructure ownership decisions. The approved facts live in `src/lib/site.ts` and are asserted by the content-invariant tests.
- Implement the founder-confirmed design direction and semantic tokens from `TRL_DESIGN_SYSTEM.md`; record intentional deviations.
- Do not deploy publicly, create hosting/email accounts, or modify DNS without explicit founder authorization.
- Add dependencies only as recorded in the architecture, and keep the committed lockfile reviewed.
- Do not render a control that does not do what it says. The contact form stays disabled until its endpoint exists.

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

## Gate 4 exit criteria

The contact endpoint accepts same-origin submissions with server-side validation, honeypot and Turnstile checks, and generic error handling; the form is enabled with accessible per-field errors, an error summary that takes focus, preserved input, and an announced success state; email delivery to the approved address works with real credentials outside CI; provider free-tier sending restrictions are recorded in `TRL_ARCHITECTURE.md`; and the qualification-to-repeat workflow is documented.

## Open questions requiring founder approval

- Analytics provider or none (Gate 5).
- Payment provider and payment/account ownership (after first release).
- Final legal text and jurisdiction-specific requirements. The Privacy and Terms pages are published as clearly labelled drafts and are `noindex` until reviewed.
- Any founder biography, credentials, or imagery beyond facts already approved.
- Public launch timing and approval.
