import { describe, expect, it, vi } from 'vitest';

import {
  advancePerformanceGovernor,
  createPerformanceGovernorState,
  ensureSolar3DMapScene,
  getNextPerformanceMode,
  getPreviousPerformanceMode,
  getSceneVisibility,
  getSolarCoordinateOrigin,
  MAPTERHORN_TERRAIN,
  MAPTERHORN_TERRAIN_SOURCE,
  MAPTERHORN_TERRAIN_SOURCE_ID,
  OPENFREEMAP_BUILDING_LAYER,
  OPENFREEMAP_BUILDING_LAYER_ID,
  OPENFREEMAP_BUILDING_SOURCE_ID,
  OPENFREEMAP_STYLE_URL,
  PERFORMANCE_DEGRADE_DURATION_MS,
  PERFORMANCE_DEGRADE_FPS_THRESHOLD,
  PERFORMANCE_RECOVERY_DURATION_MS,
  PERFORMANCE_RECOVERY_FPS_THRESHOLD,
  PERFORMANCE_SAMPLE_WINDOW_MS,
  type PerformanceGovernorResult,
  type PerformanceSamplePhase,
} from '@/lib/solar3d/map-scene';

function createSceneMapMock() {
  const sources = new Map<string, unknown>();
  const layers = new Map<string, unknown>();
  let terrain: { source: string; exaggeration?: number } | null = null;

  const map = {
    addSource: vi.fn((id: string, source: unknown) => sources.set(id, source)),
    getSource: vi.fn((id: string) => sources.get(id)),
    addLayer: vi.fn((layer: { id: string }) => layers.set(layer.id, layer)),
    getLayer: vi.fn((id: string) => layers.get(id)),
    getStyle: vi.fn(() => ({
      version: 8 as const,
      sources: {},
      layers: [
        { id: 'roads', type: 'line' as const, source: 'openmaptiles' },
        {
          id: 'place-labels',
          type: 'symbol' as const,
          source: 'openmaptiles',
          layout: { 'text-field': ['get', 'name'] },
        },
      ],
    })),
    setLayoutProperty: vi.fn(),
    setTerrain: vi.fn((nextTerrain: typeof terrain) => {
      terrain = nextTerrain;
    }),
    getTerrain: vi.fn(() => terrain),
  };

  return map;
}

function samplePerformance(
  current: PerformanceGovernorResult,
  phase: PerformanceSamplePhase,
  fps: number,
  options: {
    canRecover?: boolean;
    elapsedMs?: number;
    isDocumentVisible?: boolean;
  } = {}
): PerformanceGovernorResult {
  return advancePerformanceGovernor({
    ...current,
    phase,
    fps,
    elapsedMs: options.elapsedMs ?? PERFORMANCE_SAMPLE_WINDOW_MS,
    canRecover: options.canRecover ?? true,
    isDocumentVisible: options.isDocumentVisible ?? true,
  });
}

describe('free 3D map scene configuration', () => {
  it('uses the official OpenFreeMap bright style without an API key', () => {
    expect(OPENFREEMAP_STYLE_URL).toBe('https://tiles.openfreemap.org/styles/bright');
    expect(OPENFREEMAP_STYLE_URL).not.toMatch(/[?&](key|token)=/i);
  });

  it('uses Mapterhorn TileJSON with Terrarium encoding and real-scale terrain', () => {
    expect(MAPTERHORN_TERRAIN_SOURCE).toMatchObject({
      type: 'raster-dem',
      url: 'https://tiles.mapterhorn.com/tilejson.json',
      encoding: 'terrarium',
      tileSize: 512,
    });
    expect(MAPTERHORN_TERRAIN).toEqual({
      source: MAPTERHORN_TERRAIN_SOURCE_ID,
      exaggeration: 1,
    });
  });

  it('extrudes OSM buildings from their height and minimum-height properties', () => {
    expect(OPENFREEMAP_BUILDING_LAYER).toMatchObject({
      id: OPENFREEMAP_BUILDING_LAYER_ID,
      type: 'fill-extrusion',
      source: OPENFREEMAP_BUILDING_SOURCE_ID,
      'source-layer': 'building',
      minzoom: 14,
      filter: ['!=', ['get', 'hide_3d'], true],
    });

    expect(OPENFREEMAP_BUILDING_LAYER.paint?.['fill-extrusion-height']).toEqual([
      'interpolate',
      ['linear'],
      ['zoom'],
      14,
      0,
      15,
      ['coalesce', ['get', 'render_height'], 0],
    ]);
    expect(OPENFREEMAP_BUILDING_LAYER.paint?.['fill-extrusion-base']).toEqual([
      'interpolate',
      ['linear'],
      ['zoom'],
      14,
      0,
      15,
      ['coalesce', ['get', 'render_min_height'], 0],
    ]);
  });

  it('applies terrain elevation to the shared origin used by all solar geometry', () => {
    expect(getSolarCoordinateOrigin({ lat: -27.4698, lng: 153.0251 }, 42.75)).toEqual([
      153.0251,
      -27.4698,
      42.75,
    ]);
    expect(getSolarCoordinateOrigin({ lat: -27.4698, lng: 153.0251 }, null)).toEqual([
      153.0251,
      -27.4698,
      0,
    ]);
  });

  it('degrades sequentially from buildings to terrain to flat', () => {
    expect(getNextPerformanceMode('full-3d')).toBe('terrain-only');
    expect(getNextPerformanceMode('terrain-only')).toBe('flat');
    expect(getNextPerformanceMode('flat')).toBe('flat');
    expect(getNextPerformanceMode('summary')).toBe('summary');

    expect(getSceneVisibility('full-3d')).toEqual({ buildings: true, terrain: true });
    expect(getSceneVisibility('terrain-only')).toEqual({ buildings: false, terrain: true });
    expect(getSceneVisibility('flat')).toEqual({ buildings: false, terrain: false });
  });

  it('uses tolerant degradation and recovery windows', () => {
    expect(PERFORMANCE_SAMPLE_WINDOW_MS).toBe(1_000);
    expect(PERFORMANCE_DEGRADE_FPS_THRESHOLD).toBe(15);
    expect(PERFORMANCE_DEGRADE_DURATION_MS).toBe(10_000);
    expect(PERFORMANCE_RECOVERY_FPS_THRESHOLD).toBe(30);
    expect(PERFORMANCE_RECOVERY_DURATION_MS).toBe(5_000);
  });

  it('requires ten continuous low-FPS samples for each degradation step', () => {
    let current: PerformanceGovernorResult = {
      mode: 'full-3d',
      state: createPerformanceGovernorState(),
    };

    for (let index = 0; index < 9; index += 1) {
      current = samplePerformance(current, 'interaction', 14);
    }
    expect(current).toEqual({
      mode: 'full-3d',
      state: { healthyFpsDurationMs: 0, lowFpsDurationMs: 9_000 },
    });

    current = samplePerformance(current, 'interaction', 14);
    expect(current).toEqual({
      mode: 'terrain-only',
      state: createPerformanceGovernorState(),
    });

    for (let index = 0; index < 10; index += 1) {
      current = samplePerformance(current, 'interaction', 14);
    }
    expect(current.mode).toBe('flat');
  });

  it('clears the low-FPS duration when a sample reaches the threshold', () => {
    let current: PerformanceGovernorResult = {
      mode: 'full-3d',
      state: createPerformanceGovernorState(),
    };

    for (let index = 0; index < 8; index += 1) {
      current = samplePerformance(current, 'interaction', 14);
    }
    current = samplePerformance(current, 'interaction', 15);

    expect(current).toEqual({
      mode: 'full-3d',
      state: createPerformanceGovernorState(),
    });
  });

  it('restores one performance level for each fresh five-second healthy window', () => {
    let current: PerformanceGovernorResult = {
      mode: 'flat',
      state: createPerformanceGovernorState(),
    };

    for (let index = 0; index < 5; index += 1) {
      current = samplePerformance(current, 'idle', 30);
    }
    expect(current).toEqual({
      mode: 'terrain-only',
      state: createPerformanceGovernorState(),
    });

    for (let index = 0; index < 4; index += 1) {
      current = samplePerformance(current, 'idle', 60);
    }
    expect(current.mode).toBe('terrain-only');

    current = samplePerformance(current, 'idle', 60);
    expect(current.mode).toBe('full-3d');
    expect(getPreviousPerformanceMode('summary')).toBe('summary');
  });

  it('resets unhealthy recovery and pauses accumulation in a hidden tab', () => {
    let current: PerformanceGovernorResult = {
      mode: 'terrain-only',
      state: createPerformanceGovernorState(),
    };

    for (let index = 0; index < 4; index += 1) {
      current = samplePerformance(current, 'idle', 30);
    }
    current = samplePerformance(current, 'idle', 29);
    expect(current.state.healthyFpsDurationMs).toBe(0);

    for (let index = 0; index < 3; index += 1) {
      current = samplePerformance(current, 'idle', 30);
    }
    current = samplePerformance(current, 'idle', 60, {
      elapsedMs: 10_000,
      isDocumentVisible: false,
    });
    expect(current.state.healthyFpsDurationMs).toBe(3_000);

    current = samplePerformance(current, 'idle', 30);
    current = samplePerformance(current, 'idle', 30);
    expect(current.mode).toBe('full-3d');
  });

  it('never recovers source fallback or WebGL summary modes', () => {
    const fallback = samplePerformance(
      { mode: 'flat', state: createPerformanceGovernorState() },
      'idle',
      60,
      { canRecover: false, elapsedMs: PERFORMANCE_RECOVERY_DURATION_MS }
    );
    const summary = samplePerformance(
      { mode: 'summary', state: createPerformanceGovernorState() },
      'idle',
      60,
      { elapsedMs: PERFORMANCE_RECOVERY_DURATION_MS }
    );

    expect(fallback.mode).toBe('flat');
    expect(summary.mode).toBe('summary');
  });

  it('does not duplicate sources or the building layer after a style sync', () => {
    const map = createSceneMapMock();

    ensureSolar3DMapScene(map as never, 'full-3d');
    ensureSolar3DMapScene(map as never, 'full-3d');

    expect(map.addSource).toHaveBeenCalledTimes(2);
    expect(map.addSource).toHaveBeenCalledWith(
      OPENFREEMAP_BUILDING_SOURCE_ID,
      expect.any(Object)
    );
    expect(map.addSource).toHaveBeenCalledWith(
      MAPTERHORN_TERRAIN_SOURCE_ID,
      expect.any(Object)
    );
    expect(map.addLayer).toHaveBeenCalledTimes(1);
    expect(map.addLayer).toHaveBeenCalledWith(
      OPENFREEMAP_BUILDING_LAYER,
      'place-labels'
    );
    expect(map.setTerrain).toHaveBeenCalledTimes(1);
  });

  it('turns off buildings first and terrain second', () => {
    const map = createSceneMapMock();

    ensureSolar3DMapScene(map as never, 'full-3d');
    ensureSolar3DMapScene(map as never, 'terrain-only');
    ensureSolar3DMapScene(map as never, 'flat');

    expect(map.setLayoutProperty).toHaveBeenNthCalledWith(
      2,
      OPENFREEMAP_BUILDING_LAYER_ID,
      'visibility',
      'none'
    );
    expect(map.setTerrain).toHaveBeenLastCalledWith(null);
  });
});
