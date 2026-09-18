# TRL — Gate 6 Founder Checklist

_This is the actionable list. `TRL_DEPLOYMENT.md` is the reference behind it._

Everything in this file needs a human with an email address, a browser, and the
founder's authority. None of it can be done from inside the repository, and none
of it should be faked. Work top to bottom; each step states how you know it
worked.

**Before you start**

- [ ] You have authorised deployment work. Nothing here is a public launch —
      Stage A runs on a free `workers.dev` host with indexing off — but it does
      create accounts and send real email.
- [ ] You have **not** been asked for, and have not pasted, any credential into
      chat or into the repository. Real values go only into the Cloudflare
      dashboard and the provider's own site.

---

## Step 1 — Cloudflare account and the Worker

1. Create a free account at <https://dash.cloudflare.com/sign-up>.
2. Go to **Workers & Pages → Create → Import a repository** (Workers Builds) and
   connect `therightlifestyle/TRL-SERVICE`. Authorise the Cloudflare GitHub app
   for this repository only.
3. Set the build configuration:

   | Setting | Value |
   | --- | --- |
   | Production branch | `main` |
   | Build command | `npm run build` |
   | Deploy command | `npx wrangler deploy` (the default — leave it) |
   | Root directory | `/` |

4. Add one **build variable**: `PUBLIC_SITE_URL` = the `workers.dev` origin
   Cloudflare shows for this Worker, e.g.
   `https://trl-service.<your-subdomain>.workers.dev`. Do **not** add
   `PUBLIC_ALLOW_INDEXING` — leaving it unset is what keeps the interim host out
   of search results.
5. **Save and Deploy.**

**Done when:** the first build completes and the `workers.dev` URL loads the TRL
home page. Do not continue until it does — every later step is verified against
that URL.

- [ ] Worker created, URL loads the site.

> If the build fails with `PUBLIC_SITE_URL is not set`, the build variable is
> missing or was added after the build started. Re-run the build.

## Step 2 — Confirm the deployment behaves (before it can send anything)

- [ ] `/robots.txt` says `Allow: /` with **no** `Sitemap:` line — indexing is off.
- [ ] View source on any page: `<meta name="robots" content="noindex, follow">`.
- [ ] Load `/contact/`: the form shows the **"not available on this deployment"**
      notice and the fields are disabled. That is correct *right now* — there is
      no Turnstile configuration yet — and it must disappear after Step 3.
- [ ] `/this-page-does-not-exist/` returns a 404 page (not the home page).
- [ ] `https://<your-origin>/wrangler.json` returns 404 (configuration is never
      published).

## Step 3 — Turnstile (the form's spam check)

1. Cloudflare dashboard → **Turnstile → Add widget**.
2. Name it `trl-service-contact`; add the hostname of your deployment (the
   `workers.dev` hostname; add the real domain later in Stage B).
3. Widget mode: **Managed**.
4. Copy the **Site Key** and **Secret Key**.
5. Worker → **Settings → Variables & Secrets** → add as *encrypted* secrets:

   | Name | Value |
   | --- | --- |
   | `PUBLIC_TURNSTILE_SITEKEY` | the site key |
   | `TURNSTILE_SECRET` | the secret key |

6. Redeploy (push any commit to `main`, or **Deployments → Retry**).

**Done when:** `/contact/` renders the form **enabled**, with a visible Turnstile
widget, and the "not available" notice is gone. If the form is still disabled,
`PUBLIC_TURNSTILE_SITEKEY` is missing or was added as a non-runtime variable.

- [ ] Form renders enabled with a real Turnstile widget.

## Step 4 — Resend (where enquiries land)

1. Create a free account at <https://resend.com>.
2. **Confirm the free-tier restrictions recorded in `TRL_ARCHITECTURE.md`**,
   specifically: 3,000 emails/month with a 100/day cap, the 2 requests/second
   send limit, and — the one that decides the from-address — that an unverified
   account may only send from `onboarding@resend.dev` and, depending on the
   account setting, only to the account owner's own address.
3. Create an API key (sending permission only).
4. Worker → **Settings → Variables & Secrets** → add:

   | Name | Value |
   | --- | --- |
   | `RESEND_API_KEY` | the API key (secret) |
   | `CONTACT_TO_EMAIL` | `officialtrlservice@gmail.com` |
   | `RESEND_FROM_EMAIL` | `onboarding@resend.dev` for now |

5. Redeploy.

**Done when:** the next step sends an email that actually arrives.

- [ ] Resend account created; restrictions checked against the live account and
      any difference noted in `TRL_ARCHITECTURE.md`.
- [ ] Variables set and redeployed.

## Step 5 — The real enquiry (the thing this whole gate exists for)

- [ ] Submit a genuine enquiry through the deployed form, from a real address.
- [ ] Confirm it arrives at `officialtrlservice@gmail.com`.
- [ ] Confirm **reply-to** is the address you submitted, so replying reaches the
      visitor and not yourself.
- [ ] Submit a second enquiry with an obviously invalid field (e.g. a two-word
      message) and confirm it is rejected in the browser, keeps what you typed,
      and sends nothing.
- [ ] Send a third with the Turnstile challenge deliberately unsolved (block
      `challenges.cloudflare.com` in DevTools) and confirm **nothing** is sent.

**Done when:** all five are true. This is the D-016 verification that has been
outstanding since Gate 4, and it is the moment delivery stops being theoretical.

- [ ] **A real enquiry reached the inbox with a correct reply-to.**

## Step 6 — Rate limiting (protects the form from abuse)

1. Choose a positive integer for `namespace_id` — any integer unique to your
   Cloudflare account, e.g. `1001`.
2. In `wrangler.jsonc`, uncomment the `ratelimits` block and set that value. No
   code change is needed: the endpoint already reads the binding and fails open
   while it is absent.
3. Commit, push, and let Workers Builds deploy.
4. Run the burst check in `docs/TRL_RATE_LIMITING.md` (20 POSTs → over-limit
   requests rejected in the same generic, input-preserving state → a normal
   submission succeeds after the 10-second window).

**Done when:** the over-limit behaviour is observed, not assumed.

- [ ] `namespace_id` set, deployed, burst check passed.

## Step 7 — Disable the legacy GitHub Pages build

This is the one step that has nothing to do with the deployment and everything to
do with a red X on every merge: GitHub Pages is still building this repository
with the legacy Jekyll builder.

- [ ] GitHub → repository **Settings → Pages** → either set the source to
      **GitHub Actions** or disable Pages entirely.
- [ ] Once it is off, `_config.yml` can be deleted from the repository (leave it
      until then, or every merge to `main` fails again).

## Step 8 — Stage B: the real domain (only when a domain is owned)

Do not start this until a domain exists. This is the step that makes the site
publicly findable, so it is the last thing that happens before launch approval —
not the first.

- [ ] Add the domain to Cloudflare and attach it to the Worker (**Workers →
      Settings → Domains & Routes → Add custom domain**). Cloudflare creates the
      DNS record.
- [ ] Add the zone rules Stage A could not have: **HSTS**
      (`Strict-Transport-Security: max-age=31536000; includeSubDomains`) and
      framing protection (`X-Frame-Options: DENY`). These belong in Cloudflare's
      rules, **not** in `public/_headers` (D-018).
- [ ] Set the build variable `PUBLIC_SITE_URL` to the real origin, and add
      `PUBLIC_ALLOW_INDEXING=true`.
- [ ] Redeploy, then confirm `/robots.txt` now lists
      `Sitemap: https://<domain>/sitemap-index.xml` and the pages no longer carry
      `noindex`.
- [ ] Re-run the header, cache, 404, and enquiry checks from
      `TRL_DEPLOYMENT.md` §6 against the real domain.
- [ ] Add the real domain to the Turnstile widget's hostname list.

---

## The three things that are still not done after all of this

Recorded plainly, because a checklist that ends clean is usually lying:

1. **The human accessibility pass** (`TRL_MANUAL_ACCESSIBILITY_PASS.md`) — needs a
   person with a browser, a screen reader, a real mobile device, and the live
   Turnstile widget. It is a Gate 7 item and cannot be automated.
2. **Real-device performance and the final launch checks** — Gate 7.
3. **Launch approval** — Gate 8. Turning the site public is the founder's call
   and nobody else's.

## What "done" means for Gate 6

Gate 6's repository-side work is complete: the origin is a required build variable
rather than an unowned domain, indexing is off by default with a one-variable
switch, the deploy path is verified on the real runtime, the runbook, rollback,
recovery, and monitoring are documented, and CI validates the deployable artifact
on every pull request.

Gate 6 itself closes when Steps 1–7 above are ticked: an account exists, the
artifact is deployed, one real enquiry has arrived, and the rate limiter is
enforcing. Steps 8 and beyond belong to the domain decision and to Gate 7–8.
