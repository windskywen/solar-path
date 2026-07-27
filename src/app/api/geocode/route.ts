/**
 * Geocoding API Route
 *
 * TomTom Fuzzy Search powers autocomplete. Public Nominatim is only called
 * after an explicit one-off fallback request from the user.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  convertNominatimResult,
  convertTomTomResults,
  NOMINATIM_ATTRIBUTION,
  TOMTOM_ATTRIBUTION,
  type GeocodeResponse,
  type GeocodeResult,
  type NominatimResult,
  type TomTomSearchResponse,
} from '@/lib/geocode/providers';

const TOMTOM_BASE_URL = 'https://api.tomtom.com/search/2/search';
const TOMTOM_INDEXES = 'POI,PAD,Addr,Geo,Str,XStr,EPP';
const TOMTOM_TIMEOUT_MS = 6000;

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'SolarPathTracker/1.0 (educational-project)';
const NOMINATIM_TIMEOUT_MS = 8000;

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_CACHE_SIZE = 1000;

const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 150;

let lastNominatimRequest = 0;
const MIN_REQUEST_INTERVAL_MS = 1100;

interface CacheEntry {
  results: GeocodeResult[];
  timestamp: number;
}

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

class LRUCache<K, V> {
  private cache = new Map<K, V>();

  constructor(private readonly maxSize: number) {}

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }
}

const nominatimCache = new LRUCache<string, CacheEntry>(MAX_CACHE_SIZE);
const rateLimitMap = new Map<string, RateLimitEntry>();

function jsonResponse(body: GeocodeResponse, status = 200, headers?: HeadersInit) {
  return NextResponse.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      ...headers,
    },
  });
}

function errorResponse(
  provider: GeocodeResponse['provider'],
  error: string,
  code: NonNullable<GeocodeResponse['code']>,
  status: number,
  fallbackAvailable: boolean,
  retryAfter?: number
) {
  return jsonResponse(
    {
      provider,
      attribution: provider === 'tomtom' ? TOMTOM_ATTRIBUTION : NOMINATIM_ATTRIBUTION,
      fallbackAvailable,
      results: [],
      error,
      code,
      retryAfter,
    },
    status,
    retryAfter ? { 'Retry-After': retryAfter.toString() } : undefined
  );
}

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') || 'unknown';
}

function checkRateLimit(clientIp: string): number {
  const now = Date.now();
  const entry = rateLimitMap.get(clientIp);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(clientIp, { count: 1, windowStart: now });
    return 0;
  }

  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    return Math.ceil((entry.windowStart + RATE_LIMIT_WINDOW_MS - now) / 1000);
  }

  entry.count++;
  return 0;
}

function createCacheKey(query: string, limit: number): string {
  return `${query.toLowerCase().trim()}:${limit}`;
}

function parseCoordinate(value: string | null, minimum: number, maximum: number): number | undefined {
  if (value === null) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= minimum && parsed <= maximum ? parsed : Number.NaN;
}

function createUpstreamSignal(requestSignal: AbortSignal, timeoutMs: number): AbortSignal {
  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  return typeof AbortSignal.any === 'function'
    ? AbortSignal.any([requestSignal, timeoutSignal])
    : timeoutSignal;
}

function isAbortError(error: unknown): boolean {
  if (!error || typeof error !== 'object' || !('name' in error)) return false;
  const name = String(error.name);
  return name === 'AbortError' || name === 'TimeoutError';
}

function removeCjkHouseNumber(query: string): string {
  return query
    .replace(/\d+號/g, '')
    .replace(/\d+巷/g, '')
    .replace(/\d+弄/g, '')
    .replace(/\d+樓/g, '')
    .replace(/之\d+/g, '')
    .replace(/[,-]\s*\d+/g, '')
    .replace(/\s+/g, '')
    .trim();
}

async function fetchFromTomTom(
  query: string,
  limit: number,
  lat: number | undefined,
  lng: number | undefined,
  requestSignal: AbortSignal
): Promise<GeocodeResult[]> {
  const apiKey = process.env.TOMTOM_SEARCH_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('TOMTOM_KEY_MISSING');
  }

  const params = new URLSearchParams({
    key: apiKey,
    typeahead: 'true',
    limit: limit.toString(),
    idxSet: TOMTOM_INDEXES,
  });

  if (lat !== undefined && lng !== undefined) {
    params.set('lat', lat.toString());
    params.set('lon', lng.toString());
  }

  const response = await fetch(`${TOMTOM_BASE_URL}/${encodeURIComponent(query)}.json?${params}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    cache: 'no-store',
    signal: createUpstreamSignal(requestSignal, TOMTOM_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`TOMTOM_HTTP_${response.status}`);
  }

  const data = (await response.json()) as TomTomSearchResponse;
  return convertTomTomResults(data);
}

async function waitForNominatimSlot(): Promise<void> {
  const elapsed = Date.now() - lastNominatimRequest;
  if (elapsed < MIN_REQUEST_INTERVAL_MS) {
    await new Promise((resolve) => setTimeout(resolve, MIN_REQUEST_INTERVAL_MS - elapsed));
  }
  lastNominatimRequest = Date.now();
}

async function fetchFromNominatim(
  query: string,
  limit: number,
  requestSignal: AbortSignal
): Promise<GeocodeResult[]> {
  await waitForNominatimSlot();

  const params = new URLSearchParams({
    q: query,
    format: 'json',
    limit: limit.toString(),
    addressdetails: '1',
  });

  const response = await fetch(`${NOMINATIM_BASE_URL}?${params}`, {
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'application/json',
    },
    cache: 'no-store',
    signal: createUpstreamSignal(requestSignal, NOMINATIM_TIMEOUT_MS),
  });

  if (!response.ok) throw new Error(`NOMINATIM_HTTP_${response.status}`);

  const data = (await response.json()) as NominatimResult[];
  return data.map(convertNominatimResult);
}

async function fetchNominatimFallback(
  query: string,
  limit: number,
  requestSignal: AbortSignal
): Promise<GeocodeResult[]> {
  let results = await fetchFromNominatim(query, limit, requestSignal);

  if (results.length === 0) {
    const simplifiedQuery = removeCjkHouseNumber(query);
    if (simplifiedQuery && simplifiedQuery !== query && simplifiedQuery.length >= 2) {
      results = await fetchFromNominatim(
        simplifiedQuery,
        limit,
        requestSignal
      );
    }
  }

  return results;
}

export async function GET(request: NextRequest): Promise<NextResponse<GeocodeResponse>> {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q')?.trim() ?? '';
  const mode = searchParams.get('mode') || 'autocomplete';
  const limitText = searchParams.get('limit');

  if (query.length < 2) {
    return errorResponse(
      'tomtom',
      'Query must be at least 2 characters',
      'INVALID_QUERY',
      400,
      false
    );
  }

  if (mode !== 'autocomplete' && mode !== 'fallback') {
    return errorResponse('tomtom', 'Mode must be autocomplete or fallback', 'INVALID_MODE', 400, false);
  }

  const parsedLimit = limitText === null ? 5 : Number.parseInt(limitText, 10);
  if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 5) {
    return errorResponse('tomtom', 'Limit must be between 1 and 5', 'INVALID_LIMIT', 400, false);
  }

  const lat = parseCoordinate(searchParams.get('lat'), -90, 90);
  const lng = parseCoordinate(searchParams.get('lng'), -180, 180);
  const hasInvalidBias =
    Number.isNaN(lat) || Number.isNaN(lng) || (lat === undefined) !== (lng === undefined);
  if (hasInvalidBias) {
    return errorResponse(
      'tomtom',
      'Latitude and longitude must be valid and supplied together',
      'INVALID_BIAS',
      400,
      false
    );
  }

  const clientIp = getClientIp(request);
  const retryAfter = checkRateLimit(clientIp);
  if (retryAfter > 0) {
    return errorResponse(
      mode === 'autocomplete' ? 'tomtom' : 'nominatim',
      mode === 'autocomplete'
        ? 'Autocomplete unavailable — press Enter to search'
        : 'Fallback search is temporarily rate limited',
      'RATE_LIMITED',
      429,
      mode === 'autocomplete',
      retryAfter
    );
  }

  if (mode === 'autocomplete') {
    try {
      const results = await fetchFromTomTom(query, parsedLimit, lat, lng, request.signal);
      return jsonResponse({
        provider: 'tomtom',
        attribution: TOMTOM_ATTRIBUTION,
        fallbackAvailable: false,
        results,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      const isRateLimited = message === 'TOMTOM_HTTP_429';
      const providerUnavailable =
        message === 'TOMTOM_KEY_MISSING' ||
        message === 'TOMTOM_HTTP_403' ||
        isRateLimited ||
        message.startsWith('TOMTOM_HTTP_5') ||
        isAbortError(error);

      console.error(
        '[geocode] TomTom autocomplete unavailable:',
        message === 'TOMTOM_KEY_MISSING' ? 'API key is not configured' : message || error
      );

      return errorResponse(
        'tomtom',
        'Autocomplete unavailable — press Enter to search',
        providerUnavailable ? 'PROVIDER_UNAVAILABLE' : 'UPSTREAM_ERROR',
        isRateLimited ? 429 : 503,
        true
      );
    }
  }

  const cacheKey = createCacheKey(query, parsedLimit);
  const cached = nominatimCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return jsonResponse(
      {
        provider: 'nominatim',
        attribution: NOMINATIM_ATTRIBUTION,
        fallbackAvailable: false,
        results: cached.results,
      },
      200,
      { 'X-Cache': 'HIT' }
    );
  }

  try {
    const results = await fetchNominatimFallback(
      query,
      parsedLimit,
      request.signal
    );

    nominatimCache.set(cacheKey, { results, timestamp: Date.now() });

    return jsonResponse(
      {
        provider: 'nominatim',
        attribution: NOMINATIM_ATTRIBUTION,
        fallbackAvailable: false,
        results,
      },
      200,
      { 'X-Cache': 'MISS' }
    );
  } catch (error) {
    console.error(
      '[geocode] Nominatim fallback unavailable:',
      error instanceof Error ? error.message : error
    );
    return errorResponse(
      'nominatim',
      'Fallback address search is unavailable. Use GPS or enter coordinates manually.',
      'UPSTREAM_ERROR',
      502,
      false
    );
  }
}
