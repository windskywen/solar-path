import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchGeocode } from '@/hooks/useGeocode';

describe('fetchGeocode query language', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it.each([
    ['介禮街20號', 'en-US', ['en-US', 'en']],
    ['20 Jieli Street', 'zh-TW', ['zh-TW', 'zh']],
  ])(
    'sends query "%s" without browser language %s',
    async (query, browserLanguage, browserLanguages) => {
      vi.stubGlobal('navigator', {
        language: browserLanguage,
        languages: browserLanguages,
      });
      const fetchMock = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            provider: 'tomtom',
            attribution: 'Search data © TomTom',
            fallbackAvailable: false,
            results: [],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );
      vi.stubGlobal('fetch', fetchMock);

      await fetchGeocode({
        query,
        limit: 5,
        mode: 'autocomplete',
      });

      const requestUrl = new URL(fetchMock.mock.calls[0][0] as string, 'http://localhost');
      expect(requestUrl.searchParams.get('q')).toBe(query);
      expect(requestUrl.searchParams.has('lang')).toBe(false);
    }
  );
});
