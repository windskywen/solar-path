import { describe, it, expect } from 'vitest';
import {
  getBrowserTimezone,
  resolveTimezone,
  isValidTimezone,
  getTodayISO,
  formatTime,
  formatDate,
  getTimezoneOffset,
  getTimezoneAbbreviation,
  isInDST,
  parseDate,
  getDateParts,
  getTimezoneFromCoordinates,
} from '@/lib/utils/timezone';

describe('getTimezoneFromCoordinates', () => {
  it('returns correct timezone for New York City', () => {
    // NYC: 40.7128° N, 74.0060° W
    const tz = getTimezoneFromCoordinates(40.7128, -74.006);
    expect(tz).toBe('America/New_York');
  });

  it('returns correct timezone for Los Angeles', () => {
    // LA: 34.0522° N, 118.2437° W
    const tz = getTimezoneFromCoordinates(34.0522, -118.2437);
    expect(tz).toBe('America/Los_Angeles');
  });

  it('returns correct timezone for London', () => {
    // London: 51.5074° N, 0.1278° W
    const tz = getTimezoneFromCoordinates(51.5074, -0.1278);
    expect(tz).toBe('Europe/London');
  });

  it('returns correct timezone for Tokyo', () => {
    // Tokyo: 35.6762° N, 139.6503° E
    const tz = getTimezoneFromCoordinates(35.6762, 139.6503);
    expect(tz).toBe('Asia/Tokyo');
  });

  it('returns correct timezone for Sydney', () => {
    // Sydney: 33.8688° S, 151.2093° E
    const tz = getTimezoneFromCoordinates(-33.8688, 151.2093);
    expect(tz).toBe('Australia/Sydney');
  });

  it('returns correct timezone for Taipei', () => {
    // Taipei: 25.0330° N, 121.5654° E
    const tz = getTimezoneFromCoordinates(25.033, 121.5654);
    expect(tz).toBe('Asia/Taipei');
  });

  it('returns correct timezone for Paris', () => {
    // Paris: 48.8566° N, 2.3522° E
    const tz = getTimezoneFromCoordinates(48.8566, 2.3522);
    expect(tz).toBe('Europe/Paris');
  });

  it('returns correct timezone for Berlin', () => {
    // Berlin: 52.5200° N, 13.4050° E
    const tz = getTimezoneFromCoordinates(52.52, 13.405);
    expect(tz).toBe('Europe/Berlin');
  });

  it('returns correct timezone for Singapore', () => {
    // Singapore: 1.3521° N, 103.8198° E
    const tz = getTimezoneFromCoordinates(1.3521, 103.8198);
    expect(tz).toBe('Asia/Singapore');
  });

  it('returns correct timezone for Dubai', () => {
    // Dubai: 25.2048° N, 55.2708° E
    const tz = getTimezoneFromCoordinates(25.2048, 55.2708);
    expect(tz).toBe('Asia/Dubai');
  });

  it('handles edge case near timezone boundaries (Spain uses CET despite longitude)', () => {
    // Madrid: 40.4168° N, 3.7038° W - Spain uses CET despite being at similar longitude to UK
    const tz = getTimezoneFromCoordinates(40.4168, -3.7038);
    expect(tz).toBe('Europe/Madrid');
  });

  it('handles China timezone zones correctly', () => {
    // Shanghai: 31.2304° N, 121.4737° E
    const tzShanghai = getTimezoneFromCoordinates(31.2304, 121.4737);
    expect(tzShanghai).toBe('Asia/Shanghai');

    // Urumqi: 43.8256° N, 87.6168° E - geo-tz returns the geographically accurate timezone
    // Note: While China officially uses Beijing Time nationwide, geo-tz returns Asia/Urumqi
    // for the Xinjiang region, which is the geographically appropriate IANA timezone
    const tzUrumqi = getTimezoneFromCoordinates(43.8256, 87.6168);
    expect(tzUrumqi).toBe('Asia/Urumqi');
  });

  it('returns valid timezone for locations in international waters', () => {
    // Middle of Pacific Ocean - should fallback to UTC offset estimation
    const tz = getTimezoneFromCoordinates(0, -150);
    expect(tz).toBeDefined();
    expect(typeof tz).toBe('string');
  });
});

describe('getBrowserTimezone', () => {
  it('returns a non-empty string', () => {
    const tz = getBrowserTimezone();
    expect(tz).toBeDefined();
    expect(typeof tz).toBe('string');
    expect(tz.length).toBeGreaterThan(0);
  });
});

describe('resolveTimezone', () => {
  it('returns browser timezone for "browser"', () => {
    const tz = resolveTimezone('browser');
    expect(tz).not.toBe('browser');
    expect(tz.length).toBeGreaterThan(0);
  });

  it('returns the input for IANA timezone', () => {
    expect(resolveTimezone('America/New_York')).toBe('America/New_York');
    expect(resolveTimezone('UTC')).toBe('UTC');
  });
});

describe('isValidTimezone', () => {
  it('accepts "browser"', () => {
    expect(isValidTimezone('browser')).toBe(true);
  });

  it('accepts valid IANA timezones', () => {
    expect(isValidTimezone('America/New_York')).toBe(true);
    expect(isValidTimezone('Europe/London')).toBe(true);
    expect(isValidTimezone('Asia/Tokyo')).toBe(true);
    expect(isValidTimezone('UTC')).toBe(true);
  });

  it('rejects invalid timezones', () => {
    expect(isValidTimezone('Invalid/Timezone')).toBe(false);
    expect(isValidTimezone('not-a-timezone')).toBe(false);
    expect(isValidTimezone('')).toBe(false);
  });
});

describe('getTodayISO', () => {
  it('returns ISO date format', () => {
    const today = getTodayISO();
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('respects timezone', () => {
    // This test may not always show a difference depending on the time
    const utc = getTodayISO('UTC');
    expect(utc).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('formatTime', () => {
  it('formats time in HH:mm by default', () => {
    const time = formatTime('2024-06-21', 14, 'America/New_York');
    expect(time).toBe('14:00');
  });

  it('handles custom format', () => {
    const time = formatTime('2024-06-21', 14, 'America/New_York', 'h:mm a');
    expect(time).toBe('2:00 PM');
  });

  it('handles midnight', () => {
    const time = formatTime('2024-06-21', 0, 'UTC');
    expect(time).toBe('00:00');
  });

  it('handles hour 23', () => {
    const time = formatTime('2024-06-21', 23, 'UTC');
    expect(time).toBe('23:00');
  });
});

describe('formatDate', () => {
  it('formats date with default format', () => {
    const date = formatDate('2024-06-21', 'UTC');
    expect(date).toBe('June 21, 2024');
  });

  it('handles custom format', () => {
    const date = formatDate('2024-06-21', 'UTC', 'yyyy-MM-dd');
    expect(date).toBe('2024-06-21');
  });
});

describe('getTimezoneOffset', () => {
  it('returns UTC offset string for UTC', () => {
    const offset = getTimezoneOffset('2024-06-21', 'UTC');
    expect(offset).toBe('UTC+0');
  });

  it('returns correct offset for Eastern Time in summer (EDT)', () => {
    const offset = getTimezoneOffset('2024-06-21', 'America/New_York');
    expect(offset).toBe('UTC-4'); // EDT
  });

  it('returns correct offset for Eastern Time in winter (EST)', () => {
    const offset = getTimezoneOffset('2024-01-15', 'America/New_York');
    expect(offset).toBe('UTC-5'); // EST
  });

  it('handles timezones with 30-minute offsets', () => {
    const offset = getTimezoneOffset('2024-06-21', 'Asia/Kolkata');
    expect(offset).toBe('UTC+5:30');
  });
});

describe('getTimezoneAbbreviation', () => {
  it('returns abbreviation for common timezones', () => {
    const abbr = getTimezoneAbbreviation('2024-01-15', 'America/New_York');
    expect(abbr).toBe('EST');
  });

  it('returns different abbreviation for DST', () => {
    const winter = getTimezoneAbbreviation('2024-01-15', 'America/New_York');
    const summer = getTimezoneAbbreviation('2024-06-21', 'America/New_York');
    expect(winter).toBe('EST');
    expect(summer).toBe('EDT');
  });
});

describe('isInDST', () => {
  it('returns true for summer in DST-observing timezone', () => {
    expect(isInDST('2024-06-21', 'America/New_York')).toBe(true);
  });

  it('returns false for winter in DST-observing timezone', () => {
    expect(isInDST('2024-01-15', 'America/New_York')).toBe(false);
  });

  it('returns false for non-DST timezones', () => {
    expect(isInDST('2024-06-21', 'UTC')).toBe(false);
    expect(isInDST('2024-06-21', 'Asia/Tokyo')).toBe(false);
  });
});

describe('parseDate', () => {
  it('returns DateTime object', () => {
    const dt = parseDate('2024-06-21', 'UTC');
    expect(dt.isValid).toBe(true);
  });

  it('respects timezone', () => {
    const dt = parseDate('2024-06-21', 'America/New_York');
    expect(dt.zoneName).toBe('America/New_York');
  });
});

describe('getDateParts', () => {
  it('returns correct parts', () => {
    const parts = getDateParts('2024-06-21', 'UTC');
    expect(parts.year).toBe(2024);
    expect(parts.month).toBe(6);
    expect(parts.day).toBe(21);
  });

  it('handles different dates', () => {
    const parts = getDateParts('2024-12-31', 'UTC');
    expect(parts.year).toBe(2024);
    expect(parts.month).toBe(12);
    expect(parts.day).toBe(31);
  });
});
