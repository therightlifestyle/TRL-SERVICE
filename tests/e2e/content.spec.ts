import { expect, test } from '@playwright/test';

const EMAIL = 'officialtrlservice@gmail.com';
const WHATSAPP = '923190091457';

test('the offers page shows the approved staircase in order with real prices', async ({
  page,
}) => {
  await page.goto('/offers/');

  const names = await page.locator('article[id] h3').allTextContents();
  expect(names).toEqual([
    'TRL Micro Audit',
    'TRL Builder Automation Setup',
    'TRL Transformation / Founder OS',
  ]);

  await expect(page.locator('#micro-audit')).toContainText('$35');
  await expect(page.locator('#micro-audit')).toContainText('PKR 9,900');
  await expect(page.locator('#builder-automation-setup')).toContainText('$499');
  await expect(page.locator('#transformation-founder-os')).toContainText('$1,297');

  for (const id of [
    '#micro-audit',
    '#builder-automation-setup',
    '#transformation-founder-os',
  ]) {
    await expect(page.locator(id)).toContainText('Not included');
  }
});

test('approved contact channels are reachable from every page', async ({ page }) => {
  for (const path of ['/', '/services/', '/offers/', '/contact/']) {
    await page.goto(path);
    await expect(page.locator(`a[href^="mailto:${EMAIL}"]`).first()).toBeVisible();
    await expect(page.locator(`a[href*="wa.me/${WHATSAPP}"]`).first()).toBeVisible();
  }
});

test('the contact page shows direct channels before the form', async ({ page }) => {
  await page.goto('/contact/');

  const channelsHeading = page.getByRole('heading', { name: 'Direct channels' });
  const formHeading = page.getByRole('heading', { name: 'Enquiry form' });
  await expect(channelsHeading).toBeVisible();
  await expect(formHeading).toBeVisible();

  const channelsBox = await channelsHeading.boundingBox();
  const formBox = await formHeading.boundingBox();
  expect(channelsBox!.y).toBeLessThan(formBox!.y);
});

test('the not-yet-live enquiry form is disabled and says so', async ({ page }) => {
  await page.goto('/contact/');

  await expect(
    page.getByText('This form is not accepting submissions yet'),
  ).toBeVisible();

  for (const id of ['#name', '#email', '#service', '#message']) {
    await expect(page.locator(id)).toBeDisabled();
  }
});

test('legal pages are drafts and are excluded from indexing', async ({ page }) => {
  for (const path of ['/privacy/', '/terms/']) {
    await page.goto(path);
    await expect(page.getByText('Draft — pending legal review')).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      'noindex, follow',
    );
  }
});

test('organization structured data contains only approved facts', async ({ page }) => {
  await page.goto('/');
  const raw = await page.locator('script[type="application/ld+json"]').innerText();
  const data = JSON.parse(raw);

  expect(data['@type']).toBe('Organization');
  expect(data.name).toBe('The Right Lifestyle');
  expect(data.email).toBe(EMAIL);
  expect(data.founder.name).toBe('Rashid Muhammad Amir');
  expect(data).not.toHaveProperty('aggregateRating');
  expect(data).not.toHaveProperty('review');
  expect(data).not.toHaveProperty('address');
});

test('decorative systems graphics are hidden from assistive technology', async ({
  page,
}) => {
  await page.goto('/');
  const graphics = page.locator('.systems-graphic');
  const count = await graphics.count();
  expect(count).toBeGreaterThan(0);

  for (let i = 0; i < count; i += 1) {
    await expect(graphics.nth(i)).toHaveAttribute('aria-hidden', 'true');
  }
});
