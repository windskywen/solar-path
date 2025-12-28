/**
 * Hourly Solar Position Computation
 *
 * Uses suncalc to compute sun position for each hour of the day.
 */

import SunCalc from 'suncalc';
import { DateTime } from 'luxon';
import { normalizeAzimuth, normalizeAltitude } from './normalize';
import type { HourlySolarPosition, DaylightState } from '@/types/solar';
import { resolveTimezone } from '@/lib/utils/timezone';

/**
 * Derive daylight state from altitude
 *
 * @param altitudeDeg - Altitude in degrees
 * @returns DaylightState classification
 */
export function getDaylightState(altitudeDeg: number): DaylightState {
  if (altitudeDeg < 0) {
    return 'night';
  }
  if (altitudeDeg < 6) {
    return 'golden';
  }
  return 'day';
}

/**
 * Compute sun position for a specific date/time and location
 *
 * @param date - JavaScript Date object
 * @param lat - Latitude in decimal degrees
 * @param lng - Longitude in decimal degrees
 * @returns Sun position with normalized azimuth and altitude
 */
export function computeSunPosition(
  date: Date,
  lat: number,
  lng: number
): { azimuthDeg: number; altitudeDeg: number } {
  const position = SunCalc.getPosition(date, lat, lng);
  return {
    azimuthDeg: normalizeAzimuth(position.azimuth),
    altitudeDeg: normalizeAltitude(position.altitude),
  };
}

/**
 * Compute hourly solar positions for a full day
 *
 * @param lat - Latitude in decimal degrees
 * @param lng - Longitude in decimal degrees
 * @param dateISO - Date in ISO format (YYYY-MM-DD)
 * @param timezone - IANA timezone string
 * @returns Array of 24 HourlySolarPosition objects
 */
export function computeHourlyPositions(
  lat: number,
  lng: number,
  dateISO: string,
  timezone: string
): HourlySolarPosition[] {
  const positions: HourlySolarPosition[] = [];

  // Determine the actual timezone to use
  const zone = resolveTimezone(timezone);

  for (let hour = 0; hour < 24; hour++) {
    // Create DateTime in the specified timezone
    const dt = DateTime.fromISO(`${dateISO}T${hour.toString().padStart(2, '0')}:00:00`, {
      zone,
    });

    // Convert to JavaScript Date for suncalc
    const jsDate = dt.toJSDate();

    // Compute sun position
    const { azimuthDeg, altitudeDeg } = computeSunPosition(jsDate, lat, lng);

    // Derive daylight state
    const daylightState = getDaylightState(altitudeDeg);

    positions.push({
      hour,
      localTimeLabel: dt.toFormat('HH:mm'),
      azimuthDeg,
      altitudeDeg,
      daylightState,
    });
  }

  return positions;
}

/**
 * Compute sun position for a specific hour
 *
 * @param lat - Latitude in decimal degrees
 * @param lng - Longitude in decimal degrees
 * @param dateISO - Date in ISO format (YYYY-MM-DD)
 * @param hour - Hour of day (0-23)
 * @param timezone - IANA timezone string or "browser" for local
 * @returns HourlySolarPosition for the specified hour
 */
export function computePositionForHour(
  lat: number,
  lng: number,
  dateISO: string,
  hour: number,
  timezone: string
): HourlySolarPosition {
  const zone = timezone === 'browser' ? DateTime.local().zoneName : timezone;

  const dt = DateTime.fromISO(`${dateISO}T${hour.toString().padStart(2, '0')}:00:00`, {
    zone,
  });

  const jsDate = dt.toJSDate();
  const { azimuthDeg, altitudeDeg } = computeSunPosition(jsDate, lat, lng);
  const daylightState = getDaylightState(altitudeDeg);

  return {
    hour,
    localTimeLabel: dt.toFormat('HH:mm'),
    azimuthDeg,
    altitudeDeg,
    daylightState,
  };
}
