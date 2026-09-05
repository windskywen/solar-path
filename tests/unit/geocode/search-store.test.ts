import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { searchStore } from '@/lib/geocode/search-store';

describe('shared geocode search state', () => {
  beforeEach(() => {
    vi.stubEnv('VERCEL', '');
    searchStore.resetForTests();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('rejects calls after a rolling-window budget is exhausted', async () => {
    const key = `budget-${crypto.randomUUID()}`;

    expect((await searchStore.takeWindow(key, 2, 60_000)).allowed).toBe(true);
    expect((await searchStore.takeWindow(key, 2, 60_000)).allowed).toBe(true);
    const rejected = await searchStore.takeWindow(key, 2, 60_000);

    expect(rejected.allowed).toBe(false);
    expect(rejected.count).toBe(2);
    expect(rejected.retryAfter).toBeGreaterThan(0);
  });

  it('opens a provider circuit after three transient failures', async () => {
    await searchStore.recordProviderFailure('geoapify', 'transient');
    await searchStore.recordProviderFailure('geoapify', 'transient');
    await searchStore.recordProviderFailure('geoapify', 'transient');

    const decision = await searchStore.beforeProvider('geoapify');
    expect(decision.allowed).toBe(false);
    expect(decision.retryAfter).toBeGreaterThan(0);
  });
});
