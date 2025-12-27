import { describe, it, expect } from 'vitest';
import {
  getDaylightState,
  computeSunPosition,
  computeHourlyPositions,
  computePositionForHour,
} from '@/lib/solar/computation';

describe('getDaylightState', () => {
  it('returns "night" for negative altitude', () => {
    expect(getDaylightState(-10)).toBe('night');
    expect(getDaylightState(-0.1)).toBe('night');
  });

  it('returns "golden" for altitude between 0 and 6 degrees', () => {
    expect(getDaylightState(0)).toBe('golden');
    expect(getDaylightState(3)).toBe('golden');
    expect(getDaylightState(5.99)).toBe('golden');
  });

  it('returns "day" for altitude >= 6 degrees', () => {
    expect(getDaylightState(6)).toBe('day');
    expect(getDaylightState(45)).toBe('day');
    expect(getDaylightState(90)).toBe('day');
  });
});

describe('computeSunPosition', () => {
  it('returns azimuth in 0-360 range', () => {
    // Summer solstice noon in New York
    const date = new Date('2024-06-21T12:00:00-04:00');
    const { azimuthDeg } = computeSunPosition(date, 40.7128, -74.006);
    expect(azimuthDeg).toBeGreaterThanOrEqual(0);
    expect(azimuthDeg).toBeLessThan(360);
  });

  it('returns reasonable altitude for noon in summer', () => {
    // Summer solstice noon in New York
    const date = new Date('2024-06-21T12:00:00-04:00');
    const { altitudeDeg } = computeSunPosition(date, 40.7128, -74.006);
    // Sun should be high in the sky at noon in summer
    expect(altitudeDeg).toBeGreaterThan(60);
  });

  it('returns negative altitude for midnight', () => {
    // Midnight in New York (not polar region)
    const date = new Date('2024-06-21T00:00:00-04:00');
    const { altitudeDeg } = computeSunPosition(date, 40.7128, -74.006);
    // Sun should be below horizon at midnight
    expect(altitudeDeg).toBeLessThan(0);
  });

  it('handles equator location', () => {
    // Equinox at equator
    const date = new Date('2024-03-20T12:00:00Z');
    const { altitudeDeg } = computeSunPosition(date, 0, 0);
    // Sun should be nearly overhead at equator during equinox noon
    expect(altitudeDeg).toBeGreaterThan(80);
  });
});

describe('computeHourlyPositions', () => {
  it('returns exactly 24 positions', () => {
    const positions = computeHourlyPositions(40.7128, -74.006, '2024-06-21', 'America/New_York');
    expect(positions).toHaveLength(24);
  });

  it('has sequential hours from 0 to 23', () => {
    const positions = computeHourlyPositions(40.7128, -74.006, '2024-06-21', 'America/New_York');
    positions.forEach((pos, index) => {
      expect(pos.hour).toBe(index);
    });
  });

  it('has proper time labels', () => {
    const positions = computeHourlyPositions(40.7128, -74.006, '2024-06-21', 'America/New_York');
    expect(positions[0].localTimeLabel).toBe('00:00');
    expect(positions[12].localTimeLabel).toBe('12:00');
    expect(positions[23].localTimeLabel).toBe('23:00');
  });

  it('has night hours at expected times', () => {
    const positions = computeHourlyPositions(40.7128, -74.006, '2024-06-21', 'America/New_York');
    // Midnight should be night
    expect(positions[0].daylightState).toBe('night');
    // Late night should be night
    expect(positions[2].daylightState).toBe('night');
  });

  it('has day hours at expected times', () => {
    const positions = computeHourlyPositions(40.7128, -74.006, '2024-06-21', 'America/New_York');
    // Noon should be day
    expect(positions[12].daylightState).toBe('day');
    // Afternoon should be day
    expect(positions[14].daylightState).toBe('day');
  });

  it('handles "browser" timezone', () => {
    const positions = computeHourlyPositions(40.7128, -74.006, '2024-06-21', 'browser');
    expect(positions).toHaveLength(24);
  });

  it('handles polar region in summer (midnight sun)', () => {
    // Svalbard during summer solstice - 24h daylight
    const positions = computeHourlyPositions(78.22, 15.63, '2024-06-21', 'Arctic/Longyearbyen');
    // All positions should have positive altitude (sun above horizon)
    const allAboveHorizon = positions.every((p) => p.altitudeDeg > 0);
    expect(allAboveHorizon).toBe(true);
  });

  it('handles polar region in winter (polar night)', () => {
    // Svalbard during winter solstice - 24h darkness
    const positions = computeHourlyPositions(78.22, 15.63, '2024-12-21', 'Arctic/Longyearbyen');
    // All positions should have negative altitude (sun below horizon)
    const allBelowHorizon = positions.every((p) => p.altitudeDeg < 0);
    expect(allBelowHorizon).toBe(true);
  });
});

describe('computePositionForHour', () => {
  it('returns position for specific hour', () => {
    const position = computePositionForHour(40.7128, -74.006, '2024-06-21', 12, 'America/New_York');
    expect(position.hour).toBe(12);
    expect(position.localTimeLabel).toBe('12:00');
    expect(position.daylightState).toBe('day');
  });

  it('matches corresponding position from computeHourlyPositions', () => {
    const allPositions = computeHourlyPositions(40.7128, -74.006, '2024-06-21', 'America/New_York');
    const singlePosition = computePositionForHour(
      40.7128,
      -74.006,
      '2024-06-21',
      12,
      'America/New_York'
    );

    expect(singlePosition.azimuthDeg).toBe(allPositions[12].azimuthDeg);
    expect(singlePosition.altitudeDeg).toBe(allPositions[12].altitudeDeg);
    expect(singlePosition.daylightState).toBe(allPositions[12].daylightState);
  });
});

// Reference value tests for validation against known solar data
describe('Reference Value Validation', () => {
  it('validates summer solstice noon in NYC against reference', () => {
    // Known values for NYC on June 21, 2024 at solar noon (~12:57 EDT)
    // Sun should be roughly South (~180°) at high altitude (~73°)
    const position = computePositionForHour(
      40.7128,
      -74.006,
      '2024-06-21',
      13,
      'America/New_York'
    );

    // Azimuth should be close to South (180° ± 20°)
    expect(position.azimuthDeg).toBeGreaterThan(160);
    expect(position.azimuthDeg).toBeLessThan(200);

    // Altitude should be high (60-75°)
    expect(position.altitudeDeg).toBeGreaterThan(60);
    expect(position.altitudeDeg).toBeLessThan(75);
  });

  it('validates winter solstice noon in NYC against reference', () => {
    // Known values for NYC on Dec 21, 2024 at solar noon
    // Sun should be South at lower altitude (~26°)
    const position = computePositionForHour(
      40.7128,
      -74.006,
      '2024-12-21',
      12,
      'America/New_York'
    );

    // Azimuth should be close to South (180° ± 20°)
    expect(position.azimuthDeg).toBeGreaterThan(160);
    expect(position.azimuthDeg).toBeLessThan(200);

    // Altitude should be lower (20-35°)
    expect(position.altitudeDeg).toBeGreaterThan(20);
    expect(position.altitudeDeg).toBeLessThan(35);
  });

  it('validates equinox noon at equator against reference', () => {
    // At equator during equinox, sun should be nearly overhead at noon
    const position = computePositionForHour(0, 0, '2024-03-20', 12, 'UTC');

    // Altitude should be very high (85-90°)
    expect(position.altitudeDeg).toBeGreaterThan(85);
  });
});
