/**
 * Security headers and Content Security Policy (Gate 5).
 *
 * The single source of truth for the response-security headers. It is
 * consumed in two places:
 *
 * - `src/middleware.ts` — applies the contact CSP (with the Turnstile
 *   exception) to every Worker-rendered response, i.e. `/contact/` (D-014's
 *   one server route) plus the error/redirect responses it produces. Static
 *   assets are served straight from the ASSETS binding and never reach the
 *   Worker, so they do not run the middleware (proven by Cloudflare's static
 *   asset docs and the adapter's `matchStaticAsset` short-circuit).
 * - `public/_headers` — a committed mirror of the common headers plus the
 *   static-pages CSP, applied by Cloudflare's edge to every static asset
 *   (including the prerendered HTML routes).
 *
 * `tests/unit/security-headers.test.ts` pins the mirror to this module so the
 * two cannot drift.
 *
 * Framing protection (X-Frame-Options / CSP frame-ancestors) and
 * Strict-Transport-Security are deliberately NOT here: they are
 * deployment-gate platform rules (the preview harness embeds the site
 * cross-origin, and HSTS is only meaningful on the final HTTPS domain). See
 * D-018 and docs/TRL_SECURITY.md.
 */

/** Headers that apply to every response, static and Worker-rendered alike. */
export const COMMON_SECURITY_HEADERS: readonly [string, string][] = [
  ['X-Content-Type-Options', 'nosniff'],
  ['Referrer-Policy', 'strict-origin-when-cross-origin'],
  ['Permissions-Policy', 'camera=(), geolocation=(), microphone=()'],
];

/**
 * CSP for the prerendered routes. They ship zero client JavaScript (D-010),
 * so `script-src 'none'` mechanically enforces that baseline: any future
 * script tag on a static route is blocked by the browser. The JSON-LD
 * `<script type="application/ld+json">` block is a data block, not
 * executable script, so `script-src` does not apply to it. Scoped component
 * styles are inlined as `<style>` blocks at build time, hence the deliberate
 * `'unsafe-inline'` in `style-src` (there is no first-party `style-src`
 * origin to allow instead).
 */
export const STATIC_PAGES_CSP: string = [
  "default-src 'self'",
  "base-uri 'self'",
  "script-src 'none'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self'",
  "font-src 'self'",
  "connect-src 'self'",
  "form-action 'self'",
  "object-src 'none'",
  'upgrade-insecure-requests',
].join('; ');

/**
 * CSP for `/contact/`, the one Worker-rendered route. The only behavioural
 * difference from the static pages is the sanctioned Turnstile exception
 * (D-015): the widget's script and its challenge iframe are allowed from
 * `challenges.cloudflare.com`, and nothing else. There is still no inline
 * script to permit, so no `'unsafe-inline'`/`'unsafe-eval'` appears in
 * `script-src`.
 */
export const CONTACT_PAGE_CSP: string = [
  "default-src 'self'",
  "base-uri 'self'",
  'script-src https://challenges.cloudflare.com',
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self'",
  "font-src 'self'",
  "connect-src 'self'",
  'frame-src https://challenges.cloudflare.com',
  "form-action 'self'",
  "object-src 'none'",
  'upgrade-insecure-requests',
].join('; ');

/**
 * Applies the common headers plus `csp` to a response. Returns a new
 * Response because the headers of a response produced by the runtime are not
 * guaranteed to be mutable (the Cloudflare adapter itself reconstructs a
 * Response before mutating headers, for the same reason).
 */
export function withSecurityHeaders(response: Response, csp: string): Response {
  const secured = new Response(response.body, response);
  for (const [name, value] of COMMON_SECURITY_HEADERS) {
    secured.headers.set(name, value);
  }
  secured.headers.set('Content-Security-Policy', csp);
  return secured;
}
