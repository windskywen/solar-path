/**
 * Ray Geometry Calculations
 *
 * Computes solar ray endpoints for map visualization.
 * Rays extend from center point to viewport edge in the direction of the sun's azimuth.
 */

import type { HourlySolarPosition, LocationPoint } from '@/types/solar';

/**
 * GeoJSON LineString feature for a solar ray
 */
export interface RayFeature {
  type: 'Feature';
  id: string;
  properties: {
    hour: number;
    azimuthDeg: number;
    altitudeDeg: number;
    daylightState: 'night' | 'golden' | 'day';
  };
  geometry: {
    type: 'LineString';
    coordinates: [number, number][];
  };
}

/**
 * GeoJSON FeatureCollection of solar rays
 */
export interface RayFeatureCollection {
  type: 'FeatureCollection';
  features: RayFeature[];
}

/**
 * Map viewport bounds
 */
export interface ViewportBounds {
  north: number; // max latitude
  south: number; // min latitude
  east: number; // max longitude
  west: number; // min longitude
}

/**
 * Calculate the destination point given a start point, bearing, and distance
 *
 * Uses the Haversine formula for accurate geodetic calculations
 *
 * @param lat - Starting latitude in degrees
 * @param lng - Starting longitude in degrees
 * @param bearingDeg - Bearing in degrees (0=North, 90=East, 180=South, 270=West)
 * @param distanceKm - Distance in kilometers
 * @returns [lng, lat] coordinate pair
 */
export function destinationPoint(
  lat: number,
  lng: number,
  bearingDeg: number,
  distanceKm: number
): [number, number] {
  const R = 6371; // Earth's radius in km
  const d = distanceKm / R; // Angular distance

  const lat1 = (lat * Math.PI) / 180;
  const lng1 = (lng * Math.PI) / 180;
  const brng = (bearingDeg * Math.PI) / 180;

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(brng)
  );

  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(brng) * Math.sin(d) * Math.cos(lat1),
      Math.cos(d) - Math.sin(lat1) * Math.sin(lat2)
    );

  // Convert back to degrees
  const destLat = (lat2 * 180) / Math.PI;
  let destLng = (lng2 * 180) / Math.PI;

  // Normalize longitude to -180..180
  destLng = ((destLng + 540) % 360) - 180;

  return [destLng, destLat];
}

/**
 * Calculate appropriate ray length based on viewport size
 *
 * Rays should extend beyond the visible viewport to ensure they
 * appear to go "off screen" rather than stopping mid-view.
 *
 * @param bounds - Viewport bounds
 * @returns Ray length in kilometers
 */
export function calculateRayLength(bounds: ViewportBounds): number {
  // Calculate viewport diagonal in degrees
  const latDiff = bounds.north - bounds.south;
  const lngDiff = bounds.east - bounds.west;

  // Handle date line crossing
  const adjustedLngDiff = lngDiff < 0 ? lngDiff + 360 : lngDiff;

  // Approximate diagonal distance
  // At equator, 1 degree ≈ 111 km
  // We'll use a simplified calculation
  const avgLat = (bounds.north + bounds.south) / 2;
  const latKm = latDiff * 111;
  const lngKm = adjustedLngDiff * 111 * Math.cos((avgLat * Math.PI) / 180);

  const diagonalKm = Math.sqrt(latKm * latKm + lngKm * lngKm);

  // Return 1.5x the diagonal to ensure rays extend past viewport
  return Math.max(diagonalKm * 1.5, 50); // Minimum 50km
}

/**
 * Calculate default ray length when viewport bounds are not available
 *
 * @param zoomLevel - Map zoom level (0-22)
 * @returns Ray length in kilometers
 */
export function defaultRayLength(zoomLevel: number = 10): number {
  // Approximate visible area width at different zoom levels
  // Zoom 0 ≈ 40000 km, each zoom halves the width
  const worldWidth = 40075; // Earth circumference in km
  const visibleWidth = worldWidth / Math.pow(2, zoomLevel);

  // Return 1.5x visible width
  return Math.max(visibleWidth * 1.5, 10);
}

/**
 * Create a single ray feature for a given hour
 *
 * @param center - Center location
 * @param position - Solar position for this hour
 * @param rayLengthKm - Length of ray in km
 * @returns GeoJSON Feature for the ray
 */
export function createRayFeature(
  center: LocationPoint,
  position: HourlySolarPosition,
  rayLengthKm: number
): RayFeature {
  // Calculate endpoint using azimuth
  const endpoint = destinationPoint(
    center.lat,
    center.lng,
    position.azimuthDeg,
    rayLengthKm
  );

  return {
    type: 'Feature',
    id: `ray-${position.hour}`,
    properties: {
      hour: position.hour,
      azimuthDeg: position.azimuthDeg,
      altitudeDeg: position.altitudeDeg,
      daylightState: position.daylightState,
    },
    geometry: {
      type: 'LineString',
      coordinates: [
        [center.lng, center.lat], // Start at center
        endpoint, // End at calculated point
      ],
    },
  };
}

/**
 * Create GeoJSON FeatureCollection for all 24 hourly rays
 *
 * @param center - Center location
 * @param positions - Array of 24 hourly positions
 * @param rayLengthKm - Length of rays in km (default: 100km)
 * @returns GeoJSON FeatureCollection
 */
export function createRayCollection(
  center: LocationPoint,
  positions: HourlySolarPosition[],
  rayLengthKm: number = 100
): RayFeatureCollection {
  const features = positions.map((position) =>
    createRayFeature(center, position, rayLengthKm)
  );

  return {
    type: 'FeatureCollection',
    features,
  };
}

/**
 * Create rays that adapt to viewport bounds
 *
 * @param center - Center location
 * @param positions - Array of 24 hourly positions
 * @param bounds - Current viewport bounds
 * @returns GeoJSON FeatureCollection
 */
export function createAdaptiveRayCollection(
  center: LocationPoint,
  positions: HourlySolarPosition[],
  bounds: ViewportBounds
): RayFeatureCollection {
  const rayLength = calculateRayLength(bounds);
  return createRayCollection(center, positions, rayLength);
}

/**
 * Filter rays to only include those above the horizon (daytime)
 *
 * @param collection - Full ray collection
 * @returns Collection with only above-horizon rays
 */
export function filterAboveHorizon(
  collection: RayFeatureCollection
): RayFeatureCollection {
  return {
    ...collection,
    features: collection.features.filter(
      (f) => f.properties.altitudeDeg > 0
    ),
  };
}

/**
 * Get rays grouped by daylight state
 *
 * Useful for styling different ray types with different colors
 *
 * @param collection - Ray collection
 * @returns Object with arrays of rays by state
 */
export function groupRaysByState(collection: RayFeatureCollection): {
  night: RayFeature[];
  golden: RayFeature[];
  day: RayFeature[];
} {
  const result = {
    night: [] as RayFeature[],
    golden: [] as RayFeature[],
    day: [] as RayFeature[],
  };

  for (const feature of collection.features) {
    result[feature.properties.daylightState].push(feature);
  }

  return result;
}
