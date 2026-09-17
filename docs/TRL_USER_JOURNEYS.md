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

## Founder operations workflow — qualification to repeat (Gate 4)

This is the internal operating procedure the site's business flow is built around. It describes what the founder actually does with an enquiry; the site's job is to make steps 1–2 effortless and to never contradict the rest. It is an internal plan, not a public claim — nothing here is published as a promise unless the founder chooses to make it one.

1. **Capture.** The enquiry arrives as a structured email (form submission, with reply-to set to the sender) or a WhatsApp message. The inbox is the system of record; nothing is retyped into a CRM because none exists (D-007).
2. **Qualify — within one working session where possible.** Read for the three signals: fit (is it really a workflow/automation problem TRL can solve), budget (does the likely scope match an offer in the staircase, or is it a general conversation), and timeline (is there a real deadline). The Micro Audit exists precisely for cases where fit is uncertain.
3. **Respond honestly.** Reply from the official address or WhatsApp number only. If it is not a fit, say so and, where useful, suggest what would actually help. No response-time promise exists on the site, so none is broken by taking the time a real answer needs.
4. **Scope in writing.** Before any payment, send the scope: what will be done, the deliverables, the exclusions, and the price from the approved offer. The offers page is the reference; never quote an unapproved price (D-002).
5. **Payment.** For now, payment details are sent manually after scope agreement (bank transfer / the founder's chosen method). No payment provider is integrated on purpose (D-008); offer CTAs remain payment-ready for when the founder authorizes one.
6. **Deliver.** Execute the agreed scope with the defined correction window after handover. Build in tools the client owns or approves; hand over documentation.
7. **Proof.** After delivery, ask for honest feedback. Publish testimonials, case studies, or outcomes only when they genuinely exist and the client agrees — the site currently and deliberately shows none.
8. **Referral and repeat.** A satisfied client is the only marketing channel Phase 1 relies on. Ask directly whether they know someone with the same bottleneck, and propose the next step up the offer staircase (Micro Audit → Builder → Transformation) only when the client's actual situation calls for it.

The enquiry email's subject line (`Website enquiry (service) from name`) and reply-to header are designed for step 2: triage from the inbox preview and answer with a normal reply.

## Contact form specification (Phase 1 — implemented at Gate 4)

| Field | Required | Rules (enforced server-side) |
| --- | --- | --- |
| Name | yes | trimmed; 1–120 characters |
| Email | yes | trimmed; valid format; ≤200 characters; used as the reply-to |
| Service of interest | yes | one of the three approved offers or "General enquiry" |
| Message | yes | trimmed; 20–4,000 characters; newlines allowed, other control characters rejected |
| WhatsApp / phone | no | ≤40 characters; digits, spaces, and `+ ( ) - .` only |
| Business name | no | trimmed; ≤120 characters |
| Honeypot (`website`) | hidden | must remain empty; filled submissions are silently accepted-and-discarded |

Behaviour: the form POSTs same-origin to `/contact/`; Astro's `checkOrigin` rejects foreign origins; the server checks honeypot → Turnstile → validation → delivery in that order; failures render accessible errors with all input preserved; success redirects to `/contact/sent/`; nothing is stored; logs carry outcome events only. See `TRL_ARCHITECTURE.md` and `TRL_SECURITY.md` for the full contract.
