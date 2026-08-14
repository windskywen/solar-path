import { expect, test, type Page, type Route } from '@playwright/test';

const guideSlugs = [
  'how-to-read-a-sun-path-diagram',
  'brisbane-winter-vs-summer-sun-path',
  'east-vs-west-facing-homes-australia',
  'golden-hour-direction-brisbane',
  'solar-azimuth-altitude-worked-example',
  'estimating-shadow-direction-from-solar-angles',
] as const;

const calculatorRoutes = [
  '/sunrise-sunset-calculator',
  '/golden-hour-calculator',
  '/solar-azimuth-altitude',
] as const;

async function setManualCoordinates(page: Page, coordinates: string) {
  const input = page.locator('#coords-input');
  await input.click();
  await input.press('ControlOrMeta+A');
  await input.pressSequentially(coordinates);
  await expect(input).toHaveValue(coordinates);
  await input.locator('xpath=..').getByRole('button', { name: 'Set' }).click();
}

test.describe('Hydration-safe home state', () => {
  test('raw HTML date equals the first client date and React reports no hydration error', async ({
    page,
    request,
  }) => {
    const response = await request.get('/');
    expect(response.ok()).toBe(true);
    const html = await response.text();
    const rawDate = html.match(/<input[^>]+type="date"[^>]+value="(\d{4}-\d{2}-\d{2})"/)?.[1];
    expect(rawDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    const hydrationMessages: string[] = [];
    page.on('console', (message) => {
      const text = message.text();
      if (/hydration|react error #418|Minified React error #418/i.test(text)) {
        hydrationMessages.push(text);
      }
    });
    page.on('pageerror', (error) => {
      if (/hydration|react error #418|Minified React error #418/i.test(error.message)) {
        hydrationMessages.push(error.message);
      }
    });

    await page.goto('/');
    const dateInput = page.locator('input[type="date"]').first();
    await expect(dateInput).toHaveValue(rawDate!);
    await page.waitForTimeout(500);

    expect(hydrationMessages).toEqual([]);
  });
});

test.describe('Independent calculators', () => {
  for (const route of calculatorRoutes) {
    test(`${route} renders Brisbane results without core-map controls`, async ({ page }) => {
      await page.goto(route);

      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
      await expect(page.getByText('Brisbane, Queensland, Australia').first()).toBeVisible();
      await expect(page.locator('input[type="date"]')).toHaveValue(/^\d{4}-\d{2}-\d{2}$/);
      await expect(page.getByLabel(/Solar path map/i)).toHaveCount(0);
      await expect(page.getByRole('button', { name: /GPS|current location/i })).toHaveCount(0);
      await expect(page.getByRole('button', { name: /3D/i })).toHaveCount(0);
      await expect(page.locator('ins.adsbygoogle')).toHaveCount(0);
    });
  }

  test('sunrise calculator handles manual coordinates, dates, polar day, and stable example', async ({
    page,
  }) => {
    await page.goto('/sunrise-sunset-calculator');
    await expect(page.getByRole('heading', { name: 'Brisbane · 21 June 2026' })).toBeVisible();
    await expect(page.getByText(/This fixed reference is independent/i)).toBeVisible();
    await expect(page.getByText('Solar noon', { exact: true })).toBeVisible();
    await expect(page.getByText(/Altitude [+-]?\d+\.\d°/).first()).toBeVisible();
    await expect(page.getByText('Curve deck')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Altitude' })).toBeVisible();

    await setManualCoordinates(page, '78.22, 15.63');
    await page.locator('input[type="date"]').fill('2026-06-21');

    await expect(page.getByText(/Midnight sun - sun does not set/i).first()).toBeVisible();
    await expect(page.getByText('Unavailable', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Solar noon', { exact: true })).toBeVisible();

    await page.locator('input[type="date"]').fill('2026-12-21');
    await expect(page.getByText(/Polar night - sun does not rise/i).first()).toBeVisible();
  });

  test('golden-hour calculator reports exact window bearings, altitude, and polar unavailable states', async ({
    page,
  }) => {
    await page.goto('/golden-hour-calculator');
    await expect(page.getByText('Morning golden hour')).toBeVisible();
    await expect(page.getByText('Evening golden hour')).toBeVisible();
    await expect(page.getByText(/Start direction/i).first()).toBeVisible();
    await expect(page.getByText(/Altitude/i).first()).toBeVisible();

    await setManualCoordinates(page, '78.22, 15.63');
    await page.locator('input[type="date"]').fill('2026-06-21');
    await expect(page.getByText('Unavailable', { exact: true })).toHaveCount(2);
    await expect(page.getByText(/does not set/i).first()).toBeVisible();
  });

  test('azimuth calculator updates location, date, and local time and keeps a 24-hour chart', async ({
    page,
  }) => {
    await page.goto('/solar-azimuth-altitude');
    await setManualCoordinates(page, '-33.8688, 151.2093');
    await page.locator('input[type="date"]').fill('2026-12-21');
    await page.locator('input[type="time"]').fill('16:00');

    await expect(page.getByText('-33.868800, 151.209300').first()).toBeVisible();
    await expect(page.getByText('16:00', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Australia/Sydney').first()).toBeVisible();
    await expect(page.getByText('Curve deck')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Both' })).toBeVisible();
  });

  test('calculator search exposes a clear API-failure state and manual alternative', async ({
    page,
  }) => {
    await page.route('**/api/geocode?**', async (route: Route) => {
      await route.fulfill({ status: 503, contentType: 'application/json', body: '{}' });
    });
    await page.goto('/golden-hour-calculator');

    const searchInput = page.locator('#calculator-location-search');
    await searchInput.click();
    await searchInput.pressSequentially('Broken place');
    await expect(searchInput).toHaveValue('Broken place');
    await expect(page.getByText(/Autocomplete unavailable — press Enter to search/i)).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByText('Or enter coordinates manually below.')).toBeVisible();
  });

  test('calculator local state does not carry into the home store', async ({ page }) => {
    await page.goto('/solar-azimuth-altitude');
    await setManualCoordinates(page, '78.22, 15.63');
    await page.locator('input[type="date"]').fill('2024-01-02');

    await page.goto('/');
    await expect(page.locator('input[type="date"]').first()).not.toHaveValue('2024-01-02');
    await expect(page.locator('[data-testid="location-display"]')).not.toContainText('78.220000');
  });
});

test.describe('Publisher content, SEO, and review-mode advertising', () => {
  test('all six guides expose engine data, charts, sources, and matching Article JSON-LD', async ({
    page,
  }) => {
    for (const slug of guideSlugs) {
      const route = `/guides/${slug}`;
      await page.goto(route);

      const heading = page.getByRole('heading', { level: 1 });
      await expect(heading).toHaveCount(1);
      const visibleTitle = await heading.textContent();
      await expect(page.getByRole('heading', { name: 'Astronomical event summary' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Fixed-time solar angle table' })).toBeVisible();
      await expect(page.getByText('Curve deck')).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Calculation sources' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Related guides' })).toBeVisible();
      await expect(
        page.getByRole('region', { name: 'Calculation sources' }).getByRole('link', { name: 'SunCalc' })
      ).toBeVisible();
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', new RegExp(route));

      const structuredData = await page.locator('script[type="application/ld+json"]').first().textContent();
      const graph = JSON.parse(structuredData ?? '[]') as Array<Record<string, unknown>>;
      const article = graph.find((item) => item['@type'] === 'Article');
      expect(article).toMatchObject({
        headline: visibleTitle,
        author: { '@type': 'Organization', name: 'Solar Path Tracker' },
      });
      await expect(page.locator('ins.adsbygoogle')).toHaveCount(0);
    }
  });

  test('every new public page has one H1, a canonical, and a unique title', async ({ page }) => {
    test.setTimeout(120_000);
    const routes = [
      ...calculatorRoutes,
      '/guides',
      ...guideSlugs.map((slug) => `/guides/${slug}`),
      '/methodology',
      '/contact',
      '/about',
      '/privacy',
      '/terms',
    ];
    const titles = new Set<string>();

    for (const route of routes) {
      const response = await page.goto(route);
      expect(response?.status()).toBe(200);
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', new RegExp(route === '/' ? '/$' : route));
      const pageTitle = await page.title();
      expect(pageTitle.length).toBeGreaterThan(20);
      expect(titles.has(pageTitle)).toBe(false);
      titles.add(pageTitle);
    }
  });

  test('review mode emits account meta only and never creates script or slots', async ({ page }) => {
    const routes = [
      '/',
      '/golden-hour-calculator',
      '/guides/how-to-read-a-sun-path-diagram',
      '/about',
      '/privacy',
      '/terms',
      '/contact',
      '/methodology',
    ];

    for (const route of routes) {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('meta[name="google-adsense-account"]')).toHaveAttribute(
        'content',
        'ca-pub-5483347501870595'
      );
      await expect(page.locator('script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]')).toHaveCount(0);
      await expect(page.locator('ins.adsbygoogle')).toHaveCount(0);
      await expect(page.getByLabel('Advertisement')).toHaveCount(0);
    }
  });

  test('robots, sitemap, and ads.txt return 200 and sitemap lists every guide', async ({ request }) => {
    for (const route of ['/robots.txt', '/sitemap.xml', '/ads.txt']) {
      const response = await request.get(route);
      expect(response.status()).toBe(200);
    }

    const sitemapResponse = await request.get('/sitemap.xml');
    const sitemapXml = await sitemapResponse.text();
    for (const slug of guideSlugs) {
      expect(sitemapXml).toContain(`/guides/${slug}`);
    }
    expect(sitemapXml).toContain('/methodology');
    expect(sitemapXml).toContain('/contact');
  });

  test('mobile affected pages stay console-clean without overflow or obvious layout shift', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(() => {
      (window as Window & { __layoutShiftScore?: number }).__layoutShiftScore = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as Array<PerformanceEntry & { value: number; hadRecentInput: boolean }>) {
          if (!entry.hadRecentInput) {
            (window as Window & { __layoutShiftScore?: number }).__layoutShiftScore! += entry.value;
          }
        }
      }).observe({ type: 'layout-shift', buffered: true });
    });

    const browserErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') {
        browserErrors.push(message.text());
      }
    });
    page.on('pageerror', (error) => browserErrors.push(error.message));

    // Vercel Analytics is served by platform infrastructure. Stub only those
    // external scripts so local browser checks still surface application errors.
    await page.route('**/_vercel/insights/script.js', (route) =>
      route.fulfill({ status: 200, contentType: 'application/javascript', body: '' })
    );
    await page.route('https://va.vercel-scripts.com/**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/javascript', body: '' })
    );

    for (const route of ['/sunrise-sunset-calculator', '/privacy']) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');

      const metrics = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        viewportWidth: window.innerWidth,
        cls: (window as Window & { __layoutShiftScore?: number }).__layoutShiftScore ?? 0,
      }));
      expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.viewportWidth);
      expect(metrics.cls).toBeLessThan(0.25);
    }

    expect(browserErrors).toEqual([]);
  });
});
