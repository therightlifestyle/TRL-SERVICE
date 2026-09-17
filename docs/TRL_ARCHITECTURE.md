# TRL — Architecture

_Last updated: 2026-09-17 (Gate 5 complete; Gate 6 — Deployment Readiness active). The stack below is founder-approved and recorded in `TRL_DECISIONS.md` (D-005–D-008). The static site and the contact endpoint are implemented and covered by CI; Gate 5 added the security headers and CSP (D-018), the contact-endpoint rate limiter, the cache policy (D-020), and the dependency, performance/SEO, and observability reviews (`TRL_GATE5_REVIEW.md`). Nothing has been purchased or deployed._

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
| Form endpoint | `/contact/` itself: a server-rendered Astro route that handles the POST (D-014) | All submission logic is a pure module, `src/lib/contact.ts`, unit-tested with injected dependencies. Same-origin enforcement comes from Astro's built-in `checkOrigin`, plus a honeypot, Turnstile, and fail-closed delivery. |
| Email delivery | Resend transactional email API to the approved address | Free tier (3,000 emails/month, 100/day) covers expected lead volume; no database. The provider can be swapped behind the endpoint without changing the flow. See "Email delivery and free-tier restrictions" below. |
| Spam protection | Cloudflare Turnstile plus a honeypot | Free and privacy-friendly. The Turnstile script is the only third-party client script (D-015). |
| Hosting | Cloudflare Workers with static assets, via `@astrojs/cloudflare` 14.3.2 | The concrete platform under the founder-approved "Cloudflare Pages" direction: by 2026 Cloudflare steers new full-stack projects to Workers with static assets, and the Astro 7 adapter targets it (D-014). Nothing is deployed yet. |
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

A `/404` page is also built, carrying `noindex` and a list of the core routes. The post-submission confirmation `/contact/sent/` is a static, `noindex` utility page excluded from the sitemap: anyone can land on it directly, so it asserts nothing beyond "if you just sent the form, it worked".

SEO approach: per-page titles and descriptions, semantic HTML, generated sitemap.xml and robots.txt, canonical URLs on the production domain, and JSON-LD organization schema limited to truthful facts.

## Implemented structure (Gate 4)

```
astro.config.mjs        Site origin, static output with the Cloudflare adapter,
                        trailing slashes, sitemap filter (noindex exclusions)
wrangler.jsonc          Anchors local dev config; the adapter generates the real
                        deploy config into dist/server/wrangler.json at build
                        (observability passes through; the rate-limit binding
                        is declared here, commented out, pending the account)
package.json            Pinned dependencies and the dev/build/typecheck/test scripts
package-lock.json       Committed and reviewed; npm ci in CI
.env.example            Committed names/comments for build-time variables
.dev.vars.example       Committed dummy Turnstile keys for local dev and e2e
.github/workflows/ci.yml  Typecheck, build, unit, e2e, and dependency-audit jobs
public/fonts/           Self-hosted WOFF2 subsets plus their OFL licence files
public/robots.txt       Deliberate crawl policy and sitemap pointer
src/env.d.ts            Runtime type of the Workers env (cloudflare:workers)
src/lib/site.ts         Founder-approved facts: contact, offers, services, solutions
src/lib/contact.ts      The whole submission pipeline as pure functions:
                        validation, honeypot, Turnstile orchestration, email
                        composition, logging, and the fail-closed rules
src/lib/security.ts     Canonical security headers and both CSPs (D-018);
                        consumed by src/middleware.ts and public/_headers
src/middleware.ts       Sets the contact CSP on Worker-rendered responses;
                        static responses get their headers from public/_headers
public/_headers         Edge security headers + static-pages CSP for the ASSETS
                        binding (copied to dist/client at build, mirror-pinned)
src/styles/tokens.css   The single source of token values in the codebase
src/styles/global.css   Reset, base typography, focus, layout primitives, motion
src/layouts/BaseLayout.astro  Document head, metadata, JSON-LD, landmarks, skip link
src/components/         Wordmark, header, footer, button, card, offer card, field,
                        notice, step list, section/page intro, systems graphic,
                        WhatsApp affordance, error summary
src/pages/              Eight prerendered routes plus the server-rendered
                        /contact/ endpoint and the static /contact/sent/ page
tests/unit/             Content invariants, token contrast, rendered-page checks,
                        the validation matrix, and the endpoint pipeline
tests/e2e/              Navigation, content, accessibility, and contact-form suites
```

Content model: page copy lives in the `.astro` pages, while every founder-approved fact — contact details, offer names, prices, deliverables, inclusions, exclusions — lives in `src/lib/site.ts` and is asserted by `tests/unit/content-invariants.test.ts` and `tests/unit/contact-validation.test.ts`. Changing a price or contact detail without approval fails CI.

Client JavaScript: none authored by this project. The only inline script is the JSON-LD block (data, not behaviour), with one sanctioned exception recorded as D-015: `/contact/` loads Cloudflare's Turnstile script (`challenges.cloudflare.com`) because spam protection was founder-approved (D-007) and Turnstile cannot verify anything without it. The form itself works without any first-party script — it is a plain HTML form POST.

Fonts: `Newsreader` 500 and variable `Manrope`, latin WOFF2 subsets only, self-hosted from `/fonts/` with their SIL Open Font License files committed alongside. No third-party runtime font request is made; a unit test asserts this for every built page.

Build output: `dist/client/` holds the prerendered pages and static assets, and `dist/server/` holds the Workers entry for the `/contact/` route. `astro preview` serves both locally in the workerd runtime.

## Contact flow

**Gate 4 status: implemented and locally verified; delivery with real credentials is the remaining founder step.** `/contact/` is a server-rendered route that both renders the form (GET) and processes submissions (POST). A fully valid submission produces `303 → /contact/sent/` (PRG), so the success state survives refresh and no data lives in the URL.

1. `GET /contact/` — the page renders the enabled form with a Turnstile widget. If `PUBLIC_TURNSTILE_SITEKEY` is not configured, the form instead renders visibly disabled with an explanatory notice and email/WhatsApp above it stay live — no deployment can present a form that pretends to work (D-011's rule, retained for misconfiguration).
2. `POST /contact/` (same origin) — Astro's built-in `checkOrigin` (default on, verified by tests) rejects form POSTs whose `Origin` is missing or foreign with `403` before the endpoint logic runs. Requests with a non-form content type get `415`; unparseable bodies get `400`; other methods get `405`.
3. Server checks in order (asserted by unit tests): honeypot → Turnstile verification → field validation → delivery. A filled honeypot returns the same success redirect as a real submission while doing nothing — bots get no signal, and no network call is spent on them.
4. On success: an email is sent through Resend to the approved address with `reply_to` set to the submitter; the visitor is redirected to `/contact/sent/`. Nothing is stored.
5. On validation failure: the form re-renders with HTTP `422`, an error summary that takes focus and links to each invalid field, per-field errors wired through `aria-describedby` with `aria-invalid`, and every submitted value preserved. On Turnstile failure: the same pattern with `403` and a retry message. On any delivery or configuration failure: `503` with a generic "Your message was not sent" notice, preserved input, and the direct channels — never any internal detail.

Logging: one structured outcome event per request (`accepted`, `rejected-honeypot`, `rejected-turnstile`, `invalid`, `bad-request`, `system-error`, plus a reason and a request id). A unit test asserts no submitted value, credential, or token ever appears in a log line.

Rate limiting and abuse controls: Turnstile, the honeypot, origin checking, and platform-level protection on the Cloudflare account. Gate 5 fixed the platform rate-limit plan in `TRL_RATE_LIMITING.md`: a Workers `ratelimits` binding (`CONTACT_RATE_LIMITER`, `10 / 10s`, keyed on `cf-connecting-ip`) checked first in the POST pipeline, failing to a generic preserved-input state, with fail-open on an absent/degraded binding. It remains a plan rather than committed config because the binding's `namespace_id` is an account-scoped founder value — see that document for the full design and the deployment-gate actions.

Response security (D-018): security headers are applied at the deployment boundary the architecture actually has — static responses receive `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, and a `script-src 'none'` CSP from `public/_headers`; Worker-rendered `/contact/` responses receive the contact CSP (the static CSP plus `challenges.cloudflare.com` in `script-src`/`frame-src`) from `src/middleware.ts`. Both are pinned to `src/lib/security.ts`.

## Email delivery and free-tier restrictions (recorded per D-007)

Verified from Resend's published documentation and pricing (2026-09-17; no account exists yet, so nothing below was verified against a live account — that happens at the deployment gate):

- Free tier: **3,000 emails/month with a 100/day cap**, one custom domain, 30-day log retention. Both the daily cap and the monthly cap are far above expected Phase 1 lead volume.
- All accounts are rate-limited to **2 requests per second** on the send API; the endpoint's single-send-per-request pattern stays well within it.
- **Before a sending domain is verified**, mail can only be sent from Resend's default address (`onboarding@resend.dev`), and free accounts are restricted to sending to the account owner's own email address. Because the approved destination (D-003) is the founder's own Gmail address, the restriction is expected to be compatible — this must be confirmed with the real account, since Resend's dashboard also has a per-account "restrict to your own email" setting.
- Consequences for this project: the site can go live on the free tier with `RESEND_FROM_EMAIL=onboarding@resend.dev` while the founder verifies `therightlifestyle.com` in Resend (a DNS change, reserved for the deployment gate with explicit founder authorization, D-004/D-006). A professional `hello@therightlifestyle.com` from-address requires that verification.

Sender identity: a professional from-address requires verifying the domain in the email provider — a DNS change reserved for the deployment gate (see above).

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
| Local | Development and manual verification | Available — `npm run dev` reads `.dev.vars` (dummy Turnstile keys from `.dev.vars.example`, no delivery config) |
| CI | Automated checks on every pull request | Created (`.github/workflows/ci.yml`); the e2e job forces the same dummy-key environment |
| Preview | Per-PR Cloudflare previews of the real deployment | From the deployment gate onward |
| Production | Public site on the founder-approved domain | Only after Gate 8 approval |

Environment variables (all server-side or build-time, never committed):

| Variable | Purpose |
| --- | --- |
| `PUBLIC_SITE_URL` | Build-time: canonical production URL for metadata and the sitemap |
| `PUBLIC_TURNSTILE_SITEKEY` | Runtime: Turnstile sitekey rendered into the contact form (public by nature; read server-side, so it can differ per deployment) |
| `TURNSTILE_SECRET` | Runtime: secret for server-side token verification (fail-closed if unset) |
| `RESEND_API_KEY` | Runtime: email delivery credential (fail-closed if unset) |
| `CONTACT_TO_EMAIL` | Runtime: approved destination address (D-003) |
| `RESEND_FROM_EMAIL` | Runtime: sender address — `onboarding@resend.dev` until the domain is verified |

Runtime variables are read through `import { env } from 'cloudflare:workers'`, never from `import.meta.env`, so a deployment is configured entirely in the hosting platform. `.dev.vars` (gitignored, copied from `.dev.vars.example`) supplies them locally.

## Test strategy

- Unit (Vitest): content invariants that fail if prices, contact details, offers, or routes deviate from approved values; design-token values and recomputed contrast ratios; structural/accessibility checks with axe-core and jsdom over the real build output; the security-header/CSP module and the `_headers` mirror it pins; the complete form-validation matrix with exact boundary values; and the whole POST pipeline with injected fakes for Turnstile, delivery, and logging — ordering, fail-closed behaviour, the exact email payload, log hygiene, and status codes are all asserted without a network. The real network calls are thin `fetch` wrappers whose contracts the fakes mirror.
- E2E (Playwright): core navigation and landmarks, offer and contact content, the 404 and robots/sitemap responses, keyboard and skip-link behaviour, 320px reflow, target size, reduced motion, no-CSS resilience, and axe runs on every route — including the form's error states. The contact-form suite runs the real flow in a browser against the production build with Cloudflare's published dummy Turnstile keys and no delivery configuration: verification genuinely passes through Cloudflare's siteverify, validation errors come from the real server, and a fully valid submission reaches the delivery boundary and produces the honest generic failure state. Email delivery itself is never exercised in e2e — a server-side outbound call cannot be intercepted by Playwright, and adding a delivery-mock mode reachable in production was rejected as a security regression (D-016); delivery with real credentials is verified manually at the deployment gate.
- CI (GitHub Actions): `npm ci` → typecheck (`astro check`) → build → unit → e2e, plus a dependency audit, on every pull request.
- Accessibility: axe runs in both suites; a manual keyboard, zoom, and screen-reader pass before launch.

Division of labour between the suites: anything that depends on painted pixels or a real engine — colour contrast as rendered, focus visibility, reflow, keyboard order — belongs to Playwright. Everything verifiable from the HTML and the token source runs in Vitest, so most regressions are caught without a browser.
- Accessibility: axe runs in both suites; the manual keyboard/zoom/reflow/screen-reader pass plus the real-Turnstile-widget eyeball checks (D-017) are scheduled in `TRL_MANUAL_ACCESSIBILITY_PASS.md` and run in the deployed preview.
- Performance/SEO: Lighthouse audits at Gates 5 and 7.
- Email delivery: verified manually with real credentials before launch; never in CI.

## Remaining architecture-adjacent decisions

- Analytics provider or none — **resolved at Gate 5: none in Phase 1 (D-019)**, on the founder's decision; revisit at Gate 7 or when Phase 2 begins. Cloudflare Web Analytics was considered and declined because it still injects a third-party script.
- Payment provider and account ownership — after first release, when the founder authorizes; offer CTAs are payment-ready.
- Legal text — founder decision before launch.
- Rate-limit `namespace_id` and the Cloudflare account that provisions it — founder action at the deployment gate (`TRL_RATE_LIMITING.md`).
- `X-Frame-Options`/`frame-ancestors` pinning and HSTS — deployment-gate platform rules (D-018 note).
