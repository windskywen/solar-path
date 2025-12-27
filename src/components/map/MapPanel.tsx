'use client';

/**
 * MapPanel Component
 *
 * Interactive map using MapLibre GL and react-map-gl.
 * Displays the location marker and handles map interactions.
 */

import { useRef, useCallback, useState, useEffect } from 'react';
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
    if (location && mapRef.current) {
      mapRef.current.jumpTo({
        center: [location.lng, location.lat],
        zoom: viewState.zoom,
      });
    }
  }, [location?.lat, location?.lng, viewState.zoom]);

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
              className="w-4 h-4 bg-blue-500 border-2 border-white rounded-full shadow-lg"
              title={location.name || `${location.lat}, ${location.lng}`}
            />
          </Marker>
        )}

        {/* Additional layers (e.g., SolarRaysLayer) */}
        {isMapLoaded && children}
      </Map>

      {/* Map loading indicator */}
      {!isMapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-800">
          <div className="flex items-center gap-2 text-slate-500">
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
