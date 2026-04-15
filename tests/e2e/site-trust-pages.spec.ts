import { expect, test } from '@playwright/test';

test.describe('Site trust and content surfaces', () => {
  test('homepage exposes footer links and educational content', async ({ page }) => {
    await page.goto('/');

    const howItWorks = page.getByRole('region', { name: /How it works/i }).first();

    await expect(page.getByRole('link', { name: 'Privacy Policy' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Contact Us' })).toBeVisible();
    await expect(page.getByRole('heading', { name: /How it works/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Use cases/i })).toBeVisible();
    await expect(howItWorks).toContainText(/Azimuth/i);
    await expect(howItWorks).toContainText(/Altitude/i);
    await expect(page.getByLabel('Advertisement')).toHaveCount(0);
  });

  test('privacy page discloses ads and location handling', async ({ page }) => {
    await page.goto('/privacy');

    const advertisingRegion = page.getByRole('region', {
      name: /Google AdSense, cookies, and ad personalization/i,
    });

    await expect(page.getByRole('heading', { name: /Privacy Policy/i })).toBeVisible();
    await expect(advertisingRegion).toBeVisible();
    await expect(advertisingRegion).toContainText(/DoubleClick cookie/i);
    await expect(advertisingRegion.getByRole('link', { name: 'Google Ads Settings' })).toBeVisible();
    await expect(
      page.getByRole('heading', {
        name: /Search Location, Geolocation, and coordinate processing/i,
      })
    ).toBeVisible();
  });

  test('about page provides mission and contact information', async ({ page }) => {
    await page.goto('/about');

    await expect(page.getByRole('heading', { name: /About Solar Path Tracker/i })).toBeVisible();
    await expect(page.getByText(/solarpathtracker@gmail.com/i)).toBeVisible();
    await expect(page.getByRole('heading', { name: /Typical use cases/i })).toBeVisible();
  });
});
