'use client';

/**
 * MapPanel Component
 *
 * Interactive map using MapLibre GL and react-map-gl.
 * Displays the location marker and handles map interactions.
 * Includes 3D View button for opening 3D solar path modal.
 */

import { useRef, useCallback, useState, useEffect } from 'react';
import Map, { Marker, NavigationControl, GeolocateControl } from 'react-map-gl/maplibre';
import type { MapRef, MapLayerMouseEvent, ViewState } from 'react-map-gl/maplibre';
import { useLocation, useSolarActions } from '@/store/solar-store';
import { useSolarData } from '@/hooks/useSolarData';
import { Solar3DViewModal } from '@/components/solar3d';
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
  /** Children to render as map layers */
  children?: React.ReactNode;
}

/**
 * MapPanel displays an interactive map with the current location
 */
export function MapPanel({ className = '', onMapClick, children }: MapPanelProps) {
  const mapRef = useRef<MapRef>(null);
  const location = useLocation();
  const { setLocation } = useSolarActions();
  const { hourly } = useSolarData();

  // 3D View modal state
  const [is3DViewOpen, setIs3DViewOpen] = useState(false);

  // Check if 3D view can be opened (need location and solar data)
  const can3DViewOpen = location !== null && hourly.length > 0;

  // Initialize view state with location if available
  const [viewState, setViewState] = useState<ViewState>(() => ({
    ...DEFAULT_VIEW,
    ...(location && {
      longitude: location.lng,
      latitude: location.lat,
    }),
  }));
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // Update view when location changes (jump to new location instantly)
  useEffect(() => {
    if (!location || !mapRef.current) return;

    mapRef.current.jumpTo({
      center: [location.lng, location.lat],
      zoom: viewState.zoom,
    });
  }, [location, viewState.zoom]);

  const handleMapClick = useCallback(
    (e: MapLayerMouseEvent) => {
      const { lng, lat } = e.lngLat;

      // Round to 6 decimal places
      const roundedLat = Math.round(lat * 1000000) / 1000000;
      const roundedLng = Math.round(lng * 1000000) / 1000000;

      // Update store
      setLocation({
        lat: roundedLat,
        lng: roundedLng,
        name: `${roundedLat.toFixed(4)}, ${roundedLng.toFixed(4)}`,
        source: 'manual',
      });

      // Call optional callback
      onMapClick?.(roundedLat, roundedLng);
    },
    [setLocation, onMapClick]
  );

  const handleGeolocate = useCallback(
    (position: GeolocationPosition) => {
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
    [setLocation]
  );

  return (
    <div className={`relative w-full h-full ${className}`}>
      <Map
        ref={mapRef}
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        onClick={handleMapClick}
        onLoad={() => setIsMapLoaded(true)}
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

      {/* Map loading indicator */}
      {!isMapLoaded && (
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

      {/* 3D View button - positioned at bottom right to avoid collision with SolarRaysLayer legend */}
      <button
        onClick={() => setIs3DViewOpen(true)}
        disabled={!can3DViewOpen}
        className="absolute bottom-3 right-3 z-20 inline-flex items-center gap-2.5 overflow-hidden rounded-full border pl-2 pr-3.5 py-2.5 text-[var(--solar-cta-text)] [border-color:var(--solar-cta-border)] [background:var(--solar-cta-bg)] [box-shadow:var(--solar-cta-shadow)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:[background:var(--solar-cta-hover-bg)] hover:[box-shadow:var(--solar-cta-hover-shadow)] disabled:[border-color:var(--solar-cta-disabled-border)] disabled:[background:var(--solar-cta-disabled-bg)] disabled:text-[var(--solar-cta-disabled-text)] disabled:shadow-none disabled:hover:translate-y-0 sm:bottom-4 sm:right-14 sm:gap-3 sm:pl-2.5 sm:pr-4 sm:py-3"
        aria-label="Open 3D solar path view"
        title={can3DViewOpen ? 'Open 3D View' : 'Select a location to enable 3D view'}
        data-testid="3d-view-button"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full [background:var(--solar-cta-icon-bg)] text-[var(--solar-cta-icon-text)] shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] sm:h-10 sm:w-10">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 3L2 12h3v9h14v-9h3L12 3z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        </span>
        <span className="flex flex-col items-start text-left leading-none">
          <span className="text-[0.62rem] font-medium uppercase tracking-[0.24em] text-[var(--solar-cta-kicker)]">
            Explore
          </span>
          <span className="text-sm font-semibold">3D View</span>
        </span>
      </button>

      {/* 3D View modal */}
      <Solar3DViewModal open={is3DViewOpen} onOpenChange={setIs3DViewOpen} />
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
