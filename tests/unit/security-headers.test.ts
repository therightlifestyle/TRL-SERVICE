import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { buildOnce } from './helpers/build-once';
import { DIST, readBuildOrigin } from './helpers/build-artifacts';
import {
  COMMON_SECURITY_HEADERS,
  CONTACT_PAGE_CSP,
  STATIC_PAGES_CSP,
  withSecurityHeaders,
} from '../../src/lib/security';

/*
 * Gate 5: the security headers and CSP.
 *
 * The canonical policy lives in src/lib/security.ts. It is consumed twice:
 * the contact CSP by src/middleware.ts (Worker-rendered /contact/), and the
 * static-pages CSP by public/_headers (Cloudflare edge headers on static
 * asset responses — including every prerendered HTML route).
 *
 * This suite asserts (a) the policy contents and (b) that the committed
 * `_headers` mirror cannot drift from the canonical module, by reading the
 * build output and comparing it token-for-token.
 */

/* The origin this artifact was built with (D-021) — never a hardcoded domain. */
let ORIGIN = '';

/**
 * Parses a Cloudflare `_headers` file into `{ [pathPattern]: Map<name, value> }`.
 * Header lines are the indented `Name: value ` lines under each path line.
 */
function parseHeadersFile(content: string): Map<string, Map<string, string>> {
  const rules = new Map<string, Map<string, string>>();
  let currentPattern: string | null = null;

  for (const rawLine of content.split('\n')) {
    if (rawLine.trim() === '' || rawLine.trimStart().startsWith('#')) continue;
    const isPatternLine = !rawLine.startsWith(' ') && !rawLine.startsWith('\t');
    if (isPatternLine) {
      currentPattern = rawLine.trim();
      rules.set(currentPattern, new Map<string, string>());
      continue;
    }
    if (currentPattern === null) continue;
    const separator = rawLine.indexOf(':');
    if (separator === -1) continue;
    const name = rawLine.slice(0, separator).trim().toLowerCase();
    const value = rawLine.slice(separator + 1).trim();
    rules.get(currentPattern)!.set(name, value);
  }

  return rules;
}

beforeAll(() => {
  buildOnce();
  ORIGIN = readBuildOrigin();
}, 180_000);

describe('policy contents', () => {
  it('static pages disallow every script and never allow Turnstile', () => {
    expect(STATIC_PAGES_CSP).toContain("script-src 'none'");
    expect(STATIC_PAGES_CSP).not.toContain('challenges.cloudflare.com');
    expect(STATIC_PAGES_CSP).not.toContain("'unsafe-eval'");
  });

  it('the contact page allows exactly the sanctioned Turnstile script and frame', () => {
    expect(CONTACT_PAGE_CSP).toContain('script-src https://challenges.cloudflare.com');
    expect(CONTACT_PAGE_CSP).toContain('frame-src https://challenges.cloudflare.com');
    // The Turnstile exception is additive only: the script-src directive
    // gains the Turnstile origin and neither inline nor eval'd script.
    const scriptSrc = CONTACT_PAGE_CSP.match(/script-src [^;]+/)?.[0] ?? '';
    expect(scriptSrc).toBe('script-src https://challenges.cloudflare.com');
    // Form submissions stay same-origin — required by the contact flow.
    expect(CONTACT_PAGE_CSP).toContain("form-action 'self'");
  });

  it('both policies carry the same defensive core', () => {
    for (const csp of [STATIC_PAGES_CSP, CONTACT_PAGE_CSP]) {
      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("base-uri 'self'");
      expect(csp).toContain("style-src 'self' 'unsafe-inline'");
      expect(csp).toContain("object-src 'none'");
      expect(csp).toContain('upgrade-insecure-requests');
    }
  });
});

describe('withSecurityHeaders', () => {
  it('adds the common headers and the given CSP to any response', () => {
    const original = new Response('<p>ok</p>', {
      status: 200,
      headers: { 'Content-Type': 'text/html', Location: '/contact/sent/' },
    });
    const secured = withSecurityHeaders(original, CONTACT_PAGE_CSP);

    expect(secured.status).toBe(200);
    expect(secured.headers.get('Location')).toBe('/contact/sent/');
    expect(secured.headers.get('Content-Type')).toBe('text/html');
    for (const [name, value] of COMMON_SECURITY_HEADERS) {
      expect(secured.headers.get(name)).toBe(value);
    }
    expect(secured.headers.get('Content-Security-Policy')).toBe(CONTACT_PAGE_CSP);
    expect(secured.body).toBe(original.body);
  });

  it('replaces any pre-existing security header on the response', () => {
    const original = new Response('x', {
      headers: { 'X-Content-Type-Options': 'garbage', 'Content-Security-Policy': 'default-src *' },
    });
    const secured = withSecurityHeaders(original, STATIC_PAGES_CSP);

    expect(secured.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(secured.headers.get('Content-Security-Policy')).toBe(STATIC_PAGES_CSP);
  });
});

describe('the committed _headers mirror', () => {
  it('applies the common headers and the static CSP to every static path', () => {
    const content = readFileSync(join(DIST, '_headers'), 'utf8');
    const rules = parseHeadersFile(content);
    const all = rules.get('/*');

    expect(all, 'the /* rule must exist').toBeDefined();
    for (const [name, value] of COMMON_SECURITY_HEADERS) {
      expect(all!.get(name.toLowerCase()), `${name} missing from /*`).toBe(value);
    }
    expect(all!.get('content-security-policy')).toBe(STATIC_PAGES_CSP);
  });

  it('contains no malformed section headers from the authored file', () => {
    // The source file documents itself with `#` comments only. A stray `/*`
    // line (authoring mistake) or an unindented `Header:` line would be read
    // as an extra path pattern and change which rules apply where.
    const content = readFileSync(join(DIST, '_headers'), 'utf8');
    const rules = parseHeadersFile(content);

    expect(rules.has('/*')).toBe(true);
    // The only patterns are the catch-all, the adapter's immutable-cache rule
    // for hashed assets, and the font cache rule added by the Gate 5
    // performance review (D-020).
    expect([...rules.keys()].sort()).toEqual(['/*', '/_astro/*', '/fonts/*']);
  });

  it('sets the immutable cache rule for hashed static assets', () => {
    const content = readFileSync(join(DIST, '_headers'), 'utf8');
    const rules = parseHeadersFile(content);

    expect(rules.get('/_astro/*')?.get('cache-control')).toBe(
      'public, max-age=31536000, immutable',
    );
  });

  it('sets a long-lived cache rule for the self-hosted fonts', () => {
    // Measured on the preview before this rule existed: /fonts/* fell through
    // to the platform default `public, max-age=0, must-revalidate`, so the
    // 48 KB of render-critical subsets were revalidated on every visit.
    const content = readFileSync(join(DIST, '_headers'), 'utf8');
    const rules = parseHeadersFile(content);

    expect(rules.get('/fonts/*')?.get('cache-control')).toBe(
      'public, max-age=31536000, immutable',
    );
  });
});

describe('policy matches what the build actually ships', () => {
  const staticPages = [
    'index.html',
    '404.html',
    'about/index.html',
    'services/index.html',
    'ai-solutions/index.html',
    'offers/index.html',
    'privacy/index.html',
    'terms/index.html',
    'contact/sent/index.html',
  ];

  it.each(staticPages)('%s ships no executable script or off-origin resource', (page) => {
    // `script-src 'none'` must never break a real page: the only <script>
    // elements allowed to exist are JSON-LD data blocks (exempt from CSP
    // script-src), and every loaded subresource must be same-origin (plain
    // anchors navigate rather than load, so they are not governed here).
    const html = readFileSync(join(DIST, page), 'utf8');

    const scripts = [...html.matchAll(/<script\b[^>]*>/g)].map((m) => m[0]);
    for (const tag of scripts) {
      expect(tag, `${page}: unexpected executable script tag`).toMatch(
        /type="application\/ld\+json"/,
      );
    }

    // Same resource-element scan as tests/unit/rendered-pages.test.ts.
    const resourceLoader =
      /<(?:script|link|img|iframe|audio|video|source|embed|object|track)[^>]+(?:src|href)="(https?:\/\/[^"]+)"/g;
    const externals = [...html.matchAll(resourceLoader)]
      .map((m) => m[1])
      .filter((url) => !url.startsWith(ORIGIN));
    expect(externals, `${page} loads an off-origin resource the CSP would block`).toEqual([]);
  });
});
