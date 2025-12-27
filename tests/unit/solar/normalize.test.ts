import { describe, it, expect } from 'vitest';
import { radToDeg, normalizeAzimuth, normalizeAltitude } from '@/lib/solar/normalize';

describe('radToDeg', () => {
  it('converts 0 radians to 0 degrees', () => {
    expect(radToDeg(0)).toBe(0);
  });

  it('converts π radians to 180 degrees', () => {
    expect(radToDeg(Math.PI)).toBeCloseTo(180, 5);
  });

  it('converts π/2 radians to 90 degrees', () => {
    expect(radToDeg(Math.PI / 2)).toBeCloseTo(90, 5);
  });

  it('converts 2π radians to 360 degrees', () => {
    expect(radToDeg(2 * Math.PI)).toBeCloseTo(360, 5);
  });

  it('handles negative radians', () => {
    expect(radToDeg(-Math.PI / 2)).toBeCloseTo(-90, 5);
  });
});

describe('normalizeAzimuth', () => {
  it('converts South (0 rad from suncalc) to North bearing 180°', () => {
    // suncalc: 0 rad = South
    // Expected: 180° (South in compass)
    expect(normalizeAzimuth(0)).toBe(180);
  });

  it('converts West (π/2 rad from suncalc) to North bearing 270°', () => {
    // suncalc: π/2 rad = West
    // Expected: 270° (West in compass)
    expect(normalizeAzimuth(Math.PI / 2)).toBe(270);
  });

  it('converts North (π rad from suncalc) to North bearing 0°', () => {
    // suncalc: π rad = North
    // Expected: 0° (or 360°) (North in compass)
    const result = normalizeAzimuth(Math.PI);
    expect(result === 0 || result === 360).toBe(true);
  });

  it('converts East (-π/2 rad from suncalc) to North bearing 90°', () => {
    // suncalc: -π/2 rad = East
    // Expected: 90° (East in compass)
    expect(normalizeAzimuth(-Math.PI / 2)).toBe(90);
  });

  it('handles values outside -π to π range', () => {
    // 3π/2 rad from South = West going further
    const result = normalizeAzimuth((3 * Math.PI) / 2);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThan(360);
  });

  it('returns values in 0-360 range', () => {
    const testCases = [0, Math.PI / 4, Math.PI / 2, Math.PI, -Math.PI / 4, -Math.PI];
    for (const rad of testCases) {
      const result = normalizeAzimuth(rad);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThan(360);
    }
  });

  it('rounds to 2 decimal places', () => {
    const result = normalizeAzimuth(0.123456789);
    const decimalPlaces = (result.toString().split('.')[1] || '').length;
    expect(decimalPlaces).toBeLessThanOrEqual(2);
  });
});

describe('normalizeAltitude', () => {
  it('converts 0 radians to 0 degrees', () => {
    expect(normalizeAltitude(0)).toBe(0);
  });

  it('converts π/2 radians to 90 degrees (zenith)', () => {
    expect(normalizeAltitude(Math.PI / 2)).toBe(90);
  });

  it('converts -π/6 radians to -30 degrees (below horizon)', () => {
    expect(normalizeAltitude(-Math.PI / 6)).toBeCloseTo(-30, 1);
  });

  it('handles positive altitudes (sun above horizon)', () => {
    const result = normalizeAltitude(Math.PI / 4); // 45°
    expect(result).toBeCloseTo(45, 1);
  });

  it('handles negative altitudes (sun below horizon)', () => {
    const result = normalizeAltitude(-Math.PI / 4); // -45°
    expect(result).toBeCloseTo(-45, 1);
  });

  it('rounds to 2 decimal places', () => {
    const result = normalizeAltitude(0.123456789);
    const decimalPlaces = (result.toString().split('.')[1] || '').length;
    expect(decimalPlaces).toBeLessThanOrEqual(2);
  });
});
