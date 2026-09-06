import { chromium, expect, test } from '@playwright/test';

const brisbaneIpResponse = {
  lat: -27.4698,
  lng: 153.0251,
  city: 'Brisbane',
  country: 'Australia',
};

test.describe('AdSense home experience improvements', () => {
  test('the server response and JavaScript-disabled page contain a usable Taipei example', async ({
    browser,
    baseURL,
    request,
  }) => {
    const response = await request.get('/');
    expect(response.ok()).toBe(true);
    const html = await response.text();
    expect(html).toContain('Example location · Taipei');
    expect(html).toContain('Taipei, Taiwan');
    expect(html).toContain('Asia/Taipei');
    expect(html).toContain('View full results');
    expect(html).toContain('Primary navigation without JavaScript');

    const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
    const page = await context.newPage();
    await page.goto('/');

    await expect(page.getByTestId('location-source')).toContainText(
      'Example location · Taipei'
    );
    await expect(page.getByTestId('location-display')).toContainText('Taipei, Taiwan');
    const summary = page.getByTestId('initial-solar-summary');
    await expect(summary.getByText('Sunrise', { exact: true })).toBeVisible();
    await expect(summary.getByText('Sunset', { exact: true })).toBeVisible();
    await expect(summary.getByText('Daylight', { exact: true })).toBeVisible();
    const fallbackNavigation = page.getByRole('navigation', {
      name: 'Primary navigation without JavaScript',
    });
    await expect(fallbackNavigation.getByRole('link', { name: 'Golden Hour', exact: true })).toHaveAttribute(
      'href',
      '/golden-hour-calculator'
    );
    await expect(fallbackNavigation.getByRole('link', { name: 'Guides', exact: true })).toHaveAttribute(
      'href',
      '/guides'
    );

    await context.close();
  });

  test('a successful background lookup applies an approximate location label', async ({ page }) => {
    await page.route('**/api/ip-geo', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(brisbaneIpResponse) })
    );

    await page.goto('/');

    await expect(page.getByTestId('location-source')).toContainText('Approximate location');
    await expect(page.getByTestId('location-display')).toContainText('Brisbane, Australia');
    await expect(page.getByTestId('location-timezone')).toContainText('Australia/Brisbane');
  });

  test('a failed lookup keeps the example and explains how to choose a location', async ({ page }) => {
    await page.route('**/api/ip-geo', (route) =>
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'IP location unavailable' }),
      })
    );

    await page.goto('/');

    await expect(page.getByTestId('location-source')).toContainText(
      'Example location · Taipei'
    );
    await expect(
      page.getByText(
        'Showing the Taipei example. Search or enter coordinates to choose another place.'
      )
    ).toBeVisible();
  });

  test('a late IP response cannot overwrite a date interaction or the Taipei example', async ({
    page,
  }) => {
    let releaseLookup: (() => void) | undefined;
    let markLookupStarted: (() => void) | undefined;
    let markLookupFulfilled: (() => void) | undefined;
    const lookupStarted = new Promise<void>((resolve) => {
      markLookupStarted = resolve;
    });
    const lookupGate = new Promise<void>((resolve) => {
      releaseLookup = resolve;
    });
    const lookupFulfilled = new Promise<void>((resolve) => {
      markLookupFulfilled = resolve;
    });

    await page.route('**/api/ip-geo', async (route) => {
      markLookupStarted?.();
      await lookupGate;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          lat: -33.8688,
          lng: 151.2093,
          city: 'Sydney',
          country: 'Australia',
        }),
      });
      markLookupFulfilled?.();
    });

    await page.goto('/');
    await lookupStarted;
    const dateInput = page.locator('input[type="date"]').first();
    await dateInput.fill('2026-12-21');
    releaseLookup?.();
    await lookupFulfilled;
    await page.waitForTimeout(200);

    await expect(dateInput).toHaveValue('2026-12-21');
    await expect(page.getByTestId('location-source')).toContainText(
      'Example location · Taipei'
    );
    await expect(page.getByTestId('location-display')).toContainText('Taipei, Taiwan');
    await expect(page.getByTestId('location-display')).not.toContainText('Sydney');
  });

  test('a browser without WebGL keeps results available and offers a map retry', async ({
    baseURL,
    browserName,
  }) => {
    test.skip(browserName !== 'chromium', 'This check uses Chromium WebGL launch flags.');
    test.setTimeout(45_000);

    const browser = await chromium.launch({ args: ['--disable-gpu', '--disable-webgl'] });
    const context = await browser.newContext({ baseURL });
    const page = await context.newPage();
    await page.route('**/api/ip-geo', (route) =>
      route.fulfill({ status: 503, contentType: 'application/json', body: '{}' })
    );

    try {
      await page.goto('/');
      await expect(page.getByTestId('initial-solar-summary')).toBeVisible();
      await expect(page.getByTestId('csv-download')).toHaveCount(1);
      await expect(
        page.getByText('The map is unavailable or taking too long to load')
      ).toBeVisible({ timeout: 15_000 });
      await expect(page.getByRole('link', { name: 'View data' })).toHaveAttribute(
        'href',
        '#solar-data'
      );

      await page.getByRole('button', { name: 'Retry map' }).click();
      await expect(page.getByText('Loading map...')).toBeVisible();
      await expect(page.getByTestId('initial-solar-summary')).toBeVisible();
    } finally {
      await context.close();
      await browser.close();
    }
  });

  test('the 320px menu stays within the viewport and supports Escape', async ({ page }) => {
    await page.route('**/api/ip-geo', (route) =>
      route.fulfill({ status: 503, contentType: 'application/json', body: '{}' })
    );
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto('/');

    const menuButton = page.getByRole('button', { name: 'Menu' });
    await menuButton.click();
    const navigation = page.getByRole('navigation', { name: 'Mobile primary navigation' });
    await expect(navigation).toBeVisible();
    await expect(navigation.getByRole('link', { name: 'Azimuth & Altitude' })).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
    ).toBe(true);
    const clippedHeroElements = await page.getByTestId('home-hero').evaluate((hero) =>
      [hero, ...hero.querySelectorAll<HTMLElement>('*')]
        .filter((element) => element.scrollWidth > element.clientWidth + 1)
        .map((element) => ({
          tag: element.tagName,
          className: element.className,
          clientWidth: element.clientWidth,
          scrollWidth: element.scrollWidth,
          text: element.textContent?.trim().slice(0, 80),
        }))
    );
    expect(clippedHeroElements).toEqual([]);

    await page.keyboard.press('Escape');
    await expect(navigation).toBeHidden();
    await expect(menuButton).toBeFocused();
  });
});
