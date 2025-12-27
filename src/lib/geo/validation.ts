/**
 * Coordinate Validation
 *
 * Validates latitude and longitude values per FR-001 and FR-002.
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate latitude value
 *
 * @param lat - Latitude value to validate
 * @returns ValidationResult with valid flag and optional error message
 */
export function validateLatitude(lat: unknown): ValidationResult {
  if (lat === null || lat === undefined || lat === '') {
    return { valid: false, error: 'Latitude is required' };
  }

  const num = typeof lat === 'string' ? parseFloat(lat) : lat;

  if (typeof num !== 'number' || isNaN(num)) {
    return { valid: false, error: 'Latitude must be a number' };
  }

  if (num < -90 || num > 90) {
    return { valid: false, error: 'Latitude must be between -90 and 90' };
  }

  return { valid: true };
}

/**
 * Validate longitude value
 *
 * @param lng - Longitude value to validate
 * @returns ValidationResult with valid flag and optional error message
 */
export function validateLongitude(lng: unknown): ValidationResult {
  if (lng === null || lng === undefined || lng === '') {
    return { valid: false, error: 'Longitude is required' };
  }

  const num = typeof lng === 'string' ? parseFloat(lng) : lng;

  if (typeof num !== 'number' || isNaN(num)) {
    return { valid: false, error: 'Longitude must be a number' };
  }

  if (num < -180 || num > 180) {
    return { valid: false, error: 'Longitude must be between -180 and 180' };
  }

  return { valid: true };
}

/**
 * Validate both latitude and longitude
 *
 * @param lat - Latitude value
 * @param lng - Longitude value
 * @returns ValidationResult with valid flag and optional error message
 */
export function validateCoordinates(lat: unknown, lng: unknown): ValidationResult {
  const latResult = validateLatitude(lat);
  if (!latResult.valid) {
    return latResult;
  }

  const lngResult = validateLongitude(lng);
  if (!lngResult.valid) {
    return lngResult;
  }

  return { valid: true };
}

/**
 * Normalize coordinate to specified decimal places
 *
 * @param value - Coordinate value
 * @param decimals - Number of decimal places (default 6 per FR-001)
 * @returns Normalized number
 */
export function normalizeCoordinate(value: number, decimals: number = 6): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Parse and validate coordinate string
 *
 * @param value - String value to parse
 * @returns Parsed number or null if invalid
 */
export function parseCoordinate(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === '') return null;

  const num = parseFloat(trimmed);
  if (isNaN(num)) return null;

  return num;
}

/**
 * Check if coordinate has valid precision (up to 6 decimal places)
 *
 * @param value - Coordinate value
 * @returns True if precision is valid
 */
export function hasValidPrecision(value: number): boolean {
  const str = value.toString();
  const decimalPart = str.split('.')[1] || '';
  return decimalPart.length <= 6;
}

/**
 * Format coordinate for display
 *
 * @param value - Coordinate value
 * @param decimals - Number of decimal places
 * @returns Formatted string
 */
export function formatCoordinate(value: number, decimals: number = 4): string {
  return value.toFixed(decimals);
}

/**
 * Format coordinates as display string (e.g., "40.7128°N, 74.0060°W")
 *
 * @param lat - Latitude
 * @param lng - Longitude
 * @param decimals - Number of decimal places
 * @returns Formatted coordinate string
 */
export function formatCoordinatePair(lat: number, lng: number, decimals: number = 4): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';

  const latStr = Math.abs(lat).toFixed(decimals);
  const lngStr = Math.abs(lng).toFixed(decimals);

  return `${latStr}°${latDir}, ${lngStr}°${lngDir}`;
}
