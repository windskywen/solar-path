/**
 * 3D Solar Path View - TypeScript Type Definitions
 * Based on data-model.md specification for feature 002-3d-solar-path-view
 */

import type { HourlySolarPosition, LocationPoint } from './solar';

// ============================================================================
// Snapshot Types (Captured when modal opens)
// ============================================================================

/**
 * Static snapshot of solar data captured when 3D modal opens.
 * Modal renders from this snapshot and does not react to store changes.
 */
export interface Solar3DSnapshot {
  /** Geographic location */
  location: LocationPoint;
  /** Selected date in YYYY-MM-DD format */
  dateISO: string;
  /** Timezone identifier */
  timezone: string;
  /** All 24 hourly positions (includes night hours) */
  hourly: HourlySolarPosition[];
  /** Currently selected hour, or null if none */
  selectedHour: number | null;
}

// ============================================================================
// 3D Point Types
// ============================================================================

/**
 * A single hourly point in 3D space.
 * Only created for visible hours (altitudeDeg >= 0).
 */
export interface Solar3DPoint {
  /** Hour of day (0-23) */
  hour: number;
  /** Formatted time label (e.g., "14:00") */
  localTimeLabel: string;
  /** Azimuth in degrees from North (0-360°) */
  azimuthDeg: number;
  /** Altitude in degrees above horizon (≥ 0) */
  altitudeDeg: number;
  /** Daylight classification (never 'night' for visible points) */
  daylightState: 'golden' | 'day';
  /**
   * 3D position in meters relative to location origin.
   * [east, north, up] for deck.gl METER_OFFSETS coordinate system.
   */
  position: [number, number, number];
}

/**
 * Polyline connecting visible hourly points in ascending hour order.
 */
export interface Solar3DPath {
  /**
   * Sequence of 3D positions forming the path.
   * Each position is [east, north, up] in meters.
   * Points are ordered by hour (ascending).
   */
  positions: [number, number, number][];
}

// ============================================================================
// Aggregated View Data
// ============================================================================

/**
 * Complete derived data for 3D view rendering.
 */
export interface Solar3DViewData {
  /** Original snapshot data */
  snapshot: Solar3DSnapshot;
  /** Visible hourly points with 3D positions */
  visiblePoints: Solar3DPoint[];
  /** Polyline path connecting visible points */
  path: Solar3DPath;
  /** Whether selectedHour is present AND visible */
  isSelectedVisible: boolean;
  /** True if no visible points (polar night) */
  isEmpty: boolean;
}

// ============================================================================
// Tooltip & Camera State
// ============================================================================

/**
 * Tooltip display state.
 * Null when no tooltip should be shown.
 */
export type Solar3DTooltipData = {
  /** Screen X coordinate for tooltip positioning */
  x: number;
  /** Screen Y coordinate for tooltip positioning */
  y: number;
  /** Hour being hovered */
  hour: number;
  /** Formatted time label */
  localTimeLabel: string;
  /** Azimuth in degrees */
  azimuthDeg: number;
  /** Altitude in degrees */
  altitudeDeg: number;
  /** Daylight state */
  daylightState: string;
} | null;

/**
 * 3D map camera state.
 */
export interface Solar3DCameraState {
  /** Map center [longitude, latitude] */
  center: [number, number];
  /** Zoom level */
  zoom: number;
  /** Camera pitch in degrees (0 = top-down, 60 = 3D view) */
  pitch: number;
  /** Camera bearing in degrees (0 = north up) */
  bearing: number;
}
