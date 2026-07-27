/**
 * Global address autocomplete backed by /api/geocode.
 *
 * TomTom requests are debounced and never retained by React Query after the
 * active search. Nominatim is only requested through requestFallback().
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { LocationPoint } from '@/types/solar';
import type {
  GeocodeProvider,
  GeocodeResponse,
  GeocodeResult,
} from '@/lib/geocode/providers';

const DEBOUNCE_DELAY = 500;
const CJK_QUERY_LENGTH = 2;
const OTHER_QUERY_LENGTH = 3;
const CJK_PATTERN = /[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff\uac00-\ud7af]/u;

export function minimumGeocodeQueryLength(query: string): number {
  return CJK_PATTERN.test(query) ? CJK_QUERY_LENGTH : OTHER_QUERY_LENGTH;
}

export function isGeocodeQueryEligible(query: string): boolean {
  const trimmedQuery = query.trim();
  return trimmedQuery.length >= minimumGeocodeQueryLength(trimmedQuery);
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

interface FetchGeocodeOptions {
  query: string;
  limit: number;
  mode: 'autocomplete' | 'fallback';
  signal?: AbortSignal;
  lat?: number;
  lng?: number;
}

export async function fetchGeocode({
  query,
  limit,
  mode,
  signal,
  lat,
  lng,
}: FetchGeocodeOptions): Promise<GeocodeResponse> {
  const params = new URLSearchParams({
    q: query,
    limit: limit.toString(),
    mode,
  });

  if (mode === 'autocomplete') {
    if (lat !== undefined && lng !== undefined) {
      params.set('lat', lat.toString());
      params.set('lng', lng.toString());
    }
  }

  const response = await fetch(`/api/geocode?${params}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    cache: 'no-store',
    signal,
  });

  const data = (await response.json().catch(() => null)) as GeocodeResponse | null;
  if (
    data &&
    (data.provider === 'tomtom' || data.provider === 'nominatim') &&
    Array.isArray(data.results)
  ) {
    return data;
  }

  throw new Error(`Geocode request failed: ${response.status}`);
}

export interface UseGeocodeOptions {
  /** Maximum number of results to return (1-5) */
  limit?: number;
  /** Debounce delay in milliseconds */
  debounceMs?: number;
  /** Whether the hook is enabled */
  enabled?: boolean;
  /** Current selected position used only as a soft result bias */
  bias?: {
    lat: number;
    lng: number;
  };
}

export interface UseGeocodeResult {
  query: string;
  setQuery: (query: string) => void;
  results: GeocodeResult[];
  provider: GeocodeProvider | null;
  attribution: string;
  isLoading: boolean;
  isDebouncing: boolean;
  error: string | null;
  fallbackAvailable: boolean;
  requestFallback: () => Promise<void>;
  clear: () => void;
  canSearch: boolean;
  toLocationPoint: (result: GeocodeResult) => LocationPoint;
}

interface FallbackState {
  query: string;
  response: GeocodeResponse;
}

export function useGeocode(options: UseGeocodeOptions = {}): UseGeocodeResult {
  const {
    limit = 5,
    debounceMs = DEBOUNCE_DELAY,
    enabled = true,
    bias,
  } = options;
  const queryClient = useQueryClient();
  const [query, setQueryState] = useState('');
  const [fallbackState, setFallbackState] = useState<FallbackState | null>(null);
  const [fallbackError, setFallbackError] = useState<string | null>(null);
  const [isFallbackLoading, setIsFallbackLoading] = useState(false);
  const fallbackAttemptedQueryRef = useRef<string | null>(null);
  const fallbackAbortRef = useRef<AbortController | null>(null);
  const debouncedQuery = useDebounce(query, debounceMs);

  const trimmedQuery = query.trim();
  const trimmedDebouncedQuery = debouncedQuery.trim();
  const canSearch = enabled && isGeocodeQueryEligible(trimmedQuery);
  const shouldSearch =
    enabled &&
    trimmedQuery === trimmedDebouncedQuery &&
    isGeocodeQueryEligible(trimmedDebouncedQuery);
  const isDebouncing = canSearch && query !== debouncedQuery;

  const {
    data: autocompleteResponse,
    isFetching: isAutocompleteLoading,
    error: autocompleteError,
  } = useQuery({
    queryKey: [
      'geocode',
      'autocomplete',
      trimmedDebouncedQuery,
      limit,
      bias?.lat ?? null,
      bias?.lng ?? null,
    ],
    queryFn: ({ signal }) =>
      fetchGeocode({
        query: trimmedDebouncedQuery,
        limit,
        mode: 'autocomplete',
        signal,
        lat: bias?.lat,
        lng: bias?.lng,
      }),
    enabled: shouldSearch,
    retry: false,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  const setQuery = useCallback(
    (nextQuery: string) => {
      fallbackAbortRef.current?.abort();
      fallbackAbortRef.current = null;
      fallbackAttemptedQueryRef.current = null;
      setFallbackState(null);
      setFallbackError(null);
      setIsFallbackLoading(false);
      void queryClient.cancelQueries({ queryKey: ['geocode', 'autocomplete'] });
      setQueryState(nextQuery);
    },
    [queryClient]
  );

  const clear = useCallback(() => setQuery(''), [setQuery]);

  useEffect(
    () => () => {
      fallbackAbortRef.current?.abort();
    },
    []
  );

  const currentFallbackResponse =
    fallbackState?.query === trimmedQuery ? fallbackState.response : undefined;
  const activeResponse = currentFallbackResponse || (!isDebouncing ? autocompleteResponse : undefined);

  const networkFallbackAvailable = Boolean(autocompleteError) && canSearch;
  const fallbackAvailable =
    !currentFallbackResponse &&
    (activeResponse?.fallbackAvailable === true || networkFallbackAvailable);

  const requestFallback = useCallback(async () => {
    const fallbackQuery = query.trim();
    if (
      !isGeocodeQueryEligible(fallbackQuery) ||
      !fallbackAvailable ||
      fallbackAttemptedQueryRef.current === fallbackQuery
    ) {
      return;
    }

    fallbackAttemptedQueryRef.current = fallbackQuery;
    fallbackAbortRef.current?.abort();
    const controller = new AbortController();
    fallbackAbortRef.current = controller;
    setIsFallbackLoading(true);
    setFallbackError(null);

    try {
      const response = await fetchGeocode({
        query: fallbackQuery,
        limit,
        mode: 'fallback',
        signal: controller.signal,
      });
      setFallbackState({ query: fallbackQuery, response });
      if (response.error) setFallbackError(response.error);
    } catch (error) {
      if (controller.signal.aborted) return;
      setFallbackError(
        error instanceof Error
          ? error.message
          : 'Fallback address search is unavailable. Use GPS or enter coordinates manually.'
      );
    } finally {
      if (fallbackAbortRef.current === controller) {
        fallbackAbortRef.current = null;
        setIsFallbackLoading(false);
      }
    }
  }, [fallbackAvailable, limit, query]);

  const toLocationPoint = useCallback(
    (result: GeocodeResult): LocationPoint => ({
      lat: result.lat,
      lng: result.lng,
      name: result.displayName,
      osmUrl: result.osmUrl,
      source: 'search',
    }),
    []
  );

  const error =
    fallbackError ||
    activeResponse?.error ||
    (autocompleteError && canSearch
      ? 'Autocomplete unavailable — press Enter to search'
      : null);

  return {
    query,
    setQuery,
    results: activeResponse?.results ?? [],
    provider: activeResponse?.provider ?? null,
    attribution: activeResponse?.attribution ?? '',
    isLoading: canSearch && (isDebouncing || isAutocompleteLoading || isFallbackLoading),
    isDebouncing,
    error,
    fallbackAvailable,
    requestFallback,
    clear,
    canSearch,
    toLocationPoint,
  };
}

export async function geocodeLocation(query: string, limit = 5): Promise<GeocodeResult[]> {
  const trimmedQuery = query.trim();
  if (!isGeocodeQueryEligible(trimmedQuery)) return [];

  const response = await fetchGeocode({
    query: trimmedQuery,
    limit,
    mode: 'autocomplete',
  });
  return response.results;
}
