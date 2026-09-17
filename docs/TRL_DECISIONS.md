# TRL — Decision Log

## D-001 — Phase 1 scope is service-first

- **Date:** 2026-09-17
- **Status:** Founder-approved operating brief
- **Decision:** Phase 1 focuses on AI automation and business-system services rather than attempting to build the full TRL ecosystem.
- **Why:** Validate the commercial service foundation before investing in a large SaaS/ecosystem build.
- **Consequence:** The website should present real services, offers, inquiry, qualification, and delivery readiness; future areas remain architectural possibilities only.

## D-002 — Commercial staircase and pricing

- **Date:** 2026-09-17
- **Status:** Founder-approved operating brief
- **Decision:** Use TRL Micro Audit ($35 / PKR 9,900), TRL Builder Automation Setup ($499), and TRL Transformation / Founder OS ($1,297) as the initial offer staircase.
- **Consequence:** Do not invent additional prices or claims without approval.

## D-003 — Public contact details

- **Date:** 2026-09-17
- **Status:** Founder-approved operating brief
- **Decision:** Use WhatsApp +92 3190091457 and officialtrlservice@gmail.com as the approved public contact details.
- **Consequence:** Do not substitute legacy or invented contact information.

## D-004 — No public launch yet

- **Date:** 2026-09-17
- **Status:** Operating constraint
- **Decision:** Prepare for deployment, but do not change DNS, purchase services, or launch publicly without founder approval.

## D-005 — Phase 1 stack is Astro with static output and one server endpoint

- **Date:** 2026-09-17
- **Status:** Founder-approved in session (Gate 1)
- **Decision:** Build the public site with Astro and TypeScript, plain CSS with design tokens, and a single server endpoint for the contact form.
- **Why:** Phase 1 is a content site with one interactive path; Astro ships near-zero client JavaScript, keeps the security and maintenance surface small, and stays portable across hosts (MIT-licensed with multiple deployment targets).
- **Consequence:** Interactive product features (dashboards, accounts) are out of scope and would be separate applications. Rejected alternatives: Next.js, plain HTML/CSS/JS, WordPress. Exact version and dependency set are pinned at the Gate 3 scaffold.

## D-006 — Hosting direction is Cloudflare Pages

- **Date:** 2026-09-17
- **Status:** Founder-approved in session (Gate 1); nothing deployed yet
- **Decision:** Target Cloudflare Pages for hosting, DNS, and HTTPS for the intended domain therightlifestyle.com.
- **Why:** The free tier permits commercial use (unlike, for example, Vercel's free Hobby plan, which is restricted to personal, non-commercial projects), and it consolidates hosting, DNS, and certificates in one place.
- **Consequence:** No account creation, DNS change, or deployment happens until the deployment gate with explicit founder authorization.

## D-007 — Contact form delivery is email to the approved address; no database

- **Date:** 2026-09-17
- **Status:** Founder-approved in session (Gate 1)
- **Decision:** Server-validated form submissions (with Cloudflare Turnstile and a honeypot) are emailed to officialtrlservice@gmail.com via the Resend transactional email API. No database or CRM storage in Phase 1.
- **Why:** The simplest honest pipeline; the inbox is the system of record; avoids the data-protection duties of storing PII.
- **Consequence:** Storage/CRM can be added later behind the same endpoint. Sender-domain verification (a DNS change) is deferred to the deployment gate; email-provider free-tier sending restrictions are verified at Gate 4 and recorded in `TRL_ARCHITECTURE.md`.

## D-008 — First release is the full core site

- **Date:** 2026-09-17
- **Status:** Founder-approved in session (Gate 1)
- **Decision:** The first release includes Home, About, Services, AI Solutions, Offers/Pricing, Contact, and Privacy/Terms structure.
- **Consequence:** No client accounts, CMS, database, payments, blog, or unearned social proof in the first release; all scope exclusions are recorded in `TRL_USER_JOURNEYS.md`.

## D-009 — Visual direction is quiet authority

- **Date:** 2026-09-17
- **Status:** Founder-approved in session (Gate 2)
- **Decision:** Use a quiet-authority, light-first visual system with a text-only `TRL / The Right Lifestyle` wordmark and purpose-built abstract systems graphics.
- **Why:** This direction supports the premium, minimal, precise, trustworthy positioning without presenting TRL as a loud AI novelty brand or inventing an unapproved identity symbol.
- **Consequence:** Gate 3 implements the Newsreader/Manrope typography direction, warm-ivory/deep-ink/restrained-blue semantic palette, accessible components, and interaction rules defined in `TRL_DESIGN_SYSTEM.md`. Do not introduce a logo symbol, dark-first theme, stock/synthetic business photography, fabricated interfaces/data, neon effects, or AI visual clichés without founder approval. Font files are self-hosted with license files and no third-party runtime font request.

## D-010 — The Gate 3 site ships with zero client JavaScript

- **Date:** 2026-09-17
- **Status:** Implementation decision (Gate 3), consistent with D-005
- **Decision:** No route ships a client script bundle. The primary navigation is a plain list that fits at every tested width, so no mobile menu toggle was built; the only inline script is the JSON-LD data block.
- **Why:** D-005 chose Astro precisely for a near-zero JavaScript surface. A menu toggle would have added focus management, an Escape handler, and a no-JavaScript fallback to maintain, for six navigation items that already fit.
- **Consequence:** If navigation grows past what fits comfortably, the progressively enhanced menu specified in `TRL_DESIGN_SYSTEM.md` is the documented way to add it. Any future client script must justify itself against this baseline.

## D-011 — The contact form ships disabled until its endpoint exists

- **Date:** 2026-09-17
- **Status:** Implementation decision (Gate 3)
- **Decision:** `/contact/` renders the approved enquiry structure inside a `disabled` fieldset, above it a notice stating that submissions are not being accepted, and above that the working email and WhatsApp channels.
- **Why:** The design system forbids rendering inactive controls as if they work, and the endpoint is Gate 4 work. The alternatives — hiding the form, or shipping a form that silently discards input — were rejected as less honest.
- **Consequence:** Gate 4 removes the `disabled` attribute and the notice as part of wiring the endpoint, and adds the accessible error-summary, per-field error, and success-state behaviour. The e2e and unit suites currently assert the disabled state, so those assertions must be replaced rather than deleted.

## D-012 — Border token darkened to #6F7F89 for non-text contrast

- **Date:** 2026-09-17
- **Status:** Token-level accessibility correction (Gate 3)
- **Decision:** `--color-border` changes from the Gate 2 value `#7C8C96` to `#6F7F89`.
- **Why:** Implementation testing recomputed every pairing actually used, not only the ones listed at Gate 2. `#7C8C96` on the muted surface `#ECE8DE` gives 2.84:1, below the 3:1 WCAG 2.2 non-text threshold, and the same failure applied on the soft-accent surface. `#6F7F89` gives 4.14:1 on white, 3.77:1 on canvas, 3.41:1 on soft accent, and 3.38:1 on the muted surface.
- **Why this needed no founder approval:** `TRL_DESIGN_SYSTEM.md` states that token-level accessibility corrections preserving the four confirmed directions do not require confirmation. The change is a small darkening within the same desaturated blue-grey and does not alter the quiet-authority, light-first, text-wordmark, or abstract-graphics direction.
- **Consequence:** `TRL_DESIGN_SYSTEM.md` is updated with the new value and the recalculated ratios. `tests/unit/design-tokens.test.ts` now asserts every pairing the interface actually uses against its threshold, so this class of gap fails in CI rather than at review.

## D-013 — Legal pages ship as labelled, noindex drafts

- **Date:** 2026-09-17
- **Status:** Implementation decision (Gate 3); final text remains a founder/legal decision
- **Decision:** `/privacy/` and `/terms/` publish a truthful description of current practice, each opening with a visible "Draft — pending legal review" notice stating that no effective date is set. Both carry `noindex, follow` and are excluded from the sitemap.
- **Why:** D-008 includes the legal pages in scope, and the site needs a truthful privacy description because visitors send personal data by email. Inventing finished policy text, or shipping empty placeholders labelled as policy, were both rejected.
- **Consequence:** The drafts state only what is verifiably true today — no analytics, no tracking cookies, self-hosted fonts, no database, inbox as system of record. Approved legal text replaces them before launch, and the `noindex` directive and sitemap exclusion are removed at that point.

## D-014 — The contact endpoint is a server-rendered `/contact/` route on the Cloudflare adapter

- **Date:** 2026-09-17
- **Status:** Implementation decision (Gate 4), within the founder-approved D-005/D-006 direction
- **Decision:** `/contact/` becomes the single server-rendered Astro route (`prerender = false`, `@astrojs/cloudflare` 14.3.2 with `wrangler` 4.133.0); every other route stays prerendered. The page handles GET (render the form) and POST (process the submission) with no client-side script; all submission logic lives in the pure module `src/lib/contact.ts`. Success redirects (`303`) to a static, noindex `/contact/sent/` page.
- **Why:** Accessible server-rendered errors — an error summary that takes focus, per-field errors, preserved input — require the server to re-render the form, which rules out keeping `/contact/` static with a separate API route. The adapter compiles the route into the deployment the founder already approved: Cloudflare. The concrete platform is Workers with static assets, because by 2026 Cloudflare steers new full-stack projects there rather than to classic Pages (Pages remains supported but maintenance-mode); the Astro 7 adapter targets Workers, which keeps one build, one deploy, and the same free-tier posture.
- **Consequence:** Static assets now build to `dist/client/` with the server entry in `dist/server/` (unit tests read `dist/client/`); `/contact/` no longer appears as static HTML, so its structure is asserted by the browser suite instead. Deployment configuration (account, custom domain, variables) remains Gate 6 work under D-004/D-006 — this decision changes the target shape, not the approval to deploy. Recorded for founder review as a refinement of D-006's "Cloudflare Pages" wording, not a change of vendor.

## D-015 — The Turnstile script is the one sanctioned third-party client script

- **Date:** 2026-09-17
- **Status:** Implementation decision (Gate 4), consequence of founder-approved D-007
- **Decision:** `/contact/` loads Cloudflare's Turnstile script from `challenges.cloudflare.com`. It is the only third-party client script on the site; no page ships any first-party client JavaScript, keeping D-010 intact for everything else.
- **Why:** Turnstile cannot issue a verification token without its script, and spam protection on the enquiry form was approved at Gate 1 (D-007). Rejecting the script would have meant rejecting Turnstile itself.
- **Consequence:** The no-third-party-runtime-request guarantee is now "everywhere except `/contact/`, which may reference only `challenges.cloudflare.com`" — asserted by tests in both suites. The Gate 5 Content Security Policy must allow `script-src` and `frame-src` from that origin. The privacy draft discloses the widget and its functional cookies. The form degrades honestly without JavaScript: a `<noscript>` message points visitors to WhatsApp and email.

## D-016 — No delivery-mock backdoor in the endpoint; e2e proves the pipeline to the delivery boundary

- **Date:** 2026-09-17
- **Status:** Implementation decision (Gate 4)
- **Decision:** The endpoint has no test mode, mock flag, or configurable delivery URL. Automated coverage is split: unit tests verify the full delivery contract (payload, reply-to, credentials, every failure branch) against injected fakes; the browser suite runs against a server with Turnstile test keys and no delivery configuration, so a valid submission exercises the entire real pipeline and ends in the honest generic failure state. Real email delivery is verified manually with real credentials in a deployed preview, never in CI.
- **Why:** A Playwright run cannot intercept the server's own outbound requests, so "mocked delivery in e2e" would have required an environment-reachable switch that skips or redirects delivery — a backdoor whose worst-case misconfiguration is silently discarding visitors' messages or exfiltrating them to a third party. That contradicts the security baseline (generic errors, no internal controls in production paths) and the project's no-inactive-controls rule. The chosen split tests everything real except the one call that requires real credentials.
- **Consequence:** The e2e "valid submission" test asserts the failure state rather than a success page; the success redirect is still e2e-covered through the honeypot path (which returns the identical user-facing outcome). Cloudflare's published dummy Turnstile keys make the verification half fully testable without any account. A founder/ops checklist item is created for the deployment gate: send and receive one real enquiry end-to-end before launch.

## D-017 — The e2e suite replaces the Turnstile widget in the browser only; server-side verification stays real

- **Date:** 2026-09-17
- **Status:** Implementation decision (Gate 4 follow-up), refinement of D-016
- **Decision:** The browser suite serves a local stub in place of `challenges.cloudflare.com/turnstile/v0/api.js` through Playwright request interception. The stub reproduces only the contract the form depends on: a hidden `cf-turnstile-response` input inside the form, carrying a token. Server-side verification is **not** stubbed — the preview still calls Cloudflare's real `siteverify` with the published dummy secret. No production code changed to enable this.
- **Why:** Measured on a CI runner, not assumed: `api.js` loads (302 → 200), `window.turnstile` exists, yet the widget never renders into `.cf-turnstile` — 0 child elements, 0 iframes, 0 token inputs. The real widget is therefore not dependable in CI, and a suite that waits on it cannot pass. Unlike the delivery call, the widget is a *browser rendering* concern, not part of the submission pipeline, so substituting it does not weaken what the suite proves: the server still receives a token and still verifies it against the real Cloudflare endpoint. (The same diagnostic showed an arbitrary token passes against the dummy secret — its POST reached the delivery boundary with 503 rather than being rejected with 403.)
- **Consequence:** D-016's split is unchanged in spirit: everything real except the one thing that cannot run unattended. The stub lives in test code only (`tests/e2e/fixtures/turnstile-stub.js`), so there is no environment switch to misconfigure. The real widget's behaviour — rendering, sizing, and the `compact` size choice for the 320px reflow floor — is **not** covered by automation and joins the deployment-gate manual checklist alongside the real-delivery check.

## D-018 — Response-security headers: a dual-write CSP with the one sanctioned Turnstile exception

- **Date:** 2026-09-17
- **Status:** Implementation decision (Gate 5), consequence of D-005/D-014/D-015
- **Decision:** Security headers and the Content Security Policy are applied at the deployment boundary the architecture actually has — Cloudflare Workers **with static assets**. Because static assets are served by the ASSETS binding *before* Worker code runs, there are exactly two writing paths, kept in lock-step by a single module plus tests:
  1. `public/_headers` (copied to `dist/client/_headers` at build) carries the common headers and the **static-pages CSP** to every static response — the eight prerendered routes, `/contact/sent/`, fonts, CSS, robots, sitemap. Static pages ship no client JavaScript (D-010), so this CSP says `script-src 'none'` and thereby makes the baseline mechanically enforceable by the browser. The JSON-LD block is a data block and is unaffected.
  2. `src/middleware.ts` sets the **contact CSP** on Worker-rendered responses (`/contact/` GET/POST/errors) — the only difference being D-015's sanctioned exception: `script-src` and `frame-src` from `https://challenges.cloudflare.com`. The `_headers` file does not apply to Worker responses, so the header must be (and is) set in code.
- **Why two paths:** the platform's own, verified mechanics. Cloudflare documents that `_headers` rules are applied to static-asset responses and **not** to responses generated by Worker code; the adapter's handler confirms static assets never reach the middleware. Attempting a single path would produce either missing headers on `/contact/` (if only `_headers`) or an unimplementable "Worker header on static files" (the Worker never runs for them). The common policy lives in `src/lib/security.ts` and a unit test pins the `_headers` mirror to it, so the duplication cannot drift.
- **Why the chosen composition:** the user-facing surface has no first-party script, no third-party runtime request except Turnstile, no iframes, no media, and inline styles only from Astro's scoped component `<style>` blocks — hence `script-src 'none'` (static) / the single Turnstile host (contact), `style-src 'self' 'unsafe-inline'`, `img-src`/`font-src`/`connect-src`/`form-action 'self'`, `base-uri 'self'`, `object-src 'none'`, and `upgrade-insecure-requests`. `X-Frame-Options` and `frame-ancestors` pinning (which has no `default-src` fallback, so framing remains unrestricted while absent) plus HSTS are **deliberately held for the deployment gate** as platform-level rules: the Arena preview harness embeds the site cross-origin (a pinning header would break the live preview), and HSTS is only meaningful once the final HTTPS domain exists — turning it on early, on a wrong or temporary host, would lock a bad decision into browsers (D-004/D-006).
- **Consequence:** `src/pages/contact.astro` no longer adds its Turnstile headers to responses (the middleware does it, once, for every Worker response); `public/_headers` is a committed, tested mirror; `src/lib/security.ts` is the single source of truth; unit tests (`tests/unit/security-headers.test.ts`) and e2e assertions (`tests/e2e/content.spec.ts`) cover both paths; `TRL_SECURITY.md`, `TRL_ARCHITECTURE.md`, `TRL_DEPLOYMENT.md` and the Gate 5 gate plan reflect the change. The deployment gate gains the framing/HSTS platform rules.
