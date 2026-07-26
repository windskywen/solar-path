# Feature Specification: 3D Solar Path View (Modal)

**Feature Branch**: `002-3d-solar-path-view`  
**Created**: 2025-12-29  
**Status**: Draft  
**Depends on**: `001-solar-path-tracker` (hourly dataset + map already implemented)

---

## Overview

Add a **"3D View"** button on the main map UI. When clicked, a **near-fullscreen modal** opens displaying:

1. A **3D-perspective map** with real terrain elevation and OpenStreetMap building extrusion
2. A **3D sun trajectory** for the current location/date/timezone:
   - **24 hourly points (00–23)** positioned by azimuth + altitude
   - A **polyline** connecting **only visible points** (hours where altitude ≥ 0) in time order
3. Optional highlight for `selectedHour` when present and visible

This 3D view is **read-only**: it reflects the current state and does not allow editing location/date/timezone inside the modal.

### Goals

- Provide an intuitive 3D visualization of hourly azimuth + altitude
- Keep it deterministic, reproducible, and free (no paid APIs)
- Use public, keyless OpenFreeMap and Mapterhorn services with visible attribution
- Maintain an interactive frame rate by progressively reducing scene complexity
- Preserve existing behavior: closing modal does not change the main map's camera
- Support optional selection highlighting without requiring `selectedHour`

### Non-Goals

- Satellite or aerial photography
- Guaranteed third-party tile availability or SLA
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

#### 3D Map Scene

- **FR3D-040**: Map MUST render in a 3D perspective (pitched camera).
- **FR3D-041**: The full scene MUST use OpenFreeMap Bright as its vector basemap and MUST extrude the OpenFreeMap `building` source layer from `render_height` and `render_min_height`, excluding features where `hide_3d` is true.
- **FR3D-042**: Initial camera MUST center on selected location.
- **FR3D-043**: Building extrusion MUST transition from zero height at zoom 14 to full height at zoom 15 and MUST remain below the first text-label layer.
- **FR3D-044**: The full scene MUST use the Mapterhorn raster DEM TileJSON with Terrarium encoding, 512px tiles, and terrain exaggeration 1.
- **FR3D-045**: Once terrain data is available, the selected location elevation MUST be applied to the shared deck.gl coordinate origin for the solar path, sun points, connectors, compass, labels, shadow path, and location marker.
- **FR3D-046**: The large translucent ground plane MUST NOT be rendered; the center marker, low-interference compass lines, and N/E/S/W labels MUST remain.
- **FR3D-047**: The initial pitch MUST be approximately 55–60 degrees and maximum pitch MUST be 75 degrees.
- **FR3D-048**: Style or critical 3D source loading MUST retry once. A second failure MUST fall back to the existing lightweight flat map, and a final rendering failure MUST show the text summary.
- **FR3D-049**: Initial view and "Reset View" MUST use zoom 15, pitch 58 degrees, and bearing 135 degrees. The modal MUST constrain navigation to zoom 15–20 and MUST NOT use solar-path bounds to reduce the initial zoom below the building extrusion range.
- **FR3D-049A**: The solar trajectory MUST target 35% of the viewport short side, clamped to 120–200px on desktop and 90–130px on mobile. The corresponding meter radius MUST be recalculated from `156543.03392 × cos(latitude) ÷ 2^zoom`.
- **FR3D-049B**: Normal/selected sun spheres MUST target 8px/11px radii on desktop and 7px/10px on mobile. Path and shadow widths MUST use pixel units.
- **FR3D-049C**: The solar horizon reference MUST remain at terrain-relative `z = 11m`, independent of rendered building height and zoom. The scene MUST NOT query rendered buildings to adjust solar geometry height.
- **FR3D-049D**: The solar path, sun spheres, and connectors MUST use the fixed `z = 11m` solar origin. Compass lines and cardinal labels MUST remain at terrain-relative `z = 10m`, creating a fixed 1m vertical gap. The location marker and shadow path MUST stay at `z = 0`, with a subtle vertical anchor joining `[0, 0, 10]` to `[0, 0, 11]`.
- **FR3D-049E**: Camera focus elevation MUST remain at `terrainElevation + 11m`, avoiding zoom-dependent vertical drift.
- **FR3D-049F**: After every zoom, pitch, bearing, or viewport-size change, the projected solar points and sun-marker radii MUST be measured against an inset viewport safe area. If any part is outside, the visual path radius MUST shrink iteratively until the complete path and every sun sphere are contained.

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
- **PerformanceMode**: Internal scene state: `full-3d`, `terrain-only`, `flat`, or `summary`

---

## Geometry Spec (Azimuth + Altitude to 3D)

### Coordinate System

Use deck.gl `METER_OFFSETS` coordinate system (ENU convention):
- Position array: `[east, north, up]`
- East = +X direction (positive toward 90° azimuth)
- North = +Y direction (positive toward 0° azimuth)  
- Up = +Z direction (positive toward zenith)

### Mapping Function (Deterministic)

Let:
- `a = degToRad(azimuthDeg)` where azimuth is 0°=North, 90°=East
- `h = degToRad(altitudeDeg)`
- `mpp = 156543.03392 × cos(latitude) ÷ 2^zoom`
- `Rpx = clamp(shortViewportSide × 0.35, deviceMinimum, deviceMaximum) × viewportFitScale`
- `R = Rpx × mpp` (zoom-responsive visual radius in meters)
- `C = 10m` (fixed terrain-relative compass and cardinal-label height)
- `G = 1m` (fixed vertical gap between compass and solar reference planes)
- `B = C + G = 11m` (fixed solar horizon reference height)

For each hour `H`:
- If `altitudeDeg < 0`, omit
- Else compute:
  - `x = R * cos(h) * sin(a)`  (East)
  - `y = R * cos(h) * cos(a)`  (North)
  - `z = B + R * sin(h)`       (Up)

Polyline: Connect the sequence of computed points (visible subset) in ascending hour order.

### Visual Scale

- MUST prioritize interpretability over physical scale accuracy
- East, North, and Up MUST use the same `R`, preserving azimuth and altitude without axis distortion
- Desktop target `Rpx`: 35% of viewport short side, clamped to 120–200px
- Mobile target `Rpx`: 35% of viewport short side, clamped to 90–130px
- `viewportFitScale` MUST dynamically reduce the target radius when projected points or sun-marker extents approach a viewport edge
- Normal/selected sun radius: desktop 8px/11px; mobile 7px/10px
- Zoom updates MUST be requestAnimationFrame-throttled; pan, pitch, and bearing changes MUST NOT rebuild solar geometry
- The path radius is a visual celestial sphere, not a physical distance to the Sun

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
- **NFR3D-005**: Graceful degradation MUST be progressive:
  - WebGL capability MUST be checked before attempting to render deck.gl layers.
  - FPS MUST be sampled in one-second windows while the camera is moving.
  - During camera interaction, 10 continuous seconds below 15 FPS MUST change `full-3d` to `terrain-only`.
  - A fresh 10-second window below 15 FPS MUST change `terrain-only` to `flat`; any interaction sample at or above 15 FPS MUST clear the low-FPS accumulator.
  - After `moveend`, 5 continuous visible-tab seconds at or above 30 FPS MUST restore exactly one level: `flat` to `terrain-only`, then `terrain-only` to `full-3d`.
  - Each recovery level MUST require a fresh five-second window. A new interaction or an idle sample below 30 FPS MUST clear the healthy-FPS accumulator.
  - Automatic recovery MUST only run for a healthy OpenFreeMap/WebGL scene. A source-fallback `flat` scene and a WebGL-loss `summary` scene MUST NOT recover automatically.
  - A background tab MUST pause healthy-time accumulation.
  - WebGL context loss MUST change the scene to `summary`.
  - The summary MUST be a styled text component; no pre-rendered image is required.
- **NFR3D-006**: Mobile rendering MUST cap MapLibre device pixel ratio at 1 and use lower sun-sphere subdivision. Desktop MUST retain the higher-detail spheres.
- **NFR3D-007**: The 3D canvas MUST remain client-only and lazily imported. Before opening the modal, the main page MUST NOT request OpenFreeMap building or Mapterhorn terrain resources.
- **NFR3D-008**: Closing the modal MUST destroy the 3D map, stop terrain requests, remove FPS/WebGL listeners, and clear hover state.
- **NFR3D-009**: Source configuration and static deck.gl inputs MUST use stable references. Pan, pitch, and bearing MUST NOT rebuild solar geometry; zoom and viewport size MAY update responsive geometry through requestAnimationFrame-throttled state.
- **NFR3D-010**: Attribution for OpenFreeMap, OpenMapTiles, OpenStreetMap contributors, and Mapterhorn terrain MUST remain visible.

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
- **SC-008**: Full scene displays terrain, the 3D building layer, the solar trajectory, and all required attribution
- **SC-009**: Opening the main page without opening the modal causes zero Mapterhorn DEM and OpenFreeMap building-source requests

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
- Free map scene:
  - Mapterhorn source uses the expected TileJSON, Terrarium encoding, 512px tiles, and exaggeration 1
  - building layer uses height/base properties, zoom interpolation, and `hide_3d` filter
  - terrain elevation is included in the shared solar geometry origin
  - style reload does not duplicate sources or layers
  - performance mode degrades and recovers one level at a time with fresh threshold windows
  - 14 FPS does not degrade before 10 seconds; 15 FPS clears the low-FPS accumulator
  - idle 30+ FPS recovers one level after five seconds; low idle FPS, renewed interaction, and background tabs reset or pause recovery as specified
  - fallback `flat` and WebGL-loss `summary` modes never auto-recover
  - meters-per-pixel halves for each additional zoom level while the target pixel radius stays constant
  - East/North/Up use the same adaptive radius and preserve solar angles
  - normal/selected sun spheres retain their required pixel radii at zoom 15, 17, and 19
  - solar origin remains at terrain-relative `z = 11m` without querying building height
  - compass lines and labels remain at `z = 10m`, exactly 1m below the solar origin
  - anchor connects `z = 10m` to `z = 11m`, and shadow/location remain at `z = 0`

### E2E (Playwright)

1. Open modal and close via Esc; verify main map camera unchanged
2. Open modal with `selectedHour = null`; confirm path renders and no highlight
3. Open modal with visible `selectedHour`; confirm highlight visible
4. Hover a point; confirm tooltip contains hour/azimuth/altitude/state
5. Scenario where all hours are night; confirm empty-state message shown and no crash
6. Confirm terrain, the 3D building layer, solar canvas, and required attribution are present
7. Simulate terrain/vector source failures and verify retry then flat fallback
8. Dispatch WebGL context loss and verify the text summary
9. Confirm closing the modal removes the 3D canvas and that no 3D resource is requested before opening
10. Confirm initial and Reset camera return to zoom 15, pitch 58 degrees, and bearing 135 degrees
11. At every zoom from 15 through 20, confirm the measured solar bounds remain inside the viewport safe area
12. Confirm `data-solar-base-height="11.00"`, `data-compass-height-meters="10.00"`, and `data-solar-compass-gap-meters="1.00"`
13. Confirm all three diagnostic heights remain unchanged from zoom 15 through 20
14. Simulate 14 FPS interaction samples; confirm the scene stays `full-3d` for nine seconds and degrades only on the tenth second
15. Simulate idle 30+ FPS samples; confirm each recovery level requires a fresh five-second window
16. Confirm source fallback `flat`, WebGL-loss `summary`, renewed interaction, and hidden-tab samples cannot incorrectly recover the scene

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
- OpenFreeMap and Mapterhorn public services require no API key or paid account but provide no availability SLA
- Self-hosting remains an optional future availability strategy and is outside the zero-infrastructure-cost scope
