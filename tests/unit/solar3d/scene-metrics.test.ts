import { describe, expect, it } from 'vitest';

import type { Solar3DPoint } from '@/types/solar3d';
import {
  buildAdaptiveSolarGeometry,
  buildSolarReferenceGeometry,
  calculateSolarViewportFit,
  calculateSolarViewportPadding,
  calculateMetersPerPixel,
  calculateSolarSceneMetrics,
  COMPASS_GROUND_OFFSET_METERS,
  getCameraFocusElevation,
  SOLAR_BASE_HEIGHT_METERS,
  SOLAR_COMPASS_GAP_METERS,
  SOLAR_SCENE_CAMERA,
} from '@/lib/solar3d/scene-metrics';

const LOCATION_LATITUDE = -27.4698;

function createPoint(
  hour: number,
  azimuthDeg: number,
  altitudeDeg: number
): Solar3DPoint {
  return {
    hour,
    localTimeLabel: `${hour.toString().padStart(2, '0')}:00`,
    azimuthDeg,
    altitudeDeg,
    daylightState: 'day',
    position: [0, 0, 0],
  };
}

describe('adaptive solar scene metrics', () => {
  it('uses a building-scale default camera and limits the supported zoom range', () => {
    expect(SOLAR_SCENE_CAMERA).toEqual({
      zoom: 15,
      minZoom: 15,
      maxZoom: 20,
      pitch: 58,
      bearing: 135,
    });
  });

  it('halves meters per pixel whenever zoom increases by one', () => {
    const zoom17 = calculateMetersPerPixel(LOCATION_LATITUDE, 17);
    const zoom18 = calculateMetersPerPixel(LOCATION_LATITUDE, 18);

    expect(zoom18).toBeCloseTo(zoom17 / 2, 10);
  });

  it('keeps the desktop path and sun at stable screen sizes across zoom levels', () => {
    const zoom15 = calculateSolarSceneMetrics({
      latitude: LOCATION_LATITUDE,
      zoom: 15,
      viewportWidth: 1800,
      viewportHeight: 600,
      isCompact: false,
    });
    const zoom19 = calculateSolarSceneMetrics({
      latitude: LOCATION_LATITUDE,
      zoom: 19,
      viewportWidth: 1800,
      viewportHeight: 600,
      isCompact: false,
    });
    const zoom17 = calculateSolarSceneMetrics({
      latitude: LOCATION_LATITUDE,
      zoom: 17,
      viewportWidth: 1800,
      viewportHeight: 600,
      isCompact: false,
    });

    expect(zoom15.pathRadiusPixels).toBe(200);
    expect(zoom17.pathRadiusPixels).toBe(200);
    expect(zoom19.pathRadiusPixels).toBe(200);
    expect(zoom15.sunRadiusPixels).toBe(8);
    expect(zoom17.sunRadiusPixels).toBe(8);
    expect(zoom19.sunRadiusPixels).toBe(8);
    expect(zoom15.selectedSunRadiusPixels).toBe(11);
    expect(zoom17.selectedSunRadiusPixels).toBe(11);
    expect(zoom19.selectedSunRadiusPixels).toBe(11);
    expect(zoom15.pathRadiusMeters).toBeCloseTo(zoom17.pathRadiusMeters * 4, 8);
    expect(zoom15.pathRadiusMeters).toBeCloseTo(zoom19.pathRadiusMeters * 16, 8);
    expect(zoom15.sunRadiusMeters / zoom15.metersPerPixel).toBeCloseTo(8, 8);
    expect(zoom19.sunRadiusMeters / zoom19.metersPerPixel).toBeCloseTo(8, 8);
  });

  it('uses the compact viewport limits and sphere sizes on mobile', () => {
    const metrics = calculateSolarSceneMetrics({
      latitude: LOCATION_LATITUDE,
      zoom: 17,
      viewportWidth: 390,
      viewportHeight: 700,
      isCompact: true,
    });

    expect(metrics.pathRadiusPixels).toBe(130);
    expect(metrics.sunRadiusPixels).toBe(7);
    expect(metrics.selectedSunRadiusPixels).toBe(10);
  });

  it('keeps the compass and solar reference planes at fixed terrain offsets', () => {
    expect(COMPASS_GROUND_OFFSET_METERS).toBe(10);
    expect(SOLAR_COMPASS_GAP_METERS).toBe(1);
    expect(SOLAR_BASE_HEIGHT_METERS).toBe(11);
    expect(SOLAR_BASE_HEIGHT_METERS - COMPASS_GROUND_OFFSET_METERS).toBe(
      SOLAR_COMPASS_GAP_METERS
    );
  });

  it('uniformly scales ENU vectors while keeping connectors at the floating solar origin', () => {
    const radiusMeters = 160;
    const baseHeightMeters = SOLAR_BASE_HEIGHT_METERS;
    const geometry = buildAdaptiveSolarGeometry(
      [
        createPoint(12, 0, 0),
        createPoint(13, 90, 30),
        createPoint(14, 180, 60),
      ],
      radiusMeters,
      baseHeightMeters
    );

    expect(geometry.solarOrigin).toEqual([0, 0, baseHeightMeters]);
    expect(geometry.connectorLines.every((line) => line.from === geometry.solarOrigin)).toBe(true);
    expect(geometry.pathPositions.every((position) => position[2] >= baseHeightMeters)).toBe(true);
    expect(geometry.pathPositions[0]?.[2]).toBe(baseHeightMeters);
    expect(geometry.shadowPositions.every((position) => position[2] === 0)).toBe(true);

    geometry.points.forEach(({ position }) => {
      const relativeEast = position[0];
      const relativeNorth = position[1];
      const relativeUp = position[2] - baseHeightMeters;
      const vectorLength = Math.hypot(relativeEast, relativeNorth, relativeUp);
      expect(vectorLength).toBeCloseTo(radiusMeters, 8);
    });
  });

  it('keeps compass references ten metres above terrain and one metre below the solar origin', () => {
    const reference = buildSolarReferenceGeometry(
      160,
      SOLAR_BASE_HEIGHT_METERS,
      COMPASS_GROUND_OFFSET_METERS
    );

    expect(
      reference.compassLines.every(
        (line) =>
          line.from[2] === COMPASS_GROUND_OFFSET_METERS &&
          line.to[2] === COMPASS_GROUND_OFFSET_METERS
      )
    ).toBe(true);
    expect(
      reference.compassLabels.every(
        (label) => label.position[2] === COMPASS_GROUND_OFFSET_METERS
      )
    ).toBe(true);
    expect(reference.anchorLine).toEqual({
      from: [0, 0, COMPASS_GROUND_OFFSET_METERS],
      to: [0, 0, SOLAR_BASE_HEIGHT_METERS],
    });
    expect(reference.anchorLine.to[2] - reference.anchorLine.from[2]).toBe(
      SOLAR_COMPASS_GAP_METERS
    );
  });

  it('keeps camera focus on the elevated solar origin without zoom-dependent drift', () => {
    expect(getCameraFocusElevation(42, SOLAR_BASE_HEIGHT_METERS)).toBeCloseTo(53);
  });

  it('shrinks a projected solar scene until markers stay inside the viewport safe area', () => {
    const fit = calculateSolarViewportFit({
      currentScale: 1,
      projectedOrigin: [500, 400],
      projectedPoints: [
        [980, 400],
        [500, 25],
        [40, 760],
      ],
      viewportWidth: 1000,
      viewportHeight: 800,
      edgePaddingPixels: 24,
      markerRadiusPixels: 14,
    });

    expect(fit.isContained).toBe(false);
    expect(fit.nextScale).toBeLessThan(1);
    expect(fit.nextScale).toBeGreaterThan(0);
  });

  it('keeps the complete sun sphere below the larger visual top safe area', () => {
    const fit = calculateSolarViewportFit({
      currentScale: 1,
      projectedOrigin: [500, 400],
      projectedPoints: [
        [500, 80],
        [650, 350],
        [350, 520],
      ],
      viewportWidth: 1000,
      viewportHeight: 800,
      edgePaddingPixels: 24,
      topPaddingPixels: 96,
      markerRadiusPixels: 14,
    });

    expect(fit.isContained).toBe(false);
    expect(fit.nextScale).toBeLessThan(1);
  });

  it('reserves a responsive visual safe area above the solar path', () => {
    expect(calculateSolarViewportPadding(800, false)).toEqual({
      edgePaddingPixels: 24,
      topPaddingPixels: 96,
    });
    expect(calculateSolarViewportPadding(800, true)).toEqual({
      edgePaddingPixels: 16,
      topPaddingPixels: 72,
    });
    expect(calculateSolarViewportPadding(400, false).topPaddingPixels).toBe(72);
    expect(calculateSolarViewportPadding(1_200, false).topPaddingPixels).toBe(112);
  });

  it('can restore the full visual radius when a previously reduced scene has room', () => {
    const fit = calculateSolarViewportFit({
      currentScale: 0.6,
      projectedOrigin: [500, 400],
      projectedPoints: [
        [650, 400],
        [500, 260],
        [350, 520],
      ],
      viewportWidth: 1000,
      viewportHeight: 800,
      edgePaddingPixels: 24,
      markerRadiusPixels: 14,
    });

    expect(fit.isContained).toBe(true);
    expect(fit.nextScale).toBe(1);
  });
});
