import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

/*
 * Builds the site exactly once for the unit suites that read `dist/client`
 * (rendered-pages and security-headers tests), even though Vitest runs test
 * files in parallel workers. On CI the `verify` job runs `astro build` before
 * `test:unit`, so this is a no-op there; locally it makes `npm run test:unit`
 * work on a clean checkout without two concurrent `astro build` processes
 * corrupting each other.
 *
 * The lock is an advisory directory under node_modules/.cache (gitignored and
 * not touched by `astro build`). Acquiring uses a plain non-recursive
 * `mkdirSync`, which is atomic and throws EEXIST when another worker already
 * holds it — `mkdirSync(dir, { recursive: true })` would NOT throw on an
 * existing directory, which is why it is not used here.
 */

const DIST_INDEX = join(process.cwd(), 'dist', 'client', 'index.html');
const LOCK_DIR = join(process.cwd(), 'node_modules', '.cache', 'trl-unit-build-lock');

function sleep(ms: number): void {
  const signal = new Int32Array(new SharedArrayBuffer(4));
  Atomics.wait(signal, 0, 0, ms);
}

export function buildOnce(timeoutMs = 180_000): void {
  if (existsSync(DIST_INDEX)) return;

  // Ensure the parent exists so the non-recursive mkdir below can't fail on a
  // missing ancestor (recursive parent creation is safe: no lock lives there).
  mkdirSync(join(LOCK_DIR, '..'), { recursive: true });

  let acquired = false;
  try {
    mkdirSync(LOCK_DIR);
    acquired = true;
  } catch {
    // EEXIST: another worker is already building; wait for its output below.
  }

  if (acquired) {
    try {
      if (!existsSync(DIST_INDEX)) {
        execFileSync('npx', ['astro', 'build'], { stdio: 'inherit' });
      }
    } finally {
      rmSync(LOCK_DIR, { recursive: true, force: true });
    }
    return;
  }

  const deadline = Date.now() + timeoutMs;
  while (!existsSync(DIST_INDEX)) {
    if (Date.now() > deadline) {
      throw new Error(
        'Timed out waiting for another test worker to finish the build. ' +
          'Run `npm run build` once and retry `npm run test:unit`.',
      );
    }
    sleep(200);
  }
}
