import { describe, expect, it } from 'vitest';
import {
  computeExtendedSunEvents,
  computeSolarPositionAtLocalTime,
  getCardinalDirection,
} from '@/lib/solar/extended-events';

describe('computeExtendedSunEvents', () => {
  it('returns reproducible Brisbane civil and golden-hour boundaries', () => {
    const events = computeExtendedSunEvents(
      -27.4698,
      153.0251,
      '2026-06-21',
      'Australia/Brisbane'
    );

    expect(events.timezone).toBe('Australia/Brisbane');
    expect(events.note).toBeUndefined();
    expect(events.civilDawnLocal).toMatch(/^\d{2}:\d{2}$/);
    expect(events.sunriseLocal).toMatch(/^\d{2}:\d{2}$/);
    expect(events.sunsetLocal).toMatch(/^\d{2}:\d{2}$/);
    expect(events.civilDuskLocal).toMatch(/^\d{2}:\d{2}$/);
    expect(events.dayLengthHours).toBeGreaterThan(10);
    expect(events.dayLengthHours).toBeLessThan(11);

    expect(events.morningGoldenHour.available).toBe(true);
    expect(events.morningGoldenHour.start?.localTime).toBe(events.sunriseLocal);
    expect(events.morningGoldenHour.start?.altitudeDeg).toBeLessThan(0);
    expect(events.morningGoldenHour.end?.altitudeDeg).toBeGreaterThan(5.8);
    expect(events.morningGoldenHour.end?.altitudeDeg).toBeLessThanOrEqual(6.25);

    expect(events.eveningGoldenHour.available).toBe(true);
    expect(events.eveningGoldenHour.end?.localTime).toBe(events.sunsetLocal);
    expect(events.eveningGoldenHour.start?.altitudeDeg).toBeGreaterThan(5.8);
    expect(events.eveningGoldenHour.start?.altitudeDeg).toBeLessThanOrEqual(6.25);
  });

  it('returns explicit unavailable golden windows during polar day', () => {
    const events = computeExtendedSunEvents(
      78.22,
      15.63,
      '2026-06-21',
      'Arctic/Longyearbyen'
    );

    expect(events.dayLengthHours).toBe(24);
    expect(events.note).toMatch(/does not set/i);
    expect(events.sunriseLocal).toBeUndefined();
    expect(events.sunsetLocal).toBeUndefined();
    expect(events.morningGoldenHour).toMatchObject({ available: false });
    expect(events.eveningGoldenHour).toMatchObject({ available: false });
  });

  it('returns explicit unavailable golden windows during polar night', () => {
    const events = computeExtendedSunEvents(
      78.22,
      15.63,
      '2026-12-21',
      'Arctic/Longyearbyen'
    );

    expect(events.dayLengthHours).toBe(0);
    expect(events.note).toMatch(/does not rise/i);
    expect(events.morningGoldenHour).toMatchObject({ available: false });
    expect(events.eveningGoldenHour).toMatchObject({ available: false });
  });
});

describe('computeSolarPositionAtLocalTime', () => {
  it('calculates a signed altitude and north-based bearing for the selected local time', () => {
    const position = computeSolarPositionAtLocalTime(
      -27.4698,
      153.0251,
      '2026-08-11',
      '12:00',
      'Australia/Brisbane'
    );

    expect(position.localTimeLabel).toBe('12:00');
    expect(position.azimuthDeg).toBeGreaterThanOrEqual(0);
    expect(position.azimuthDeg).toBeLessThan(360);
    expect(position.altitudeDeg).toBeGreaterThan(40);
    expect(position.daylightState).toBe('day');
  });

  it('throws instead of returning a fabricated result for invalid input time', () => {
    expect(() =>
      computeSolarPositionAtLocalTime(
        -27.4698,
        153.0251,
        '2026-08-11',
        'not-a-time',
        'Australia/Brisbane'
      )
    ).toThrow(/invalid local date or time/i);
  });
});

describe('getCardinalDirection', () => {
  it('maps normalized azimuth to readable compass sectors', () => {
    expect(getCardinalDirection(0)).toBe('North');
    expect(getCardinalDirection(90)).toBe('East');
    expect(getCardinalDirection(180)).toBe('South');
    expect(getCardinalDirection(270)).toBe('West');
    expect(getCardinalDirection(359.9)).toBe('North');
  });
});
