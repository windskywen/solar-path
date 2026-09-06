'use client';

/**
 * MapPanel Component
 *
 * Interactive map using MapLibre GL and react-map-gl.
 * Displays the location marker and handles map interactions.
 */

import {
  Component,
  useRef,
  useCallback,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import Map, { Marker, NavigationControl, GeolocateControl } from 'react-map-gl/maplibre';
import type { MapRef, MapLayerMouseEvent, ViewState } from 'react-map-gl/maplibre';
import { useLocation, useSolarActions } from '@/store/solar-store';
import 'maplibre-gl/dist/maplibre-gl.css';

// OpenStreetMap tiles style - free, no API key required
const MAP_STYLE = {
  version: 8 as const,
  name: 'OSM Raster',
  sources: {
    osm: {
      type: 'raster' as const,
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
  },
  layers: [
    {
      id: 'osm-tiles',
      type: 'raster' as const,
      source: 'osm',
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

// Default view (Taipei) - zoom 15 for ~500m scale
const DEFAULT_VIEW: ViewState = {
  longitude: 121.5654,
  latitude: 25.033,
  zoom: 15,
  bearing: 0,
  pitch: 0,
  padding: { top: 0, bottom: 0, left: 0, right: 0 },
};

export interface MapPanelProps {
  /** Additional CSS classes */
  className?: string;
  /** Callback when map is clicked */
  onMapClick?: (lat: number, lng: number) => void;
  /** Marks a visitor action that should prevent a late IP-location replacement. */
  onUserInteraction?: () => void;
  /** Children to render as map layers */
  children?: React.ReactNode;
}

class MapRenderBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('[map] Map initialization failed:', error.message);
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

function MapUnavailable({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      className="absolute inset-0 z-20 flex items-center justify-center [background:var(--solar-surface-soft-bg)] p-5 text-center"
      role="status"
    >
      <div className="max-w-sm rounded-[22px] border p-5 [border-color:var(--solar-surface-border)] [background:var(--solar-surface-bg)] [box-shadow:var(--solar-surface-shadow)]">
        <p className="font-semibold text-[var(--solar-text-strong)]">
          The map is unavailable or taking too long to load
        </p>
        <p className="mt-2 text-sm leading-6 text-[var(--solar-text)]">
          Your solar results are still available. Retry the map or continue with the data below.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex min-h-11 items-center rounded-xl border px-4 text-sm font-semibold text-[var(--solar-text-strong)] [border-color:var(--solar-button-border)] [background:var(--solar-button-bg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--solar-input-focus-ring)]"
          >
            Retry map
          </button>
          <a
            href="#solar-data"
            className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-[var(--solar-accent)] underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--solar-input-focus-ring)]"
          >
            View data
          </a>
        </div>
      </div>
    </div>
  );
}

/**
 * MapPanel displays an interactive map with the current location
 */
export function MapPanel({
  className = '',
  onMapClick,
  onUserInteraction,
  children,
}: MapPanelProps) {
  const mapRef = useRef<MapRef>(null);
  const locationFrameRef = useRef<number | null>(null);
  const locationCommitFrameRef = useRef<number | null>(null);
  const location = useLocation();
  const { setLocation } = useSolarActions();

  // Let MapLibre own camera state so pan and zoom do not rerender this React subtree.
  const initialViewState: ViewState = {
    ...DEFAULT_VIEW,
    ...(location && {
      longitude: location.lng,
      latitude: location.lat,
    }),
  };
  const [mapLoadState, setMapLoadState] = useState<'loading' | 'ready' | 'stalled'>('loading');
  const [retryKey, setRetryKey] = useState(0);
  const isMapLoaded = mapLoadState === 'ready';

  const handleRetry = useCallback(() => {
    setMapLoadState('loading');
    setRetryKey((current) => current + 1);
  }, []);

  useEffect(() => {
    if (mapLoadState !== 'loading') return;
    const timeoutId = window.setTimeout(() => setMapLoadState('stalled'), 10_000);
    return () => window.clearTimeout(timeoutId);
  }, [mapLoadState, retryKey]);

  useEffect(
    () => () => {
      if (locationFrameRef.current !== null) window.cancelAnimationFrame(locationFrameRef.current);
      if (locationCommitFrameRef.current !== null) {
        window.cancelAnimationFrame(locationCommitFrameRef.current);
      }
    },
    []
  );

  // Update view when location changes (jump to new location instantly)
  useEffect(() => {
    if (!location || !mapRef.current) return;

    mapRef.current.jumpTo({
      center: [location.lng, location.lat],
      zoom: mapRef.current.getZoom(),
    });
  }, [location]);

  const handleMapClick = useCallback(
    (e: MapLayerMouseEvent) => {
      onUserInteraction?.();
      const { lng, lat } = e.lngLat;

      // Round to 6 decimal places
      const roundedLat = Math.round(lat * 1000000) / 1000000;
      const roundedLng = Math.round(lng * 1000000) / 1000000;

      // Let the native map click paint before recalculating every solar result.
      // Two animation frames keep the visible result effectively immediate
      // while moving the synchronous calculation out of the input event.
      if (locationFrameRef.current !== null) window.cancelAnimationFrame(locationFrameRef.current);
      if (locationCommitFrameRef.current !== null) {
        window.cancelAnimationFrame(locationCommitFrameRef.current);
      }
      locationFrameRef.current = window.requestAnimationFrame(() => {
        locationCommitFrameRef.current = window.requestAnimationFrame(() => {
          setLocation({
            lat: roundedLat,
            lng: roundedLng,
            name: `${roundedLat.toFixed(4)}, ${roundedLng.toFixed(4)}`,
            source: 'manual',
          });
          onMapClick?.(roundedLat, roundedLng);
        });
      });
    },
    [setLocation, onMapClick, onUserInteraction]
  );

  const handleGeolocate = useCallback(
    (position: GeolocationPosition) => {
      onUserInteraction?.();
      const { latitude, longitude } = position.coords;

      // Round to 6 decimal places
      const roundedLat = Math.round(latitude * 1000000) / 1000000;
      const roundedLng = Math.round(longitude * 1000000) / 1000000;

      setLocation({
        lat: roundedLat,
        lng: roundedLng,
        name: 'GPS Location',
        source: 'gps',
      });
    },
    [setLocation, onUserInteraction]
  );

  return (
    <div
      className={`relative w-full h-full ${className}`}
      onPointerDownCapture={onUserInteraction}
      onKeyDownCapture={onUserInteraction}
    >
      <MapRenderBoundary key={retryKey} fallback={<MapUnavailable onRetry={handleRetry} />}>
        <Map
          ref={mapRef}
          initialViewState={initialViewState}
          onClick={handleMapClick}
          onLoad={() => setMapLoadState('ready')}
          mapStyle={MAP_STYLE}
          attributionControl={{ compact: true }}
          reuseMaps
          style={{ width: '100%', height: '100%' }}
        >
          {/* Navigation controls */}
          <NavigationControl position="top-right" />

          {/* GPS button */}
          <GeolocateControl
            position="top-right"
            trackUserLocation={false}
            showUserLocation={false}
            onGeolocate={handleGeolocate}
          />

          {/* Location marker */}
          {location && (
            <Marker longitude={location.lng} latitude={location.lat} anchor="center">
              <div
                className="w-4 h-4 bg-primary border-2 border-background rounded-full shadow-lg"
                title={location.name || `${location.lat}, ${location.lng}`}
              />
            </Marker>
          )}

          {/* Additional layers (e.g., SolarRaysLayer) */}
          {isMapLoaded && children}
        </Map>
      </MapRenderBoundary>

      {/* Map loading indicator */}
      {mapLoadState === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center [background:var(--solar-surface-soft-bg)]">
          <div className="flex items-center gap-2 text-[var(--solar-text-muted)]">
            <svg
              className="animate-spin h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Loading map...</span>
          </div>
        </div>
      )}
      {mapLoadState === 'stalled' ? <MapUnavailable onRetry={handleRetry} /> : null}
    </div>
  );
}

/**
 * Get current viewport bounds from map ref
 */
export function getViewportBounds(mapRef: MapRef | null) {
  if (!mapRef) return null;

  const bounds = mapRef.getBounds();
  if (!bounds) return null;

  return {
    north: bounds.getNorth(),
    south: bounds.getSouth(),
    east: bounds.getEast(),
    west: bounds.getWest(),
  };
}
