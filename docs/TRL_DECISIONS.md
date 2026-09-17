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
