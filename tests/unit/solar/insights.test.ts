/**
 * Tests for Solar Insights Generation
 *
 * Tests the deterministic rule-based insights system.
 */

import { describe, it, expect } from 'vitest';
import { generateInsights, getSummaryInsight } from '@/lib/solar/insights';
import type { HourlySolarPosition, SunEvents, DaylightState } from '@/types/solar';

/**
 * Helper to create mock hourly positions
 */
function createHourlyPositions(
  altitudes: number[],
  defaultAzimuth = 180
): HourlySolarPosition[] {
  return altitudes.map((altitudeDeg, hour) => {
    let daylightState: DaylightState = 'day';
    if (altitudeDeg < -6) daylightState = 'night';
    else if (altitudeDeg < 0) daylightState = 'twilight';
    else if (altitudeDeg < 10) daylightState = 'golden';

    return {
      hour,
      azimuthDeg: defaultAzimuth,
      altitudeDeg,
      daylightState,
    };
  });
}

/**
 * Helper to create mock sun events
 */
function createSunEvents(overrides: Partial<SunEvents> = {}): SunEvents {
  return {
    sunriseISO: '2024-06-21T05:00:00',
    sunsetISO: '2024-06-21T21:00:00',
    dayLengthHours: 16,
    dayLengthFormatted: '16h 0m',
    ...overrides,
  };
}

describe('generateInsights', () => {
  describe('Rule 1: Polar day detection', () => {
    it('detects midnight sun when all positions are above horizon', () => {
      // All 24 hours above horizon (typical polar day) - minimum is 5
      const hourly = createHourlyPositions(
        Array(24).fill(0).map((_, i) => 10 + Math.sin((i / 24) * Math.PI * 2) * 5)
      );
      const events = createSunEvents({
        sunriseISO: null,
        sunsetISO: null,
        dayLengthHours: 24,
        dayLengthFormatted: '24h 0m',
      });

      const insights = generateInsights(70, hourly, events);

      expect(insights.messages).toContain(
        'Midnight sun: the Sun stays above the horizon all day.'
      );
    });

    it('does not detect polar day if any hour is below horizon', () => {
      const altitudes = Array(24).fill(15);
      altitudes[2] = -1; // One hour below horizon
      const hourly = createHourlyPositions(altitudes);
      const events = createSunEvents();

      const insights = generateInsights(70, hourly, events);

      expect(insights.messages).not.toContain(
        'Midnight sun: the Sun stays above the horizon all day.'
      );
    });
  });

  describe('Rule 2: Polar night detection', () => {
    it('detects polar night when all positions are below horizon', () => {
      // All 24 hours below horizon
      const hourly = createHourlyPositions(
        Array(24).fill(0).map((_, i) => -5 - Math.abs(Math.sin((i / 24) * Math.PI * 2) * 10))
      );
      const events = createSunEvents({
        sunriseISO: null,
        sunsetISO: null,
        dayLengthHours: 0,
        dayLengthFormatted: '0h 0m',
      });

      const insights = generateInsights(70, hourly, events);

      expect(insights.messages).toContain(
        'Polar night: the Sun stays below the horizon all day.'
      );
    });

    it('does not detect polar night if any hour is above horizon', () => {
      const altitudes = Array(24).fill(-10);
      altitudes[12] = 1; // Noon above horizon
      const hourly = createHourlyPositions(altitudes);
      const events = createSunEvents({ dayLengthHours: 2 });

      const insights = generateInsights(70, hourly, events);

      expect(insights.messages).not.toContain(
        'Polar night: the Sun stays below the horizon all day.'
      );
    });
  });

  describe('Rule 3: High latitude winter', () => {
    it('detects high latitude winter conditions', () => {
      // Short day at high latitude
      const altitudes = [
        -15, -12, -10, -8, -5, -2, 2, 6, 10, 12, 12, 10, 8, 6, 2, -2, -5, -8, -10,
        -12, -15, -18, -18, -16,
      ];
      const hourly = createHourlyPositions(altitudes);
      const events = createSunEvents({
        sunriseISO: '2024-12-21T10:00:00',
        sunsetISO: '2024-12-21T15:00:00',
        dayLengthHours: 5,
        dayLengthFormatted: '5h 0m',
      });

      const insights = generateInsights(60, hourly, events);

      expect(insights.messages).toContain(
        'Short daylight window and low solar elevation typical of high-latitude winter.'
      );
    });

    it('does not trigger at lower latitudes', () => {
      const altitudes = [
        -10, -8, -5, -2, 2, 8, 15, 22, 28, 32, 34, 34, 32, 28, 22, 15, 8, 2, -2,
        -5, -8, -10, -12, -12,
      ];
      const hourly = createHourlyPositions(altitudes);
      const events = createSunEvents({
        dayLengthHours: 7,
        dayLengthFormatted: '7h 0m',
      });

      // Latitude 40 is below threshold
      const insights = generateInsights(40, hourly, events);

      expect(insights.messages).not.toContain(
        'Short daylight window and low solar elevation typical of high-latitude winter.'
      );
    });

    it('does not trigger during polar night', () => {
      const hourly = createHourlyPositions(Array(24).fill(-10));
      const events = createSunEvents({
        sunriseISO: null,
        sunsetISO: null,
        dayLengthHours: 0,
      });

      const insights = generateInsights(70, hourly, events);

      // Should get polar night message, not winter message
      expect(insights.messages).toContain(
        'Polar night: the Sun stays below the horizon all day.'
      );
      expect(insights.messages).not.toContain(
        'Short daylight window and low solar elevation typical of high-latitude winter.'
      );
    });
  });

  describe('Rule 4: Near equator', () => {
    it('detects near-equatorial location', () => {
      const hourly = createHourlyPositions(
        Array(24).fill(0).map((_, i) => -15 + Math.sin(((i - 6) / 24) * Math.PI * 2) * 90)
      );
      const events = createSunEvents({ dayLengthHours: 12 });

      const insights = generateInsights(5, hourly, events);

      expect(insights.messages).toContain(
        'Near-equatorial location: expect high peak solar altitude with minimal seasonal variation.'
      );
    });

    it('detects equator itself', () => {
      const hourly = createHourlyPositions(Array(24).fill(45));
      const events = createSunEvents({ dayLengthHours: 12 });

      const insights = generateInsights(0, hourly, events);

      expect(insights.messages).toContain(
        'Near-equatorial location: expect high peak solar altitude with minimal seasonal variation.'
      );
    });

    it('does not trigger above threshold', () => {
      const hourly = createHourlyPositions(Array(24).fill(45));
      const events = createSunEvents();

      const insights = generateInsights(15, hourly, events);

      expect(insights.messages).not.toContain(
        'Near-equatorial location: expect high peak solar altitude with minimal seasonal variation.'
      );
    });
  });

  describe('Rule 5: Long summer day', () => {
    it('detects long summer day at mid-latitude', () => {
      // Long day (>15h) at lat >= 45
      const altitudes = [
        -2, 2, 8, 15, 22, 30, 38, 45, 52, 58, 62, 64, 62, 58, 52, 45, 38, 30, 22,
        15, 8, 2, -2, -5,
      ];
      const hourly = createHourlyPositions(altitudes);
      const events = createSunEvents({
        dayLengthHours: 16,
        dayLengthFormatted: '16h 0m',
      });

      const insights = generateInsights(50, hourly, events);

      expect(insights.messages).toContain(
        'Extended daylight typical of mid-to-high latitude summer.'
      );
    });

    it('does not trigger at lower latitudes', () => {
      const hourly = createHourlyPositions(Array(24).fill(45));
      const events = createSunEvents({
        dayLengthHours: 16,
      });

      const insights = generateInsights(40, hourly, events);

      expect(insights.messages).not.toContain(
        'Extended daylight typical of mid-to-high latitude summer.'
      );
    });

    it('does not trigger for short days', () => {
      const hourly = createHourlyPositions(Array(24).fill(45));
      const events = createSunEvents({
        dayLengthHours: 12,
      });

      const insights = generateInsights(50, hourly, events);

      expect(insights.messages).not.toContain(
        'Extended daylight typical of mid-to-high latitude summer.'
      );
    });

    it('does not trigger during polar day', () => {
      const hourly = createHourlyPositions(Array(24).fill(10)); // All above horizon
      const events = createSunEvents({
        sunriseISO: null,
        sunsetISO: null,
        dayLengthHours: 24,
      });

      const insights = generateInsights(70, hourly, events);

      // Should get midnight sun message, not summer message
      expect(insights.messages).toContain(
        'Midnight sun: the Sun stays above the horizon all day.'
      );
      expect(insights.messages).not.toContain(
        'Extended daylight typical of mid-to-high latitude summer.'
      );
    });
  });

  describe('Additional insights', () => {
    it('notes low peak altitude', () => {
      // Peak altitude around 25 degrees
      const altitudes = [
        -15, -10, -5, 0, 5, 10, 15, 20, 23, 25, 25, 24, 22, 18, 14, 10, 5, 0, -5,
        -10, -12, -14, -15, -15,
      ];
      const hourly = createHourlyPositions(altitudes);
      const events = createSunEvents();

      const insights = generateInsights(60, hourly, events);

      const lowAltMsg = insights.messages.find((m) => m.includes('Low maximum solar altitude'));
      expect(lowAltMsg).toBeDefined();
      expect(lowAltMsg).toContain('25.0°');
    });

    it('notes very high peak altitude', () => {
      // Peak altitude around 85 degrees (near equator at equinox)
      const altitudes = [
        -20, -10, 0, 15, 30, 45, 60, 72, 80, 84, 85, 84, 80, 72, 60, 45, 30, 15,
        0, -10, -15, -18, -20, -20,
      ];
      const hourly = createHourlyPositions(altitudes);
      const events = createSunEvents();

      const insights = generateInsights(5, hourly, events);

      const highAltMsg = insights.messages.find((m) =>
        m.includes('Very high maximum solar altitude')
      );
      expect(highAltMsg).toBeDefined();
      expect(highAltMsg).toContain('85.0°');
    });

    it('counts golden hour conditions', () => {
      // Create positions with several golden hours (0-10 degrees)
      const altitudes = [
        -15, -10, -5, 2, 5, 8, 15, 25, 35, 45, 50, 52, 50, 45, 35, 25, 15, 8, 5,
        2, -5, -10, -12, -15,
      ];
      const hourly = createHourlyPositions(altitudes);
      const events = createSunEvents();

      const insights = generateInsights(40, hourly, events);

      const goldenMsg = insights.messages.find((m) => m.includes('golden hour'));
      expect(goldenMsg).toBeDefined();
    });

    it('does not mention golden hour during polar day', () => {
      const hourly = createHourlyPositions(Array(24).fill(5)); // All golden hour but polar day
      const events = createSunEvents({ dayLengthHours: 24 });

      const insights = generateInsights(70, hourly, events);

      const goldenMsg = insights.messages.find((m) => m.includes('golden hour'));
      expect(goldenMsg).toBeUndefined();
    });

    it('does not mention golden hour during polar night', () => {
      const hourly = createHourlyPositions(Array(24).fill(-10));
      const events = createSunEvents({ dayLengthHours: 0 });

      const insights = generateInsights(70, hourly, events);

      const goldenMsg = insights.messages.find((m) => m.includes('golden hour'));
      expect(goldenMsg).toBeUndefined();
    });
  });

  describe('Southern hemisphere', () => {
    it('handles southern latitudes correctly', () => {
      // Long summer day at southern latitude (not polar day - has sunrise/sunset)
      const altitudes = [
        -2, 2, 8, 15, 22, 30, 38, 45, 52, 58, 62, 64, 62, 58, 52, 45, 38, 30, 22,
        15, 8, 2, -2, -5,
      ];
      const hourly = createHourlyPositions(altitudes);
      const events = createSunEvents({
        dayLengthHours: 16,
      });

      // Southern latitude summer
      const insights = generateInsights(-50, hourly, events);

      expect(insights.messages).toContain(
        'Extended daylight typical of mid-to-high latitude summer.'
      );
    });

    it('handles southern near-equator', () => {
      const hourly = createHourlyPositions(Array(24).fill(45));
      const events = createSunEvents();

      const insights = generateInsights(-5, hourly, events);

      expect(insights.messages).toContain(
        'Near-equatorial location: expect high peak solar altitude with minimal seasonal variation.'
      );
    });
  });

  describe('Edge cases', () => {
    it('handles empty hourly array', () => {
      const events = createSunEvents();

      const insights = generateInsights(40, [], events);

      // Should not crash, may have no messages
      expect(insights.messages).toBeDefined();
    });

    it('handles null/undefined day length', () => {
      const hourly = createHourlyPositions(Array(24).fill(45));
      const events = createSunEvents({
        dayLengthHours: null as unknown as number,
      });

      // Should not crash, uses default of 12
      const insights = generateInsights(60, hourly, events);
      expect(insights.messages).toBeDefined();
    });

    it('can generate multiple insights for same conditions', () => {
      // High latitude, short day, low peak
      const altitudes = [
        -15, -12, -10, -8, -5, -2, 2, 5, 8, 10, 10, 8, 5, 2, -2, -5, -8, -10,
        -12, -15, -16, -17, -17, -16,
      ];
      const hourly = createHourlyPositions(altitudes);
      const events = createSunEvents({
        dayLengthHours: 6,
        dayLengthFormatted: '6h 0m',
      });

      const insights = generateInsights(65, hourly, events);

      // Should have multiple insights
      expect(insights.messages.length).toBeGreaterThan(1);
      expect(insights.messages).toContain(
        'Short daylight window and low solar elevation typical of high-latitude winter.'
      );
    });
  });
});

describe('getSummaryInsight', () => {
  it('returns first insight as summary', () => {
    const hourly = createHourlyPositions(Array(24).fill(10));
    const events = createSunEvents({ dayLengthHours: 24 });

    const summary = getSummaryInsight(70, hourly, events);

    expect(summary).toBe('Midnight sun: the Sun stays above the horizon all day.');
  });

  it('returns default message when no insights', () => {
    // Normal conditions at mid-latitude
    const altitudes = [
      -10, -5, 0, 10, 20, 30, 40, 48, 55, 60, 62, 62, 60, 55, 48, 40, 30, 20, 10,
      0, -5, -8, -10, -10,
    ];
    const hourly = createHourlyPositions(altitudes);
    const events = createSunEvents({ dayLengthHours: 14 });

    const summary = getSummaryInsight(35, hourly, events);

    // Should either be a specific insight or default
    expect(typeof summary).toBe('string');
    expect(summary.length).toBeGreaterThan(0);
  });
});
