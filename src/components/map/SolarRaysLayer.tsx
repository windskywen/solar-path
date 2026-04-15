'use client';

/**
 * SolarRaysLayer Component
 *
 * Renders 24 solar rays on the map as GeoJSON lines.
 * Each ray extends from the center location in the direction of the sun's azimuth.
 * Rays are color-coded by daylight state.
 */

import { useMemo, useCallback } from 'react';
import { Source, Layer } from 'react-map-gl/maplibre';
import type { MapLayerMouseEvent } from 'react-map-gl/maplibre';
import type { HourlySolarPosition, LocationPoint } from '@/types/solar';
import { createRayCollection, type RayFeatureCollection } from '@/lib/geo/ray-geometry';

// Color scheme for different daylight states
export const RAY_COLORS = {
  night: '#1e293b', // slate-800 - dark blue-gray
  golden: '#f59e0b', // amber-500 - warm amber for golden hour
  day: '#fbbf24', // amber-400 - bright yellow for day
  selected: '#3b82f6', // blue-500 - highlight color
};

// Line widths for different states
const RAY_WIDTHS = {
  default: 2,
  hover: 3,
  selected: 4,
};

export interface SolarRaysLayerProps {
  /** Location for ray center */
  location: LocationPoint;
  /** Hourly solar positions (24 entries) */
  positions: HourlySolarPosition[];
  /** Currently selected hour (0-23) or null */
  selectedHour: number | null;
  /** Callback when a ray is clicked */
  onRayClick?: (hour: number) => void;
  /** Ray length in kilometers */
  rayLengthKm?: number;
  /** Whether to show rays below horizon */
  showBelowHorizon?: boolean;
}

/**
 * SolarRaysLayer renders 24 solar position rays on the map
 */
export function SolarRaysLayer({
  location,
  positions,
  selectedHour,
  onRayClick: _onRayClick,
  rayLengthKm = 100,
  showBelowHorizon = false,
}: SolarRaysLayerProps) {
  // Note: onRayClick is available for future interactive ray clicking feature
  void _onRayClick;

  // Generate GeoJSON collection for all rays
  const rayCollection = useMemo<RayFeatureCollection>(() => {
    const collection = createRayCollection(location, positions, rayLengthKm);

    // Filter out below-horizon rays if not showing them
    if (!showBelowHorizon) {
      return {
        ...collection,
        features: collection.features.filter((f) => f.properties.altitudeDeg > 0),
      };
    }

    return collection;
  }, [location, positions, rayLengthKm, showBelowHorizon]);

  // Create expression for ray colors based on daylight state
  const rayPaintProperties = useMemo(
    () => ({
      'line-color': [
        'case',
        // Selected ray gets highlight color
        ['==', ['get', 'hour'], selectedHour ?? -1],
        RAY_COLORS.selected,
        // Otherwise color by daylight state
        ['==', ['get', 'daylightState'], 'night'],
        RAY_COLORS.night,
        ['==', ['get', 'daylightState'], 'golden'],
        RAY_COLORS.golden,
        // Default (day)
        RAY_COLORS.day,
      ],
      'line-width': [
        'case',
        ['==', ['get', 'hour'], selectedHour ?? -1],
        RAY_WIDTHS.selected,
        RAY_WIDTHS.default,
      ],
      'line-opacity': [
        'case',
        // Selected ray is fully opaque
        ['==', ['get', 'hour'], selectedHour ?? -1],
        1,
        // Below horizon rays are more transparent
        ['<', ['get', 'altitudeDeg'], 0],
        0.3,
        // Above horizon rays
        0.8,
      ],
    }),
    [selectedHour]
  );

  // Layer styling for rays
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rayLayerStyle: any = {
    id: 'solar-rays',
    type: 'line',
    paint: rayPaintProperties,
    layout: {
      'line-cap': 'round',
      'line-join': 'round',
    },
  };

  // Interactive layer for hover/click
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const interactiveLayerStyle: any = {
    id: 'solar-rays-interactive',
    type: 'line',
    paint: {
      'line-color': 'transparent',
      'line-width': 20, // Wider hit area
    },
  };

  return (
    <>
      {/* Visible ray layer */}
      <Source id="solar-rays-source" type="geojson" data={rayCollection}>
        <Layer {...rayLayerStyle} />
      </Source>

      {/* Interactive layer (wider hit area) */}
      <Source id="solar-rays-interactive-source" type="geojson" data={rayCollection}>
        <Layer {...interactiveLayerStyle} />
      </Source>
    </>
  );
}

/**
 * Hook to handle ray click events on the map
 *
 * @param mapRef - Reference to the map
 * @param onRayClick - Callback when a ray is clicked
 */
export function useRayClickHandler(
  onRayClick?: (hour: number) => void
): (e: MapLayerMouseEvent) => void {
  return useCallback(
    (e: MapLayerMouseEvent) => {
      if (!onRayClick) return;

      // Check if we clicked on a ray feature
      const features = e.features;
      if (features && features.length > 0) {
        const rayFeature = features.find(
          (f) => f.layer?.id === 'solar-rays' || f.layer?.id === 'solar-rays-interactive'
        );
        if (rayFeature && rayFeature.properties) {
          const hour = rayFeature.properties.hour;
          if (typeof hour === 'number') {
            onRayClick(hour);
          }
        }
      }
    },
    [onRayClick]
  );
}

/**
 * Map Legend Component showing ray color meanings
 */
export function SolarRaysLegend({ className = '' }: { className?: string }) {
  const items = [
    { color: RAY_COLORS.day, label: 'Daytime' },
    { color: RAY_COLORS.golden, label: 'Golden' },
    { color: RAY_COLORS.night, label: 'Night' },
    { color: RAY_COLORS.selected, label: 'Selected' },
  ];

    return (
      <div
        className={`max-w-[7.2rem] rounded-[18px] border [border-color:var(--solar-surface-border)] [background:var(--solar-surface-bg)] p-2 [box-shadow:var(--solar-surface-shadow)] backdrop-blur-2xl sm:max-w-none sm:rounded-[22px] sm:p-3 ${className}`}
      >
      <h3 className="mb-1.5 text-[0.56rem] font-semibold uppercase tracking-[0.22em] text-[var(--solar-text)] sm:mb-2 sm:text-[0.64rem] sm:tracking-[0.24em]">
        Ray colors
      </h3>
      <div className="space-y-1 sm:space-y-1.5">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-1.5 sm:gap-2">
            <div
              className="h-1 w-3 rounded-full sm:w-4"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-[0.62rem] text-[var(--solar-text)] sm:text-[0.68rem]">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
