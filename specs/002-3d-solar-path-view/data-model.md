# Data Model: 3D Solar Path View

**Feature**: `002-3d-solar-path-view`
**Date**: 2025-12-29
**Status**: Complete

---

## Entity Relationship Diagram

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                           EXISTING ENTITIES                                  │
│                      (from 001-solar-path-tracker)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  LocationPoint ◄──────────────────────┐                                     │
│  ├── lat: number                      │                                     │
│  ├── lng: number                      │                                     │
│  └── name?: string                    │                                     │
│                                       │                                     │
│  HourlySolarPosition ◄────────────────┼─────────────────┐                   │
│  ├── hour: number (0-23)              │                 │                   │
│  ├── localTimeLabel: string           │                 │                   │
│  ├── azimuthDeg: number               │                 │                   │
│  ├── altitudeDeg: number              │                 │                   │
│  └── daylightState: DaylightState     │                 │                   │
│                                       │                 │                   │
└───────────────────────────────────────┼─────────────────┼───────────────────┘
                                        │                 │
                                        │                 │
┌───────────────────────────────────────┼─────────────────┼───────────────────┐
│                           NEW ENTITIES                  │                   │
│                      (for 002-3d-solar-path-view)       │                   │
├─────────────────────────────────────────────────────────┼───────────────────┤
│                                                         │                   │
│  Solar3DSnapshot ─────────────────────┘                 │                   │
│  ├── location: LocationPoint                            │                   │
│  ├── dateISO: string                                    │                   │
│  ├── timezone: string                                   │                   │
│  ├── hourly: HourlySolarPosition[24] ◄─────────────────┘                   │
│  └── selectedHour: number | null                                            │
│           │                                                                 │
│           │ derives                                                         │
│           ▼                                                                 │
│  Solar3DViewData ────────────────────────────────────────────────────────── │
│  ├── snapshot: Solar3DSnapshot                                              │
│  ├── visiblePoints: Solar3DPoint[]                                          │
│  ├── path: Solar3DPath                                                      │
│  ├── isSelectedVisible: boolean                                             │
│  └── isEmpty: boolean                                                       │
│           │                                                                 │
│           │ contains                                                        │
│           ▼                                                                 │
│  Solar3DPoint ───────────────────────────────────────────────────────────── │
│  ├── hour: number (0-23)                                                    │
│  ├── localTimeLabel: string                                                 │
│  ├── azimuthDeg: number                                                     │
│  ├── altitudeDeg: number                                                    │
│  ├── daylightState: 'golden' | 'day'  (never 'night' - filtered)           │
│  └── position: [east, north, up]  (meters, METER_OFFSETS)                  │
│           │                                                                 │
│           │ ordered sequence                                                │
│           ▼                                                                 │
│  Solar3DPath ────────────────────────────────────────────────────────────── │
│  └── positions: [east, north, up][]  (visible points in hour order)        │
│                                                                             │
│  Solar3DTooltipData ─────────────────────────────────────────────────────── │
│  ├── x: number (screen pixels)                                              │
│  ├── y: number (screen pixels)                                              │
│  ├── hour: number                                                           │
│  ├── localTimeLabel: string                                                 │
│  ├── azimuthDeg: number                                                     │
│  ├── altitudeDeg: number                                                    │
│  └── daylightState: string                                                  │
│                                                                             │
│  Solar3DCameraState ─────────────────────────────────────────────────────── │
│  ├── center: [lng, lat]                                                     │
│  ├── zoom: number                                                           │
│  ├── pitch: number                                                          │
│  └── bearing: number                                                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Type Definitions

### Solar3DSnapshot

Captures the data state when the modal opens. Immutable during modal session.

```typescript
/**
 * Static snapshot of solar data captured when 3D modal opens.
 * Modal renders from this snapshot and does not react to store changes.
 */
export interface Solar3DSnapshot {
  /** Geographic location */
  location: LocationPoint;
  /** Selected date in YYYY-MM-DD format */
  dateISO: string;
  /** Timezone identifier */
  timezone: string;
  /** All 24 hourly positions (includes night hours) */
  hourly: HourlySolarPosition[];
  /** Currently selected hour, or null if none */
  selectedHour: number | null;
}
```

**Validation Rules**:
- `location.lat` must be in range [-90, 90]
- `location.lng` must be in range [-180, 180]
- `dateISO` must match pattern `YYYY-MM-DD`
- `hourly` must have exactly 24 elements (indices 0-23)
- `selectedHour` if present must be in range [0, 23]

---

### Solar3DPoint

Represents a single visible hour with computed 3D position.

```typescript
/**
 * A single hourly point in 3D space.
 * Only created for visible hours (altitudeDeg >= 0).
 */
export interface Solar3DPoint {
  /** Hour of day (0-23) */
  hour: number;
  /** Formatted time label (e.g., "14:00") */
  localTimeLabel: string;
  /** Azimuth in degrees from North (0-360°) */
  azimuthDeg: number;
  /** Altitude in degrees above horizon (≥ 0) */
  altitudeDeg: number;
  /** Daylight classification (never 'night' for visible points) */
  daylightState: 'golden' | 'day';
  /** 
   * 3D position in meters relative to location origin.
   * [east, north, up] for deck.gl METER_OFFSETS coordinate system.
   */
  position: [number, number, number];
}
```

**Derivation Rules**:
- Created from `HourlySolarPosition` where `altitudeDeg >= 0`
- `position` computed via geometry mapping function
- `daylightState` is never 'night' (those hours are filtered out)

---

### Solar3DPath

Represents the polyline connecting visible points.

```typescript
/**
 * Polyline connecting visible hourly points in ascending hour order.
 */
export interface Solar3DPath {
  /** 
   * Sequence of 3D positions forming the path.
   * Each position is [east, north, up] in meters.
   * Points are ordered by hour (ascending).
   */
  positions: [number, number, number][];
}
```

**Derivation Rules**:
- Built from `Solar3DPoint[]` sorted by `hour` ascending
- Contains only positions of visible points
- May be empty (polar night scenario)
- May have gaps in hour sequence (discontinuous visibility)

---

### Solar3DViewData

Aggregated data for rendering the 3D view.

```typescript
/**
 * Complete derived data for 3D view rendering.
 */
export interface Solar3DViewData {
  /** Original snapshot data */
  snapshot: Solar3DSnapshot;
  /** Visible hourly points with 3D positions */
  visiblePoints: Solar3DPoint[];
  /** Polyline path connecting visible points */
  path: Solar3DPath;
  /** Whether selectedHour is present AND visible */
  isSelectedVisible: boolean;
  /** True if no visible points (polar night) */
  isEmpty: boolean;
}
```

**Derivation Rules**:
- `visiblePoints`: Filter hourly where `altitudeDeg >= 0`, map to `Solar3DPoint`
- `path.positions`: Extract positions from `visiblePoints` in hour order
- `isSelectedVisible`: `selectedHour != null && hourly[selectedHour].altitudeDeg >= 0`
- `isEmpty`: `visiblePoints.length === 0`

---

### Solar3DTooltipData

Tooltip state for hover interactions.

```typescript
/**
 * Tooltip display state.
 * Null when no tooltip should be shown.
 */
export type Solar3DTooltipData = {
  /** Screen X coordinate for tooltip positioning */
  x: number;
  /** Screen Y coordinate for tooltip positioning */
  y: number;
  /** Hour being hovered */
  hour: number;
  /** Formatted time label */
  localTimeLabel: string;
  /** Azimuth in degrees */
  azimuthDeg: number;
  /** Altitude in degrees */
  altitudeDeg: number;
  /** Daylight state */
  daylightState: string;
} | null;
```

---

### Solar3DCameraState

Camera state for 3D map view.

```typescript
/**
 * 3D map camera state.
 */
export interface Solar3DCameraState {
  /** Map center [longitude, latitude] */
  center: [number, number];
  /** Zoom level */
  zoom: number;
  /** Camera pitch in degrees (0 = top-down, 60 = 3D view) */
  pitch: number;
  /** Camera bearing in degrees (0 = north up) */
  bearing: number;
}
```

**Default Values**:
```typescript
const DEFAULT_3D_CAMERA: Solar3DCameraState = {
  center: [location.lng, location.lat],
  zoom: 15,
  pitch: 60,
  bearing: 0
};
```

---

### Constants

```typescript
/**
 * Visual constants for 3D rendering.
 */
export const SOLAR_3D_CONSTANTS = {
  /** Radius of the sun path arc in meters */
  PATH_RADIUS_METERS: 1200,
  /** Height scale factor for altitude */
  HEIGHT_SCALE: 1.0,
  /** Point radius in pixels (normal) */
  POINT_RADIUS: 12,
  /** Point radius in pixels (selected) */
  POINT_RADIUS_SELECTED: 18,
  /** Path line width in pixels */
  PATH_WIDTH: 4,
} as const;

/**
 * Color palette for daylight states.
 */
export const SOLAR_3D_COLORS = {
  /** Golden hour points */
  golden: [255, 183, 77, 255] as [number, number, number, number],
  /** Daytime points */
  day: [255, 235, 59, 255] as [number, number, number, number],
  /** Selected point highlight */
  selected: [255, 87, 34, 255] as [number, number, number, number],
  /** Path line color */
  path: [255, 193, 7, 200] as [number, number, number, number],
} as const;
```

---

## State Transitions

### Modal State Machine

```text
┌─────────────┐                    ┌─────────────┐
│   CLOSED    │ ── click 3D View ──►│  LOADING    │
│             │◄── Esc / Close ────│             │
└─────────────┘                    └──────┬──────┘
                                          │
                                          │ data ready
                                          ▼
                                   ┌─────────────┐
                                   │    OPEN     │
                                   │  (RENDERED) │
                                   └─────────────┘
                                          │
                      data missing/invalid│
                                          ▼
                                   ┌─────────────┐
                                   │    ERROR    │
                                   │   STATE     │
                                   └─────────────┘
```

### Tooltip State

```text
No hover ──► onHover(point) ──► Showing tooltip
    ▲                               │
    └─── onHover(null) ◄────────────┘
```

---

## Relationships Summary

| From | To | Relationship | Description |
|------|----|--------------|-------------|
| Solar3DSnapshot | LocationPoint | contains | Location for coordinate origin |
| Solar3DSnapshot | HourlySolarPosition | contains (24) | All hourly data including night |
| Solar3DViewData | Solar3DSnapshot | references | Original data for display |
| Solar3DViewData | Solar3DPoint | contains (0-24) | Filtered visible points |
| Solar3DViewData | Solar3DPath | contains | Polyline from visible points |
| Solar3DPoint | HourlySolarPosition | derived from | Adds 3D position |
| Solar3DPath | Solar3DPoint | ordered collection | Positions in hour order |
