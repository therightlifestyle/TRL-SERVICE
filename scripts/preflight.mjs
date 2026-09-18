#!/usr/bin/env node
/*
 * TRL deployment preflight (Gate 6).
 *
 * Answers one question without any credentials, account, or network access:
 * "if this build were deployed right now, would it be a deployment we intend?"
 *
 * It checks the build variables, the Wrangler configuration, and the repository
 * for the specific mistakes that are cheap to make and expensive to discover
 * after a deploy — a missing or malformed origin, an unreadable indexing flag, a
 * committed account id or credential, an unprovisioned rate limiter. Warnings
 * are things a human must decide; errors stop a build.
 *
 * Usage: npm run preflight
 * Exit code: 0 when there are no errors (warnings allowed), 1 otherwise.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const errors = [];
const warnings = [];
const notes = [];

const fail = (message) => errors.push(message);
const warn = (message) => warnings.push(message);

/**
 * Strips // and block comments from JSONC without touching string contents, so
 * a `//` inside a value (a URL, for instance) cannot truncate the config.
 */
function stripJsonComments(input) {
  let output = '';
  let inString = false;
  let escaped = false;

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    const next = input[i + 1];

    if (inString) {
      output += char;
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') inString = false;
      continue;
    }

    if (char === '"') {
      inString = true;
      output += char;
      continue;
    }

    if (char === '/' && next === '/') {
      while (i < input.length && input[i] !== '\n') i += 1;
      output += '\n';
      continue;
    }

    if (char === '/' && next === '*') {
      i += 2;
      while (i < input.length && !(input[i] === '*' && input[i + 1] === '/')) i += 1;
      i += 1;
      continue;
    }

    output += char;
  }

  return output;
}

/* ---------------------------------------------------------------- origin --- */

const rawOrigin = (process.env.PUBLIC_SITE_URL ?? '').trim();
let origin = '';

if (!rawOrigin) {
  fail(
    'PUBLIC_SITE_URL is not set. The build refuses to run without it, and there is no\n' +
      '    default by design: the intended domain is not owned, so a default would put a\n' +
      '    claim into the build that the business cannot back (D-021).\n' +
      '    Set it (a real environment variable — .env is read too late for astro.config),\n' +
      '    for example: PUBLIC_SITE_URL="https://trl-service.<subdomain>.workers.dev"',
  );
} else {
  try {
    const parsed = new URL(rawOrigin);
    origin = parsed.origin;
    if (!/^https?:$/.test(parsed.protocol)) {
      fail(`PUBLIC_SITE_URL must be http or https, got ${parsed.protocol}`);
    }
    if (parsed.pathname !== '/' || parsed.search || parsed.hash) {
      fail(`PUBLIC_SITE_URL must be an origin only, without a path, query, or fragment: ${rawOrigin}`);
    }
  } catch {
    fail(`PUBLIC_SITE_URL is not a valid absolute URL: ${JSON.stringify(rawOrigin)}`);
  }
}

/* --------------------------------------------------------------- indexing --- */

const rawIndexing = (process.env.PUBLIC_ALLOW_INDEXING ?? '').trim();
let indexing = false;

if (rawIndexing === '') {
  notes.push(
    'PUBLIC_ALLOW_INDEXING is unset, so indexing is OFF: every page will carry\n' +
      '    noindex, robots.txt will not advertise the sitemap, and crawlers are told to\n' +
      '    stay away from search results. This is the correct state until the real domain\n' +
      '    is live (D-022).',
  );
} else if (rawIndexing === 'true') {
  indexing = true;
} else if (rawIndexing === 'false') {
  // Explicitly off; same outcome as unset.
} else {
  fail(
    `PUBLIC_ALLOW_INDEXING must be exactly "true" or "false" (or unset), got ${JSON.stringify(
      rawIndexing,
    )}. A build with an unrecognised value stops rather than guessing.`,
  );
}

const isWorkersDev = origin.endsWith('.workers.dev');

if (indexing && isWorkersDev) {
  warn(
    `${origin} is a temporary workers.dev host and indexing is ON.\n` +
      '    An indexed interim host competes with the site\'s own future domain, and removing\n' +
      '    it from search results later takes weeks. Turn indexing on when the real domain\n' +
      '    is live, not before.',
  );
}

if (indexing && !isWorkersDev && origin) {
  notes.push(`${origin} will be indexed: pages carry no robots directive and robots.txt lists the sitemap.`);
}

/* ---------------------------------------------------------------- wrangler --- */

const wranglerPath = join(root, 'wrangler.jsonc');
let config = null;

if (!existsSync(wranglerPath)) {
  fail('wrangler.jsonc is missing.');
} else {
  const source = readFileSync(wranglerPath, 'utf8');
  try {
    config = JSON.parse(stripJsonComments(source));
  } catch (error) {
    fail(`wrangler.jsonc could not be parsed: ${error.message}`);
  }

  if (config) {
    if (config.name !== 'trl-service') {
      warn(`wrangler.jsonc names the Worker "${config.name}", expected "trl-service".`);
    }
    if (config.observability?.enabled !== true) {
      warn('wrangler.jsonc does not enable observability: Worker logs would be unavailable.');
    }
    if ('account_id' in config) {
      fail(
        'wrangler.jsonc contains account_id. It is deliberately not committed (D-023):\n' +
          '    Workers Builds supplies the account context, and a wrong value deploys against\n' +
          '    whichever account owns that identifier. Remove it.',
      );
    } else {
      notes.push('account_id is absent, as intended: Workers Builds supplies the account context (D-023).');
    }

    const rateLimits = Array.isArray(config.ratelimits) ? config.ratelimits : [];
    if (rateLimits.length === 0) {
      warn(
        'The contact-endpoint rate limiter is still unprovisioned (no active `ratelimits`\n' +
          '    entry). POST /contact/ fails open, which is correct for a preview but not for a\n' +
          '    public launch: uncomment the block in wrangler.jsonc and set the account-scoped\n' +
          '    namespace_id (docs/TRL_RATE_LIMITING.md).',
      );
    } else {
      const entry = rateLimits[0] ?? {};
      if (!entry.namespace_id || /[<>]/.test(String(entry.namespace_id))) {
        fail('The `ratelimits` entry has no real namespace_id — it still carries the placeholder.');
      } else {
        notes.push(
          `Rate limiting is provisioned: ${entry.name} at ${entry.simple?.limit} requests per ${
            entry.simple?.period
          }s.`,
        );
      }
    }
  }

  if (source.includes('dist/client/wrangler.json')) {
    fail('wrangler.jsonc still points at dist/client/wrangler.json; the generated config is in dist/server/.');
  }
}

/* ------------------------------------------------------------------ files --- */

for (const secretFile of ['.dev.vars', '.env', '.env.local']) {
  if (!existsSync(join(root, secretFile))) continue;
  try {
    const tracked = execFileSync('git', ['ls-files', '--error-unmatch', secretFile], {
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim();
    if (tracked) fail(`${secretFile} is tracked by git. Credentials must never be committed.`);
  } catch {
    // Not tracked (git exit code 1) or no git available: both are fine here.
  }
}

if (existsSync(join(root, 'dist', 'client', 'index.html'))) {
  notes.push('A build already exists in dist/. It will be replaced by the next build.');
}

/* ----------------------------------------------------------------- report --- */

const line = '─'.repeat(66);
console.log(`\nTRL deployment preflight\n${line}`);

if (origin && !errors.length) {
  console.log(`Using origin:   ${origin}${isWorkersDev ? '  (temporary workers.dev host)' : ''}`);
  console.log(`Indexing:       ${indexing ? 'ON — pages are indexable' : 'OFF — pages carry noindex'}`);
}

for (const note of notes) console.log(`\n  note  ${note}`);
for (const message of warnings) console.log(`\n  warn  ${message}`);

if (errors.length) {
  for (const message of errors) console.log(`\n  FAIL  ${message}`);
  console.log(`\n${line}`);
  console.log(`Preflight failed: ${errors.length} error(s), ${warnings.length} warning(s).\n`);
  process.exit(1);
}

console.log(`\n${line}`);
console.log(`Preflight passed with ${warnings.length} warning(s).`);
console.log(
  '\nNext:\n' +
    '  npm run build            # produces dist/client (static) and dist/server (Worker)\n' +
    '  npx wrangler deploy      # uploads it; requires an authenticated Cloudflare account\n' +
    '\nSee docs/TRL_GATE6_FOUNDER_CHECKLIST.md for the ordered deployment steps.\n',
);
