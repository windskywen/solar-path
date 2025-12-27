/**
 * Geocoding API Route
 *
 * Proxy for OpenStreetMap Nominatim geocoding service.
 * Provides location search with LRU caching and rate limiting.
 *
 * @see contracts/api.md for full specification
 */

import { NextRequest, NextResponse } from 'next/server';

// Nominatim API configuration
const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'SolarPathTracker/1.0 (educational-project)';

// Cache configuration
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_CACHE_SIZE = 1000;

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const MAX_REQUESTS_PER_WINDOW = 60;

// Types
interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  osm_type: string;
  osm_id: number;
  boundingbox: string[];
}

interface CacheEntry {
  results: GeocodeResult[];
  timestamp: number;
}

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

export interface GeocodeResult {
  displayName: string;
  lat: number;
  lng: number;
  osmUrl: string;
}

export interface GeocodeResponse {
  results: GeocodeResult[];
}

export interface GeocodeErrorResponse {
  error: string;
  code: 'INVALID_QUERY' | 'INVALID_LIMIT' | 'RATE_LIMITED' | 'UPSTREAM_ERROR';
  retryAfter?: number;
}

// LRU Cache implementation
class LRUCache<K, V> {
  private cache: Map<K, V>;
  private maxSize: number;

  constructor(maxSize: number) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Remove oldest (first) entry
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }
}

// Global caches (persist across requests in same worker)
const geocodeCache = new LRUCache<string, CacheEntry>(MAX_CACHE_SIZE);
const rateLimitMap = new Map<string, RateLimitEntry>();

/**
 * Get client IP from request headers
 */
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') || 'unknown';
}

/**
 * Check and update rate limit for a client
 * Returns seconds to wait if rate limited, or 0 if OK
 */
function checkRateLimit(clientIp: string): number {
  const now = Date.now();
  const entry = rateLimitMap.get(clientIp);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    // Start new window
    rateLimitMap.set(clientIp, { count: 1, windowStart: now });
    return 0;
  }

  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    // Rate limited
    const retryAfter = Math.ceil((entry.windowStart + RATE_LIMIT_WINDOW_MS - now) / 1000);
    return retryAfter;
  }

  // Increment count
  entry.count++;
  return 0;
}

/**
 * Create cache key from query and limit
 */
function createCacheKey(query: string, limit: number): string {
  return `${query.toLowerCase().trim()}:${limit}`;
}

/**
 * Convert Nominatim result to our format
 */
function convertResult(result: NominatimResult): GeocodeResult {
  const osmType =
    result.osm_type === 'node' ? 'node' : result.osm_type === 'way' ? 'way' : 'relation';

  return {
    displayName: result.display_name,
    lat: parseFloat(result.lat),
    lng: parseFloat(result.lon),
    osmUrl: `https://www.openstreetmap.org/${osmType}/${result.osm_id}`,
  };
}

/**
 * Fetch from Nominatim API
 */
async function fetchFromNominatim(query: string, limit: number): Promise<GeocodeResult[]> {
  const params = new URLSearchParams({
    q: query,
    format: 'json',
    limit: limit.toString(),
    addressdetails: '0',
  });

  const response = await fetch(`${NOMINATIM_BASE_URL}?${params}`, {
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Nominatim API error: ${response.status}`);
  }

  const data: NominatimResult[] = await response.json();
  return data.map(convertResult);
}

/**
 * GET /api/geocode
 *
 * Query parameters:
 * - q: Search query (required)
 * - limit: Max results 1-10 (default: 5)
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<GeocodeResponse | GeocodeErrorResponse>> {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');
  const limitStr = searchParams.get('limit');

  // Validate query
  if (!query || query.trim().length === 0) {
    return NextResponse.json(
      { error: 'Query parameter "q" is required', code: 'INVALID_QUERY' as const },
      { status: 400 }
    );
  }

  if (query.trim().length < 2) {
    return NextResponse.json(
      { error: 'Query must be at least 2 characters', code: 'INVALID_QUERY' as const },
      { status: 400 }
    );
  }

  // Validate and parse limit
  let limit = 5;
  if (limitStr) {
    const parsedLimit = parseInt(limitStr, 10);
    if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 10) {
      return NextResponse.json(
        { error: 'Limit must be between 1 and 10', code: 'INVALID_LIMIT' as const },
        { status: 400 }
      );
    }
    limit = parsedLimit;
  }

  // Check rate limit
  const clientIp = getClientIp(request);
  const retryAfter = checkRateLimit(clientIp);
  if (retryAfter > 0) {
    return NextResponse.json(
      {
        error: 'Rate limit exceeded. Please try again later.',
        code: 'RATE_LIMITED' as const,
        retryAfter,
      },
      { status: 429, headers: { 'Retry-After': retryAfter.toString() } }
    );
  }

  // Check cache
  const cacheKey = createCacheKey(query, limit);
  const cached = geocodeCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return NextResponse.json({ results: cached.results }, { headers: { 'X-Cache': 'HIT' } });
  }

  // Fetch from Nominatim
  try {
    const results = await fetchFromNominatim(query, limit);

    // Cache the results
    geocodeCache.set(cacheKey, {
      results,
      timestamp: Date.now(),
    });

    return NextResponse.json({ results }, { headers: { 'X-Cache': 'MISS' } });
  } catch (error) {
    console.error('Geocode API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch geocoding results', code: 'UPSTREAM_ERROR' as const },
      { status: 502 }
    );
  }
}
