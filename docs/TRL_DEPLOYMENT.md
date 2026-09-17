# TRL — Deployment

_Last updated: 2026-09-17 (Gate 1 direction recorded)._

## Current status

No hosting account, domain change, DNS record, email-provider account, payment account, or production deployment has been configured. Nothing has been purchased or created.

## Selected direction (founder-approved 2026-09-17, D-006)

- **Host:** Cloudflare Pages. The free tier permits commercial use (unlike Vercel's free Hobby plan, which is restricted to personal, non-commercial projects) and consolidates hosting, DNS, and HTTPS for the intended domain `therightlifestyle.com`.
- **Build:** Astro static output plus one server endpoint (a Cloudflare Pages Function) for the contact form. The exact adapter/function arrangement is decided at the Gate 3 scaffold; content pages remain static.
- **Environment variables:** `PUBLIC_SITE_URL`, `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `RESEND_FROM_EMAIL` (names finalized at implementation), set as encrypted environment variables in the hosting platform and never committed.
- **Account, domain, and DNS ownership:** the founder. Account creation, DNS changes, and deployment happen only at the deployment gate with explicit founder authorization.

## Planned deployment documentation

Before a release is proposed, this file must document:

- required environment variables and the safe setup process;
- build and start commands;
- domain and HTTPS configuration steps;
- contact/inquiry delivery configuration, including email sender-domain verification;
- health checks and monitoring;
- backup and retention behavior;
- rollback and recovery procedure;
- staging/preview verification;
- launch approval checklist.

## Operational rule

Do not place credentials in this repository or request them in chat. Do not modify DNS, payment accounts, or production infrastructure without explicit founder authorization.
