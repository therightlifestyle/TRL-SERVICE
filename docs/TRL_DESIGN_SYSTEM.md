# TRL — Design System

_Last updated: 2026-09-17 (revised during Gate 3 implementation). The founder confirmed the visual direction in session: quiet authority, light-first presentation, a text-only wordmark, and abstract systems graphics. This document is the design source of truth; the Gate 3 site implements it. One token-level accessibility correction was made during implementation and is recorded as D-012._

## Design intent

TRL should feel like a calm, capable operating partner—not an AI novelty brand. The system translates the positioning **premium, minimal, precise, trustworthy** into four rules:

1. **Quiet authority:** editorial hierarchy, measured whitespace, deep ink, and restrained blue rather than loud gradients or visual hype.
2. **Useful before decorative:** every component helps a visitor understand, compare, decide, or contact.
3. **Human business language:** visual references are workflows, decisions, and systems—not robots, glowing brains, or fictional dashboards.
4. **Accessible by default:** hierarchy, contrast, focus, motion, touch size, and error treatment are part of the design, not a later layer.

## Founder-confirmed direction

| Area | Direction | Consequence |
| --- | --- | --- |
| Overall character | Quiet authority | Calm editorial composition; strong hierarchy without aggressive scale or effects |
| Theme | Light-first | Warm light canvas throughout; dark surfaces limited to the footer and rare high-emphasis bands |
| Identity | Text-only wordmark | No invented symbol or monogram; use the words `TRL` and `The Right Lifestyle` |
| Visual content | Abstract systems graphics | Purpose-built lines, nodes, paths, and modular frames; no generic stock or synthetic business photography |

Changing one of these four directions requires founder confirmation. Token-level accessibility corrections that preserve the direction do not.

## Typography

### Families

- **Display:** `Newsreader`, with `Georgia`, `Times New Roman`, and `serif` fallbacks. Use for the hero and major editorial headings only.
- **Body and interface:** `Manrope`, with `Inter`, `Segoe UI`, `Helvetica Neue`, `Arial`, and `sans-serif` fallbacks. Use for paragraphs, labels, navigation, buttons, forms, prices, and data.
- **Technical/data exception:** use the body family with tabular numerals; no third font family.

At Gate 3, self-host only the WOFF2 files and weights actually used, and include their license files in the repository. Do not load fonts from a third-party runtime CDN. Pages must remain readable and stable with the fallback stacks.

### Scale

All sizes use `rem`; fluid steps use `clamp()` and must not prevent browser text resizing.

| Token | Size | Line height | Use |
| --- | --- | --- | --- |
| `--text-hero` | `clamp(2.75rem, 1.9rem + 3.6vw, 5.5rem)` | `0.98` | Home-page statement; Newsreader 500 |
| `--text-display` | `clamp(2.25rem, 1.7rem + 2.4vw, 4rem)` | `1.02` | Interior page title; Newsreader 500 |
| `--text-h2` | `clamp(1.75rem, 1.45rem + 1.25vw, 2.75rem)` | `1.12` | Section heading; Newsreader 500 |
| `--text-h3` | `clamp(1.25rem, 1.15rem + 0.45vw, 1.625rem)` | `1.25` | Card/group heading; Manrope 600 |
| `--text-lead` | `clamp(1.0625rem, 1rem + 0.3vw, 1.25rem)` | `1.6` | Introductory copy; Manrope 400 |
| `--text-body` | `1rem` | `1.65` | Body copy; Manrope 400 |
| `--text-small` | `0.875rem` | `1.5` | Supporting metadata; Manrope 500 |
| `--text-label` | `0.75rem` | `1.4` | Eyebrows and compact labels; Manrope 700 |

Typography rules:

- Hero and display headings use slight negative tracking (`-0.025em` to `-0.04em`); body copy uses normal tracking.
- Eyebrows may be uppercase with `0.12em` tracking. Do not set sentences or long labels in all caps.
- Default body measure is `65ch`; lead copy is `52ch`; display headings are normally no wider than `15ch`.
- Use sentence case for headings, buttons, and navigation.
- Prices and comparable values use `font-variant-numeric: tabular-nums`.
- Underlines identify links in body copy. Color alone must not carry link meaning.
- Never place text over a detailed graphic or low-contrast texture.

## Color

### Semantic palette

| Token | Value | Role |
| --- | --- | --- |
| `--color-canvas` | `#F7F4EC` | Primary warm-ivory page background |
| `--color-surface` | `#FFFFFF` | Cards, form fields, and raised content surfaces |
| `--color-surface-muted` | `#ECE8DE` | Quiet grouped regions and separators |
| `--color-ink` | `#132A3A` | Primary text and dark surfaces |
| `--color-text-muted` | `#405463` | Secondary text |
| `--color-action` | `#1C607A` | Primary links, controls, and active states |
| `--color-action-hover` | `#124A60` | Hover/pressed action state |
| `--color-accent-soft` | `#DCECF1` | Selected items and quiet information panels |
| `--color-border` | `#6F7F89` | Interactive and meaningful non-text boundaries; never the only state cue. Darkened from `#7C8C96` at Gate 3 for non-text contrast (D-012) |
| `--color-focus` | `#176B87` | Keyboard focus ring on light surfaces |
| `--color-focus-inverse` | `#F7F4EC` | Keyboard focus ring on ink/dark surfaces |
| `--color-success` | `#246B4D` | Success text/icon where required |
| `--color-danger` | `#9C3434` | Error text/icon where required |

### Color rules

- The warm canvas and ink carry most of the interface; action blue should occupy a small visual share.
- Avoid pure black, bright cyan, neon, rainbow gradients, metallic simulations, glassmorphism, and glow effects.
- Soft accent panels use ink or action text, never low-contrast muted text.
- Dark sections use ink as the background and canvas/white as text. They are exceptions, not an alternating-section pattern.
- Success and danger states always pair color with text and, when useful, an icon.
- No public theme toggle or dark mode is included in Phase 1.

Contrast checks for the pairings the interface actually uses. Every value below is recomputed in `tests/unit/design-tokens.test.ts`, so a palette edit that drops a pairing under its threshold fails CI.

Text pairings (AA threshold 4.5:1 for normal text):

| Pairing | Ratio |
| --- | --- |
| Ink on canvas | `13.46:1` |
| Ink on white surface | `14.79:1` |
| Muted text on canvas | `7.17:1` |
| Action on canvas | `6.36:1` |
| Action on soft accent | `5.76:1` |
| White on action | `6.99:1` |
| White on action hover | `9.66:1` |
| Canvas on ink (dark sections) | `13.46:1` |
| Soft accent on ink | `12.19:1` |
| Danger on white surface | `7.11:1` |
| Success on white surface | `6.39:1` |

Non-text pairings (AA threshold 3:1 for boundaries and focus indicators):

| Pairing | Ratio |
| --- | --- |
| Border on white surface | `4.14:1` |
| Border on canvas | `3.77:1` |
| Border on soft accent | `3.41:1` |
| Border on muted surface | `3.38:1` |
| Focus ring on canvas | `5.48:1` |
| Focus ring on white surface | `6.02:1` |
| Focus ring on muted surface | `4.92:1` |
| Inverse focus ring on ink | `13.46:1` |

The Gate 2 border value `#7C8C96` met 3:1 on white and canvas but reached only `2.84:1` on the muted surface, where cards and fields also sit. It was darkened to `#6F7F89` during implementation (D-012). Passing token pairs does not by itself certify a page: rendered states are additionally checked by the axe runs in both test suites.

## Spacing, shape, and depth

Use a four-pixel base. Components may consume only the named spacing tokens unless a documented optical correction is necessary.

| Token | Value | Typical use |
| --- | --- | --- |
| `--space-1` | `0.25rem` | Tight icon/label adjustment |
| `--space-2` | `0.5rem` | Inline gap |
| `--space-3` | `0.75rem` | Compact control gap |
| `--space-4` | `1rem` | Default component gap |
| `--space-6` | `1.5rem` | Card internal gap |
| `--space-8` | `2rem` | Component group |
| `--space-12` | `3rem` | Small section separation |
| `--space-16` | `4rem` | Mobile section rhythm |
| `--space-24` | `6rem` | Standard desktop section rhythm |
| `--space-32` | `8rem` | Major desktop separation |

Additional tokens:

- Small radius: `0.375rem`; standard radius: `0.75rem`; pill radius: `999px` only for tags and compact status elements.
- Controls and cards use the standard radius or less. Avoid excessively rounded “bubble” layouts.
- Default border: `1px solid var(--color-border)`.
- Shadows are rare: use a subtle low-elevation shadow only when border and placement cannot communicate layering. Do not stack multiple shadows.
- Dividers align to the content grid and should not run edge to edge without purpose.

## Layout

- **Wide container:** maximum `80rem` (`1280px`).
- **Standard content container:** maximum `72rem` (`1152px`).
- **Reading measure:** maximum `65ch`.
- **Inline gutter:** `clamp(1.25rem, 4vw, 4rem)`.
- **Section block spacing:** `clamp(4rem, 9vw, 8rem)`.
- **Grid:** mobile-first single column; use deliberate two- and three-column compositions when content supports them. A twelve-column desktop grid may organize complex sections but is not visible decoration.
- **Alignment:** predominantly left aligned. Centered copy is reserved for short transitional or final-call-to-action moments.
- **Asymmetry:** a restrained `7/5` or `8/4` split may pair narrative content with a systems graphic. Avoid arbitrary masonry.

Reference breakpoints are `40rem` and `64rem`, but components must break where their content requires rather than targeting devices. The system must work from `320px` CSS width upward without horizontal page scrolling and remain usable at 200% text zoom.

## Identity and visual language

### Wordmark

The first-release identity is a typographic lockup, not a new logo symbol:

- Primary line: `TRL`, set with deliberate spacing and no decorative icon.
- Descriptor: `THE RIGHT LIFESTYLE`, set in the body family as a compact uppercase label.
- The lockup is one home-page link with the accessible name “TRL — The Right Lifestyle.”
- A compact `TRL` treatment may be used only where the full descriptor cannot fit; it must not be presented as a separately designed emblem.
- Do not distort, outline, gradient-fill, animate, or add effects to the wordmark.

### Systems graphics

Graphics should make invisible operational structure visible:

- Use thin paths, junctions, nodes, modular frames, sequencing, and directional relationships.
- Prefer one meaningful diagram-like composition to decorative repetition.
- Use palette tokens only; action blue marks the important path rather than coloring every node.
- Do not display fabricated metrics, client data, software interfaces, or “live” statuses.
- Decorative SVGs are `aria-hidden="true"` and non-focusable. Informational graphics need equivalent adjacent text.
- Keep critical meaning outside the graphic so it survives high contrast modes, missing CSS, and small screens.
- No stock photography, AI-generated portraits, robot/brain imagery, floating holograms, or unapproved founder imagery.

## Core components

### Skip link

The first focusable element. It is visually hidden until focused, then appears above all page chrome with a clear focus ring and a direct path to the main content.

### Header and navigation

- Light canvas, text wordmark, primary navigation, and one clear contact action.
- Desktop navigation appears when it fits without crowding; mobile uses a labelled menu control with at least a `44px` target.
- The current page is indicated in text/semantics as well as color (`aria-current="page"`).
- Sticky behavior is allowed only if it does not consume excessive viewport height or obscure focused targets.
- If the mobile menu uses script, it must manage expanded state, focus, Escape, and return focus. Prefer the smallest progressively enhanced implementation.

### Buttons and links

- **Primary button:** action background, white text, one outcome-oriented label.
- **Secondary button:** transparent or surface background, ink text, visible ink/action border.
- **Text link:** underlined in content; compact arrow treatment allowed for navigational card links.
- Minimum target: `44px × 44px`; standard control height: `48px`.
- One primary action per component region. Do not create two controls with equal visual dominance.
- Hover is an enhancement, never the sole feedback. Pressed and focus-visible states are explicit.
- Do not render inactive or placeholder controls as if they work.

### Section introduction

Optional eyebrow, one heading, and short lead. Keep it narrower than the section content to preserve hierarchy. Do not repeat generic labels such as “Our services” when the heading already says it.

### Service card

A clear title, problem/capability statement, concrete deliverable summary, and one navigation action. Cards use borders and whitespace rather than heavy shadow. Entire-card click targets are optional but must not create nested interactive controls.

### Offer card

- Offer name, approved price, fit statement, deliverables, explicit inclusions/exclusions, and one inquiry action.
- The offer staircase order remains Micro Audit → Builder Automation Setup → Transformation / Founder OS.
- Emphasis may use a top rule or soft-accent surface; do not label an offer “most popular” without evidence.
- Prices must remain readable text, not artwork, and use tabular numerals.

### Process/step list

A numbered sequence with concise step labels and explanatory copy. On small screens it is vertical. Connecting lines are decorative and may disappear without losing meaning.

### Trust statement

Use transparent operating principles—what TRL does, does not do, and what happens next—instead of fabricated logos, testimonials, counters, or badges.

### Contact methods

Email and WhatsApp are visible as plain, recognizable actions. The persistent WhatsApp affordance must have a text label or accessible name, respect safe-area insets, avoid obscuring content, and not pulse or demand attention.

### Form controls

- Labels remain visible above inputs; placeholders are examples, never labels.
- Inputs use at least `1rem` text and `48px` height. Textareas provide a useful initial height and can resize vertically.
- Required/optional status is stated in text.
- Instructions precede the relevant control and connect through `aria-describedby`.
- Invalid fields use danger text, an icon or explicit word, a stronger boundary, and an accessible error association—not color alone.
- On failed submission, place focus on an error summary that links to invalid fields. Preserve valid user input.
- Success and system-error messages are concise, receive appropriate live-region behavior, and never expose internal details.
- Loading controls preserve their label context, prevent duplicate submission, and do not rely on an indefinite spinner.

**Implemented at Gate 4** on `/contact/`: the error summary takes focus via `autofocus` on a `tabindex="-1"` container (asserted by the browser suite in a real engine), links to each invalid field, and per-field errors render through the `Field` primitive with `aria-invalid` and `aria-describedby` associations. All submitted values are preserved on every failure render. The success state is a full page (`/contact/sent/`) rather than a live-region swap, because the form is a plain server-rendered POST with no client script (D-010) — a page load announces itself. The Turnstile widget sits inside the fieldset so an unconfigured deployment disables it with the rest of the form; its script is the sanctioned third-party exception (D-015), and the widget uses the light theme and the compact size — the content column is 280px at the 320px reflow floor, and every other Turnstile size has a 300px minimum.

### Notices

Information, success, warning, and error notices use a short heading where needed and plain language. Do not use toast-only feedback for form outcomes or other important state.

### Footer

The footer may use the ink background as the principal dark surface. It contains the full wordmark, core routes, approved contact channels, and legal navigation. It must not imply registrations, memberships, locations, or credentials that have not been approved.

## Page patterns

- **Home:** positioning hero → operational problem/outcome framing → service areas → systems/process explanation → approved offer staircase → truthful trust statement → contact action.
- **Interior marketing page:** compact page introduction → scannable content groups → relevant offer/contact path.
- **Offers:** comparison introduction → three complete offer cards in staircase order → engagement steps → contact action.
- **Contact:** direct channel choices → inquiry form → concise data-use reassurance. Do not hide email or WhatsApp behind the form.
- **Legal:** narrow reading measure, clear effective-status/date area, and conventional heading hierarchy. Placeholder legal text is not represented as approved policy.

## Interaction and motion

- Default transition duration: `160ms`; complex but necessary state transition maximum: `240ms`.
- Default easing: `cubic-bezier(0.2, 0.7, 0.2, 1)`.
- Animate only color, border color, opacity, and small purposeful transforms. Avoid layout-shifting animation.
- No autoplay video, parallax, scroll-jacking, cursor effects, looping marquees, pulsing contact buttons, or content that waits for a reveal animation to become readable.
- Hover motion, if used, is no more than a `1–2px` shift and appears only under a hover-capable media query.
- Under `prefers-reduced-motion: reduce`, remove smooth scrolling and nonessential animation/transforms; make state changes effectively immediate. Content remains available when animation does not run.

## Focus and input modes

- Every interactive element receives a visible `3px` focus ring in `--color-focus` on light surfaces or `--color-focus-inverse` on ink/dark surfaces, with at least a `3px` offset where the component allows.
- Never remove the native outline without providing the documented replacement.
- Focus must not be hidden behind a sticky header or floating control.
- Keyboard order follows reading order; DOM order is not rearranged visually into a conflicting sequence.
- Hover styles are inside `@media (hover: hover)` where appropriate. Touch and keyboard users receive equivalent state information.
- Components remain understandable in Windows forced-colors/high-contrast mode; borders and system focus cues are retained.

## Responsive behavior

- Start with one-column source order and add layout only when space permits.
- Header/navigation, offer comparison, and multi-column service sections collapse without changing reading or focus order.
- Systems graphics simplify or move below text on narrow screens; they never force horizontal scrolling.
- Buttons may become full width on narrow screens but return to content width when room permits.
- Persistent controls account for `env(safe-area-inset-*)` and leave the last content/field unobstructed.
- Long email addresses, URLs, and offer names wrap safely.
- Verify at representative widths around `320`, `375`, `768`, `1024`, and `1440` CSS pixels, plus content-driven stress cases; these are test points, not device-specific designs.

## Accessibility acceptance criteria

Gate 3 implementation and later verification must demonstrate:

- WCAG 2.2 AA as the release target, including text/non-text contrast, focus visibility, target size, and reflow.
- Semantic landmarks, one clear page-level heading, ordered heading levels, descriptive page titles, and a working skip link.
- Full keyboard operation with visible focus and no focus trap.
- Meaningful links and buttons out of context; no “click here.”
- Form labels, instructions, errors, status announcements, and server validation are accessible.
- No essential information is conveyed through color, position, motion, or a graphic alone.
- Browser zoom, text resize, reduced motion, high contrast, coarse pointer, and no-JavaScript behavior are considered.

Automated checks support but do not replace a manual keyboard, zoom/reflow, reduced-motion, contrast, and screen-reader smoke test.

## Implementation status (Gate 3)

The system is implemented. Tokens live in `src/styles/tokens.css` as the single source of token values; `src/styles/global.css` holds the reset, base typography, focus treatment, layout primitives, and motion rules; component styles are scoped inside each `.astro` component. No CSS framework or animation library is used.

| Specified item | Implementation |
| --- | --- |
| Token layer | `src/styles/tokens.css` |
| Skip link | `src/layouts/BaseLayout.astro` — first focusable element, visible on focus |
| Header and navigation | `src/components/SiteHeader.astro` — `aria-current="page"`, no script (D-010) |
| Wordmark | `src/components/Wordmark.astro` — text only, accessible name "TRL — The Right Lifestyle" |
| Buttons and links | `src/components/Button.astro` — 48px control height, hover behind `@media (hover: hover)` |
| Section / page introduction | `SectionIntro.astro`, `PageIntro.astro` |
| Service card | `src/components/Card.astro` |
| Offer card | `src/components/OfferCard.astro` — staircase order, tabular prices, exclusions stated |
| Process / principle list | `src/components/StepList.astro` |
| Trust statement | Operating principles on the home and about pages |
| Contact methods | `WhatsAppAffordance.astro` plus the direct-channel block on `/contact/` |
| Form controls | `src/components/Field.astro` — visible labels, required/optional in words, wired error slot |
| Notices | `src/components/Notice.astro` — tone carried by a word, not colour alone |
| Footer | `src/components/SiteFooter.astro` — ink surface, full wordmark, approved channels |
| Systems graphics | `src/components/SystemsGraphic.astro` — token colours, `aria-hidden`, no fabricated data |

Deviations and implementation decisions recorded: D-010 (no client JavaScript, so no mobile menu toggle), D-011 (contact form ships disabled), D-012 (border token darkened), D-013 (legal pages ship as labelled drafts). No other deviations were made.

### Standing notes for future work

- Components consume semantic tokens rather than repeating hex values.
- Keep the base document useful before fonts, CSS, or client JavaScript finish loading.
- Treat this document as the design source of truth. Record intentional deviations rather than silently introducing one-off styles.
