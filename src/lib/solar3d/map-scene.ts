import type {
  FillExtrusionLayerSpecification,
  LayerSpecification,
  Map as MapLibreMap,
  RasterDEMSourceSpecification,
  VectorSourceSpecification,
} from 'maplibre-gl';

export type Solar3DPerformanceMode = 'full-3d' | 'terrain-only' | 'flat' | 'summary';

export const OPENFREEMAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/bright';
export const OPENFREEMAP_BUILDING_SOURCE_ID = 'solar-3d-openfreemap';
export const OPENFREEMAP_BUILDING_LAYER_ID = 'solar-3d-buildings';
export const MAPTERHORN_TERRAIN_SOURCE_ID = 'solar-3d-mapterhorn-dem';

export const OPENFREEMAP_BUILDING_SOURCE: VectorSourceSpecification = {
  type: 'vector',
  url: 'https://tiles.openfreemap.org/planet',
  attribution:
    '<a href="https://openfreemap.org/">OpenFreeMap</a> © <a href="https://openmaptiles.org/">OpenMapTiles</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
};

export const MAPTERHORN_TERRAIN_SOURCE: RasterDEMSourceSpecification = {
  type: 'raster-dem',
  url: 'https://tiles.mapterhorn.com/tilejson.json',
  encoding: 'terrarium',
  tileSize: 512,
  attribution: 'Terrain © <a href="https://mapterhorn.com/">Mapterhorn</a>',
};

export const OPENFREEMAP_BUILDING_LAYER: FillExtrusionLayerSpecification = {
  id: OPENFREEMAP_BUILDING_LAYER_ID,
  source: OPENFREEMAP_BUILDING_SOURCE_ID,
  'source-layer': 'building',
  type: 'fill-extrusion',
  minzoom: 14,
  filter: ['!=', ['get', 'hide_3d'], true],
  paint: {
    'fill-extrusion-color': [
      'interpolate',
      ['linear'],
      ['coalesce', ['get', 'render_height'], 0],
      0,
      '#d7dbe0',
      80,
      '#b9c2cc',
      240,
      '#9ba9b8',
    ],
    'fill-extrusion-height': [
      'interpolate',
      ['linear'],
      ['zoom'],
      14,
      0,
      15,
      ['coalesce', ['get', 'render_height'], 0],
    ],
    'fill-extrusion-base': [
      'interpolate',
      ['linear'],
      ['zoom'],
      14,
      0,
      15,
      ['coalesce', ['get', 'render_min_height'], 0],
    ],
    'fill-extrusion-opacity': 0.86,
  },
};

export const MAPTERHORN_TERRAIN = {
  source: MAPTERHORN_TERRAIN_SOURCE_ID,
  exaggeration: 1,
} as const;

type Solar3DSceneMap = Pick<
  MapLibreMap,
  | 'addLayer'
  | 'addSource'
  | 'getLayer'
  | 'getSource'
  | 'getStyle'
  | 'getTerrain'
  | 'setLayoutProperty'
  | 'setTerrain'
>;

export function findFirstTextLabelLayerId(layers: LayerSpecification[] = []): string | undefined {
  return layers.find((layer) => {
    if (layer.type !== 'symbol') return false;
    return Boolean(layer.layout?.['text-field']);
  })?.id;
}

export function getSceneVisibility(mode: Solar3DPerformanceMode): {
  buildings: boolean;
  terrain: boolean;
} {
  return {
    buildings: mode === 'full-3d',
    terrain: mode === 'full-3d' || mode === 'terrain-only',
  };
}

export function getNextPerformanceMode(mode: Solar3DPerformanceMode): Solar3DPerformanceMode {
  switch (mode) {
    case 'full-3d':
      return 'terrain-only';
    case 'terrain-only':
      return 'flat';
    default:
      return mode;
  }
}

export function getSolarCoordinateOrigin(
  location: { lat: number; lng: number },
  terrainElevation: number | null | undefined
): [number, number, number] {
  return [
    location.lng,
    location.lat,
    Number.isFinite(terrainElevation) ? (terrainElevation as number) : 0,
  ];
}

/**
 * Add or update the free 3D scene without duplicating sources or layers.
 * This is safe to call again after a MapLibre style reload.
 */
export function ensureSolar3DMapScene(
  map: Solar3DSceneMap,
  mode: Solar3DPerformanceMode
): void {
  const visibility = getSceneVisibility(mode);

  if (!map.getSource(OPENFREEMAP_BUILDING_SOURCE_ID)) {
    map.addSource(OPENFREEMAP_BUILDING_SOURCE_ID, OPENFREEMAP_BUILDING_SOURCE);
  }

  if (!map.getSource(MAPTERHORN_TERRAIN_SOURCE_ID)) {
    map.addSource(MAPTERHORN_TERRAIN_SOURCE_ID, MAPTERHORN_TERRAIN_SOURCE);
  }

  if (!map.getLayer(OPENFREEMAP_BUILDING_LAYER_ID)) {
    const labelLayerId = findFirstTextLabelLayerId(map.getStyle().layers);
    map.addLayer(OPENFREEMAP_BUILDING_LAYER, labelLayerId);
  }

  map.setLayoutProperty(
    OPENFREEMAP_BUILDING_LAYER_ID,
    'visibility',
    visibility.buildings ? 'visible' : 'none'
  );

  const terrain = map.getTerrain();
  if (visibility.terrain) {
    if (
      terrain?.source !== MAPTERHORN_TERRAIN.source ||
      terrain.exaggeration !== MAPTERHORN_TERRAIN.exaggeration
    ) {
      map.setTerrain(MAPTERHORN_TERRAIN);
    }
  } else if (terrain) {
    map.setTerrain(null);
  }
}
