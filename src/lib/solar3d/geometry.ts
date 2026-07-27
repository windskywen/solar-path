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
  golden: [255, 169, 64, 255] as [number, number, number, number],
  /** Daytime points - bright observatory yellow */
  day: [255, 216, 77, 255] as [number, number, number, number],
  /** Selected point highlight - solar orange */
  selected: [255, 112, 48, 255] as [number, number, number, number],
  /** Static selected-point halo */
  selectedHalo: [255, 156, 64, 72] as [number, number, number, number],
  /** Warm trajectory core */
  path: [255, 196, 64, 235] as [number, number, number, number],
  /** Dark trajectory keyline for mixed map backgrounds */
  pathUnderlay: [7, 15, 28, 170] as [number, number, number, number],
  /** Shadow path color - subtle terrain grounding */
  shadowPath: [7, 15, 28, 28] as [number, number, number, number],
  /** Ground plane fill - light blue tint to distinguish from map */
  ground: [33, 150, 243, 30] as [number, number, number, number],
  /** Compass ring and cardinal ticks - cool observatory cyan */
  compassRing: [103, 232, 249, 185] as [number, number, number, number],
  /** Dark compass keyline for contrast over terrain and buildings */
  compassUnderlay: [7, 15, 28, 190] as [number, number, number, number],
  /** Compass text */
  compassText: [241, 245, 249, 255] as [number, number, number, number],
  /** North reference accent */
  compassNorth: [251, 113, 133, 255] as [number, number, number, number],
  /** Location marker - distinct red */
  locationMarker: [231, 76, 60, 255] as [number, number, number, number],
  /** Connector lines (center to sun) - low-interference warm reference */
  connectorLines: [255, 210, 105, 32] as [number, number, number, number],
  /** Milestone label foreground and surface */
  milestoneText: [248, 250, 252, 255] as [number, number, number, number],
  milestoneSurface: [7, 16, 34, 220] as [number, number, number, number],
  milestoneBorder: [103, 232, 249, 105] as [number, number, number, number],
} as const;

export type Solar3DColor = readonly [number, number, number, number];

export function solarColorToCss([red, green, blue, alpha]: Solar3DColor): string {
  return `rgba(${red}, ${green}, ${blue}, ${(alpha / 255).toFixed(3)})`;
}

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
