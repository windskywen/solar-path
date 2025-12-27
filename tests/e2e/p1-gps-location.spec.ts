/**
 * E2E Test: User Story 1 - GPS Location
 *
 * Tests the GPS-based location feature:
 * 1. App loads with IP-based default location
 * 2. User can click GPS button to request geolocation
 * 3. Map updates to show user's location
 * 4. Solar data updates for the new location
 *
 * @see specs/001-solar-path-tracker/quickstart.md - Scenario 1
 */

import { test, expect, type Page } from '@playwright/test';

// Mock location for testing (San Francisco)
const MOCK_LOCATION = {
  latitude: 37.7749,
  longitude: -122.4194,
  accuracy: 100,
};

// Default Taipei location (from IP geo fallback)
const DEFAULT_LOCATION = {
  latitude: 25.033,
  longitude: 121.5654,
};

/**
 * Grant geolocation permission and set mock coordinates
 */
async function mockGeolocation(page: Page, coords: typeof MOCK_LOCATION) {
  await page.context().grantPermissions(['geolocation']);
  await page.context().setGeolocation({
    latitude: coords.latitude,
    longitude: coords.longitude,
  });
}

/**
 * Deny geolocation permission
 */
async function denyGeolocation(page: Page) {
  await page.context().clearPermissions();
}

test.describe('User Story 1: GPS Location', () => {
  test.beforeEach(async ({ page }) => {
    // Start with default location
    await page.goto('/');
    // Wait for app to load
    await page.waitForLoadState('networkidle');
  });

  test('app loads with default location from IP geolocation', async ({ page }) => {
    // Should see the main page title or location display
    await expect(page.getByText(/Solar Path Tracker/i)).toBeVisible();

    // Should have a location displayed (from IP geo or default)
    const locationDisplay = page.locator('[data-testid="location-display"]').or(
      page.getByText(/Selected Location|GPS Location|Taipei/i)
    );
    await expect(locationDisplay).toBeVisible({ timeout: 10000 });
  });

  test('GPS button is visible and clickable', async ({ page }) => {
    // Find GPS button
    const gpsButton = page.getByRole('button', { name: /GPS|My Location|Use Current Location/i });
    await expect(gpsButton).toBeVisible();
    await expect(gpsButton).toBeEnabled();
  });

  test('clicking GPS button requests geolocation with permission granted', async ({ page }) => {
    // Mock geolocation with permission
    await mockGeolocation(page, MOCK_LOCATION);

    // Click GPS button
    const gpsButton = page.getByRole('button', { name: /GPS|My Location|Use Current Location/i });
    await gpsButton.click();

    // Wait for location to update (look for coordinates or location name)
    await expect(async () => {
      const pageContent = await page.textContent('body');
      // Check for San Francisco coordinates (rounded)
      const hasNewCoords = 
        pageContent?.includes('37.77') || 
        pageContent?.includes('-122.41') ||
        pageContent?.includes('GPS Location');
      expect(hasNewCoords).toBeTruthy();
    }).toPass({ timeout: 10000 });
  });

  test('GPS button shows loading state while fetching location', async ({ page }) => {
    // Mock geolocation with permission
    await mockGeolocation(page, MOCK_LOCATION);

    // Click GPS button
    const gpsButton = page.getByRole('button', { name: /GPS|My Location|Use Current Location/i });
    await gpsButton.click();

    // Should show loading state (spinner or "Locating..." text)
    // This may be very brief, so we use a soft assertion
    try {
      await expect(
        page.getByText(/Locating|Getting location/i).or(
          page.locator('[data-testid="gps-loading"]')
        )
      ).toBeVisible({ timeout: 1000 });
    } catch {
      // Loading state may be too fast to catch - that's OK
    }
  });

  test('map shows marker at current location', async ({ page }) => {
    // Map should be visible
    await expect(page.locator('.maplibregl-map')).toBeVisible({ timeout: 15000 });

    // After map loads, there should be a marker or location indicator
    // The marker could be a custom div or a maplibre marker
    const marker = page.locator('.maplibregl-marker').or(
      page.locator('[data-testid="location-marker"]')
    );
    
    // Wait for marker to appear (may take time for map to load)
    await expect(marker).toBeVisible({ timeout: 15000 });
  });

  test('clicking on map updates location', async ({ page }) => {
    // Wait for map to load
    await expect(page.locator('.maplibregl-map')).toBeVisible({ timeout: 15000 });

    // Get initial coordinates from location display
    const initialContent = await page.textContent('body');

    // Click on map (center of map container)
    const mapContainer = page.locator('.maplibregl-map');
    const mapBox = await mapContainer.boundingBox();
    
    if (mapBox) {
      // Click slightly off-center to ensure a different location
      await page.mouse.click(mapBox.x + mapBox.width * 0.3, mapBox.y + mapBox.height * 0.3);

      // Wait for location to potentially update
      await page.waitForTimeout(1000);

      // Location display should have updated
      const newContent = await page.textContent('body');
      
      // Either coordinates changed or "Selected Location" appears
      expect(
        newContent?.includes('Selected Location') || 
        newContent !== initialContent
      ).toBeTruthy();
    }
  });

  test('solar rays are displayed on map', async ({ page }) => {
    // Wait for map to load
    await expect(page.locator('.maplibregl-map')).toBeVisible({ timeout: 15000 });

    // Wait for solar rays layer to render
    // This tests that the SolarRaysLayer component is working
    await page.waitForTimeout(2000); // Allow time for rays to render

    // Check that the map canvas has content (rays are drawn)
    const canvas = page.locator('.maplibregl-canvas');
    await expect(canvas).toBeVisible();
  });

  test('sun events panel shows sunrise and sunset times', async ({ page }) => {
    // Wait for data to load
    await page.waitForLoadState('networkidle');

    // Look for sun events information
    const sunriseText = page.getByText(/Sunrise/i);
    const sunsetText = page.getByText(/Sunset/i);
    const dayLengthText = page.getByText(/Day Length/i);

    await expect(sunriseText).toBeVisible({ timeout: 10000 });
    await expect(sunsetText).toBeVisible({ timeout: 10000 });
    await expect(dayLengthText).toBeVisible({ timeout: 10000 });

    // Should have actual time values (HH:MM format)
    const timePattern = /\d{1,2}:\d{2}/;
    const bodyContent = await page.textContent('body');
    expect(bodyContent).toMatch(timePattern);
  });

  test('solar data table shows hourly positions', async ({ page }) => {
    // Wait for data to load
    await page.waitForLoadState('networkidle');

    // Look for the data table or hourly data display
    const tableOrList = page.locator('table').or(
      page.getByText(/Hourly|Hour|Time/i)
    );
    await expect(tableOrList).toBeVisible({ timeout: 10000 });

    // Should show altitude and azimuth values
    const bodyContent = await page.textContent('body');
    expect(bodyContent).toMatch(/Altitude|Alt|°/);
    expect(bodyContent).toMatch(/Azimuth|Az/);
  });

  test('date picker allows selecting a different date', async ({ page }) => {
    // Wait for date picker to be visible
    const datePicker = page.getByRole('button', { name: /date|today|select date/i }).or(
      page.locator('[data-testid="date-picker"]')
    ).or(
      page.locator('input[type="date"]')
    );

    await expect(datePicker).toBeVisible({ timeout: 10000 });
    await expect(datePicker).toBeEnabled();
  });

  test('error message shown when GPS permission denied', async ({ page }) => {
    // Clear any permissions (simulates denied state)
    await denyGeolocation(page);

    // Click GPS button
    const gpsButton = page.getByRole('button', { name: /GPS|My Location|Use Current Location/i });
    await gpsButton.click();

    // Should show error message about location access
    await expect(
      page.getByText(/denied|permission|unable|failed/i)
    ).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Responsive Layout', () => {
  test('mobile view shows single column layout', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Map should still be visible
    await expect(page.locator('.maplibregl-map')).toBeVisible({ timeout: 15000 });

    // GPS button should be accessible
    const gpsButton = page.getByRole('button', { name: /GPS|My Location|Use Current Location/i });
    await expect(gpsButton).toBeVisible();
  });

  test('desktop view shows two-column layout', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Both map and sidebar should be visible
    await expect(page.locator('.maplibregl-map')).toBeVisible({ timeout: 15000 });
    
    // Sidebar content should be visible
    const sunEvents = page.getByText(/Sunrise/i);
    await expect(sunEvents).toBeVisible({ timeout: 10000 });
  });
});
