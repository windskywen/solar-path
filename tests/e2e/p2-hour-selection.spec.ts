/**
 * E2E Tests: User Story 4 - Interactive Hour Selection
 *
 * Tests the P2 feature for selecting and viewing details for specific hours.
 *
 * Acceptance Criteria:
 * - User can click on a ray to select that hour
 * - User can click on a table row to select that hour
 * - Selected hour is highlighted on map and table
 * - MetricsPanel shows detailed info for selected hour
 * - Clicking the same hour again keeps that hour selected
 */

import { test, expect } from '@playwright/test';

function getHourlyControls(page: import('@playwright/test').Page) {
  return page.locator('button[aria-label*="Azimuth"][aria-label*="Altitude"]');
}

test.describe('User Story 4: Interactive Hour Selection', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');

    // Wait for the app to initialize
    await page.waitForLoadState('networkidle');

    // Wait for the map to be ready
    await page.waitForSelector('[aria-label="Solar path map"]');

    // Wait for all 24 hourly controls (indicates location and solar data are ready).
    await expect(getHourlyControls(page)).toHaveCount(24, { timeout: 10000 });
  });

  test('should display MetricsPanel section with no selection state initially', async ({
    page,
  }) => {
    // Check the Selected Hour section exists
    const metricsSection = page.getByRole('region', { name: /selected hour/i });
    await expect(metricsSection).toBeVisible();

    // Check for no selection message
    await expect(metricsSection.getByText('No hour selected', { exact: true })).toBeVisible();
    await expect(
      metricsSection.getByText(
        'Click on the map rays or the hourly rail to surface a focused solar metric card.',
        { exact: true }
      )
    ).toBeVisible();
  });

  test('should highlight table row when clicked', async ({ page }) => {
    const hourlyControls = getHourlyControls(page);
    await expect(hourlyControls.first()).toBeVisible();

    // Click on a row (e.g., 10:00 AM)
    const row10am = hourlyControls.nth(10); // Hour 10
    await row10am.click();

    await expect(row10am).toHaveAttribute('aria-selected', 'true');
    await expect(row10am).toHaveClass(/solar-row-selected/);
  });

  test('should update MetricsPanel when table row is clicked', async ({ page }) => {
    const hourlyControls = getHourlyControls(page);
    await expect(hourlyControls.first()).toBeVisible();

    // Click on noon row (hour 12)
    const noonRow = hourlyControls.nth(12);
    await noonRow.click();

    // Wait for MetricsPanel to update
    const metricsSection = page.getByRole('region', { name: /selected hour/i });
    await expect(metricsSection.getByText('12:00 PM', { exact: true })).toBeVisible();

    // Check that azimuth and altitude values are displayed
    await expect(metricsSection.getByText('Azimuth', { exact: true })).toBeVisible();
    await expect(metricsSection.getByText('Altitude', { exact: true })).toBeVisible();

    // Check for daylight state indicator
    await expect(metricsSection.getByText(/^(Day|Golden Hour|Night)$/)).toBeVisible();
  });

  test('should show compass indicator in MetricsPanel', async ({ page }) => {
    // Click on a table row to select an hour
    await getHourlyControls(page).nth(12).click();

    // Check for compass cardinal directions
    const metricsSection = page.getByRole('region', { name: /selected hour/i });
    await expect(metricsSection.getByText('N', { exact: true })).toBeVisible();
    await expect(metricsSection.getByText('S', { exact: true })).toBeVisible();
    await expect(metricsSection.getByText('E', { exact: true })).toBeVisible();
    await expect(metricsSection.getByText('W', { exact: true })).toBeVisible();
  });

  test('should sync selection between table rows', async ({ page }) => {
    const hourlyControls = getHourlyControls(page);
    await expect(hourlyControls.first()).toBeVisible();

    // Click on hour 8
    const row8 = hourlyControls.nth(8);
    await row8.click();
    await expect(row8).toHaveAttribute('aria-selected', 'true');

    // Click on hour 16
    const row16 = hourlyControls.nth(16);
    await row16.click();

    // Hour 8 should no longer be selected
    await expect(row8).toHaveAttribute('aria-selected', 'false');
    // Hour 16 should be selected
    await expect(row16).toHaveAttribute('aria-selected', 'true');

    // MetricsPanel should show 4:00 PM
    await expect(
      page.getByRole('region', { name: /selected hour/i }).getByText('4:00 PM', { exact: true })
    ).toBeVisible();
  });

  test('should keep the same hour selected when clicked again', async ({ page }) => {
    const hourlyControls = getHourlyControls(page);
    await expect(hourlyControls.first()).toBeVisible();

    // Click on hour 10
    const row10 = hourlyControls.nth(10);
    await row10.click();
    await expect(row10).toHaveAttribute('aria-selected', 'true');
    await expect(
      page.getByRole('region', { name: /selected hour/i }).getByText('10:00 AM', { exact: true })
    ).toBeVisible();

    // Repeating the same selection is intentionally idempotent.
    await row10.click();

    await expect(row10).toHaveAttribute('aria-selected', 'true');
    await expect(
      page.getByRole('region', { name: /selected hour/i }).getByText('10:00 AM', { exact: true })
    ).toBeVisible();
  });

  test('should display different states for different hours', async ({ page }) => {
    const hourlyControls = getHourlyControls(page);
    await expect(hourlyControls.first()).toBeVisible();
    const metricsSection = page.getByRole('region', { name: /selected hour/i });

    // Check midnight (night state)
    await hourlyControls.nth(0).click();
    await expect(metricsSection.getByText('12:00 AM', { exact: true })).toBeVisible();

    // Get the altitude value - should be negative at night
    const altitudeText = await metricsSection.locator('text=/[+-]\\d+\\.\\d+°/').first().textContent();
    expect(altitudeText).toContain('-'); // Negative altitude at midnight

    // Check noon (day state)
    await hourlyControls.nth(12).click();
    await expect(metricsSection.getByText('12:00 PM', { exact: true })).toBeVisible();

    // At noon, altitude should typically be positive (sun above horizon)
    const noonAltitudeText = await metricsSection.locator('text=/[+-]\\d+\\.\\d+°/').first().textContent();
    expect(noonAltitudeText).toContain('+'); // Positive altitude at noon
  });

  test('should show azimuth direction in MetricsPanel', async ({ page }) => {
    const hourlyControls = getHourlyControls(page);
    await expect(hourlyControls.first()).toBeVisible();

    // Click on noon
    await hourlyControls.nth(12).click();

    // Check for cardinal direction abbreviations (N, NE, E, SE, S, SW, W, NW, etc.)
    const directions = [
      'N',
      'NE',
      'E',
      'SE',
      'S',
      'SW',
      'W',
      'NW',
      'NNE',
      'ENE',
      'ESE',
      'SSE',
      'SSW',
      'WSW',
      'WNW',
      'NNW',
    ];
    const directionVisible = await Promise.any(
      directions.map((dir) =>
        page
          .getByRole('region', { name: /selected hour/i })
          .getByText(dir, { exact: true })
          .isVisible()
          .then((visible) => (visible ? dir : Promise.reject()))
      )
    ).catch(() => null);
    expect(directionVisible).not.toBeNull();
  });

  test('should maintain selection when changing date', async ({ page }) => {
    const hourlyControls = getHourlyControls(page);
    await expect(hourlyControls.first()).toBeVisible();

    // Select hour 14
    await hourlyControls.nth(14).click();
    const metricsSection = page.getByRole('region', { name: /selected hour/i });
    await expect(metricsSection.getByText('2:00 PM', { exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Next day' }).click();

    // Wait for data to update
    await page.waitForTimeout(500);

    await expect(metricsSection.getByText('2:00 PM', { exact: true })).toBeVisible();
    await expect(hourlyControls.nth(14)).toHaveAttribute('aria-selected', 'true');
  });
});

test.describe('Hour Selection - Map Ray Interaction', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[aria-label="Solar path map"]');
    await expect(getHourlyControls(page)).toHaveCount(24, { timeout: 10000 });
  });

  test('should have clickable rays on the map', async ({ page }) => {
    // The rays are rendered in the map canvas
    // We can verify the legend is present which indicates rays are rendered
    const legend = page.getByRole('heading', { name: 'Ray colors' }).locator('..');
    await expect(legend.getByText('Daytime', { exact: true })).toBeVisible();
    await expect(legend.getByText('Golden', { exact: true })).toBeVisible();
    await expect(legend.getByText('Night', { exact: true })).toBeVisible();
  });

  // Note: Testing actual ray clicks is complex with MapLibre GL
  // The interaction is implemented via onRayClick prop in SolarRaysLayer
  // Manual testing or more sophisticated E2E setup would be needed
  // to verify map canvas interactions
});

test.describe('Hour Selection - Keyboard Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[aria-label="Solar path map"]');
    await expect(getHourlyControls(page)).toHaveCount(24, { timeout: 10000 });
  });

  test('should be able to navigate table rows with keyboard', async ({ page }) => {
    const firstHourlyControl = getHourlyControls(page).first();
    await firstHourlyControl.focus();
    await expect(firstHourlyControl).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(firstHourlyControl).toHaveAttribute('aria-selected', 'true');
    await expect(
      page.getByRole('region', { name: /selected hour/i }).getByText('12:00 AM', { exact: true })
    ).toBeVisible();
  });
});
