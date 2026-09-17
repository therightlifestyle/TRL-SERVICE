# TRL — Security Baseline

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

## Release checks

Before launch, verify no secrets are present in tracked files or frontend bundles, public endpoints reject invalid input, security headers are present, dependency checks are clean or documented, and error responses do not expose internals.
