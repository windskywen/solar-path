/**
 * Timezone Helpers
 *
 * Utilities for working with timezones using Luxon.
 */

import { DateTime, IANAZone } from 'luxon';

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
 * @param timezone - "browser" or IANA timezone string
 * @returns IANA timezone string
 */
export function resolveTimezone(timezone: string): string {
  if (timezone === 'browser') {
    return getBrowserTimezone();
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
  if (timezone === 'browser') return true;
  return IANAZone.isValidZone(timezone);
}

/**
 * Get current date in ISO format for a timezone
 *
 * @param timezone - "browser" or IANA timezone string
 * @returns ISO date string (YYYY-MM-DD)
 */
export function getTodayISO(timezone: string = 'browser'): string {
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
 * Get a list of common timezones for UI dropdown
 */
export function getCommonTimezones(): Array<{ value: string; label: string }> {
  return [
    { value: 'browser', label: 'Browser timezone' },
    { value: 'UTC', label: 'UTC' },
    { value: 'America/New_York', label: 'Eastern Time (US)' },
    { value: 'America/Chicago', label: 'Central Time (US)' },
    { value: 'America/Denver', label: 'Mountain Time (US)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (US)' },
    { value: 'Europe/London', label: 'London' },
    { value: 'Europe/Paris', label: 'Paris' },
    { value: 'Europe/Berlin', label: 'Berlin' },
    { value: 'Asia/Tokyo', label: 'Tokyo' },
    { value: 'Asia/Shanghai', label: 'Shanghai' },
    { value: 'Asia/Taipei', label: 'Taipei' },
    { value: 'Asia/Singapore', label: 'Singapore' },
    { value: 'Australia/Sydney', label: 'Sydney' },
    { value: 'Pacific/Auckland', label: 'Auckland' },
  ];
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
