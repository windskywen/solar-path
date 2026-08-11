import { expect, test } from '@playwright/test';

const enabledMode = process.env.PLAYWRIGHT_ADSENSE_ENABLED === 'true';

test.describe('AdSense enabled-mode route isolation', () => {
  test.skip(!enabledMode, 'Run with PLAYWRIGHT_ADSENSE_ENABLED=true after changing ad integration code.');

  test.beforeEach(async ({ page }) => {
    await page.route('https://pagead2.googlesyndication.com/**', (route) => route.abort());
  });

  test('publisher pages load one script and their single responsive unit', async ({ page }) => {
    const publisherPages = [
      { path: '/', testId: 'sidebar-ad-slot', slotId: '1111111111' },
      { path: '/sunrise-sunset-calculator', testId: 'tool-ad-slot', slotId: '2222222222' },
      { path: '/golden-hour-calculator', testId: 'tool-ad-slot', slotId: '2222222222' },
      { path: '/solar-azimuth-altitude', testId: 'tool-ad-slot', slotId: '2222222222' },
      {
        path: '/guides/how-to-read-a-sun-path-diagram',
        testId: 'article-ad-slot',
        slotId: '3333333333',
      },
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

  test('trust and legal pages never load the script or an ad unit', async ({ page }) => {
    for (const path of ['/about', '/methodology', '/contact', '/privacy', '/terms']) {
      await page.goto(path);

      await expect(
        page.locator('script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]')
      ).toHaveCount(0);
      await expect(page.locator('ins.adsbygoogle')).toHaveCount(0);
      await expect(page.getByText('Advertisement', { exact: true })).toHaveCount(0);
    }
  });
});
