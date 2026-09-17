# TRL — User Journeys and Release Scope

_Recorded at Gate 1 on 2026-09-17. Release scope confirmed by the founder in session (D-008)._

## Personas

- **Prospect — business owner.** Time-poor owner or founder of a small business, skeptical of AI hype, wants concrete time and cost outcomes rather than tools.
- **Prospect — solo operator.** Freelancer or one-person team overloaded with manual work, budget-conscious, likely to start with the Micro Audit.
- **Founder (internal).** Rashid Muhammad Amir, receiving and qualifying inquiries at officialtrlservice@gmail.com and on WhatsApp +92 3190091457.

## Release scope — first release

Included:

1. Public marketing site: Home, About, Services, AI Solutions, Offers/Pricing, Contact.
2. Legal pages: Privacy and Terms (structure only until approved legal text exists).
3. Inquiry capture: a server-validated contact form delivered by email to the approved address, plus a persistent WhatsApp click-to-chat option.
4. Payment-ready offer presentation: each approved offer has a clear call to action that can later point to a payment link; no payment provider is integrated in this release.
5. SEO foundations: per-page metadata, semantic HTML, sitemap.xml, robots.txt, and one canonical production domain.

Deliberately excluded from the first release:

- Client accounts, dashboards, or logins.
- CMS or admin panel (content changes go through the repository).
- Database or CRM storage of inquiries (the founder's inbox is the system of record).
- On-site payment processing.
- Blog, case studies, testimonials, or any social proof that does not yet exist.
- A live AI assistant demo on the site (possible future addition; requires founder approval and a funded API account).
- Analytics (open decision; revisited at Gate 5).

## Journeys

### J1 — Discover and understand (primary path)

- **Entry:** search engine, WhatsApp/social referral, or direct link to the home page.
- **Steps:** Home → positioning ("business systems that give owners their time back") → Services → offer staircase → Contact.
- **The system must:** communicate the positioning within seconds, describe services truthfully, show the three approved offers with real prices, and never imply customers or results that do not exist.
- **Exit:** inquiry form submission or a WhatsApp conversation.

### J2 — Quick contact (low-friction path)

- **Entry:** any page.
- **Steps:** tap the persistent WhatsApp affordance → pre-filled opening message → chat with the founder.
- **The system must:** keep the approved WhatsApp number visible and clickable everywhere, use the approved number exactly, and avoid publishing a response-time promise unless the founder commits to one.
- **Exit:** WhatsApp thread.

### J3 — Choose an offer (commercial path)

- **Entry:** Home page or Offers page.
- **Steps:** compare Micro Audit / Builder Automation Setup / Transformation → select one → inquiry form pre-selected with that offer (or a WhatsApp deep link naming it) → founder replies, scopes, and sends payment details manually.
- **The system must:** state the price, deliverables, inclusions and exclusions, and the next step for each offer, using approved pricing only.
- **Exit:** paid engagement scheduled.

### J4 — Credibility check (trust path)

- **Entry:** About page, from any point of doubt.
- **Steps:** read who is behind TRL and what TRL is and is not → confirm real contact channels → return to J1 or J3.
- **The system must:** present the founder identity truthfully, be explicit that TRL is a new firm, and avoid all fabricated history, testimonials, or statistics.
- **Exit:** renewed journey toward inquiry.

### J5 — Founder operations (internal path)

- **Trigger:** an inquiry email or WhatsApp message arrives.
- **Steps:** qualify (fit, budget, timeline) → respond from official channels → scope → agree terms → deliver → request honest feedback; collect public proof only when it genuinely exists.
- **The system must:** deliver a structured inquiry email (name, contact, optional phone/business, service of interest, message) that can be answered by replying directly.

## Contact form specification (Phase 1)

| Field | Required | Rules |
| --- | --- | --- |
| Name | yes | sensible length limit |
| Email | yes | valid email format; used as reply-to |
| Service of interest | yes | select: Micro Audit, Builder Automation Setup, Transformation / Founder OS, General inquiry |
| Message | yes | minimum and maximum length; plain text only |
| WhatsApp / phone | no | optional contact alternative |
| Business name | no | optional context |
| Honeypot | hidden | must remain empty; submissions that fill it are rejected silently |

Server-side behavior (Turnstile verification, validation, length limits, generic errors, no storage, no PII in logs) is specified in `TRL_ARCHITECTURE.md` and `TRL_SECURITY.md`.
