import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { buildOnce } from './helpers/build-once';

/*
 * Gate 6: the deployable artifact and the configuration that produces it.
 *
 * Everything here is a property the deployment depends on and that must fail in
 * CI rather than at deploy time or, worse, in production. The generated deploy
 * config is read from the build output instead of the source, so this asserts
 * what would actually be uploaded.
 */

const ROOT_CONFIG = 'wrangler.jsonc';
const GENERATED_CONFIG = join(process.cwd(), 'dist', 'server', 'wrangler.json');

beforeAll(() => {
  buildOnce();
}, 180_000);

describe('the generated deploy config', () => {
  it('is emitted where the deploy expects it', () => {
    // `wrangler deploy` from the repository root redirects to this file
    // (verified with `wrangler deploy --dry-run`); the adapter rewrites
    // `assets.directory` relative to dist/server at build time.
    expect(existsSync(GENERATED_CONFIG), 'dist/server/wrangler.json missing').toBe(true);
  });

  it('names the Worker, carries observability, and points at the built assets', () => {
    const config = JSON.parse(readFileSync(GENERATED_CONFIG, 'utf8'));

    expect(config.name).toBe('trl-service');
    expect(config.observability).toEqual({ enabled: true });
    expect(config.main).toBe('entry.mjs');
    expect(config.assets.binding).toBe('ASSETS');
    expect(config.assets.directory).toBe('../client');
  });

  it('carries no invented account, bindings, or rate-limit namespace', () => {
    // account_id is deliberately absent: Workers Builds supplies the account
    // context, and an invented integer would deploy against whatever namespace
    // that integer happened to collide with (D-023).
    const config = JSON.parse(readFileSync(GENERATED_CONFIG, 'utf8'));
    expect(config).not.toHaveProperty('account_id');

    // The rate limiter stays unprovisioned until the founder's namespace exists.
    expect(config.ratelimits).toEqual([]);
  });

  it('keeps the deploy config and dev variables out of the served assets', () => {
    // A served wrangler.json or .dev.vars would expose configuration; the
    // adapter writes .assetsignore for exactly this.
    const ignore = readFileSync(join(process.cwd(), 'dist', 'client', '.assetsignore'), 'utf8');
    expect(ignore).toContain('wrangler.json');
    expect(ignore).toContain('.dev.vars');
    expect(existsSync(join(process.cwd(), 'dist', 'client', 'wrangler.json'))).toBe(false);
  });
});

describe('the source configuration', () => {
  it('does not commit an account_id or an invented rate-limit namespace', () => {
    const source = readFileSync(join(process.cwd(), ROOT_CONFIG), 'utf8');

    // Uncommented only: the commented block is the documented template.
    expect(source).not.toMatch(/^\s*"account_id"/m);
    expect(source).toMatch(/compatibility_date/);
    expect(source).toMatch(/"name":\s*"trl-service"/);
  });

  it('documents where the generated config lands', () => {
    // Gate 5's own changelog corrected this from dist/client to dist/server;
    // the file comment in wrangler.jsonc had drifted back to the wrong path.
    const source = readFileSync(join(process.cwd(), ROOT_CONFIG), 'utf8');
    expect(source).toContain('dist/server/wrangler.json');
    expect(source).not.toContain('dist/client/wrangler.json');
  });
});

describe('artifacts that must not ship', () => {
  it('ships no environment file or credential in the client output', () => {
    for (const file of ['.dev.vars', '.env', '.env.local', 'wrangler.jsonc']) {
      expect(existsSync(join(process.cwd(), 'dist', 'client', file)), file).toBe(false);
    }
  });

  it('ships no client JavaScript, so the static CSP can stay script-src none', () => {
    // D-010/D-018: this is the property that makes `script-src 'none'` true
    // rather than aspirational. build-budget.test.ts checks it more thoroughly;
    // here it guards the deploy artifact itself.
    const astroDir = join(process.cwd(), 'dist', 'client', '_astro');
    if (!existsSync(astroDir)) return;
    const files = readFileSync(join(process.cwd(), 'dist', 'client', 'index.html'), 'utf8');
    expect(files).not.toMatch(/<script(?![^>]*application\/ld\+json)/);
  });
});
