import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  SolarStoreProvider,
  useDateISO,
  useLocation,
  useSolarActions,
  useTimezone,
} from '@/store/solar-store';

function createWrapper(initialDateISO: string) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <SolarStoreProvider initialDateISO={initialDateISO}>{children}</SolarStoreProvider>;
  };
}

function useStoreTestSurface() {
  return {
    dateISO: useDateISO(),
    location: useLocation(),
    timezone: useTimezone(),
    actions: useSolarActions(),
  };
}

describe('SolarStoreProvider', () => {
  it('uses the server-provided date for the first client state', () => {
    const { result } = renderHook(useStoreTestSurface, {
      wrapper: createWrapper('2026-08-11'),
    });

    expect(result.current.dateISO).toBe('2026-08-11');
    expect(result.current.location).toBeNull();
    expect(result.current.timezone).toBe('UTC');
  });

  it('preserves the existing actions and derives timezone after a location change', () => {
    const { result } = renderHook(useStoreTestSurface, {
      wrapper: createWrapper('2026-08-11'),
    });

    act(() => {
      result.current.actions.setLocation({
        lat: -27.4698,
        lng: 153.0251,
        name: 'Brisbane',
        source: 'manual',
      });
      result.current.actions.setDateISO('2026-12-21');
    });

    expect(result.current.location?.name).toBe('Brisbane');
    expect(result.current.dateISO).toBe('2026-12-21');
    expect(result.current.timezone).toBe('Australia/Brisbane');
  });

  it('creates independent state for separate providers', () => {
    const first = renderHook(useStoreTestSurface, {
      wrapper: createWrapper('2026-01-01'),
    });
    const second = renderHook(useStoreTestSurface, {
      wrapper: createWrapper('2026-02-02'),
    });

    act(() => {
      first.result.current.actions.setDateISO('2026-03-03');
    });

    expect(first.result.current.dateISO).toBe('2026-03-03');
    expect(second.result.current.dateISO).toBe('2026-02-02');
  });
});
