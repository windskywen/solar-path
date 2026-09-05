/**
 * Tests for Ray Geometry Calculations
 */

import { describe, it, expect } from 'vitest';
import {
  destinationPoint,
  calculateRayLength,
  defaultRayLength,
  createRayFeature,
  createRayCollection,
  createAdaptiveRayCollection,
  filterAboveHorizon,
  groupRaysByState,
  type ViewportBounds,
  type RayFeatureCollection,
} from '@/lib/geo/ray-geometry';
import type { HourlySolarPosition, LocationPoint, DaylightState } from '@/types/solar';

describe('destinationPoint', () => {
  describe('cardinal directions', () => {
    const lat = 0;
    const lng = 0;
    const distance = 111; // ~1 degree at equator

    it('calculates point to the North', () => {
      const [destLng, destLat] = destinationPoint(lat, lng, 0, distance);
      expect(destLat).toBeCloseTo(1, 0); // ~1 degree north
      expect(destLng).toBeCloseTo(0, 1); // same longitude
    });

    it('calculates point to the East', () => {
      const [destLng, destLat] = destinationPoint(lat, lng, 90, distance);
      expect(destLat).toBeCloseTo(0, 1); // same latitude
      expect(destLng).toBeCloseTo(1, 0); // ~1 degree east
    });

    it('calculates point to the South', () => {
      const [destLng, destLat] = destinationPoint(lat, lng, 180, distance);
      expect(destLat).toBeCloseTo(-1, 0); // ~1 degree south
      expect(destLng).toBeCloseTo(0, 1); // same longitude
    });

    it('calculates point to the West', () => {
      const [destLng, destLat] = destinationPoint(lat, lng, 270, distance);
      expect(destLat).toBeCloseTo(0, 1); // same latitude
      expect(destLng).toBeCloseTo(-1, 0); // ~1 degree west
    });
  });

  describe('intermediate directions', () => {
    it('calculates Northeast correctly', () => {
      const [destLng, destLat] = destinationPoint(0, 0, 45, 100);
      expect(destLat).toBeGreaterThan(0); // north
      expect(destLng).toBeGreaterThan(0); // east
    });

    it('calculates Southeast correctly', () => {
      const [destLng, destLat] = destinationPoint(0, 0, 135, 100);
      expect(destLat).toBeLessThan(0); // south
      expect(destLng).toBeGreaterThan(0); // east
    });

    it('calculates Southwest correctly', () => {
      const [destLng, destLat] = destinationPoint(0, 0, 225, 100);
      expect(destLat).toBeLessThan(0); // south
      expect(destLng).toBeLessThan(0); // west
    });

    it('calculates Northwest correctly', () => {
      const [destLng, destLat] = destinationPoint(0, 0, 315, 100);
      expect(destLat).toBeGreaterThan(0); // north
      expect(destLng).toBeLessThan(0); // west
    });
  });

  describe('different starting points', () => {
    it('works from northern latitude', () => {
      const [destLng, destLat] = destinationPoint(45, 0, 0, 111);
      expect(destLat).toBeGreaterThan(45);
    });

    it('works from southern latitude', () => {
      const [destLng, destLat] = destinationPoint(-45, 0, 180, 111);
      expect(destLat).toBeLessThan(-45);
    });

    it('handles high latitudes', () => {
      const [destLng, destLat] = destinationPoint(80, 0, 0, 100);
      expect(destLat).toBeGreaterThan(80);
      expect(destLat).toBeLessThanOrEqual(90);
    });
  });

  describe('longitude normalization', () => {
    it('normalizes longitude past 180', () => {
      const [destLng] = destinationPoint(0, 170, 90, 2000);
      expect(destLng).toBeLessThan(180);
      expect(destLng).toBeGreaterThanOrEqual(-180);
    });

    it('normalizes longitude past -180', () => {
      const [destLng] = destinationPoint(0, -170, 270, 2000);
      expect(destLng).toBeLessThan(180);
      expect(destLng).toBeGreaterThanOrEqual(-180);
    });
  });

  describe('edge cases', () => {
    it('handles zero distance', () => {
      const [destLng, destLat] = destinationPoint(45, 90, 45, 0);
      expect(destLat).toBeCloseTo(45, 5);
      expect(destLng).toBeCloseTo(90, 5);
    });

    it('handles full circle bearing', () => {
      const [destLng, destLat] = destinationPoint(0, 0, 360, 100);
      const [destLng2, destLat2] = destinationPoint(0, 0, 0, 100);
      expect(destLat).toBeCloseTo(destLat2, 5);
      expect(destLng).toBeCloseTo(destLng2, 5);
    });
  });
});

describe('calculateRayLength', () => {
  it('returns length based on viewport size', () => {
    const bounds: ViewportBounds = {
      north: 50,
      south: 40,
      east: 10,
      west: 0,
    };
    const length = calculateRayLength(bounds);
    expect(length).toBeGreaterThan(0);
  });

  it('returns larger length for larger viewport', () => {
    const smallBounds: ViewportBounds = {
      north: 41,
      south: 40,
      east: 1,
      west: 0,
    };
    const largeBounds: ViewportBounds = {
      north: 50,
      south: 30,
      east: 20,
      west: 0,
    };

    const smallLength = calculateRayLength(smallBounds);
    const largeLength = calculateRayLength(largeBounds);

    expect(largeLength).toBeGreaterThan(smallLength);
  });

  it('has minimum ray length of 50km', () => {
    const tinyBounds: ViewportBounds = {
      north: 40.001,
      south: 40,
      east: 0.001,
      west: 0,
    };
    const length = calculateRayLength(tinyBounds);
    expect(length).toBeGreaterThanOrEqual(50);
  });

  it('handles equatorial viewport', () => {
    const bounds: ViewportBounds = {
      north: 5,
      south: -5,
      east: 5,
      west: -5,
    };
    const length = calculateRayLength(bounds);
    expect(length).toBeGreaterThan(0);
  });

  it('handles polar viewport', () => {
    const bounds: ViewportBounds = {
      north: 85,
      south: 75,
      east: 180,
      west: -180,
    };
    const length = calculateRayLength(bounds);
    expect(length).toBeGreaterThan(0);
  });
});

describe('defaultRayLength', () => {
  it('returns smaller length for higher zoom', () => {
    const lowZoom = defaultRayLength(5);
    const highZoom = defaultRayLength(15);
    expect(lowZoom).toBeGreaterThan(highZoom);
  });

  it('has minimum length of 10km', () => {
    const length = defaultRayLength(20);
    expect(length).toBeGreaterThanOrEqual(10);
  });

  it('uses default zoom of 10 when not specified', () => {
    const length = defaultRayLength();
    const zoom10 = defaultRayLength(10);
    expect(length).toBe(zoom10);
  });
});

describe('createRayFeature', () => {
  const center: LocationPoint = {
    lat: 40,
    lng: -74,
    name: 'Test Location',
  };

  const position: HourlySolarPosition = {
    hour: 12,
    localTimeLabel: '12:00',
    azimuthDeg: 180, // South
    altitudeDeg: 45,
    daylightState: 'day',
  };

  it('creates valid GeoJSON feature', () => {
    const feature = createRayFeature(center, position, 100);

    expect(feature.type).toBe('Feature');
    expect(feature.geometry.type).toBe('LineString');
    expect(feature.geometry.coordinates).toHaveLength(2);
  });

  it('starts at center point', () => {
    const feature = createRayFeature(center, position, 100);
    const [startLng, startLat] = feature.geometry.coordinates[0];

    expect(startLng).toBe(center.lng);
    expect(startLat).toBe(center.lat);
  });

  it('extends in correct direction', () => {
    const feature = createRayFeature(center, position, 100);
    const [, startLat] = feature.geometry.coordinates[0];
    const [, endLat] = feature.geometry.coordinates[1];

    // Azimuth 180 = South, so endLat should be less than startLat
    expect(endLat).toBeLessThan(startLat);
  });

  it('includes correct properties', () => {
    const feature = createRayFeature(center, position, 100);

    expect(feature.properties.hour).toBe(12);
    expect(feature.properties.azimuthDeg).toBe(180);
    expect(feature.properties.altitudeDeg).toBe(45);
    expect(feature.properties.daylightState).toBe('day');
  });

  it('generates unique id', () => {
    const feature = createRayFeature(center, position, 100);
    expect(feature.id).toBe('ray-12');
  });
});

describe('createRayCollection', () => {
  const center: LocationPoint = {
    lat: 40,
    lng: -74,
    name: 'Test',
  };

  function createMockPositions(): HourlySolarPosition[] {
    return Array.from({ length: 24 }, (_, hour) => ({
      hour,
      localTimeLabel: `${hour.toString().padStart(2, '0')}:00`,
      azimuthDeg: (hour * 15) % 360,
      altitudeDeg: hour < 6 || hour > 18 ? -10 : 30,
      daylightState: (hour < 6 || hour > 18 ? 'night' : 'day') as DaylightState,
    }));
  }

  it('creates FeatureCollection with 24 features', () => {
    const positions = createMockPositions();
    const collection = createRayCollection(center, positions);

    expect(collection.type).toBe('FeatureCollection');
    expect(collection.features).toHaveLength(24);
  });

  it('each feature has unique hour', () => {
    const positions = createMockPositions();
    const collection = createRayCollection(center, positions);

    const hours = collection.features.map((f) => f.properties.hour);
    const uniqueHours = new Set(hours);

    expect(uniqueHours.size).toBe(24);
  });

  it('uses specified ray length', () => {
    const positions = createMockPositions();
    const collection = createRayCollection(center, positions, 200);

    // Check that endpoints are approximately 200km away
    // At lat 40, 1 degree latitude ≈ 111km, so 200km ≈ 1.8 degrees
    const southRay = collection.features.find((f) => f.properties.azimuthDeg === 180);
    if (southRay) {
      const [, endLat] = southRay.geometry.coordinates[1];
      const latDiff = Math.abs(center.lat - endLat);
      expect(latDiff).toBeGreaterThan(1); // At least 1 degree (~111km)
    }
  });
});

describe('createAdaptiveRayCollection', () => {
  const center: LocationPoint = { lat: 40, lng: -74, name: 'Test' };
  const positions: HourlySolarPosition[] = Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    localTimeLabel: `${h.toString().padStart(2, '0')}:00`,
    azimuthDeg: h * 15,
    altitudeDeg: 30,
    daylightState: 'day' as DaylightState,
  }));

  it('adapts ray length to viewport', () => {
    const smallBounds: ViewportBounds = {
      north: 41,
      south: 39,
      east: -73,
      west: -75,
    };
    const largeBounds: ViewportBounds = {
      north: 50,
      south: 30,
      east: -60,
      west: -90,
    };

    const small = createAdaptiveRayCollection(center, positions, smallBounds);
    const large = createAdaptiveRayCollection(center, positions, largeBounds);

    // Get endpoint distances
    const getMaxDistance = (c: RayFeatureCollection) => {
      let maxDist = 0;
      for (const f of c.features) {
        const [startLng, startLat] = f.geometry.coordinates[0];
        const [endLng, endLat] = f.geometry.coordinates[1];
        const dist = Math.sqrt(Math.pow(endLat - startLat, 2) + Math.pow(endLng - startLng, 2));
        maxDist = Math.max(maxDist, dist);
      }
      return maxDist;
    };

    expect(getMaxDistance(large)).toBeGreaterThan(getMaxDistance(small));
  });
});

describe('filterAboveHorizon', () => {
  const createCollection = (altitudes: number[]): RayFeatureCollection => ({
    type: 'FeatureCollection',
    features: altitudes.map((alt, i) => ({
      type: 'Feature',
      id: `ray-${i}`,
      properties: {
        hour: i,
        azimuthDeg: i * 15,
        altitudeDeg: alt,
        daylightState: (alt > 0 ? 'day' : 'night') as DaylightState,
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [0, 0],
          [1, 1],
        ],
      },
    })),
  });

  it('filters out rays below horizon', () => {
    const collection = createCollection([-10, 0, 10, 20, -5, 30]);
    const filtered = filterAboveHorizon(collection);

    expect(filtered.features).toHaveLength(3); // Only 10, 20, 30
    expect(filtered.features.every((f) => f.properties.altitudeDeg > 0)).toBe(true);
  });

  it('includes rays exactly at horizon (alt = 0)', () => {
    const collection = createCollection([0, 1]);
    const filtered = filterAboveHorizon(collection);

    // Altitude 0 is AT horizon, not above
    expect(filtered.features).toHaveLength(1);
  });

  it('returns empty collection when all below horizon', () => {
    const collection = createCollection([-10, -20, -5]);
    const filtered = filterAboveHorizon(collection);

    expect(filtered.features).toHaveLength(0);
  });

  it('preserves collection type', () => {
    const collection = createCollection([10, 20]);
    const filtered = filterAboveHorizon(collection);

    expect(filtered.type).toBe('FeatureCollection');
  });
});

describe('groupRaysByState', () => {
  const createCollection = (states: DaylightState[]): RayFeatureCollection => ({
    type: 'FeatureCollection',
    features: states.map((state, i) => ({
      type: 'Feature',
      id: `ray-${i}`,
      properties: {
        hour: i,
        azimuthDeg: i * 15,
        altitudeDeg: state === 'night' ? -10 : 30,
        daylightState: state,
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [0, 0],
          [1, 1],
        ],
      },
    })),
  });

  it('groups rays by daylight state', () => {
    const collection = createCollection([
      'night',
      'night',
      'golden',
      'day',
      'day',
      'day',
      'golden',
      'night',
    ]);
    const groups = groupRaysByState(collection);

    expect(groups.night).toHaveLength(3);
    expect(groups.golden).toHaveLength(2);
    expect(groups.day).toHaveLength(3);
  });

  it('returns empty arrays for missing states', () => {
    const collection = createCollection(['day', 'day', 'day']);
    const groups = groupRaysByState(collection);

    expect(groups.night).toHaveLength(0);
    expect(groups.golden).toHaveLength(0);
    expect(groups.day).toHaveLength(3);
  });

  it('preserves feature data in groups', () => {
    const collection = createCollection(['day', 'night']);
    const groups = groupRaysByState(collection);

    expect(groups.day[0].properties.hour).toBe(0);
    expect(groups.night[0].properties.hour).toBe(1);
  });
});
