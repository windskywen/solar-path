import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from '@/app/api/geocode/route';
import type { GeocodeResponse } from '@/lib/geocode/providers';

function request(query: string, client = crypto.randomUUID()) {
  return new NextRequest(`http://localhost/api/geocode?${query}`, {
    headers: {
      'x-forwarded-for': `test-${client}`,
      'accept-language': 'zh-Hant-TW,zh;q=0.9',
    },
  });
}

function tomTomResponse() {
  return new Response(
    JSON.stringify({
      results: [
        {
          type: 'Point Address',
          id: 'tomtom-address-1',
          address: {
            freeformAddress: '介禮街20號, 花蓮市, 花蓮縣',
          },
          position: {
            lat: 23.991,
            lon: 121.611,
          },
        },
      ],
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

describe('/api/geocode', () => {
  beforeEach(() => {
    vi.stubEnv('TOMTOM_SEARCH_API_KEY', 'server-secret');
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('calls TomTom Fuzzy Search with typeahead, mixed indexes, bias, limit and normalized language', async () => {
    const fetchMock = vi.fn().mockResolvedValue(tomTomResponse());
    vi.stubGlobal('fetch', fetchMock);

    const response = await GET(
      request(
        'q=%E4%BB%8B%E7%A6%AE%E8%A1%9720%E8%99%9F&mode=autocomplete&limit=5&lat=23.98&lng=121.60&lang=zh-Hant-TW'
      )
    );
    const body = (await response.json()) as GeocodeResponse;

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      provider: 'tomtom',
      attribution: 'Search data © TomTom',
      fallbackAvailable: false,
    });
    expect(body.results[0]).toMatchObject({
      id: 'tomtom-address-1',
      displayName: '介禮街20號, 花蓮市, 花蓮縣',
      lat: 23.991,
      lng: 121.611,
      resultType: 'Point Address',
    });

    const upstreamUrl = new URL(fetchMock.mock.calls[0][0] as string);
    expect(upstreamUrl.hostname).toBe('api.tomtom.com');
    expect(decodeURIComponent(upstreamUrl.pathname)).toContain('介禮街20號.json');
    expect(upstreamUrl.searchParams.get('typeahead')).toBe('true');
    expect(upstreamUrl.searchParams.get('idxSet')).toBe('POI,PAD,Addr,Geo,Str,XStr,EPP');
    expect(upstreamUrl.searchParams.get('limit')).toBe('5');
    expect(upstreamUrl.searchParams.get('lat')).toBe('23.98');
    expect(upstreamUrl.searchParams.get('lon')).toBe('121.6');
    expect(upstreamUrl.searchParams.get('language')).toBe('zh-TW');
    expect(upstreamUrl.searchParams.get('key')).toBe('server-secret');
    expect(JSON.stringify(body)).not.toContain('server-secret');
  });

  it('does not put TomTom results in the shared LRU cache', async () => {
    const fetchMock = vi.fn().mockImplementation(async () => tomTomResponse());
    vi.stubGlobal('fetch', fetchMock);
    const query = 'q=Brisbane&mode=autocomplete&limit=5';

    await GET(request(query));
    await GET(request(query));

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('returns fallback state without calling Nominatim when the key is missing', async () => {
    vi.stubEnv('TOMTOM_SEARCH_API_KEY', '');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const response = await GET(request('q=Brisbane&mode=autocomplete'));
    const body = (await response.json()) as GeocodeResponse;

    expect(response.status).toBe(503);
    expect(body).toMatchObject({
      provider: 'tomtom',
      fallbackAvailable: true,
      code: 'PROVIDER_UNAVAILABLE',
      error: 'Autocomplete unavailable — press Enter to search',
      results: [],
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([403, 429, 500, 503])(
    'offers explicit fallback for TomTom HTTP %s without calling another provider',
    async (status) => {
      const fetchMock = vi.fn().mockResolvedValue(new Response('', { status }));
      vi.stubGlobal('fetch', fetchMock);

      const response = await GET(request(`q=Provider${status}&mode=autocomplete`));
      const body = (await response.json()) as GeocodeResponse;

      expect(body.fallbackAvailable).toBe(true);
      expect(body.results).toEqual([]);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    }
  );

  it('offers explicit fallback when the TomTom request is aborted or times out', async () => {
    const timeoutError = new DOMException('Timed out', 'TimeoutError');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(timeoutError));

    const response = await GET(request('q=TimeoutPlace&mode=autocomplete'));
    const body = (await response.json()) as GeocodeResponse;

    expect(response.status).toBe(503);
    expect(body.fallbackAvailable).toBe(true);
    expect(body.code).toBe('PROVIDER_UNAVAILABLE');
  });

  it('calls Nominatim only in explicit fallback mode and returns unified results', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify([
          {
            place_id: 123,
            display_name: '介禮街, 民政里, 花蓮市, 花蓮縣, Taiwan',
            lat: '23.991',
            lon: '121.611',
            osm_type: 'way',
            osm_id: 456,
          },
        ]),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );
    vi.stubGlobal('fetch', fetchMock);

    const response = await GET(
      request('q=%E4%BB%8B%E7%A6%AE%E8%A1%9720%E8%99%9F&mode=fallback&limit=5')
    );
    const body = (await response.json()) as GeocodeResponse;

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      provider: 'nominatim',
      attribution: '© OpenStreetMap contributors',
      fallbackAvailable: false,
    });
    expect(body.results[0]).toMatchObject({
      id: 'nominatim:123',
      lat: 23.991,
      lng: 121.611,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toContain('nominatim.openstreetmap.org/search');
  });
});
