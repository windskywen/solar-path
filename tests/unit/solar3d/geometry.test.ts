/**
 * Unit tests for 3D Solar Path Geometry Utilities
 */

import { describe, it, expect } from 'vitest';
import { degToRad, computePosition, SOLAR_3D_CONSTANTS } from '@/lib/solar3d/geometry';

describe('degToRad', () => {
  it('converts 0° to 0 radians', () => {
    expect(degToRad(0)).toBe(0);
  });

  it('converts 90° to π/2 radians', () => {
    expect(degToRad(90)).toBeCloseTo(Math.PI / 2);
  });

  it('converts 180° to π radians', () => {
    expect(degToRad(180)).toBeCloseTo(Math.PI);
  });

  it('converts 360° to 2π radians', () => {
    expect(degToRad(360)).toBeCloseTo(2 * Math.PI);
  });
});

describe('computePosition', () => {
  const R = SOLAR_3D_CONSTANTS.PATH_RADIUS_METERS;

  describe('azimuth direction verification', () => {
    it('azimuth 0° (North) produces north > 0, east ≈ 0', () => {
      const [east, north, up] = computePosition(0, 45);
      expect(north).toBeGreaterThan(0);
      expect(Math.abs(east)).toBeLessThan(1); // Near zero
      expect(up).toBeGreaterThan(0);
    });

    it('azimuth 90° (East) produces east > 0, north ≈ 0', () => {
      const [east, north, up] = computePosition(90, 45);
      expect(east).toBeGreaterThan(0);
      expect(Math.abs(north)).toBeLessThan(1); // Near zero
      expect(up).toBeGreaterThan(0);
    });

    it('azimuth 180° (South) produces north < 0, east ≈ 0', () => {
      const [east, north, up] = computePosition(180, 45);
      expect(north).toBeLessThan(0);
      expect(Math.abs(east)).toBeLessThan(1); // Near zero
      expect(up).toBeGreaterThan(0);
    });

    it('azimuth 270° (West) produces east < 0, north ≈ 0', () => {
      const [east, north, up] = computePosition(270, 45);
      expect(east).toBeLessThan(0);
      expect(Math.abs(north)).toBeLessThan(1); // Near zero
      expect(up).toBeGreaterThan(0);
    });
  });

  describe('altitude affects up component', () => {
    it('higher altitude produces higher up value', () => {
      const [, , up30] = computePosition(0, 30);
      const [, , up60] = computePosition(0, 60);
      expect(up60).toBeGreaterThan(up30);
    });

    it('altitude 0° produces up = 0', () => {
      const [east, north, up] = computePosition(90, 0);
      expect(Math.abs(up)).toBeLessThan(0.001);
      // At horizon, all distance is horizontal
      expect(east).toBeCloseTo(R);
    });

    it('altitude 90° produces up = R, horizontal ≈ 0', () => {
      const [east, north, up] = computePosition(0, 90);
      expect(up).toBeCloseTo(R);
      expect(Math.abs(east)).toBeLessThan(1);
      expect(Math.abs(north)).toBeLessThan(1);
    });
  });

  describe('deterministic output', () => {
    it('same inputs produce same outputs', () => {
      const pos1 = computePosition(45, 30);
      const pos2 = computePosition(45, 30);
      expect(pos1).toEqual(pos2);
    });

    it('custom radius scales output proportionally', () => {
      const defaultPos = computePosition(45, 45, R);
      const halfRadiusPos = computePosition(45, 45, R / 2);

      expect(halfRadiusPos[0]).toBeCloseTo(defaultPos[0] / 2);
      expect(halfRadiusPos[1]).toBeCloseTo(defaultPos[1] / 2);
      expect(halfRadiusPos[2]).toBeCloseTo(defaultPos[2] / 2);
    });

    it('heightScale affects only up component', () => {
      const scale1 = computePosition(45, 45, R, 1.0);
      const scale2 = computePosition(45, 45, R, 2.0);

      expect(scale1[0]).toBeCloseTo(scale2[0]); // east unchanged
      expect(scale1[1]).toBeCloseTo(scale2[1]); // north unchanged
      expect(scale2[2]).toBeCloseTo(scale1[2] * 2); // up doubled
    });
  });

  describe('mathematical correctness', () => {
    it('azimuth 45° produces equal east and north', () => {
      const [east, north] = computePosition(45, 0);
      expect(east).toBeCloseTo(north);
    });

    it('follows spherical coordinate formula', () => {
      const azimuth = 60;
      const altitude = 30;
      const [east, north, up] = computePosition(azimuth, altitude);

      const a = degToRad(azimuth);
      const h = degToRad(altitude);

      const expectedEast = R * Math.cos(h) * Math.sin(a);
      const expectedNorth = R * Math.cos(h) * Math.cos(a);
      const expectedUp = R * Math.sin(h);

      expect(east).toBeCloseTo(expectedEast);
      expect(north).toBeCloseTo(expectedNorth);
      expect(up).toBeCloseTo(expectedUp);
    });
  });
});
