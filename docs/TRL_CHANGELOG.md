# TRL — Changelog

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
- No accounts, credentials, DNS changes, deployments, payment integrations, or generated imagery were created.
