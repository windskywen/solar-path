import { describe, expect, it, vi } from 'vitest';

import {
  ensureSolar3DMapScene,
  getNextPerformanceMode,
  getSceneVisibility,
  getSolarCoordinateOrigin,
  MAPTERHORN_TERRAIN,
  MAPTERHORN_TERRAIN_SOURCE,
  MAPTERHORN_TERRAIN_SOURCE_ID,
  OPENFREEMAP_BUILDING_LAYER,
  OPENFREEMAP_BUILDING_LAYER_ID,
  OPENFREEMAP_BUILDING_SOURCE_ID,
  OPENFREEMAP_STYLE_URL,
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
