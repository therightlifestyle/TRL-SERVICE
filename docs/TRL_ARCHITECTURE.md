# TRL — Architecture

_Last updated: 2026-09-17 (Gate 3). The stack below is founder-approved and recorded in `TRL_DECISIONS.md` (D-005–D-008). The static site is now implemented; the contact endpoint is not. Nothing has been purchased or deployed._

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
| Framework | Astro with TypeScript | Content-first; pages compile to static HTML with near-zero client JavaScript. **Pinned at 7.3.3 with a committed `package-lock.json` (Gate 3).** |
| Styling | Plain modern CSS with design tokens (custom properties) | No CSS framework. Implemented as `src/styles/tokens.css` plus `src/styles/global.css`, with component styles scoped in each `.astro` file. |
| Form endpoint | One Astro server endpoint deployed as a Cloudflare Pages Function | Same-origin POST with server-side validation; whether it is an Astro action or a plain API route is decided at the scaffold. |
| Email delivery | Resend transactional email API to the approved address | Free tier (3,000 emails/month, 100/day) covers expected lead volume; no database. The provider can be swapped behind the endpoint without changing the flow. |
| Spam protection | Cloudflare Turnstile plus a honeypot | Free and privacy-friendly. |
| Hosting | Cloudflare Pages | Free tier permits commercial use; also manages DNS and HTTPS for the intended domain. |
| Unit tests | Vitest 5.0.1 | Content invariants, token/contrast verification, and static accessibility checks over the build output using axe-core and jsdom. |
| E2E tests | Playwright 1.63.0 | Navigation, content, reflow, keyboard, and axe accessibility runs against a real production build, on a desktop and a mobile project. |
| CI | GitHub Actions | `.github/workflows/ci.yml`: `npm ci`, typecheck, build, unit tests, Playwright e2e, and a dependency audit on every pull request. |

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

A `/404` page is also built, carrying `noindex` and a list of the core routes.

SEO approach: per-page titles and descriptions, semantic HTML, generated sitemap.xml and robots.txt, canonical URLs on the production domain, and JSON-LD organization schema limited to truthful facts.

## Implemented structure (Gate 3)

```
astro.config.mjs        Site origin, static output, trailing slashes, sitemap filter
package.json            Pinned dependencies and the dev/build/typecheck/test scripts
package-lock.json       Committed and reviewed; npm ci in CI
.github/workflows/ci.yml  Typecheck, build, unit, e2e, and dependency-audit jobs
public/fonts/           Self-hosted WOFF2 subsets plus their OFL licence files
public/robots.txt       Deliberate crawl policy and sitemap pointer
src/lib/site.ts         Founder-approved facts: contact, offers, services, solutions
src/styles/tokens.css   The single source of token values in the codebase
src/styles/global.css   Reset, base typography, focus, layout primitives, motion
src/layouts/BaseLayout.astro  Document head, metadata, JSON-LD, landmarks, skip link
src/components/         Wordmark, header, footer, button, card, offer card, field,
                        notice, step list, section/page intro, systems graphic,
                        WhatsApp affordance
src/pages/              The nine routes
tests/unit/             Content invariants, token contrast, rendered-page checks
tests/e2e/              Navigation, content, and accessibility suites
```

Content model: page copy lives in the `.astro` pages, while every founder-approved fact — contact details, offer names, prices, deliverables, inclusions, exclusions — lives in `src/lib/site.ts` and is asserted by `tests/unit/content-invariants.test.ts`. Changing a price or contact detail without approval fails CI.

Client JavaScript: none. No page ships a script bundle; the only inline script is the JSON-LD block, which is data rather than behaviour. The navigation fits without a menu toggle at every tested width, so no mobile menu script was needed.

Fonts: `Newsreader` 500 and variable `Manrope`, latin WOFF2 subsets only, self-hosted from `/fonts/` with their SIL Open Font License files committed alongside. No third-party runtime font request is made; a unit test asserts this for every built page.

## Contact flow

**Gate 3 status:** steps 2–5 do not exist yet. `/contact/` renders the enquiry structure inside a `disabled` fieldset with a notice explaining that submissions are not being accepted, so nothing is presented as working when it is not. Email and WhatsApp are the live channels and are placed above the form. Building the endpoint is Gate 4 work.

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
| Local | Development and manual verification | Available — `npm run dev` |
| CI | Automated checks on every pull request | Created (`.github/workflows/ci.yml`) |
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

- Unit (Vitest): content invariants that fail if prices, contact details, offers, or routes deviate from approved values; design-token values and recomputed contrast ratios; and structural/accessibility checks run with axe-core and jsdom against the real build output. Form validation rules join this suite at Gate 4.
- E2E (Playwright): core navigation and landmarks, offer and contact content, the 404 and robots/sitemap responses, keyboard and skip-link behaviour, 320px reflow, target size, reduced motion, no-CSS resilience, and axe runs on every route. The form happy path with email delivery mocked joins this suite at Gate 4.
- CI (GitHub Actions): `npm ci` → typecheck (`astro check`) → build → unit → e2e, plus a dependency audit, on every pull request.
- Accessibility: axe runs in both suites; a manual keyboard, zoom, and screen-reader pass before launch.

Division of labour between the suites: anything that depends on painted pixels or a real engine — colour contrast as rendered, focus visibility, reflow, keyboard order — belongs to Playwright. Everything verifiable from the HTML and the token source runs in Vitest, so most regressions are caught without a browser.
- Performance/SEO: Lighthouse audits at Gates 5 and 7.
- Email delivery: verified manually with real credentials before launch; never in CI.

## Remaining architecture-adjacent decisions

- Analytics provider or none — Gate 5, founder decision.
- Payment provider and account ownership — after first release, when the founder authorizes; offer CTAs are payment-ready.
- Legal text — founder decision before launch.
