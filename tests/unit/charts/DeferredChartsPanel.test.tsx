import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DeferredChartsPanel } from '@/components/charts/DeferredChartsPanel';

const observerHarness = vi.hoisted(() => ({
  callback: null as IntersectionObserverCallback | null,
  options: null as IntersectionObserverInit | null,
  observe: vi.fn(),
  disconnect: vi.fn(),
}));

vi.mock('next/dynamic', () => ({
  default: () =>
    function MockLazyChartsPanel() {
      return <div data-testid="loaded-charts-module">Loaded charts</div>;
    },
}));

class MockIntersectionObserver implements IntersectionObserver {
  readonly root = null;
  readonly rootMargin: string;
  readonly thresholds: readonly number[];

  constructor(callback: IntersectionObserverCallback, options: IntersectionObserverInit = {}) {
    observerHarness.callback = callback;
    observerHarness.options = options;
    this.rootMargin = options.rootMargin ?? '0px';
    this.thresholds = Array.isArray(options.threshold)
      ? options.threshold
      : [options.threshold ?? 0];
  }

  observe = observerHarness.observe;
  disconnect = observerHarness.disconnect;
  unobserve = vi.fn();
  takeRecords = () => [];
}

describe('DeferredChartsPanel', () => {
  beforeEach(() => {
    observerHarness.callback = null;
    observerHarness.options = null;
    observerHarness.observe.mockClear();
    observerHarness.disconnect.mockClear();
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('reserves layout space and loads charts only when the panel is near the viewport', async () => {
    render(<DeferredChartsPanel positions={[]} selectedHour={null} />);

    const panel = screen.getByTestId('deferred-charts-panel');
    expect(panel).toHaveAttribute('data-state', 'deferred');
    expect(panel).toHaveStyle({ minHeight: '380px' });
    expect(screen.queryByTestId('loaded-charts-module')).not.toBeInTheDocument();
    expect(observerHarness.options).toMatchObject({
      rootMargin: '300px 0px',
      threshold: 0.01,
    });

    act(() => {
      observerHarness.callback?.(
        [
          {
            isIntersecting: true,
            intersectionRatio: 1,
            target: panel,
          } as unknown as IntersectionObserverEntry,
        ],
        {} as IntersectionObserver
      );
    });

    expect(await screen.findByTestId('loaded-charts-module')).toBeVisible();
    expect(panel).toHaveAttribute('data-state', 'loaded');
    expect(observerHarness.disconnect).toHaveBeenCalled();
  });

  it('loads immediately when IntersectionObserver is unavailable', async () => {
    vi.unstubAllGlobals();
    Reflect.deleteProperty(window, 'IntersectionObserver');

    render(
      <DeferredChartsPanel
        positions={[]}
        selectedHour={null}
        defaultView="both"
      />
    );

    expect(await screen.findByTestId('loaded-charts-module')).toBeVisible();
    expect(screen.getByTestId('deferred-charts-panel')).toHaveStyle({ minHeight: '700px' });
  });
});
