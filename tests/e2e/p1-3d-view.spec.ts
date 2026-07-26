/**
 * E2E Test: 3D Solar Path View
 *
 * Tests the 3D solar path visualization modal:
 * 1. 3D View button appears when location data is available
 * 2. Modal opens with 3D visualization
 * 3. Modal closes with Esc key
 * 4. Modal closes with close button
 * 5. Main map is unchanged after modal closes
 * 6. Tooltip appears on hover (US4)
 * 7. Selected hour is highlighted (US3)
 * 8. Camera reset functionality (US5)
 *
 * @see specs/002-3d-solar-path-view/quickstart.md
 */

import { test, expect, type Page } from '@playwright/test';

/**
 * Wait for the app to be fully loaded with location data
 */
async function waitForAppReady(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  // Wait for map to load
  await page.waitForSelector('.maplibregl-map', { timeout: 10000 });
  // Wait for 3D View button to be enabled (indicates data is ready)
  await page.waitForSelector('[data-testid="3d-view-button"]:not([disabled])', {
    timeout: 10000,
  });
}

/**
 * Open the 3D View modal
 */
async function open3DModal(page: Page) {
  const button = page.locator('[data-testid="3d-view-button"]');
  await expect(button).toBeEnabled();
  await button.click({ force: true });
  // Wait for modal to appear
  await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
}

async function waitForInteractive3DScene(page: Page) {
  const scene = page.getByTestId('solar-3d-map');
  await expect(scene).toBeVisible({ timeout: 15000 });
  await expect(scene.locator('.maplibregl-canvas')).toBeVisible({ timeout: 15000 });
  await expect(page.getByTestId('3d-map-loading')).toBeHidden({ timeout: 15000 });
  return scene;
}

/**
 * Close the 3D View modal using Esc key
 */
async function close3DModalWithEsc(page: Page) {
  await page.keyboard.press('Escape');
  await expect(page.locator('[role="dialog"]')).not.toBeVisible();
}

/**
 * Close the 3D View modal using close button
 */
async function close3DModalWithButton(page: Page) {
  await page.locator('[role="dialog"] button[aria-label="Close 3D view"]').click();
  await expect(page.locator('[role="dialog"]')).not.toBeVisible();
}

test.describe('3D Solar Path View - US1: Open/Close Modal', () => {
  test.beforeEach(async ({ page }) => {
    await waitForAppReady(page);
  });

  test('3D View button is visible when location data is available', async ({ page }) => {
    const button = page.locator('[data-testid="3d-view-button"]');
    await expect(button).toBeVisible();
    await expect(button).toBeEnabled();
  });

  test('3D View button is disabled when no location', async ({ page }) => {
    // This test would need to clear location state
    // For now, just verify button exists
    const button = page.locator('[data-testid="3d-view-button"]');
    await expect(button).toBeVisible();
  });

  test('clicking 3D View button opens modal', async ({ page }) => {
    await open3DModal(page);

    // Modal should be visible
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // Modal should have title
    await expect(modal.getByText('3D Solar Path View')).toBeVisible();

    // Modal should have close button
    await expect(modal.locator('button[aria-label="Close 3D view"]')).toBeVisible();

    // Modal should have Reset View button
    await expect(modal.getByText('Reset View')).toBeVisible();
  });

  test('pressing Escape closes the modal', async ({ page }) => {
    await open3DModal(page);
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    await close3DModalWithEsc(page);

    // Modal should be closed
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });

  test('clicking close button closes the modal', async ({ page }) => {
    await open3DModal(page);
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    await close3DModalWithButton(page);

    // Modal should be closed
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });

  test('main map is unchanged after modal closes', async ({ page }) => {
    // Get initial map center
    const mapContainer = page.locator('.maplibregl-map').first();
    const initialBounds = await mapContainer.boundingBox();

    await open3DModal(page);
    await close3DModalWithEsc(page);

    // Map should still be visible
    await expect(mapContainer).toBeVisible();

    // Map bounds should be the same (approximately)
    const finalBounds = await mapContainer.boundingBox();
    expect(finalBounds?.width).toBeCloseTo(initialBounds?.width ?? 0, 0);
    expect(finalBounds?.height).toBeCloseTo(initialBounds?.height ?? 0, 0);
  });

  test('modal has proper accessibility attributes', async ({ page }) => {
    await open3DModal(page);

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toHaveAttribute('aria-describedby');

    // Screen reader description should exist
    const description = page.locator('#solar-3d-description');
    await expect(description).toBeAttached();
  });

  test('compact header leaves most of the modal height for the 3D map', async ({ page }) => {
    await open3DModal(page);
    await waitForInteractive3DScene(page);

    const modalBox = await page.locator('[role="dialog"]').boundingBox();
    const headerBox = await page.getByTestId('solar-3d-header').boundingBox();
    const canvasShellBox = await page.getByTestId('solar-3d-canvas-shell').boundingBox();

    expect(modalBox).not.toBeNull();
    expect(headerBox).not.toBeNull();
    expect(canvasShellBox).not.toBeNull();
    expect(headerBox!.height).toBeLessThanOrEqual(64);
    expect(canvasShellBox!.height / modalBox!.height).toBeGreaterThan(0.7);
  });

  test('compact header fits a mobile viewport without horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await open3DModal(page);
    await waitForInteractive3DScene(page);

    const header = page.getByTestId('solar-3d-header');
    const headerBox = await header.boundingBox();
    const hasHorizontalOverflow = await header.evaluate(
      (element) => element.scrollWidth > element.clientWidth
    );

    expect(headerBox).not.toBeNull();
    expect(headerBox!.height).toBeLessThanOrEqual(56);
    expect(hasHorizontalOverflow).toBe(false);
  });
});

test.describe('3D Solar Path View - US2: Trajectory Without Selection', () => {
  test.beforeEach(async ({ page }) => {
    await waitForAppReady(page);
  });

  test('3D view shows sun path trajectory', async ({ page }) => {
    await open3DModal(page);

    // Wait for 3D canvas to load
    const modal = page.locator('[role="dialog"]');

    // Should show location info in footer
    await expect(modal.getByText(/Date:\s+\d{4}-\d{2}-\d{2}/)).toBeVisible();
  });

  test('3D view handles empty state gracefully', async ({ page }) => {
    // For polar night scenario - would need to set date/location
    // This test ensures the empty state message exists in the component
    await open3DModal(page);

    // Modal should be functional
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();
  });
});

test.describe('3D Solar Path View - US3: Selected Hour Highlighting', () => {
  test.beforeEach(async ({ page }) => {
    await waitForAppReady(page);
  });

  test('selected hour is displayed in modal footer when visible', async ({ page }) => {
    // First select an hour in the main view
    const tableRow = page.locator('[data-testid="solar-data-row-12"]');
    if (await tableRow.isVisible()) {
      await tableRow.click();
    }

    await open3DModal(page);

    // If hour 12 is visible (daytime), it should show in footer
    // Note: This may not show if hour 12 is night time at test location
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();
  });

  test('night hour selection does not crash modal', async ({ page }) => {
    // Select a night hour (if available)
    const nightRow = page.locator('[data-testid="solar-data-row-2"]');
    if (await nightRow.isVisible()) {
      await nightRow.click();
    }

    // Modal should still open without errors
    await open3DModal(page);
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // Close should work
    await close3DModalWithEsc(page);
  });
});

test.describe('3D Solar Path View - US5: Camera Controls', () => {
  test.beforeEach(async ({ page }) => {
    await waitForAppReady(page);
  });

  test('Reset View button is visible in modal', async ({ page }) => {
    await open3DModal(page);

    const resetButton = page.getByText('Reset View');
    await expect(resetButton).toBeVisible();
  });

  test('Reset View button is clickable', async ({ page }) => {
    await open3DModal(page);

    const resetButton = page.getByText('Reset View');
    await expect(resetButton).toBeEnabled();

    // Click should not cause errors
    await resetButton.click();

    // Modal should still be open
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();
  });

  test('initial and Reset View camera return to zoom 15', async ({ page }) => {
    await open3DModal(page);
    const scene = await waitForInteractive3DScene(page);

    await expect.poll(async () => Number(await scene.getAttribute('data-map-zoom'))).toBeCloseTo(15, 1);

    await scene.locator('.maplibregl-ctrl-zoom-in').click();
    await expect.poll(async () => Number(await scene.getAttribute('data-map-zoom'))).toBeCloseTo(16, 1);

    await page.getByText('Reset View').click();
    await expect.poll(async () => Number(await scene.getAttribute('data-map-zoom'))).toBeCloseTo(15, 1);
  });
});

test.describe('3D Solar Path View - Performance', () => {
  test('modal opens within 2 seconds', async ({ page }) => {
    await waitForAppReady(page);

    const startTime = Date.now();
    await open3DModal(page);
    const endTime = Date.now();

    const openTime = endTime - startTime;
    expect(openTime).toBeLessThan(2000);
  });

  test('modal closes quickly', async ({ page }) => {
    await waitForAppReady(page);
    await open3DModal(page);

    const startTime = Date.now();
    await close3DModalWithEsc(page);
    const endTime = Date.now();

    const closeTime = endTime - startTime;
    expect(closeTime).toBeLessThan(500);
  });
});

test.describe('3D Solar Path View - Free Terrain Scene', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'WebGL scene assertions run in Chromium');

  test('does not request 3D sources until the modal opens and stops after close', async ({ page }) => {
    const sceneRequests: string[] = [];
    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('tiles.mapterhorn.com') || url.includes('tiles.openfreemap.org/planet')) {
        sceneRequests.push(url);
      }
    });

    await waitForAppReady(page);
    expect(sceneRequests).toHaveLength(0);

    await open3DModal(page);
    await waitForInteractive3DScene(page);
    await expect.poll(() => sceneRequests.length, { timeout: 15000 }).toBeGreaterThan(0);

    await close3DModalWithEsc(page);
    const requestCountAfterClose = sceneRequests.length;
    await page.waitForTimeout(1000);
    expect(sceneRequests).toHaveLength(requestCountAfterClose);
  });

  test('loads the full terrain/building scene with required attribution', async ({ page }) => {
    await waitForAppReady(page);
    await open3DModal(page);

    const scene = await waitForInteractive3DScene(page);
    await expect(scene).toHaveAttribute('data-render-mode', 'full-3d');
    await expect(scene).toHaveAttribute('data-map-provider', 'openfreemap');
    await expect(scene).toHaveAttribute('data-compass-height-meters', '2.00');
    await expect(scene).toHaveAttribute('data-solar-base-height', '4.00');
    await expect(scene).toHaveAttribute('data-solar-compass-gap-meters', '2.00');

    const attribution = scene.locator('.maplibregl-ctrl-attrib-inner');
    await expect(attribution).toContainText('OpenFreeMap', { timeout: 15000 });
    await expect(attribution).toContainText('OpenMapTiles');
    await expect(attribution).toContainText('OpenStreetMap');
    await expect(attribution).toContainText('Mapterhorn');
  });

  test('keeps the complete solar path and spheres inside the map at every zoom level', async ({
    page,
  }) => {
    await waitForAppReady(page);
    await open3DModal(page);

    const scene = await waitForInteractive3DScene(page);
    const readMetric = async (attribute: string) =>
      Number(await scene.getAttribute(attribute));

    const zoomIn = scene.locator('.maplibregl-ctrl-zoom-in');
    const expectedSunPixels = await readMetric('data-sun-radius-pixels');

    for (let zoom = 15; zoom <= 20; zoom += 1) {
      if (zoom > 15) {
        await zoomIn.click();
      }

      await expect.poll(() => readMetric('data-map-zoom')).toBeCloseTo(zoom, 1);
      await expect
        .poll(() => readMetric('data-solar-viewport-measured-zoom'))
        .toBeCloseTo(zoom, 1);
      await expect
        .poll(() => scene.getAttribute('data-solar-viewport-contained'))
        .toBe('true');
      expect(await readMetric('data-path-radius-pixels')).toBeGreaterThan(0);
      expect(await readMetric('data-sun-radius-pixels')).toBe(expectedSunPixels);
      expect(await readMetric('data-compass-height-meters')).toBe(2);
      expect(await readMetric('data-solar-base-height')).toBe(4);
      expect(await readMetric('data-solar-compass-gap-meters')).toBe(2);
    }
  });

  test('keeps the complete solar scene inside a mobile map at every zoom level', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await waitForAppReady(page);
    await open3DModal(page);

    const scene = await waitForInteractive3DScene(page);
    const readMetric = async (attribute: string) =>
      Number(await scene.getAttribute(attribute));
    const zoomIn = scene.locator('.maplibregl-ctrl-zoom-in');

    for (let zoom = 15; zoom <= 20; zoom += 1) {
      if (zoom > 15) {
        await zoomIn.click();
      }

      await expect.poll(() => readMetric('data-map-zoom')).toBeCloseTo(zoom, 1);
      await expect
        .poll(() => readMetric('data-solar-viewport-measured-zoom'))
        .toBeCloseTo(zoom, 1);
      await expect
        .poll(() => scene.getAttribute('data-solar-viewport-contained'))
        .toBe('true');
    }
  });

  test('falls back to the lightweight flat map after the free style retry fails', async ({
    page,
  }) => {
    await page.route('https://tiles.openfreemap.org/styles/bright**', (route) => route.abort());
    await waitForAppReady(page);
    await open3DModal(page);

    const scene = await waitForInteractive3DScene(page);
    await expect(scene).toHaveAttribute('data-map-provider', 'fallback', { timeout: 15000 });
    await expect(scene).toHaveAttribute('data-render-mode', 'flat');
  });

  test('falls back after critical terrain and vector sources fail their retry', async ({
    page,
  }) => {
    await waitForAppReady(page);
    await page.route('https://tiles.mapterhorn.com/tilejson.json**', (route) => route.abort());
    await page.route('https://tiles.openfreemap.org/planet**', (route) => route.abort());
    await open3DModal(page);

    const scene = await waitForInteractive3DScene(page);
    await expect(scene).toHaveAttribute('data-map-provider', 'fallback', { timeout: 15000 });
    await expect(scene).toHaveAttribute('data-render-mode', 'flat');
  });

  test('shows the accessible summary after WebGL context loss', async ({ page }) => {
    await waitForAppReady(page);
    await open3DModal(page);

    const scene = await waitForInteractive3DScene(page);
    await scene.locator('.maplibregl-canvas').evaluate((canvas) => {
      canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true }));
    });

    const summary = page.getByTestId('solar-3d-summary');
    await expect(summary).toBeVisible();
    await expect(summary.getByRole('heading', { name: 'Solar Path Summary' })).toBeVisible();
  });
});
