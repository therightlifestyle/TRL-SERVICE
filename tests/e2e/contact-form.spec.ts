import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/*
 * Gate 4: the contact form's real behaviour in a browser. The suite runs
 * against `astro preview` serving the production build with Cloudflare's
 * published dummy Turnstile keys (always-pass) and NO email configuration, so:
 *
 *  - turnstile verification genuinely passes through Cloudflare's siteverify;
 *  - validation errors come from the real server-side pipeline;
 *  - a fully valid submission reaches the delivery boundary and produces the
 *    honest "could not send" state — the e2e environment cannot and must not
 *    deliver real email (delivery with real credentials is verified manually
 *    at the deployment gate; the delivery contract itself is unit-tested).
 *
 * The honeypot path needs no token (it short-circuits before verification),
 * so it doubles as a network-independent success-path test.
 */

const ORIGIN = 'http://127.0.0.1:4321';

const VALID = {
  name: 'E2E Test Person',
  email: 'e2e@example.com',
  service: 'general',
  message:
    'This is a test message written by the automated test suite, comfortably past twenty characters.',
  phone: '+92 300 0000000',
  business: 'Test Business',
};

async function waitForTurnstileToken(page: Page): Promise<void> {
  await page.locator('input[name="cf-turnstile-response"]').waitFor({ timeout: 20_000 });
  await expect
    .poll(
      async () => page.locator('input[name="cf-turnstile-response"]').inputValue(),
      { message: 'Turnstile token was issued', timeout: 20_000 },
    )
    .toBeTruthy();
}

async function submit(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Send enquiry' }).click();
}

async function fillValidFields(page: Page): Promise<void> {
  await page.locator('#name').fill(VALID.name);
  await page.locator('#email').fill(VALID.email);
  await page.locator('#service').selectOption(VALID.service);
  await page.locator('#message').fill(VALID.message);
  await page.locator('#phone').fill(VALID.phone);
  await page.locator('#business').fill(VALID.business);
}

test.describe('form structure (GET)', () => {
  test('renders every field enabled, labelled, with status in words', async ({ page }) => {
    await page.goto('/contact/');

    for (const selector of ['#name', '#email', '#service', '#message', '#phone', '#business']) {
      const control = page.locator(selector);
      await expect(control).toBeEnabled();

      const id = selector.slice(1);
      const label = page.locator(`label[for="${id}"]`);
      await expect(label).toBeVisible();
      const status = await label.locator('.field__status').innerText();
      expect(['Required', 'Optional'], `${id} must state its status in words`).toContain(
        status.trim(),
      );
    }

    await expect(page.getByRole('button', { name: 'Send enquiry' })).toBeEnabled();
  });

  test('hides the honeypot from people and assistive technology, but not from the DOM', async ({
    page,
  }) => {
    await page.goto('/contact/');

    const honeypot = page.locator('#website');
    await expect(honeypot).toBeAttached();
    await expect(honeypot).toHaveAttribute('tabindex', '-1');
    await expect(page.locator('.honeypot')).toHaveAttribute('aria-hidden', 'true');
    await expect(honeypot).not.toBeVisible();
  });

  test('loads only the sanctioned third-party script', async ({ page }) => {
    await page.goto('/contact/');

    const sources = await page.locator('script[src]').evaluateAll((scripts) =>
      scripts.map((script) => new URL(script.getAttribute('src')!, location.href).href),
    );

    expect(sources).toEqual(['https://challenges.cloudflare.com/turnstile/v0/api.js']);
  });

  test('shows email and WhatsApp in the DOM before the form', async ({ page }) => {
    await page.goto('/contact/');

    const emailIndex = await page
      .locator('a[href^="mailto:"]')
      .first()
      .evaluate((node) => {
        let index = 0;
        for (const sibling of node.closest('main')!.querySelectorAll('*')) {
          index += 1;
          if (sibling === node) return index;
        }
        return -1;
      });
    const formIndex = await page
      .locator('form')
      .evaluate((node) => {
        let index = 0;
        for (const sibling of node.closest('main')!.querySelectorAll('*')) {
          index += 1;
          if (sibling === node) return index;
        }
        return -1;
      });

    expect(emailIndex).toBeGreaterThan(0);
    expect(emailIndex).toBeLessThan(formIndex);
  });
});

test.describe('validation failures (POST)', () => {
  test('shows an error summary that takes focus and lists every missing required field', async ({
    page,
  }) => {
    await page.goto('/contact/');
    await waitForTurnstileToken(page);
    await submit(page);

    const summary = page.locator('#error-summary');
    await expect(summary).toBeVisible();
    await expect(summary).toBeFocused();
    await expect(summary.getByRole('heading')).toHaveText('There is a problem');

    const links = summary.getByRole('link');
    await expect(links).toHaveCount(4);
    await expect(links.nth(0)).toHaveAttribute('href', '#name');
    await expect(links.nth(1)).toHaveAttribute('href', '#email');
    await expect(links.nth(2)).toHaveAttribute('href', '#service');
    await expect(links.nth(3)).toHaveAttribute('href', '#message');
  });

  test('marks invalid fields with an associated, worded error', async ({ page }) => {
    await page.goto('/contact/');
    await waitForTurnstileToken(page);
    await submit(page);

    for (const id of ['#name', '#email', '#service', '#message']) {
      const field = page.locator(id);
      await expect(field).toHaveAttribute('aria-invalid', 'true');
      const describedBy = await field.getAttribute('aria-describedby');
      expect(describedBy, `${id} must point at its error message`).toContain(
        `${id.slice(1)}-error`,
      );
    }

    await expect(page.getByText('Enter your name.')).toBeVisible();
    await expect(page.getByText('Enter your email address.').first()).toBeVisible();
    await expect(page.getByText('Choose the service you are interested in.')).toBeVisible();
    await expect(page.getByText('Describe what you would like to change.')).toBeVisible();
  });

  test('an error summary link moves focus to the field to fix', async ({ page }) => {
    await page.goto('/contact/');
    await waitForTurnstileToken(page);
    await submit(page);

    await page.locator('#error-summary a[href="#email"]').click();
    await expect(page.locator('#email')).toBeFocused();
  });

  test('gives specific messages for a malformed email and a too-short message', async ({
    page,
  }) => {
    await page.goto('/contact/');
    await page.locator('#name').fill(VALID.name);
    await page.locator('#email').fill('not-an-email');
    await page.locator('#message').fill('too short');
    await waitForTurnstileToken(page);
    await submit(page);

    await expect(
      page.getByText('Enter an email address in the correct format, like name@example.com.'),
    ).toBeVisible();
    await expect(
      page.getByText('Your description should be at least 20 characters so we can answer usefully.'),
    ).toBeVisible();
    await expect(page.locator('#name')).not.toHaveAttribute('aria-invalid', 'true');
  });

  test('preserves everything the visitor typed across the failure', async ({ page }) => {
    await page.goto('/contact/');
    await page.locator('#name').fill(VALID.name);
    await page.locator('#email').fill(VALID.email);
    await page.locator('#service').selectOption('micro-audit');
    await page.locator('#phone').fill(VALID.phone);
    await page.locator('#business').fill(VALID.business);
    await waitForTurnstileToken(page);
    await submit(page); // message left empty → 422

    await expect(page.locator('#name')).toHaveValue(VALID.name);
    await expect(page.locator('#email')).toHaveValue(VALID.email);
    await expect(page.locator('#service')).toHaveValue('micro-audit');
    await expect(page.locator('#phone')).toHaveValue(VALID.phone);
    await expect(page.locator('#business')).toHaveValue(VALID.business);
  });

  test('the error state passes axe checks', async ({ page }) => {
    await page.goto('/contact/');
    await waitForTurnstileToken(page);
    await submit(page);
    await page.locator('#error-summary').waitFor();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
});

test.describe('submission outcomes (POST)', () => {
  test('a valid submission reaches the delivery boundary and reports the honest failure state', async ({
    page,
  }) => {
    await page.goto('/contact/');
    await fillValidFields(page);
    await waitForTurnstileToken(page);
    await submit(page);

    await expect(
      page.getByRole('heading', { name: 'Your message was not sent' }),
    ).toBeVisible();

    // Input survives the failure so nothing has to be retyped.
    await expect(page.locator('#message')).toHaveValue(VALID.message);

    // The failure is explained without leaking internals.
    const body = await page.locator('main').innerText();
    for (const banned of ['Resend', 'RESEND', 'api key', 'API key', 'secret', 'stack', 'turnstile-secret']) {
      expect(body, `the error state must not mention "${banned}"`).not.toContain(banned);
    }
  });

  test('a submission that fills the honeypot is silently accepted', async ({ page }) => {
    await page.goto('/contact/');
    await fillValidFields(page);
    await page.locator('#website').fill('http://i-am-a-bot.example');
    await submit(page); // no token wait needed: the honeypot short-circuits

    await expect(page).toHaveURL(/\/contact\/sent\/$/);
    await expect(page.getByRole('heading', { name: 'Your enquiry was sent' })).toBeVisible();
  });

  test('the confirmation page states what happens next and stays out of the index', async ({
    page,
  }) => {
    await page.goto('/contact/sent/');

    await expect(page.getByRole('heading', { name: 'Your enquiry was sent' })).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      'noindex, follow',
    );

    // No invented response-time promise (journey J2).
    const body = await page.locator('main').innerText();
    expect(body).not.toMatch(/(within|under) \d+ (hours?|days?|minutes?)/i);
  });
});

test.describe('endpoint hardening', () => {
  test('rejects a foreign-origin form POST', async ({ request }) => {
    const response = await request.post('/contact/', {
      headers: { origin: 'https://evil.example' },
      form: { name: 'x' },
    });
    expect(response.status()).toBe(403);
  });

  test('rejects an origin-less form POST', async ({ request }) => {
    const response = await request.post('/contact/', { form: { name: 'x' } });
    expect(response.status()).toBe(403);
  });

  test('rejects a non-form body', async ({ request }) => {
    const response = await request.post('/contact/', {
      headers: { origin: ORIGIN },
      data: { name: 'x' },
    });
    expect(response.status()).toBe(415);
  });

  test('rejects methods the endpoint does not speak', async ({ request }) => {
    for (const method of ['PUT', 'DELETE', 'PATCH'] as const) {
      const response = await request.fetch('/contact/', {
        method,
        headers: { origin: ORIGIN },
      });
      expect(response.status(), method).toBe(405);
    }
  });
});
