import type { LocationPoint } from '@/types/solar';

/**
 * Stable example shown in the server-rendered home page before approximate
 * IP location is available. Keep this in one server-safe module so the home
 * store, map and IP-location fallback all use the same coordinates.
 */
export const TAIPEI_EXAMPLE_LOCATION: Readonly<LocationPoint> = {
  lat: 25.033,
  lng: 121.5654,
  name: 'Taipei, Taiwan',
  source: 'fallback',
};

export function getTaipeiExampleLocation(): LocationPoint {
  return { ...TAIPEI_EXAMPLE_LOCATION };
}
