# Feature Specification: 3D Solar Path View (Modal)

**Feature Branch**: `002-3d-solar-path-view`  
**Created**: 2025-12-29  
**Status**: Draft  
**Depends on**: `001-solar-path-tracker` (hourly dataset + map already implemented)

---

## Overview

Add a **"3D View"** button on the main map UI. When clicked, a **near-fullscreen modal** opens displaying:

1. A **3D-perspective map** (pitched camera only; no terrain/buildings required)
2. A **3D sun trajectory** for the current location/date/timezone:
   - **24 hourly points (00–23)** positioned by azimuth + altitude
   - A **polyline** connecting **only visible points** (hours where altitude ≥ 0) in time order
3. Optional highlight for `selectedHour` when present and visible

This 3D view is **read-only**: it reflects the current state and does not allow editing location/date/timezone inside the modal.

### Goals

- Provide an intuitive 3D visualization of hourly azimuth + altitude
- Keep it deterministic, reproducible, and free (no paid APIs)
- Preserve existing behavior: closing modal does not change the main map's camera
- Support optional selection highlighting without requiring `selectedHour`

### Non-Goals

- 3D terrain or 3D building extrusion
- Editing date/location/timezone inside the modal
- Shadow simulation, irradiance/energy modeling, or AI-generated insights
- Replacing existing 2D visualization

---

## User Scenarios & Testing

### User Story 1 — Open/Close 3D View (Priority: P1)

As a user, I want to open a 3D view from the map so I can understand the sun path spatially.

**Why this priority**: This is the core entry point for the feature - without the ability to open and close the modal, no other functionality is accessible.

**Independent Test**: Can be tested by clicking the "3D View" button, verifying modal opens with 3D content, then closing via Esc/close button and confirming main map state is unchanged.

**Acceptance Scenarios**:

1. **Given** location/date/timezone/hourly data is ready, **When** I click "3D View", **Then** a near-fullscreen modal opens showing a pitched 3D map and 3D solar trajectory for the current state.
2. **Given** the modal is open, **When** I press **Esc** or click close, **Then** the modal closes and the main map camera remains unchanged.
3. **Given** modal content is still initializing, **Then** I see a loading state without layout jump.

---

### User Story 2 — Show 3D Trajectory without Selected Hour (Priority: P1)

As a user, I want the 3D view to work even if no hour is selected.

**Why this priority**: The 3D trajectory is the primary value of the feature and must render correctly regardless of selection state.

**Independent Test**: Can be tested by opening the modal when no hour is selected in the main view and verifying the complete sun path renders with all visible points.

**Acceptance Scenarios**:

1. **Given** `selectedHour` is `null/undefined`, **When** I open the modal, **Then** the 3D path renders normally with no highlighted point.
2. **Given** `selectedHour` is `null/undefined`, **Then** hovering a point still shows tooltip info.

---

### User Story 3 — Highlight Selected Hour When Available (Priority: P1)

As a user, I want the selected hour to be highlighted when it exists.

**Why this priority**: Visual feedback for the currently selected hour provides context continuity between the main view and 3D view.

**Independent Test**: Can be tested by selecting an hour in the main view, opening the modal, and verifying that hour's point has distinct styling.

**Acceptance Scenarios**:

1. **Given** `selectedHour = H` and `hourly[H].altitudeDeg >= 0`, **When** I open the modal, **Then** hour H's point is highlighted with a distinct style.
2. **Given** `selectedHour = H` but `hourly[H].altitudeDeg < 0`, **When** I open the modal, **Then** no point is highlighted and the modal remains functional.

---

### User Story 4 — Tooltip on Hover (Priority: P1)

As a user, I want to inspect hourly details in 3D.

**Why this priority**: Tooltips provide essential data inspection capability, making the visualization informative rather than purely decorative.

**Independent Test**: Can be tested by hovering over any rendered point and verifying tooltip appears with correct hour/azimuth/altitude/daylight state.

**Acceptance Scenarios**:

1. **Given** the modal is open, **When** I hover a visible point, **Then** I see a tooltip showing:
   - hour label (e.g., `13:00`)
   - azimuth (°)
   - altitude (°)
   - daylight state (night/golden/day)

---

### User Story 5 — Basic Camera Controls (Priority: P2)

As a user, I want basic 3D map controls to inspect the path.

**Why this priority**: Camera controls enhance usability but the feature delivers value even with default view only.

**Independent Test**: Can be tested by dragging/scrolling in the modal and verifying pan/zoom/pitch/bearing respond, then clicking Reset View to return to default.

**Acceptance Scenarios**:

1. **Given** the modal is open, **When** I drag/scroll, **Then** I can pan/zoom and adjust pitch/bearing using native map interactions.
2. **Given** I changed camera state, **When** I click "Reset View", **Then** the camera returns to a default viewpoint for the location.

---

### Edge Cases

- **All hours are night** (e.g., polar night): Render empty state message "Sun does not rise on this date at this location." No points, no polyline.
- **Only a few visible hours**: Render only those points. Polyline connects only visible points (may be short or appear "broken" versus a full 24h curve).
- **selectedHour refers to non-visible hour**: No highlight; system remains functional without errors.
- **Missing/invalid required data**: Display non-fatal error state: "Solar data unavailable. Please reselect location/date and try again."

---

## Requirements

### Preconditions & Data Contract

#### Required Inputs (Must Exist)

The modal MUST have access to:

- `location`: `{ lat, lng, name? }`
- `dateISO`: `"YYYY-MM-DD"`
- `timezone`: `"browser"` or IANA timezone string
- `hourly[0..23]`: each hour contains:
  - `azimuthDeg` (0..360; 0 = North)
  - `altitudeDeg` (may be negative)
  - `daylightState` ("night" | "golden" | "day")

#### Optional Input

- `selectedHour`: `number | null | undefined`

### Functional Requirements

#### Entry Point & Modal

- **FR3D-001**: System MUST show a "3D View" button on the main map UI; button MUST be disabled when required data (location, date, hourly) is not available, and enabled only when all required data exists.
- **FR3D-002**: Clicking MUST open a near-fullscreen modal:
  - Desktop: ~90–95% viewport
  - Mobile: full-screen
- **FR3D-003**: Modal MUST close via close button and `Esc`.
- **FR3D-004**: Closing modal MUST preserve main map camera state.

#### Data Binding

- **FR3D-010**: Modal MUST bind to required inputs: `location`, `dateISO`, `timezone`, `hourly[0..23]`.
- **FR3D-011**: `selectedHour` MUST be treated as optional.
- **FR3D-012**: Missing/invalid required data MUST show a safe error state (no crash).
- **FR3D-013**: Modal MUST capture a static snapshot of data at open time; changes in main view do NOT propagate until modal is reopened.

#### 3D Map (Perspective Only)

- **FR3D-040**: Map MUST render in a 3D perspective (pitched camera).
- **FR3D-041**: Terrain/buildings MUST NOT be required.
- **FR3D-042**: Initial camera MUST center on selected location.
- **FR3D-043**: Tile source MUST prioritize lowest latency/fastest loading; visual consistency with 2D map is NOT required.

#### 3D Trajectory Rendering

- **FR3D-020**: System MUST render hourly points for hours where `altitudeDeg >= 0`.
- **FR3D-021**: System MUST render a polyline connecting **only the visible points** in ascending hour order.
- **FR3D-022**: Hours with `altitudeDeg < 0` MUST NOT be rendered as points.
- **FR3D-023**: Hover tooltip MUST be available for rendered points.

#### Selected Hour Highlight

- **FR3D-030**: If `selectedHour` is present AND `hourly[selectedHour].altitudeDeg >= 0`, the corresponding point MUST be highlighted using a distinct style (e.g., different color and/or size).
- **FR3D-031**: If `selectedHour` is `null/undefined`, modal MUST render with no highlight.
- **FR3D-032**: If `selectedHour` exists but refers to a night hour (`altitudeDeg < 0`), modal MUST render with no highlight and no errors.

#### Controls

- **FR3D-050**: Modal MUST include "Reset View".
- **FR3D-051**: Modal SHOULD include a legend for daylight states (night/golden/day).

### Key Entities

- **HourlyDataPoint**: Represents one hour's solar position with `hour` (0-23), `azimuthDeg`, `altitudeDeg`, `daylightState`
- **3DPoint**: Computed local coordinate (x, y, z) derived from azimuth/altitude for rendering
- **SunTrajectory**: Collection of visible 3DPoints connected as a polyline in hour order

---

## Geometry Spec (Azimuth + Altitude to 3D)

### Coordinate System

Use a local tangent plane approximation (ENU-like):
- X = East
- Z = North
- Y = Up

### Mapping Function (Deterministic)

Let:
- `a = degToRad(azimuthDeg)` where azimuth is 0°=North, 90°=East
- `h = degToRad(altitudeDeg)`
- `R = pathRadius` (visual scale constant)

For each hour `H`:
- If `altitudeDeg < 0`, omit
- Else compute:
  - `x = R * cos(h) * sin(a)`  (East)
  - `z = R * cos(h) * cos(a)`  (North)
  - `y = R * sin(h)`           (Up)

Polyline: Connect the sequence of computed points (visible subset) in ascending hour order.

### Visual Scale

- MUST prioritize interpretability over physical scale accuracy
- `R` (and optional `heightScale`) may be tuned to clearly show the arc

---

## UX / Visual Spec

### Modal Header

- Title: `3D Solar Path`
- Subtitle: `<LocationName or lat,lng> | <YYYY-MM-DD> | <Timezone>`
- Buttons: `Reset View`, `Close`

### Styling

- Visible points: standard marker
- Hover: outline + tooltip
- Selected (if applicable): distinct color and/or larger marker
- Polyline: standard style

---

## Non-Functional Requirements

- **NFR3D-001**: Smooth interactions (target 30–60 FPS)
- **NFR3D-002**: No paid API dependencies
- **NFR3D-003**: Deterministic output for identical inputs
- **NFR3D-004**: Accessibility:
  - Focus trap in modal
  - `Esc` close
  - ARIA labels
  - Keyboard navigable close/reset controls
  - Text-based accessible summary of visible hours (list with hour, azimuth, altitude, daylight state) for screen reader users
- **NFR3D-005**: Graceful degradation: If device cannot sustain acceptable FPS or lacks WebGL support, display a static 2D fallback image of the solar path instead of the interactive 3D view

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: Users can open and view the 3D solar path in under 2 seconds from button click
- **SC-002**: Modal renders correctly on desktop (90-95% viewport) and mobile (full-screen)
- **SC-003**: 100% of visible hourly points (altitude ≥ 0) are rendered with correct positioning
- **SC-004**: Tooltip information displays within 200ms of hover interaction
- **SC-005**: Main map camera state remains unchanged after modal close in 100% of cases
- **SC-006**: Empty state message displays correctly when all hours are night (polar scenarios)
- **SC-007**: Modal maintains 30+ FPS during camera pan/zoom/pitch interactions

---

## Testing Plan

### Unit Tests

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

### E2E (Playwright)

1. Open modal and close via Esc; verify main map camera unchanged
2. Open modal with `selectedHour = null`; confirm path renders and no highlight
3. Open modal with visible `selectedHour`; confirm highlight visible
4. Hover a point; confirm tooltip contains hour/azimuth/altitude/state
5. Scenario where all hours are night; confirm empty-state message shown and no crash

---

## Clarifications

### Session 2025-12-29

- Q: What should happen when the user's device cannot meet the 30-60 FPS performance threshold? → A: Graceful degradation with static 2D fallback image
- Q: If user changes location/date in main view while modal is open, should modal update? → A: Static snapshot; changes require reopening modal
- Q: Should the 3D View button always be visible or conditional on data readiness? → A: Visible but disabled when data not ready; enabled only when location/date/hourly data exists
- Q: How should 3D trajectory points be accessible to screen reader/keyboard users? → A: Provide a text-based accessible summary (list of visible hours with data) as alternative
- Q: What is the priority for 3D map tile source selection? → A: Prioritize lowest latency/fastest tiles regardless of style match

---

## Assumptions

- The existing `001-solar-path-tracker` feature provides the required hourly dataset with `azimuthDeg`, `altitudeDeg`, and `daylightState` for all 24 hours
- A free, open-source map library (e.g., MapLibre GL JS) will be used for 3D rendering
- Browser WebGL support is assumed for 3D rendering capabilities
- The main map component already exposes necessary state (location, date, timezone, hourly data, selectedHour)
