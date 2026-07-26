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
import type { ErrorEvent as MapErrorEvent, MapRef } from 'react-map-gl/maplibre';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { ScatterplotLayer, PathLayer, LineLayer, TextLayer } from '@deck.gl/layers';
import { SimpleMeshLayer } from '@deck.gl/mesh-layers';
import { SphereGeometry } from '@luma.gl/engine';
import type { Deck, PickingInfo, WebMercatorViewport } from '@deck.gl/core';
import type { MapSourceDataEvent } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

import type { Solar3DViewData, Solar3DTooltipData, Solar3DPoint } from '@/types/solar3d';
import { SOLAR_3D_COLORS } from '@/lib/solar3d/geometry';
import {
  ensureSolar3DMapScene,
  getNextPerformanceMode,
  getSceneVisibility,
  getSolarCoordinateOrigin,
  MAPTERHORN_TERRAIN_SOURCE_ID,
  OPENFREEMAP_BUILDING_LAYER_ID,
  OPENFREEMAP_BUILDING_SOURCE_ID,
  OPENFREEMAP_STYLE_URL,
  type Solar3DPerformanceMode,
} from '@/lib/solar3d/map-scene';
import {
  buildAdaptiveSolarGeometry,
  buildSolarReferenceGeometry,
  calculateSolarBaseHeight,
  calculateSolarSceneMetrics,
  calculateSolarViewportFit,
  getCameraFocusElevation,
  SOLAR_SCENE_CAMERA,
  type BuildingFeatureLike,
} from '@/lib/solar3d/scene-metrics';

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

// Lightweight fallback when the public 3D style or sources are unavailable.
const FALLBACK_MAP_STYLE = {
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

const MAP_LOAD_TIMEOUT_MS = 10_000;
const LOW_FPS_THRESHOLD = 30;
const LOW_FPS_WINDOW_MS = 3_000;
const INITIAL_SOLAR_VIEWPORT_SCALE = 0.7;

type MapboxOverlayWithDeck = {
  _deck?: Deck;
};

function getSolarProjectionViewport(
  overlay: MapboxOverlay | null
): WebMercatorViewport | null {
  const deck = (overlay as unknown as MapboxOverlayWithDeck | null)?._deck;
  const viewport = deck?.getViewports().find((candidate) => {
    return 'addMetersToLngLat' in candidate;
  });

  return (viewport as WebMercatorViewport | undefined) ?? null;
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
      <div
        className="flex h-full w-full items-center justify-center [background:var(--solar-3d-root-bg)] p-6 sm:p-8"
        data-testid="solar-3d-summary"
      >
        <div className="max-w-lg rounded-[30px] border [border-color:var(--solar-3d-surface-border)] [background:var(--solar-3d-surface-bg)] px-6 py-7 text-center [box-shadow:var(--solar-3d-surface-shadow)] backdrop-blur-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border [border-color:var(--solar-surface-border)] [background:var(--solar-surface-soft-bg)] text-[var(--solar-text)]">
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
          <p className="mt-4 text-[0.65rem] font-medium uppercase tracking-[0.32em] text-[var(--solar-text-faint)]">
            Polar night
          </p>
          <p className="mt-2 text-lg text-[var(--solar-text-strong)]">Sun does not rise on this date</p>
          <p className="mt-2 text-sm leading-6 text-[var(--solar-text)]">
            The viewer is centered on {locationLabel} for {snapshot.dateISO}.
          </p>
          <p className="mt-1 text-sm text-[var(--solar-text-muted)]">
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
    <div
      className="flex h-full w-full items-center justify-center overflow-auto [background:var(--solar-3d-root-bg)] p-6 sm:p-8"
      data-testid="solar-3d-summary"
    >
      <div className="max-w-lg rounded-[30px] border [border-color:var(--solar-3d-surface-border)] [background:var(--solar-3d-surface-bg)] px-6 py-7 text-left [box-shadow:var(--solar-3d-surface-shadow)] backdrop-blur-xl">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border [border-color:var(--solar-warning-border)] [background:var(--solar-warning-bg)] text-[var(--solar-warning-text)] shadow-[0_0_36px_rgba(251,191,36,0.16)]">
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
            <p className="text-[0.65rem] font-medium uppercase tracking-[0.32em] text-[var(--solar-3d-kicker)]">
              Compatibility mode
            </p>
            <h3 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[var(--solar-text-strong)]">
              Solar Path Summary
            </h3>
          </div>
        </div>

        <p className="text-sm leading-6 text-[var(--solar-text)]">
          The interactive 3D scene is unavailable. Here&apos;s the same solar scene distilled into a
          readable summary for {locationLabel} on {snapshot.dateISO}.
        </p>

        <div className="mt-6 rounded-[24px] border [border-color:var(--solar-surface-border)] [background:var(--solar-surface-soft-bg)] p-4">
          <div className="mb-4 grid gap-2 text-sm text-[var(--solar-text)] sm:grid-cols-2">
            <p>
              <span className="text-[var(--solar-text-faint)]">Visible Hours:</span> {visiblePoints.length}
            </p>
            <p>
              <span className="text-[var(--solar-text-faint)]">Timezone:</span> {snapshot.timezone}
            </p>
          </div>

          <div className="grid gap-2 text-sm">
            <p className="text-[var(--solar-text)]">
              <span className="text-[var(--solar-text-faint)]">First Light:</span>{' '}
              {visiblePoints[0]?.localTimeLabel}
            </p>
            <p className="text-[var(--solar-text)]">
              <span className="text-[var(--solar-text-faint)]">Last Light:</span>{' '}
              {visiblePoints[visiblePoints.length - 1]?.localTimeLabel}
            </p>
            {solarNoon && (
              <p className="text-[var(--solar-text)]">
                <span className="text-[var(--solar-text-faint)]">Solar Noon:</span> {solarNoon.localTimeLabel} (
                {solarNoon.altitudeDeg.toFixed(1)}° altitude)
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 hidden sm:block">
          <svg
            className="h-16 w-16 text-[var(--solar-warning-text)] opacity-30"
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
  const initializationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const zoomFrameRef = useRef<number | null>(null);
  const clearanceFrameRef = useRef<number | null>(null);
  const viewportFitFrameRef = useRef<number | null>(null);
  const sceneRetryCountRef = useRef(0);
  const isRecoveringSceneRef = useRef(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [mapInstanceKey, setMapInstanceKey] = useState(0);
  const [mapProvider, setMapProvider] = useState<'openfreemap' | 'fallback'>('openfreemap');
  const [performanceMode, setPerformanceMode] =
    useState<Solar3DPerformanceMode>('full-3d');
  const [terrainElevation, setTerrainElevation] = useState(0);
  const [sceneZoom, setSceneZoom] = useState<number>(SOLAR_SCENE_CAMERA.zoom);
  const [viewportSize, setViewportSize] = useState(() => ({
    width: typeof window === 'undefined' ? 1 : window.innerWidth,
    height: typeof window === 'undefined' ? 1 : window.innerHeight,
  }));
  const [solarBaseHeight, setSolarBaseHeight] = useState(30);
  const [solarViewportScale, setSolarViewportScale] = useState(
    INITIAL_SOLAR_VIEWPORT_SCALE
  );
  const [solarViewportContained, setSolarViewportContained] = useState(false);
  const [solarScreenBounds, setSolarScreenBounds] = useState<string>('pending');
  const [solarViewportMeasuredZoom, setSolarViewportMeasuredZoom] = useState<
    number | null
  >(null);
  const [cameraOrientationRevision, setCameraOrientationRevision] = useState(0);
  const deckOverlayRef = useRef<MapboxOverlay | null>(null);

  // Check WebGL support on mount
  const hasWebGL = useMemo(() => isWebGLSupported(), []);
  const isCompactDevice = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 767px)').matches;
  }, []);

  // Create sphere geometry for 3D sun points
  const sphereGeometry = useMemo(
    () =>
      new SphereGeometry({
        nlat: isCompactDevice ? 10 : 20,
        nlong: isCompactDevice ? 10 : 20,
      }),
    [isCompactDevice]
  );

  const { snapshot, visiblePoints, isSelectedVisible, isEmpty } = viewData;
  const { location, selectedHour } = snapshot;
  const sceneMetrics = useMemo(
    () =>
      calculateSolarSceneMetrics({
        latitude: location.lat,
        zoom: sceneZoom,
        viewportWidth: viewportSize.width,
        viewportHeight: viewportSize.height,
        isCompact: isCompactDevice,
      }),
    [
      isCompactDevice,
      location.lat,
      sceneZoom,
      viewportSize.height,
      viewportSize.width,
    ]
  );
  const effectivePathRadiusMeters =
    sceneMetrics.pathRadiusMeters * solarViewportScale;
  const effectivePathRadiusPixels =
    sceneMetrics.pathRadiusPixels * solarViewportScale;
  const adaptiveGeometry = useMemo(
    () =>
      buildAdaptiveSolarGeometry(
        visiblePoints,
        effectivePathRadiusMeters,
        solarBaseHeight
      ),
    [effectivePathRadiusMeters, solarBaseHeight, visiblePoints]
  );
  const referenceGeometry = useMemo(
    () =>
      buildSolarReferenceGeometry(
        effectivePathRadiusMeters,
        solarBaseHeight
      ),
    [effectivePathRadiusMeters, solarBaseHeight]
  );
  const appliedTerrainElevation =
    mapProvider === 'openfreemap' && getSceneVisibility(performanceMode).terrain
      ? terrainElevation
      : 0;
  const coordinateOrigin = useMemo(
    () => getSolarCoordinateOrigin(location, appliedTerrainElevation),
    [location, appliedTerrainElevation]
  );
  const cameraFocusElevation = getCameraFocusElevation(
    appliedTerrainElevation,
    solarBaseHeight
  );
  const resetMapCamera = useCallback(
    (duration: number) => {
      if (!mapRef.current) return;

      mapRef.current.easeTo({
        center: [location.lng, location.lat],
        zoom: SOLAR_SCENE_CAMERA.zoom,
        pitch: SOLAR_SCENE_CAMERA.pitch,
        bearing: SOLAR_SCENE_CAMERA.bearing,
        elevation: cameraFocusElevation,
        duration,
      });
    },
    [cameraFocusElevation, location.lat, location.lng]
  );

  const recoverSceneLoad = useCallback(() => {
    if (isRecoveringSceneRef.current) return;
    isRecoveringSceneRef.current = true;

    setIsMapLoaded(false);
    setIsInitializing(true);
    setTerrainElevation(0);
    setSolarBaseHeight(30);
    setSceneZoom(SOLAR_SCENE_CAMERA.zoom);
    setSolarViewportScale(INITIAL_SOLAR_VIEWPORT_SCALE);
    setSolarViewportContained(false);
    setSolarScreenBounds('pending');
    setSolarViewportMeasuredZoom(null);
    onHover?.(null);

    if (mapProvider === 'openfreemap' && sceneRetryCountRef.current < 1) {
      sceneRetryCountRef.current += 1;
      setMapInstanceKey((current) => current + 1);
      return;
    }

    if (mapProvider === 'openfreemap') {
      setMapProvider('fallback');
      setPerformanceMode('flat');
      setMapInstanceKey((current) => current + 1);
      return;
    }

    setPerformanceMode('summary');
    setIsInitializing(false);
  }, [mapProvider, onHover]);

  const handleMapLoad = useCallback(() => {
    if (!mapRef.current) return;

    if (mapProvider === 'openfreemap') {
      try {
        ensureSolar3DMapScene(mapRef.current.getMap(), performanceMode);
      } catch {
        recoverSceneLoad();
        return;
      }
    }

    isRecoveringSceneRef.current = false;
    setIsMapLoaded(true);

    if (initializationTimerRef.current) {
      clearTimeout(initializationTimerRef.current);
    }
    initializationTimerRef.current = setTimeout(() => setIsInitializing(false), 100);
  }, [mapProvider, performanceMode, recoverSceneLoad]);

  const handleMapError = useCallback(
    (event: MapErrorEvent) => {
      const sourceId = (event as MapErrorEvent & { sourceId?: string }).sourceId;
      const isCriticalSceneSource =
        sourceId === OPENFREEMAP_BUILDING_SOURCE_ID ||
        sourceId === MAPTERHORN_TERRAIN_SOURCE_ID;

      if (!isMapLoaded || isCriticalSceneSource) {
        recoverSceneLoad();
      }
    },
    [isMapLoaded, recoverSceneLoad]
  );

  useEffect(() => {
    if (!hasWebGL || isEmpty || isMapLoaded || performanceMode === 'summary') return;

    isRecoveringSceneRef.current = false;
    const timeoutId = setTimeout(recoverSceneLoad, MAP_LOAD_TIMEOUT_MS);

    return () => clearTimeout(timeoutId);
  }, [
    hasWebGL,
    isEmpty,
    isMapLoaded,
    mapInstanceKey,
    mapProvider,
    performanceMode,
    recoverSceneLoad,
  ]);

  useEffect(() => {
    return () => {
      if (initializationTimerRef.current) {
        clearTimeout(initializationTimerRef.current);
      }
      onHover?.(null);
    };
  }, [onHover]);

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

  useEffect(() => {
    if (!isMapLoaded || !mapRef.current || mapProvider !== 'openfreemap') return;

    const map = mapRef.current.getMap();
    const syncScene = () => {
      try {
        ensureSolar3DMapScene(map, performanceMode);
      } catch {
        recoverSceneLoad();
      }
    };

    syncScene();
    map.on('style.load', syncScene);

    return () => {
      map.off('style.load', syncScene);
    };
  }, [isMapLoaded, mapProvider, performanceMode, recoverSceneLoad]);

  useEffect(() => {
    if (!isMapLoaded || !mapRef.current) return;

    const map = mapRef.current.getMap();
    const container = map.getContainer();

    const sampleViewport = () => {
      const nextWidth = Math.max(1, container.clientWidth);
      const nextHeight = Math.max(1, container.clientHeight);
      setViewportSize((current) =>
        current.width === nextWidth && current.height === nextHeight
          ? current
          : { width: nextWidth, height: nextHeight }
      );
    };
    const sampleZoom = () => {
      if (zoomFrameRef.current !== null) return;

      zoomFrameRef.current = requestAnimationFrame(() => {
        zoomFrameRef.current = null;
        const nextZoom = map.getZoom();
        setSceneZoom((current) =>
          Math.abs(current - nextZoom) >= 0.005 ? nextZoom : current
        );
      });
    };
    const sampleCameraOrientation = () => {
      setCameraOrientationRevision((current) => current + 1);
    };

    sampleViewport();
    sampleZoom();
    sampleCameraOrientation();
    const resizeObserver = new ResizeObserver(sampleViewport);
    resizeObserver.observe(container);
    map.on('zoom', sampleZoom);
    map.on('pitchend', sampleCameraOrientation);
    map.on('rotateend', sampleCameraOrientation);

    return () => {
      resizeObserver.disconnect();
      map.off('zoom', sampleZoom);
      map.off('pitchend', sampleCameraOrientation);
      map.off('rotateend', sampleCameraOrientation);
      if (zoomFrameRef.current !== null) {
        cancelAnimationFrame(zoomFrameRef.current);
        zoomFrameRef.current = null;
      }
    };
  }, [isMapLoaded, mapInstanceKey]);

  useEffect(() => {
    if (!isMapLoaded || !mapRef.current) return;

    const visibility = getSceneVisibility(performanceMode);
    if (mapProvider !== 'openfreemap' || !visibility.terrain) {
      return;
    }

    const map = mapRef.current.getMap();
    const refreshTerrainElevation = () => {
      const elevation = map.queryTerrainElevation([location.lng, location.lat]);
      if (!Number.isFinite(elevation)) return;

      setTerrainElevation((current) =>
        Math.abs(current - (elevation as number)) >= 0.1 ? (elevation as number) : current
      );
    };

    refreshTerrainElevation();
    map.on('idle', refreshTerrainElevation);

    return () => {
      map.off('idle', refreshTerrainElevation);
    };
  }, [
    isMapLoaded,
    location.lat,
    location.lng,
    mapProvider,
    performanceMode,
  ]);

  useEffect(() => {
    if (
      !isMapLoaded ||
      !mapRef.current ||
      mapProvider !== 'openfreemap' ||
      performanceMode !== 'full-3d'
    ) {
      return;
    }

    const map = mapRef.current.getMap();
    const refreshBuildingClearance = () => {
      if (clearanceFrameRef.current !== null) return;

      clearanceFrameRef.current = requestAnimationFrame(() => {
        clearanceFrameRef.current = null;
        if (!map.getLayer(OPENFREEMAP_BUILDING_LAYER_ID)) return;

        try {
          const center = map.project([location.lng, location.lat]);
          const radius = effectivePathRadiusPixels;
          const features = map.queryRenderedFeatures(
            [
              [center.x - radius, center.y - radius],
              [center.x + radius, center.y + radius],
            ],
            { layers: [OPENFREEMAP_BUILDING_LAYER_ID] }
          );
          const nextBaseHeight = calculateSolarBaseHeight(
            features as BuildingFeatureLike[]
          );
          setSolarBaseHeight((current) =>
            Math.abs(current - nextBaseHeight) >= 0.5 ? nextBaseHeight : current
          );
        } catch {
          // The style may be transitioning; the next idle/source event retries the query.
        }
      });
    };
    const handleSourceData = (event: MapSourceDataEvent) => {
      if (event.sourceId === OPENFREEMAP_BUILDING_SOURCE_ID) {
        refreshBuildingClearance();
      }
    };

    refreshBuildingClearance();
    map.on('idle', refreshBuildingClearance);
    map.on('zoomend', refreshBuildingClearance);
    map.on('sourcedata', handleSourceData);

    return () => {
      map.off('idle', refreshBuildingClearance);
      map.off('zoomend', refreshBuildingClearance);
      map.off('sourcedata', handleSourceData);
      if (clearanceFrameRef.current !== null) {
        cancelAnimationFrame(clearanceFrameRef.current);
        clearanceFrameRef.current = null;
      }
    };
  }, [
    isMapLoaded,
    location.lat,
    location.lng,
    mapProvider,
    performanceMode,
    effectivePathRadiusPixels,
  ]);

  useEffect(() => {
    if (!isMapLoaded || !mapRef.current) return;

    const map = mapRef.current.getMap();
    const refreshCameraFocus = () => {
      if (map.isMoving()) return;
      if (Math.abs(map.getCenterElevation() - cameraFocusElevation) >= 0.1) {
        map.setCenterElevation(cameraFocusElevation);
        setCameraOrientationRevision((current) => current + 1);
      }
    };

    refreshCameraFocus();
    map.on('idle', refreshCameraFocus);
    map.on('zoomend', refreshCameraFocus);

    return () => {
      map.off('idle', refreshCameraFocus);
      map.off('zoomend', refreshCameraFocus);
    };
  }, [
    cameraFocusElevation,
    isMapLoaded,
  ]);

  useEffect(() => {
    if (!isMapLoaded || !mapRef.current) return;

    const map = mapRef.current.getMap();
    let animationFrameId: number | null = null;
    let isInteracting = false;
    let sampleStartedAt = 0;
    let frameCount = 0;

    const sampleFrameRate = (timestamp: number) => {
      if (!isInteracting) return;

      if (sampleStartedAt === 0) {
        sampleStartedAt = timestamp;
      }
      frameCount += 1;

      const elapsed = timestamp - sampleStartedAt;
      if (elapsed >= LOW_FPS_WINDOW_MS) {
        const fps = (frameCount * 1000) / elapsed;
        if (fps < LOW_FPS_THRESHOLD) {
          setPerformanceMode((current) => getNextPerformanceMode(current));
        }
        sampleStartedAt = timestamp;
        frameCount = 0;
      }

      animationFrameId = requestAnimationFrame(sampleFrameRate);
    };

    const startMonitoring = () => {
      if (isInteracting) return;
      isInteracting = true;
      sampleStartedAt = 0;
      frameCount = 0;
      animationFrameId = requestAnimationFrame(sampleFrameRate);
    };

    const stopMonitoring = () => {
      isInteracting = false;
      sampleStartedAt = 0;
      frameCount = 0;
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
    };

    map.on('movestart', startMonitoring);
    map.on('moveend', stopMonitoring);

    return () => {
      stopMonitoring();
      map.off('movestart', startMonitoring);
      map.off('moveend', stopMonitoring);
    };
  }, [isMapLoaded]);

  useEffect(() => {
    if (!isMapLoaded || !mapRef.current || performanceMode === 'summary') return;

    const canvas = mapRef.current.getMap().getCanvas();
    const handleContextLost: EventListener = (event) => {
      event.preventDefault();
      onHover?.(null);
      setIsMapLoaded(false);
      setPerformanceMode('summary');
    };

    canvas.addEventListener('webglcontextlost', handleContextLost);
    return () => canvas.removeEventListener('webglcontextlost', handleContextLost);
  }, [isMapLoaded, onHover, performanceMode]);

  // Update deck.gl layers when data changes
  useEffect(() => {
    if (!deckOverlayRef.current) return;
    if (isEmpty) {
      deckOverlayRef.current.setProps({ layers: [] });
      return;
    }

    // Color helper
    const getPointColor = (point: Solar3DPoint): [number, number, number, number] => {
      // Check if this is the selected hour
      if (isSelectedVisible && selectedHour === point.hour) {
        return SOLAR_3D_COLORS.selected;
      }
      // Use daylight state color
      return point.daylightState === 'golden' ? SOLAR_3D_COLORS.golden : SOLAR_3D_COLORS.day;
    };

    const getPointRadiusMeters = (point: Solar3DPoint): number => {
      if (isSelectedVisible && selectedHour === point.hour) {
        return sceneMetrics.selectedSunRadiusMeters;
      }
      return sceneMetrics.sunRadiusMeters;
    };

    const layers = [
      // Compass Lines
      new LineLayer({
        id: 'compass-lines',
        data: referenceGeometry.compassLines,
        getSourcePosition: (d: { from: number[] }) => d.from as [number, number, number],
        getTargetPosition: (d: { to: number[] }) => d.to as [number, number, number],
        getColor: SOLAR_3D_COLORS.compassLines,
        getWidth: 2,
        widthUnits: 'pixels',
        coordinateSystem: 2, // METER_OFFSETS
        coordinateOrigin,
        pickable: false,
      }),

      // Low-interference anchor from the terrain location to the floating solar origin.
      new LineLayer({
        id: 'solar-origin-anchor',
        data: [referenceGeometry.anchorLine],
        getSourcePosition: (d: { from: number[] }) => d.from as [number, number, number],
        getTargetPosition: (d: { to: number[] }) => d.to as [number, number, number],
        getColor: [255, 255, 255, 72],
        getWidth: 1,
        widthUnits: 'pixels',
        coordinateSystem: 2, // METER_OFFSETS
        coordinateOrigin,
        pickable: false,
      }),

      // Connector Lines (Center to Sun)
      new LineLayer({
        id: 'connector-lines',
        data: adaptiveGeometry.connectorLines,
        getSourcePosition: (d: { from: number[] }) => d.from as [number, number, number],
        getTargetPosition: (d: { to: number[] }) => d.to as [number, number, number],
        getColor: SOLAR_3D_COLORS.connectorLines,
        getWidth: 1,
        widthUnits: 'pixels',
        coordinateSystem: 2, // METER_OFFSETS
        coordinateOrigin,
        pickable: false,
      }),

      // Compass Labels
      new TextLayer({
        id: 'compass-labels',
        data: referenceGeometry.compassLabels,
        getPosition: (d: { position: number[] }) => d.position as [number, number, number],
        getText: (d: { text: string }) => d.text,
        getColor: SOLAR_3D_COLORS.compassText,
        getSize: 24,
        sizeUnits: 'pixels',
        getTextAnchor: 'middle',
        getAlignmentBaseline: 'center',
        coordinateSystem: 2, // METER_OFFSETS
        coordinateOrigin,
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
        coordinateOrigin,
        pickable: false,
        stroked: true,
        getLineColor: [255, 255, 255, 255],
        getLineWidth: 2,
      }),

      // Shadow Path
      new PathLayer({
        id: 'shadow-path',
        data: [{ path: adaptiveGeometry.shadowPositions }],
        getPath: (d: { path: number[][] }) => d.path as [number, number, number][],
        getColor: SOLAR_3D_COLORS.shadowPath,
        getWidth: 2,
        widthUnits: 'pixels',
        coordinateSystem: 2, // METER_OFFSETS
        coordinateOrigin,
        pickable: false,
      }),

      // Path layer - connects all visible points
      new PathLayer({
        id: 'solar-path',
        data: [{ path: adaptiveGeometry.pathPositions }],
        getPath: (d: { path: [number, number, number][] }) => d.path,
        getColor: SOLAR_3D_COLORS.path,
        getWidth: 4,
        widthUnits: 'pixels',
        coordinateSystem: 2, // METER_OFFSETS
        coordinateOrigin,
        pickable: false,
      }),

      // 3D Spheres for sun points
      new SimpleMeshLayer({
        id: 'solar-points',
        data: adaptiveGeometry.points,
        mesh: sphereGeometry,
        getPosition: (d: Solar3DPoint) => d.position,
        getColor: (d: Solar3DPoint) => {
          const c = getPointColor(d);
          return [c[0], c[1], c[2]];
        },
        getScale: (d: Solar3DPoint) => {
          const r = getPointRadiusMeters(d);
          return [r, r, r];
        },
        getOrientation: [0, 0, 0],
        coordinateSystem: 2, // METER_OFFSETS
        coordinateOrigin,
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
          getScale: [
            selectedHour,
            isSelectedVisible,
            sceneMetrics.sunRadiusMeters,
            sceneMetrics.selectedSunRadiusMeters,
          ],
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
    adaptiveGeometry,
    selectedHour,
    isSelectedVisible,
    isEmpty,
    onHover,
    isMapLoaded,
    sphereGeometry,
    coordinateOrigin,
    referenceGeometry,
    sceneMetrics.pathRadiusMeters,
    sceneMetrics.selectedSunRadiusMeters,
    sceneMetrics.sunRadiusMeters,
  ]);

  useEffect(() => {
    if (!isMapLoaded || !mapRef.current || isEmpty) return;

    if (viewportFitFrameRef.current !== null) {
      cancelAnimationFrame(viewportFitFrameRef.current);
    }
    viewportFitFrameRef.current = requestAnimationFrame(() => {
      viewportFitFrameRef.current = null;
      const viewport = getSolarProjectionViewport(deckOverlayRef.current);
      if (!viewport) return;

      const projectPosition = (
        position: [number, number, number]
      ): [number, number] | null => {
        const lngLatPosition = viewport.addMetersToLngLat(
          coordinateOrigin,
          position
        );
        const projected = viewport.project(lngLatPosition);
        return Number.isFinite(projected[0]) && Number.isFinite(projected[1])
          ? [projected[0], projected[1]]
          : null;
      };
      const projectedOrigin = projectPosition(adaptiveGeometry.solarOrigin);
      const projectedPoints = adaptiveGeometry.points
        .map((point) => projectPosition(point.position))
        .filter((point): point is [number, number] => point !== null);
      if (!projectedOrigin || projectedPoints.length !== adaptiveGeometry.points.length) {
        setSolarViewportContained(false);
        setSolarScreenBounds('unavailable');
        return;
      }

      const fit = calculateSolarViewportFit({
        currentScale: solarViewportScale,
        projectedOrigin,
        projectedPoints,
        viewportWidth: viewportSize.width,
        viewportHeight: viewportSize.height,
        edgePaddingPixels: isCompactDevice ? 16 : 24,
        markerRadiusPixels: sceneMetrics.selectedSunRadiusPixels * 1.5 + 4,
      });
      setSolarViewportContained(fit.isContained);
      setSolarViewportMeasuredZoom(sceneZoom);
      setSolarScreenBounds(
        [
          fit.bounds.minX,
          fit.bounds.minY,
          fit.bounds.maxX,
          fit.bounds.maxY,
        ]
          .map((value) => value.toFixed(1))
          .join(',')
      );
      setSolarViewportScale((current) => {
        const shouldShrink =
          !fit.isContained && fit.nextScale < current - 0.005;
        const shouldExpand =
          fit.isContained && fit.nextScale > current + 0.025;
        return shouldShrink || shouldExpand ? fit.nextScale : current;
      });
    });

    return () => {
      if (viewportFitFrameRef.current !== null) {
        cancelAnimationFrame(viewportFitFrameRef.current);
        viewportFitFrameRef.current = null;
      }
    };
  }, [
    adaptiveGeometry,
    cameraOrientationRevision,
    coordinateOrigin,
    isCompactDevice,
    isEmpty,
    isMapLoaded,
    sceneMetrics.selectedSunRadiusPixels,
    sceneZoom,
    solarViewportScale,
    viewportSize.height,
    viewportSize.width,
  ]);

  // Handle reset view when resetKey changes
  useEffect(() => {
    if (resetKey > 0 && mapRef.current) {
      resetMapCamera(500);
    }
  }, [resetKey, resetMapCamera]);

  // If WebGL is not supported, show fallback (must be after all hooks)
  if (!hasWebGL || performanceMode === 'summary') {
    return <WebGLFallback viewData={viewData} />;
  }

  // Handle empty state
  if (isEmpty) {
    return (
      <div className="flex h-full w-full items-center justify-center [background:var(--solar-3d-root-bg)] p-6 sm:p-8">
        <div className="max-w-lg rounded-[30px] border [border-color:var(--solar-3d-surface-border)] [background:var(--solar-3d-surface-bg)] px-6 py-7 text-center [box-shadow:var(--solar-3d-surface-shadow)] backdrop-blur-xl">
            <svg
              className="mx-auto mb-4 h-16 w-16 text-[var(--solar-text-faint)]"
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
          <p className="text-[0.65rem] font-medium uppercase tracking-[0.32em] text-[var(--solar-text-faint)]">
            Polar night
          </p>
          <p className="mt-2 text-lg text-[var(--solar-text-strong)]">Sun does not rise on this date</p>
          <p className="mt-2 text-sm leading-6 text-[var(--solar-text-muted)]">
            This can occur during polar night at high latitudes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative h-full w-full overflow-hidden [background:var(--solar-3d-root-bg)]"
      data-testid="solar-3d-map"
      data-render-mode={performanceMode}
      data-map-provider={mapProvider}
      data-map-zoom={sceneZoom.toFixed(2)}
      data-path-radius-pixels={effectivePathRadiusPixels.toFixed(2)}
      data-path-radius-meters={effectivePathRadiusMeters.toFixed(2)}
      data-target-path-radius-pixels={sceneMetrics.pathRadiusPixels.toFixed(2)}
      data-sun-radius-pixels={sceneMetrics.sunRadiusPixels.toFixed(2)}
      data-selected-sun-radius-pixels={sceneMetrics.selectedSunRadiusPixels.toFixed(2)}
      data-solar-base-height={solarBaseHeight.toFixed(2)}
      data-solar-viewport-scale={solarViewportScale.toFixed(4)}
      data-solar-viewport-contained={solarViewportContained ? 'true' : 'false'}
      data-solar-viewport-measured-zoom={
        solarViewportMeasuredZoom === null
          ? 'pending'
          : solarViewportMeasuredZoom.toFixed(2)
      }
      data-solar-screen-bounds={solarScreenBounds}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute left-8 top-8 h-44 w-44 rounded-full bg-cyan-400/12 blur-3xl" />
        <div className="absolute bottom-8 right-8 h-56 w-56 rounded-full bg-amber-300/10 blur-3xl" />
      </div>

      <div className="absolute inset-0 z-0">
        <Map
          key={`${mapProvider}-${mapInstanceKey}`}
          ref={mapRef}
          initialViewState={{
            longitude: location.lng,
            latitude: location.lat,
            zoom: SOLAR_SCENE_CAMERA.zoom,
            pitch: SOLAR_SCENE_CAMERA.pitch,
            bearing: SOLAR_SCENE_CAMERA.bearing,
          }}
          mapStyle={
            mapProvider === 'openfreemap' ? OPENFREEMAP_STYLE_URL : FALLBACK_MAP_STYLE
          }
          onLoad={handleMapLoad}
          onError={handleMapError}
          style={{ width: '100%', height: '100%' }}
          minZoom={SOLAR_SCENE_CAMERA.minZoom}
          maxZoom={SOLAR_SCENE_CAMERA.maxZoom}
          maxPitch={75}
          pixelRatio={isCompactDevice ? 1 : undefined}
          attributionControl={{
            compact: true,
            customAttribution:
              mapProvider === 'openfreemap'
                ? 'Terrain © <a href="https://mapterhorn.com/">Mapterhorn</a>'
                : undefined,
          }}
        >
          <NavigationControl position="top-right" showCompass showZoom />
        </Map>
      </div>

      <div className="pointer-events-none absolute left-3 right-3 top-3 z-20 sm:left-4 sm:right-auto">
        <div className="inline-flex max-w-[18rem] items-center gap-3 rounded-full border [border-color:var(--solar-3d-surface-border)] [background:var(--solar-3d-legend-bg)] px-3 py-2 [box-shadow:var(--solar-3d-surface-shadow)] backdrop-blur-xl">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-400/10 text-[var(--solar-accent)] shadow-[0_0_24px_rgba(56,189,248,0.18)]">
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
            <span className="text-[0.62rem] font-medium uppercase tracking-[0.28em] text-[var(--solar-3d-kicker)]">
              Camera
            </span>
            <span className="hidden text-xs font-medium text-[var(--solar-text-strong)] sm:inline">
              Hold Ctrl + Drag to rotate view
            </span>
            <span className="text-xs font-medium text-[var(--solar-text-strong)] sm:hidden">
              Use gestures and controls to explore
            </span>
          </div>
        </div>
      </div>

      {isInitializing && (
        <div
          className="absolute inset-0 z-30 flex items-center justify-center [background:var(--solar-3d-root-bg)] transition-opacity duration-500 backdrop-blur-sm"
          style={{ opacity: isMapLoaded ? 0.5 : 1 }}
          data-testid="3d-map-loading"
        >
          <div className="rounded-[28px] border [border-color:var(--solar-3d-surface-border)] [background:var(--solar-3d-surface-bg)] px-6 py-5 text-center [box-shadow:var(--solar-3d-surface-shadow)] backdrop-blur-xl">
            <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-amber-300/25 bg-amber-300/10 blur-[1px]" />
              <div className="absolute inset-3 rounded-full border border-cyan-300/25 bg-cyan-400/10" />
              <svg
                className="relative h-12 w-12 text-[var(--solar-warning-text)]"
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
                  className="h-20 w-20 text-[var(--solar-warning-text)] opacity-25"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <circle cx="12" cy="12" r="3.75" strokeWidth={1.5} />
                </svg>
              </div>
            </div>
            <p className="mt-4 text-[0.65rem] font-medium uppercase tracking-[0.32em] text-[var(--solar-3d-kicker)]">
              Initializing
            </p>
            <span className="mt-2 block text-sm text-[var(--solar-text)]">Loading 3D view...</span>
          </div>
        </div>
      )}
    </div>
  );
}
