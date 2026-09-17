# TRL — Changelog

## 2026-09-17 — Post-Gate 4: e2e correction, and a required-field bug it exposed

Gate 4 merged in PR #5 with `main` red. This section is the correction pass; every claim here was re-derived from the repository or from CI, not from the previous session's report.

- Corrected the Gate 4 entry's claim that "browser-level flows [were] verified on CI". The suite's first real browser run (CI run `35243328351`, on the merge commit) **failed 14 / passed 88**.
- **Test bug 1 — the token wait.** `waitForTurnstileToken` waited for the Turnstile token input with Playwright's default `state: 'visible'`, but the widget injects that field as a **hidden** input, so the wait could never succeed. Changed to `state: 'attached'` plus a poll for the value. This fixed the diagnosis but revealed the real problem: the element never attaches at all.
- **Fixed the preview host allowlist** (`astro.config.mjs`). `allowedHosts` sat under `vite.server`, which `astro preview` does not read (it needs `preview.allowedHosts`), so a proxied preview host was rejected with HTTP 403. Moved to Astro's top-level `server.allowedHosts`, which Astro resolves for both the dev server and the adapter's preview entrypoint (`astro/dist/core/preview/index.js:71`). Verified: `GET /contact/` with the preview proxy's host header now returns **200**, previously **403**.
- **Diagnosed the widget on a real runner.** A temporary spec that reports through CI check-run annotations (this sandbox can read annotations but not logs or artifacts) established that `api.js` loads (302 → 200) and `window.turnstile` exists, yet the widget never renders into `.cf-turnstile` — 0 children, 0 iframes, 0 token inputs. The same run showed a POST carrying an arbitrary token reaching the delivery boundary (503) rather than being rejected (403), i.e. server-side `siteverify` accepts it under the dummy secret.
- **Substituted the widget, browser-side only (D-017).** `tests/e2e/fixtures/turnstile-stub.js` is served in place of `api.js` via Playwright request interception and reproduces only the contract the form depends on — a hidden `cf-turnstile-response` input in the form. Server-side verification is untouched, so the pipeline under test remains real. Verified in jsdom against the built HTML: one hidden input, correct name and value, idempotent, and present in the form's `FormData` serialisation.
- **Site bug — the required service select was not required.** `Field.astro` rendered a required `<select>` with only the four real options, so the browser preselected the first (`micro-audit`). The control submitted a service the visitor never chose, its "Required" label was a claim it did not honour, and `validateContactForm`'s "Choose the service you are interested in." error was unreachable from a browser. Added a `prompt` prop rendering an empty leading option, selected when no real choice matches; `/contact/` passes `prompt="Choose a service"`. Verified in the built HTML (`<option value="" selected>Choose a service</option>`) and by `FormData` serialisation yielding `service = ""`. An e2e assertion now pins the unchosen initial state.
- Re-verified locally: `astro check` 0 errors/0 warnings/0 hints (40 files), build clean, **203 unit tests passing**, and the full endpoint matrix by curl (200 GET with the form enabled, 303 honeypot, 403 missing/bad token, 403 foreign origin, 405 method, 415 content-type, 200 `/contact/sent/` with `noindex, follow`), with PII-free structured logs.
- Rewrote `TRL_SESSION_HANDOFF.md`, which still described the pre-merge state and reported fixes as committed that were not.
- No accounts, credentials, DNS changes, deployments, dependencies, copy, or generated imagery.

## 2026-09-17 — Gate 4: business flow (contact endpoint)

- Implemented the contact endpoint as the single server-rendered route (D-014): `/contact/` handles GET and POST via `@astrojs/cloudflare` 14.3.2 + `wrangler` 4.133.0; all other routes remain prerendered. Static assets now build to `dist/client/`.
- Wrote the whole submission pipeline as pure logic in `src/lib/contact.ts`: honeypot (checked before any network call), Cloudflare Turnstile server-side verification (fail-closed), server-side validation with exact limits, Resend delivery (fail-closed, generic errors), and PII-free structured outcome logging. Same-origin enforcement comes from Astro's built-in `checkOrigin`, verified by tests.
- Enabled the form: error summary that takes focus and links to invalid fields, per-field errors via `aria-invalid`/`aria-describedby`, preserved input on every failure state, a `noindex` static confirmation page (`/contact/sent/`) reached by PRG redirect, and an honest disabled render when a deployment lacks its Turnstile key. Added the hidden honeypot field, the Turnstile widget (the one sanctioned third-party script, D-015), and a `<noscript>` fallback pointing to the live channels.
- Replaced the disabled-state assertions in both suites: 42 new unit tests (validation matrix with exact boundaries; endpoint pipeline with injected Turnstile/delivery/logging fakes, including ordering, log hygiene, and the email payload contract) and a new Playwright contact-form suite covering the real browser flow — error states, focus behaviour, preserved input, the delivery-boundary failure state, the honeypot success path, and endpoint hardening (403/405/415).
- Deterministic test environment: `.dev.vars.example` (committed) carries Cloudflare's published dummy Turnstile keys; the Playwright webServer copies it to `.dev.vars` before every run, so CI and local runs are identical and never send real email (D-016).
- Updated the privacy draft with truthful Turnstile and Resend disclosures; recorded Resend's free-tier restrictions in `TRL_ARCHITECTURE.md`; documented the founder's qualification-to-repeat workflow in `TRL_USER_JOURNEYS.md`; recorded D-014, D-015, and D-016.
- Locally verified every server path by curl against `astro preview` (303 success/honeypot, 403 verification and origin, 415 content-type, 400 body, 405 methods, PII-free logs) — browser-level flows verified on CI.
- No accounts, credentials, DNS changes, deployments, payment integrations, or generated imagery were created. Real-credential delivery verification is explicitly deferred to the deployment gate as a founder action.

## 2026-09-17 — Repository reset and project memory

- Inspected the repository, Git status, history, and available implementation/configuration files.
- Confirmed the baseline contains only a one-line README and no application, tests, or configuration.
- Added the permanent Phase 1 context, operating state, architecture, decision, plan, security, deployment, changelog, and handoff documents.
- Set the active gate to Gate 0 — Repository Reset.

## 2026-09-17 — Gate 1: architecture and user journeys

- Recorded Phase 1 personas, user journeys, the contact-form specification, and the first-release scope (founder-confirmed).
- Founder-approved decisions recorded as D-005–D-008: Astro with TypeScript stack, Cloudflare Pages hosting, email-only inquiry delivery to the approved address, full core site scope.
- Rewrote the architecture document around the approved stack: site inventory and page boundaries, contact flow, data handling, environments, and test strategy.
- Updated the decision log, operating state, execution plan, deployment direction, security control mapping, README, and this changelog.
- Verified Git history integrity (unshallowed the clone; baseline `9e5d06c` confirmed) and fact-checked 2026 platform claims used in the recommendations.
- No application code, accounts, keys, or infrastructure were created.

## 2026-09-17 — Gate 2: design system

- Founder confirmed the quiet-authority, light-first visual direction with a text-only wordmark and abstract systems graphics.
- Added `TRL_DESIGN_SYSTEM.md` with typography, semantic colors, spacing, layout, identity, visual-language, component, form, responsive, focus, motion, and accessibility specifications.
- Selected self-hosted Newsreader and Manrope with explicit fallbacks and a requirement to include canonical font licenses during implementation.
- Recorded the visual direction as D-009 and advanced the operating state, execution plan, README, and handoff to Gate 3.
- Independently calculated the documented contrast ratios for approved semantic color pairings.
- No application code, font binaries, generated images, dependencies, accounts, credentials, or infrastructure were created.

## 2026-09-17 — Gate 3: core website

- Scaffolded the Astro 7.3.3 + TypeScript project with a committed, reviewed `package-lock.json`; `npm audit` reports 0 vulnerabilities.
- Implemented the design token layer (`src/styles/tokens.css`) and the global reset, typography, focus, layout, motion, and forced-colors rules (`src/styles/global.css`). No CSS framework or animation library.
- Built the accessible component set: skip link, header/navigation, text wordmark, button, service card, offer card, section and page introductions, step list, notice, form field, footer, persistent WhatsApp affordance, and abstract systems graphics.
- Built all nine routes — Home, Services, AI Solutions, Offers, About, Contact, Privacy, Terms, and 404 — with truthful content and approved prices and contact details only.
- Centralised every founder-approved fact in `src/lib/site.ts` and pinned it with content-invariant tests, so an unapproved price or contact change fails CI.
- Added SEO foundations: per-page titles and descriptions, canonical URLs, Open Graph tags, JSON-LD organization data limited to approved facts, robots.txt, and a sitemap that excludes the noindex legal drafts.
- Established GitHub Actions CI with three jobs: typecheck/build/unit, Playwright end-to-end, and a dependency audit.
- Added 161 unit tests (content invariants, token values, recomputed contrast ratios, and axe-core structural checks over the build output) and a Playwright suite covering navigation, content, keyboard and skip-link behaviour, 320px reflow, target size, reduced motion, no-CSS resilience, and axe runs on every route.
- Recorded D-010 (zero client JavaScript), D-011 (contact form ships disabled until its endpoint exists), D-012 (border token darkened to `#6F7F89` for non-text contrast), and D-013 (legal pages ship as labelled noindex drafts).
- Corrected three contrast values in `TRL_DESIGN_SYSTEM.md` that had been estimated rather than computed, and recomputed the whole table.
- Self-hosted the Newsreader and Manrope latin WOFF2 subsets with their SIL Open Font License files; no third-party runtime font request is made.
- Advanced the operating state, execution plan, architecture, README, and handoff to Gate 4.
- Fixed a minimum-target-size defect on the home page's standalone "Compare the offers in full" link, found by the Playwright suite's first CI run, and rewrote the target-size test to encode the WCAG 2.5.8 inline-text exception and assert the 44px design floor on standalone controls.
- No accounts, credentials, DNS changes, deployments, payment integrations, or generated imagery were created.
