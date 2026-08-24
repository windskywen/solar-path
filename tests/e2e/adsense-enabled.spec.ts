import { expect, test } from '@playwright/test';

const enabledMode = process.env.PLAYWRIGHT_ADSENSE_ENABLED === 'true';
const guideSlugs = [
  'how-to-read-a-sun-path-diagram',
  'brisbane-winter-vs-summer-sun-path',
  'east-vs-west-facing-homes-australia',
  'golden-hour-direction-brisbane',
  'solar-azimuth-altitude-worked-example',
  'estimating-shadow-direction-from-solar-angles',
] as const;

test.describe('AdSense enabled-mode route isolation', () => {
  test.skip(!enabledMode, 'Run with PLAYWRIGHT_ADSENSE_ENABLED=true after changing ad integration code.');

  test.beforeEach(async ({ page }) => {
    await page.route('https://pagead2.googlesyndication.com/**', (route) => route.abort());
    await page.route('**/api/ip-geo', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          lat: -27.4698,
          lng: 153.0251,
          city: 'Brisbane',
          country: 'Australia',
          timezone: 'Australia/Brisbane',
        }),
      })
    );
  });

  test('publisher pages load one script and their single responsive unit', async ({ page }) => {
    const publisherPages = [
      { path: '/', testId: 'sidebar-ad-slot', slotId: '1111111111' },
      { path: '/sunrise-sunset-calculator', testId: 'tool-ad-slot', slotId: '2222222222' },
      { path: '/golden-hour-calculator', testId: 'tool-ad-slot', slotId: '2222222222' },
      { path: '/solar-azimuth-altitude', testId: 'tool-ad-slot', slotId: '2222222222' },
      ...guideSlugs.map((slug) => ({
        path: `/guides/${slug}`,
        testId: 'article-ad-slot',
        slotId: '3333333333',
      })),
    ] as const;

    for (const entry of publisherPages) {
      await page.goto(entry.path);

      await expect(
        page.locator('script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]')
      ).toHaveCount(1);
      await expect(page.locator('ins.adsbygoogle')).toHaveCount(1);
      await expect(page.getByTestId(entry.testId)).toHaveCount(1);
      await expect(page.getByTestId(entry.testId).locator('ins.adsbygoogle')).toHaveAttribute(
        'data-ad-slot',
        entry.slotId
      );
      await expect(page.getByText('Advertisement', { exact: true })).toHaveCount(1);
    }
  });

  test('the empty server-rendered home state contains no script or ad container', async ({ request }) => {
    const response = await request.get('/');
    expect(response.ok()).toBe(true);
    const html = await response.text();
    expect(html).not.toContain('pagead2.googlesyndication.com/pagead/js/adsbygoogle.js');
    expect(html).not.toContain('class="adsbygoogle');
    expect(html).not.toContain('Advertisement');
  });

  test('guides index, trust, legal, and not-found pages never load the script or an ad unit', async ({ page }) => {
    for (const path of ['/guides', '/about', '/methodology', '/contact', '/privacy', '/terms', '/not-a-real-route']) {
      await page.goto(path);

      await expect(
        page.locator('script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]')
      ).toHaveCount(0);
      await expect(page.locator('ins.adsbygoogle')).toHaveCount(0);
      await expect(page.getByText('Advertisement', { exact: true })).toHaveCount(0);
    }
  });
});
