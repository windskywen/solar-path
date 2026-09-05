# Feature Specification: 3D Solar Path View (Modal)

**Feature Branch**: `002-3d-solar-path-view`  
**Created**: 2025-12-29  
**Status**: Draft  
**Depends on**: `001-solar-path-tracker` (hourly dataset + map already implemented)

---

## 1. Overview

Add a **“3D View”** button on the main map UI. When clicked, a **near-fullscreen modal** opens and displays:

1. A **3D-perspective map** (pitched camera only; no terrain/buildings required).
2. A **3D sun trajectory** for the current location/date/timezone:
   - **24 hourly points (00–23)** positioned by azimuth + altitude.
   - A **polyline** connecting **only visible points** (hours where altitude ≥ 0) in time order.
3. Optional highlight for `selectedHour`:
   - `selectedHour` may be missing (`null/undefined`).
   - If present and the point is visible, highlight it using a distinct style.

This 3D view is **read-only**: it reflects the current state and does not allow editing location/date/timezone inside the modal.

---

## 2. Goals

- Provide an intuitive 3D visualization of hourly **azimuth + altitude**.
- Keep it deterministic, reproducible, and free (no paid APIs).
- Preserve existing behavior:
  - Closing modal does not change the main map’s camera (center/zoom/bearing).
- Support optional selection highlighting without requiring `selectedHour`.

---

## 3. Non-Goals

- 3D terrain or 3D building extrusion.
- Editing date/location/timezone inside the modal.
- Shadow simulation, irradiance/energy modeling, or AI-generated insights.
- Replacing existing 2D visualization.

---

## 4. Preconditions & Data Contract

### 4.1 Required Inputs (Must Exist)

The modal MUST have access to:

- `location`: `{ lat, lng, name? }`
- `dateISO`: `"YYYY-MM-DD"`
- `timezone`: `"browser"` or IANA timezone string
- `hourly[0..23]`: each hour contains:
  - `azimuthDeg` (0..360; 0 = North)
  - `altitudeDeg` (may be negative)
  - `daylightState` ("night" | "golden" | "day")

### 4.2 Optional Input

- `selectedHour`: `number | null | undefined`

### 4.3 Error Handling

- If any required input is missing/invalid, modal MUST display a non-fatal error state (no crash), e.g.:
  - “Solar data unavailable. Please reselect location/date and try again.”

---

## 5. User Stories & Acceptance Scenarios

### User Story 1 — Open/Close 3D View (P1)

As a user, I want to open a 3D view from the map so I can understand the sun path spatially.

**Acceptance Scenarios**
1. **Given** location/date/timezone/hourly data is ready, **When** I click “3D View”, **Then** a near-fullscreen modal opens showing a pitched 3D map and 3D solar trajectory for the current state.
2. **Given** the modal is open, **When** I press **Esc** or click close, **Then** the modal closes and the main map camera remains unchanged.
3. **Given** modal content is still initializing, **Then** I see a loading state without layout jump.

### User Story 2 — Show 3D Trajectory without Selected Hour (P1)

As a user, I want the 3D view to work even if no hour is selected.

**Acceptance Scenarios**
1. **Given** `selectedHour` is `null/undefined`, **When** I open the modal, **Then** the 3D path renders normally with no highlighted point.
2. **Given** `selectedHour` is `null/undefined`, **Then** hovering a point still shows tooltip info.

### User Story 3 — Highlight Selected Hour When Available (P1)

As a user, I want the selected hour to be highlighted when it exists.

**Acceptance Scenarios**
1. **Given** `selectedHour = H` and `hourly[H].altitudeDeg >= 0`, **When** I open the modal, **Then** hour H’s point is highlighted with a distinct style.
2. **Given** `selectedHour = H` but `hourly[H].altitudeDeg < 0`, **When** I open the modal, **Then** no point is highlighted and the modal remains functional.

### User Story 4 — Tooltip on Hover (P1)

As a user, I want to inspect hourly details in 3D.

**Acceptance Scenarios**
1. **Given** the modal is open, **When** I hover a visible point, **Then** I see a tooltip showing:
   - hour label (e.g., `13:00`)
   - azimuth (°)
   - altitude (°)
   - daylight state (night/golden/day)

### User Story 5 — Basic Camera Controls (P2)

As a user, I want basic 3D map controls to inspect the path.

**Acceptance Scenarios**
1. **Given** the modal is open, **When** I drag/scroll, **Then** I can pan/zoom and adjust pitch/bearing using native map interactions.
2. **Given** I changed camera state, **When** I click “Reset View”, **Then** the camera returns to a default viewpoint for the location.

---

## 6. Functional Requirements

### 6.1 Entry Point & Modal
- **FR3D-001**: System MUST show a “3D View” button on the main map UI.
- **FR3D-002**: Clicking MUST open a near-fullscreen modal:
  - Desktop: ~90–95% viewport
  - Mobile: full-screen
- **FR3D-003**: Modal MUST close via close button and `Esc`.
- **FR3D-004**: Closing modal MUST preserve main map camera state.

### 6.2 Data Binding
- **FR3D-010**: Modal MUST bind to required inputs: `location`, `dateISO`, `timezone`, `hourly[0..23]`.
- **FR3D-011**: `selectedHour` MUST be treated as optional.
- **FR3D-012**: Missing/invalid required data MUST show a safe error state (no crash).

### 6.3 3D Map (Perspective Only)
- **FR3D-040**: Map MUST render in a 3D perspective (pitched camera).
- **FR3D-041**: Terrain/buildings MUST NOT be required.
- **FR3D-042**: Initial camera MUST center on selected location.

### 6.4 3D Trajectory Rendering
- **FR3D-020**: System MUST render hourly points for hours where `altitudeDeg >= 0`.
- **FR3D-021**: System MUST render a polyline connecting **only the visible points** in ascending hour order (Decision A).
- **FR3D-022**: Hours with `altitudeDeg < 0` MUST NOT be rendered as points.
- **FR3D-023**: Hover tooltip MUST be available for rendered points.

### 6.5 Selected Hour Highlight
- **FR3D-030**: If `selectedHour` is present AND `hourly[selectedHour].altitudeDeg >= 0`, the corresponding point MUST be highlighted using a distinct style (e.g., different color and/or size).
- **FR3D-031**: If `selectedHour` is `null/undefined`, modal MUST render with no highlight.
- **FR3D-032**: If `selectedHour` exists but refers to a night hour (`altitudeDeg < 0`), modal MUST render with no highlight and no errors.

### 6.6 Controls
- **FR3D-050**: Modal MUST include “Reset View”.
- **FR3D-051**: Modal SHOULD include a legend for daylight states (night/golden/day), even though night points are not rendered.

---

## 7. Geometry Spec (Azimuth + Altitude to 3D)

### 7.1 Coordinate System
Use a local tangent plane approximation (ENU-like):
- X = East
- Z = North
- Y = Up

### 7.2 Mapping Function (Deterministic)

Let:
- `a = degToRad(azimuthDeg)` where azimuth is 0°=North, 90°=East.
- `h = degToRad(altitudeDeg)`
- `R = pathRadius` (visual scale constant)

For each hour `H`:
- If `altitudeDeg < 0`, omit.
- Else compute:
  - `x = R * cos(h) * sin(a)`  (East)
  - `z = R * cos(h) * cos(a)`  (North)
  - `y = R * sin(h)`           (Up)

Polyline:
- Connect the sequence of computed points (visible subset) in ascending hour order.

### 7.3 Visual Scale
- MUST prioritize interpretability over physical scale accuracy.
- `R` (and optional `heightScale`) may be tuned to clearly show the arc.

---

## 8. UX / Visual Spec

### 8.1 Modal Header
- Title: `3D Solar Path`
- Subtitle: `<LocationName or lat,lng> | <YYYY-MM-DD> | <Timezone>`
- Buttons: `Reset View`, `Close`

### 8.2 Styling
- Visible points: standard marker
- Hover: outline + tooltip
- Selected (if applicable): distinct color and/or larger marker
- Polyline: standard style; optionally segmented by daylightState if desired (non-required)

---

## 9. Edge Cases

- **All hours are night** (e.g., polar night):
  - Render empty state: “Sun does not rise on this date at this location.”
  - No points, no polyline.
- **Only a few visible hours**:
  - Render only those points.
  - Polyline connects only the visible points (may be short or appear “broken” versus a full 24h curve).
- **selectedHour refers to non-visible hour**:
  - No highlight; system remains functional.

---

## 10. Non-Functional Requirements

- **NFR3D-001**: Smooth interactions (target 30–60 FPS).
- **NFR3D-002**: No paid API dependencies.
- **NFR3D-003**: Deterministic output for identical inputs.
- **NFR3D-004**: Accessibility:
  - focus trap
  - `Esc` close
  - aria labels
  - keyboard navigable close/reset controls

---

## 11. Testing Plan

### 11.1 Unit Tests
- Mapping correctness:
  - azimuth 0/90/180/270 produces expected direction
  - altitude affects Y correctly
- Night omission:
  - altitude < 0 omitted from points + polyline list
- Selected hour optional:
  - null/undefined -> no highlight
  - night selectedHour -> no highlight, no error
- Polyline rule:
  - only visible points included and connected in hour order

### 11.2 E2E (Playwright)
1. Open modal and close via Esc; verify main map camera unchanged.
2. Open modal with `selectedHour = null`; confirm path renders and no highlight.
3. Open modal with visible `selectedHour`; confirm highlight visible.
4. Hover a point; confirm tooltip contains hour/azimuth/altitude/state.
5. Scenario where all hours are night; confirm empty-state message shown and no crash.

---
