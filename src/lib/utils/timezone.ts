/**
 * Timezone Helpers
 *
 * Utilities for working with timezones using Luxon.
 */

import { DateTime, IANAZone } from 'luxon';

/**
 * Common timezone mappings by region
 * Maps approximate longitude ranges to IANA timezone identifiers
 */
const TIMEZONE_REGIONS: Array<{
  minLng: number;
  maxLng: number;
  minLat?: number;
  maxLat?: number;
  timezone: string;
}> = [
  // Asia/Pacific
  { minLng: 120, maxLng: 122, minLat: 21, maxLat: 26, timezone: 'Asia/Taipei' },
  { minLng: 139, maxLng: 146, minLat: 30, maxLat: 46, timezone: 'Asia/Tokyo' },
  { minLng: 126, maxLng: 130, minLat: 33, maxLat: 43, timezone: 'Asia/Seoul' },
  { minLng: 113, maxLng: 135, minLat: 18, maxLat: 54, timezone: 'Asia/Shanghai' },
  { minLng: 100, maxLng: 120, minLat: -11, maxLat: 8, timezone: 'Asia/Singapore' },
  { minLng: 68, maxLng: 97, minLat: 6, maxLat: 36, timezone: 'Asia/Kolkata' },
  { minLng: 44, maxLng: 63, minLat: 12, maxLat: 40, timezone: 'Asia/Dubai' },
  // Europe
  { minLng: -10, maxLng: 2, minLat: 35, maxLat: 60, timezone: 'Europe/London' },
  { minLng: 2, maxLng: 16, minLat: 35, maxLat: 55, timezone: 'Europe/Paris' },
  { minLng: 5, maxLng: 15, minLat: 45, maxLat: 55, timezone: 'Europe/Berlin' },
  { minLng: 19, maxLng: 32, minLat: 35, maxLat: 45, timezone: 'Europe/Athens' },
  { minLng: 30, maxLng: 50, minLat: 50, maxLat: 70, timezone: 'Europe/Moscow' },
  // Americas
  { minLng: -125, maxLng: -115, minLat: 32, maxLat: 49, timezone: 'America/Los_Angeles' },
  { minLng: -115, maxLng: -102, minLat: 31, maxLat: 49, timezone: 'America/Denver' },
  { minLng: -102, maxLng: -87, minLat: 25, maxLat: 49, timezone: 'America/Chicago' },
  { minLng: -87, maxLng: -67, minLat: 24, maxLat: 47, timezone: 'America/New_York' },
  { minLng: -80, maxLng: -35, minLat: -35, maxLat: 5, timezone: 'America/Sao_Paulo' },
  // Australia
  { minLng: 140, maxLng: 154, minLat: -45, maxLat: -10, timezone: 'Australia/Sydney' },
  { minLng: 113, maxLng: 140, minLat: -35, maxLat: -10, timezone: 'Australia/Perth' },
  // New Zealand
  { minLng: 165, maxLng: 179, minLat: -48, maxLat: -34, timezone: 'Pacific/Auckland' },
];

/**
 * Get timezone from geographic coordinates
 * Uses a combination of region matching and UTC offset estimation
 *
 * @param lat - Latitude
 * @param lng - Longitude
 * @returns IANA timezone string
 */
export function getTimezoneFromCoordinates(lat: number, lng: number): string {
  // First, try to match a specific region
  for (const region of TIMEZONE_REGIONS) {
    if (lng >= region.minLng && lng <= region.maxLng) {
      if (region.minLat !== undefined && region.maxLat !== undefined) {
        if (lat >= region.minLat && lat <= region.maxLat) {
          return region.timezone;
        }
      } else {
        return region.timezone;
      }
    }
  }

  // Fallback: estimate UTC offset from longitude
  // Each 15 degrees of longitude = 1 hour offset
  const offsetHours = Math.round(lng / 15);

  // Map to Etc/GMT timezone (note: Etc/GMT signs are inverted)
  if (offsetHours === 0) {
    return 'UTC';
  } else if (offsetHours > 0) {
    return `Etc/GMT-${offsetHours}`;
  } else {
    return `Etc/GMT+${Math.abs(offsetHours)}`;
  }
}

/**
 * Get the browser's IANA timezone
 *
 * @returns IANA timezone string (e.g., "America/New_York")
 */
export function getBrowserTimezone(): string {
  return DateTime.local().zoneName ?? 'UTC';
}

/**
 * Resolve timezone identifier to IANA timezone
 *
 * @param timezone - IANA timezone string (legacy "browser" value maps to UTC)
 * @returns IANA timezone string
 */
export function resolveTimezone(timezone: string): string {
  if (timezone === 'browser') {
    // Legacy support: treat "browser" as UTC
    return 'UTC';
  }
  return timezone;
}

/**
 * Check if a timezone string is valid
 *
 * @param timezone - IANA timezone string to validate
 * @returns True if timezone is valid
 */
export function isValidTimezone(timezone: string): boolean {
  if (timezone === 'browser') return true; // Legacy support
  return IANAZone.isValidZone(timezone);
}

/**
 * Get current date in ISO format for a timezone
 *
 * @param timezone - IANA timezone string (defaults to UTC)
 * @returns ISO date string (YYYY-MM-DD)
 */
export function getTodayISO(timezone: string = 'UTC'): string {
  const zone = resolveTimezone(timezone);
  return DateTime.now().setZone(zone).toISODate() ?? DateTime.now().toISODate()!;
}

/**
 * Format a time for display
 *
 * @param dateISO - Date in ISO format
 * @param hour - Hour of day (0-23)
 * @param timezone - IANA timezone string
 * @param format - Luxon format string
 * @returns Formatted time string
 */
export function formatTime(
  dateISO: string,
  hour: number,
  timezone: string,
  format: string = 'HH:mm'
): string {
  const zone = resolveTimezone(timezone);
  const dt = DateTime.fromISO(`${dateISO}T${hour.toString().padStart(2, '0')}:00:00`, { zone });
  return dt.toFormat(format);
}

/**
 * Format a date for display
 *
 * @param dateISO - Date in ISO format
 * @param timezone - IANA timezone string
 * @param format - Luxon format string
 * @returns Formatted date string
 */
export function formatDate(
  dateISO: string,
  timezone: string,
  format: string = 'MMMM d, yyyy'
): string {
  const zone = resolveTimezone(timezone);
  const dt = DateTime.fromISO(dateISO, { zone });
  return dt.toFormat(format);
}

/**
 * Get timezone offset string (e.g., "UTC-5")
 *
 * @param dateISO - Date in ISO format
 * @param timezone - IANA timezone string
 * @returns Offset string
 */
export function getTimezoneOffset(dateISO: string, timezone: string): string {
  const zone = resolveTimezone(timezone);
  const dt = DateTime.fromISO(dateISO, { zone });
  const offset = dt.offset;
  const hours = Math.floor(Math.abs(offset) / 60);
  const minutes = Math.abs(offset) % 60;
  const sign = offset >= 0 ? '+' : '-';
  const minuteStr = minutes > 0 ? `:${minutes.toString().padStart(2, '0')}` : '';
  return `UTC${sign}${hours}${minuteStr}`;
}

/**
 * Get timezone abbreviation (e.g., "EST", "PST")
 *
 * @param dateISO - Date in ISO format
 * @param timezone - IANA timezone string
 * @returns Timezone abbreviation
 */
export function getTimezoneAbbreviation(dateISO: string, timezone: string): string {
  const zone = resolveTimezone(timezone);
  const dt = DateTime.fromISO(dateISO, { zone });
  return dt.offsetNameShort ?? '';
}

/**
 * Check if a date is in DST for a timezone
 *
 * @param dateISO - Date in ISO format
 * @param timezone - IANA timezone string
 * @returns True if date is in DST
 */
export function isInDST(dateISO: string, timezone: string): boolean {
  const zone = resolveTimezone(timezone);
  const dt = DateTime.fromISO(dateISO, { zone });
  return dt.isInDST;
}

/**
 * Parse date string to DateTime object
 *
 * @param dateISO - Date in ISO format
 * @param timezone - IANA timezone string
 * @returns Luxon DateTime object
 */
export function parseDate(dateISO: string, timezone: string): DateTime {
  const zone = resolveTimezone(timezone);
  return DateTime.fromISO(dateISO, { zone });
}

/**
 * Get date parts for a timezone
 *
 * @param dateISO - Date in ISO format
 * @param timezone - IANA timezone string
 * @returns Object with year, month, day
 */
export function getDateParts(
  dateISO: string,
  timezone: string
): { year: number; month: number; day: number } {
  const dt = parseDate(dateISO, timezone);
  return {
    year: dt.year,
    month: dt.month,
    day: dt.day,
  };
}
