import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchIpGeo, IP_LOCATION_TIMEOUT_MS } from '@/hooks/useIpGeo';

describe('IP location request', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('returns a successful approximate location response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        lat: -27.4698,
        lng: 153.0251,
        city: 'Brisbane',
        country: 'Australia',
      }),
    } as Response);

    await expect(fetchIpGeo()).resolves.toEqual({
      lat: -27.4698,
      lng: 153.0251,
      city: 'Brisbane',
      country: 'Australia',
    });
  });

  it('aborts after eight seconds so the caller can retain the Taipei example', async () => {
    vi.useFakeTimers();
    let requestSignal: AbortSignal | undefined;

    vi.spyOn(globalThis, 'fetch').mockImplementation((_input, init) => {
      requestSignal = init?.signal ?? undefined;
      return new Promise((_resolve, reject) => {
        requestSignal?.addEventListener('abort', () => {
          reject(new DOMException('Aborted', 'AbortError'));
        });
      });
    });

    const timeoutExpectation = expect(fetchIpGeo()).rejects.toThrow(
      'Approximate location timed out'
    );
    await vi.advanceTimersByTimeAsync(IP_LOCATION_TIMEOUT_MS);

    await timeoutExpectation;
    expect(requestSignal?.aborted).toBe(true);
  });
});
