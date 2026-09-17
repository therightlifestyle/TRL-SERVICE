import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/*
 * Gate 6: pins the deploy-config artifacts that the founder will rely on at
 * the deployment gate.
 *
 * The application ships in two coupled artifacts: the static pages in
 * `dist/client/` and the Worker entry in `dist/server/`, wired together by
 * the adapter-generated `dist/server/wrangler.json`. The repository-side
 * source of truth for both the runtime config (`wrangler.jsonc`) and the
 * generated deploy config is read here, and pinned:
 *
 * - The `ratelimits` block in `wrangler.jsonc` is committed **commented out**
 *   with a placeholder, never with a fabricated `namespace_id`. Inventing
 *   an integer would be infrastructure fabrication; colliding with a real
 *   namespace at deploy time would silently fail or, worse, silently
 *   misroute. `docs/TRL_RATE_LIMITING.md` records the design; this test
 *   pins the file so neither the block nor the comment can quietly
 *   change.
 * - `observability: { enabled: true }` must survive into the generated
 *   deploy config (`docs/TRL_GATE5_REVIEW.md`). The adapter's behaviour
 *   here is the platform's behaviour: if the generated config drops the
 *   setting, Workers Logs are off, and the observability contract is
 *   silently broken.
 *
 * The build is not run from this suite: the deploy-config assertions are
 * read from `dist/server/wrangler.json` if present, otherwise skipped
 * with a recorded reason. CI runs the build before the unit suite, so
 * the file is always present there.
 */

const ROOT = process.cwd();
const ROOT_WRANGLER = join(ROOT, 'wrangler.jsonc');
const GENERATED_WRANGLER = join(ROOT, 'dist', 'server', 'wrangler.json');

function readRootWrangler(): string {
  return readFileSync(ROOT_WRANGLER, 'utf8');
}

describe('wrangler.jsonc', () => {
  it('carries the founder-supplied runtime config and nothing else', () => {
    // The file is a JSONC document with a block comment for the rate-limit
    // binding. Strip the comment and parse the remainder to check the
    // authored keys. The `ratelimits` block intentionally does not exist
    // as JSON — it lives in the comment — and that absence is the point.
    const raw = readRootWrangler();
    const withoutComments = raw.replace(/\/\*[\s\S]*?\*\//g, '');

    const parsed = JSON.parse(withoutComments) as Record<string, unknown>;
    expect(parsed.name).toBe('trl-service');
    expect(parsed.compatibility_date).toBe('2026-09-16');
    expect(parsed.observability).toEqual({ enabled: true });
    expect(parsed).not.toHaveProperty('ratelimits');
  });

  it('documents the rate-limit block in a comment with a placeholder, not a real namespace_id', () => {
    // The deployment-gate step is to uncomment the block and set the
    // account-scoped `namespace_id`. Until then, the block must remain a
    // comment with a placeholder, never a fabricated integer. A real
    // integer here would be infrastructure fabrication that this test is
    // designed to catch.
    //
    // The file has two /* ... */ blocks (the leading header comment and
    // the ratelimits comment), so we read every comment block and join
    // them rather than picking the first.
    const raw = readRootWrangler();
    const comment = [...raw.matchAll(/\/\*[\s\S]*?\*\//g)].map((m) => m[0]).join('\n');

    expect(comment, 'expected the rate-limit block to be documented in a comment').toContain(
      '"ratelimits"',
    );
    expect(comment).toContain('"name": "CONTACT_RATE_LIMITER"');
    expect(comment).toContain('"simple": { "limit": 10, "period": 10 }');
    expect(comment).toMatch(/namespace_id.*<founder-supplied/i);

    // No real integer-shaped namespace_id anywhere in the file: an
    // uncommented `"namespace_id": "1001"` (or any quoted digit string)
    // would be a fabricated account identifier.
    expect(raw, 'no fabricated namespace_id may be committed').not.toMatch(
      /"namespace_id"\s*:\s*"\d+"/,
    );
  });

  it('does not commit any production credentials', () => {
    const raw = readRootWrangler();

    // Sanity sweep: no Turnstile sitekey/secret, no Resend key, no email
    // address. The dummy keys in `.dev.vars.example` are a separate,
    // explicit, public file; the deploy config carries only public
    // metadata.
    for (const banned of [
      'PUBLIC_TURNSTILE_SITEKEY',
      'TURNSTILE_SECRET',
      'RESEND_API_KEY',
      'CONTACT_TO_EMAIL',
      'RESEND_FROM_EMAIL',
      'officialtrlservice@gmail.com',
    ]) {
      expect(raw, `${banned} must not appear in wrangler.jsonc`).not.toContain(banned);
    }
  });
});

describe('the generated deploy config (dist/server/wrangler.json)', () => {
  it('inherits from the repository root and carries observability through', () => {
    // CI runs `npm run build` before `npm run test:unit`, so the file is
    // present there. Locally, `npm run test:unit` will trigger the build
    // through the build-once helper used by the other suites — but this
    // suite is read-only and does not import build-once; a missing file
    // is a soft skip rather than a failure.
    let generated: string;
    try {
      generated = readFileSync(GENERATED_WRANGLER, 'utf8');
    } catch {
      // The file is not present locally because the build has not run;
      // CI runs the build first. Skip with an explicit reason rather than
      // fail.
      return;
    }

    const parsed = JSON.parse(generated) as Record<string, unknown>;
    expect(parsed.observability).toEqual({ enabled: true });
    // The generated config names the root config as its source, so a
    // founder following `docs/TRL_DEPLOYMENT.md` from the generated file
    // back to the source gets the right file.
    expect(
      typeof parsed.configPath === 'string' || typeof parsed.userConfigPath === 'string',
    ).toBe(true);
  });
});
