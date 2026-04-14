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

const EARTH_RADIUS_METERS = 6378137;

type CameraBounds = [[number, number], [number, number]];

function metersOffsetToLngLat(
  location: { lat: number; lng: number },
  eastMeters: number,
  northMeters: number
): [number, number] {
  const latRadians = (location.lat * Math.PI) / 180;
  const safeCosLat = Math.max(Math.abs(Math.cos(latRadians)), 0.01);
  const latOffset = (northMeters / EARTH_RADIUS_METERS) * (180 / Math.PI);
  const lngOffset = (eastMeters / (EARTH_RADIUS_METERS * safeCosLat)) * (180 / Math.PI);

  return [location.lng + lngOffset, location.lat + latOffset];
}

function buildCameraBounds(
  location: { lat: number; lng: number },
  positions: [number, number, number][]
): CameraBounds | null {
  if (positions.length === 0) return null;

  const eastValues = positions.map(([east]) => east);
  const northValues = positions.map(([, north]) => north);
  const maxUp = positions.reduce((max, [, , up]) => Math.max(max, up), 0);

  const minEast = Math.min(...eastValues);
  const maxEast = Math.max(...eastValues);
  const minNorth = Math.min(...northValues);
  const maxNorth = Math.max(...northValues);
  const eastSpan = maxEast - minEast;
  const northSpan = maxNorth - minNorth;
  const edgeBuffer = Math.max(20, eastSpan * 0.12, northSpan * 0.12, maxUp * 0.25);

  const southwest = metersOffsetToLngLat(location, minEast - edgeBuffer, minNorth - edgeBuffer);
  const northeast = metersOffsetToLngLat(location, maxEast + edgeBuffer, maxNorth + edgeBuffer);

  return [southwest, northeast];
}

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
  const locationLabel =
    snapshot.location.name ||
    `${snapshot.location.lat.toFixed(4)}°, ${snapshot.location.lng.toFixed(4)}°`;

  if (isEmpty) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#040611] p-6 sm:p-8">
        <div className="max-w-lg rounded-[30px] border border-white/10 bg-[#071022]/76 px-6 py-7 text-center shadow-[0_32px_100px_rgba(2,6,23,0.48)] backdrop-blur-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-slate-200">
            <svg
              className="h-8 w-8"
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
          </div>
          <p className="mt-4 text-[0.65rem] font-medium uppercase tracking-[0.32em] text-slate-400/70">
            Polar night
          </p>
          <p className="mt-2 text-lg text-slate-100">Sun does not rise on this date</p>
          <p className="mt-2 text-sm leading-6 text-slate-300/80">
            The viewer is centered on {locationLabel} for {snapshot.dateISO}.
          </p>
          <p className="mt-1 text-sm text-slate-400">
            High-latitude locations can remain below the horizon all day.
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
    <div className="flex h-full w-full items-center justify-center overflow-auto bg-[#040611] p-6 sm:p-8">
      <div className="max-w-lg rounded-[30px] border border-white/10 bg-[#071022]/76 px-6 py-7 text-left shadow-[0_32px_100px_rgba(2,6,23,0.48)] backdrop-blur-xl">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-amber-300/20 bg-amber-300/10 text-amber-200 shadow-[0_0_36px_rgba(251,191,36,0.16)]">
            <svg
              className="h-8 w-8"
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
          <div>
            <p className="text-[0.65rem] font-medium uppercase tracking-[0.32em] text-cyan-200/65">
              Compatibility mode
            </p>
            <h3 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-white">
              Solar Path Summary
            </h3>
          </div>
        </div>

        <p className="text-sm leading-6 text-slate-300/80">
          3D visualization requires WebGL support. Here&apos;s the same solar scene distilled into a
          readable summary for {locationLabel} on {snapshot.dateISO}.
        </p>

        <div className="mt-6 rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
          <div className="mb-4 grid gap-2 text-sm text-slate-300/80 sm:grid-cols-2">
            <p>
              <span className="text-slate-500">Visible Hours:</span> {visiblePoints.length}
            </p>
            <p>
              <span className="text-slate-500">Timezone:</span> {snapshot.timezone}
            </p>
          </div>

          <div className="grid gap-2 text-sm">
            <p className="text-slate-300">
              <span className="text-slate-500">First Light:</span>{' '}
              {visiblePoints[0]?.localTimeLabel}
            </p>
            <p className="text-slate-300">
              <span className="text-slate-500">Last Light:</span>{' '}
              {visiblePoints[visiblePoints.length - 1]?.localTimeLabel}
            </p>
            {solarNoon && (
              <p className="text-slate-300">
                <span className="text-slate-500">Solar Noon:</span> {solarNoon.localTimeLabel} (
                {solarNoon.altitudeDeg.toFixed(1)}° altitude)
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 hidden sm:block">
          <svg
            className="h-16 w-16 text-amber-400/30"
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
  const lastAutoFitKeyRef = useRef<string | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const deckOverlayRef = useRef<MapboxOverlay | null>(null);

  // Check WebGL support on mount
  const hasWebGL = useMemo(() => isWebGLSupported(), []);

  // Create sphere geometry for 3D sun points
  const sphereGeometry = useMemo(() => new SphereGeometry({ nlat: 20, nlong: 20 }), []);

  const { snapshot, visiblePoints, path, isSelectedVisible, isEmpty } = viewData;
  const { location, selectedHour } = snapshot;
  const cameraGeometryKey = useMemo(() => {
    const geometryPositions =
      path.positions.length > 0 ? path.positions : visiblePoints.map((point) => point.position);

    return [
      location.lat.toFixed(6),
      location.lng.toFixed(6),
      ...geometryPositions.map(([east, north, up]) => {
        return `${east.toFixed(1)},${north.toFixed(1)},${up.toFixed(1)}`;
      }),
    ].join('|');
  }, [location.lat, location.lng, path.positions, visiblePoints]);
  const cameraBounds = useMemo(() => {
    if (isEmpty) return null;

    const geometryPositions =
      path.positions.length > 0 ? path.positions : visiblePoints.map((point) => point.position);

    return buildCameraBounds(location, [[0, 0, 0], ...geometryPositions]);
  }, [isEmpty, location, path.positions, visiblePoints]);

  const fitMapToVisibleGeometry = useCallback(
    (duration: number) => {
      if (!mapRef.current) return;

      if (!cameraBounds) {
        mapRef.current.easeTo({
          center: [location.lng, location.lat],
          zoom: DEFAULT_CAMERA.zoom,
          pitch: DEFAULT_CAMERA.pitch,
          bearing: DEFAULT_CAMERA.bearing,
          duration,
        });
        return;
      }

      const map = mapRef.current.getMap();
      const { clientWidth } = map.getContainer();
      const isCompactViewport = clientWidth < 640;

      map.fitBounds(cameraBounds, {
        padding: isCompactViewport
          ? { top: 88, right: 28, bottom: 176, left: 28 }
          : { top: 108, right: 88, bottom: 168, left: 88 },
        pitch: DEFAULT_CAMERA.pitch,
        bearing: DEFAULT_CAMERA.bearing,
        duration,
        maxZoom: DEFAULT_CAMERA.zoom,
      });
    },
    [cameraBounds, location.lat, location.lng]
  );

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
    sphereGeometry,
  ]);

  useEffect(() => {
    if (!isMapLoaded || !mapRef.current) return;
    if (lastAutoFitKeyRef.current === cameraGeometryKey) return;

    fitMapToVisibleGeometry(0);
    lastAutoFitKeyRef.current = cameraGeometryKey;
  }, [isMapLoaded, cameraGeometryKey, fitMapToVisibleGeometry]);

  // Handle reset view when resetKey changes
  useEffect(() => {
    if (resetKey > 0 && mapRef.current) {
      fitMapToVisibleGeometry(500);
      lastAutoFitKeyRef.current = cameraGeometryKey;
    }
  }, [cameraGeometryKey, fitMapToVisibleGeometry, resetKey]);

  // If WebGL is not supported, show fallback (must be after all hooks)
  if (!hasWebGL) {
    return <WebGLFallback viewData={viewData} />;
  }

  // Handle empty state
  if (isEmpty) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#040611] p-6 sm:p-8">
        <div className="max-w-lg rounded-[30px] border border-white/10 bg-[#071022]/76 px-6 py-7 text-center shadow-[0_32px_100px_rgba(2,6,23,0.48)] backdrop-blur-xl">
          <svg
            className="mx-auto mb-4 h-16 w-16 text-slate-500"
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
          <p className="text-[0.65rem] font-medium uppercase tracking-[0.32em] text-slate-400/70">
            Polar night
          </p>
          <p className="mt-2 text-lg text-slate-100">Sun does not rise on this date</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            This can occur during polar night at high latitudes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#040611]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute left-8 top-8 h-44 w-44 rounded-full bg-cyan-400/12 blur-3xl" />
        <div className="absolute bottom-8 right-8 h-56 w-56 rounded-full bg-amber-300/10 blur-3xl" />
      </div>

      <div className="absolute inset-0 z-0">
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
      </div>

      <div className="pointer-events-none absolute left-3 right-3 top-3 z-20 sm:left-4 sm:right-auto">
        <div className="inline-flex max-w-[18rem] items-center gap-3 rounded-full border border-white/10 bg-[#071022]/72 px-3 py-2 shadow-[0_16px_42px_rgba(2,6,23,0.34)] backdrop-blur-xl">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-400/10 text-cyan-100 shadow-[0_0_24px_rgba(56,189,248,0.18)]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m4 14 6-6 4 4 6-6" />
              <path d="M20 10V4h-6" />
            </svg>
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[0.62rem] font-medium uppercase tracking-[0.28em] text-cyan-200/65">
              Camera
            </span>
            <span className="hidden text-xs font-medium text-slate-100 sm:inline">
              Hold Ctrl + Drag to rotate view
            </span>
            <span className="text-xs font-medium text-slate-100 sm:hidden">
              Use gestures and controls to explore
            </span>
          </div>
        </div>
      </div>

      {isInitializing && (
        <div
          className="absolute inset-0 z-30 flex items-center justify-center bg-[#040611]/78 transition-opacity duration-500 backdrop-blur-sm"
          style={{ opacity: isMapLoaded ? 0.5 : 1 }}
          data-testid="3d-map-loading"
        >
          <div className="rounded-[28px] border border-white/10 bg-[#071022]/78 px-6 py-5 text-center shadow-[0_28px_90px_rgba(2,6,23,0.48)] backdrop-blur-xl">
            <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-amber-300/25 bg-amber-300/10 blur-[1px]" />
              <div className="absolute inset-3 rounded-full border border-cyan-300/25 bg-cyan-400/10" />
              <svg
                className="relative h-12 w-12 text-amber-300"
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
              <div className="absolute inset-0 animate-ping">
                <svg
                  className="h-20 w-20 text-amber-300 opacity-25"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <circle cx="12" cy="12" r="3.75" strokeWidth={1.5} />
                </svg>
              </div>
            </div>
            <p className="mt-4 text-[0.65rem] font-medium uppercase tracking-[0.32em] text-cyan-200/65">
              Initializing
            </p>
            <span className="mt-2 block text-sm text-slate-300">Loading 3D view...</span>
          </div>
        </div>
      )}
    </div>
  );
}
