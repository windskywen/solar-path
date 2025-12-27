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
  getCommonTimezones,
  parseDate,
  getDateParts,
} from '@/lib/utils/timezone';

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

describe('getCommonTimezones', () => {
  it('returns array of timezone options', () => {
    const tzs = getCommonTimezones();
    expect(Array.isArray(tzs)).toBe(true);
    expect(tzs.length).toBeGreaterThan(0);
  });

  it('includes browser option', () => {
    const tzs = getCommonTimezones();
    expect(tzs.find((tz) => tz.value === 'browser')).toBeDefined();
  });

  it('includes UTC', () => {
    const tzs = getCommonTimezones();
    expect(tzs.find((tz) => tz.value === 'UTC')).toBeDefined();
  });

  it('has value and label for each option', () => {
    const tzs = getCommonTimezones();
    tzs.forEach((tz) => {
      expect(tz.value).toBeDefined();
      expect(tz.label).toBeDefined();
    });
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
