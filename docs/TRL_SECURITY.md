# TRL — Security Baseline

_Last updated: 2026-09-17._

## Current status

No application or public endpoint exists yet. This is a baseline for implementation, not a claim that security controls are already deployed.

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

## Selected controls (Gate 1 architecture)

The following concrete controls implement the baseline above once code exists:

- Server-side validation in the single form endpoint (an Astro server endpoint on Cloudflare Pages); client-side validation is an enhancement only.
- Cloudflare Turnstile plus a honeypot on the form, with platform-level abuse protection on the Cloudflare account.
- Security headers (including a deliberate Content Security Policy) via deployment configuration; Astro's built-in CSP support is evaluated at implementation.
- Secrets only as encrypted environment variables in the hosting platform — never in the repository, bundles, or logs.
- Generic user-facing errors; no stack traces or internal details in responses.
- A committed lockfile with automated dependency and vulnerability checks in CI.
- No PII in logs; inquiries exist only in the founder's inbox, so there is no application data store to back up or breach.

## Release checks

Before launch, verify no secrets are present in tracked files or frontend bundles, public endpoints reject invalid input, security headers are present, dependency checks are clean or documented, and error responses do not expose internals.
