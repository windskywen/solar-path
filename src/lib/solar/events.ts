/**
 * Sun Events Computation
 *
 * Computes sunrise, sunset, and day length using suncalc.
 */

import SunCalc from 'suncalc';
import { DateTime } from 'luxon';
import type { SunEvents } from '@/types/solar';
import { resolveTimezone } from '@/lib/utils/timezone';

/**
 * Format duration in hours to human-readable string
 *
 * @param hours - Duration in hours
 * @returns Formatted string like "10h 32m"
 */
export function formatDayLength(hours: number): string {
  if (hours <= 0) return '0h 0m';
  if (hours >= 24) return '24h 0m';

  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);

  // Handle case where rounding gives 60 minutes
  if (m === 60) {
    return `${h + 1}h 0m`;
  }

  return `${h}h ${m}m`;
}

/**
 * Compute sun events (sunrise, sunset, day length) for a location and date
 *
 * @param lat - Latitude in decimal degrees
 * @param lng - Longitude in decimal degrees
 * @param dateISO - Date in ISO format (YYYY-MM-DD)
 * @param timezone - IANA timezone string
 * @returns SunEvents object
 */
export function computeSunEvents(
  lat: number,
  lng: number,
  dateISO: string,
  timezone: string
): SunEvents {
  const zone = resolveTimezone(timezone);

  // Create date at noon in the specified timezone to get accurate times for that day
  const dt = DateTime.fromISO(`${dateISO}T12:00:00`, { zone });
  const jsDate = dt.toJSDate();

  // Get sun times from suncalc
  const times = SunCalc.getTimes(jsDate, lat, lng);

  // Check for polar conditions
  const sunriseValid = times.sunrise && !isNaN(times.sunrise.getTime());
  const sunsetValid = times.sunset && !isNaN(times.sunset.getTime());

  // Handle polar day (midnight sun)
  if (!sunriseValid && !sunsetValid) {
    // Check if sun is always above or below horizon
    const noonPosition = SunCalc.getPosition(jsDate, lat, lng);
    const noonAltitude = noonPosition.altitude * (180 / Math.PI);

    if (noonAltitude > 0) {
      // Polar day - sun never sets
      return {
        sunriseLocal: undefined,
        sunsetLocal: undefined,
        dayLengthLabel: '24h 0m',
        dayLengthHours: 24,
        note: 'Midnight sun - sun does not set',
      };
    } else {
      // Polar night - sun never rises
      return {
        sunriseLocal: undefined,
        sunsetLocal: undefined,
        dayLengthLabel: '0h 0m',
        dayLengthHours: 0,
        note: 'Polar night - sun does not rise',
      };
    }
  }

  // Handle case where only one is valid (edge case near polar regions)
  if (!sunriseValid || !sunsetValid) {
    // This can happen during transition days
    const validTime = sunriseValid ? times.sunrise : times.sunset;
    const label = sunriseValid ? 'sunrise' : 'sunset';
    const formattedTime = DateTime.fromJSDate(validTime!, { zone }).toFormat('HH:mm');

    return {
      sunriseLocal: sunriseValid ? formattedTime : undefined,
      sunsetLocal: sunsetValid ? formattedTime : undefined,
      dayLengthLabel: sunriseValid ? '24h 0m' : '0h 0m',
      dayLengthHours: sunriseValid ? 24 : 0,
      note: `Only ${label} occurs today`,
    };
  }

  // Normal day with both sunrise and sunset
  const sunriseDT = DateTime.fromJSDate(times.sunrise, { zone });
  const sunsetDT = DateTime.fromJSDate(times.sunset, { zone });

  // Calculate day length
  const dayLengthMs = times.sunset.getTime() - times.sunrise.getTime();
  const dayLengthHours = dayLengthMs / (1000 * 60 * 60);

  return {
    sunriseLocal: sunriseDT.toFormat('HH:mm'),
    sunsetLocal: sunsetDT.toFormat('HH:mm'),
    dayLengthLabel: formatDayLength(dayLengthHours),
    dayLengthHours: Math.round(dayLengthHours * 100) / 100,
    note: undefined,
  };
}

/**
 * Check if a date/location has polar day (24h sun)
 */
export function isPolarDay(lat: number, lng: number, dateISO: string): boolean {
  const events = computeSunEvents(lat, lng, dateISO, 'UTC');
  return events.dayLengthHours === 24;
}

/**
 * Check if a date/location has polar night (0h sun)
 */
export function isPolarNight(lat: number, lng: number, dateISO: string): boolean {
  const events = computeSunEvents(lat, lng, dateISO, 'UTC');
  return events.dayLengthHours === 0;
}
