# TRL — Deployment

_Last updated: 2026-09-19 (Gate 6 — Deployment Readiness). The deploy path is now
verified rather than assumed; the canonical origin is a required build variable
rather than a domain the business does not own; and the interim deployment ships
invisible to search engines by default. **Nothing is deployed.** Every remaining
step needs an account and is on `TRL_GATE6_FOUNDER_CHECKLIST.md`._

## 1. Where this stands

No hosting account, Turnstile widget, Resend account, domain, DNS record, payment
account, or deployment exists, and no credentials exist anywhere in the project.
That has not changed and cannot be changed from inside the repository — accounts
are founder-owned (D-004/D-006).

What Gate 6 did change is the amount of guesswork left in the founder's path:

| Was | Now |
| --- | --- |
| The build defaulted to `https://therightlifestyle.com` — a domain the founder does not own | `PUBLIC_SITE_URL` is required, there is no default, and a build without it fails with an actionable message (D-021) |
| A build could ship indexable on a temporary host | Indexing is **off** unless explicitly enabled, and one variable turns it on (D-022) |
| `robots.txt` was a committed file carrying that domain | `robots.txt` is generated from the same two facts the pages use, so the crawl policy cannot contradict them |
| The deploy command was inferred from documentation | Verified locally: the build output deploys, and the deploy config Wrangler actually reads was confirmed |
| Rollback, recovery, and monitoring were "planned" | Documented below, with what is and is not observable |

## 2. What a deployment actually is (verified)

`npm run build` produces two directories:

- **`dist/client/`** — the static site: 8 prerendered HTML routes, `404.html`,
  `robots.txt` (generated), `sitemap-index.xml` + `sitemap-0.xml`, `favicon.svg`,
  the self-hosted fonts, hashed `_astro/*` CSS, and `_headers`.
- **`dist/server/`** — the Worker: `entry.mjs`, its chunks, the middleware, and
  the adapter-generated deploy config at **`dist/server/wrangler.json`**.

`.assetsignore` (written by the adapter) keeps `wrangler.json` and `.dev.vars`
out of the served asset set. Verified on the local runtime: requesting
`/wrangler.json`, `/wrangler.jsonc`, `/.dev.vars`, or `/_headers` returns **404**
— the configuration is never published.

**Deploying.** From the repository root:

```bash
npm run preflight   # validates the build variables and configuration
npm run build
npx wrangler deploy
```

No `--config` flag is needed. Wrangler detects the adapter's generated config,
prints `Using redirected Wrangler configuration`, and uploads from
`dist/server/wrangler.json` via the `.wrangler/deploy/config.json` redirect it
writes. This was verified with `npx wrangler deploy --dry-run`, which needs no
account and no credentials and is now run on every pull request in CI:

```
Read 31 files from the assets directory .../dist/client
Total Upload: 662.63 KiB / gzip: 169.42 KiB
Binding   Resource
env.SESSION  KV Namespace
env.IMAGES   Images
env.ASSETS   Assets
```

`SESSION` (KV) and `IMAGES` are provisioned automatically by the adapter on the
first deploy. The current application uses neither — it has no sessions and does
no runtime image processing — so they add no configuration to this repository.

**`account_id` is deliberately not committed (D-023).** It is optional for
Wrangler, and Cloudflare's own troubleshooting guidance for an incorrect
`account_id` is to remove it, because a wrong value deploys against whichever
account owns that identifier. Workers Builds supplies the account context to its
builds (its auto-created API token includes account settings read), so the
founder's path needs nothing committed. For a deploy from a laptop or a
different CI, pass it explicitly:

```bash
CLOUDFLARE_ACCOUNT_ID=<account-id> CLOUDFLARE_API_TOKEN=<token> npx wrangler deploy
```

### How requests reach the code (verified on the real runtime)

Cloudflare serves static assets from the `ASSETS` binding **before** Worker code
runs. Measured on the local `workerd` runtime via `npx wrangler dev` against the
real build output:

| Request | Result |
| --- | --- |
| `/`, `/offers/`, `/robots.txt`, the sitemap, CSS, fonts | Served from assets, `_headers` applied (3 header rules parsed) |
| `/fonts/*`, `/_astro/*` | `Cache-Control: public, max-age=31536000, immutable`, exactly one `Cache-Control` field |
| Documents, `robots.txt`, the sitemap | `public, max-age=0, must-revalidate` with an ETag |
| `/does-not-exist/` | **404** with the custom 404 page — not a soft 404, and no `not_found_handling` setting is needed |
| `/contact/` (GET) | Worker-rendered, contact CSP with the Turnstile exception |
| `POST /contact/` with a foreign `Origin` | `403` before the component runs (Astro's `checkOrigin`) |
| `POST /contact/`, same origin, no delivery configured | `503`, generic copy, input preserved, one structured log line and no PII |
| `/wrangler.json`, `/.dev.vars`, `/_headers` | `404` — never served |

## 3. Environment variables

Complete list, split by when they are read. Nothing here is committed; real
values exist only in the hosting platform.

| Variable | Read | Where it is set | Value at each stage |
| --- | --- | --- | --- |
| `PUBLIC_SITE_URL` | **Build** | Workers Builds → Settings → Build → *Build variables*; or the shell; or CI | Interim: `https://trl-service.<account-subdomain>.workers.dev`. Live: the real domain, e.g. `https://<domain>` |
| `PUBLIC_ALLOW_INDEXING` | **Build** | Same place as above | Unset (off) until the real domain is live, then `true` |
| `PUBLIC_TURNSTILE_SITEKEY` | Runtime | Workers → Settings → Variables & Secrets | The widget's sitekey (public by nature) |
| `TURNSTILE_SECRET` | Runtime | Same | The widget's secret |
| `RESEND_API_KEY` | Runtime | Same | Resend API key |
| `CONTACT_TO_EMAIL` | Runtime | Same | `officialtrlservice@gmail.com` (D-003) |
| `RESEND_FROM_EMAIL` | Runtime | Same | `onboarding@resend.dev` until a domain is verified in Resend |

Two mechanics worth knowing before changing anything:

- **`PUBLIC_SITE_URL` cannot be supplied by a `.env` file.** `astro.config.mjs`
  reads it from `process.env` while the config is evaluated, and Vite loads
  `.env` files after that point. It must be a real environment variable. Verified
  by building with a `.env` present and watching the value be ignored.
- **`PUBLIC_ALLOW_INDEXING` is read through `import.meta.env`**, so it works from
  either a real environment variable (the deployment path) or a `.env` file (the
  local path), with the real variable taking precedence. Verified both ways.

`npm run preflight` checks all of this — origin present and well-formed, flag
recognised, `wrangler.jsonc` parseable, no `account_id`, no committed credential
file — and explains what the next build will do. It needs no account and no
network.

Locally, runtime variables come from `.dev.vars` (copied from
`.dev.vars.example`), which holds Cloudflare's published dummy Turnstile keys and
no delivery configuration. `.dev.vars` is gitignored, is overwritten by every
Playwright run, and must never hold real credentials.

## 4. The two-stage plan: interim host, then the real domain

**Stage A — interim deployment on a `workers.dev` host, indexing off.**

`trl-service.<account-subdomain>.workers.dev` is free, needs no domain, and lets
the whole stack be proven end to end with real credentials. It ships with
`PUBLIC_ALLOW_INDEXING` unset, so every page carries `noindex` and `robots.txt`
does not advertise the sitemap. Nothing about this host is discoverable by
search, and it cannot compete with the real domain later.

Two things are deliberately *not* available at this stage: a `workers.dev` host
has no DNS zone, so zone-scoped platform rules — HSTS and framing protection —
cannot be attached to it. Both are held until Stage B by D-018, which is also
why they are absent from the code. Stage A is therefore a verification stage, not
a launch: it exists to prove delivery, headers, and the rate limiter, and it
should not be the address the business points anyone to.

**Stage B — the real domain.**

When a domain is owned and added to Cloudflare:

1. Attach the custom domain to the Worker (Workers → Settings → Domains & Routes
   → Add custom domain). DNS is created by Cloudflare; no manual record is needed.
2. Add the zone-scoped rules that Stage A could not: **HSTS**
   (`Strict-Transport-Security: max-age=31536000; includeSubDomains`) and framing
   protection (`X-Frame-Options: DENY` or CSP `frame-ancestors 'none'`) as
   Cloudflare rules, not in `public/_headers`, so a preview host can never lock a
   bad decision into browsers (D-018).
3. Set `PUBLIC_SITE_URL` to the real origin and `PUBLIC_ALLOW_INDEXING=true`, then
   rebuild and deploy. `npm run preflight` will confirm both before the build.
4. Re-run the verification list in §6 against the real domain, and only then treat
   the site as launchable.

Turning indexing on is the one irreversible-in-practice step here: an indexed
interim host competes with the site's own future domain, and removing it from
search results takes weeks.

## 5. Deployment runbook (founder actions, in order)

The detailed click-by-click version, with copy-paste commands and "done when"
criteria, is `TRL_GATE6_FOUNDER_CHECKLIST.md`. The shape of it:

1. **Cloudflare account** (free) — then connect this repository as a Worker
   (Workers & Pages → Create → Import a repository). Build command `npm run build`,
   deploy command left at the default `npx wrangler deploy`, production branch
   `main`. Non-production branches build as *versions* and produce preview URLs
   (the default non-production deploy command is `npx wrangler versions upload`).
2. **Build variables** — `PUBLIC_SITE_URL` set to the `workers.dev` origin shown
   for the Worker; `PUBLIC_ALLOW_INDEXING` left unset.
3. **Turnstile** — create a widget for the deployment hostname; put the sitekey
   and secret in the Worker's runtime variables (§3).
4. **Resend** — create the account, confirm the free-tier restrictions recorded
   in `TRL_ARCHITECTURE.md`, create the API key, set `RESEND_API_KEY`,
   `CONTACT_TO_EMAIL`, and `RESEND_FROM_EMAIL`.
5. **First deploy** — push to `main` (or run `npx wrangler deploy` locally). Then
   work through §6.
6. **Provision the rate limiter** — uncomment the `ratelimits` block in
   `wrangler.jsonc` and set the account-scoped `namespace_id`; the enforcing code
   is already committed and picks the binding up with no code change. Then run the
   burst check in `TRL_RATE_LIMITING.md`.
7. **Stage B** (§4) when a domain exists.

## 6. Post-deploy verification (the part that cannot be done from here)

Run these against the deployed preview. Each one exists because something in it
has failed or been assumed before.

**The enquiry path — the whole point (D-016).**

- [ ] `/contact/` renders the form **enabled** with a real Turnstile widget. If the
      "form is not available on this deployment" notice is still present, a runtime
      variable is missing — most often `PUBLIC_TURNSTILE_SITEKEY`.
- [ ] Submit a real enquiry. It arrives at `officialtrlservice@gmail.com` with a
      working reply-to set to the sender's address.
- [ ] Submit a second enquiry with a deliberately invalid field and confirm the
      error state is accessible, keeps what was typed, and sends nothing.
- [ ] Confirm no delivery happens when Turnstile is not solved.

**Headers and caching (the local runtime is not the edge).**

```bash
BASE=https://<deployed-origin>
curl -sI $BASE/ | grep -i 'content-security-policy\|cache-control\|x-content-type'
curl -sI $BASE/fonts/manrope-latin-wght-normal.woff2 | grep -i cache-control
curl -sI $BASE/_astro/<hashed>.css | grep -i cache-control
curl -sI $BASE/contact/ | grep -i content-security-policy
curl -s -o /dev/null -w '%{http_code}\n' $BASE/does-not-exist/   # expect 404
curl -s -o /dev/null -w '%{http_code}\n' $BASE/wrangler.json     # expect 404
```

- [ ] Static pages carry the `script-src 'none'` CSP; `/contact/` carries the
      contact CSP with `challenges.cloudflare.com`.
- [ ] `/fonts/*` and `/_astro/*` answer a year and `immutable`; documents,
      `robots.txt`, and the sitemap revalidate. Each response has **one**
      `Cache-Control` field — a merged duplicate means an `_headers` rule is
      fighting the adapter (D-020).
- [ ] Unknown paths return `404` with the custom page, not a 200 soft-404.

**Search-engine state (D-022).**

- [ ] `/robots.txt` shows the expected state: with indexing off it says
      `Allow: /` with no `Sitemap:` line and no `Disallow` (the page-level
      `noindex` is what keeps the deployment out of results — see the note in
      §7); with indexing on it lists `Sitemap: <origin>/sitemap-index.xml`.
- [ ] Every page's HTML carries `<meta name="robots" content="noindex, follow">`
      while indexing is off.

**Rate limiting** — the 20-POST burst check in `TRL_RATE_LIMITING.md`: the
over-limit requests answer the same generic preserved-input state, and a normal
submission succeeds after the window.

**Logs.** Watch Workers Logs for `outcome:"system-error"` after the first real
traffic. The log contract (one structured line per contact request, no PII) is in
`TRL_GATE5_REVIEW.md`.

## 7. Why indexing is off, and what actually keeps the site out of search

The mechanism matters, because the intuitive implementation is the wrong one.

`robots.txt` governs **crawling**, not indexing. Writing `Disallow: /` would stop
crawlers from ever fetching a page — which means they would never read the
`noindex` directive on it — and a URL discovered through an external link can
still appear in results as *"indexed, though blocked by robots.txt"*. That is
exactly the outcome the noindex decision exists to prevent. (`Noindex:` inside
robots.txt is not a directive at all: Google removed support for it on
2019-09-01.)

So the interim deployment allows crawling and serves `noindex` on every page. The
sitemap is built but not advertised while indexing is off, and `robots.txt` is
generated from the same two facts the pages use, so the two cannot drift apart.
`tests/unit/robots-policy.test.ts` pins both states.

## 8. Rollback, recovery, and retention

- **Rollback (fastest).** Cloudflare keeps previous Worker versions: Workers →
  Deployments → pick the last good version → *Rollback*, or
  `npx wrangler rollback`. Because the static assets and the Worker ship as one
  unit, a rollback restores both together.
- **Rollback (founder-controlled, no dashboard).** Revert the commit on `main`
  and let Workers Builds redeploy, or redeploy the previous commit locally with
  `git checkout <good-commit> && npm ci && npm run build && npx wrangler deploy`.
- **Recovery.** There is no application data store, so there is nothing to
  restore: the repository is the source of truth, the site is reproducible from a
  commit, and enquiries live in the founder's mailbox rather than in the system.
  A total loss of the deployment costs one redeploy.
- **Secrets.** Rotate in the platform: update the variable and, for runtime
  variables, no redeploy is required for the Worker to pick up a newly uploaded
  secret on its next request. If a Resend key or Turnstile secret is exposed,
  rotate it in the provider first, then update the Worker.
- **Retention.** Workers Logs retention is plan-bounded (Free: 3 days; Paid: 7
  days) and is diagnostic only. Enquiries are retained by the mail provider, not
  by this system.

## 9. Monitoring and health checks

Phase 1 ships with **no analytics and no third-party monitoring** (D-019), and
that is a deliberate trade, not an omission.

- **What exists:** Cloudflare's free per-request metrics (requests, errors, CPU
  time) for the Worker, and Workers Logs with the structured contact contract.
- **What does not exist:** no uptime check, no alerting, no client-side error
  reporting. Nothing will page the founder if the site goes down.
- **The de facto health check is the inbox.** An enquiry arriving is the strongest
  end-to-end signal the system has, and it is the one signal that covers
  Turnstile, validation, and delivery at once.
- **A minimal manual check** (a browser and a URL): load `/`, load `/contact/`,
  and confirm the form renders enabled. That covers a broken Worker and a missing
  runtime variable in under a minute.
- **Triggers to revisit:** the first real lead that fails to arrive, any
  `system-error` in the logs, or paid traffic. At that point an uptime check is
  the next step — it is a founder decision, recorded as an open question in
  `TRL_OPERATING_STATE.md`.

## 10. GitHub Pages (not a deployment target — disable it)

GitHub Pages is still enabled on this repository with the **legacy Jekyll
builder** sourced from `main`, publishing to
`https://therightlifestyle.github.io/TRL-SERVICE/`. That is not a deployment
target: the site is built with Astro and deploys to Cloudflare Workers with
static assets (D-014). Left alone, it also builds the repository on every merge,
which is why a minimal `_config.yml` is committed to keep Jekyll away from the
`.astro` files. It is containment, not a fix.

- [ ] **Founder action:** Settings → Pages → either disable Pages or set the
      source to *GitHub Actions*. The repository token gets
      `403 Resource not accessible by integration` on that endpoint, so this
      cannot be automated from here. Once it is done, `_config.yml` can be
      deleted.

## 11. Operational rules

- Do not place credentials in this repository, in `.dev.vars`, or in chat. Real
  values live only in the hosting platform and the provider dashboards.
- Do not modify DNS, payment accounts, or production infrastructure without
  explicit founder authorization.
- Do not deploy publicly, and do not flip `PUBLIC_ALLOW_INDEXING` to `true`,
  before the real domain is live and Gate 8 approval is given.
- Keep the committed lockfile reviewed; add dependencies only as recorded in
  `TRL_ARCHITECTURE.md`.

## 12. Verification log

What was verified, when, and how — so the next session does not re-derive it.

| Date | What | How |
| --- | --- | --- |
| 2026-09-19 | Deploy config resolution, asset set, bundle size, bindings | `npx wrangler deploy --dry-run` (no credentials) |
| 2026-09-19 | Header rules, cache policy, CSP per route, 404 status, `/_headers` on static responses, config files never served, the unconfigured form state, same-origin rejection, the 503 delivery boundary | `npx wrangler dev` against the real build output (the `workerd` runtime the deploy uses) |
| 2026-09-19 | A build without `PUBLIC_SITE_URL` fails with exit code 1 and produces no output | `astro build` with the variable unset |
| 2026-09-19 | Indexing off by default, on when explicitly enabled, legal pages noindex in both states, sitemap advertised only when on | Two full builds, comparing `robots.txt` and the page metadata |
| 2026-09-19 | `.env` is not read by `astro.config.mjs`; `import.meta.env` reads both a real variable and `.env` | Builds with each source |
| 2026-09-19 | 275 unit tests, `astro check` clean, preflight behaviour across five configurations | Local runs; the CI job was reproduced end to end locally |

Not verified from here, and why: **Playwright e2e** needs downloadable browser
binaries (it runs on CI), **real-credential delivery** needs the founder's Resend
account, and **the real edge's cache/HSTS behaviour** needs a deployment. All
three are covered in §5–§6 rather than assumed.
