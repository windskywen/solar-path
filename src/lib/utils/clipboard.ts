/**
 * Clipboard Utilities
 *
 * Helper functions for copying text to clipboard with feedback.
 */

/**
 * Copy text to clipboard using modern Clipboard API with fallback
 *
 * @param text - The text to copy
 * @returns Promise that resolves when copy succeeds
 * @throws Error if clipboard access fails
 */
export async function copyToClipboard(text: string): Promise<void> {
  // Modern Clipboard API (preferred)
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch (err) {
      // Fall through to legacy method
      console.warn('Clipboard API failed, trying fallback', err);
    }
  }

  // Legacy fallback using execCommand
  const textArea = document.createElement('textarea');
  textArea.value = text;

  // Prevent scrolling to bottom
  textArea.style.position = 'fixed';
  textArea.style.left = '-9999px';
  textArea.style.top = '-9999px';

  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    const successful = document.execCommand('copy');
    if (!successful) {
      throw new Error('execCommand copy failed');
    }
  } finally {
    document.body.removeChild(textArea);
  }
}

/**
 * Format a number for clipboard (remove trailing zeros for decimals)
 *
 * @param value - Numeric value
 * @param precision - Decimal precision (default: 4 for lat/lng, 1 for angles)
 * @returns Formatted string
 */
export function formatForClipboard(value: number, precision: number = 4): string {
  return value.toFixed(precision);
}

/**
 * Format coordinates for clipboard
 *
 * @param lat - Latitude
 * @param lng - Longitude
 * @returns Formatted string like "47.6062, -122.3321"
 */
export function formatCoordinates(lat: number, lng: number): string {
  return `${formatForClipboard(lat, 6)}, ${formatForClipboard(lng, 6)}`;
}

/**
 * Format azimuth for clipboard
 *
 * @param azimuth - Azimuth in degrees
 * @returns Formatted string like "180.5°"
 */
export function formatAzimuth(azimuth: number): string {
  return `${formatForClipboard(azimuth, 1)}°`;
}

/**
 * Format altitude for clipboard
 *
 * @param altitude - Altitude in degrees
 * @returns Formatted string like "+45.2°" or "-12.3°"
 */
export function formatAltitude(altitude: number): string {
  const sign = altitude >= 0 ? '+' : '';
  return `${sign}${formatForClipboard(altitude, 1)}°`;
}

/**
 * Copy result types
 */
export interface CopyResult {
  success: boolean;
  message: string;
}

/**
 * Copy with feedback
 *
 * @param text - Text to copy
 * @param label - Description for feedback message
 * @returns Result with success status and message
 */
export async function copyWithFeedback(
  text: string,
  label: string
): Promise<CopyResult> {
  try {
    await copyToClipboard(text);
    return {
      success: true,
      message: `${label} copied to clipboard`,
    };
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return {
      success: false,
      message: 'Failed to copy. Please try selecting and copying manually.',
    };
  }
}
