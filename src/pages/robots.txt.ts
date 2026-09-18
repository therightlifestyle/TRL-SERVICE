import type { APIRoute } from 'astro';
import { indexingEnabled, robotsTxt } from '../lib/indexing';

/*
 * robots.txt is generated at build time rather than committed in public/ so the
 * crawl policy is derived from the same two facts the pages are: the configured
 * origin and the indexing flag. A committed file would carry a hardcoded domain
 * (the previous version pointed at a domain the founder does not own) and could
 * disagree with the meta robots directives on the pages themselves.
 *
 * This route is prerendered: the output is a static robots.txt in dist/client/,
 * served from the ASSETS binding like any other asset.
 */
export const prerender = true;

export const GET: APIRoute = ({ site }) => {
  // `site` is the configured PUBLIC_SITE_URL origin. The build guard makes it
  // mandatory, so an empty origin here would mean the guard was bypassed.
  const origin = site?.origin ?? '';
  const body = robotsTxt({ indexing: indexingEnabled(), origin });

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
