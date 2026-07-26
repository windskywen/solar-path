import { describe, expect, it } from 'vitest';

import type { Solar3DPoint } from '@/types/solar3d';
import {
  buildAdaptiveSolarGeometry,
  buildSolarReferenceGeometry,
  calculateSolarViewportFit,
  calculateMetersPerPixel,
  calculateSolarBaseHeight,
  calculateSolarSceneMetrics,
  getCameraFocusElevation,
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

  it('uses the highest rendered building plus clearance with a safe minimum', () => {
    expect(calculateSolarBaseHeight([])).toBe(30);
    expect(
      calculateSolarBaseHeight([
        { properties: { render_height: 12 } },
        { properties: { render_height: '47.5' } },
        { properties: { render_height: null } },
      ])
    ).toBe(62.5);
  });

  it('uniformly scales ENU vectors and raises the complete solar reference system', () => {
    const radiusMeters = 160;
    const baseHeightMeters = 62.5;
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

    const reference = buildSolarReferenceGeometry(radiusMeters, baseHeightMeters);
    expect(
      reference.compassLines.every(
        (line) => line.from[2] === baseHeightMeters && line.to[2] === baseHeightMeters
      )
    ).toBe(true);
    expect(reference.anchorLine).toEqual({
      from: [0, 0, 0],
      to: geometry.solarOrigin,
    });

    geometry.points.forEach(({ position }) => {
      const relativeEast = position[0];
      const relativeNorth = position[1];
      const relativeUp = position[2] - baseHeightMeters;
      const vectorLength = Math.hypot(relativeEast, relativeNorth, relativeUp);
      expect(vectorLength).toBeCloseTo(radiusMeters, 8);
    });
  });

  it('keeps camera focus on the elevated solar origin without zoom-dependent drift', () => {
    expect(getCameraFocusElevation(42, 62.5)).toBeCloseTo(104.5);
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
