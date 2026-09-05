# planning.md — 3D Solar Path View (Technical Plan)

**Feature Branch**: `002-3d-solar-path-view`  
**Created**: 2025-12-29  
**Status**: Draft  
**Source**: `spec.md` (3D Solar Path View feature specification)  
**Prerequisites**: `001-solar-path-tracker` implemented (location/date/timezone/hourly dataset available)

---

## 0. Objectives

This plan describes how to implement the **3D Solar Path View** in the existing Next.js Solar Path Tracker:

- Add a **“3D View”** button on the main map page.
- Open a **near-fullscreen, accessible modal** that renders:
  - a **3D-perspective map** (pitched camera; no terrain/buildings),
  - a **3D sun trajectory** (visible-hour points + polyline).
- Support **optional** `selectedHour`:
  - If missing: still render trajectory fully.
  - If present and visible: highlight using distinct style.
- Maintain deterministic behavior and avoid regressions (main map camera unchanged after closing modal).

Success is measured by passing P1 acceptance scenarios and the E2E test suite.

---

## 1. Key Decisions (Tech)

### 1.1 Map Engine
- Continue using **MapLibre GL JS**.
- Use pitch/bearing for 3D perspective only (no terrain/buildings; out of scope).

### 1.2 3D Overlay Rendering
- Use **deck.gl** to render 3D overlays on top of MapLibre:
  - `@deck.gl/core`
  - `@deck.gl/layers`
  - `@deck.gl/mapbox` (MapboxOverlay integration, compatible with MapLibre control)
- Rationale:
  - Built-in GPU accelerated layers for points and paths.
  - Built-in picking for hover/click tooltips.
  - Lower complexity than implementing MapLibre CustomLayer + raw WebGL/Three.js.

### 1.3 Modal / Accessibility
- Use **Radix UI Dialog** (`@radix-ui/react-dialog`) for:
  - focus trap,
  - `Esc` close,
  - aria attributes,
  - near-fullscreen layout.
- Alternative if already used in the project: keep your existing modal system, but it must meet NFR3D-004.

### 1.4 State Management
- Reuse existing global store (preferred: Zustand) for:
  - `location`
  - `dateISO`
  - `timezone`
  - `hourly`
  - `selectedHour?: number | null`
- `selectedHour` is optional; 3D view must not assume it exists.

### 1.5 SSR Strategy (Next.js)
- MapLibre + deck.gl must be **client-only**.
- Use `next/dynamic` with `{ ssr: false }` for the modal’s map canvas component.

### 1.6 Testing
- Unit tests (Vitest) for:
  - geometry mapping,
  - visible-hours filtering,
  - selectedHour optional rules.
- Playwright E2E for:
  - modal open/close,
  - highlight behavior,
  - tooltip behavior,
  - main map camera unchanged after closing.

---

## 2. System Architecture

### 2.1 Components

- **MapPanel (existing)**
  - Add a `3D View` button (FR3D-001).
- **Solar3DViewModal**
  - Radix Dialog wrapper
  - near-fullscreen layout
  - header: title/subtitle + Reset + Close
  - body: Solar3DMapCanvas
- **Solar3DMapCanvas**
  - MapLibre map instance (separate from main map)
  - deck.gl overlay for:
    - ScatterplotLayer (hour points)
    - PathLayer (visible-hours polyline)
  - hover tooltip
  - optional click -> set `selectedHour`

### 2.2 Data Flow

1. User clicks `3D View`.
2. Modal opens.
3. Modal reads current dataset from the global store:
   - `location`, `dateISO`, `timezone`, `hourly`, `selectedHour?`
4. Build derived data:
   - `visibleHourly = hourly.filter(h => h.altitudeDeg >= 0)`
   - `pathPoints = visibleHourly sorted by hour -> mapped to 3D offsets`
5. Render:
   - MapLibre map with pitched camera
   - deck.gl layers
6. Interactions:
   - Hover point -> show tooltip
   - Click point (optional, but recommended) -> set global `selectedHour`
   - Reset view -> map.easeTo(defaultView)

---

## 3. Data Models (TypeScript)

No new persisted models required. Add internal 3D view DTOs:

```ts
export type Solar3DPoint = {
  hour: number;                 // 0..23
  localTimeLabel: string;       // "HH:00"
  azimuthDeg: number;           // 0..360, 0 = North
  altitudeDeg: number;          // >= 0 for visible points
  daylightState: "golden" | "day"; // night omitted
  // deck.gl METER_OFFSETS coordinate:
  position: [number, number, number]; // [east, north, up] in meters
};

export type Solar3DPath = {
  path: [number, number, number][]; // sequence of positions in hour order
};
```

---

## 4. Geometry & Mapping (Deterministic)

### 4.1 Visibility Rule
- A point is **visible** if `altitudeDeg >= 0`.
- Night hours are omitted entirely:
  - no point
  - not included in the polyline (Decision A).

### 4.2 Mapping Function (Spec-Compliant)
Use ENU-like mapping:

- X = East
- Z = North
- Y = Up (note: deck.gl uses Z as elevation; we will map carefully)

For deck.gl `METER_OFFSETS`, prefer:
- `[xEast, yNorth, zUp]`

Let:
- `a = degToRad(azimuthDeg)` (0°=North, 90°=East)
- `h = degToRad(altitudeDeg)`
- `R = pathRadiusMeters` (e.g., 1000m)
- `heightScale = 1.0` (tunable, but start with 1.0)

Compute:
- `east  = R * Math.cos(h) * Math.sin(a)`
- `north = R * Math.cos(h) * Math.cos(a)`
- `up    = R * Math.sin(h) * heightScale`

Deck.gl position:
- `position: [east, north, up]`

### 4.3 Scale Defaults
- Start with:
  - `pathRadiusMeters = 1200`
  - `heightScale = 1.0`
- Provide constants in a single module:
  - `src/features/solar3d/constants.ts`
- If visibility/interpretability is poor, adjust `pathRadiusMeters` first, then `heightScale`.

---

## 5. MapLibre + deck.gl Integration

### 5.1 Integration Pattern (Recommended)
Use `MapboxOverlay` (deck.gl) as a MapLibre control:

- Create MapLibre map inside modal canvas.
- Create overlay:
  - `const overlay = new MapboxOverlay({ layers, interleaved: true })`
- Attach:
  - `map.addControl(overlay)`

This pattern avoids refactoring your existing MapPanel implementation (works well if your app already uses imperative MapLibre).

### 5.2 Coordinate System
For correct local offsets:

- deck.gl layer props:
  - `coordinateSystem: COORDINATE_SYSTEM.METER_OFFSETS`
  - `coordinateOrigin: [location.lng, location.lat]`

This ensures your computed `[east,north,up]` offsets behave predictably around the selected location.

### 5.3 Camera Defaults + Reset View
Define a consistent default 3D camera:

- center: selected location
- zoom: (e.g.) 14–16 depending on your current default
- pitch: 60 degrees (3D feel)
- bearing: 0 (North up) or keep existing bearing style

Reset button:
- `map.easeTo({ center, zoom, pitch, bearing, duration: 400 })`

---

## 6. Rendering Layers (deck.gl)

### 6.1 ScatterplotLayer (hourly points)
- data: `solar3dPoints`
- position: `d.position`
- radius:
  - base radius (e.g., 12)
  - if `d.hour === selectedHour`: bigger radius (e.g., 18)
- color:
  - base derived from daylightState
  - selected hour uses distinct highlight color (or outline strategy)
- picking:
  - `pickable: true`
  - `onHover` sets tooltip state
  - `onClick` sets `selectedHour` (optional but recommended)

### 6.2 PathLayer (polyline)
- data: single object `{ path: positions }` or array of segments
- path: `d.path`
- width:
  - constant, or slightly thicker for readability
- note:
  - path is only for visible points; may be short or discontinuous in time coverage.

### 6.3 Tooltip
Tooltip content MUST include:
- hour label (`HH:00`)
- azimuthDeg (format with 1 decimal or integer)
- altitudeDeg (format with 1 decimal)
- daylightState

Implementation:
- Maintain local React state for tooltip:
  - `{ x, y, content } | null`
- Update onHover from deck.gl picking info.

---

## 7. Optional `selectedHour` Handling (Critical)

Rules:
- If `selectedHour` is `null/undefined`: render normally with **no highlight**.
- If `selectedHour` exists but is a night hour (altitude < 0):
  - since point is omitted, render with **no highlight**.
- If `selectedHour` exists and visible:
  - highlight the corresponding point.

Implementation detail:
- compute `selectedVisible = selectedHour != null && hourly[selectedHour]?.altitudeDeg >= 0`
- in ScatterplotLayer:
  - `getRadius` and/or `getFillColor` conditional on selectedVisible and hour match.

---

## 8. UI/UX Implementation Notes

### 8.1 Button Placement (Main Map)
- Place “3D View” as a map control button:
  - top-right aligned with existing controls
  - disabled if required dataset is not ready (optional)

### 8.2 Modal Layout (Near-Fullscreen)
- Use CSS:
  - desktop: `width: 95vw; height: 92vh;`
  - mobile: `width: 100vw; height: 100vh; border-radius: 0;`
- Header:
  - title + subtitle (location/date/timezone)
  - Reset + Close buttons
- Body:
  - map canvas fills remaining space
- Accessibility:
  - focus trap
  - aria labels (`aria-label="Close 3D view"`, `aria-label="Reset 3D camera"`)

---

## 9. Performance & Reliability

- Create/destroy the modal map instance on open/close to avoid memory leaks.
- Ensure `map.remove()` and overlay cleanup on unmount.
- Avoid re-instantiating the map on every React re-render:
  - create map once in `useEffect` on mount
  - update overlay layers when data changes

---

## 10. Testing Plan

### 10.1 Unit Tests (Vitest)
- `buildSolar3DPoints(hourly, origin, constants)`:
  - filters altitude < 0
  - produces correct `[east,north,up]` direction checks:
    - azimuth 0 -> north positive
    - azimuth 90 -> east positive
- `buildSolar3DPath(points)`:
  - preserves ascending hour order
  - includes only visible points
- `selectedHour` rules:
  - null -> no selected
  - night selected -> no selected
  - visible selected -> selected styles applied

### 10.2 E2E (Playwright)
1. Open modal via 3D View; close via Esc.
2. Verify main map camera unchanged after modal close (existing camera values persisted).
3. With `selectedHour = null`, open modal and ensure no highlighted point.
4. With visible `selectedHour`, open modal and verify highlighted point exists.
5. Hover a point and assert tooltip content includes hour/azimuth/altitude/state.

---

## 11. Implementation Checklist (Suggested)

1. Add `3D View` button to MapPanel.
2. Implement `Solar3DViewModal` with Radix Dialog.
3. Implement `Solar3DMapCanvas` client-only component (`dynamic(..., { ssr: false })`).
4. Add deck.gl overlay integration (MapboxOverlay).
5. Implement mapping utilities:
   - visible filtering
   - ENU mapping function
   - path builder
6. Implement hover tooltip + optional click select.
7. Implement Reset View.
8. Add unit tests.
9. Add Playwright E2E tests.
10. Verify no memory leaks (map removal on unmount).

---
