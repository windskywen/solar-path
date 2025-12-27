/**
 * Deterministic Solar Insights
 *
 * Rule-based insight generation based on latitude, hourly positions, and sun events.
 * No AI/ML - purely deterministic rules as specified in data-model.md.
 */

import type { HourlySolarPosition, SunEvents, SolarInsights } from '@/types/solar';

/**
 * Check if all hourly positions have sun above horizon (polar day)
 */
function isPolarDay(hourly: HourlySolarPosition[]): boolean {
  return hourly.every((h) => h.altitudeDeg > 0);
}

/**
 * Check if all hourly positions have sun below horizon (polar night)
 */
function isPolarNight(hourly: HourlySolarPosition[]): boolean {
  return hourly.every((h) => h.altitudeDeg < 0);
}

/**
 * Get the peak altitude for the day
 */
function getPeakAltitude(hourly: HourlySolarPosition[]): number {
  return Math.max(...hourly.map((h) => h.altitudeDeg));
}

/**
 * Generate deterministic insights based on solar data
 *
 * Rules from data-model.md:
 * 1. Polar day: all hourly positions above horizon
 * 2. Polar night: all hourly positions below horizon
 * 3. High latitude winter: |lat| >= 55 && dayLengthHours < 8
 * 4. Near equator: |lat| <= 10
 * 5. Long summer day: |lat| >= 45 && dayLengthHours > 15
 *
 * @param lat - Latitude in decimal degrees
 * @param hourly - Array of 24 hourly solar positions
 * @param events - Sun events (sunrise, sunset, day length)
 * @returns SolarInsights with array of insight messages
 */
export function generateInsights(
  lat: number,
  hourly: HourlySolarPosition[],
  events: SunEvents
): SolarInsights {
  const messages: string[] = [];
  const absLat = Math.abs(lat);
  const dayLengthHours = events.dayLengthHours ?? 12;
  const peakAltitude = getPeakAltitude(hourly);

  // Rule 1: Polar day (midnight sun)
  if (isPolarDay(hourly)) {
    messages.push('Midnight sun: the Sun stays above the horizon all day.');
  }

  // Rule 2: Polar night
  if (isPolarNight(hourly)) {
    messages.push('Polar night: the Sun stays below the horizon all day.');
  }

  // Rule 3: High latitude winter
  if (absLat >= 55 && dayLengthHours < 8 && !isPolarNight(hourly)) {
    messages.push(
      'Short daylight window and low solar elevation typical of high-latitude winter.'
    );
  }

  // Rule 4: Near equator
  if (absLat <= 10) {
    messages.push(
      'Near-equatorial location: expect high peak solar altitude with minimal seasonal variation.'
    );
  }

  // Rule 5: Long summer day
  if (absLat >= 45 && dayLengthHours > 15 && !isPolarDay(hourly)) {
    messages.push('Extended daylight typical of mid-to-high latitude summer.');
  }

  // Additional helpful insights

  // Low peak altitude warning
  if (peakAltitude < 30 && peakAltitude > 0) {
    messages.push(
      `Low maximum solar altitude (${peakAltitude.toFixed(1)}°) — expect longer shadows and reduced solar intensity.`
    );
  }

  // High peak altitude note
  if (peakAltitude > 80) {
    messages.push(
      `Very high maximum solar altitude (${peakAltitude.toFixed(1)}°) — sun will be nearly overhead at midday.`
    );
  }

  // Golden hour duration estimate
  const goldenHours = hourly.filter((h) => h.daylightState === 'golden').length;
  if (goldenHours > 0 && !isPolarDay(hourly) && !isPolarNight(hourly)) {
    messages.push(
      `Approximately ${goldenHours} hour${goldenHours > 1 ? 's' : ''} of golden hour conditions today.`
    );
  }

  return { messages };
}

/**
 * Get a single summary insight (for compact display)
 */
export function getSummaryInsight(
  lat: number,
  hourly: HourlySolarPosition[],
  events: SunEvents
): string {
  const insights = generateInsights(lat, hourly, events);
  return insights.messages[0] ?? 'Normal daylight conditions.';
}
