/**
 * Shared geocoding gateway.
 *
 * Geoapify is the primary provider. TomTom is a paid automatic fallback with
 * an application-enforced rolling budget. Public Nominatim is deliberately not
 * used for address search or autocomplete.
 */

import { createHmac } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import {
  convertGeoapifyResults,
  convertTomTomResults,
  GEOAPIFY_ATTRIBUTION,
  GEOAPIFY_ATTRIBUTION_URL,
  TOMTOM_ATTRIBUTION,
  TOMTOM_ATTRIBUTION_URL,
  type GeocodeProvider,
  type GeocodeResponse,
  type GeocodeResult,
  type GeoapifySearchResponse,
  type TomTomSearchResponse,
} from '@/lib/geocode/providers';
import {
  SearchStoreUnavailableError,
  searchStore,
} from '@/lib/geocode/search-store';

const GEOAPIFY_AUTOCOMPLETE_URL = 'https://api.geoapify.com/v1/geocode/autocomplete';
const GEOAPIFY_SEARCH_URL = 'https://api.geoapify.com/v1/geocode/search';
const TOMTOM_BASE_URL = 'https://api.tomtom.com/search/2/search';
const TOMTOM_INDEXES = 'POI,PAD,Addr,Geo,Str,XStr,EPP';

const GEOAPIFY_TIMEOUT_MS = 3_000;
const TOMTOM_TIMEOUT_MS = 4_000;
const GEOAPIFY_DAILY_LIMIT = 2_800;
const TOMTOM_31_DAY_LIMIT = 5_000;
const CLIENT_RATE_LIMIT = 150;

const FIVE_MINUTES_MS = 5 * 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const THIRTY_ONE_DAYS_MS = 31 * ONE_DAY_MS;
const SUCCESS_CACHE_TTL_MS = ONE_DAY_MS;
const EMPTY_CACHE_TTL_MS = 5 * 60 * 1000;
const SINGLE_FLIGHT_TTL_MS = 5_000;

type SearchMode = 'autocomplete' | 'search';
type ProviderFailureKind = 'auth' | 'rate-limit' | 'transient' | 'budget';

class ProviderError extends Error {
  constructor(
    readonly provider: GeocodeProvider,
    readonly kind: ProviderFailureKind,
    readonly status?: number,
    readonly retryAfter = 0,
    cause?: unknown
  ) {
    super(`${provider.toUpperCase()}_${kind.toUpperCase()}`, { cause });
    this.name = 'ProviderError';
  }
}

interface CachedResults {
  results: GeocodeResult[];
}

function providerDetails(provider: GeocodeProvider) {
  return provider === 'geoapify'
    ? { attribution: GEOAPIFY_ATTRIBUTION, attributionUrl: GEOAPIFY_ATTRIBUTION_URL }
    : { attribution: TOMTOM_ATTRIBUTION, attributionUrl: TOMTOM_ATTRIBUTION_URL };
}

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
  provider: GeocodeProvider,
  error: string,
  code: NonNullable<GeocodeResponse['code']>,
  status: number,
  retryAfter?: number
) {
  return jsonResponse(
    {
      provider,
      ...providerDetails(provider),
      fallbackAvailable: false,
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

function getRetryAfter(response: Response): number {
  const value = response.headers.get('retry-after');
  if (!value) return 0;
  const seconds = Number.parseInt(value, 10);
  return Number.isFinite(seconds) && seconds > 0 ? seconds : 0;
}

function createCacheHash(
  query: string,
  limit: number,
  mode: SearchMode,
  lat?: number,
  lng?: number
): string {
  const value = JSON.stringify({
    query: query.toLocaleLowerCase().replace(/\s+/g, ' ').trim(),
    limit,
    mode,
    lat: lat === undefined ? null : Number(lat.toFixed(3)),
    lng: lng === undefined ? null : Number(lng.toFixed(3)),
  });
  return createPrivateHash(value);
}

function createPrivateHash(value: string): string {
  const secret =
    process.env.GEOCODE_CACHE_SECRET?.trim() ||
    (process.env.VERCEL ? '' : 'solar-path-local-geocode-cache');
  if (!secret) throw new SearchStoreUnavailableError();
  return createHmac('sha256', secret).update(value).digest('hex');
}

function classifyHttpFailure(provider: GeocodeProvider, response: Response): ProviderError {
  const retryAfter = getRetryAfter(response);
  if (response.status === 401 || response.status === 403) {
    return new ProviderError(provider, 'auth', response.status, retryAfter);
  }
  if (response.status === 429) {
    return new ProviderError(provider, 'rate-limit', response.status, retryAfter);
  }
  return new ProviderError(provider, 'transient', response.status, retryAfter);
}

async function reserveProviderCall(provider: GeocodeProvider) {
  const circuit = await searchStore.beforeProvider(provider);
  if (!circuit.allowed) {
    throw new ProviderError(provider, 'transient', undefined, circuit.retryAfter);
  }

  const rpsLimit = provider === 'geoapify' ? 4 : 2;
  const rps = await searchStore.takeWindow(`geocode:v1:rps:${provider}`, rpsLimit, 1_000);
  if (!rps.allowed) {
    throw new ProviderError(provider, 'rate-limit', 429, rps.retryAfter);
  }

  const usage =
    provider === 'geoapify'
      ? await searchStore.takeWindow(
          'geocode:v1:usage:geoapify:24h',
          GEOAPIFY_DAILY_LIMIT,
          ONE_DAY_MS
        )
      : await searchStore.takeWindow(
          'geocode:v1:usage:tomtom:31d',
          TOMTOM_31_DAY_LIMIT,
          THIRTY_ONE_DAYS_MS
        );

  if (!usage.allowed) {
    throw new ProviderError(provider, 'budget', 429, usage.retryAfter);
  }

  return circuit.probeToken;
}

async function fetchFromGeoapify(
  query: string,
  limit: number,
  mode: SearchMode,
  lat: number | undefined,
  lng: number | undefined,
  requestSignal: AbortSignal
): Promise<GeocodeResult[]> {
  const apiKey = process.env.GEOAPIFY_API_KEY?.trim();
  if (!apiKey) throw new ProviderError('geoapify', 'auth');

  const probeToken = await reserveProviderCall('geoapify');
  try {
    const params = new URLSearchParams({
      text: query,
      format: 'json',
      limit: limit.toString(),
      apiKey,
    });
    if (lat !== undefined && lng !== undefined) {
      params.set('bias', `proximity:${lng},${lat}`);
    }

    const response = await fetch(
      `${mode === 'autocomplete' ? GEOAPIFY_AUTOCOMPLETE_URL : GEOAPIFY_SEARCH_URL}?${params}`,
      {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
        signal: createUpstreamSignal(requestSignal, GEOAPIFY_TIMEOUT_MS),
      }
    );
    if (!response.ok) throw classifyHttpFailure('geoapify', response);

    const data = (await response.json()) as GeoapifySearchResponse;
    await searchStore.recordProviderSuccess('geoapify', probeToken);
    return convertGeoapifyResults(data);
  } catch (error) {
    const providerError =
      error instanceof ProviderError
        ? error
        : new ProviderError('geoapify', 'transient', undefined, 0, error);
    await searchStore.recordProviderFailure(
      'geoapify',
      providerError.kind === 'budget' ? 'rate-limit' : providerError.kind,
      providerError.retryAfter,
      probeToken
    );
    throw providerError;
  }
}

async function fetchFromTomTom(
  query: string,
  limit: number,
  lat: number | undefined,
  lng: number | undefined,
  requestSignal: AbortSignal
): Promise<GeocodeResult[]> {
  const apiKey = process.env.TOMTOM_SEARCH_API_KEY?.trim();
  if (!apiKey) throw new ProviderError('tomtom', 'auth');

  const probeToken = await reserveProviderCall('tomtom');
  try {
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
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      signal: createUpstreamSignal(requestSignal, TOMTOM_TIMEOUT_MS),
    });
    if (!response.ok) throw classifyHttpFailure('tomtom', response);

    const data = (await response.json()) as TomTomSearchResponse;
    await searchStore.recordProviderSuccess('tomtom', probeToken);
    return convertTomTomResults(data);
  } catch (error) {
    const providerError =
      error instanceof ProviderError
        ? error
        : new ProviderError('tomtom', 'transient', undefined, 0, error);
    await searchStore.recordProviderFailure(
      'tomtom',
      providerError.kind === 'budget' ? 'rate-limit' : providerError.kind,
      providerError.retryAfter,
      probeToken
    );
    throw providerError;
  }
}

async function waitForCachedResult(cacheKey: string, requestSignal: AbortSignal) {
  for (let attempt = 0; attempt < 10 && !requestSignal.aborted; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    const cached = await searchStore.get<CachedResults>(cacheKey);
    if (cached) return cached.results;
  }
  return null;
}

async function getGeoapifyResults(
  query: string,
  limit: number,
  mode: SearchMode,
  lat: number | undefined,
  lng: number | undefined,
  requestSignal: AbortSignal
): Promise<{ results: GeocodeResult[]; cache: 'HIT' | 'MISS' }> {
  const hash = createCacheHash(query, limit, mode, lat, lng);
  const cacheKey = `geocode:v1:cache:geoapify:${hash}`;
  const cached = await searchStore.get<CachedResults>(cacheKey);
  if (cached) return { results: cached.results, cache: 'HIT' };

  const lockKey = `geocode:v1:lock:geoapify:${hash}`;
  const lockToken = await searchStore.acquireLock(lockKey, SINGLE_FLIGHT_TTL_MS);
  if (!lockToken) {
    const sharedResult = await waitForCachedResult(cacheKey, requestSignal);
    if (sharedResult) return { results: sharedResult, cache: 'HIT' };
  }

  try {
    const results = await fetchFromGeoapify(query, limit, mode, lat, lng, requestSignal);
    await searchStore.set(
      cacheKey,
      { results } satisfies CachedResults,
      results.length > 0 ? SUCCESS_CACHE_TTL_MS : EMPTY_CACHE_TTL_MS
    );
    return { results, cache: 'MISS' };
  } finally {
    if (lockToken) await searchStore.releaseLock(lockKey, lockToken);
  }
}

function logProviderFailure(error: unknown, queryHash: string) {
  const providerError = error instanceof ProviderError ? error : null;
  console.error('[geocode] provider failure', {
    provider: providerError?.provider || 'unknown',
    kind: providerError?.kind || (isAbortError(error) ? 'timeout' : 'unknown'),
    status: providerError?.status,
    queryHash: queryHash.slice(0, 12),
  });
}

export async function GET(request: NextRequest): Promise<NextResponse<GeocodeResponse>> {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q')?.trim() ?? '';
  const rawMode = searchParams.get('mode') || 'autocomplete';
  const mode: SearchMode = rawMode === 'fallback' ? 'search' : (rawMode as SearchMode);

  if (query.length < 2) {
    return errorResponse('geoapify', 'Query must be at least 2 characters', 'INVALID_QUERY', 400);
  }
  if (mode !== 'autocomplete' && mode !== 'search') {
    return errorResponse(
      'geoapify',
      'Mode must be autocomplete or search',
      'INVALID_MODE',
      400
    );
  }

  const parsedLimit = searchParams.get('limit') === null
    ? 5
    : Number.parseInt(searchParams.get('limit') as string, 10);
  if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 5) {
    return errorResponse('geoapify', 'Limit must be between 1 and 5', 'INVALID_LIMIT', 400);
  }

  const lat = parseCoordinate(searchParams.get('lat'), -90, 90);
  const lng = parseCoordinate(searchParams.get('lng'), -180, 180);
  if (Number.isNaN(lat) || Number.isNaN(lng) || (lat === undefined) !== (lng === undefined)) {
    return errorResponse(
      'geoapify',
      'Latitude and longitude must be valid and supplied together',
      'INVALID_BIAS',
      400
    );
  }

  try {
    const clientLimit = await searchStore.takeWindow(
      `geocode:v1:client:${createPrivateHash(getClientIp(request))}`,
      CLIENT_RATE_LIMIT,
      FIVE_MINUTES_MS
    );
    if (!clientLimit.allowed) {
      return errorResponse(
        'geoapify',
        'Address search is temporarily rate limited. Please try again shortly.',
        'RATE_LIMITED',
        429,
        clientLimit.retryAfter
      );
    }

    const queryHash = createCacheHash(query, parsedLimit, mode, lat, lng);
    try {
      const primary = await getGeoapifyResults(
        query,
        parsedLimit,
        mode,
        lat,
        lng,
        request.signal
      );
      if (primary.results.length > 0 || mode === 'autocomplete') {
        return jsonResponse(
          {
            provider: 'geoapify',
            ...providerDetails('geoapify'),
            fallbackAvailable: false,
            results: primary.results,
          },
          200,
          { 'X-Cache': primary.cache, 'X-Geocode-Provider': 'geoapify' }
        );
      }
    } catch (error) {
      if (error instanceof SearchStoreUnavailableError) throw error;
      logProviderFailure(error, queryHash);
    }

    try {
      const results = await fetchFromTomTom(
        query,
        parsedLimit,
        lat,
        lng,
        request.signal
      );
      return jsonResponse(
        {
          provider: 'tomtom',
          ...providerDetails('tomtom'),
          fallbackAvailable: false,
          results,
        },
        200,
        { 'X-Cache': 'BYPASS', 'X-Geocode-Provider': 'tomtom' }
      );
    } catch (error) {
      if (error instanceof SearchStoreUnavailableError) throw error;
      logProviderFailure(error, queryHash);
      const retryAfter = error instanceof ProviderError ? error.retryAfter : 0;
      const isLimited = error instanceof ProviderError &&
        (error.kind === 'rate-limit' || error.kind === 'budget');
      return errorResponse(
        'tomtom',
        'Address search is temporarily unavailable. Use GPS or enter coordinates manually.',
        isLimited ? 'RATE_LIMITED' : 'PROVIDER_UNAVAILABLE',
        isLimited ? 429 : 503,
        retryAfter || undefined
      );
    }
  } catch (error) {
    console.error('[geocode] shared store unavailable', {
      kind: error instanceof SearchStoreUnavailableError ? 'store' : 'unknown',
    });
    return errorResponse(
      'geoapify',
      'Address search is temporarily unavailable. Use GPS or enter coordinates manually.',
      'PROVIDER_UNAVAILABLE',
      503
    );
  }
}
