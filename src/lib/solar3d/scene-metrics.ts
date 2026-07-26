import type { Solar3DPoint } from '@/types/solar3d';
import { computePosition } from './geometry';

const EARTH_CIRCUMFERENCE_PER_TILE = 156543.03392;
const PATH_VIEWPORT_RATIO = 0.35;
const DESKTOP_PATH_MIN_PIXELS = 120;
const DESKTOP_PATH_MAX_PIXELS = 200;
const COMPACT_PATH_MIN_PIXELS = 90;
const COMPACT_PATH_MAX_PIXELS = 130;
const MIN_SOLAR_BASE_HEIGHT_METERS = 30;
const BUILDING_CLEARANCE_METERS = 15;
const SOLAR_VIEWPORT_FIT_SAFETY_RATIO = 0.96;
const MIN_SOLAR_VIEWPORT_SCALE = 0.05;

export const SOLAR_SCENE_CAMERA = {
  zoom: 15,
  minZoom: 15,
  maxZoom: 20,
  pitch: 58,
  bearing: 135,
} as const;

export interface SolarSceneMetricsInput {
  latitude: number;
  zoom: number;
  viewportWidth: number;
  viewportHeight: number;
  isCompact: boolean;
}

export interface SolarSceneMetrics {
  metersPerPixel: number;
  pathRadiusPixels: number;
  pathRadiusMeters: number;
  sunRadiusPixels: number;
  sunRadiusMeters: number;
  selectedSunRadiusPixels: number;
  selectedSunRadiusMeters: number;
}

export interface BuildingFeatureLike {
  properties?: Record<string, unknown> | null;
}

export interface AdaptiveSolarGeometry {
  points: Solar3DPoint[];
  pathPositions: [number, number, number][];
  shadowPositions: [number, number, number][];
  connectorLines: Array<{
    from: [number, number, number];
    to: [number, number, number];
  }>;
  solarOrigin: [number, number, number];
}

export interface SolarReferenceGeometry {
  compassLines: Array<{
    from: [number, number, number];
    to: [number, number, number];
  }>;
  compassLabels: Array<{
    text: 'N' | 'E' | 'S' | 'W';
    position: [number, number, number];
  }>;
  anchorLine: {
    from: [number, number, number];
    to: [number, number, number];
  };
}

export interface SolarViewportFitInput {
  currentScale: number;
  projectedOrigin: [number, number];
  projectedPoints: Array<[number, number]>;
  viewportWidth: number;
  viewportHeight: number;
  edgePaddingPixels: number;
  markerRadiusPixels: number;
}

export interface SolarViewportFit {
  isContained: boolean;
  nextScale: number;
  bounds: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

export function calculateMetersPerPixel(latitude: number, zoom: number): number {
  const safeLatitude = clamp(latitude, -85.051129, 85.051129);
  const latitudeRadians = (safeLatitude * Math.PI) / 180;
  return (EARTH_CIRCUMFERENCE_PER_TILE * Math.cos(latitudeRadians)) / 2 ** zoom;
}

export function calculateSolarSceneMetrics({
  latitude,
  zoom,
  viewportWidth,
  viewportHeight,
  isCompact,
}: SolarSceneMetricsInput): SolarSceneMetrics {
  const metersPerPixel = calculateMetersPerPixel(latitude, zoom);
  const shortViewportSide = Math.max(1, Math.min(viewportWidth, viewportHeight));
  const pathRadiusPixels = clamp(
    shortViewportSide * PATH_VIEWPORT_RATIO,
    isCompact ? COMPACT_PATH_MIN_PIXELS : DESKTOP_PATH_MIN_PIXELS,
    isCompact ? COMPACT_PATH_MAX_PIXELS : DESKTOP_PATH_MAX_PIXELS
  );
  const sunRadiusPixels = isCompact ? 7 : 8;
  const selectedSunRadiusPixels = isCompact ? 10 : 11;

  return {
    metersPerPixel,
    pathRadiusPixels,
    pathRadiusMeters: pathRadiusPixels * metersPerPixel,
    sunRadiusPixels,
    sunRadiusMeters: sunRadiusPixels * metersPerPixel,
    selectedSunRadiusPixels,
    selectedSunRadiusMeters: selectedSunRadiusPixels * metersPerPixel,
  };
}

export function calculateSolarBaseHeight(features: BuildingFeatureLike[]): number {
  const highestBuilding = features.reduce((highest, feature) => {
    const height = Number(feature.properties?.render_height);
    return Number.isFinite(height) && height >= 0 ? Math.max(highest, height) : highest;
  }, 0);

  return Math.max(MIN_SOLAR_BASE_HEIGHT_METERS, highestBuilding + BUILDING_CLEARANCE_METERS);
}

export function buildAdaptiveSolarGeometry(
  points: Solar3DPoint[],
  radiusMeters: number,
  baseHeightMeters: number
): AdaptiveSolarGeometry {
  const solarOrigin: [number, number, number] = [0, 0, baseHeightMeters];
  const renderedPoints = [...points]
    .sort((left, right) => left.hour - right.hour)
    .map((point) => {
      const [east, north, up] = computePosition(point.azimuthDeg, point.altitudeDeg, radiusMeters);
      return {
        ...point,
        position: [east, north, baseHeightMeters + up] as [number, number, number],
      };
    });

  return {
    points: renderedPoints,
    pathPositions: renderedPoints.map((point) => point.position),
    shadowPositions: renderedPoints.map((point) => [point.position[0], point.position[1], 0]),
    connectorLines: renderedPoints.map((point) => ({
      from: solarOrigin,
      to: point.position,
    })),
    solarOrigin,
  };
}

export function buildSolarReferenceGeometry(
  pathRadiusMeters: number,
  baseHeightMeters: number
): SolarReferenceGeometry {
  const compassRadius = pathRadiusMeters * 1.08;
  const origin: [number, number, number] = [0, 0, baseHeightMeters];

  return {
    compassLines: [
      {
        from: [-compassRadius, 0, baseHeightMeters],
        to: [compassRadius, 0, baseHeightMeters],
      },
      {
        from: [0, -compassRadius, baseHeightMeters],
        to: [0, compassRadius, baseHeightMeters],
      },
    ],
    compassLabels: [
      { text: 'N', position: [0, compassRadius * 0.9, baseHeightMeters] },
      { text: 'S', position: [0, -compassRadius * 0.9, baseHeightMeters] },
      { text: 'E', position: [compassRadius * 0.9, 0, baseHeightMeters] },
      { text: 'W', position: [-compassRadius * 0.9, 0, baseHeightMeters] },
    ],
    anchorLine: {
      from: [0, 0, 0],
      to: origin,
    },
  };
}

export function calculateSolarViewportFit({
  currentScale,
  projectedOrigin,
  projectedPoints,
  viewportWidth,
  viewportHeight,
  edgePaddingPixels,
  markerRadiusPixels,
}: SolarViewportFitInput): SolarViewportFit {
  const safeCurrentScale = clamp(currentScale, MIN_SOLAR_VIEWPORT_SCALE, 1);
  if (projectedPoints.length === 0) {
    return {
      isContained: true,
      nextScale: 1,
      bounds: {
        minX: projectedOrigin[0],
        minY: projectedOrigin[1],
        maxX: projectedOrigin[0],
        maxY: projectedOrigin[1],
      },
    };
  }

  const bounds = projectedPoints.reduce(
    (current, [x, y]) => ({
      minX: Math.min(current.minX, x - markerRadiusPixels),
      minY: Math.min(current.minY, y - markerRadiusPixels),
      maxX: Math.max(current.maxX, x + markerRadiusPixels),
      maxY: Math.max(current.maxY, y + markerRadiusPixels),
    }),
    {
      minX: Number.POSITIVE_INFINITY,
      minY: Number.POSITIVE_INFINITY,
      maxX: Number.NEGATIVE_INFINITY,
      maxY: Number.NEGATIVE_INFINITY,
    }
  );
  const leftLimit = edgePaddingPixels;
  const topLimit = edgePaddingPixels;
  const rightLimit = viewportWidth - edgePaddingPixels;
  const bottomLimit = viewportHeight - edgePaddingPixels;
  const isContained =
    bounds.minX >= leftLimit &&
    bounds.minY >= topLimit &&
    bounds.maxX <= rightLimit &&
    bounds.maxY <= bottomLimit;

  const [originX, originY] = projectedOrigin;
  const centerLeftLimit = leftLimit + markerRadiusPixels;
  const centerTopLimit = topLimit + markerRadiusPixels;
  const centerRightLimit = rightLimit - markerRadiusPixels;
  const centerBottomLimit = bottomLimit - markerRadiusPixels;
  let maximumRelativeScale = Number.POSITIVE_INFINITY;

  for (const [x, y] of projectedPoints) {
    const deltaX = x - originX;
    const deltaY = y - originY;

    if (deltaX > 0) {
      maximumRelativeScale = Math.min(
        maximumRelativeScale,
        (centerRightLimit - originX) / deltaX
      );
    } else if (deltaX < 0) {
      maximumRelativeScale = Math.min(
        maximumRelativeScale,
        (originX - centerLeftLimit) / -deltaX
      );
    }

    if (deltaY > 0) {
      maximumRelativeScale = Math.min(
        maximumRelativeScale,
        (centerBottomLimit - originY) / deltaY
      );
    } else if (deltaY < 0) {
      maximumRelativeScale = Math.min(
        maximumRelativeScale,
        (originY - centerTopLimit) / -deltaY
      );
    }
  }

  const nextScale = Number.isFinite(maximumRelativeScale)
    ? clamp(
        safeCurrentScale * maximumRelativeScale * SOLAR_VIEWPORT_FIT_SAFETY_RATIO,
        MIN_SOLAR_VIEWPORT_SCALE,
        1
      )
    : 1;

  return {
    isContained,
    nextScale,
    bounds,
  };
}

export function getCameraFocusElevation(
  terrainElevation: number,
  solarBaseHeight: number
): number {
  return terrainElevation + solarBaseHeight;
}
