import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const routes = [
  '/',
  '/services/',
  '/ai-solutions/',
  '/offers/',
  '/about/',
  '/contact/',
  '/privacy/',
  '/terms/',
];

for (const path of routes) {
  test(`${path} has no detectable WCAG 2.2 A/AA violations`, async ({ page }) => {
    await page.goto(path);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });
}

test('the page reflows at 320px without horizontal scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });

  for (const path of routes) {
    await page.goto(path);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, `${path} overflows horizontally at 320px`).toBeLessThanOrEqual(1);
  }
});

test('interactive elements meet the minimum target size', async ({ page }) => {
  await page.goto('/');

  const undersized = await page.evaluate(() => {
    const failures: string[] = [];
    const elements = document.querySelectorAll('a, button');
    for (const element of elements) {
      const rect = element.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) continue; // visually hidden
      if (rect.height < 24 || rect.width < 24) {
        failures.push(`${element.tagName}: ${element.textContent?.trim().slice(0, 40)}`);
      }
    }
    return failures;
  });

  expect(undersized).toEqual([]);
});

test('reduced motion removes smooth scrolling', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');

  const behavior = await page.evaluate(
    () => getComputedStyle(document.documentElement).scrollBehavior,
  );
  expect(behavior).toBe('auto');
});

test('the site remains readable and navigable without CSS', async ({ page }) => {
  await page.route('**/*.css', (route) => route.abort());
  await page.goto('/');

  await expect(page.locator('h1')).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible();
  await expect(page.getByRole('contentinfo')).toBeVisible();
});
