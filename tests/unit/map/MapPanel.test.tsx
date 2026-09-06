import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MapPanel } from '@/components/map/MapPanel';

const mapHarness = vi.hoisted(() => ({
  location: {
    lat: -27.4698,
    lng: 153.0251,
    name: 'Brisbane',
    source: 'search',
  } as {
    lat: number;
    lng: number;
    name: string;
    source: string;
  } | null,
  setLocation: vi.fn(),
  jumpTo: vi.fn(),
  getZoom: vi.fn(() => 12),
  captureProps: vi.fn(),
  shouldThrow: false,
}));

vi.mock('@/store/solar-store', () => ({
  useLocation: () => mapHarness.location,
  useSolarActions: () => ({ setLocation: mapHarness.setLocation }),
}));

vi.mock('react-map-gl/maplibre', async () => {
  const React = await import('react');

  const MockMap = React.forwardRef<unknown, Record<string, unknown>>(function MockMap(props, ref) {
    mapHarness.captureProps(props);
    if (mapHarness.shouldThrow) throw new Error('Map initialization failed');
    React.useImperativeHandle(ref, () => ({
      jumpTo: mapHarness.jumpTo,
      getZoom: mapHarness.getZoom,
    }));

    return React.createElement('div', { 'data-testid': 'map' }, props.children as React.ReactNode);
  });

  return {
    default: MockMap,
    Marker: ({ children }: { children?: React.ReactNode }) =>
      React.createElement('div', null, children),
    NavigationControl: () => null,
    GeolocateControl: () => null,
  };
});

describe('MapPanel', () => {
  function getLatestMapProps(): Record<string, unknown> {
    const latestCall = mapHarness.captureProps.mock.calls.at(-1);
    if (!latestCall) throw new Error('Map props were not captured');
    return latestCall[0] as Record<string, unknown>;
  }

  beforeEach(() => {
    mapHarness.location = {
      lat: -27.4698,
      lng: 153.0251,
      name: 'Brisbane',
      source: 'search',
    };
    mapHarness.setLocation.mockClear();
    mapHarness.jumpTo.mockClear();
    mapHarness.getZoom.mockClear();
    mapHarness.getZoom.mockReturnValue(12);
    mapHarness.captureProps.mockClear();
    mapHarness.shouldThrow = false;
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('uses an uncontrolled camera and preserves the current zoom for location changes', async () => {
    const { rerender } = render(<MapPanel />);
    const initialProps = getLatestMapProps();

    expect(initialProps).not.toHaveProperty('onMove');
    expect(initialProps.initialViewState).toMatchObject({
      latitude: -27.4698,
      longitude: 153.0251,
      zoom: 15,
    });

    await waitFor(() => {
      expect(mapHarness.jumpTo).toHaveBeenCalledWith({
        center: [153.0251, -27.4698],
        zoom: 12,
      });
    });

    mapHarness.jumpTo.mockClear();
    mapHarness.location = {
      lat: 51.5072,
      lng: -0.1276,
      name: 'London',
      source: 'search',
    };
    rerender(<MapPanel />);

    await waitFor(() => {
      expect(mapHarness.jumpTo).toHaveBeenCalledWith({
        center: [-0.1276, 51.5072],
        zoom: 12,
      });
    });
  });

  it('keeps the existing rounded map-click location contract', async () => {
    const onMapClick = vi.fn();
    const onUserInteraction = vi.fn();
    render(<MapPanel onMapClick={onMapClick} onUserInteraction={onUserInteraction} />);

    act(() => {
      const handleClick = getLatestMapProps().onClick as (event: {
        lngLat: { lat: number; lng: number };
      }) => void;
      handleClick({ lngLat: { lat: -27.46981234, lng: 153.02514567 } });
    });

    await waitFor(() => {
      expect(mapHarness.setLocation).toHaveBeenCalledWith({
        lat: -27.469812,
        lng: 153.025146,
        name: '-27.4698, 153.0251',
        source: 'manual',
      });
      expect(onMapClick).toHaveBeenCalledWith(-27.469812, 153.025146);
      expect(onUserInteraction).toHaveBeenCalledTimes(1);
    });
  });

  it('marks pointer and keyboard map interactions before an asynchronous location result', () => {
    const onUserInteraction = vi.fn();
    render(<MapPanel onUserInteraction={onUserInteraction} />);
    const map = screen.getByTestId('map');

    fireEvent.pointerDown(map);
    fireEvent.keyDown(map, { key: 'Enter' });

    expect(onUserInteraction).toHaveBeenCalledTimes(2);
  });

  it('keeps solar data reachable when map loading exceeds ten seconds and can retry', () => {
    vi.useFakeTimers();
    render(<MapPanel />);

    act(() => vi.advanceTimersByTime(10_000));

    expect(
      screen.getByText('The map is unavailable or taking too long to load')
    ).toBeVisible();
    expect(screen.getByRole('link', { name: 'View data' })).toHaveAttribute(
      'href',
      '#solar-data'
    );

    const renderCount = mapHarness.captureProps.mock.calls.length;
    fireEvent.click(screen.getByRole('button', { name: 'Retry map' }));

    expect(screen.getByText('Loading map...')).toBeVisible();
    expect(mapHarness.captureProps.mock.calls.length).toBeGreaterThan(renderCount);
  });

  it('contains a map initialization error and leaves retry and data actions available', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    mapHarness.shouldThrow = true;

    render(<MapPanel />);

    expect(
      screen.getByText('The map is unavailable or taking too long to load')
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Retry map' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'View data' })).toBeVisible();
    consoleError.mockRestore();
  });
});
