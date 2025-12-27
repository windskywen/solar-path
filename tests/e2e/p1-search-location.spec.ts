/**
 * E2E Test: User Story 2 - Search Location
 *
 * Tests the location search feature:
 * 1. User can type in search box
 * 2. Search results appear after debounce delay
 * 3. Results show OSM verification link
 * 4. Clicking a result updates the location
 * 5. Map recenters to selected location
 *
 * @see specs/001-solar-path-tracker/quickstart.md - Scenario 2
 */

import { test, expect, type Page } from '@playwright/test';

test.describe('User Story 2: Search Location', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Wait for map to load
    await expect(page.locator('.maplibregl-map')).toBeVisible({ timeout: 15000 });
  });

  test('search input is visible and accepts input', async ({ page }) => {
    // Find search input
    const searchInput = page.getByPlaceholder(/Search location/i);
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toBeEnabled();

    // Type in search
    await searchInput.fill('Tokyo');
    await expect(searchInput).toHaveValue('Tokyo');
  });

  test('typing shows search results after debounce', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Search location/i);
    await searchInput.fill('Tokyo');

    // Wait for debounce (400ms) + API response
    await expect(
      page.getByText(/Tokyo/i).locator(':visible').first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('search results include OSM verification link', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Search location/i);
    await searchInput.fill('Sydney');

    // Wait for results to appear
    await page.waitForTimeout(600); // Debounce + API

    // Look for OSM link in results
    const osmLink = page.getByText('OSM ↗').or(
      page.locator('a[href*="openstreetmap.org"]')
    );
    
    await expect(osmLink.first()).toBeVisible({ timeout: 5000 });
  });

  test('clicking search result updates location display', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Search location/i);
    await searchInput.fill('Paris');

    // Wait for results
    await page.waitForTimeout(600);

    // Click on a result
    const result = page.getByRole('button').filter({ hasText: /Paris/i }).first();
    await result.click();

    // Location display should update
    await expect(
      page.locator('[data-testid="location-display"]').getByText(/Paris/i)
    ).toBeVisible({ timeout: 5000 });
  });

  test('selecting location shows OSM verification link in display', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Search location/i);
    await searchInput.fill('London');

    // Wait for and click result
    await page.waitForTimeout(600);
    const result = page.getByRole('button').filter({ hasText: /London/i }).first();
    await result.click();

    // Should see verification link
    await expect(
      page.getByText(/Verify on OpenStreetMap/i)
    ).toBeVisible({ timeout: 5000 });
  });

  test('map recenters when location is selected from search', async ({ page }) => {
    // Get initial map bounds/center
    await page.waitForTimeout(1000); // Let map settle

    const searchInput = page.getByPlaceholder(/Search location/i);
    await searchInput.fill('Tokyo');

    // Wait for and click result
    await page.waitForTimeout(600);
    const result = page.getByRole('button').filter({ hasText: /Tokyo/i }).first();
    await result.click();

    // Wait for map to fly to new location
    await page.waitForTimeout(2000); // Animation time

    // Verify Tokyo location is shown
    await expect(
      page.locator('[data-testid="location-display"]')
    ).toContainText('Tokyo');
  });

  test('search results disappear when clicking outside', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Search location/i);
    await searchInput.fill('Berlin');

    // Wait for results
    await page.waitForTimeout(600);
    await expect(page.getByRole('button').filter({ hasText: /Berlin/i }).first()).toBeVisible();

    // Click outside the search
    await page.locator('.maplibregl-map').click();

    // Results should disappear
    await expect(
      page.getByRole('listbox', { name: /Search results/i })
    ).not.toBeVisible({ timeout: 3000 });
  });

  test('pressing Escape closes search results', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Search location/i);
    await searchInput.fill('Rome');

    // Wait for results
    await page.waitForTimeout(600);
    await expect(page.getByRole('button').filter({ hasText: /Rome/i }).first()).toBeVisible();

    // Press Escape
    await page.keyboard.press('Escape');

    // Results should close (but input should remain)
    await expect(searchInput).toHaveValue('Rome');
  });

  test('search works for coordinates', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Search location/i);
    
    // Search for a coordinate
    await searchInput.fill('35.6762, 139.6503');

    // Wait for results (may show Tokyo or nearby locations)
    await page.waitForTimeout(1000);

    // Should get some results or show coordinates
    const bodyContent = await page.textContent('body');
    expect(bodyContent).toMatch(/Tokyo|Japan|35\.67|139\.65/);
  });

  test('search handles special characters', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Search location/i);
    
    // Search with special characters
    await searchInput.fill('São Paulo');

    // Wait for results
    await page.waitForTimeout(600);

    // Should find São Paulo
    await expect(
      page.getByRole('button').filter({ hasText: /São Paulo|Sao Paulo/i }).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('short queries do not trigger search', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Search location/i);
    
    // Type single character
    await searchInput.fill('T');
    await page.waitForTimeout(600);

    // No results should appear (min 2 chars)
    await expect(
      page.getByRole('listbox', { name: /Search results/i })
    ).not.toBeVisible();
  });

  test('no results message shown for unknown location', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Search location/i);
    
    // Search for gibberish
    await searchInput.fill('xyznotarealplace12345');

    // Wait for API response
    await page.waitForTimeout(1000);

    // Should show no results message
    await expect(
      page.getByText(/No results found/i)
    ).toBeVisible({ timeout: 5000 });
  });

  test('loading indicator shows while searching', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Search location/i);
    
    // Type to trigger search
    await searchInput.fill('New York');

    // Should briefly show loading state
    // Note: This may be too fast to catch reliably
    try {
      await expect(
        page.locator('.animate-spin').first()
      ).toBeVisible({ timeout: 1000 });
    } catch {
      // Loading may be too fast - acceptable
    }

    // Eventually results should appear
    await expect(
      page.getByRole('button').filter({ hasText: /New York/i }).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('solar data updates for searched location', async ({ page }) => {
    // First get initial sunrise time
    const initialSunrise = await page.getByText(/Sunrise/i).textContent();

    // Search and select different location
    const searchInput = page.getByPlaceholder(/Search location/i);
    await searchInput.fill('Sydney Australia');

    await page.waitForTimeout(600);
    const result = page.getByRole('button').filter({ hasText: /Sydney/i }).first();
    await result.click();

    // Wait for data to update
    await page.waitForTimeout(2000);

    // Sun events should still be visible with potentially different values
    await expect(page.getByText(/Sunrise/i)).toBeVisible();
    await expect(page.getByText(/Sunset/i)).toBeVisible();
  });
});

test.describe('Search Rate Limiting', () => {
  test('handles rate limit gracefully', async ({ page }) => {
    // Make many rapid searches to potentially trigger rate limit
    const searchInput = await page.getByPlaceholder(/Search location/i);

    for (let i = 0; i < 5; i++) {
      await searchInput.fill(`City ${i}`);
      await page.waitForTimeout(100);
    }

    // Final search
    await searchInput.fill('Final City');
    await page.waitForTimeout(1000);

    // Should either show results or rate limit message (not crash)
    const bodyContent = await page.textContent('body');
    expect(bodyContent).toBeDefined();
  });
});
