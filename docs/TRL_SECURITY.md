# TRL — Security Baseline

_Last updated: 2026-09-17 (Gate 5 complete — security headers/CSP, rate limiting, dependency review, performance/SEO audit, observability review all done)._

## Current status

The site and the contact endpoint exist in the repository; no deployment exists. The controls below marked "in place" are implemented and tested in CI, not verified in production — nothing has been deployed.

### Implemented at Gate 3

- No first-party client JavaScript on any route, and no third-party runtime requests except the sanctioned Turnstile script on `/contact/` (D-015). Unit and e2e tests assert the external-reference allowlist on every page.
- No cookies, analytics, or tracking of any kind — and that is now a decision rather than only a description: no analytics provider ships in Phase 1 (D-019, founder-decided at Gate 5), so the CSP's `script-src 'none'` on static pages stays absolute. (Turnstile's own functional cookies are disclosed on the privacy page.)
- No secrets in the repository. `.env` and `.dev.vars` are gitignored; `.env.example` and `.dev.vars.example` carry names, comments, and — for the latter — Cloudflare's published dummy Turnstile keys only.
- A committed lockfile installed with `npm ci` in CI, plus a dependency-audit job that fails on a high-severity advisory in production dependencies.

### Implemented at Gate 4 (contact endpoint)

- **Same-origin enforcement:** Astro's built-in `checkOrigin` (on by default) rejects form POSTs with a missing or foreign `Origin` before endpoint logic runs. Verified by e2e tests for both the missing and the mismatched `Origin` cases.
- **Server-side validation:** every field validated, trimmed, and length-limited on the server (`src/lib/contact.ts`); the browser's native validation is deliberately bypassed (`novalidate`) so the server is the only authority. The full boundary matrix is unit-tested.
- **Honeypot:** a hidden `website` field checked before any network call; filled honeypots receive the success redirect while nothing is processed — no signal, no cost.
- **Turnstile:** server-side token verification via `siteverify`, fail-closed on missing secret, missing token, rejected token, or network error.
- **Fail-closed delivery:** missing Resend configuration, a rejected send, or a network error all produce the same generic `503` state with preserved input — the visitor never loses their message and never learns internals.
- **Method and content-type discipline:** non-GET/HEAD methods get `405` with an `Allow` header; non-form bodies get `415`; unparseable bodies get `400`.
- **No PII in logs:** one structured outcome event per request (outcome, reason, request id) and nothing else; a unit test asserts no submitted value, credential, or token ever appears in a log line.
- **Injection resistance:** all re-rendered values pass through Astro's HTML escaping; the email is plain text delivered as JSON to the Resend API (no SMTP headers to inject); phone numbers are character-class constrained; control characters are rejected.
- **No storage:** no database, no files, no session cookies for the form; the founder's inbox is the system of record (D-007).

### Implemented at Gate 5 (security headers and CSP)

- The single source of truth for response-security headers lives in `src/lib/security.ts` and is consumed in exactly the two places the Workers-with-static-assets boundary requires (D-018):
  - `public/_headers` (committed; copied to `dist/client/_headers`) applies `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, and the **static-pages CSP** to every static-asset response — `script-src 'none'` there makes the D-010 no-client-JavaScript baseline enforceable by the browser on the eight prerendered routes.
  - `src/middleware.ts` wraps every Worker-rendered response (`/contact/` and its errors/redirects) with the **contact CSP**, the one difference being D-015's sanctioned exception: `script-src` and `frame-src` from `https://challenges.cloudflare.com`. Cloudflare's `_headers` does not apply to Worker responses, which is why the header is set in code. One documented exception: a form POST rejected by Astro's built-in origin check (missing/foreign `Origin`) short-circuits before user middleware, so that bare 403 carries no custom headers — it has no content to harden.
- `tests/unit/security-headers.test.ts` pins the `_headers` mirror to the canonical module and asserts the policy structure; e2e asserts the delivered headers on both a static route and `/contact/`.
- The cache policy is part of the same file and is security-relevant in one direction: documents are deliberately **not** cached beyond revalidation (`public, max-age=0, must-revalidate`, ETag-verified), because a document served stale from a cache would reference a hashed stylesheet that no longer exists. Only content-hashed build output and the two font subsets are `immutable` (D-020). The catch-all rule must not set `Cache-Control`: `_headers` rules merge rather than override, and a duplicated `max-age` directive is treated as stale by RFC 9111 — the specific rules would be silently defeated. `tests/unit/security-headers.test.ts` pins all three rules.

### Reviewed at Gate 5 (dependency and observability)

- **Dependency review:** `npm audit` (full tree and production-only) reports 0 vulnerabilities. Three production dependencies, all exact-pinned; every installed package declares a licence. The only non-permissive licences (MPL-2.0 for `lightningcss`/`axe-core`, LGPL-3.0-or-later and Apache+LGPL+MIT for `@img/sharp*`, Python-2.0, BlueOak, CC0) sit in build/test tooling and were **verified absent from both shipped artifacts** — no `sharp`/`libvips`/`lightningcss` reference in the Worker bundle, and no JavaScript at all in `dist/client`. Full record: `TRL_GATE5_REVIEW.md`.
- **Observability:** Workers Logs are enabled in the generated deploy config. The contact endpoint emits one PII-free structured log line per request (outcome + reason + request id), which is enough to identify the stage that refused any enquiry inside the retention window. What is *not* covered — no push alert on `system-error`, no uptime check, plan-bounded retention (Free: 3 days), no client-side error signal — is listed with its mitigation in `TRL_GATE5_REVIEW.md`. The founder's inbox remains the system of record and the de facto alert (D-007).

### Still to implement

- Framing protection (`X-Frame-Options` / CSP `frame-ancestors`) and HSTS, held for the deployment gate as platform-level rules (D-018 note).
- Manual verification of real email delivery in a deployed preview before launch.

## Required controls for implementation

- Keep secrets in environment variables or managed secret storage; never commit them.
- Validate and constrain all contact/inquiry input on the server.
- Return generic user-facing errors and avoid leaking stack traces or internal details.
- Apply appropriate security headers, including a deliberate Content Security Policy where practical.
- Use same-origin or narrowly scoped CORS; do not open APIs broadly by default.
- Add rate limiting/abuse protection to public submission endpoints.
- Protect against injection, XSS, CSRF where applicable, and unsafe redirects.
- Avoid sensitive data in logs; define retention and access expectations for inquiries.
- Review dependencies and lockfiles before release.
- Add accessible form errors and do not rely on client-side validation alone.
- Define backup, deletion, and recovery behavior before storing operational data.

## Selected controls (Gate 1 architecture, now implemented unless noted)

- Server-side validation in the single form route (`/contact/`, D-014); client-side validation is an enhancement only.
- Cloudflare Turnstile plus a honeypot on the form, with platform-level abuse protection on the Cloudflare account (account-level protection: deployment gate).
- Security headers (including a deliberate Content Security Policy) — resolved at Gate 5 (D-018): dual-write via `public/_headers` for static responses and `src/middleware.ts` for Worker responses, both pinned to `src/lib/security.ts`.
- Secrets only as encrypted environment variables in the hosting platform — never in the repository, bundles, or logs.
- Generic user-facing errors; no stack traces or internal details in responses.
- A committed lockfile with automated dependency and vulnerability checks in CI.
- No PII in logs; inquiries exist only in the founder's inbox, so there is no application data store to back up or breach.

## Release checks

Before launch, verify no secrets are present in tracked files or frontend bundles, public endpoints reject invalid input, security headers are present, dependency checks are clean or documented, error responses do not expose internals, and one real enquiry has been sent and received end-to-end with production credentials.
