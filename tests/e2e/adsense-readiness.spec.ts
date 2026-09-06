import { expect, test, type Page, type Route } from '@playwright/test';

const guideSlugs = [
  'how-to-read-a-sun-path-diagram',
  'brisbane-winter-vs-summer-sun-path',
  'east-vs-west-facing-homes-australia',
  'golden-hour-direction-brisbane',
  'solar-azimuth-altitude-worked-example',
  'estimating-shadow-direction-from-solar-angles',
] as const;

const applicationGuideRoutes = [
  '/guides/golden-hour-direction-brisbane',
  '/guides/brisbane-winter-vs-summer-sun-path',
  '/guides/estimating-shadow-direction-from-solar-angles',
] as const;

const guideEvidence: Record<(typeof guideSlugs)[number], { key: string; heading: string }> = {
  'how-to-read-a-sun-path-diagram': { key: 'sun-path-diagram', heading: 'Brisbane equinox sun-path diagram dataset' },
  'brisbane-winter-vs-summer-sun-path': { key: 'seasonal-comparison', heading: 'Brisbane solstice 24-hour comparison' },
  'east-vs-west-facing-homes-australia': { key: 'facade-orientation-matrix', heading: 'Australian east–west facade bearing matrix' },
  'golden-hour-direction-brisbane': { key: 'golden-hour-shot-plan', heading: 'Brisbane winter and summer directional shot plan' },
  'solar-azimuth-altitude-worked-example': { key: 'nrel-spa-benchmark', heading: 'NREL SPA canonical Golden, Colorado comparison' },
  'estimating-shadow-direction-from-solar-angles': { key: 'shadow-direction-model', heading: 'Perth two-metre shadow direction test' },
};

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
      await expect(page.getByTestId('calculator-csv-evidence')).toBeVisible();
      await expect(page.getByTestId('calculator-validation-evidence')).toBeVisible();
      await expect(page.getByTestId('csv-download')).toHaveCount(1);
      await expect(page.locator('ins.adsbygoogle')).toHaveCount(0);
    });
  }

  test('sunrise calculator handles manual coordinates, dates, polar day, and stable example', async ({
    page,
  }) => {
    await page.goto('/sunrise-sunset-calculator');
    await expect(page.getByRole('heading', { name: 'Brisbane · 21 June 2026' })).toBeVisible();
    await expect(page.getByText(/This fixed reference is independent/i)).toBeVisible();
    await expect(page.getByText('Solar noon', { exact: true }).first()).toBeVisible();
    await expect(page.getByText(/Altitude [+-]?\d+\.\d°/).first()).toBeVisible();
    const sunriseCharts = page.getByTestId('deferred-charts-panel');
    await sunriseCharts.scrollIntoViewIfNeeded();
    await expect(sunriseCharts).toHaveAttribute('data-state', 'loaded');
    await expect(page.getByText('Curve deck')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Altitude' })).toBeVisible();

    await setManualCoordinates(page, '78.22, 15.63');
    await page.locator('input[type="date"]').fill('2026-06-21');

    await expect(page.getByText(/Midnight sun - sun does not set/i).first()).toBeVisible();
    await expect(page.getByText('Unavailable', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Solar noon', { exact: true }).first()).toBeVisible();

    await page.locator('input[type="date"]').fill('2026-12-21');
    await expect(page.getByText(/Polar night - sun does not rise/i).first()).toBeVisible();
  });

  test('golden-hour calculator reports exact window bearings, altitude, and polar unavailable states', async ({
    page,
  }) => {
    await page.goto('/golden-hour-calculator');
    await expect(page.getByText('Morning golden hour', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Evening golden hour', { exact: true }).first()).toBeVisible();
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
    const angleCharts = page.getByTestId('deferred-charts-panel');
    await angleCharts.scrollIntoViewIfNeeded();
    await expect(angleCharts).toHaveAttribute('data-state', 'loaded');
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
    await expect(page.getByText(/Address suggestions are temporarily unavailable/i)).toBeVisible({
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
  test('home exposes a reproducible report and CSV only after a valid dataset exists', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.getByTestId('home-calculation-evidence')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Reproducible calculation report' })).toBeVisible();
    await expect(page.getByTestId('csv-download')).toHaveCount(1);
    await expect(page.locator('ins.adsbygoogle')).toHaveCount(0);
  });

  test('all six guides expose distinct evidence, CSV, sources, byline, and matching Article JSON-LD', async ({
    page,
  }) => {
    const evidenceHeadings = new Set<string>();
    for (const slug of guideSlugs) {
      const route = `/guides/${slug}`;
      await page.goto(route);

      const heading = page.getByRole('heading', { level: 1 });
      await expect(heading).toHaveCount(1);
      const visibleTitle = await heading.textContent();
      const evidence = page.getByTestId('guide-evidence');
      await expect(evidence).toHaveAttribute('data-evidence-key', guideEvidence[slug].key);
      await expect(page.getByRole('heading', { name: guideEvidence[slug].heading })).toBeVisible();
      evidenceHeadings.add(guideEvidence[slug].heading);
      expect(await evidence.locator('table, svg').count()).toBeGreaterThan(0);
      await expect(evidence.getByTestId('csv-download')).toHaveCount(1);
      await expect(page.getByRole('heading', { name: 'Evidence and calculation sources' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Related guides' })).toBeVisible();
      await expect(
        page.getByRole('region', { name: 'Evidence and calculation sources' }).getByRole('link', { name: 'SunCalc' })
      ).toBeVisible();
      await expect(page.getByRole('link', { name: /Editorial and technical review by the site maintainer/ })).toHaveAttribute('href', '/about#editorial-process');
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
    expect(evidenceHeadings.size).toBe(6);
  });

  test('methodology renders five fixed validation groups and source dates', async ({ page }) => {
    await page.goto('/methodology');
    await expect(page.getByRole('heading', { name: 'Independent validation report' })).toBeVisible();
    const report = page.getByTestId('solar-validation-results');
    await expect(report.locator('article')).toHaveCount(5);
    await expect(report.getByText('NREL SPA canonical position · Golden, Colorado')).toBeVisible();
    await expect(report.getByText('USNO polar-state snapshots · Longyearbyen')).toBeVisible();
    await expect(report.getByText(/snapshot checked 2026-08-24/)).toHaveCount(5);
    await expect(report.getByText('Within tolerance')).toHaveCount(5);
  });

  test('guide byline, About role, and Organization schema identify the same publisher', async ({ page }) => {
    await page.goto('/guides/solar-azimuth-altitude-worked-example');
    const byline = page.getByRole('link', { name: /Solar Path Tracker · Editorial and technical review by the site maintainer/ });
    await expect(byline).toBeVisible();
    await byline.click();
    await expect(page).toHaveURL(/\/about#editorial-process$/);
    await expect(page.getByRole('heading', { name: 'Editorial and technical review process' })).toBeVisible();
    await expect(page.getByText(/independently operated educational and research tool/i)).toBeVisible();
    await expect(page.getByText('solarpathtracker@gmail.com').first()).toBeVisible();

    const structuredData = await page.locator('script[type="application/ld+json"]').first().textContent();
    const graph = JSON.parse(structuredData ?? '[]') as Array<Record<string, unknown>>;
    expect(graph.find((item) => item['@type'] === 'Organization')).toMatchObject({
      name: 'Solar Path Tracker',
      email: 'solarpathtracker@gmail.com',
    });
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
      ...calculatorRoutes,
      '/guides',
      ...guideSlugs.map((slug) => `/guides/${slug}`),
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
    await page.route('**/_vercel/speed-insights/script.js', (route) =>
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

test.describe('Server-rendered guide application cases', () => {
  test.use({ javaScriptEnabled: false });

  test('golden-hour guide explains three camera placements from calculated bearings', async ({ page }) => {
    await page.goto('/guides/golden-hour-direction-brisbane');
    const applicationCase = page.getByTestId('golden-hour-application-case');
    await expect(applicationCase.getByText('Calculated example — not a field measurement')).toBeVisible();
    await expect(applicationCase.getByRole('heading', { name: 'Front light' })).toBeVisible();
    await expect(applicationCase.getByRole('heading', { name: 'Side light' })).toBeVisible();
    await expect(applicationCase.getByRole('heading', { name: 'Back light' })).toBeVisible();
    await expect(applicationCase.locator('svg')).toHaveCount(3);
    await expect(applicationCase.getByRole('link', { name: 'Open the Golden Hour Calculator' })).toHaveAttribute('href', '/golden-hour-calculator');
  });

  test('seasonal guide exposes a curve and three field-observation times', async ({ page }) => {
    await page.goto('/guides/brisbane-winter-vs-summer-sun-path');
    const applicationCase = page.getByTestId('seasonal-application-case');
    await expect(applicationCase.getByText('Calculated example — not a field measurement')).toBeVisible();
    await expect(applicationCase.getByRole('heading', { name: '08:00' })).toBeVisible();
    await expect(applicationCase.getByRole('heading', { name: '12:00' })).toBeVisible();
    await expect(applicationCase.getByRole('heading', { name: '16:00' })).toBeVisible();
    await expect(applicationCase.locator('svg')).toHaveCount(1);
    await expect(applicationCase.getByText(/12:00 is a sample, while calculated solar noon/i)).toBeVisible();
    await expect(applicationCase.getByText(/does not simulate indoor daylight, temperature/i)).toBeVisible();
  });

  test('shadow guide shows a worked formula and two text-described diagrams', async ({ page }) => {
    await page.goto('/guides/estimating-shadow-direction-from-solar-angles');
    const applicationCase = page.getByTestId('shadow-application-case');
    await expect(applicationCase.getByText('Calculated example — not a field measurement')).toBeVisible();
    await expect(applicationCase.getByRole('heading', { name: 'Work the 10:00 result step by step' })).toBeVisible();
    await expect(applicationCase.locator('svg')).toHaveCount(2);
    await expect(applicationCase.getByText(/doubling the object height/i)).toBeVisible();
    await expect(applicationCase.getByRole('heading', { name: 'Assumptions and stop conditions' })).toBeVisible();
    await expect(applicationCase.getByText(/When solar altitude is 0° or lower/i)).toBeVisible();
  });
});

test.describe('Guide application case presentation', () => {
  test('three cases fit mobile and desktop widths and remain readable after a theme change', async ({
    page,
  }) => {
    for (const viewport of [
      { width: 390, height: 844 },
      { width: 1440, height: 1000 },
    ]) {
      await page.setViewportSize(viewport);

      for (const route of applicationGuideRoutes) {
        await page.goto(route, { waitUntil: 'domcontentloaded' });
        await expect(page.getByText('Calculated example — not a field measurement')).toBeVisible();

        const dimensions = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          viewportWidth: window.innerWidth,
        }));
        expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.viewportWidth);
      }
    }

    await page.goto(applicationGuideRoutes[0]);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.getByRole('switch', { name: 'Switch to light mode' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(page.getByTestId('golden-hour-application-case')).toBeVisible();
    await expect(page.getByRole('switch', { name: 'Switch to dark mode' })).toBeVisible();
  });
});
