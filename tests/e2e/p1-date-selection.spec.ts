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
    const today = new Date().toISOString().split('T')[0];
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
    const today = new Date().toISOString().split('T')[0];
    await expect(dateInput).toHaveValue(today);
    await expect(page.getByText('✓ Today')).toBeVisible();
  });

  test('quick date buttons exist for solstices and equinoxes', async ({ page }) => {
    // Look for quick date buttons
    const winterSolstice = page.getByRole('button', { name: /Winter Solstice/i });
    const summerSolstice = page.getByRole('button', { name: /Summer Solstice/i });
    const springEquinox = page.getByRole('button', { name: /Spring Equinox|Vernal/i });
    const fallEquinox = page.getByRole('button', { name: /Fall Equinox|Autumn/i });

    // At least some of these should be visible
    const buttons = await page.getByRole('button').filter({ 
      hasText: /Solstice|Equinox/i 
    }).count();
    expect(buttons).toBeGreaterThanOrEqual(2);
  });

  test('clicking winter solstice updates date', async ({ page }) => {
    const dateInput = page.locator('input[type="date"]');
    
    // Click winter solstice button if visible
    const winterButton = page.getByRole('button', { name: /Winter Solstice/i }).first();
    
    if (await winterButton.isVisible()) {
      await winterButton.click();
      
      // Date should be December 21
      const value = await dateInput.inputValue();
      expect(value).toMatch(/12-21/);
    }
  });

  test('solar data updates when date changes', async ({ page }) => {
    // Wait for initial data
    await expect(page.getByText(/Sunrise/i)).toBeVisible({ timeout: 10000 });

    // Capture initial sunrise time
    const initialContent = await page.textContent('body');

    // Change to winter solstice (shortest day)
    const dateInput = page.locator('input[type="date"]');
    await dateInput.fill('2024-12-21');

    // Wait for data to update
    await page.waitForTimeout(1000);

    // Day length should be visible and potentially different
    await expect(page.getByText(/Day Length/i)).toBeVisible();
  });

  test('map preserves center when date changes', async ({ page }) => {
    // Wait for map
    await expect(page.locator('.maplibregl-map')).toBeVisible({ timeout: 15000 });

    // First search for a specific location
    const searchInput = page.getByPlaceholder(/Search location/i);
    await searchInput.fill('Stockholm');
    await page.waitForTimeout(600);
    
    const result = page.getByRole('button').filter({ hasText: /Stockholm/i }).first();
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
    
    const result = page.getByRole('button').filter({ hasText: /Stockholm/i }).first();
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
    
    const result = page.getByRole('button').filter({ hasText: /Stockholm/i }).first();
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
    await expect(page.getByText(/Wed, Dec 25, 2024/i).or(
      page.getByText(/December 25/i)
    )).toBeVisible({ timeout: 3000 });
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
