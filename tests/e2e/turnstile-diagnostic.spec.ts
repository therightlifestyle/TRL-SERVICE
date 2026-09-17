import { expect, test } from '@playwright/test';

/*
 * TEMPORARY DIAGNOSTIC — delete once the Turnstile rendering cause is known.
 *
 * The contact-form suite fails on CI because `input[name="cf-turnstile-response"]`
 * never attaches, i.e. the Turnstile widget never renders on the runner. The
 * page HTML is correct (verified locally: widget div with the dummy sitekey and
 * the api.js script tag, no CSP), so the cause is runner-side.
 *
 * This sandbox cannot read CI logs or artifacts (both are served from a blocked
 * host), only check-run annotations. So this test deliberately FAILS with every
 * diagnostic in the assertion message, which Playwright's `github` reporter
 * surfaces as an annotation.
 *
 * It answers two independent questions:
 *   1. Browser side — can the runner load api.js and render the widget?
 *   2. Server side — can the workerd preview reach challenges.cloudflare.com
 *      for siteverify? (A POST with a token returns 422 if it can, 403 if not.)
 */

test.setTimeout(90_000);

test('DIAGNOSTIC: why does the Turnstile widget not render on this runner?', async ({ page }) => {
  const cloudflareRequests: string[] = [];
  const cloudflareResponses: string[] = [];
  const problems: string[] = [];

  page.on('request', (request) => {
    if (request.url().includes('cloudflare')) cloudflareRequests.push(request.url());
  });
  page.on('response', (response) => {
    if (response.url().includes('cloudflare')) {
      cloudflareResponses.push(`${response.status()} ${response.url()}`);
    }
  });
  page.on('requestfailed', (request) => {
    problems.push(`requestfailed ${request.url()} :: ${request.failure()?.errorText ?? '?'}`);
  });
  page.on('console', (message) => {
    if (message.type() === 'error') problems.push(`console.error :: ${message.text()}`);
  });
  page.on('pageerror', (error) => problems.push(`pageerror :: ${error.message}`));

  await page.goto('/contact/');
  await page.waitForTimeout(20_000);

  const browserState = await page.evaluate(() => {
    const widget = document.querySelector('.cf-turnstile');
    const anyWindow = window as unknown as Record<string, unknown>;
    return {
      widgetDivPresent: widget !== null,
      widgetOuterHtml: (widget?.outerHTML ?? 'ABSENT').slice(0, 400),
      widgetChildCount: widget?.childElementCount ?? -1,
      widgetIframes: document.querySelectorAll('.cf-turnstile iframe').length,
      tokenInputCount: document.querySelectorAll('input[name="cf-turnstile-response"]').length,
      turnstileGlobalType: typeof anyWindow.turnstile,
      scriptTagCount: document.querySelectorAll(
        'script[src*="challenges.cloudflare.com"]',
      ).length,
    };
  });

  // Server-side probe: POST a valid form carrying a token. The dummy secret
  // always returns success, so a 422 (validation) proves the workerd preview
  // reached siteverify, while a 403 proves it could not.
  await page.locator('#name').fill('Diagnostic Person');
  await page.locator('#email').fill('diag@example.com');
  await page.locator('#message').fill('left blank on purpose to force a validation error');
  await page.evaluate(() => {
    const form = document.querySelector('form');
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'cf-turnstile-response';
    input.value = 'diagnostic-token';
    form?.appendChild(input);
  });
  await page.getByRole('button', { name: 'Send enquiry' }).click();
  await page.waitForLoadState('domcontentloaded');

  const serverProbe = {
    urlAfterPost: page.url(),
    bodyExcerpt: (await page.locator('main').innerText()).replace(/\s+/g, ' ').slice(0, 400),
    errorSummaryPresent: await page.locator('#error-summary').count(),
  };

  const report = JSON.stringify(
    { browserState, cloudflareRequests, cloudflareResponses, problems, serverProbe },
    null,
    1,
  );

  // Deliberate failure so the report is emitted as a CI annotation.
  expect(report, `DIAGNOSTIC REPORT: ${report}`).toBe('');
});
