# Implementation Plan: 3D Solar Path View (Modal)

**Branch**: `002-3d-solar-path-view` | **Date**: 2025-12-29 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-3d-solar-path-view/spec.md`

## Summary

Add a **"3D View"** button on the main map panel that opens a near-fullscreen modal displaying OpenFreeMap vector cartography, Mapterhorn terrain, OpenStreetMap building extrusions, and the sun trajectory for 24 hourly points positioned by azimuth + altitude. The modal supports optional `selectedHour` highlighting, hover tooltips, progressive performance degradation, and preserves main map camera state on close. Implementation uses **deck.gl** overlays on **MapLibre GL JS** for GPU-accelerated 3D rendering, with **Radix UI Dialog** for accessible modal behavior.

## Technical Context

**Language/Version**: TypeScript 5.x, React 19.2, Next.js 16.1 (App Router)
**Primary Dependencies**: 
- Existing: `maplibre-gl@5.15.0`, `react-map-gl@8.1.0`, `zustand@5.0.9`, `recharts@3.6.0`
- New: `@deck.gl/core`, `@deck.gl/layers`, `@deck.gl/mapbox` (MapboxOverlay), `@radix-ui/react-dialog`
**Storage**: N/A (reads from Zustand store)
**Testing**: Vitest (unit), Playwright (E2E)
**Target Platform**: Web (modern browsers with WebGL support)
**Project Type**: Web application (Next.js App Router)
**Performance Goals**: 30-60 FPS during map interactions, <2s modal open time
**Constraints**: No paid APIs or API keys; public tile services have no SLA; progressive `full-3d` → `terrain-only` → `flat` → `summary` degradation
**Scale/Scope**: Single modal feature, 24 data points max

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| **I. Code Quality** | ✅ PASS | Single-responsibility components, TypeScript strict mode, follows existing patterns |
| **II. Testing Standards** | ✅ PASS | Unit tests for geometry mapping, E2E tests for modal behavior defined in spec |
| **III. User Experience Consistency** | ✅ PASS | Uses existing design system, WCAG 2.1 AA compliance via Radix UI + text summary |
| **IV. Performance Requirements** | ✅ PASS | 30-60 FPS target, mobile pixel-ratio/detail limits, and progressive degradation (NFR3D-005/006) |

**Quality Gates Compliance**:
- Lint: Will follow existing ESLint config
- Build: Client-only components via `dynamic({ ssr: false })`
- Unit Tests: Coverage for geometry utilities, visibility filtering, selectedHour rules
- E2E Tests: Modal open/close, tooltip, highlight, camera preservation
- Code Review: Required before merge
- Performance: Runtime interaction FPS monitoring and automatic scene degradation

## Project Structure

### Documentation (this feature)

```text
specs/002-3d-solar-path-view/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── api.md           # Component interfaces
└── tasks.md             # Phase 2 output (NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── map/
│   │   └── MapPanel.tsx           # MODIFY: Add 3D View button
│   └── solar3d/                   # NEW: 3D view components
│       ├── index.ts               # Barrel export
│       ├── Solar3DViewModal.tsx   # Radix Dialog wrapper
│       ├── Solar3DMapCanvas.tsx   # MapLibre + deck.gl canvas (client-only)
│       ├── Solar3DTooltip.tsx     # Hover tooltip component
│       ├── Solar3DLegend.tsx      # Daylight state legend
│       └── Solar3DAccessibleSummary.tsx  # Screen reader summary
├── lib/
│   └── solar3d/                   # NEW: 3D utilities
│       ├── index.ts               # Barrel export
│       ├── geometry.ts            # Azimuth/altitude to 3D mapping
│       ├── constants.ts           # PATH_RADIUS, HEIGHT_SCALE, colors
│       └── visibility.ts          # Filter visible hours, build path
├── types/
│   └── solar3d.ts                 # NEW: 3D-specific types
└── hooks/
    └── useSolar3DData.ts          # NEW: Derive 3D data from store

tests/
├── unit/
│   └── solar3d/                   # NEW: Unit tests
│       ├── geometry.test.ts       # Mapping function tests
│       └── visibility.test.ts     # Visibility filtering tests
└── e2e/
    └── p1-3d-view.spec.ts         # NEW: E2E tests for 3D modal
```

**Structure Decision**: Follows existing single-project Next.js structure with `src/` for source code. New 3D-related code is isolated in `solar3d/` subdirectories to maintain separation of concerns.

## Complexity Tracking

No Constitution violations requiring justification.

---

## Architecture Overview

### Component Hierarchy

```text
MapPanel (existing)
└── [3D View Button] ─────────────────────────────────────────┐
                                                              │
Solar3DViewModal (Radix Dialog)                               │
├── Header                                                    │
│   ├── Title: "3D Solar Path"                                │
│   ├── Subtitle: location | date | timezone                  │
│   ├── Reset View button                                     │
│   └── Close button                                          │
├── Body                                                      │
│   ├── Solar3DMapCanvas (client-only, dynamic import)        │
│   │   ├── MapLibre GL (3D pitched camera)                   │
│   │   └── deck.gl MapboxOverlay                             │
│   │       ├── ScatterplotLayer (hour points)                │
│   │       └── PathLayer (polyline)                          │
│   ├── Solar3DTooltip (hover state)                          │
│   └── Solar3DLegend                                         │
└── Solar3DAccessibleSummary (sr-only, text list)             │
```

### Data Flow

```text
User clicks "3D View"
        │
        ▼
Modal opens → Captures snapshot from Zustand store:
        │     - location
        │     - dateISO
        │     - timezone
        │     - hourly[0..23]
        │     - selectedHour (optional)
        │
        ▼
useSolar3DData hook transforms:
        │  1. Filter: altitudeDeg >= 0 → visibleHours
        │  2. Map: Each hour → [east, north, up] via geometry.ts
        │  3. Build: Polyline path from visible points
        │  4. Derive: isSelectedVisible boolean
        │
        ▼
deck.gl layers render:
        │  - SimpleMeshLayer (zoom-responsive sun spheres)
        │  - PathLayer (zoom-responsive visible-point polyline)
        │  - LineLayer (elevated connectors/compass + terrain anchor)
        │
        ▼
Interactions:
        - Hover → Solar3DTooltip shows hour/azimuth/altitude/state
        - Camera drag/scroll → native MapLibre interactions
        - Reset View → map.easeTo(defaultCamera)
        - Close/Esc → Modal closes, main map unchanged
```

### Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| 3D Overlay Engine | deck.gl | GPU-accelerated, built-in picking, lower complexity than raw WebGL |
| Modal Library | Radix UI Dialog | Focus trap, Esc close, ARIA labels out-of-box |
| Coordinate System | METER_OFFSETS | deck.gl local offsets from location origin |
| SSR Strategy | `dynamic({ ssr: false })` | MapLibre/deck.gl require browser APIs |
| Data Binding | Static snapshot | Simpler than live sync, matches "read-only" principle |
| Tile Source | Fastest available | Per clarification: prioritize latency over style match |
| Default Camera | zoom 17, pitch 58°, bearing 135° | Keeps the full building extrusion visible without fitting the old 1200m arc |
| Visual Scale | Screen-space target converted with meters-per-pixel | Preserves readable path/sun size across zoom 15–20 |
| Building Clearance | Highest rendered building + 15m, minimum 30m | Keeps the visual celestial sphere above nearby extrusions |

---

## Geometry Specification (Deterministic)

### Coordinate System (ENU-like)

For deck.gl `METER_OFFSETS`:
- X = East (+)
- Y = North (+) 
- Z = Up (+)

### Mapping Function

```
Input:
  azimuthDeg: 0-360° (0° = North, 90° = East)
  altitudeDeg: ≥0° (visible hours only)
  mpp: 156543.03392 × cos(latitude) ÷ 2^zoom
  Rpx: clamp(shortViewportSide × 0.26, deviceMin, deviceMax)
  R: Rpx × mpp
  B: max(30, highestRenderedBuilding + 15)

Conversion:
  a = degToRad(azimuthDeg)
  h = degToRad(altitudeDeg)
  
Output (position):
  east  = R × cos(h) × sin(a)
  north = R × cos(h) × cos(a)
  up    = B + R × sin(h)

deck.gl position: [east, north, up]
```

`Rpx` is clamped to 120–200px on desktop and 90–130px on mobile. Normal and
selected sun spheres target 8px/11px on desktop and 7px/10px on mobile; their
meter scale is recalculated from the same `mpp`. Zoom updates are
requestAnimationFrame-throttled. Pan, pitch, and bearing do not rebuild geometry.

The location marker and shadow remain at terrain-relative `z = 0`. Connector and
compass origins use `[0, 0, B]`, and a subtle vertical anchor connects those
reference planes. Camera focus elevation is
`terrainElevation + B + R × 0.35`.

### Direction Verification (Unit Test Cases)

| Azimuth | Expected Direction |
|---------|-------------------|
| 0° (North) | north > 0, east ≈ 0 |
| 90° (East) | east > 0, north ≈ 0 |
| 180° (South) | north < 0, east ≈ 0 |
| 270° (West) | east < 0, north ≈ 0 |

---

## Dependencies to Add

```json
{
  "dependencies": {
    "@deck.gl/core": "^9.0.0",
    "@deck.gl/layers": "^9.0.0",
    "@deck.gl/mapbox": "^9.0.0",
    "@radix-ui/react-dialog": "^1.0.0"
  }
}
```

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| WebGL unsupported or context lost | NFR3D-005: Accessible text summary |
| FPS drops on desktop/mobile | Hide buildings after 3s below 30 FPS, then disable terrain after another 3s |
| Public style/source unavailable | Retry once, then use the existing lightweight flat map |
| Excessive mobile GPU fill rate | Cap device pixel ratio at 1 and reduce sphere subdivision |
| Public services have no SLA | Preserve fallback map; self-hosting remains a future option |
| deck.gl/MapLibre version conflict | Pin compatible versions per deck.gl docs |
| Memory leaks | Cleanup map.remove() and overlay on unmount |
| Bundle size increase | Dynamic import for modal keeps initial load fast |
| Zoom causes geometry churn | Sample zoom through one requestAnimationFrame callback and ignore pan/pitch/bearing |
| Nearby tall buildings obscure the arc | Query the rendered solar footprint and raise the shared solar origin dynamically |

---

## Success Metrics (from Spec)

- SC-001: Open time < 2 seconds
- SC-002: Responsive layout (90-95% desktop, 100% mobile)
- SC-003: 100% visible points rendered correctly
- SC-004: Tooltip display < 200ms
- SC-005: Main map camera unchanged after close
- SC-006: Empty state for polar night scenarios
- SC-007: Maintain 30+ FPS during interactions
- SC-008: Terrain, buildings, solar path, and required attribution are present in full mode
- SC-009: No terrain/building requests before the modal opens
