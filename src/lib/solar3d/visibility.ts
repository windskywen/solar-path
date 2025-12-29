/**
 * 3D Solar Path Visibility Utilities
 * Filters visible hours and builds 3D point/path data structures.
 */

import type { HourlySolarPosition } from '@/types/solar';
import type { Solar3DPoint, Solar3DPath } from '@/types/solar3d';
import { computePosition } from './geometry';

/**
 * Filter hourly positions to only include visible hours (altitude >= 0).
 *
 * @param hourly - Array of all 24 hourly positions
 * @returns Array of hourly positions where altitudeDeg >= 0
 */
export function filterVisibleHours(hourly: HourlySolarPosition[]): HourlySolarPosition[] {
  return hourly.filter((h) => h.altitudeDeg >= 0);
}

/**
 * Build Solar3DPoint array from visible hourly positions.
 * Each point includes the computed 3D position [east, north, up].
 *
 * @param visibleHours - Array of visible hourly positions (altitude >= 0)
 * @returns Array of Solar3DPoint with computed 3D positions
 */
export function buildSolar3DPoints(visibleHours: HourlySolarPosition[]): Solar3DPoint[] {
  return visibleHours.map((h) => ({
    hour: h.hour,
    localTimeLabel: h.localTimeLabel,
    azimuthDeg: h.azimuthDeg,
    altitudeDeg: h.altitudeDeg,
    // Visible hours are never 'night', only 'golden' or 'day'
    daylightState: h.daylightState as 'golden' | 'day',
    position: computePosition(h.azimuthDeg, h.altitudeDeg),
  }));
}

/**
 * Build path from Solar3DPoint array.
 * Points are sorted by hour in ascending order.
 *
 * @param points - Array of Solar3DPoint
 * @returns Solar3DPath with positions in hour order
 */
export function buildSolar3DPath(points: Solar3DPoint[]): Solar3DPath {
  // Sort by hour ascending to ensure correct path order
  const sorted = [...points].sort((a, b) => a.hour - b.hour);
  return {
    positions: sorted.map((p) => p.position),
  };
}

/**
 * Check if the selected hour is visible (altitude >= 0).
 *
 * @param selectedHour - Currently selected hour (0-23) or null
 * @param hourly - Array of all 24 hourly positions
 * @returns true if selectedHour is present AND that hour has altitude >= 0
 */
export function isSelectedHourVisible(
  selectedHour: number | null,
  hourly: HourlySolarPosition[]
): boolean {
  if (selectedHour === null || selectedHour === undefined) {
    return false;
  }
  const hour = hourly[selectedHour];
  return hour !== undefined && hour.altitudeDeg >= 0;
}
