'use client';

/**
 * Solar3DMapCanvas Component
 *
 * Renders MapLibre GL + deck.gl 3D visualization.
 * This component must be dynamically imported with { ssr: false }.
 *
 * Features:
 * - MapLibre GL JS base map with 3D terrain view
 * - deck.gl ScatterplotLayer for hourly points
 * - deck.gl PathLayer for sun trajectory
 * - METER_OFFSETS coordinate system for location-based positioning
 * - Optional selected hour highlighting
 * - Hover tooltip support
 * - WebGL detection with graceful degradation
 */

import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import Map, { NavigationControl } from 'react-map-gl/maplibre';
import type { MapRef } from 'react-map-gl/maplibre';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { ScatterplotLayer, PathLayer, PolygonLayer, LineLayer, TextLayer } from '@deck.gl/layers';
import { SimpleMeshLayer } from '@deck.gl/mesh-layers';
import { SphereGeometry } from '@luma.gl/engine';
import type { PickingInfo } from '@deck.gl/core';
import 'maplibre-gl/dist/maplibre-gl.css';

import type { Solar3DViewData, Solar3DTooltipData, Solar3DPoint } from '@/types/solar3d';
import { SOLAR_3D_COLORS, SOLAR_3D_CONSTANTS } from '@/lib/solar3d/geometry';

/**
 * Check if WebGL is supported and functional in the browser.
 */
function isWebGLSupported(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return gl !== null;
  } catch {
    return false;
  }
}

// Carto Voyager style for better details
const MAP_STYLE = {
  version: 8 as const,
  name: 'Carto Voyager',
  sources: {
    osm: {
      type: 'raster' as const,
      tiles: [
        'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
        'https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
        'https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
      ],
      tileSize: 256,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
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

// Default 3D camera state
const DEFAULT_CAMERA = {
  zoom: 14,
  pitch: 60,
  bearing: 135, // Look towards Southeast (from Northwest)
};

export interface Solar3DMapCanvasProps {
  /**
   * Derived 3D view data including visible points and path.
   */
  viewData: Solar3DViewData;

  /**
   * Callback when user hovers over a point.
   * Called with null when hover ends.
   */
  onHover?: (tooltip: Solar3DTooltipData) => void;

  /**
   * Key to trigger camera reset. Increment to reset view.
   */
  resetKey?: number;
}

/**
 * WebGL not supported fallback component.
 * Shows a styled text summary of the solar path data.
 */
function WebGLFallback({ viewData }: { viewData: Solar3DViewData }) {
  const { snapshot, visiblePoints, isEmpty } = viewData;

  if (isEmpty) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-gray-900 p-8">
        <div className="text-center">
          <p className="text-lg text-gray-400 mb-2">
            Sun does not rise on this date at this location
          </p>
        </div>
      </div>
    );
  }

  // Find key data points
  const solarNoon = visiblePoints.reduce(
    (highest, current) => (current.altitudeDeg > highest.altitudeDeg ? current : highest),
    visiblePoints[0]
  );

  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-gray-900 p-8 overflow-auto">
      <div className="max-w-md text-center">
        <div className="mb-6">
          <svg
            className="w-16 h-16 mx-auto text-amber-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
            />
          </svg>
        </div>

        <p className="text-amber-300 text-sm mb-4">
          3D visualization requires WebGL support.
          <br />
          Here&apos;s a text summary instead:
        </p>

        <div className="bg-gray-800 rounded-lg p-4 text-left">
          <h3 className="text-white font-medium mb-2">Solar Path Summary</h3>

          <div className="space-y-1 text-sm">
            <p className="text-gray-300">
              <span className="text-gray-500">Visible Hours:</span> {visiblePoints.length}
            </p>
            <p className="text-gray-300">
              <span className="text-gray-500">First Light:</span> {visiblePoints[0]?.localTimeLabel}
            </p>
            <p className="text-gray-300">
              <span className="text-gray-500">Last Light:</span>{' '}
              {visiblePoints[visiblePoints.length - 1]?.localTimeLabel}
            </p>
            {solarNoon && (
              <p className="text-gray-300">
                <span className="text-gray-500">Solar Noon:</span> {solarNoon.localTimeLabel} (
                {solarNoon.altitudeDeg.toFixed(1)}° altitude)
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Solar3DMapCanvas
 *
 * Renders MapLibre GL + deck.gl 3D visualization.
 */
export function Solar3DMapCanvas({ viewData, onHover, resetKey = 0 }: Solar3DMapCanvasProps) {
  const mapRef = useRef<MapRef>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const deckOverlayRef = useRef<MapboxOverlay | null>(null);

  // Check WebGL support on mount
  const hasWebGL = useMemo(() => isWebGLSupported(), []);

  // Create sphere geometry for 3D sun points
  const sphereGeometry = useMemo(() => new SphereGeometry({ nlat: 20, nlong: 20 }), []);

  const { snapshot, visiblePoints, path, isSelectedVisible, isEmpty } = viewData;
  const { location, selectedHour } = snapshot;

  // Handle map load complete - mark initialization done
  const handleMapLoad = useCallback(() => {
    setIsMapLoaded(true);
    // Small delay to allow deck.gl to initialize
    setTimeout(() => setIsInitializing(false), 100);
  }, []);

  // Create deck.gl overlay on map load
  useEffect(() => {
    if (!isMapLoaded || !mapRef.current) return;

    const map = mapRef.current.getMap();

    // Create overlay if it doesn't exist
    if (!deckOverlayRef.current) {
      deckOverlayRef.current = new MapboxOverlay({
        interleaved: true,
        layers: [],
      });
      map.addControl(deckOverlayRef.current);
    }

    return () => {
      if (deckOverlayRef.current) {
        try {
          map.removeControl(deckOverlayRef.current);
        } catch {
          // Control may already be removed
        }
        deckOverlayRef.current = null;
      }
    };
  }, [isMapLoaded]);

  // Update deck.gl layers when data changes
  useEffect(() => {
    if (!deckOverlayRef.current || isEmpty) return;

    // Color helper
    const getPointColor = (point: Solar3DPoint): [number, number, number, number] => {
      // Check if this is the selected hour
      if (isSelectedVisible && selectedHour === point.hour) {
        return SOLAR_3D_COLORS.selected;
      }
      // Use daylight state color
      return point.daylightState === 'golden' ? SOLAR_3D_COLORS.golden : SOLAR_3D_COLORS.day;
    };

    // Get point radius
    const getPointRadius = (point: Solar3DPoint): number => {
      if (isSelectedVisible && selectedHour === point.hour) {
        return SOLAR_3D_CONSTANTS.POINT_RADIUS_SELECTED * 6; // Larger for selected point
      }
      return SOLAR_3D_CONSTANTS.POINT_RADIUS * 6; // Default radius
    };

    // Generate ground circle geometry
    const groundRadius = SOLAR_3D_CONSTANTS.GROUND_RADIUS_METERS;
    const groundPolygon = [];
    for (let i = 0; i <= 64; i++) {
      const angle = (i / 64) * 2 * Math.PI;
      groundPolygon.push([groundRadius * Math.sin(angle), groundRadius * Math.cos(angle), 0]);
    }

    // Compass lines
    const compassLines = [
      { from: [-groundRadius, 0, 0], to: [groundRadius, 0, 0] }, // W-E
      { from: [0, -groundRadius, 0], to: [0, groundRadius, 0] }, // S-N
    ];

    // Compass labels
    const compassLabels = [
      { text: 'N', position: [0, groundRadius * 0.9, 50] },
      { text: 'S', position: [0, -groundRadius * 0.9, 50] },
      { text: 'E', position: [groundRadius * 0.9, 0, 50] },
      { text: 'W', position: [-groundRadius * 0.9, 0, 50] },
    ];

    // Shadow path (projected to z=0)
    const shadowPath = path.positions.map((p) => [p[0], p[1], 0]);

    // Connector lines (center to sun points)
    const connectorLines = visiblePoints.map((p) => ({
      from: [0, 0, 0],
      to: p.position,
    }));

    const layers = [
      // Ground Plane
      new PolygonLayer({
        id: 'ground-plane',
        data: [{ polygon: groundPolygon }],
        getPolygon: (d: { polygon: number[][] }) => d.polygon,
        getFillColor: SOLAR_3D_COLORS.ground,
        getLineColor: [0, 0, 0, 0],
        filled: true,
        stroked: false,
        coordinateSystem: 2, // METER_OFFSETS
        coordinateOrigin: [location.lng, location.lat, 0],
        pickable: false,
      }),

      // Compass Lines
      new LineLayer({
        id: 'compass-lines',
        data: compassLines,
        getSourcePosition: (d: { from: number[] }) => d.from as [number, number, number],
        getTargetPosition: (d: { to: number[] }) => d.to as [number, number, number],
        getColor: SOLAR_3D_COLORS.compassLines,
        getWidth: 2,
        widthUnits: 'pixels',
        coordinateSystem: 2, // METER_OFFSETS
        coordinateOrigin: [location.lng, location.lat, 0],
        pickable: false,
      }),

      // Connector Lines (Center to Sun)
      new LineLayer({
        id: 'connector-lines',
        data: connectorLines,
        getSourcePosition: (d: { from: number[] }) => d.from as [number, number, number],
        getTargetPosition: (d: { to: number[] }) => d.to as [number, number, number],
        getColor: SOLAR_3D_COLORS.connectorLines,
        getWidth: 1,
        widthUnits: 'pixels',
        coordinateSystem: 2, // METER_OFFSETS
        coordinateOrigin: [location.lng, location.lat, 0],
        pickable: false,
      }),

      // Compass Labels
      new TextLayer({
        id: 'compass-labels',
        data: compassLabels,
        getPosition: (d: { position: number[] }) => d.position as [number, number, number],
        getText: (d: { text: string }) => d.text,
        getColor: SOLAR_3D_COLORS.compassText,
        getSize: 24,
        sizeUnits: 'pixels',
        getTextAnchor: 'middle',
        getAlignmentBaseline: 'center',
        coordinateSystem: 2, // METER_OFFSETS
        coordinateOrigin: [location.lng, location.lat, 0],
        pickable: false,
        fontFamily: 'Inter, system-ui, sans-serif',
        fontWeight: 'bold',
      }),

      // Location Marker (Center)
      new ScatterplotLayer({
        id: 'location-marker',
        data: [{ position: [0, 0, 0] }],
        getPosition: (d: { position: number[] }) => d.position as [number, number, number],
        getRadius: 8,
        getFillColor: SOLAR_3D_COLORS.locationMarker,
        radiusUnits: 'pixels',
        coordinateSystem: 2, // METER_OFFSETS
        coordinateOrigin: [location.lng, location.lat, 0],
        pickable: false,
        stroked: true,
        getLineColor: [255, 255, 255, 255],
        getLineWidth: 2,
      }),

      // Shadow Path
      new PathLayer({
        id: 'shadow-path',
        data: [{ path: shadowPath }],
        getPath: (d: { path: number[][] }) => d.path as [number, number, number][],
        getColor: SOLAR_3D_COLORS.shadowPath,
        getWidth: 4,
        widthUnits: 'meters',
        widthScale: 1,
        widthMinPixels: 2,
        widthMaxPixels: 8,
        coordinateSystem: 2, // METER_OFFSETS
        coordinateOrigin: [location.lng, location.lat, 0],
        pickable: false,
      }),

      // Path layer - connects all visible points
      new PathLayer({
        id: 'solar-path',
        data: [{ path: path.positions }],
        getPath: (d: { path: [number, number, number][] }) => d.path,
        getColor: SOLAR_3D_COLORS.path,
        getWidth: 6,
        widthUnits: 'meters',
        widthScale: 1,
        widthMinPixels: 3,
        widthMaxPixels: 12,
        coordinateSystem: 2, // METER_OFFSETS
        coordinateOrigin: [location.lng, location.lat, 0],
        pickable: false,
      }),

      // 3D Spheres for sun points
      new SimpleMeshLayer({
        id: 'solar-points',
        data: visiblePoints,
        mesh: sphereGeometry,
        getPosition: (d: Solar3DPoint) => d.position,
        getColor: (d: Solar3DPoint) => {
          const c = getPointColor(d);
          return [c[0], c[1], c[2]];
        },
        getScale: (d: Solar3DPoint) => {
          const r = getPointRadius(d);
          return [r, r, r];
        },
        getOrientation: [0, 0, 0],
        coordinateSystem: 2, // METER_OFFSETS
        coordinateOrigin: [location.lng, location.lat, 0],
        pickable: true,
        onHover: (info: PickingInfo<Solar3DPoint>) => {
          if (info.object && info.x !== undefined && info.y !== undefined) {
            onHover?.({
              x: info.x,
              y: info.y,
              hour: info.object.hour,
              localTimeLabel: info.object.localTimeLabel,
              azimuthDeg: info.object.azimuthDeg,
              altitudeDeg: info.object.altitudeDeg,
              daylightState: info.object.daylightState,
            });
          } else {
            onHover?.(null);
          }
        },
        updateTriggers: {
          getScale: [selectedHour, isSelectedVisible],
          getColor: [selectedHour, isSelectedVisible],
        },
        material: {
          ambient: 0.5,
          diffuse: 0.8,
          shininess: 32,
          specularColor: [255, 255, 255],
        },
      }),
    ];

    deckOverlayRef.current.setProps({ layers });
  }, [
    visiblePoints,
    path,
    selectedHour,
    isSelectedVisible,
    isEmpty,
    location,
    onHover,
    isMapLoaded,
  ]);

  // Handle reset view when resetKey changes
  useEffect(() => {
    if (resetKey > 0 && mapRef.current) {
      mapRef.current.easeTo({
        center: [location.lng, location.lat],
        zoom: DEFAULT_CAMERA.zoom,
        pitch: DEFAULT_CAMERA.pitch,
        bearing: DEFAULT_CAMERA.bearing,
        duration: 500,
      });
    }
  }, [resetKey, location]);

  // If WebGL is not supported, show fallback (must be after all hooks)
  if (!hasWebGL) {
    return <WebGLFallback viewData={viewData} />;
  }

  // Handle empty state
  if (isEmpty) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-gray-900">
        <div className="text-center p-8">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-gray-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
            />
          </svg>
          <p className="text-lg text-gray-400 mb-2">
            Sun does not rise on this date at this location
          </p>
          <p className="text-sm text-gray-500">
            This can occur during polar night at high latitudes
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: location.lng,
          latitude: location.lat,
          ...DEFAULT_CAMERA,
        }}
        mapStyle={MAP_STYLE}
        onLoad={handleMapLoad}
        reuseMaps
        style={{ width: '100%', height: '100%' }}
        maxPitch={85}
        attributionControl={{ compact: true }}
      >
        <NavigationControl position="top-right" showCompass showZoom />
      </Map>

      {/* Controls Instruction Note */}
      <div className="absolute top-3 right-14 z-10 bg-white/90 dark:bg-black/70 backdrop-blur-sm px-3 py-2 rounded-md shadow-sm border border-gray-200 dark:border-gray-700 pointer-events-none select-none">
        <p className="text-xs font-medium text-gray-700 dark:text-gray-200">
          Hold <span className="font-bold">Ctrl</span> + Drag to rotate view
        </p>
      </div>

      {/* Loading overlay - shows during initialization */}
      {isInitializing && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-gray-900 transition-opacity duration-300"
          style={{ opacity: isMapLoaded ? 0.5 : 1 }}
          data-testid="3d-map-loading"
        >
          <div className="flex flex-col items-center gap-3">
            {/* Animated sun icon */}
            <div className="relative">
              <svg
                className="w-16 h-16 text-amber-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
                />
              </svg>
              {/* Animated pulse ring */}
              <div className="absolute inset-0 animate-ping">
                <svg
                  className="w-16 h-16 text-amber-400 opacity-30"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <circle cx="12" cy="12" r="3.75" strokeWidth={1.5} />
                </svg>
              </div>
            </div>
            <span className="text-gray-400 text-sm">Loading 3D view...</span>
          </div>
        </div>
      )}
    </div>
  );
}
