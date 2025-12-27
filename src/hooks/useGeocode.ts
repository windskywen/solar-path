/**
 * useGeocode Hook
 *
 * Provides geocoding functionality with debouncing, caching via React Query.
 * Uses the /api/geocode endpoint which proxies to OpenStreetMap Nominatim.
 *
 * @see contracts/api.md for API specification
 */

'use client';

import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { LocationPoint } from '@/types/solar';

// Debounce delay in ms (increased to reduce API calls while typing)
const DEBOUNCE_DELAY = 800;

// Minimum query length (increased for CJK characters which are more compact)
const MIN_QUERY_LENGTH = 2;

// Types matching API response
export interface GeocodeResult {
  displayName: string;
  lat: number;
  lng: number;
  osmUrl: string;
}

interface GeocodeResponse {
  results: GeocodeResult[];
}

interface GeocodeError {
  error: string;
  code: 'INVALID_QUERY' | 'INVALID_LIMIT' | 'RATE_LIMITED' | 'UPSTREAM_ERROR';
  retryAfter?: number;
}

/**
 * Fetch geocoding results from API
 */
async function fetchGeocode(query: string, limit: number = 5): Promise<GeocodeResult[]> {
  const params = new URLSearchParams({
    q: query,
    limit: limit.toString(),
  });

  const response = await fetch(`/api/geocode?${params}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const errorData: GeocodeError = await response.json().catch(() => ({
      error: `Geocode request failed: ${response.status}`,
      code: 'UPSTREAM_ERROR' as const,
    }));

    if (errorData.code === 'RATE_LIMITED') {
      throw new Error(`Rate limited. Please wait ${errorData.retryAfter || 60} seconds.`);
    }

    throw new Error(errorData.error || 'Geocoding failed');
  }

  const data: GeocodeResponse = await response.json();
  return data.results;
}

/**
 * Debounce hook implementation
 */
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useMemo(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

export interface UseGeocodeOptions {
  /** Maximum number of results to return (1-10) */
  limit?: number;
  /** Debounce delay in milliseconds */
  debounceMs?: number;
  /** Whether the hook is enabled */
  enabled?: boolean;
}

export interface UseGeocodeResult {
  /** Current search query */
  query: string;
  /** Update search query */
  setQuery: (query: string) => void;
  /** Search results */
  results: GeocodeResult[];
  /** Whether a search is in progress */
  isLoading: boolean;
  /** Whether the query is being debounced */
  isDebouncing: boolean;
  /** Error message if search failed */
  error: string | null;
  /** Clear search query and results */
  clear: () => void;
  /** Convert a geocode result to a LocationPoint */
  toLocationPoint: (result: GeocodeResult) => LocationPoint;
}

/**
 * Hook for geocoding location searches with debouncing
 *
 * @example
 * ```tsx
 * const { query, setQuery, results, isLoading } = useGeocode();
 *
 * return (
 *   <input
 *     value={query}
 *     onChange={(e) => setQuery(e.target.value)}
 *     placeholder="Search location..."
 *   />
 *   {isLoading && <span>Searching...</span>}
 *   {results.map((r) => (
 *     <div key={r.osmUrl} onClick={() => selectLocation(toLocationPoint(r))}>
 *       {r.displayName}
 *     </div>
 *   ))}
 * );
 * ```
 */
export function useGeocode(options: UseGeocodeOptions = {}): UseGeocodeResult {
  const { limit = 5, debounceMs = DEBOUNCE_DELAY, enabled = true } = options;

  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, debounceMs);

  // Determine if we should search
  const shouldSearch = enabled && debouncedQuery.trim().length >= MIN_QUERY_LENGTH;
  const isDebouncing = query !== debouncedQuery;

  // Use React Query for caching and request management
  const {
    data: results = [],
    isLoading: isQueryLoading,
    error: queryError,
  } = useQuery({
    queryKey: ['geocode', debouncedQuery, limit],
    queryFn: () => fetchGeocode(debouncedQuery.trim(), limit),
    enabled: shouldSearch,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes (was cacheTime)
    retry: (failureCount, error) => {
      // Don't retry on rate limit
      if (error.message.includes('Rate limited')) return false;
      return failureCount < 2;
    },
  });

  // Clear function
  const clear = useCallback(() => {
    setQuery('');
  }, []);

  // Convert geocode result to LocationPoint
  const toLocationPoint = useCallback((result: GeocodeResult): LocationPoint => {
    return {
      lat: result.lat,
      lng: result.lng,
      name: result.displayName,
      osmUrl: result.osmUrl,
      source: 'search',
    };
  }, []);

  // Determine loading state (includes debouncing)
  const isLoading = shouldSearch && (isQueryLoading || isDebouncing);

  // Extract error message
  const error = queryError ? (queryError as Error).message : null;

  return {
    query,
    setQuery,
    results,
    isLoading,
    isDebouncing,
    error,
    clear,
    toLocationPoint,
  };
}

/**
 * Standalone geocode function for one-off lookups
 * (Not debounced, for direct API calls)
 */
export async function geocodeLocation(query: string, limit: number = 5): Promise<GeocodeResult[]> {
  if (query.trim().length < MIN_QUERY_LENGTH) {
    return [];
  }
  return fetchGeocode(query.trim(), limit);
}
