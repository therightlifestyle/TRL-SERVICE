# TRL — The Right Lifestyle

Phase 1 foundation for TRL's professional AI automation and business-systems services.

## Current status

Gates 0–4 are complete. The core website is built on the founder-approved design system, and the contact form is live in code: `/contact/` is a server-rendered route that validates submissions (honeypot, Cloudflare Turnstile, server-side rules) and delivers them by email through Resend with accessible error states and preserved input.

Nothing is deployed, and no hosting, email, or domain account exists — so delivery with real credentials is verified at the deployment gate. Locally and in CI the form runs against Cloudflare's published dummy Turnstile keys. Gate 5 — Production Hardening is next. Permanent project context and the execution plan live in [`docs/`](./docs/).

## Running the site locally

Requires Node.js 22 (see `.nvmrc`), plus a POSIX shell for the e2e server command.

```bash
npm ci                        # install exactly the committed lockfile
cp .dev.vars.example .dev.vars  # local runtime vars: dummy Turnstile keys, no delivery
npm run dev                   # local development server (reads .dev.vars)
npm run build                 # production build: static pages in dist/client/, server in dist/server/
npm run preview               # serve the production build in the workerd runtime
```

`.dev.vars` is gitignored and is overwritten by every Playwright run — never put real credentials in it (see `.dev.vars.example`). An unset `PUBLIC_TURNSTILE_SITEKEY` renders the form visibly disabled with a notice, which is the honest state for an unconfigured deployment.

## Checks

```bash
npm run typecheck   # astro check
npm run test:unit   # content invariants, tokens/contrast, axe over the build, validation + endpoint pipeline
npm run test:e2e    # Playwright: navigation, content, accessibility, and the real contact-form flow
```

The e2e suite needs downloadable browser binaries and network access to Cloudflare's Turnstile; it runs on CI, which forces the same dummy-key environment via `.dev.vars`.

CI runs all of the above plus a dependency audit on every pull request
([`.github/workflows/ci.yml`](./.github/workflows/ci.yml)).

## Where things live

| Path | Contents |
| --- | --- |
| `src/lib/site.ts` | Founder-approved facts: contact details, offers, prices, services |
| `src/lib/contact.ts` | The whole submission pipeline as pure, unit-tested logic |
| `src/styles/tokens.css` | The single source of design token values |
| `src/components/` | Accessible component primitives (incl. field, error summary) |
| `src/pages/` | The routes — `/contact/` is the one server-rendered endpoint |
| `tests/` | Unit and end-to-end suites |
| `docs/` | Project memory and the execution plan |

## Start with the project memory

- [Master Context](./docs/TRL_MASTER_CONTEXT.md)
- [Operating State](./docs/TRL_OPERATING_STATE.md)
- [User Journeys and Release Scope](./docs/TRL_USER_JOURNEYS.md)
- [Architecture](./docs/TRL_ARCHITECTURE.md)
- [Design System](./docs/TRL_DESIGN_SYSTEM.md)
- [Decisions](./docs/TRL_DECISIONS.md)
- [Phase 1 Plan](./docs/TRL_PHASE_1_PLAN.md)
- [Security](./docs/TRL_SECURITY.md)
- [Deployment](./docs/TRL_DEPLOYMENT.md)
- [Changelog](./docs/TRL_CHANGELOG.md)
- [Session Handoff](./docs/TRL_SESSION_HANDOFF.md)

## Operating principles

Build a smaller real system rather than a giant fake prototype. Inspect before changing, keep public claims truthful, never commit secrets, test before declaring completion, and preserve project state in the repository.
