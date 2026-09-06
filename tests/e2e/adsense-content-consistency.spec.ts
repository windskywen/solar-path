import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { computeExtendedSunEvents } from '../../src/lib/solar/extended-events';
import { formatDayLength } from '../../src/lib/solar/events';

for (const width of [390, 1440]) {
  test(`event durations and reference dates remain consistent at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.route('**/api/ip-geo', route => route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({ lat: -27.4698, lng: 153.0251, city: 'Brisbane', country: 'Australia' }),
    }));
    await page.goto('/');
    await expect(page.getByTestId('location-source')).toContainText('Approximate location');
    const date = page.getByRole('textbox', { name: 'Select date', exact: true });
    await date.fill('2026-09-06');
    const events = computeExtendedSunEvents(-27.4698, 153.0251, '2026-09-06', 'Australia/Brisbane');
    await expect(page.getByRole('region', { name: 'Hourly breakdown', exact: true })).toContainText(`Daylight: ${events.dayLengthLabel}`);
    await expect(page.getByTestId('initial-solar-summary')).toContainText(events.dayLengthLabel!);
    await expect(page.getByRole('region', { name: 'Daily solar overview', exact: true })).toContainText(events.dayLengthLabel!);
    await expect(page.getByText('Calculated golden-hour windows: morning 0h 31m; evening 0h 31m.', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'December reference', exact: true }).click();
    await expect(date).toHaveValue(`${new Date().getUTCFullYear()}-12-21`);
    const referenceEvents = computeExtendedSunEvents(-27.4698, 153.0251, `${new Date().getUTCFullYear()}-12-21`, 'Australia/Brisbane');
    await expect(page.getByRole('region', { name: 'Hourly breakdown', exact: true })).toContainText(`Daylight: ${referenceEvents.dayLengthLabel}`);
    await expect(page.getByText(/These are fixed seasonal reference dates/)).toBeVisible();

    await page.goto('/golden-hour-calculator');
    await page.getByRole('textbox', { name: 'Date', exact: true }).fill('2026-09-06');
    const result = page.getByRole('region', { name: 'Brisbane, Queensland, Australia', exact: true });
    await expect(result).toContainText('2026-09-06 · Australia/Brisbane');
    await expect(result).toContainText(`${events.morningGoldenHour.start!.localTime}–${events.morningGoldenHour.end!.localTime}`);
    expect(formatDayLength(events.morningGoldenHour.durationMinutes! / 60)).toBe('0h 31m');
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download calculator CSV', exact: true }).click();
    const download = await downloadPromise;
    const csv = await readFile((await download.path())!, 'utf8');
    expect(csv).toContain('2026-09-06');
    expect(csv).toContain('Australia/Brisbane');
    expect(csv).not.toContain('durationMinutes');
    await page.getByRole('textbox', { name: 'Date', exact: true }).fill('2026-06-21');
    await expect(result).toContainText('2026-06-21 · Australia/Brisbane');
    await expect(result).toContainText('06:38–07:13');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test('published content and sitemap show matching dates and consistent front-light advice', async ({ page, request }) => {
  const sitemap = await (await request.get('/sitemap.xml')).text();
  for (const [path, date] of Object.entries({ '/about': '2026-09-06', '/methodology': '2026-09-07', '/privacy': '2026-09-05' })) {
    await page.goto(path);
    await expect(page.locator('time')).toHaveAttribute('datetime', date);
    expect(sitemap).toMatch(new RegExp(`${path}</loc>\\s*<lastmod>${date}T00:00:00.000Z</lastmod>`));
  }
  await page.goto('/guides/golden-hour-direction-brisbane');
  await expect(page.getByText(/For front light, place the photographer on the Sun-facing side/)).toBeVisible();
  await expect(page.getByText(/place the photographer generally opposite the Sun/)).toHaveCount(0);
  await expect(page.getByText('Summer reference', { exact: false }).first()).toBeVisible();
});
