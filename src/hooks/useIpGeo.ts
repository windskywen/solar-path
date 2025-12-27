/**
 * useIpGeo Hook
 *
 * Fetches initial location on app load with fallback chain:
 * 1. IP geolocation API
 * 2. Fallback to default location (Taipei) if IP geo fails
 *
 * The GPS prompt is handled separately by the LocationInput component.
 *
 * @see contracts/api.md for API specification
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import type { IpGeoResponse, LocationPoint } from '@/types/solar';

// Default fallback location (Taipei, Taiwan)
const DEFAULT_LOCATION: LocationPoint = {
  lat: 25.033,
  lng: 121.5654,
  name: 'Taipei, Taiwan (default)',
  source: 'fallback',
};

/**
 * Fetch IP geolocation from the API
 */
async function fetchIpGeo(): Promise<IpGeoResponse> {
  const response = await fetch('/api/ip-geo', {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `IP geo request failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Convert IP geo response to LocationPoint
 */
function toLocationPoint(ipGeo: IpGeoResponse): LocationPoint {
  const name = [ipGeo.city, ipGeo.country].filter(Boolean).join(', ') || 'Unknown location';

  return {
    lat: ipGeo.lat,
    lng: ipGeo.lng,
    name,
    source: 'ip',
  };
}

export interface UseIpGeoResult {
  /** Location from IP geolocation, or default if unavailable */
  location: LocationPoint;
  /** Whether the IP geo request is in progress */
  isLoading: boolean;
  /** Error message if request failed (location will be default) */
  error: string | null;
  /** Whether the location is the default fallback */
  isDefault: boolean;
  /** Refetch the IP geolocation */
  refetch: () => void;
}

/**
 * Hook to fetch initial location based on IP address
 *
 * Features:
 * - Automatically fetches on mount
 * - Falls back to Taipei if request fails
 * - Caches result for session
 * - Never blocks app initialization
 *
 * @example
 * ```tsx
 * const { location, isLoading, isDefault } = useIpGeo();
 *
 * if (isLoading) {
 *   return <Spinner />;
 * }
 *
 * // location is always available (either from IP or default)
 * console.log(location.lat, location.lng, location.label);
 * ```
 */
export function useIpGeo(): UseIpGeoResult {
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['ip-geo'],
    queryFn: fetchIpGeo,
    // Only fetch once on mount
    staleTime: Infinity,
    gcTime: Infinity,
    // Don't retry on failure - just use default
    retry: false,
    // Don't refetch on window focus
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  // Always return a valid location (either from IP or default)
  const location = data ? toLocationPoint(data) : DEFAULT_LOCATION;
  const isDefault = !data;

  return {
    location,
    isLoading,
    error: error instanceof Error ? error.message : error ? String(error) : null,
    isDefault,
    refetch: () => {
      refetch();
    },
  };
}

/**
 * Get the default fallback location
 * Useful for components that need a location immediately
 */
export function getDefaultLocation(): LocationPoint {
  return { ...DEFAULT_LOCATION };
}
