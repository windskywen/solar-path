import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from '@/app/api/geocode/route';
import { searchStore } from '@/lib/geocode/search-store';
import type { GeocodeResponse } from '@/lib/geocode/providers';

function request(query: string, client = crypto.randomUUID()) {
  return new NextRequest(`http://localhost/api/geocode?${query}`, {
    headers: { 'x-forwarded-for': `test-${client}` },
  });
}

function geoapifyResponse(results: unknown[] = [
  {
    place_id: 'geoapify-address-1',
    formatted: 'Queen Street, Brisbane QLD, Australia',
    result_type: 'street',
    lat: -27.4698,
    lon: 153.0251,
  },
]) {
  return new Response(JSON.stringify({ results }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

function tomTomResponse() {
  return new Response(
    JSON.stringify({
      results: [
        {
          type: 'Point Address',
          id: 'tomtom-address-1',
          address: { freeformAddress: 'Queen Street, Brisbane QLD, Australia' },
          position: { lat: -27.4698, lon: 153.0251 },
        },
      ],
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}

describe('/api/geocode', () => {
  beforeEach(() => {
    vi.stubEnv('GEOAPIFY_API_KEY', 'geoapify-secret');
    vi.stubEnv('TOMTOM_SEARCH_API_KEY', 'tomtom-secret');
    vi.stubEnv('GEOCODE_CACHE_SECRET', 'cache-secret');
    vi.stubEnv('VERCEL', '');
    searchStore.resetForTests();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('uses Geoapify autocomplete with a soft bias and provider attribution', async () => {
    const fetchMock = vi.fn().mockResolvedValue(geoapifyResponse());
    vi.stubGlobal('fetch', fetchMock);

    const response = await GET(
      request('q=Queen%20Street&mode=autocomplete&limit=5&lat=-27.47&lng=153.02')
    );
    const body = (await response.json()) as GeocodeResponse;

    expect(response.status).toBe(200);
    expect(response.headers.get('X-Geocode-Provider')).toBe('geoapify');
    expect(body).toMatchObject({
      provider: 'geoapify',
      attribution: 'Powered by Geoapify',
      attributionUrl: 'https://www.geoapify.com/',
      fallbackAvailable: false,
    });
    expect(body.results[0]).toMatchObject({
      id: 'geoapify-address-1',
      displayName: 'Queen Street, Brisbane QLD, Australia',
      lat: -27.4698,
      lng: 153.0251,
      resultType: 'street',
    });

    const upstreamUrl = new URL(fetchMock.mock.calls[0][0] as string);
    expect(upstreamUrl.origin + upstreamUrl.pathname).toBe(
      'https://api.geoapify.com/v1/geocode/autocomplete'
    );
    expect(upstreamUrl.searchParams.get('text')).toBe('Queen Street');
    expect(upstreamUrl.searchParams.get('bias')).toBe('proximity:153.02,-27.47');
    expect(upstreamUrl.searchParams.get('limit')).toBe('5');
    expect(upstreamUrl.searchParams.get('apiKey')).toBe('geoapify-secret');
    expect(JSON.stringify(body)).not.toContain('geoapify-secret');
  });

  it('serves repeated Geoapify results from the shared cache', async () => {
    const fetchMock = vi.fn().mockResolvedValue(geoapifyResponse());
    vi.stubGlobal('fetch', fetchMock);
    const query = `q=Brisbane-${crypto.randomUUID()}&mode=autocomplete&limit=5`;

    const first = await GET(request(query));
    const second = await GET(request(query));

    expect(first.headers.get('X-Cache')).toBe('MISS');
    expect(second.headers.get('X-Cache')).toBe('HIT');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('does not spend TomTom fallback calls for empty autocomplete suggestions', async () => {
    const fetchMock = vi.fn().mockResolvedValue(geoapifyResponse([]));
    vi.stubGlobal('fetch', fetchMock);

    const response = await GET(request('q=NoMatchAutocomplete&mode=autocomplete'));
    const body = (await response.json()) as GeocodeResponse;

    expect(response.status).toBe(200);
    expect(body.provider).toBe('geoapify');
    expect(body.results).toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each([401, 403, 429, 500, 503])(
    'automatically falls back to TomTom when Geoapify returns HTTP %s',
    async (status) => {
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(new Response('', { status }))
        .mockResolvedValueOnce(tomTomResponse());
      vi.stubGlobal('fetch', fetchMock);

      const response = await GET(
        request(`q=Provider${status}-${crypto.randomUUID()}&mode=autocomplete`)
      );
      const body = (await response.json()) as GeocodeResponse;

      expect(response.status).toBe(200);
      expect(body.provider).toBe('tomtom');
      expect(body.results[0].id).toBe('tomtom-address-1');
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(String(fetchMock.mock.calls[1][0])).toContain('api.tomtom.com/search/2/search');
    }
  );

  it('falls back to TomTom when an explicit search has no Geoapify matches', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(geoapifyResponse([]))
      .mockResolvedValueOnce(tomTomResponse());
    vi.stubGlobal('fetch', fetchMock);

    const response = await GET(request('q=SubmittedPlace&mode=search&limit=5'));
    const body = (await response.json()) as GeocodeResponse;

    expect(response.status).toBe(200);
    expect(body.provider).toBe('tomtom');
    expect(new URL(fetchMock.mock.calls[0][0] as string).pathname).toBe('/v1/geocode/search');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('keeps the former fallback mode as a search alias without calling Nominatim', async () => {
    const fetchMock = vi.fn().mockResolvedValue(geoapifyResponse());
    vi.stubGlobal('fetch', fetchMock);

    const response = await GET(request('q=LegacyClient&mode=fallback'));
    expect(response.status).toBe(200);
    expect(String(fetchMock.mock.calls[0][0])).toContain('api.geoapify.com/v1/geocode/search');
    expect(fetchMock.mock.calls.flat().join(' ')).not.toContain('nominatim');
  });

  it('returns a stable manual-entry error when both providers fail', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce(new Response('', { status: 503 })).mockResolvedValueOnce(
        new Response('', { status: 503 })
      )
    );

    const response = await GET(request('q=BothUnavailable&mode=autocomplete'));
    const body = (await response.json()) as GeocodeResponse;

    expect(response.status).toBe(503);
    expect(body).toMatchObject({
      provider: 'tomtom',
      code: 'PROVIDER_UNAVAILABLE',
      fallbackAvailable: false,
      results: [],
    });
  });
});
