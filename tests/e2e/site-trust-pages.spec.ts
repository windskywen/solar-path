import { expect, test } from '@playwright/test';

test.describe('Site trust and content surfaces', () => {
  test('homepage exposes footer links and educational content', async ({ page }) => {
    await page.goto('/');

    const howItWorks = page.getByRole('region', { name: /How it works/i }).first();

    await expect(page.getByRole('link', { name: 'Privacy Policy' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Terms' })).toBeVisible();
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
    await expect(advertisingRegion).toContainText(
      /Third-party vendors, including Google, may use cookies or similar identifiers/i
    );
    await expect(advertisingRegion).toContainText(/prior visits to this website or other websites/i);
    await expect(advertisingRegion).toContainText(/Google-certified ad networks/i);
    await expect(advertisingRegion).toContainText(/DoubleClick cookie/i);
    await expect(advertisingRegion.getByRole('link', { name: 'Google Ads Settings' })).toBeVisible();
    await expect(
      advertisingRegion.getByRole('link', { name: /certified third-party vendors/i })
    ).toBeVisible();
    await expect(advertisingRegion.getByRole('link', { name: /AboutAds/i })).toBeVisible();
    await expect(
      page.getByRole('heading', {
        name: /Search Location, Geolocation, and coordinate processing/i,
      })
    ).toBeVisible();
  });

  test('about page provides mission and contact information', async ({ page }) => {
    await page.goto('/about');

    await expect(page.getByRole('heading', { name: /About Solar Path Tracker/i })).toBeVisible();
    await expect(page.getByText(/solarpathtracker@gmail.com/i).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: /Typical use cases/i })).toBeVisible();
  });

  test('terms page discloses TomTom search licensing', async ({ page }) => {
    await page.goto('/terms');

    await expect(page.getByRole('heading', { name: /Terms of Use/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Licensed address and place results/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /TomTom Maps API terms/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /TomTom Third Party Product Terms/i })).toBeVisible();
  });
});
