# TRL — Deployment

_Last updated: 2026-09-17 (Gate 3)._

## Current status

No hosting account, domain change, DNS record, email-provider account, payment account, or production deployment has been configured. Nothing has been purchased or created.

The application now produces a deployable artifact: `npm run build` emits a static site to `dist/` (9 pages, plus `robots.txt`, the sitemap, the favicon, and the self-hosted fonts). It has never been uploaded anywhere. `PUBLIC_SITE_URL` overrides the canonical origin at build time; it defaults to `https://therightlifestyle.com`.

## Selected direction (founder-approved 2026-09-17, D-006)

- **Host:** Cloudflare Pages. The free tier permits commercial use (unlike Vercel's free Hobby plan, which is restricted to personal, non-commercial projects) and consolidates hosting, DNS, and HTTPS for the intended domain `therightlifestyle.com`.
- **Build:** Astro static output plus one server endpoint (a Cloudflare Pages Function) for the contact form. Gate 3 implemented the static half with `output: 'static'` and no adapter; the adapter/function arrangement is decided at Gate 4 when the endpoint is built. Build command `npm run build`, output directory `dist`.
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
