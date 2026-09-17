# TRL — Rate limiting plan for the contact endpoint (Gate 5)

_Last updated: 2026-09-17. Status: **planned** — the design, limits, exact
config, and code path are fixed; deployment waits for the Cloudflare account,
whose identifiers only the founder can supply._

## Why this is a plan, not wired code

The endpoint's existing abuse controls — Turnstile, the honeypot, and Astro's
`checkOrigin` — ask the question "is this a person submitting a real form?".
They do **not** answer "how hard is one client hammering the endpoint?", and an
automated client that can solve interactive challenges still deserves a ceiling
on how much work it can create per minute.

The right tool is Cloudflare's Workers **rate-limit binding**, checked at the
top of the `/contact/` POST pipeline. Two parts of that binding are
account-scoped and cannot be fabricated in this repository:

1. **`namespace_id`** — "a string containing a positive integer that uniquely
   defines this rate limiting namespace *within your Cloudflare account*."
   No account exists (D-004/D-006: account creation is a founder action at the
   deployment gate), so no real identifier can be committed without inventing
   one.
2. **Provisioning** — the namespace is created through Wrangler when the
   founder's account first deploys the config.

Everything else — the binding shape, the limit values, the key, the ordering,
the user-facing response, and the code that will enforce it — is decided below
and unit-testable today, so the deployment-gate step is genuinely just "add two
founder-owned values".

## Where the limit goes

In `wrangler.jsonc` (which `astro build` merges into the generated deploy
config at `dist/server/wrangler.json`), alongside the existing
`compatibility_date` and `observability`:

```jsonc
{
  "compatibility_date": "2026-09-16",
  "observability": { "enabled": true },
  "ratelimits": [
    {
      "name": "CONTACT_RATE_LIMITER",
      "namespace_id": "<founder-supplied integer, as a string>", // e.g. "1001"
      "simple": { "limit": 10, "period": 10 }
    }
  ]
}
```

Config reference, verified against the Cloudflare runtime and the
`@cloudflare/vite-plugin` bundled in this repo (4.133.0 / vite-plugin
1.53.0):

- `namespace_id` | string | a positive integer that uniquely identifies the
  namespace within the founder's account; specified as a string on purpose.
- `simple` | object | the only supported limiter type.
- `simple.limit` | number | requests allowed per period, per key, per
  Cloudflare location.
- `simple.period` | number | window in seconds; **must be either `10` or
  `60`**.

The binding is then available inside the Worker as `env.CONTACT_RATE_LIMITER`
with a `limit({ key })` method returning `{ success: boolean }`. The plugin
validates `simple.period ∈ {10, 60}` at build/validate time, so a typo fails
the build rather than silently no-oping. Rate limits are **approximate by
design** — Cloudflare documents that counters are local per location and
best-effort, so this is a coarse abuse ceiling, not an accounting system; the
limit is therefore set with a wide margin (see below).

## Chosen limit and key

- **Key: `CF-Connecting-IP`.** The Cloudflare edge sets this header on every
  request before the Worker runs; it is the real visitor address and cannot be
  spoofed by the client (a client-supplied header of the same name is
  overwritten). This is the key the contact pipeline already reads for Turnstile
  (`src/lib/contact.ts`), so it is consistent with the existing design and
  requires no new trust assumption. It deliberately limits *per IP address*, not
  per form: shared-office and CGNAT visitors would otherwise be swept into a
  per-form bucket.
- **Limit: `10` requests per `10` seconds per IP.** Rationale:
  - A human filling the form needs at most a handful of POSTs in a burst — the
    initial send plus a couple of corrected re-submissions after validation
    errors, each of which is a slow, deliberate action.
  - `simple.period` may only be 10 or 60 seconds. `10 / 10s` is the
    tightest-per-window option while still leaving a normal person headroom; a
    `60s` period with a higher count would raise the same ceiling but let an
    abusive client sustain more work per second overall.
  - Because the binding is per-location and approximate, the effective global
    ceiling is somewhat above 10/10s across locations — which is fine for a
    ceiling and why a margin is built in.
  - The hard backstop for entropy is Turnstile's own risk engine; this binding
    is the volumetric guard, not the sole spam defence.
- **What counts against the limit:** every `POST /contact/`, regardless of
  whether it succeeds, fails validation, or trips the honeypot. Counting exits
  is what caps work (Turnstile/Delivery are never called for a 429). GETs are
  free — the page is public content.

## Enforcement order (decided)

The rate-limit check runs **first** in the POST pipeline, before honeypot →
Turnstile → validation → delivery, for two reasons:

1. It bounds the paid work: a client over the limit must not be able to spend
   Turnstile verifications or Resend sends, even with a forged or replayed
   token.
2. It must not leak ordering: giving spam submissions the special
   "rate limited" path only after other checks would reveal which of their
   submissions were judged human.

Concretely, `handleContactPost` gains a leading `limitOutcome` dependency that
the page wires to the real binding. The ordered flow becomes:

```
POST /contact/ → rate limit (429) → honeypot (silent 303) → Turnstile (403)
              → validation (422) → delivery (303 | 503)
```

## User-facing behaviour on 429

The visitor sees the same generic, input-preserving failure pattern as the
existing `503` "could not send" state (`formError: 'unavailable'`), so:

- no internal detail is revealed — the word "rate" does not appear to the
  visitor, and neither does the limit value;
- the preserved input is never lost, so a person who hits the ceiling simply
  retries in a moment (10s) without retyping;
- honest channel fallback: the form already renders WhatsApp and email above
  the form, so the page never strands a real visitor.

Log hygiene is preserved: one structured outcome event with a new
`'system-error'` reason `'rate-limited'` (or a dedicated `'rejected-rate-limit'`
outcome), containing neither the submitted values nor the key. The
log-hygiene unit test gains this reason in its banned-substring assertion.

## Failure posture when the binding is absent

Exactly like Turnstile and Resend today: **fail open for rate limiting only in
the unconfigured sense described below, and never break the form.** Two states
matter:

- **Binding missing (e.g. local `astro preview`, CI):** `env.CONTACT_RATE_LIMITER`
  is `undefined`, so the page passes a fallback dependency that always allows
  (the same shape as the existing injected-dependency design). The e2e suite
  continues to run the whole pipeline with the published dummy Turnstile keys
  and no delivery config.
- **Binding present but `limit()` errors (network/edge hiccup):** treat as not
  limited and continue, logging the failure — but never block a submission a
  real person is making. This is the deliberate inverse of the fail-closed
  delivery rule: rate limiting protects against abuse, it is not the trust
  boundary that decides whether a message is genuine (Turnstile and validation
  are), so a degraded limiter must not degrade the form.

The opposite case is impossible by construction: an *over-limit* response only
ever happens when the binding answered `success: false` itself, so there is no
misconfiguration that silently discards real messages (mirroring D-016's
no-silent-discard rule).

## Test coverage required when the account exists

When the founder supplies the account and namespace, the implementation adds:

1. **Unit tests** (with injected binding fakes, no network): deny→429 with
   preserved input and no email/Turnstile call; allow→pipeline proceeds;
   binding-missing→allow; binding-error→allow + logged; log hygiene holds for
   the new reason.
2. **One e2e test** against the dummy-key preview, which cannot exercise a real
   binding (workerd does not emulate `ratelimits`) but asserts the *contract*:
   that a POST still produces the honest generic failure state when the
   delivery boundary is reached, and that the form remains enabled.
3. **Deployment-gate manual check** (added to `TRL_DEPLOYMENT.md`): burst 20
   form POSTs from the deployed preview and observe the 11th-and-later being
   rejected in the generic state, then a normal submission succeeding after the
   10-second window.

## Deployment gate: founder actions

- [ ] Founder creates the Cloudflare account and runs the first deploy
      (Workers Builds), which provisions the `CONTACT_RATE_LIMITER` namespace
      from the `namespace_id` below.
- [ ] Founder chooses the `namespace_id` integer (any positive integer unique
      to the account; e.g. `"1001"`), and it is set in `wrangler.jsonc` when
      the account exists.
- [ ] Keep the chosen values (`10 / 10s`) — they are set for a real-person
      margin, not for tuning; revisit only with observed production evidence.

## Decision record

**D-018** — response-security headers and the contact CSP (see Decision Log):
the deployment boundary, and this plan is its rate-limit companion. The
rate-limit portion of Gate 5 is planned here rather than wired because
`namespace_id` is account-owned; everything else is fixed and testable.
