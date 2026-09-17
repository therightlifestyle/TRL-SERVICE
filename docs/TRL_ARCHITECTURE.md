# TRL — Architecture

_Last updated: 2026-09-17 (Gate 1). The stack below is founder-approved and recorded in `TRL_DECISIONS.md` (D-005–D-008). Nothing has been implemented, purchased, or deployed yet._

## Phase 1 architecture goals

- A maintainable, responsive public company website.
- Clear service and offer presentation.
- A real contact/inquiry pathway with server-side validation.
- A payment-ready offer flow without integrating a payment provider.
- Secure environment-variable handling.
- Good SEO, accessibility, performance, and observability foundations.
- A structure that can later support additional TRL products without building fake future products now.

## Principles

1. Prefer the simplest architecture that meets the real requirements.
2. Keep public presentation, lead capture, and future service operations separable.
3. Make data flow explicit and validate at trust boundaries.
4. Use relative browser URLs and environment-based server configuration.
5. Keep secrets server-side and out of documentation, bundles, and logs.
6. Avoid dependencies and infrastructure that do not solve a current Phase 1 problem.

## Selected stack (founder-approved 2026-09-17)

| Layer | Choice | Notes |
| --- | --- | --- |
| Framework | Astro with TypeScript | Content-first; pages compile to static HTML with near-zero client JavaScript; current stable line (7.x as of September 2026). Exact version pinned at the Gate 3 scaffold with a committed lockfile. |
| Styling | Plain modern CSS with design tokens (custom properties) | No CSS framework; the Phase 1 design system (Gate 2) is small and bespoke. |
| Form endpoint | One Astro server endpoint deployed as a Cloudflare Pages Function | Same-origin POST with server-side validation; whether it is an Astro action or a plain API route is decided at the scaffold. |
| Email delivery | Resend transactional email API to the approved address | Free tier (3,000 emails/month, 100/day) covers expected lead volume; no database. The provider can be swapped behind the endpoint without changing the flow. |
| Spam protection | Cloudflare Turnstile plus a honeypot | Free and privacy-friendly. |
| Hosting | Cloudflare Pages | Free tier permits commercial use; also manages DNS and HTTPS for the intended domain. |
| Unit tests | Vitest | Validation logic and content invariants. |
| E2E tests | Playwright | Navigation and form paths against a local build. |
| CI | GitHub Actions | Install, typecheck, build, unit tests, and e2e tests on every pull request. |

### Why Astro (decision record)

- Phase 1 is a content site with exactly one interactive server path (the contact form). Astro compiles pages to static HTML and ships no client framework by default — the smallest surface that meets the performance, security, and SEO requirements.
- The stack stays portable: the Astro team was acquired by Cloudflare in January 2026, but the framework remains MIT-licensed with multiple official deployment targets, so hosting is a choice rather than a lock-in.
- Future interactive TRL products (dashboards, accounts) are separate applications; choosing the content-optimal tool now preserves the separability principle instead of prematurely paying an app-framework tax.
- Alternatives considered and rejected: Next.js (larger runtime and concept surface than Phase 1 needs; the right tool when an interactive product is actually built), plain HTML/CSS/JS (no component model; slower to maintain and test), WordPress (hosting and dependency overhead; repository-based content changes are sufficient).

## Site inventory and page boundaries

| Route | Purpose | Boundary |
| --- | --- | --- |
| `/` | Positioning, services overview, offer staircase, contact CTAs | No fake proof; no ecosystem promises |
| `/about/` | Founder identity; what TRL is and is not | Truthful new-firm framing |
| `/services/` | Service areas and the engagement model | Describes capability, not invented results |
| `/ai-solutions/` | Concrete AI solution catalog (assistant types, automation plays) | Maps to real deliverables only |
| `/offers/` | The three approved offers: price, deliverables, inclusions/exclusions, next step | Approved pricing only; payment-ready CTAs without a provider |
| `/contact/` | Inquiry form plus WhatsApp and email options | Form spec in `TRL_USER_JOURNEYS.md` |
| `/privacy/`, `/terms/` | Legal pages | Structure only until approved legal text exists |
| global | Header, footer, persistent WhatsApp affordance, per-page metadata | — |

SEO approach: per-page titles and descriptions, semantic HTML, generated sitemap.xml and robots.txt, canonical URLs on the production domain, and JSON-LD organization schema limited to truthful facts.

## Contact flow

1. `GET /contact/` — the static page renders the form with a Turnstile widget.
2. `POST` (same origin) — the server endpoint receives the submission.
3. Server checks in order: honeypot → Turnstile token verification → field validation → length limits.
4. On success: an email is sent through Resend to the approved address with reply-to set to the submitter; the visitor sees a generic confirmation. Nothing is stored.
5. On validation failure: accessible per-field errors; on system failure: a generic error with no internal details.

Rate limiting and abuse controls: Turnstile plus platform-level protection on the Cloudflare account; the exact mechanism is finalized at Gates 4–5.

Email sender identity: a professional from-address (for example `hello@therightlifestyle.com`) requires verifying the domain in the email provider — a DNS change reserved for the deployment gate. Until then, free-tier sending restrictions (such as recipient or sender limits before domain verification) are verified during Gate 4 testing and recorded here.

## Data handling

- Collected: the form fields listed in `TRL_USER_JOURNEYS.md` — nothing else.
- Stored: nowhere in the application. The founder's inbox is the system of record.
- Logs: outcome events only (accepted/rejected with a request id); no message content or PII.
- Cookies: none for analytics or tracking. Turnstile may set functional cookies; the privacy page must disclose this.
- Transport: HTTPS only.
- Deletion: deleting an inquiry means deleting the email; this is documented in the privacy page.

## Environments

| Environment | Purpose | Status |
| --- | --- | --- |
| Local | Development and manual verification | Available once implemented |
| CI | Automated checks on every pull request | Created at the Gate 3 scaffold |
| Preview | Per-PR Cloudflare Pages previews | From the deployment gate onward |
| Production | Public site on the founder-approved domain | Only after Gate 8 approval |

Environment variables (all server-side or build-time, never committed; names finalized at implementation):

| Variable | Purpose |
| --- | --- |
| `PUBLIC_SITE_URL` | Canonical production URL for metadata and the sitemap |
| `RESEND_API_KEY` | Email delivery credential |
| `CONTACT_TO_EMAIL` | Approved destination address |
| `RESEND_FROM_EMAIL` | Verified sender address |

## Test strategy

- Unit (Vitest): form validation rules; content invariants that fail the build if prices, contact details, or offers deviate from approved values.
- E2E (Playwright): core navigation, the form happy path with email delivery mocked, and validation/failure states.
- CI (GitHub Actions): install → typecheck (`astro check`) → build → unit → e2e on every pull request.
- Accessibility: axe checks in the e2e suite; a manual keyboard and screen-reader pass before launch.
- Performance/SEO: Lighthouse audits at Gates 5 and 7.
- Email delivery: verified manually with real credentials before launch; never in CI.

## Remaining architecture-adjacent decisions

- Analytics provider or none — Gate 5, founder decision.
- Payment provider and account ownership — after first release, when the founder authorizes; offer CTAs are payment-ready.
- Legal text — founder decision before launch.
