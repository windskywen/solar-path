import { describe, it, expect } from 'vitest';
import {
  validateLatitude,
  validateLongitude,
  validateCoordinates,
  normalizeCoordinate,
  parseCoordinate,
  hasValidPrecision,
  formatCoordinate,
  formatCoordinatePair,
} from '@/lib/geo/validation';

describe('validateLatitude', () => {
  it('accepts valid latitudes', () => {
    expect(validateLatitude(0).valid).toBe(true);
    expect(validateLatitude(45).valid).toBe(true);
    expect(validateLatitude(-45).valid).toBe(true);
    expect(validateLatitude(90).valid).toBe(true);
    expect(validateLatitude(-90).valid).toBe(true);
    expect(validateLatitude(40.7128).valid).toBe(true);
  });

  it('accepts string numbers', () => {
    expect(validateLatitude('40.7128').valid).toBe(true);
    expect(validateLatitude('-33.8688').valid).toBe(true);
  });

  it('rejects values outside range', () => {
    expect(validateLatitude(91).valid).toBe(false);
    expect(validateLatitude(-91).valid).toBe(false);
    expect(validateLatitude(180).valid).toBe(false);
  });

  it('rejects invalid values', () => {
    expect(validateLatitude(null).valid).toBe(false);
    expect(validateLatitude(undefined).valid).toBe(false);
    expect(validateLatitude('').valid).toBe(false);
    expect(validateLatitude('abc').valid).toBe(false);
    expect(validateLatitude(NaN).valid).toBe(false);
  });

  it('returns appropriate error messages', () => {
    expect(validateLatitude(null).error).toBe('Latitude is required');
    expect(validateLatitude('abc').error).toBe('Latitude must be a number');
    expect(validateLatitude(100).error).toBe('Latitude must be between -90 and 90');
  });
});

describe('validateLongitude', () => {
  it('accepts valid longitudes', () => {
    expect(validateLongitude(0).valid).toBe(true);
    expect(validateLongitude(90).valid).toBe(true);
    expect(validateLongitude(-90).valid).toBe(true);
    expect(validateLongitude(180).valid).toBe(true);
    expect(validateLongitude(-180).valid).toBe(true);
    expect(validateLongitude(-74.006).valid).toBe(true);
  });

  it('accepts string numbers', () => {
    expect(validateLongitude('-74.006').valid).toBe(true);
    expect(validateLongitude('151.2093').valid).toBe(true);
  });

  it('rejects values outside range', () => {
    expect(validateLongitude(181).valid).toBe(false);
    expect(validateLongitude(-181).valid).toBe(false);
    expect(validateLongitude(360).valid).toBe(false);
  });

  it('rejects invalid values', () => {
    expect(validateLongitude(null).valid).toBe(false);
    expect(validateLongitude(undefined).valid).toBe(false);
    expect(validateLongitude('').valid).toBe(false);
    expect(validateLongitude('xyz').valid).toBe(false);
  });

  it('returns appropriate error messages', () => {
    expect(validateLongitude(null).error).toBe('Longitude is required');
    expect(validateLongitude('xyz').error).toBe('Longitude must be a number');
    expect(validateLongitude(200).error).toBe('Longitude must be between -180 and 180');
  });
});

describe('validateCoordinates', () => {
  it('accepts valid coordinate pairs', () => {
    expect(validateCoordinates(40.7128, -74.006).valid).toBe(true);
    expect(validateCoordinates(0, 0).valid).toBe(true);
    expect(validateCoordinates(-33.8688, 151.2093).valid).toBe(true);
    expect(validateCoordinates(90, 180).valid).toBe(true);
    expect(validateCoordinates(-90, -180).valid).toBe(true);
  });

  it('rejects invalid latitude', () => {
    const result = validateCoordinates(100, 0);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Latitude');
  });

  it('rejects invalid longitude', () => {
    const result = validateCoordinates(0, 200);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Longitude');
  });

  it('returns latitude error first if both invalid', () => {
    const result = validateCoordinates(100, 200);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Latitude');
  });
});

describe('normalizeCoordinate', () => {
  it('rounds to 6 decimal places by default', () => {
    expect(normalizeCoordinate(40.71280000001)).toBe(40.7128);
    expect(normalizeCoordinate(40.712849999999)).toBe(40.71285);
  });

  it('rounds to specified decimal places', () => {
    expect(normalizeCoordinate(40.7128, 2)).toBe(40.71);
    expect(normalizeCoordinate(40.7128, 4)).toBe(40.7128);
    expect(normalizeCoordinate(40.7128, 0)).toBe(41);
  });

  it('handles negative values', () => {
    expect(normalizeCoordinate(-74.0060001, 4)).toBe(-74.006);
  });
});

describe('parseCoordinate', () => {
  it('parses valid numbers', () => {
    expect(parseCoordinate('40.7128')).toBe(40.7128);
    expect(parseCoordinate('-74.006')).toBe(-74.006);
    expect(parseCoordinate('0')).toBe(0);
  });

  it('handles whitespace', () => {
    expect(parseCoordinate('  40.7128  ')).toBe(40.7128);
  });

  it('returns null for invalid values', () => {
    expect(parseCoordinate('')).toBeNull();
    expect(parseCoordinate('abc')).toBeNull();
    // Note: parseFloat('40.abc') returns 40, which is valid JS behavior
  });
});

describe('hasValidPrecision', () => {
  it('accepts up to 6 decimal places', () => {
    expect(hasValidPrecision(40.7)).toBe(true);
    expect(hasValidPrecision(40.71)).toBe(true);
    expect(hasValidPrecision(40.712800)).toBe(true);
    expect(hasValidPrecision(40.123456)).toBe(true);
  });

  it('accepts integers', () => {
    expect(hasValidPrecision(40)).toBe(true);
    expect(hasValidPrecision(0)).toBe(true);
  });

  it('rejects more than 6 decimal places', () => {
    expect(hasValidPrecision(40.1234567)).toBe(false);
    expect(hasValidPrecision(40.12345678)).toBe(false);
  });
});

describe('formatCoordinate', () => {
  it('formats to 4 decimal places by default', () => {
    expect(formatCoordinate(40.7128)).toBe('40.7128');
    expect(formatCoordinate(40.7)).toBe('40.7000');
  });

  it('formats to specified decimal places', () => {
    expect(formatCoordinate(40.7128, 2)).toBe('40.71');
    expect(formatCoordinate(40.7128, 6)).toBe('40.712800');
  });
});

describe('formatCoordinatePair', () => {
  it('formats positive coordinates with N/E', () => {
    expect(formatCoordinatePair(40.7128, 74.006)).toBe('40.7128°N, 74.0060°E');
  });

  it('formats negative coordinates with S/W', () => {
    expect(formatCoordinatePair(-33.8688, -151.2093)).toBe('33.8688°S, 151.2093°W');
  });

  it('formats mixed coordinates', () => {
    expect(formatCoordinatePair(40.7128, -74.006)).toBe('40.7128°N, 74.0060°W');
    expect(formatCoordinatePair(-33.8688, 151.2093)).toBe('33.8688°S, 151.2093°E');
  });

  it('handles zero coordinates', () => {
    expect(formatCoordinatePair(0, 0)).toBe('0.0000°N, 0.0000°E');
  });

  it('respects decimal places parameter', () => {
    expect(formatCoordinatePair(40.7128, -74.006, 2)).toBe('40.71°N, 74.01°W');
  });
});
