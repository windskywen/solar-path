import { expect, test, type Page, type Route } from '@playwright/test';

const performanceMode = process.env.PLAYWRIGHT_MOBILE_PERFORMANCE === 'true';

type EventTimingRecord = {
  name: string;
  startTime: number;
  duration: number;
  interactionId: number;
};

declare global {
  interface Window {
    __sptEventTimings?: EventTimingRecord[];
  }
}

async function fulfillGeocode(route: Route) {
  const query = new URL(route.request().url()).searchParams.get('q') ?? 'Measured place';
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      provider: 'geoapify',
      attribution: 'Powered by Geoapify',
      attributionUrl: 'https://www.geoapify.com/',
      fallbackAvailable: false,
      results: [
        {
          id: `timing-${query}`,
          displayName: `${query}, Performance fixture`,
          lat: -27.4698,
          lng: 153.0251,
          resultType: 'Municipality',
          osmUrl: 'https://www.openstreetmap.org/?mlat=-27.4698&mlon=153.0251',
        },
      ],
    }),
  });
}

async function mockControlledProviders(page: Page) {
  const flatTile = Buffer.from(
    await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Canvas 2D context is unavailable');
      context.fillStyle = 'rgb(128, 0, 0)';
      context.fillRect(0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/png').split(',')[1];
    }),
    'base64'
  );

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
  await page.route('https://tile.openstreetmap.org/**', (route) =>
    route.fulfill({ status: 200, contentType: 'image/png', body: flatTile })
  );
  await page.route('https://tiles.mapterhorn.com/tilejson.json**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        tilejson: '2.2.0',
        name: 'Controlled flat terrain',
        format: 'png',
        scheme: 'xyz',
        tiles: ['https://tiles.mapterhorn.com/{z}/{x}/{y}.webp'],
        minzoom: 0,
        maxzoom: 14,
        bounds: [-180, -85.0511, 180, 85.0511],
      }),
    })
  );
  await page.route(/^https:\/\/tiles\.mapterhorn\.com\/\d+\/\d+\/\d+\.webp(?:\?.*)?$/, (route) =>
    route.fulfill({ status: 200, contentType: 'image/png', body: flatTile })
  );
  await page.route('https://tiles.openfreemap.org/styles/bright**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        version: 8,
        name: 'Controlled OpenFreeMap',
        sources: {},
        layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#e8edf2' } }],
      }),
    })
  );
  await page.route('https://tiles.openfreemap.org/planet**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        tilejson: '3.0.0',
        name: 'Controlled empty buildings',
        scheme: 'xyz',
        tiles: ['https://tiles.openfreemap.org/e2e/{z}/{x}/{y}.pbf'],
        minzoom: 0,
        maxzoom: 14,
        bounds: [-180, -85.0511, 180, 85.0511],
      }),
    })
  );
  await page.route(/^https:\/\/tiles\.openfreemap\.org\/e2e\/\d+\/\d+\/\d+\.pbf(?:\?.*)?$/, (route) =>
    route.fulfill({ status: 200, contentType: 'application/x-protobuf', body: Buffer.alloc(0) })
  );
}

async function waitForHomeReady(page: Page) {
  await expect(page.getByRole('button', { name: 'Open 3D solar path view' })).toBeEnabled({ timeout: 20_000 });
  await expect(page.locator('button[aria-label*="Azimuth"][aria-label*="Altitude"]')).toHaveCount(24, { timeout: 20_000 });
  await expect(page.locator('.maplibregl-canvas')).toBeVisible({ timeout: 20_000 });
  await page.waitForTimeout(1_000);
}

async function measureInteraction(
  page: Page,
  action: () => Promise<void>,
  settle: () => Promise<void>
): Promise<number> {
  const startTime = await page.evaluate(() => {
    window.__sptEventTimings = [];
    return performance.now();
  });
  await action();
  await settle();
  await page.waitForTimeout(120);

  const observation = await page.evaluate((startedAt) => {
    const entries = (window.__sptEventTimings ?? []).filter(
      (entry) => entry.startTime >= startedAt && entry.interactionId > 0
    );
    if (entries.length === 0) {
      // The Event Timing API reports no entry when the interaction remains
      // below its 16 ms duration threshold.
      return { duration: 0, entries: [] };
    }
    return {
      duration: Math.max(...entries.map((entry) => entry.duration)),
      entries,
    };
  }, startTime);
  if (observation.duration > 200) {
    console.info(`Over-budget Event Timing entries: ${JSON.stringify(observation.entries)}`);
  }
  await page.waitForTimeout(1_000);
  return observation.duration;
}

test.use({
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  isMobile: true,
});

test.describe('Controlled mobile Event Timing', () => {
  test.skip(!performanceMode, 'Run against a production build with PLAYWRIGHT_MOBILE_PERFORMANCE=true.');
  test.skip(({ browserName }) => browserName !== 'chromium', 'CPU throttling and Event Timing collection use Chromium CDP.');
  test.describe.configure({ timeout: 240_000 });

  test('five samples per core interaction stay at or below 200 ms under 4x CPU slowdown', async ({ page }) => {
    await mockControlledProviders(page);
    await page.route('**/api/geocode?**', fulfillGeocode);
    await page.addInitScript(() => {
      window.__sptEventTimings = [];
      try {
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const timing = entry as PerformanceEntry & { interactionId?: number };
            window.__sptEventTimings?.push({
              name: timing.name,
              startTime: timing.startTime,
              duration: timing.duration,
              interactionId: timing.interactionId ?? 0,
            });
          }
        }).observe({ type: 'event', buffered: true, durationThreshold: 16 } as PerformanceObserverInit);
      } catch {
        // The assertion below will fail with no supported entries only if a
        // measured interaction itself cannot be completed.
      }
    });

    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await page.goto('/');
    await waitForHomeReady(page);

    const samples: Record<string, number[]> = {
      searchResult: [],
      dateChange: [],
      hourlyRow: [],
      mapLocation: [],
      first3DOpen: [],
      first3DClose: [],
    };

    const searchInput = page.getByPlaceholder(/Search location/i);
    for (let index = 0; index < 5; index += 1) {
      const query = `Measured place ${index + 1}`;
      await searchInput.fill(query);
      const result = page.getByRole('listbox', { name: /Search results/i }).getByRole('button').filter({ hasText: query });
      await expect(result).toBeVisible({ timeout: 5_000 });
      samples.searchResult.push(
        await measureInteraction(
          page,
          () => result.tap({ position: { x: 24, y: 24 } }),
          () => expect(page.locator('[data-testid="location-display"]')).toContainText(query)
        )
      );
    }

    await page.reload();
    await waitForHomeReady(page);
    for (let index = 0; index < 5; index += 1) {
      const dateInput = page.locator('input[type="date"]').first();
      const previousValue = await dateInput.inputValue();
      samples.dateChange.push(
        await measureInteraction(
          page,
          () => page.getByLabel('Next day').tap(),
          () => expect(dateInput).not.toHaveValue(previousValue)
        )
      );
    }

    await page.reload();
    await waitForHomeReady(page);
    const hourlyRows = page.locator('button[aria-label*="Azimuth"][aria-label*="Altitude"]');
    const deferredCharts = page.getByTestId('deferred-charts-panel').first();
    await deferredCharts.scrollIntoViewIfNeeded();
    await expect(deferredCharts).toHaveAttribute('data-state', 'loaded', { timeout: 20_000 });
    await expect(deferredCharts.getByText('Curve deck')).toBeVisible({ timeout: 20_000 });
    await hourlyRows.nth(8).scrollIntoViewIfNeeded();
    await page.waitForTimeout(1_000);
    for (let index = 0; index < 5; index += 1) {
      const row = hourlyRows.nth(8 + index);
      samples.hourlyRow.push(
        await measureInteraction(
          page,
          () => row.tap(),
          () => expect(row).toHaveAttribute('aria-selected', 'true')
        )
      );
    }

    await page.reload();
    await waitForHomeReady(page);
    const mapCanvas = page.locator('.maplibregl-canvas');
    await mapCanvas.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1_000);
    for (let index = 0; index < 5; index += 1) {
      const previousLocation = await page.locator('[data-testid="location-display"]').textContent();
      samples.mapLocation.push(
        await measureInteraction(
          page,
          () => mapCanvas.tap({ position: { x: 190 + index * 10, y: 56 + index * 6 } }),
          () => expect.poll(() => page.locator('[data-testid="location-display"]').textContent()).not.toBe(previousLocation)
        )
      );
    }

    await page.reload();
    await waitForHomeReady(page);
    for (let index = 0; index < 5; index += 1) {
      if (index > 0) {
        await page.reload();
        await waitForHomeReady(page);
      }
      const openButton = page.getByRole('button', { name: 'Open 3D solar path view' });
      samples.first3DOpen.push(
        await measureInteraction(
          page,
          () => openButton.tap(),
          () => expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 20_000 })
        )
      );
      await expect(page.getByTestId('solar-3d-map')).toBeVisible({ timeout: 20_000 });
      await expect(page.getByTestId('3d-map-loading')).toBeHidden({ timeout: 30_000 });
      await page.waitForTimeout(500);
      const closeButton = page.locator('[role="dialog"] button[aria-label="Close 3D view"]');
      samples.first3DClose.push(
        await measureInteraction(
          page,
          () => closeButton.tap(),
          () => expect(page.locator('[role="dialog"]')).not.toBeVisible()
        )
      );
    }

    await test.info().attach('mobile-event-timing.json', {
      body: JSON.stringify(samples, null, 2),
      contentType: 'application/json',
    });
    console.info(`Controlled mobile Event Timing samples: ${JSON.stringify(samples)}`);

    const invalidSampleCounts = Object.fromEntries(
      Object.entries(samples).filter(([, durations]) => durations.length !== 5)
    );
    expect(invalidSampleCounts, JSON.stringify(samples, null, 2)).toEqual({});

    const overBudget = Object.fromEntries(
      Object.entries(samples).filter(([, durations]) => Math.max(...durations) > 200)
    );
    expect(overBudget, JSON.stringify(samples, null, 2)).toEqual({});
  });
});
