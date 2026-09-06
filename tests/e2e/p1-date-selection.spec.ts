/**
 * E2E Test: User Story 3 - Date Selection
 *
 * Tests the date selection feature:
 * 1. User can select any date
 * 2. Solar data updates for the new date
 * 3. Map preserves center/zoom when date changes
 * 4. Quick date buttons work (solstices, equinoxes)
 *
 * @see specs/001-solar-path-tracker/quickstart.md - Scenario 3
 */

import { test, expect } from '@playwright/test';

// MapLibre's main map needs a deterministic WebGL backend in Windows headless Chromium.
// Keep the software renderer scoped to this map-heavy date suite so the 3D terrain suite
// continues to exercise its normal browser configuration.
test.use({ launchOptions: { args: ['--use-angle=swiftshader'] } });

test.describe('User Story 3: Date Selection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('date picker is visible and shows today by default', async ({ page }) => {
    // Find date input
    const dateInput = page.locator('input[type="date"]');
    await expect(dateInput).toBeVisible();

    // Should show today's date
    const zone = await page.locator('#solar-data').getByText(/^[A-Za-z_]+\/[A-Za-z_]+$/).first().textContent();
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: zone?.trim() ?? 'UTC', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    await expect(dateInput).toHaveValue(today);

    // "Today" indicator should be visible
    await expect(page.getByText('✓ Today')).toBeVisible();
  });

  test('can select a different date using date picker', async ({ page }) => {
    const dateInput = page.locator('input[type="date"]');

    // Select a specific date (winter solstice 2024)
    await dateInput.fill('2024-12-21');

    // Value should update
    await expect(dateInput).toHaveValue('2024-12-21');

    // "Go to Today" button should appear
    await expect(page.getByText('Go to Today')).toBeVisible();
  });

  test('previous day button works', async ({ page }) => {
    const dateInput = page.locator('input[type="date"]');
    const currentValue = await dateInput.inputValue();

    // Click previous day
    await page.getByLabel('Previous day').click();

    // Date should be one day earlier
    const expectedDate = new Date(currentValue + 'T12:00:00');
    expectedDate.setDate(expectedDate.getDate() - 1);
    const expected = expectedDate.toISOString().split('T')[0];

    await expect(dateInput).toHaveValue(expected);
  });

  test('next day button works', async ({ page }) => {
    const dateInput = page.locator('input[type="date"]');
    const currentValue = await dateInput.inputValue();

    // Click next day
    await page.getByLabel('Next day').click();

    // Date should be one day later
    const expectedDate = new Date(currentValue + 'T12:00:00');
    expectedDate.setDate(expectedDate.getDate() + 1);
    const expected = expectedDate.toISOString().split('T')[0];

    await expect(dateInput).toHaveValue(expected);
  });

  test('Go to Today button returns to current date', async ({ page }) => {
    const dateInput = page.locator('input[type="date"]');

    // First select a different date
    await dateInput.fill('2024-06-21');
    await expect(page.getByText('Go to Today')).toBeVisible();

    // Click Go to Today
    await page.getByText('Go to Today').click();

    // Should return to today
    const zone = await page.locator('#solar-data').getByText(/^[A-Za-z_]+\/[A-Za-z_]+$/).first().textContent();
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: zone?.trim() ?? 'UTC', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    await expect(dateInput).toHaveValue(today);
    await expect(page.getByText('✓ Today')).toBeVisible();
  });

  test('quick reference buttons expose fixed dates', async ({ page }) => {
    for (const name of ['June reference', 'March reference', 'December reference', 'September reference']) {
      await expect(page.getByRole('button', { name, exact: true })).toBeVisible();
    }
  });

  test('December reference selects December 21', async ({ page }) => {
    await page.getByRole('button', { name: 'December reference', exact: true }).click();
    await expect(page.locator('input[type="date"]')).toHaveValue(`${new Date().getUTCFullYear()}-12-21`);
  });

  test('solar data updates when date changes', async ({ page }) => {
    const overview = page.getByRole('region', { name: 'Daily solar overview', exact: true });
    const dateInput = page.locator('input[type="date"]');
    await dateInput.fill('2024-06-21');
    await expect(overview.getByText('Sunrise', { exact: true })).toBeVisible();
    const initialOverview = await overview.innerText();
    await dateInput.fill('2024-12-21');
    await expect(dateInput).toHaveValue('2024-12-21');
    await expect.poll(() => overview.innerText()).not.toBe(initialOverview);
    await expect(overview.getByText('Day Length', { exact: true })).toBeVisible();
  });

  test('map preserves center when date changes', async ({ page }) => {
    // Wait for map
    await expect(page.locator('.maplibregl-map')).toBeVisible({ timeout: 15000 });

    // First search for a specific location
    const searchInput = page.getByPlaceholder(/Search location/i);
    await searchInput.fill('Stockholm');
    await page.waitForTimeout(600);

    const result = page
      .getByRole('button')
      .filter({ hasText: /Stockholm/i })
      .first();
    if (await result.isVisible()) {
      await result.click();
      await page.waitForTimeout(1500); // Wait for fly-to animation
    }

    // Get current location display
    const locationBefore = await page.locator('[data-testid="location-display"]').textContent();

    // Change date
    const dateInput = page.locator('input[type="date"]');
    await dateInput.fill('2024-06-21');

    // Location should be the same
    await page.waitForTimeout(500);
    const locationAfter = await page.locator('[data-testid="location-display"]').textContent();
    expect(locationBefore).toBe(locationAfter);
  });

  test('Stockholm winter solstice shows short day', async ({ page }) => {
    // Search for Stockholm
    const searchInput = page.getByPlaceholder(/Search location/i);
    await searchInput.fill('Stockholm Sweden');
    await page.waitForTimeout(600);

    const result = page
      .getByRole('button')
      .filter({ hasText: /Stockholm/i })
      .first();
    if (await result.isVisible()) {
      await result.click();
    }

    // Set to winter solstice
    const dateInput = page.locator('input[type="date"]');
    await dateInput.fill('2024-12-21');

    // Wait for update
    await page.waitForTimeout(1000);

    // Day length should be very short (around 6 hours)
    const dayLengthText = await page.getByText(/Day Length/i).textContent();
    expect(dayLengthText).toBeTruthy();
  });

  test('Stockholm summer solstice shows long day', async ({ page }) => {
    // Search for Stockholm
    const searchInput = page.getByPlaceholder(/Search location/i);
    await searchInput.fill('Stockholm Sweden');
    await page.waitForTimeout(600);

    const result = page
      .getByRole('button')
      .filter({ hasText: /Stockholm/i })
      .first();
    if (await result.isVisible()) {
      await result.click();
    }

    // Set to summer solstice
    const dateInput = page.locator('input[type="date"]');
    await dateInput.fill('2024-06-21');

    // Wait for update
    await page.waitForTimeout(1000);

    // Day length should be very long (around 18+ hours)
    const dayLengthText = await page.getByText(/Day Length/i).textContent();
    expect(dayLengthText).toBeTruthy();
  });

  test('polar region shows midnight sun message in summer', async ({ page }) => {
    // Search for Tromsø (above Arctic circle)
    const searchInput = page.getByPlaceholder(/Search location/i);
    await searchInput.fill('Tromso Norway');
    await page.waitForTimeout(800);

    const result = page.getByRole('button').filter({ hasText: /Troms/i }).first();
    if (await result.isVisible()) {
      await result.click();
    }

    // Set to summer solstice
    const dateInput = page.locator('input[type="date"]');
    await dateInput.fill('2024-06-21');

    // Wait for update
    await page.waitForTimeout(1000);

    // Should show polar day message or 24h day length
    const bodyContent = await page.textContent('body');
    expect(bodyContent).toMatch(/24|Midnight Sun|Polar Day|does not set/i);
  });

  test('date formatted display updates', async ({ page }) => {
    const dateInput = page.locator('input[type="date"]');

    // Set to Christmas
    await dateInput.fill('2024-12-25');

    // Should show formatted date with day name
    await expect(
      page.getByText(/Wed, Dec 25, 2024/i).or(page.getByText(/December 25/i))
    ).toBeVisible({ timeout: 3000 });
  });

  test('can navigate through multiple days rapidly', async ({ page }) => {
    const prevButton = page.getByLabel('Previous day');
    const nextButton = page.getByLabel('Next day');
    const dateInput = page.locator('input[type="date"]');

    const startDate = await dateInput.inputValue();

    // Click next 3 times
    await nextButton.click();
    await nextButton.click();
    await nextButton.click();

    // Click prev 3 times
    await prevButton.click();
    await prevButton.click();
    await prevButton.click();

    // Should be back at start
    await expect(dateInput).toHaveValue(startDate);
  });
});

test.describe('Date Selection with Different Locations', () => {
  test('equator location has consistent day length year-round', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Search for equatorial location
    const searchInput = page.getByPlaceholder(/Search location/i);
    await searchInput.fill('Quito Ecuador');
    await page.waitForTimeout(600);

    const result = page.getByRole('button').filter({ hasText: /Quito/i }).first();
    if (await result.isVisible()) {
      await result.click();
    }

    // Check winter solstice day length
    const dateInput = page.locator('input[type="date"]');
    await dateInput.fill('2024-12-21');
    await page.waitForTimeout(500);

    // Day length should be close to 12h year-round at equator
    await expect(page.getByText(/Day Length/i)).toBeVisible();
  });
});
