/**
 * Azimuth Normalization
 *
 * suncalc returns azimuth in radians measured from South, clockwise.
 * We need degrees measured from North (0°), clockwise.
 *
 * Conversion: (suncalcAzimuthRad * 180/π + 180) % 360
 */

/**
 * Convert radians to degrees
 */
export function radToDeg(radians: number): number {
  return radians * (180 / Math.PI);
}

/**
 * Normalize suncalc azimuth (from South, radians) to compass bearing (from North, degrees)
 *
 * @param azimuthRad - Azimuth in radians from South (suncalc convention)
 * @returns Azimuth in degrees from North (0-360°, clockwise)
 */
export function normalizeAzimuth(azimuthRad: number): number {
  // Convert to degrees
  const degrees = radToDeg(azimuthRad);

  // Shift from South to North (add 180°)
  const fromNorth = degrees + 180;

  // Normalize to 0-360 range
  const normalized = ((fromNorth % 360) + 360) % 360;

  // Round to 2 decimal places
  return Math.round(normalized * 100) / 100;
}

/**
 * Normalize altitude from radians to degrees
 *
 * @param altitudeRad - Altitude in radians
 * @returns Altitude in degrees (-90 to 90)
 */
export function normalizeAltitude(altitudeRad: number): number {
  const degrees = radToDeg(altitudeRad);
  // Round to 2 decimal places
  return Math.round(degrees * 100) / 100;
}
