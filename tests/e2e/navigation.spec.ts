import { expect, test } from '@playwright/test';

const routes = [
  { path: '/', heading: /business systems that give owners their time back/i },
  { path: '/services/', heading: /four areas of work/i },
  { path: '/ai-solutions/', heading: /specific jobs/i },
  { path: '/offers/', heading: /published prices/i },
  { path: '/about/', heading: /a new firm/i },
  { path: '/contact/', heading: /describe the workflow/i },
  { path: '/privacy/', heading: /^privacy$/i },
  { path: '/terms/', heading: /^terms$/i },
];

for (const route of routes) {
  test(`${route.path} renders one h1, a title, and a canonical URL`, async ({ page }) => {
    await page.goto(route.path);

    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);
    await expect(h1).toHaveText(route.heading);

    await expect(page).toHaveTitle(/TRL · The Right Lifestyle$/);

    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveAttribute('href', new RegExp(`${route.path}$`));

    await expect(page.getByRole('banner')).toBeVisible();
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.getByRole('contentinfo')).toBeVisible();
  });
}

test('primary navigation reaches every core route', async ({ page }) => {
  await page.goto('/');
  const nav = page.getByRole('navigation', { name: 'Primary' });

  for (const label of ['Services', 'AI solutions', 'Offers', 'About', 'Contact']) {
    await nav.getByRole('link', { name: label, exact: true }).click();
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.locator('h1')).toHaveCount(1);
    await page.goto('/');
  }
});

test('the current page is marked with aria-current', async ({ page }) => {
  await page.goto('/offers/');
  const nav = page.getByRole('navigation', { name: 'Primary' });
  await expect(nav.getByRole('link', { name: 'Offers', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  );
});

test('the skip link is the first focusable element and moves focus to main', async ({
  page,
}) => {
  await page.goto('/');
  await page.keyboard.press('Tab');

  const skipLink = page.getByRole('link', { name: 'Skip to main content' });
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toBeVisible();

  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#main$/);
});

test('an unknown route returns the 404 page', async ({ page }) => {
  const response = await page.goto('/this-route-does-not-exist/');
  expect(response?.status()).toBe(404);
  await expect(page.locator('h1')).toHaveText(/that page does not exist/i);
});

test('robots.txt and the sitemap are served', async ({ page, request }) => {
  // Gate 6 (D-022): robots.txt is generated from the deployment's origin and its
  // indexing flag, so this asserts the policy rather than a fixed string.
  const robots = await request.get('/robots.txt');
  expect(robots.status()).toBe(200);
  expect(robots.headers()['content-type']).toContain('text/plain');

  const body = await robots.text();

  // Crawling is always allowed, including while indexing is off: a `Disallow: /`
  // would stop crawlers from reading the page-level noindex directive that keeps
  // an unindexed deployment out of search results.
  expect(body).toContain('Allow: /');
  expect(body).not.toContain('Disallow');

  // The sitemap is advertised only when pages are indexable. Read the state from
  // a page and require robots.txt to agree with it.
  await page.goto('/');
  const indexingOn = (await page.locator('meta[name="robots"]').count()) === 0;
  expect(body.includes('Sitemap:')).toBe(indexingOn);

  const sitemap = await request.get('/sitemap-index.xml');
  expect(sitemap.status()).toBe(200);
});
