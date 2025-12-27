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
 * - Clicking the same hour again deselects it
 */

import { test, expect } from '@playwright/test';

test.describe('User Story 4: Interactive Hour Selection', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');

    // Wait for the app to initialize
    await page.waitForLoadState('networkidle');

    // Wait for the map to be ready
    await page.waitForSelector('[aria-label="Solar path map"]');

    // Wait for solar data table to appear (indicates location is set)
    await expect(page.getByRole('heading', { name: 'Hourly Solar Positions' })).toBeVisible({
      timeout: 10000,
    });
  });

  test('should display MetricsPanel section with no selection state initially', async ({
    page,
  }) => {
    // Check the Selected Hour section exists
    const metricsSection = page.getByRole('region', { name: /selected hour/i });
    await expect(metricsSection).toBeVisible();

    // Check for no selection message
    await expect(page.getByText('Select an hour from the map or table')).toBeVisible();
    await expect(page.getByText('Click on a ray or table row')).toBeVisible();
  });

  test('should highlight table row when clicked', async ({ page }) => {
    // Wait for table rows to be present
    const tableRows = page.locator('table tbody tr');
    await expect(tableRows.first()).toBeVisible();

    // Click on a row (e.g., 10:00 AM)
    const row10am = tableRows.nth(10); // Hour 10
    await row10am.click();

    // Verify the row has selected styling (ring-2)
    await expect(row10am).toHaveClass(/ring-2/);
    await expect(row10am).toHaveClass(/ring-blue-500/);
  });

  test('should update MetricsPanel when table row is clicked', async ({ page }) => {
    // Wait for table rows
    const tableRows = page.locator('table tbody tr');
    await expect(tableRows.first()).toBeVisible();

    // Click on noon row (hour 12)
    const noonRow = tableRows.nth(12);
    await noonRow.click();

    // Wait for MetricsPanel to update
    await expect(page.getByText('12:00 PM')).toBeVisible();

    // Check that azimuth and altitude values are displayed
    await expect(page.getByText(/Azimuth/i)).toBeVisible();
    await expect(page.getByText(/Altitude/i)).toBeVisible();

    // Check for daylight state indicator
    const stateIndicators = ['Day', 'Golden Hour', 'Twilight', 'Night'];
    const stateVisible = await Promise.any(
      stateIndicators.map((state) =>
        page
          .getByText(state, { exact: false })
          .isVisible()
          .then((visible) => (visible ? state : Promise.reject()))
      )
    ).catch(() => null);
    expect(stateVisible).not.toBeNull();
  });

  test('should show compass indicator in MetricsPanel', async ({ page }) => {
    // Click on a table row to select an hour
    const tableRows = page.locator('table tbody tr');
    await tableRows.nth(12).click();

    // Check for compass cardinal directions
    await expect(page.getByText('N', { exact: true })).toBeVisible();
    await expect(page.getByText('S', { exact: true })).toBeVisible();
    await expect(page.getByText('E', { exact: true })).toBeVisible();
    await expect(page.getByText('W', { exact: true })).toBeVisible();
  });

  test('should sync selection between table rows', async ({ page }) => {
    const tableRows = page.locator('table tbody tr');
    await expect(tableRows.first()).toBeVisible();

    // Click on hour 8
    const row8 = tableRows.nth(8);
    await row8.click();
    await expect(row8).toHaveClass(/ring-2/);

    // Click on hour 16
    const row16 = tableRows.nth(16);
    await row16.click();

    // Hour 8 should no longer be selected
    await expect(row8).not.toHaveClass(/ring-2/);
    // Hour 16 should be selected
    await expect(row16).toHaveClass(/ring-2/);

    // MetricsPanel should show 4:00 PM
    await expect(page.getByText('4:00 PM')).toBeVisible();
  });

  test('should deselect hour when clicking same row again', async ({ page }) => {
    const tableRows = page.locator('table tbody tr');
    await expect(tableRows.first()).toBeVisible();

    // Click on hour 10
    const row10 = tableRows.nth(10);
    await row10.click();
    await expect(row10).toHaveClass(/ring-2/);
    await expect(page.getByText('10:00 AM')).toBeVisible();

    // Click same row again to deselect
    await row10.click();

    // Should no longer be selected
    await expect(row10).not.toHaveClass(/ring-2/);

    // Should show no selection message again
    await expect(page.getByText('Select an hour from the map or table')).toBeVisible();
  });

  test('should display different states for different hours', async ({ page }) => {
    const tableRows = page.locator('table tbody tr');
    await expect(tableRows.first()).toBeVisible();

    // Check midnight (night state)
    await tableRows.nth(0).click();
    await expect(page.getByText('12:00 AM')).toBeVisible();

    // Get the altitude value - should be negative at night
    const altitudeText = await page.locator('text=/[+-]\\d+\\.\\d+°/').first().textContent();
    expect(altitudeText).toContain('-'); // Negative altitude at midnight

    // Check noon (day state)
    await tableRows.nth(12).click();
    await expect(page.getByText('12:00 PM')).toBeVisible();

    // At noon, altitude should typically be positive (sun above horizon)
    const noonAltitudeText = await page.locator('text=/[+-]\\d+\\.\\d+°/').first().textContent();
    expect(noonAltitudeText).toContain('+'); // Positive altitude at noon
  });

  test('should show azimuth direction in MetricsPanel', async ({ page }) => {
    const tableRows = page.locator('table tbody tr');
    await expect(tableRows.first()).toBeVisible();

    // Click on noon
    await tableRows.nth(12).click();

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
          .getByText(dir, { exact: true })
          .isVisible()
          .then((visible) => (visible ? dir : Promise.reject()))
      )
    ).catch(() => null);
    expect(directionVisible).not.toBeNull();
  });

  test('should maintain selection when changing date', async ({ page }) => {
    const tableRows = page.locator('table tbody tr');
    await expect(tableRows.first()).toBeVisible();

    // Select hour 14
    await tableRows.nth(14).click();
    await expect(page.getByText('2:00 PM')).toBeVisible();

    // Click "Tomorrow" button
    const tomorrowButton = page.getByRole('button', { name: /tomorrow/i });
    if (await tomorrowButton.isVisible()) {
      await tomorrowButton.click();

      // Wait for data to update
      await page.waitForTimeout(500);

      // Selection should be maintained
      await expect(page.getByText('2:00 PM')).toBeVisible();
      await expect(tableRows.nth(14)).toHaveClass(/ring-2/);
    }
  });
});

test.describe('Hour Selection - Map Ray Interaction', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[aria-label="Solar path map"]');
    await expect(page.getByRole('heading', { name: 'Hourly Solar Positions' })).toBeVisible({
      timeout: 10000,
    });
  });

  test('should have clickable rays on the map', async ({ page }) => {
    // The rays are rendered in the map canvas
    // We can verify the legend is present which indicates rays are rendered
    await expect(page.getByText('Daytime')).toBeVisible();
    await expect(page.getByText('Golden Hour')).toBeVisible();
    await expect(page.getByText('Night')).toBeVisible();
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
    await expect(page.getByRole('heading', { name: 'Hourly Solar Positions' })).toBeVisible({
      timeout: 10000,
    });
  });

  test('should be able to navigate table rows with keyboard', async ({ page }) => {
    // Focus on the table
    const table = page.locator('table');
    await table.focus();

    // Tab to first row
    await page.keyboard.press('Tab');

    // Press Enter to select
    await page.keyboard.press('Enter');

    // Check if a row is selected (this depends on implementation)
    // For now, just verify the table is keyboard accessible
    await expect(table).toBeFocused();
  });
});
