/**
 * Response-security middleware (Gate 5).
 *
 * Runs only for requests the Worker actually handles — `/contact/` (the one
 * server-rendered route) and its error/redirect responses. Every static
 * asset, including the prerendered HTML pages, is served directly from the
 * ASSETS binding before the Worker runs, so security headers for those are
 * applied at the edge from `public/_headers` instead (D-018).
 *
 * One deliberate exception: a form POST rejected internally by Astro's
 * built-in origin check (`checkOrigin`) — no Origin, or a foreign one —
 * short-circuits before this middleware runs, so that 403 carries no custom
 * headers. That response is bare text with no content, so there is nothing to
 * harden; the boundary is documented, not worked around.
 *
 * The contact CSP below is the static-pages CSP plus D-015's one sanctioned
 * exception: the Cloudflare Turnstile script and challenge iframe on
 * `challenges.cloudflare.com`. See src/lib/security.ts for the canonical
 * policy definitions.
 */

import { defineMiddleware } from 'astro:middleware';
import { CONTACT_PAGE_CSP, withSecurityHeaders } from './lib/security';

export const onRequest = defineMiddleware(async (_context, next) => {
  const response = await next();
  // `next()` is typed `Response | void`; the render pipeline always answers
  // with a Response here. If it ever did not, passing the unresolved value
  // back preserves Astro's own default handling.
  if (!(response instanceof Response)) return response;
  return withSecurityHeaders(response, CONTACT_PAGE_CSP);
});
