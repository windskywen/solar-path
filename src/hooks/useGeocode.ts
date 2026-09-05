/**
 * Global address autocomplete backed by /api/geocode.
 *
 * Geoapify autocomplete is debounced. Explicit Search / Enter requests use a
 * full search mode that can automatically fall back to TomTom on empty results.
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
  mode: 'autocomplete' | 'search';
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

  if (lat !== undefined && lng !== undefined) {
    params.set('lat', lat.toString());
    params.set('lng', lng.toString());
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
    (data.provider === 'geoapify' || data.provider === 'tomtom') &&
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
  attributionUrl?: string;
  isLoading: boolean;
  isDebouncing: boolean;
  error: string | null;
  submitSearch: () => Promise<void>;
  clear: () => void;
  canSearch: boolean;
  toLocationPoint: (result: GeocodeResult) => LocationPoint;
}

interface SubmittedSearchState {
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
  const [submittedState, setSubmittedState] = useState<SubmittedSearchState | null>(null);
  const [submittedError, setSubmittedError] = useState<string | null>(null);
  const [isSubmittedLoading, setIsSubmittedLoading] = useState(false);
  const submittedAbortRef = useRef<AbortController | null>(null);
  const submittedQueryRef = useRef<string | null>(null);
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
      submittedAbortRef.current?.abort();
      submittedAbortRef.current = null;
      submittedQueryRef.current = null;
      setSubmittedState(null);
      setSubmittedError(null);
      setIsSubmittedLoading(false);
      void queryClient.cancelQueries({ queryKey: ['geocode', 'autocomplete'] });
      setQueryState(nextQuery);
    },
    [queryClient]
  );

  const clear = useCallback(() => setQuery(''), [setQuery]);

  useEffect(
    () => () => {
      submittedAbortRef.current?.abort();
    },
    []
  );

  const currentSubmittedResponse =
    submittedState?.query === trimmedQuery ? submittedState.response : undefined;
  const activeResponse = currentSubmittedResponse || (!isDebouncing ? autocompleteResponse : undefined);

  const submitSearch = useCallback(async () => {
    const submittedQuery = query.trim();
    if (
      !isGeocodeQueryEligible(submittedQuery) ||
      submittedQueryRef.current === submittedQuery
    ) return;

    submittedAbortRef.current?.abort();
    submittedQueryRef.current = submittedQuery;
    const controller = new AbortController();
    submittedAbortRef.current = controller;
    setIsSubmittedLoading(true);
    setSubmittedError(null);

    try {
      const response = await fetchGeocode({
        query: submittedQuery,
        limit,
        mode: 'search',
        signal: controller.signal,
        lat: bias?.lat,
        lng: bias?.lng,
      });
      setSubmittedState({ query: submittedQuery, response });
      if (response.error) setSubmittedError(response.error);
    } catch {
      if (controller.signal.aborted) return;
      setSubmittedError('Address search is unavailable. Use GPS or enter coordinates manually.');
    } finally {
      if (submittedAbortRef.current === controller) {
        submittedAbortRef.current = null;
        setIsSubmittedLoading(false);
        window.setTimeout(() => {
          if (submittedQueryRef.current === submittedQuery) {
            submittedQueryRef.current = null;
          }
        }, 1_000);
      }
    }
  }, [bias?.lat, bias?.lng, limit, query]);

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
    submittedError ||
    activeResponse?.error ||
    (autocompleteError && canSearch
      ? 'Address suggestions are temporarily unavailable. Press Search to retry.'
      : null);

  return {
    query,
    setQuery,
    results: activeResponse?.results ?? [],
    provider: activeResponse?.provider ?? null,
    attribution: activeResponse?.attribution ?? '',
    attributionUrl: activeResponse?.attributionUrl,
    isLoading: canSearch && (isDebouncing || isAutocompleteLoading || isSubmittedLoading),
    isDebouncing,
    error,
    submitSearch,
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
