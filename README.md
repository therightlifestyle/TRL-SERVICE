# TRL — The Right Lifestyle

Phase 1 foundation for TRL's professional AI automation and business-systems services.

## Current status

Gates 0–3 are complete. The founder-approved architecture, user journeys, release scope, and design system are recorded, and the core website is built: an Astro static site implementing the quiet-authority, light-first design system with a text-only wordmark and abstract systems graphics.

The contact form's submission endpoint is **not** built yet, so the form ships visibly disabled with an explanation; email and WhatsApp are the live channels. Nothing is deployed, and no hosting, email, domain, or payment account exists. Gate 4 — Business Flow is next. Permanent project context and the execution plan live in [`docs/`](./docs/).

## Running the site locally

Requires Node.js 22 (see `.nvmrc`).

```bash
npm ci          # install exactly the committed lockfile
npm run dev     # local development server
npm run build   # static production build into dist/
npm run preview # serve the production build
```

## Checks

```bash
npm run typecheck   # astro check
npm run test:unit   # content invariants, design tokens, contrast, axe over the build
npm run test:e2e    # Playwright: navigation, content, and accessibility in a browser
```

CI runs all of the above plus a dependency audit on every pull request
([`.github/workflows/ci.yml`](./.github/workflows/ci.yml)).

## Where things live

| Path | Contents |
| --- | --- |
| `src/lib/site.ts` | Founder-approved facts: contact details, offers, prices, services |
| `src/styles/tokens.css` | The single source of design token values |
| `src/components/` | Accessible component primitives |
| `src/pages/` | The nine routes |
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
