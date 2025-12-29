/**
 * Unit tests for 3D Solar Path Visibility Utilities
 */

import { describe, it, expect } from 'vitest';
import {
  filterVisibleHours,
  buildSolar3DPoints,
  buildSolar3DPath,
  isSelectedHourVisible,
} from '@/lib/solar3d/visibility';
import type { HourlySolarPosition, DaylightState } from '@/types/solar';

// Helper to create mock hourly data
function createMockHour(
  hour: number,
  altitudeDeg: number,
  daylightState: DaylightState = 'day'
): HourlySolarPosition {
  return {
    hour,
    localTimeLabel: `${hour.toString().padStart(2, '0')}:00`,
    azimuthDeg: hour * 15, // Arbitrary: 15° per hour
    altitudeDeg,
    daylightState,
  };
}

// Create a full 24-hour dataset with realistic altitude pattern
function createMockHourlyData(): HourlySolarPosition[] {
  // Simulate a day where sun rises around 6am and sets around 18pm
  return Array.from({ length: 24 }, (_, hour) => {
    let altitude: number;
    let state: DaylightState;

    if (hour < 6 || hour > 18) {
      altitude = -10 - Math.abs(hour - 12) * 2;
      state = 'night';
    } else if (hour === 6 || hour === 18) {
      altitude = 2;
      state = 'golden';
    } else if (hour === 7 || hour === 17) {
      altitude = 10;
      state = 'golden';
    } else {
      altitude = 30 + (6 - Math.abs(hour - 12)) * 5;
      state = 'day';
    }

    return createMockHour(hour, altitude, state);
  });
}

describe('filterVisibleHours', () => {
  it('filters out hours with negative altitude', () => {
    const hourly = createMockHourlyData();
    const visible = filterVisibleHours(hourly);

    expect(visible.every((h) => h.altitudeDeg >= 0)).toBe(true);
    expect(visible.length).toBeLessThan(24);
  });

  it('includes hours with altitude = 0', () => {
    const hourly = [createMockHour(12, 0, 'golden')];
    const visible = filterVisibleHours(hourly);

    expect(visible).toHaveLength(1);
    expect(visible[0].altitudeDeg).toBe(0);
  });

  it('returns empty array for polar night (all negative)', () => {
    const hourly = Array.from({ length: 24 }, (_, i) => createMockHour(i, -10, 'night'));
    const visible = filterVisibleHours(hourly);

    expect(visible).toHaveLength(0);
  });

  it('returns all hours for polar day (all positive)', () => {
    const hourly = Array.from({ length: 24 }, (_, i) => createMockHour(i, 20 + i, 'day'));
    const visible = filterVisibleHours(hourly);

    expect(visible).toHaveLength(24);
  });

  it('preserves original hour order', () => {
    const hourly = createMockHourlyData();
    const visible = filterVisibleHours(hourly);

    for (let i = 1; i < visible.length; i++) {
      expect(visible[i].hour).toBeGreaterThan(visible[i - 1].hour);
    }
  });
});

describe('buildSolar3DPoints', () => {
  it('creates Solar3DPoint with computed position for each visible hour', () => {
    const visibleHours = [createMockHour(12, 60, 'day'), createMockHour(13, 55, 'day')];
    const points = buildSolar3DPoints(visibleHours);

    expect(points).toHaveLength(2);
    expect(points[0].hour).toBe(12);
    expect(points[0].position).toHaveLength(3);
    expect(points[0].daylightState).toBe('day');
  });

  it('preserves all hourly data in points', () => {
    const hour = createMockHour(14, 45, 'day');
    const points = buildSolar3DPoints([hour]);

    expect(points[0].hour).toBe(14);
    expect(points[0].localTimeLabel).toBe('14:00');
    expect(points[0].azimuthDeg).toBe(hour.azimuthDeg);
    expect(points[0].altitudeDeg).toBe(45);
  });

  it('computes valid 3D positions', () => {
    const visibleHours = [createMockHour(12, 45, 'day')];
    const points = buildSolar3DPoints(visibleHours);
    const [east, north, up] = points[0].position;

    // All components should be finite numbers
    expect(Number.isFinite(east)).toBe(true);
    expect(Number.isFinite(north)).toBe(true);
    expect(Number.isFinite(up)).toBe(true);

    // Up should be positive for positive altitude
    expect(up).toBeGreaterThan(0);
  });

  it('returns empty array for empty input', () => {
    const points = buildSolar3DPoints([]);
    expect(points).toHaveLength(0);
  });

  it('casts daylightState to golden or day', () => {
    const golden = createMockHour(7, 10, 'golden');
    const day = createMockHour(12, 60, 'day');
    const points = buildSolar3DPoints([golden, day]);

    expect(points[0].daylightState).toBe('golden');
    expect(points[1].daylightState).toBe('day');
  });
});

describe('buildSolar3DPath', () => {
  it('extracts positions from points in hour order', () => {
    const points = buildSolar3DPoints([
      createMockHour(14, 50, 'day'),
      createMockHour(12, 60, 'day'),
      createMockHour(13, 55, 'day'),
    ]);
    const path = buildSolar3DPath(points);

    expect(path.positions).toHaveLength(3);
    // Should be sorted by hour: 12, 13, 14
    // Verify by checking the positions match the sorted order
    const sortedPoints = [...points].sort((a, b) => a.hour - b.hour);
    sortedPoints.forEach((p, i) => {
      expect(path.positions[i]).toEqual(p.position);
    });
  });

  it('returns empty positions for empty input', () => {
    const path = buildSolar3DPath([]);
    expect(path.positions).toHaveLength(0);
  });

  it('handles single point', () => {
    const points = buildSolar3DPoints([createMockHour(12, 60, 'day')]);
    const path = buildSolar3DPath(points);

    expect(path.positions).toHaveLength(1);
    expect(path.positions[0]).toEqual(points[0].position);
  });

  it('does not mutate original points array', () => {
    const points = buildSolar3DPoints([
      createMockHour(14, 50, 'day'),
      createMockHour(12, 60, 'day'),
    ]);
    const originalOrder = points.map((p) => p.hour);

    buildSolar3DPath(points);

    expect(points.map((p) => p.hour)).toEqual(originalOrder);
  });
});

describe('isSelectedHourVisible', () => {
  const hourly = createMockHourlyData();

  it('returns false for null selectedHour', () => {
    expect(isSelectedHourVisible(null, hourly)).toBe(false);
  });

  it('returns false for undefined selectedHour', () => {
    expect(isSelectedHourVisible(undefined as unknown as null, hourly)).toBe(false);
  });

  it('returns true for visible selectedHour', () => {
    // Hour 12 should be visible (positive altitude)
    expect(isSelectedHourVisible(12, hourly)).toBe(true);
  });

  it('returns false for night selectedHour', () => {
    // Hour 2 should be night (negative altitude)
    expect(isSelectedHourVisible(2, hourly)).toBe(false);
  });

  it('returns true for hour at exactly altitude 0', () => {
    const hourlyWithZero = [createMockHour(12, 0, 'golden')];
    expect(isSelectedHourVisible(0, hourlyWithZero)).toBe(true);
  });

  it('returns false for out-of-range selectedHour', () => {
    expect(isSelectedHourVisible(25, hourly)).toBe(false);
    expect(isSelectedHourVisible(-1, hourly)).toBe(false);
  });

  it('handles empty hourly array', () => {
    expect(isSelectedHourVisible(12, [])).toBe(false);
  });
});
