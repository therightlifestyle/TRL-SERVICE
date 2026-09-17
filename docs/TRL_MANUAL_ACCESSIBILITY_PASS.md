# TRL — Manual accessibility pass (Gate 5)

_Last updated: 2026-09-17. Status: **scheduled.** Automated coverage (axe over
the build and over every rendered route in a real browser, plus keyboard-order,
320px-reflow, target-size, reduced-motion, and no-CSS e2e checks) supports but
cannot replace this pass. Runs in the deployed preview, because the authoring
sandbox has no browser binaries or `challenges.cloudflare.com` reachability —
CI is where automation lives, but it deliberately no longer covers the real
Turnstile widget (D-017)._

## Why this pass now includes the real widget

At Gate 4 the browser suite replaced the Turnstile *widget* with a contract
stub after it was measured, on a real CI runner, that the real `api.js` loads
and `window.turnstile` exists yet the widget never renders into `.cf-turnstile`
(0 children, 0 iframes, 0 token inputs). That substitution kept the *pipeline*
real (server-side `siteverify` is untouched); it moved the *widget itself* into
manual scope. Everything the stub cannot tell us — whether the widget paints,
how big it is, how it reads, how it behaves with keyboard and zoom — is a human
eyeball task on this pass, exactly like email delivery with real credentials.

Because Turnstile only reaches production once the founder's deployment has a
real sitekey, this section is inseparable from the deployment gate. Until then,
it can be dry-run against the published dummy sitekey with the understanding
that the badge, theme, and layout are final but risk behaviour is inert.

## Scope and environment

Run against the deployed preview on `therightlifestyle.com` (Cloudflare
Workers). Two passes: one desktop with keyboard + mouse at default zoom, one
mobile (real device, ideally one iOS Safari + one Android Chrome) with touch.

Required tooling: a desktop browser with DevTools (Firefox/Chrome/Safari), the
OS zoom controls, forced-colors mode, one screen reader — **NVDA+Chrome on
Windows or VoiceOver+Safari on macOS is the baseline; test with the one that is
available and record which**.

## Prerequisite

- [ ] Form renders **enabled** with a real sitekey (never assert a disabled
      state in this pass — that is the unconfigured-deployment state).
- [ ] CSP check opens clean: DevTools console shows no blocked script/frame
      from `challenges.cloudflare.com` (the only sanctioned exception, D-015).

## 1. Keyboard pass — every interactive element

Walk these routes in DOM order with `Tab` (and `Shift+Tab` reverse): `/`,
`/services/`, `/ai-solutions/`, `/offers/`, `/about/`, `/contact/`, and one
error-rendered `/contact/` (submit the empty form).

- [ ] First `Tab` hits the skip link, which becomes visible; activating it
      moves focus and reading position to main content.
- [ ] Every link and button is reachable and displays the 3px focus ring; the
      ring is never clipped by a sticky header or floating control.
- [ ] Focus order follows reading order; no element is skipped or jumped.
- [ ] No focus trap anywhere; `Esc` behaves where a control claims it.
- [ ] The WhatsApp affordance and footer links are reachable and legible under
      focus.
- [ ] No `tabindex` greater than `0` is used anywhere (the honeypot is
      `tabindex="-1"`, intentionally removed from the sequence).

## 2. Contact form keyboard pass (the only interactive flow)

- [ ] From a fresh `/contact/`, `Tab` reaches name → email → service → message
      → phone → business (the honeypot must **not** take focus) → the Turnstile
      widget region → the Send button, in that order.
- [ ] **Turnstile widget (eyeball, D-017):** the widget's interactive
      checkbox/frame is keyboard-operable — `Tab` reaches it, `Space`/`Enter`
      activates it, and the focus indicator is visible at the widget's boundary,
      not inside an invisible iframe with no cue.
- [ ] Submit the empty form: focus lands on the error summary; each summary
      link is keyboard-activatable and moves focus to its field; `aria-invalid`
      fields read their error on request.
- [ ] Valid submission (real keys, real delivery): the redirect to
      `/contact/sent/` is announced; no screen-reader-only dead end.
- [ ] A delivery failure (if reproducible) keeps focus and announces the
      generic "Your message was not sent" state without internals.

## 3. Zoom, reflow, and resize pass

- [ ] Zoom to **200%** in-browser on `/`, `/offers/`, and `/contact/`: no
      horizontal page scroll on the document, all text remains legible, controls
      remain clickable.
- [ ] **Turnstile widget (eyeball, D-017):** at 200% zoom and at a 320px-wide
      window the widget does not overflow the form column and does not overlap
      the Send button. We ship `data-size="compact"` specifically because the
      content column is 280px at the 320px floor and every other Turnstile size
      has a 300px minimum — **prove or disprove that 280px fits**; if the
      widget overflows, this is the decision point to revisit the size or the
      column, and it must come back to the automated reflow test's attention.
- [ ] OS-level text-size increase (browser font-size override) to ~200%: text
      wraps, nothing truncates, no overlap.
- [ ] Mobile 320px and 375px: the reflow test's no-horizontal-scroll guarantee
      holds *by eye*, including with the long WhatsApp number and email address.

## 4. Screen-reader smoke test

- [ ] Page load: title, main landmark, one h1, and navigation are announced in
      a sensible order; the skip link is first.
- [ ] Links and buttons announce meaningful names out of context (no "click
      here", no unlabelled icons). The wordmark announces "TRL — The Right
      Lifestyle".
- [ ] The form: every field announces its label, required/optional state, and
      hint; the service select announces "choose a service" as its default.
- [ ] On failed submit: the error summary is announced and focus moves to it;
      navigating by form field announces each error message through the
      `aria-describedby` association.
- [ ] **Turnstile widget (eyeball, D-017):** the widget is announced as a
      distinct, operable group with an interaction cue in the virtual cursor —
      not as silent dead space. Confirm any Cloudflare-injected accessibility
      content reads sensibly in the fieldset; if it reads as noise, note exactly
      what reads, because Cloudflare owns that DOM and only the wrapper is ours.
- [ ] `/contact/sent/` announces success plainly; no invented response-time
      promise is read.

## 5. Visual checks a machine can't make

- [ ] Contrast in the *rendered* pairings matches the token table in
      `TRL_DESIGN_SYSTEM.md` (the automated contrast checks assert the math,
      not the paint): focus rings on canvas/white/ink, borders on muted
      surfaces, muted text on canvas.
- [ ] The (optional) `prefers-contrast`/forced-colors mode: borders, focus,
      and the wordmark survive; the systems graphics degrade without stealing
      meaning (they are plain `aria-hidden` decoration).
- [ ] `prefers-reduced-motion: reduce`: no smooth scrolling or decorative
      motion (automated), confirmed by eye that nothing animates on purpose.
- [ ] No-JavaScript rendering: the contact page's `<noscript>` fallback points
      to WhatsApp/email, and the rest of the site is fully readable with
      scripts disabled.

## 6. The real Turnstile widget — the consolidated D-017 checklist

Beyond the keyboard/zoom/screen-reader items above, confirm on the real
production widget:

- [ ] Widget **renders** at all — a visible checkbox/frame with the Cloudflare
      attachment, not an empty box (the exact failure mode measured in CI).
- [ ] Interactive completion works; a solved widget issues a token and the
      submit is accepted server-side (same-run evidence as the D-016 real
      delivery check).
- [ ] Widget does **not** appear on any other route; it is the one sanctioned
      third-party script (D-015).
- [ ] With a real secret, a forged/absent token is rejected with the 403 "we
      could not verify" state, proving server-side verification is real in
      production.
- [ ] The privacy page reads truthfully next to the real widget (it discloses
      Turnstile's functional cookies).

## Recording

Each checklist item is recorded pass/fail in the session handoff with browser +
OS + screen reader + device names and the preview URL. Blocking failures — any
keyboard, focus, zoom/reflow, or screen-reader failure, and any widget
rendering/overflow defect — reopen Gate 5. The pass signs off only when every
box in sections 1–6 is checked or a named, recorded substitution (e.g. "tested
with NVDA only") is stated.
