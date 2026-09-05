import { expect, test } from '@playwright/test';

const publicPageExpectations = [
  {
    route: '/',
    title: 'Sun Path Map & Sun Tracker | Solar Path Tracker',
    description:
      'Use an interactive sun path map to check solar path, sun direction, azimuth, altitude, sunrise, sunset, and 3D daylight for any location, date, and time.',
    heading: 'Sun path map and sun tracker for any location.',
    rawHtmlPhrases: [
      'A calculated solar position, not a live sensor',
      'What does a sun path map show?',
      'Does the map include terrain, buildings, trees, or weather?',
    ],
  },
  {
    route: '/sunrise-sunset-calculator',
    title: 'Sunrise & Sunset Calculator | Solar Path Tracker',
    description:
      'Calculate sunrise, sunset, civil dawn, civil dusk, daylight length, and event direction for any location and date.',
    heading: 'Sunrise & Sunset Calculator',
    rawHtmlPhrases: [
      'How can I check sunrise or sunset direction?',
      'Can I compare these event times with the Sun Path Map?',
    ],
  },
  {
    route: '/solar-azimuth-altitude',
    title: 'Sun Position & Angle Calculator | Solar Path Tracker',
    description:
      'Calculate sun position, angle, azimuth, altitude or elevation, and a 24-hour curve for any location, date, and local time.',
    heading: 'Sun Position, Azimuth & Altitude Calculator',
    rawHtmlPhrases: [
      'How do I calculate a sun angle for a location and time?',
      'What is the difference between altitude and elevation?',
    ],
  },
] as const;

const guideToolLinks: Record<string, readonly string[]> = {
  'how-to-read-a-sun-path-diagram': ['/'],
  'brisbane-winter-vs-summer-sun-path': ['/', '/sunrise-sunset-calculator'],
  'east-vs-west-facing-homes-australia': ['/solar-azimuth-altitude'],
  'golden-hour-direction-brisbane': ['/', '/sunrise-sunset-calculator'],
  'solar-azimuth-altitude-worked-example': ['/solar-azimuth-altitude'],
  'estimating-shadow-direction-from-solar-angles': ['/solar-azimuth-altitude'],
};

function getStructuredDataItems(rawScripts: readonly string[]) {
  return rawScripts.flatMap((raw) => {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [parsed];
  }) as Array<Record<string, unknown>>;
}

test.describe('Tier S and Tier A SEO release', () => {
  test('renders the three target pages with exact metadata, H1s, and server-rendered supporting content', async ({
    page,
    request,
  }) => {
    for (const expected of publicPageExpectations) {
      const response = await request.get(expected.route);
      expect(response.ok()).toBe(true);
      const html = await response.text();

      for (const phrase of expected.rawHtmlPhrases) {
        expect(html).toContain(phrase);
      }

      await page.goto(expected.route);
      await expect(page).toHaveTitle(expected.title);
      await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', expected.description);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(expected.heading);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        'href',
        expected.route === '/' ? /^https?:\/\/[^/]+\/?$/ : new RegExp(`${expected.route}$`)
      );
    }
  });

  test('uses descriptive, crawlable internal links without synonym landing pages', async ({ page, request }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'Sunrise & Sunset Calculator', exact: true }).first()).toHaveAttribute(
      'href',
      '/sunrise-sunset-calculator'
    );
    await expect(page.getByRole('link', { name: 'Sun Position & Angle Calculator', exact: true }).first()).toHaveAttribute(
      'href',
      '/solar-azimuth-altitude'
    );
    await expect(page.getByRole('link', { name: 'How to Read a Sun Path Diagram', exact: true })).toHaveAttribute(
      'href',
      '/guides/how-to-read-a-sun-path-diagram'
    );

    for (const [slug, expectedHrefs] of Object.entries(guideToolLinks)) {
      await page.goto(`/guides/${slug}`);
      const relatedTools = page.getByRole('heading', { name: 'Use the live tool', exact: true }).locator('xpath=..');
      await expect(relatedTools).toBeVisible();

      for (const href of expectedHrefs) {
        await expect(relatedTools.locator(`a[href="${href}"]`)).toBeVisible();
        const response = await request.get(href);
        expect(response.ok()).toBe(true);
      }
    }

    for (const synonymRoute of [
      '/sun-path-map',
      '/solar-path-map',
      '/sun-tracker-map',
      '/sun-movement-map',
      '/sun-angle-calculator',
    ]) {
      const response = await request.get(synonymRoute);
      expect(response.status()).toBe(404);
    }

    const sitemapResponse = await request.get('/sitemap.xml');
    expect(sitemapResponse.ok()).toBe(true);
    const sitemapXml = await sitemapResponse.text();
    expect(sitemapXml.match(/<loc>/g)).toHaveLength(16);
    expect(sitemapXml).not.toContain('/sun-path-map');
    expect(sitemapXml).not.toContain('/solar-path-map');
    expect(sitemapXml).not.toContain('/sun-tracker-map');
    expect(sitemapXml).not.toContain('/sun-movement-map');
    expect(sitemapXml).not.toContain('/sun-angle-calculator');
  });

  test('keeps calculator FAQ JSON-LD aligned with the visible FAQ copy', async ({ page }) => {
    for (const route of ['/sunrise-sunset-calculator', '/solar-azimuth-altitude']) {
      await page.goto(route);
      const visibleQuestions = await page
        .locator('#calculator-faq-heading')
        .locator('xpath=..')
        .getByRole('heading', { level: 3 })
        .allTextContents();
      const structuredData = getStructuredDataItems(
        await page.locator('script[type="application/ld+json"]').allTextContents()
      );
      const faqPage = structuredData.find((item) => item['@type'] === 'FAQPage');
      const mainEntity = faqPage?.mainEntity as Array<Record<string, unknown>> | undefined;

      expect(mainEntity?.map((question) => question.name)).toEqual(visibleQuestions);
    }

    await page.goto('/');
    const homeStructuredData = getStructuredDataItems(
      await page.locator('script[type="application/ld+json"]').allTextContents()
    );
    expect(homeStructuredData.some((item) => item['@type'] === 'FAQPage')).toBe(false);
  });

  test('keeps the Tier A calculator surfaces responsive on phone, tablet, and desktop', async ({ page }) => {
    test.setTimeout(120_000);
    const browserErrors: string[] = [];
    const missingResources: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') browserErrors.push(message.text());
    });
    page.on('pageerror', (error) => browserErrors.push(error.message));
    page.on('response', (response) => {
      if (response.status() === 404) {
        missingResources.push(new URL(response.url()).pathname);
      }
    });

    // Vercel Analytics is served by platform infrastructure. Stub only that
    // external instrumentation so this regression still fails on unexpected
    // application console errors or missing assets.
    await page.route('**/_vercel/insights/script.js', (route) =>
      route.fulfill({ status: 200, contentType: 'application/javascript', body: '' })
    );
    await page.route('https://va.vercel-scripts.com/**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/javascript', body: '' })
    );

    await page.addInitScript(() => {
      (window as Window & { __tierSeoCls?: number }).__tierSeoCls = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as Array<PerformanceEntry & { value: number; hadRecentInput: boolean }>) {
          if (!entry.hadRecentInput) {
            (window as Window & { __tierSeoCls?: number }).__tierSeoCls! += entry.value;
          }
        }
      }).observe({ type: 'layout-shift', buffered: true });
    });

    const responsiveCases = [
      { viewport: { width: 390, height: 844 }, route: '/sunrise-sunset-calculator' },
      { viewport: { width: 768, height: 1024 }, route: '/solar-azimuth-altitude' },
      { viewport: { width: 1440, height: 1000 }, route: '/solar-azimuth-altitude' },
    ] as const;

    for (const { viewport, route } of responsiveCases) {
      await page.setViewportSize(viewport);
      await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 20_000 });
      // The H1 is server-rendered, whereas this client surface confirms that
      // the calculator's chunks have hydrated before the next viewport/route
      // transition begins. This avoids cancelling a pending dev chunk in
      // Firefox while retaining the browser-error assertion below.
      await expect(page.getByText('Brisbane, Queensland, Australia').first()).toBeVisible({
        timeout: 30_000,
      });
      await expect(page.locator('input[type="date"]')).toHaveValue(/^\d{4}-\d{2}-\d{2}$/);
      await page.waitForLoadState('networkidle', { timeout: 30_000 });

      const metrics = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        viewportWidth: window.innerWidth,
        cls: (window as Window & { __tierSeoCls?: number }).__tierSeoCls ?? 0,
      }));
      expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.viewportWidth);
      expect(metrics.cls).toBeLessThan(0.1);
    }

    expect(missingResources).toEqual([]);
    expect(browserErrors).toEqual([]);
  });
});
