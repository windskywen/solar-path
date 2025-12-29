# Quickstart: 3D Solar Path View

**Feature**: `002-3d-solar-path-view`
**Date**: 2025-12-29
**Estimated Time**: 2-3 days

---

## Prerequisites

1. Feature `001-solar-path-tracker` is implemented and working
2. Branch `002-3d-solar-path-view` is checked out
3. Node.js and npm are installed

---

## Step 1: Install Dependencies

```bash
npm install @deck.gl/core@^9.0.0 @deck.gl/layers@^9.0.0 @deck.gl/mapbox@^9.0.0 @radix-ui/react-dialog@^1.0.0
```

---

## Step 2: Create Type Definitions

Create `src/types/solar3d.ts`:

```typescript
import type { HourlySolarPosition, LocationPoint } from './solar';

export interface Solar3DSnapshot {
  location: LocationPoint;
  dateISO: string;
  timezone: string;
  hourly: HourlySolarPosition[];
  selectedHour: number | null;
}

export interface Solar3DPoint {
  hour: number;
  localTimeLabel: string;
  azimuthDeg: number;
  altitudeDeg: number;
  daylightState: 'golden' | 'day';
  position: [number, number, number];
}

export interface Solar3DPath {
  positions: [number, number, number][];
}

export interface Solar3DViewData {
  snapshot: Solar3DSnapshot;
  visiblePoints: Solar3DPoint[];
  path: Solar3DPath;
  isSelectedVisible: boolean;
  isEmpty: boolean;
}

export type Solar3DTooltipData = {
  x: number;
  y: number;
  hour: number;
  localTimeLabel: string;
  azimuthDeg: number;
  altitudeDeg: number;
  daylightState: string;
} | null;
```

---

## Step 3: Create Geometry Utilities

Create `src/lib/solar3d/geometry.ts`:

```typescript
export const SOLAR_3D_CONSTANTS = {
  PATH_RADIUS_METERS: 1200,
  HEIGHT_SCALE: 1.0,
  POINT_RADIUS: 12,
  POINT_RADIUS_SELECTED: 18,
  PATH_WIDTH: 4,
} as const;

export function degToRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

export function computePosition(
  azimuthDeg: number,
  altitudeDeg: number,
  radiusMeters = SOLAR_3D_CONSTANTS.PATH_RADIUS_METERS,
  heightScale = SOLAR_3D_CONSTANTS.HEIGHT_SCALE
): [number, number, number] {
  const a = degToRad(azimuthDeg);
  const h = degToRad(altitudeDeg);
  
  const east = radiusMeters * Math.cos(h) * Math.sin(a);
  const north = radiusMeters * Math.cos(h) * Math.cos(a);
  const up = radiusMeters * Math.sin(h) * heightScale;
  
  return [east, north, up];
}
```

---

## Step 4: Create Visibility Utilities

Create `src/lib/solar3d/visibility.ts`:

```typescript
import type { HourlySolarPosition } from '@/types/solar';
import type { Solar3DPoint, Solar3DPath } from '@/types/solar3d';
import { computePosition, SOLAR_3D_CONSTANTS } from './geometry';

export function filterVisibleHours(
  hourly: HourlySolarPosition[]
): HourlySolarPosition[] {
  return hourly.filter(h => h.altitudeDeg >= 0);
}

export function buildSolar3DPoints(
  visibleHours: HourlySolarPosition[]
): Solar3DPoint[] {
  return visibleHours.map(h => ({
    hour: h.hour,
    localTimeLabel: h.localTimeLabel,
    azimuthDeg: h.azimuthDeg,
    altitudeDeg: h.altitudeDeg,
    daylightState: h.daylightState as 'golden' | 'day',
    position: computePosition(h.azimuthDeg, h.altitudeDeg),
  }));
}

export function buildSolar3DPath(points: Solar3DPoint[]): Solar3DPath {
  const sorted = [...points].sort((a, b) => a.hour - b.hour);
  return { positions: sorted.map(p => p.position) };
}

export function isSelectedHourVisible(
  selectedHour: number | null,
  hourly: HourlySolarPosition[]
): boolean {
  if (selectedHour === null || selectedHour === undefined) return false;
  const hour = hourly[selectedHour];
  return hour?.altitudeDeg >= 0;
}
```

---

## Step 5: Create the Modal Component

Create `src/components/solar3d/Solar3DViewModal.tsx`:

```tsx
'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useLocation, useDateISO, useTimezone, useSelectedHour } from '@/store/solar-store';
import { useSolarData } from '@/hooks/useSolarData';
import type { Solar3DSnapshot } from '@/types/solar3d';

const Solar3DMapCanvas = dynamic(
  () => import('./Solar3DMapCanvas').then(m => m.Solar3DMapCanvas),
  { ssr: false, loading: () => <div>Loading 3D view...</div> }
);

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function Solar3DViewModal({ open, onOpenChange }: Props) {
  const [snapshot, setSnapshot] = useState<Solar3DSnapshot | null>(null);
  
  const location = useLocation();
  const dateISO = useDateISO();
  const timezone = useTimezone();
  const solarData = useSolarData();
  const selectedHour = useSelectedHour();
  
  // Capture snapshot on open
  useEffect(() => {
    if (open && location && solarData?.hourly) {
      setSnapshot({
        location,
        dateISO,
        timezone,
        hourly: solarData.hourly,
        selectedHour,
      });
    }
  }, [open]);
  
  const subtitle = snapshot 
    ? `${snapshot.location.name || `${snapshot.location.lat}, ${snapshot.location.lng}`} | ${snapshot.dateISO} | ${snapshot.timezone}`
    : '';
  
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
        <Dialog.Content className="fixed inset-4 md:inset-[2.5%] bg-background rounded-lg z-50 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div>
              <Dialog.Title className="text-lg font-semibold">3D Solar Path</Dialog.Title>
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1 rounded border">Reset View</button>
              <Dialog.Close className="px-3 py-1 rounded border" aria-label="Close">
                ✕
              </Dialog.Close>
            </div>
          </div>
          
          {/* Body */}
          <div className="flex-1 relative">
            {snapshot ? (
              <Solar3DMapCanvas snapshot={snapshot} />
            ) : (
              <div className="flex items-center justify-center h-full">
                Loading...
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

---

## Step 6: Create the Map Canvas Component

Create `src/components/solar3d/Solar3DMapCanvas.tsx`:

```tsx
'use client';

import { useEffect, useRef, useMemo, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { ScatterplotLayer, PathLayer } from '@deck.gl/layers';
import { COORDINATE_SYSTEM } from '@deck.gl/core';
import type { Solar3DSnapshot, Solar3DTooltipData } from '@/types/solar3d';
import { filterVisibleHours, buildSolar3DPoints, buildSolar3DPath, isSelectedHourVisible } from '@/lib/solar3d/visibility';
import { SOLAR_3D_CONSTANTS } from '@/lib/solar3d/geometry';
import 'maplibre-gl/dist/maplibre-gl.css';

interface Props {
  snapshot: Solar3DSnapshot;
}

export function Solar3DMapCanvas({ snapshot }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [tooltip, setTooltip] = useState<Solar3DTooltipData>(null);
  
  // Derive 3D data
  const viewData = useMemo(() => {
    const visibleHours = filterVisibleHours(snapshot.hourly);
    const visiblePoints = buildSolar3DPoints(visibleHours);
    const path = buildSolar3DPath(visiblePoints);
    const isSelectedVisible = isSelectedHourVisible(snapshot.selectedHour, snapshot.hourly);
    
    return { visiblePoints, path, isSelectedVisible, isEmpty: visiblePoints.length === 0 };
  }, [snapshot]);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
          },
        },
        layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
      },
      center: [snapshot.location.lng, snapshot.location.lat],
      zoom: 15,
      pitch: 60,
      bearing: 0,
    });
    
    mapRef.current = map;
    
    map.on('load', () => {
      const overlay = new MapboxOverlay({
        interleaved: true,
        layers: [
          new ScatterplotLayer({
            id: 'solar-3d-points',
            data: viewData.visiblePoints,
            coordinateSystem: COORDINATE_SYSTEM.METER_OFFSETS,
            coordinateOrigin: [snapshot.location.lng, snapshot.location.lat],
            getPosition: d => d.position,
            getRadius: d => 
              viewData.isSelectedVisible && d.hour === snapshot.selectedHour
                ? SOLAR_3D_CONSTANTS.POINT_RADIUS_SELECTED
                : SOLAR_3D_CONSTANTS.POINT_RADIUS,
            getFillColor: d =>
              viewData.isSelectedVisible && d.hour === snapshot.selectedHour
                ? [255, 87, 34, 255]
                : d.daylightState === 'golden' ? [255, 183, 77, 255] : [255, 235, 59, 255],
            pickable: true,
            onHover: info => {
              if (info.object) {
                setTooltip({
                  x: info.x,
                  y: info.y,
                  ...info.object,
                });
              } else {
                setTooltip(null);
              }
            },
          }),
          new PathLayer({
            id: 'solar-3d-path',
            data: [viewData.path],
            coordinateSystem: COORDINATE_SYSTEM.METER_OFFSETS,
            coordinateOrigin: [snapshot.location.lng, snapshot.location.lat],
            getPath: d => d.positions,
            getWidth: SOLAR_3D_CONSTANTS.PATH_WIDTH,
            getColor: [255, 193, 7, 200],
          }),
        ],
      });
      
      map.addControl(overlay);
    });
    
    return () => {
      map.remove();
    };
  }, [snapshot, viewData]);
  
  if (viewData.isEmpty) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Sun does not rise on this date at this location.</p>
      </div>
    );
  }
  
  return (
    <div ref={containerRef} className="w-full h-full">
      {tooltip && (
        <div
          className="absolute bg-background border rounded p-2 text-sm pointer-events-none z-10"
          style={{ left: tooltip.x + 10, top: tooltip.y + 10 }}
        >
          <div className="font-semibold">{tooltip.localTimeLabel}</div>
          <div>Azimuth: {tooltip.azimuthDeg.toFixed(1)}°</div>
          <div>Altitude: {tooltip.altitudeDeg.toFixed(1)}°</div>
          <div>State: {tooltip.daylightState}</div>
        </div>
      )}
    </div>
  );
}
```

---

## Step 7: Add Button to MapPanel

Update `src/components/map/MapPanel.tsx`:

```tsx
// Add import
import { Solar3DViewModal } from '@/components/solar3d/Solar3DViewModal';

// Add state inside component
const [is3DViewOpen, setIs3DViewOpen] = useState(false);
const solarData = useSolarData();
const isDataReady = location && solarData?.hourly;

// Add button and modal after NavigationControl
<button
  onClick={() => setIs3DViewOpen(true)}
  disabled={!isDataReady}
  className="absolute top-24 right-2 px-3 py-1.5 bg-background border rounded shadow disabled:opacity-50"
  aria-label="Open 3D view"
>
  3D View
</button>

<Solar3DViewModal open={is3DViewOpen} onOpenChange={setIs3DViewOpen} />
```

---

## Step 8: Add Unit Tests

Create `tests/unit/solar3d/geometry.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { computePosition, degToRad } from '@/lib/solar3d/geometry';

describe('computePosition', () => {
  it('azimuth 0° (North) produces north > 0, east ≈ 0', () => {
    const [east, north] = computePosition(0, 45);
    expect(north).toBeGreaterThan(0);
    expect(Math.abs(east)).toBeLessThan(1);
  });
  
  it('azimuth 90° (East) produces east > 0, north ≈ 0', () => {
    const [east, north] = computePosition(90, 45);
    expect(east).toBeGreaterThan(0);
    expect(Math.abs(north)).toBeLessThan(1);
  });
  
  it('altitude affects up component', () => {
    const [, , up1] = computePosition(0, 30);
    const [, , up2] = computePosition(0, 60);
    expect(up2).toBeGreaterThan(up1);
  });
});
```

---

## Step 9: Add E2E Test

Create `tests/e2e/p1-3d-view.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test('3D View modal opens and closes', async ({ page }) => {
  await page.goto('/');
  
  // Wait for data to load
  await page.waitForSelector('button:has-text("3D View"):not([disabled])');
  
  // Open modal
  await page.click('button:has-text("3D View")');
  await expect(page.locator('text=3D Solar Path')).toBeVisible();
  
  // Close via Esc
  await page.keyboard.press('Escape');
  await expect(page.locator('text=3D Solar Path')).not.toBeVisible();
});
```

---

## Verification Checklist

- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] `npm run test` passes (geometry tests)
- [ ] `npm run dev` - 3D View button appears on map
- [ ] Clicking button opens modal with 3D map
- [ ] Hover on points shows tooltip
- [ ] Esc closes modal
- [ ] Main map camera unchanged after close

---

## Next Steps

1. Add Reset View functionality
2. Add accessible summary for screen readers
3. Add WebGL fallback detection
4. Add legend component
5. Performance optimization if needed
