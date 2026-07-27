import type { SunEvents } from '@/types/solar';
import type {
  Solar3DMilestone,
  Solar3DMilestoneKind,
  Solar3DPoint,
} from '@/types/solar3d';
import { computePosition } from './geometry';

const EARTH_CIRCUMFERENCE_PER_TILE = 156543.03392;
const PATH_VIEWPORT_RATIO = 0.35;
const DESKTOP_PATH_MIN_PIXELS = 120;
const DESKTOP_PATH_MAX_PIXELS = 200;
const COMPACT_PATH_MIN_PIXELS = 90;
const COMPACT_PATH_MAX_PIXELS = 130;
const SOLAR_VIEWPORT_FIT_SAFETY_RATIO = 0.96;
const MIN_SOLAR_VIEWPORT_SCALE = 0.05;
const DESKTOP_VIEWPORT_EDGE_PADDING_PIXELS = 24;
const COMPACT_VIEWPORT_EDGE_PADDING_PIXELS = 16;
const DESKTOP_VIEWPORT_TOP_PADDING_RATIO = 0.12;
const COMPACT_VIEWPORT_TOP_PADDING_RATIO = 0.1;
const DESKTOP_VIEWPORT_TOP_PADDING_MIN_PIXELS = 72;
const DESKTOP_VIEWPORT_TOP_PADDING_MAX_PIXELS = 112;
const COMPACT_VIEWPORT_TOP_PADDING_MIN_PIXELS = 48;
const COMPACT_VIEWPORT_TOP_PADDING_MAX_PIXELS = 72;
const COMPASS_RING_SEGMENTS = 64;
const COMPASS_RING_RADIUS_RATIO = 1.12;
const COMPASS_LABEL_RADIUS_RATIO = 1.18;

export const COMPASS_GROUND_OFFSET_METERS = 20;
export const SOLAR_COMPASS_GAP_METERS = 1;
export const SOLAR_BASE_HEIGHT_METERS = COMPASS_GROUND_OFFSET_METERS + SOLAR_COMPASS_GAP_METERS;

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
  selectedHaloRadiusPixels: number;
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
  compassRingPositions: [number, number, number][];
  compassTicks: Array<{
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
  topPaddingPixels?: number;
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

export interface SolarViewportPadding {
  edgePaddingPixels: number;
  topPaddingPixels: number;
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
  const sunRadiusPixels = isCompact ? 5 : 6;
  const selectedSunRadiusPixels = isCompact ? 8 : 9;
  const selectedHaloRadiusPixels = isCompact ? 12 : 14;

  return {
    metersPerPixel,
    pathRadiusPixels,
    pathRadiusMeters: pathRadiusPixels * metersPerPixel,
    sunRadiusPixels,
    sunRadiusMeters: sunRadiusPixels * metersPerPixel,
    selectedSunRadiusPixels,
    selectedSunRadiusMeters: selectedSunRadiusPixels * metersPerPixel,
    selectedHaloRadiusPixels,
  };
}

export function calculateSolarViewportPadding(
  viewportHeight: number,
  isCompact: boolean
): SolarViewportPadding {
  const safeViewportHeight = Math.max(1, viewportHeight);

  return {
    edgePaddingPixels: isCompact
      ? COMPACT_VIEWPORT_EDGE_PADDING_PIXELS
      : DESKTOP_VIEWPORT_EDGE_PADDING_PIXELS,
    topPaddingPixels: clamp(
      safeViewportHeight *
        (isCompact ? COMPACT_VIEWPORT_TOP_PADDING_RATIO : DESKTOP_VIEWPORT_TOP_PADDING_RATIO),
      isCompact ? COMPACT_VIEWPORT_TOP_PADDING_MIN_PIXELS : DESKTOP_VIEWPORT_TOP_PADDING_MIN_PIXELS,
      isCompact ? COMPACT_VIEWPORT_TOP_PADDING_MAX_PIXELS : DESKTOP_VIEWPORT_TOP_PADDING_MAX_PIXELS
    ),
  };
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
  solarBaseHeightMeters: number,
  compassHeightMeters: number
): SolarReferenceGeometry {
  const compassRadius = pathRadiusMeters * COMPASS_RING_RADIUS_RATIO;
  const labelRadius = compassRadius * COMPASS_LABEL_RADIUS_RATIO;
  const tickInnerRadius = compassRadius * 0.95;
  const tickOuterRadius = compassRadius * 1.05;
  const solarOrigin: [number, number, number] = [0, 0, solarBaseHeightMeters];
  const compassRingArc = Array.from(
    { length: COMPASS_RING_SEGMENTS },
    (_, index): [number, number, number] => {
      const angle = (index / COMPASS_RING_SEGMENTS) * Math.PI * 2;
      return [
        compassRadius * Math.sin(angle),
        compassRadius * Math.cos(angle),
        compassHeightMeters,
      ];
    }
  );
  const compassRingPositions = [...compassRingArc, compassRingArc[0]];

  const buildTick = (
    eastDirection: number,
    northDirection: number
  ): { from: [number, number, number]; to: [number, number, number] } => ({
    from: [
      eastDirection * tickInnerRadius,
      northDirection * tickInnerRadius,
      compassHeightMeters,
    ],
    to: [
      eastDirection * tickOuterRadius,
      northDirection * tickOuterRadius,
      compassHeightMeters,
    ],
  });

  return {
    compassRingPositions,
    compassTicks: [
      buildTick(0, 1),
      buildTick(1, 0),
      buildTick(0, -1),
      buildTick(-1, 0),
    ],
    compassLabels: [
      { text: 'N', position: [0, labelRadius, compassHeightMeters] },
      { text: 'E', position: [labelRadius, 0, compassHeightMeters] },
      { text: 'S', position: [0, -labelRadius, compassHeightMeters] },
      { text: 'W', position: [-labelRadius, 0, compassHeightMeters] },
    ],
    anchorLine: {
      from: [0, 0, compassHeightMeters],
      to: solarOrigin,
    },
  };
}

function parseTimeMinutes(time: string | undefined): number | null {
  if (!time) return null;
  const match = /^(\d{1,2}):(\d{2})$/.exec(time);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }
  return hours * 60 + minutes;
}

function findNearestPoint(points: Solar3DPoint[], time: string | undefined): Solar3DPoint | null {
  const targetMinutes = parseTimeMinutes(time);
  if (targetMinutes === null || points.length === 0) return null;

  return points.reduce((nearest, point) => {
    const pointMinutes = parseTimeMinutes(point.localTimeLabel) ?? point.hour * 60;
    const nearestMinutes = parseTimeMinutes(nearest.localTimeLabel) ?? nearest.hour * 60;
    return Math.abs(pointMinutes - targetMinutes) < Math.abs(nearestMinutes - targetMinutes)
      ? point
      : nearest;
  });
}

export function buildSolarMilestones(
  points: Solar3DPoint[],
  events: SunEvents
): Solar3DMilestone[] {
  if (points.length === 0) return [];

  const peakPoint = points.reduce((peak, point) =>
    point.altitudeDeg > peak.altitudeDeg ? point : peak
  );
  const candidates: Array<{
    kind: Solar3DMilestoneKind;
    point: Solar3DPoint | null;
    priority: number;
  }> = [
    { kind: 'noon', point: peakPoint, priority: 0 },
    { kind: 'rise', point: findNearestPoint(points, events.sunriseLocal), priority: 1 },
    { kind: 'set', point: findNearestPoint(points, events.sunsetLocal), priority: 2 },
  ];
  const usedHours = new Set<number>();
  const milestoneOrder: Record<Solar3DMilestoneKind, number> = {
    rise: 0,
    noon: 1,
    set: 2,
  };

  return candidates
    .sort((left, right) => left.priority - right.priority)
    .filter((candidate): candidate is typeof candidate & { point: Solar3DPoint } => {
      if (!candidate.point || usedHours.has(candidate.point.hour)) return false;
      usedHours.add(candidate.point.hour);
      return true;
    })
    .map(({ kind, point }) => ({
      kind,
      label: `${kind === 'rise' ? 'Rise' : kind === 'noon' ? 'Noon' : 'Set'} · ${
        point.localTimeLabel
      }`,
      hour: point.hour,
      position: point.position,
    }))
    .sort((left, right) => milestoneOrder[left.kind] - milestoneOrder[right.kind]);
}

export function calculateSolarViewportFit({
  currentScale,
  projectedOrigin,
  projectedPoints,
  viewportWidth,
  viewportHeight,
  edgePaddingPixels,
  topPaddingPixels = edgePaddingPixels,
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
  const topLimit = Math.max(edgePaddingPixels, topPaddingPixels);
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
      maximumRelativeScale = Math.min(maximumRelativeScale, (centerRightLimit - originX) / deltaX);
    } else if (deltaX < 0) {
      maximumRelativeScale = Math.min(maximumRelativeScale, (originX - centerLeftLimit) / -deltaX);
    }

    if (deltaY > 0) {
      maximumRelativeScale = Math.min(maximumRelativeScale, (centerBottomLimit - originY) / deltaY);
    } else if (deltaY < 0) {
      maximumRelativeScale = Math.min(maximumRelativeScale, (originY - centerTopLimit) / -deltaY);
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

export function getCameraFocusElevation(terrainElevation: number, solarBaseHeight: number): number {
  return terrainElevation + solarBaseHeight;
}
