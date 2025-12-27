# Implementation Plan: Solar Path Tracker

**Branch**: `001-solar-path-tracker` | **Date**: 2025-12-28 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-solar-path-tracker/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build a high-precision solar visualization tool using Next.js 15 (App Router) that displays the Sun's hourly position (azimuth/altitude) for any coordinate and date. Uses deterministic client-side solar computation (suncalc), MapLibre GL JS for interactive ray visualization extending to viewport edges, and free geocoding via Nominatim proxy with caching/debouncing.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 20+  
**Primary Dependencies**: Next.js 15 (App Router), React 19, MapLibre GL JS, suncalc, Luxon, Zustand, Recharts, TanStack Query  
**Storage**: N/A (client-side computation, server-side LRU cache for geocoding)  
**Testing**: Vitest (unit), Playwright (E2E)  
**Target Platform**: Modern browsers (Chrome, Firefox, Safari, Edge), desktop-first responsive
**Project Type**: web (single Next.js application)  
**Performance Goals**: <100ms hour selection response, <2s geocoding results (SC-002, SC-005)  
**Constraints**: No paid APIs, deterministic solar computation, free geocoding with rate limiting  
**Scale/Scope**: Single-page application, 24-hour solar data computation per request

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. Code Quality | ✅ PASS | TypeScript enforces types; ESLint/Prettier for consistency; single-responsibility components defined |
| II. Testing Standards | ✅ PASS | Unit tests for solar computation (100% coverage planned), E2E for P1 acceptance scenarios |
| III. UX Consistency | ✅ PASS | Design system via Tailwind; desktop-first responsive; WCAG 2.1 AA target; user-friendly error messages |
| IV. Performance Requirements | ✅ PASS | Client-side computation (<100ms); debounced search; LRU caching; no blocking operations |
| Quality Gates | ✅ PASS | CI pipeline with lint, build, test gates; Playwright E2E; code review required |

**Gate Status**: PASS - No violations. Proceed to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/001-solar-path-tracker/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── layout.tsx           # Root layout with providers
│   ├── page.tsx             # Main solar tracker page
│   └── api/
│       ├── geocode/
│       │   └── route.ts     # Nominatim proxy with caching
│       └── ip-geo/
│           └── route.ts     # IP geolocation endpoint
├── components/
│   ├── location/
│   │   ├── LocationInput.tsx
│   │   ├── SearchResults.tsx
│   │   └── ManualCoordinates.tsx
│   ├── date/
│   │   ├── DatePicker.tsx
│   │   └── TimezoneSelector.tsx
│   ├── map/
│   │   ├── MapPanel.tsx
│   │   └── SolarRaysLayer.tsx
│   ├── data/
│   │   ├── SolarDataTable.tsx
│   │   ├── MetricsPanel.tsx
│   │   └── CopyButton.tsx
│   ├── charts/
│   │   ├── ChartsPanel.tsx
│   │   ├── AltitudeChart.tsx
│   │   └── AzimuthChart.tsx
│   └── insights/
│       ├── SunEventsPanel.tsx
│       └── InsightsPanel.tsx
├── lib/
│   ├── solar/
│   │   ├── computation.ts   # Hourly position calculation
│   │   ├── events.ts        # Sunrise/sunset/day length
│   │   ├── insights.ts      # Deterministic rule engine
│   │   └── normalize.ts     # Azimuth normalization
│   ├── geo/
│   │   ├── ray-geometry.ts  # Viewport intersection algorithm
│   │   └── validation.ts    # Coordinate validation
│   └── utils/
│       ├── timezone.ts      # Luxon timezone helpers
│       └── clipboard.ts     # Copy utilities
├── store/
│   └── solar-store.ts       # Zustand global state
├── hooks/
│   ├── useGeocode.ts        # TanStack Query hook
│   ├── useIpGeo.ts          # Initial location hook
│   └── useSolarData.ts      # Computed solar data hook
└── types/
    └── solar.ts             # TypeScript type definitions

tests/
├── unit/
│   ├── solar/
│   │   ├── computation.test.ts
│   │   ├── events.test.ts
│   │   ├── insights.test.ts
│   │   └── normalize.test.ts
│   └── geo/
│       ├── ray-geometry.test.ts
│       └── validation.test.ts
└── e2e/
    ├── p1-gps-location.spec.ts
    ├── p1-search-location.spec.ts
    ├── p1-date-selection.spec.ts
    └── p2-hour-selection.spec.ts
```

**Structure Decision**: Single Next.js web application with App Router. All solar computation is client-side in `lib/solar/`. API routes handle external service proxying only. State managed via Zustand with TanStack Query for async data fetching.

## Complexity Tracking

> No Constitution violations requiring justification.

---

## Post-Design Constitution Re-Check

*Re-evaluated after Phase 1 design completion.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. Code Quality | ✅ PASS | Clear module boundaries in `lib/`; single-responsibility components; TypeScript types defined in `data-model.md` |
| II. Testing Standards | ✅ PASS | 100% unit test coverage for `lib/solar/` and `lib/geo/`; E2E tests for all P1/P2 acceptance scenarios |
| III. UX Consistency | ✅ PASS | Component hierarchy supports consistent styling; error handling defined in API contracts; accessibility requirements documented |
| IV. Performance Requirements | ✅ PASS | Client-side solar computation eliminates latency; API caching (24h) reduces upstream calls; debouncing (400ms) prevents rate limiting |
| Quality Gates | ✅ PASS | CI pipeline enforces lint/build/test; code review required; E2E prevents regressions |

**Post-Design Gate Status**: PASS - Design is Constitution-compliant. Ready for `/speckit.tasks`.

---

## Phase Outputs Summary

| Phase | Output | Status |
|-------|--------|--------|
| Phase 0 | [research.md](research.md) | ✅ Complete |
| Phase 1 | [data-model.md](data-model.md) | ✅ Complete |
| Phase 1 | [contracts/api.md](contracts/api.md) | ✅ Complete |
| Phase 1 | [quickstart.md](quickstart.md) | ✅ Complete |
| Phase 2 | tasks.md | ⏳ Pending (`/speckit.tasks` command) |

---

## Next Steps

Run `/speckit.tasks` to generate implementation tasks from this plan.
