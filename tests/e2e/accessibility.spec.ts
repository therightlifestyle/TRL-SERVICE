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

  /*
   * WCAG 2.2 AA (2.5.8 Target Size, Minimum) requires 24x24 CSS pixels, and the
   * design system sets a stricter internal floor of 44px for standalone controls.
   * The success criterion exempts targets that sit inline within a sentence of
   * text, because enlarging them would break the line box. This check enforces
   * the rule on standalone controls and verifies the exemption genuinely applies
   * to the rest, rather than skipping anything that happens to be small.
   */
  const undersized = await page.evaluate(() => {
    const failures: string[] = [];

    for (const element of document.querySelectorAll('a, button')) {
      const rect = element.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) continue; // visually hidden

      if (rect.height >= 24 && rect.width >= 24) continue;

      // The inline exception: the link sits inside a block of sentence text
      // alongside other text nodes, so it is part of a line rather than a
      // standalone control.
      const parent = element.parentElement;
      const parentText = parent?.textContent?.trim() ?? '';
      const ownText = element.textContent?.trim() ?? '';
      const isInlineInSentence =
        parent !== null &&
        ['P', 'LI', 'SPAN', 'DD', 'TD'].includes(parent.tagName) &&
        parentText.length > ownText.length;

      if (isInlineInSentence) continue;

      const label = `${element.tagName}: ${ownText.slice(0, 40)}`;
      failures.push(`${label} (${Math.round(rect.width)}x${Math.round(rect.height)})`);
    }

    return failures;
  });

  expect(undersized).toEqual([]);
});

test('standalone navigation and action controls meet the 44px design floor', async ({
  page,
}) => {
  const selectors = [
    'header nav a',
    'footer a',
    '.button',
    '.wa',
    '.section__footnote a',
  ];

  for (const path of ['/', '/offers/', '/contact/']) {
    await page.goto(path);

    const tooSmall = await page.evaluate((list) => {
      const failures: string[] = [];
      for (const selector of list) {
        for (const element of document.querySelectorAll(selector)) {
          const rect = element.getBoundingClientRect();
          if (rect.width === 0 && rect.height === 0) continue;
          if (rect.height < 44) {
            failures.push(
              `${selector} -> ${element.textContent?.trim().slice(0, 30)} (${Math.round(
                rect.height,
              )}px tall)`,
            );
          }
        }
      }
      return failures;
    }, selectors);

    expect(tooSmall, `undersized controls on ${path}`).toEqual([]);
  }
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
