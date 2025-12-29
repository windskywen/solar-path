/**
 * 3D Solar Path Geometry Utilities
 * Converts azimuth/altitude to 3D positions using deck.gl METER_OFFSETS coordinate system.
 *
 * Coordinate System (ENU convention):
 * - Position array: [east, north, up]
 * - East = +X direction (positive toward 90° azimuth)
 * - North = +Y direction (positive toward 0° azimuth)
 * - Up = +Z direction (positive toward zenith)
 */

/**
 * Visual constants for 3D rendering.
 */
export const SOLAR_3D_CONSTANTS = {
  /** Radius of the sun path arc in meters */
  PATH_RADIUS_METERS: 1200,
  /** Radius of the ground plane in meters */
  GROUND_RADIUS_METERS: 1400,
  /** Height scale factor for altitude */
  HEIGHT_SCALE: 1.0,
  /** Point radius in pixels (normal) */
  POINT_RADIUS: 12,
  /** Point radius in pixels (selected) */
  POINT_RADIUS_SELECTED: 18,
  /** Path line width in pixels */
  PATH_WIDTH: 4,
} as const;

/**
 * Color palette for daylight states (RGBA format for deck.gl).
 */
export const SOLAR_3D_COLORS = {
  /** Golden hour points - warm amber */
  golden: [255, 160, 0, 255] as [number, number, number, number],
  /** Daytime points - bright yellow/orange */
  day: [255, 193, 7, 255] as [number, number, number, number],
  /** Selected point highlight - deep red-orange */
  selected: [255, 87, 34, 255] as [number, number, number, number],
  /** Path line color - modern blue-grey */
  path: [52, 152, 219, 200] as [number, number, number, number],
  /** Shadow path color - subtle gray */
  shadowPath: [0, 0, 0, 30] as [number, number, number, number],
  /** Ground plane fill - light blue tint to distinguish from map */
  ground: [33, 150, 243, 30] as [number, number, number, number],
  /** Compass lines - medium gray */
  compassLines: [149, 165, 166, 200] as [number, number, number, number],
  /** Compass text - dark gray */
  compassText: [44, 62, 80, 255] as [number, number, number, number],
  /** Location marker - distinct red */
  locationMarker: [231, 76, 60, 255] as [number, number, number, number],
  /** Connector lines (center to sun) - faint yellow/orange */
  connectorLines: [255, 193, 7, 80] as [number, number, number, number],
} as const;

/**
 * Convert degrees to radians.
 */
export function degToRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Compute 3D position from azimuth and altitude.
 *
 * Mapping function:
 * - a = degToRad(azimuthDeg) where azimuth is 0°=North, 90°=East
 * - h = degToRad(altitudeDeg)
 * - east  = R × cos(h) × sin(a)
 * - north = R × cos(h) × cos(a)
 * - up    = R × sin(h) × heightScale
 *
 * @param azimuthDeg - Azimuth in degrees (0-360°, 0° = North, 90° = East)
 * @param altitudeDeg - Altitude in degrees above horizon (should be ≥ 0 for visible hours)
 * @param radiusMeters - Visual radius of the sun path arc in meters
 * @param heightScale - Scale factor for the up component
 * @returns Position array [east, north, up] in meters
 */
export function computePosition(
  azimuthDeg: number,
  altitudeDeg: number,
  radiusMeters: number = SOLAR_3D_CONSTANTS.PATH_RADIUS_METERS,
  heightScale: number = SOLAR_3D_CONSTANTS.HEIGHT_SCALE
): [number, number, number] {
  const a = degToRad(azimuthDeg);
  const h = degToRad(altitudeDeg);

  const cosH = Math.cos(h);
  const sinH = Math.sin(h);
  const sinA = Math.sin(a);
  const cosA = Math.cos(a);

  const east = radiusMeters * cosH * sinA;
  const north = radiusMeters * cosH * cosA;
  const up = radiusMeters * sinH * heightScale;

  return [east, north, up];
}
