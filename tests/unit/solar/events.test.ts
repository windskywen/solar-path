import { describe, it, expect } from 'vitest';
import {
  formatDayLength,
  computeSunEvents,
  isPolarDay,
  isPolarNight,
} from '@/lib/solar/events';

describe('formatDayLength', () => {
  it('formats whole hours', () => {
    expect(formatDayLength(10)).toBe('10h 0m');
    expect(formatDayLength(24)).toBe('24h 0m');
    expect(formatDayLength(0)).toBe('0h 0m');
  });

  it('formats hours with minutes', () => {
    expect(formatDayLength(10.5)).toBe('10h 30m');
    expect(formatDayLength(10.25)).toBe('10h 15m');
    expect(formatDayLength(10.75)).toBe('10h 45m');
  });

  it('handles edge cases', () => {
    expect(formatDayLength(-1)).toBe('0h 0m');
    expect(formatDayLength(25)).toBe('24h 0m');
  });

  it('handles near-hour values', () => {
    // 10.99 hours = 10h 59.4m, rounds to 10h 59m
    expect(formatDayLength(10.99)).toBe('10h 59m');
    // 10.9917 hours = 10h 59.5m, rounds to 11h 0m
    expect(formatDayLength(10.9917)).toBe('11h 0m');
  });
});

describe('computeSunEvents', () => {
  describe('normal day (NYC summer)', () => {
    it('returns valid sunrise and sunset times', () => {
      const events = computeSunEvents(40.7128, -74.006, '2024-06-21', 'America/New_York');

      expect(events.sunriseLocal).toBeDefined();
      expect(events.sunsetLocal).toBeDefined();
      expect(events.dayLengthLabel).toBeDefined();
      expect(events.dayLengthHours).toBeGreaterThan(0);
      expect(events.note).toBeUndefined();
    });

    it('has reasonable sunrise time for summer', () => {
      const events = computeSunEvents(40.7128, -74.006, '2024-06-21', 'America/New_York');

      // Summer sunrise in NYC should be around 5:25 AM
      const [hour] = events.sunriseLocal!.split(':').map(Number);
      expect(hour).toBeGreaterThanOrEqual(5);
      expect(hour).toBeLessThanOrEqual(6);
    });

    it('has reasonable sunset time for summer', () => {
      const events = computeSunEvents(40.7128, -74.006, '2024-06-21', 'America/New_York');

      // Summer sunset in NYC should be around 8:30 PM
      const [hour] = events.sunsetLocal!.split(':').map(Number);
      expect(hour).toBeGreaterThanOrEqual(20);
      expect(hour).toBeLessThanOrEqual(21);
    });

    it('has longer day in summer than winter', () => {
      const summer = computeSunEvents(40.7128, -74.006, '2024-06-21', 'America/New_York');
      const winter = computeSunEvents(40.7128, -74.006, '2024-12-21', 'America/New_York');

      expect(summer.dayLengthHours).toBeGreaterThan(winter.dayLengthHours!);
    });
  });

  describe('polar regions', () => {
    it('handles polar day (midnight sun) in Svalbard summer', () => {
      // Svalbard (78°N) during summer solstice
      const events = computeSunEvents(78.22, 15.63, '2024-06-21', 'Arctic/Longyearbyen');

      expect(events.sunriseLocal).toBeUndefined();
      expect(events.sunsetLocal).toBeUndefined();
      expect(events.dayLengthHours).toBe(24);
      expect(events.note).toContain('sun');
    });

    it('handles polar night in Svalbard winter', () => {
      // Svalbard (78°N) during winter solstice
      const events = computeSunEvents(78.22, 15.63, '2024-12-21', 'Arctic/Longyearbyen');

      expect(events.sunriseLocal).toBeUndefined();
      expect(events.sunsetLocal).toBeUndefined();
      expect(events.dayLengthHours).toBe(0);
      expect(events.note).toContain('sun');
    });

    it('handles Antarctic polar day', () => {
      // Antarctic (85°S) during December (southern summer)
      const events = computeSunEvents(-85, 0, '2024-12-21', 'UTC');

      expect(events.dayLengthHours).toBe(24);
    });

    it('handles Antarctic polar night', () => {
      // Antarctic (85°S) during June (southern winter)
      const events = computeSunEvents(-85, 0, '2024-06-21', 'UTC');

      expect(events.dayLengthHours).toBe(0);
    });
  });

  describe('equator', () => {
    it('has roughly 12h daylight year-round at equator', () => {
      const march = computeSunEvents(0, 0, '2024-03-20', 'UTC');
      const june = computeSunEvents(0, 0, '2024-06-21', 'UTC');
      const december = computeSunEvents(0, 0, '2024-12-21', 'UTC');

      // All should be close to 12 hours (within 30 minutes)
      expect(march.dayLengthHours).toBeGreaterThan(11.5);
      expect(march.dayLengthHours).toBeLessThan(12.5);

      expect(june.dayLengthHours).toBeGreaterThan(11.5);
      expect(june.dayLengthHours).toBeLessThan(12.5);

      expect(december.dayLengthHours).toBeGreaterThan(11.5);
      expect(december.dayLengthHours).toBeLessThan(12.5);
    });
  });

  describe('timezone handling', () => {
    it('handles "browser" timezone', () => {
      const events = computeSunEvents(40.7128, -74.006, '2024-06-21', 'browser');
      expect(events.sunriseLocal).toBeDefined();
      expect(events.sunsetLocal).toBeDefined();
    });

    it('returns times in specified timezone', () => {
      // Same location, different timezone display
      const nyTime = computeSunEvents(40.7128, -74.006, '2024-06-21', 'America/New_York');
      const utcTime = computeSunEvents(40.7128, -74.006, '2024-06-21', 'UTC');

      // Sunrise in UTC should be 4 hours ahead of NYC
      const [nyHour] = nyTime.sunriseLocal!.split(':').map(Number);
      const [utcHour] = utcTime.sunriseLocal!.split(':').map(Number);

      // UTC should be ahead by roughly 4-5 hours
      expect((utcHour - nyHour + 24) % 24).toBeGreaterThanOrEqual(4);
      expect((utcHour - nyHour + 24) % 24).toBeLessThanOrEqual(5);
    });
  });
});

describe('isPolarDay', () => {
  it('returns true for Svalbard in summer', () => {
    expect(isPolarDay(78.22, 15.63, '2024-06-21')).toBe(true);
  });

  it('returns false for NYC in summer', () => {
    expect(isPolarDay(40.7128, -74.006, '2024-06-21')).toBe(false);
  });
});

describe('isPolarNight', () => {
  it('returns true for Svalbard in winter', () => {
    expect(isPolarNight(78.22, 15.63, '2024-12-21')).toBe(true);
  });

  it('returns false for NYC in winter', () => {
    expect(isPolarNight(40.7128, -74.006, '2024-12-21')).toBe(false);
  });
});
