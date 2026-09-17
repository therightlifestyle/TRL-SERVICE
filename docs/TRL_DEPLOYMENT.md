# TRL — Deployment

_Last updated: 2026-09-17 (Gate 6 — Deployment Readiness close: the planned
deployment documentation is now procedure. Build → configure → preview →
verify → deploy → smoke test → rollback, plus backup/recovery, domain/DNS
readiness, Cloudflare/Turnstile/Resend/rate-limit/platform-security checklists,
the GitHub Pages transition procedure, and a clear split between
repository-completable work and founder-only external actions. Nothing has
been deployed, and no credentials, accounts, or DNS changes exist.)_

## Current status

No hosting account, domain change, DNS record, email-provider account, payment
account, or production deployment has been configured. Nothing has been
purchased or created. In particular, **no Turnstile or Resend account exists**,
so the site's production keys are not yet obtainable; the endpoint is built,
tested against Cloudflare's published dummy keys, and ready for real
configuration.

The application now produces a deployable artifact: `npm run build` emits the
static site to `dist/client/` (8 prerendered routes plus `robots.txt`, the
sitemap, the favicon, and the self-hosted fonts) and the Workers server entry
to `dist/server/`, with the adapter-generated deploy config at
**`dist/server/wrangler.json`** (verified: it inherits the repository-root
`wrangler.jsonc`, carries `observability` through, and currently reads
`"ratelimits":[]` where the founder's binding will land). `.assetsignore` keeps
that config and `.dev.vars` out of the served assets. It has never been
uploaded anywhere. `PUBLIC_SITE_URL` overrides the canonical origin at build
time; it defaults to `https://therightlifestyle.com`.

## Selected direction (founder-approved 2026-09-17, D-006; platform shape refined at Gate 4, D-014)

- **Host:** Cloudflare. The concrete platform is **Workers with static assets**
  via `@astrojs/cloudflare` — by 2026 this is Cloudflare's recommended path
  for new full-stack projects and what the Astro 7 adapter targets; classic
  Pages remains supported but is in maintenance mode. Same vendor, same
  free-tier posture, one deployment for static pages and the `/contact/`
  endpoint. The founder approved "Cloudflare Pages" at Gate 1; this refinement
  is recorded for review in D-014.
- **Build:** `npm run build`. Output directory `dist/client` with the server
  entry alongside; the adapter emits the full deploy configuration itself.
- **Environment variables (runtime, set in the hosting platform, never
  committed):** `PUBLIC_TURNSTILE_SITEKEY`, `TURNSTILE_SECRET`,
  `RESEND_API_KEY`, `CONTACT_TO_EMAIL` (the approved address),
  `RESEND_FROM_EMAIL` (`onboarding@resend.dev` until the domain is verified —
  see the free-tier restrictions in `TRL_ARCHITECTURE.md`). Plus the build-time
  `PUBLIC_SITE_URL`. Local development uses `.dev.vars` copied from
  `.dev.vars.example` (dummy Turnstile keys, no delivery).
- **Account, domain, and DNS ownership:** the founder. Account creation, DNS
  changes, and deployment happen only at the deployment gate with explicit
  founder authorization.

---

## Repository-completable vs founder-only actions (Gate 6 split)

Gate 6 distinguishes work that **can be closed from inside this repository**
from work that **only the founder can do**. The repository work is recorded
below in procedure form; the founder work is listed at the end of this
document and remains a checkbox list, not a fake completion.

### Repository-completable (closed at Gate 6)

- [x] **Environment-variable inventory and safe configuration documentation**
      — see _Environment variables_ below and `.env.example` / `.dev.vars.example`.
- [x] **Production deployment procedure** — see _Deployment procedure_ below.
- [x] **Preview verification procedure** — see _Preview verification procedure_.
- [x] **Smoke-test procedure** — see _Smoke-test procedure_.
- [x] **Rollback procedure** — see _Rollback procedure_.
- [x] **Recovery procedure** — see _Recovery procedure_.
- [x] **Backup / repository recovery guidance** — see _Backup and repository recovery_.
- [x] **Domain / DNS readiness checklist** — see _Domain / DNS readiness_.
- [x] **Cloudflare deployment checklist** — see _Cloudflare deployment checklist_.
- [x] **Turnstile production-key checklist** — see _Turnstile production keys_.
- [x] **Resend production-email checklist** — see _Resend production email_.
- [x] **Rate-limit namespace configuration checklist** — see _Rate-limit
      namespace configuration_.
- [x] **Final platform security checklist (framing protection + HSTS)** —
      see _Final platform security checklist_.
- [x] **GitHub Pages / Jekyll transition procedure** — see _GitHub Pages
      transition_.
- [x] **Clear separation between repository-completable work and founder-only
      external account actions** — this section.

### Founder-only (cannot be closed from inside the repository)

- [ ] Create the Cloudflare account and connect the repository for deploys.
- [ ] Create the Turnstile widget for the production domain and set the
      real sitekey/secret as platform variables.
- [ ] Create the Resend account, set the API key, decide the from-address,
      verify the sending domain in Resend (DNS change).
- [ ] Verify the custom domain and HTTPS on `therightlifestyle.com` (DNS
      change).
- [ ] Provision the rate-limit `namespace_id` and uncomment the binding.
- [ ] Configure framing protection and HSTS as platform rules on the final
      HTTPS domain (D-018).
- [ ] Disable GitHub Pages (or switch its source to "GitHub Actions") in
      Settings → Pages. Then delete `_config.yml`.
- [ ] Send and receive one real enquiry end-to-end (D-016 manual verification).
- [ ] Run the rate-limit burst check on the real deployment.
- [ ] Decide on the optional `og:image` (no approved imagery exists; see
      `TRL_GATE5_REVIEW.md`).

---

## Environment variables

Runtime variables are read inside the Worker through
`import { env } from 'cloudflare:workers'`, never from `import.meta.env`, so a
deployment is configured entirely in the hosting platform — no values ever
ship in the repository or the bundles. The variables below are pinned by the
endpoint code in `src/lib/contact.ts` (it refuses with a generic 503 if any
required variable is missing).

| Variable | Scope | Required for | Default in dev | Purpose |
| --- | --- | --- | --- | --- |
| `PUBLIC_SITE_URL` | build | every deploy | `https://therightlifestyle.com` | Canonical production origin used in metadata, canonical URLs, and the sitemap. Set per environment. |
| `PUBLIC_TURNSTILE_SITEKEY` | runtime | form rendering | empty | Turnstile sitekey rendered into the contact form. An empty value renders the form visibly disabled with an explanatory notice — the honest unconfigured state. |
| `TURNSTILE_SECRET` | runtime | `POST /contact/` | empty | Turnstile secret used by server-side `siteverify`. Fail-closed if unset. |
| `RESEND_API_KEY` | runtime | email delivery | empty | Resend API key. Fail-closed if unset. |
| `CONTACT_TO_EMAIL` | runtime | email delivery | empty | The approved destination address (D-003: `officialtrlservice@gmail.com`). |
| `RESEND_FROM_EMAIL` | runtime | email delivery | empty | Sender address. `onboarding@resend.dev` until `therightlifestyle.com` is verified in Resend (DNS change — founder action). |

`.env.example` carries names and comments for the build-time variable; real
values are never committed. `.dev.vars.example` carries Cloudflare's published
dummy Turnstile keys and is the file the e2e suite copies from before every
run; `.dev.vars` is gitignored and overwritten by every Playwright run.

### Safe configuration rules

- Real values are set in the Cloudflare dashboard (or `wrangler secret put`,
  which writes to the same store); they are never in the repository, never in
  `.dev.vars`, and never pasted into chat.
- `.dev.vars` exists only for local `astro dev` and the Playwright suite. Both
  consume the dummy keys from `.dev.vars.example`; any real value in
  `.dev.vars` is a mistake to delete.
- CI does not use `.dev.vars` — the e2e job forces the dummy-key environment
  via the Playwright `webServer` command.

---

## Deployment procedure (build → configure → preview → verify → deploy → smoke test)

This is the order operations actually happen in. The founder runs each numbered
step; the agent runs only steps the repository owner can run.

### 1. Build (repository-owned)

```
npm ci
npm run typecheck
npm run test:unit
npm run build
```

Verifies the committed lockfile, runs `astro check` (zero errors expected),
runs the unit suite (241 tests expected to pass; the build-budget suite also
reads `dist/client/`), and emits `dist/client/` and `dist/server/`. No network
calls except the optional `npm audit` jobs on CI.

### 2. Configure (founder-only — hosting platform)

In the Cloudflare dashboard for the project:

- Add a Cloudflare Pages or Workers Builds connection to this repository.
- Set the build command to `npm ci && npm run build`.
- Set the build output directory to `dist` (Cloudflare reads both `dist/client`
  for the static assets and `dist/server` for the Worker entry through the
  adapter-generated `dist/server/wrangler.json`).
- Set the build-time environment variable `PUBLIC_SITE_URL` to the production
  origin (the staging/preview environment may set it to its own origin).
- Set the runtime secrets/variables in **Secret** mode for any value that
  should not be visible to other account users. `TURNSTILE_SECRET`,
  `RESEND_API_KEY`, and the production `CONTACT_TO_EMAIL` /
  `RESEND_FROM_EMAIL` belong in Secret mode; `PUBLIC_TURNSTILE_SITEKEY` is
  public by design and does not.
- Provision the rate-limit binding (see _Rate-limit namespace configuration_).
- Configure the platform security headers that the application code cannot
  safely ship (see _Final platform security checklist_).

### 3. Preview (founder-only — Cloudflare)

Every PR (and every push to `main`, depending on the Builds configuration)
produces a preview URL on `*.workers.dev` or `*.pages.dev`. The preview uses
the same variables as production, with one safe substitution: set
`PUBLIC_SITE_URL` to the preview origin so canonical URLs and the sitemap
match what the browser sees. Turnstile must be configured to accept the
preview origin, and Resend must deliver to the approved destination address
(do not change the destination for preview runs).

### 4. Verify (founder-only — manual)

Run through _Preview verification procedure_ below on the preview URL. If any
step fails, do not promote the build to production.

### 5. Deploy to production (founder-only — Cloudflare)

Promote the verified preview to the production branch. The Cloudflare deploy
configuration is the one the adapter generated at `dist/server/wrangler.json`;
the platform reads it directly, so the rate-limit binding and observability
settings travel with the deploy, not as platform toggles.

### 6. Smoke-test (founder-only — first real traffic)

Run through _Smoke-test procedure_ below on the production origin. If a step
fails, follow _Rollback procedure_.

---

## Preview verification procedure

Run on the preview URL, before promoting the build. Each step has an
expected outcome; if the outcome does not match, stop and treat the build as
unsuitable for production.

1. **HTTP status.**
   `curl -sSI https://<preview-host>/` answers `HTTP/2 200`. `curl -sSI
   https://<preview-host>/about/` answers `307` redirecting to
   `https://<preview-host>/about/index.html`. `curl -sSI
   https://<preview-host>/this-route-does-not-exist` answers `404`.

2. **Static-pages CSP.** `curl -sSI https://<preview-host>/` carries
   `Content-Security-Policy: default-src 'self'; base-uri 'self'; script-src
   'none'; ...` (the full policy from `src/lib/security.ts`). Confirm there
   is no `challenges.cloudflare.com` in this CSP — that exception belongs to
   `/contact/`.

3. **Contact-page CSP.** `curl -sSI https://<preview-host>/contact/` carries
   the same policy plus `script-src https://challenges.cloudflare.com` and
   `frame-src https://challenges.cloudflare.com`. The Turnstile exception
   appears in exactly these two directives.

4. **Cache policy.**
   `curl -sSI https://<preview-host>/fonts/newsreader-latin-500-normal.woff2`
   and `curl -sSI https://<preview-host>/fonts/manrope-latin-wght-normal.woff2`
   each carry **one** `Cache-Control: public, max-age=31536000, immutable`
   field. `curl -sSI https://<preview-host>/_astro/<hashed-css-file>` carries
   the same. `curl -sSI https://<preview-host>/` carries `public, max-age=0,
   must-revalidate`. Each response has **exactly one** `Cache-Control` field —
   not a merged duplicate. (D-020: a merged field with two `max-age`
   directives is treated as stale by RFC 9111 and silently defeats the
   specific rules.)

5. **Common security headers.** Every response carries
   `X-Content-Type-Options: nosniff`, `Referrer-Policy:
   strict-origin-when-cross-origin`, and `Permissions-Policy: camera=(),
   geolocation=(), microphone=()`.

6. **Form is enabled.** `/contact/` renders with no "not available on this
   deployment" notice, the Send button is active, and the Turnstile widget
   renders into `.cf-turnstile` (a visible checkbox/frame, not an empty box).

7. **Real Turnstile.** With the production sitekey, the widget accepts a
   solved challenge and the form submits. The browser DevTools console shows
   no blocked script or frame from `challenges.cloudflare.com`.

8. **Sitemap and robots.** `curl -sS https://<preview-host>/robots.txt`
   serves `Allow: /` plus the sitemap URL. `curl -sS
   https://<preview-host>/sitemap-0.xml` contains exactly the six indexable
   URLs (`/`, `/about/`, `/ai-solutions/`, `/contact/`, `/offers/`,
   `/services/`); the noindex pages are absent.

9. **404 page.** `curl -sS https://<preview-host>/404` (or any unknown
   route) returns the 404 HTML, which carries `noindex, follow` and is not
   in the sitemap.

---

## Smoke-test procedure

Run on the production origin within minutes of the deploy going live. Each
step is a real visitor action; each has an expected outcome.

1. **Home loads.** Browser visits `https://therightlifestyle.com/`. Page
   renders with no console errors, both font subsets paint without a flash of
   invisible text, and the visible CTAs work.

2. **Static routes load.** `/about/`, `/services/`, `/ai-solutions/`,
   `/offers/`, `/privacy/`, `/terms/`, and `/contact/sent/` all render.

3. **Contact form is enabled and accepts input.** `/contact/` renders the
   enabled form (no warning notice). All six fields accept input; the
   service select opens to four options including a leading "Choose a
   service" prompt.

4. **Honeypot is hidden and inert.** The hidden `website` field is present in
   the DOM but not visible; tabbing through the form does not reach it.

5. **Turnstile renders.** The Turnstile widget paints a visible checkbox/frame
   inside the fieldset. Solving it issues a token into the hidden
   `cf-turnstile-response` field. If the widget does not render, the
   deployment is broken — stop and roll back rather than ship a form that
   silently fails verification.

6. **Real enquiry end-to-end (D-016).** Submit the form with a real email
   address, a real message, and a solved Turnstile token. The visitor
   redirects to `/contact/sent/`. Within a minute, the email arrives in
   `officialtrlservice@gmail.com`, with `Reply-To` set to the submitted
   address and a subject of `Website enquiry (<service>) from <name>`. **This
   is the gate that proves real-credential delivery works** — until it has
   succeeded on the production domain, the form is not live.

7. **Workers Logs.** Cloudflare dashboard → Workers → Logs (or
   `wrangler tail`) records the accepted outcome with a `requestId`. The
   log line contains no submitted value, no token, and no IP.

8. **Cache headers on production.** Repeat preview step 4 against the
   production origin. The CDN's behaviour at the edge can differ from a
   preview.

---

## Rollback procedure

The site is two coupled artifacts (static pages + a Worker), but both roll
back together through Cloudflare's deployment list.

1. **Identify the last good deploy.** Cloudflare dashboard → Workers (or
   Pages) → the project → Deployments. The current deploy is the bad one;
   the previous deploy is the last good one. The `wrangler tail` output and
   Workers Logs both show the deploy id; the build commit is in the Git
   history.

2. **Roll back.** Either promote the previous deploy to production through
   the dashboard's "Rollback to this deploy" action, or redeploy the previous
   commit by re-running `npm run build` against the previous tree. The first
   is faster and keeps the build cache warm.

3. **Verify the rollback.** Re-run the smoke-test procedure against the
   rolled-back origin. The form should return to the disabled state (if
   `PUBLIC_TURNSTILE_SITEKEY` was lost in the rollback) or to working
   behaviour (if the rollback restored a working build).

4. **Investigate before re-deploying.** Read Workers Logs and the
   deployment-event log for the failed deploy. The endpoint emits one PII-free
   outcome line per request (`accepted`, `rejected-rate-limit`,
   `rejected-honeypot`, `rejected-turnstile`, `invalid`, `bad-request`,
   `system-error`); an unexpected run of `system-error` with reason
   `delivery-failed` or `unconfigured-delivery` points at the delivery
   configuration, not the code. Do not redeploy until the failure has a
   recorded cause.

5. **Document.** Record the rollback in the changelog (next section of this
   file) and in the session handoff. Keep the failed build's source intact
   until the cause is known.

### What rollback cannot undo

- **DNS changes.** A bad DNS record is not a deploy to roll back; it is a
  record to correct. Use Cloudflare DNS to revert any record added during
  the failed deploy.
- **Resend domain verification.** Removing a verified domain in Resend does
  not undo the DNS records Resend asked you to add. Plan the verification in
  advance so a rollback does not strand the DNS in an inconsistent state.
- **Rate-limit namespace.** A `namespace_id` once provisioned is permanent
  to the account. Rolling back a deploy does not delete it; rerunning the
  rate-limit burst check on the new deploy uses the same namespace.

---

## Recovery procedure

Recovery starts from a worse place than rollback: the production origin is
unreachable, the deploy pipeline is broken, or the platform account is
inaccessible. The procedure assumes the founder's account credentials and the
domain registrar credentials are intact.

1. **Static assets only.** `dist/client/` is a self-contained static site
   that renders on any host that serves files with the right MIME types and
   the headers in `public/_headers`. In an emergency it can be uploaded to
   any S3-compatible bucket, GitHub Pages (after the GitHub Pages transition
   below), Netlify, or a personal server. The site has no JavaScript and no
   client framework, so the static deployment is faithful: only the contact
   form becomes inert (no Worker = no POST handler), and the
   `<noscript>`-style fallback (the WhatsApp and email channels at the top of
   `/contact/`) keeps the page useful.

2. **Worker only.** The Worker entry is `dist/server/entry.mjs` plus its
   `chunks/`. Cloudflare deploys it through `dist/server/wrangler.json`. If
   only the Worker is broken and the static assets are fine, redeploy the
   previous Worker entry through `wrangler deploy` with the same `vars` and
   secrets.

3. **Account locked out.** Contact Cloudflare support through the email
   address on the account. While waiting, the static-asset recovery above
   keeps the marketing site live; only the form is broken.

4. **DNS lost.** Recover through the registrar. The `therightlifestyle.com`
   zone must be re-created with the same records the Cloudflare dashboard
   shows. The site's content is not affected by DNS recovery — the
   repository, the build artifact, and the Cloudflare configuration are
   independent of the live DNS state.

---

## Backup and repository recovery

The application is intentionally stateless — no database, no CRM storage, no
file uploads, no session cookies (D-007). There is no application data store
to back up. The system of record is the founder's inbox; deleting an enquiry
means deleting the email, and the privacy page states this.

What _does_ need to be preserved:

- **The repository itself.** GitHub is the source of truth. The founder's
  account is the only place all history lives. Recovery of the code base
  from GitHub's forks or a local clone is straightforward; recovery of the
  history (decisions, handoffs, audit trail in `docs/`) is the harder one.
  Periodic `git clone` mirrors to a personal machine are recommended.

- **The build artifact.** `dist/` after a successful build is reproducible
  from the committed lockfile; it does not need to be archived. If a deploy
  is broken in production and the previous build is not available through
  Cloudflare's deployment list, rebuilding from `main` reproduces it.

- **Secrets.** No secrets are committed (`.env`, `.dev.vars`,
  `.wrangler/`, `node_modules/.cache/` are all gitignored). The only record
  of a production secret is Cloudflare's encrypted secret store; recovery
  requires setting the secrets again through the dashboard or `wrangler
  secret put`.

- **The Cloudflare account configuration.** A second Cloudflare account is
  not created by this repository; the dashboard state (Workers Builds,
  custom domain, DNS, rate-limit binding, secrets, Transform Rules) lives
  only in the founder's account. Cloudflare does not export it; recovery
  requires re-entering each configuration through the dashboard. The
  repository-side source of truth (this document plus the checklist) makes
  that re-entry possible.

- **Resend account.** Recovery requires the founder to log into Resend and
  re-verify the sending domain (which re-adds the DNS records Resend asks
  for). The DNS records are documented in Resend's verification flow.

---

## Domain / DNS readiness checklist

Recorded for the founder to walk through once, with the option to repeat it
when something changes. None of these steps are runnable from the
repository.

- [ ] Domain `therightlifestyle.com` is registered to the founder and
      accessible through a registrar that lets the nameservers be changed.
- [ ] Nameservers are pointed at Cloudflare (the platform consolidates
      hosting and DNS).
- [ ] The Cloudflare account is created under the founder's email address
      and protected with a hardware key where the registrar supports it.
- [ ] The apex and `www` are added as Cloudflare DNS records pointing at
      the Workers (or Pages) project. The exact records the platform
      supplies are added verbatim.
- [ ] HTTPS is enforced on the apex and `www`. Cloudflare provisions the
      certificate automatically; verify the certificate is active before
      the first production deploy.
- [ ] The platform security headers (framing protection + HSTS — see _Final
      platform security checklist_) are configured as Cloudflare rules on
      the production zone. They are not in the application code (D-018).
- [ ] The contact form's Turnstile widget is restricted to the apex and
      `www` (Turnstile rejects token submissions from origins it has not
      been told about).
- [ ] Resend's domain verification DNS records are added to the zone only
      after the Resend account exists and asks for them — and only by the
      founder. The application does not need any of these records.

---

## Cloudflare deployment checklist

For the founder to confirm the platform configuration after the first
production deploy. The application code does not and cannot configure any of
these.

- [ ] Cloudflare account exists and the project is connected to this
      repository.
- [ ] Build command: `npm ci && npm run build`.
- [ ] Build output directory: `dist` (Cloudflare reads `dist/client` for
      static assets and `dist/server/wrangler.json` for the Worker entry).
- [ ] Compatibility date set to a recent value (the repository uses
      `2026-09-16`; Cloudflare accepts a future date without complaint, but
      not a past one).
- [ ] `observability: { enabled: true }` is in effect — visible in the
      generated `dist/server/wrangler.json` at build time and in the
      Workers dashboard after deploy.
- [ ] Secrets are set in Secret mode (`TURNSTILE_SECRET`, `RESEND_API_KEY`,
      `CONTACT_TO_EMAIL`, `RESEND_FROM_EMAIL`); the Turnstile sitekey is a
      plain variable (`PUBLIC_TURNSTILE_SITEKEY`).
- [ ] `PUBLIC_SITE_URL` is set to `https://therightlifestyle.com` in
      production; previews may override it to their own origin.
- [ ] Cache policy is the platform default for documents (revalidation
      with ETag), with `/_astro/*` and `/fonts/*` answered
      `public, max-age=31536000, immutable`. Verify with `curl -sSI` on
      the production origin that every response carries **one**
      `Cache-Control` field, not a merged duplicate.
- [ ] Workers Logs retention is plan-bounded (Free: 3 days / 200,000
      events/day; Paid: 7 days / Logpush). The application does not
      require more. Recorded in `TRL_GATE5_REVIEW.md`.
- [ ] Account-level abuse protection is on (Cloudflare's default for new
      accounts). The application's own rate-limit binding is the named,
      per-endpoint ceiling; account-level protection is the broader
      default.

---

## Turnstile production keys

The repository carries Cloudflare's published dummy Turnstile sitekey and
secret in `.dev.vars.example` for local development and e2e only. The
production keys are created and held by the founder.

- [ ] Founder creates a Turnstile widget for `therightlifestyle.com` (and
      `www.therightlifestyle.com`) in the Cloudflare dashboard.
- [ ] Founder sets `PUBLIC_TURNSTILE_SITEKEY` (plain variable) to the
      widget's sitekey and `TURNSTILE_SECRET` (Secret) to the widget's
      secret.
- [ ] After deploy, `GET /contact/` renders the form enabled with a real
      widget. A browser visit with DevTools open confirms no blocked
      script/frame from `challenges.cloudflare.com`.
- [ ] A forged or missing token is rejected with the `403` "we could not
      verify" state — proving server-side `siteverify` is real against the
      production secret.
- [ ] A solved widget issues a token; submission with a real token succeeds
      end-to-end. This is the same evidence as the D-016 real-delivery
      check.

---

## Resend production email

- [ ] Founder creates a Resend account and confirms the free-tier
      restrictions recorded in `TRL_ARCHITECTURE.md` (3,000/month,
      100/day, unverified-domain sender/recipient restrictions).
- [ ] `RESEND_API_KEY` is set in Secret mode in the Cloudflare dashboard.
- [ ] `RESEND_FROM_EMAIL` is initially `onboarding@resend.dev` — the
      Resend default sender until the domain is verified. Set it as a
      Secret.
- [ ] `CONTACT_TO_EMAIL` is `officialtrlservice@gmail.com` (D-003). Set as
      a Secret.
- [ ] The Resend dashboard is checked for the per-account "restrict to your
      own email" setting: turn it **off** if it is on, so the API can send
      to `officialtrlservice@gmail.com` from `onboarding@resend.dev` while
      the founder's account is the only approved destination.
- [ ] Domain verification (a DNS change) is performed only when the founder
      is ready to switch the sender to `hello@therightlifestyle.com`. The
      DNS records Resend asks for are added verbatim. Until then the
      `onboarding@resend.dev` sender stays in effect.
- [ ] After deploy, one real enquiry is sent end-to-end (the smoke-test
      step 6 above). The email arrives in `officialtrlservice@gmail.com`
      with `Reply-To` set to the submitter's address.

---

## Rate-limit namespace configuration

`POST /contact/` reads `env.CONTACT_RATE_LIMITER` and the code fails open when
the binding is absent (`docs/TRL_RATE_LIMITING.md`). The deployment gate
turns the binding on with a real `namespace_id`.

- [ ] Founder provisions the rate-limit namespace in Cloudflare (one-time,
      through the dashboard or `wrangler`).
- [ ] Founder chooses a `namespace_id` (a positive integer unique to the
      account; e.g. `"1001"`).
- [ ] Founder uncomments the `ratelimits` block already present in
      `wrangler.jsonc` (currently a comment; pinned by
      `tests/unit/wrangler-config.test.ts` so the block cannot silently
      change shape) and sets the `namespace_id`.
- [ ] Founder rebuilds and deploys. The endpoint picks the binding up
      automatically — no code change.
- [ ] Founder runs the rate-limit burst check on the real deployment: 20
      `POST /contact/` from a single client in under 10 seconds. The 11th
      and later answer the generic `503`-style preserved-input state; a
      submission after the 10-second window succeeds. The Workers Logs
      show one `rejected-rate-limit` per rejected request and no
      submitted value.
- [ ] If the binding errors at runtime, the failure is fail-open: the
      request is allowed and a `system-error`/`rate-limiter-error` line is
      logged. This is the documented posture, not an accident.

---

## Final platform security checklist

These are the response-security rules the application code cannot safely
ship, so they are set as Cloudflare platform rules on the final HTTPS domain.

- [ ] `X-Frame-Options: DENY` (or `SAMEORIGIN` — `DENY` is the strict
      choice and matches `frame-ancestors 'none'`).
- [ ] Content Security Policy `frame-ancestors 'none'` (the dual-write with
      `X-Frame-Options` is belt-and-braces; the CSP directive is the
      authoritative one in modern browsers).
- [ ] `Strict-Transport-Security: max-age=31536000; includeSubDomains;
      preload` on every HTTPS response for the apex and `www`.
      `preload` only after the apex is confirmed stable — submitting the
      apex to the browser preload list is irreversible for the
      `max-age` window.
- [ ] HSTS is configured **only** on the final HTTPS domain. It is not in
      `public/_headers` (which the application ships) and not in
      `src/middleware.ts` (which runs on the Worker). Setting HSTS on the
      preview or staging origin would lock a temporary host into browsers
      (D-018 note).
- [ ] The Cloudflare zone's TLS setting is "Full (Strict)" so the edge
      validates the origin certificate and rejects a downgrade.

After deploy, `curl -sSI https://therightlifestyle.com/` answers with both
the framing headers and HSTS. Curl with the `--http1.1` flag and a
deliberate downgrade (curl does not follow by default) returns the HSTS
header.

---

## GitHub Pages transition

The repository still has GitHub Pages enabled with the **legacy Jekyll
builder** sourced from `main`, so every push to `main` runs `jekyll build`
over the repository root and publishes to
`therightlifestyle.github.io/TRL-SERVICE/`. That is not a deployment target
for this project: the site is built with Astro and deployed to Cloudflare
Workers with static assets (D-014). Jekyll treats any file whose first line
is `---` as a page with YAML front matter and renders the rest through
Liquid; every `.astro` file opens with exactly that fence wrapped around
JavaScript, so the build dies during "Generating...". The red
`pages build and deployment` runs after each merge are this, not a CI
problem — the CI workflow itself is green.

A minimal `_config.yml` is committed to keep `main` green, excluding `src/`,
`tests/`, `public/`, and the tooling configs so Jekyll only sees the Markdown
documentation. It is containment, not the fix.

The end state is for the founder to disable GitHub Pages (or switch its
source to "GitHub Actions"), then delete `_config.yml`. The repository token
cannot change Pages settings (`403 Resource not accessible by integration`),
so the transition is a one-time founder action.

### Founder procedure (numbered, no GitHub Actions migration needed)

1. Open the repository on GitHub.
2. Go to **Settings → Pages**.
3. Under "Source", choose either:
   - **"Deploy from a branch" → Source: None** (disables Pages entirely;
     simplest), or
   - **"GitHub Actions"** (keeps Pages on but stops the Jekyll build;
     useful if the founder wants Pages to exist for any future purpose
     like a static fallback).
4. Click **Save**.
5. Verify the next push to `main` does **not** produce a red
   `pages build and deployment` run. A successful run, or no run, are both
   fine — a red run means the source is still set to the legacy Jekyll
   builder and step 3 was not applied.
6. Once the red run is gone, `_config.yml` can be deleted in a follow-up
   commit. The repository-side record that this transition has happened
   lives in `TRL_CHANGELOG.md` and `TRL_SESSION_HANDOFF.md`; do not delete
   the file in the same commit as the disable action, so the diff is
   readable.

### Why this is not done by the agent

- The Pages setting is an admin action; the repository token gets `403`
  (`Resource not accessible by integration`).
- Disabling Pages is irreversible only in the sense that a future
  re-enable is another admin action — but it is also a decision the
  founder owns, because Pages-on is a public surface even if nothing is
  served from it.
- The fallback use of GitHub Pages as a static mirror (step 3, "GitHub
  Actions" option) is the kind of decision that is reversible only by
  another admin action, so it is founder-owned.

---

## Operational rule

Do not place credentials in this repository or request them in chat. Do not
modify DNS, payment accounts, or production infrastructure without explicit
founder authorization.
