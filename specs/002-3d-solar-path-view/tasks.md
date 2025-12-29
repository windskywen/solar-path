# Tasks: 3D Solar Path View

**Input**: Design documents from `/specs/002-3d-solar-path-view/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/api.md ✅, quickstart.md ✅

**Tests**: Included per spec.md Testing Plan requirements (unit tests for geometry/visibility, E2E for modal behavior).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1-US5)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies and create base structure

- [x] T001 Install deck.gl and Radix dependencies via `npm install @deck.gl/core@^9.0.0 @deck.gl/layers@^9.0.0 @deck.gl/mapbox@^9.0.0 @radix-ui/react-dialog@^1.0.0`
- [x] T002 [P] Create type definitions in src/types/solar3d.ts (Solar3DSnapshot, Solar3DPoint, Solar3DPath, Solar3DViewData, Solar3DTooltipData)
- [x] T003 [P] Create barrel export in src/lib/solar3d/index.ts
- [x] T004 [P] Create barrel export in src/components/solar3d/index.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core utilities that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 [P] Implement geometry utilities in src/lib/solar3d/geometry.ts (SOLAR_3D_CONSTANTS, degToRad, computePosition)
- [x] T006 [P] Implement visibility utilities in src/lib/solar3d/visibility.ts (filterVisibleHours, buildSolar3DPoints, buildSolar3DPath, isSelectedHourVisible)
- [x] T007 [P] Create unit tests for geometry in tests/unit/solar3d/geometry.test.ts
- [x] T008 [P] Create unit tests for visibility in tests/unit/solar3d/visibility.test.ts
- [x] T009 Run tests and verify all pass: `npm run test -- tests/unit/solar3d/`

**Checkpoint**: Foundation ready - geometry utilities tested and working

---

## Phase 3: User Story 1 — Open/Close 3D View (Priority: P1) 🎯 MVP

**Goal**: User can open a 3D view modal from the map and close it via Esc/close button

**Independent Test**: Click "3D View" button → modal opens with 3D content → press Esc → modal closes, main map unchanged

### Implementation for User Story 1

- [x] T010 [US1] Create Solar3DViewModal component in src/components/solar3d/Solar3DViewModal.tsx (Radix Dialog wrapper, snapshot capture on open)
- [x] T011 [US1] Create placeholder Solar3DMapCanvas in src/components/solar3d/Solar3DMapCanvas.tsx (client-only dynamic import, basic MapLibre setup)
- [x] T012 [US1] Add "3D View" button to src/components/map/MapPanel.tsx with disabled state when data not ready
- [x] T013 [US1] Add is3DViewOpen state and Solar3DViewModal integration to src/components/map/MapPanel.tsx
- [x] T014 [US1] Create E2E test for open/close in tests/e2e/p1-3d-view.spec.ts (modal opens, Esc closes, main map unchanged)
- [x] T015 [US1] Run E2E test and verify: `npm run test:e2e -- tests/e2e/p1-3d-view.spec.ts`

**Checkpoint**: User Story 1 complete — modal opens/closes correctly, button disabled when no data

---

## Phase 4: User Story 2 — Show 3D Trajectory without Selected Hour (Priority: P1)

**Goal**: 3D view renders complete sun path with all visible points even when no hour is selected

**Independent Test**: Set selectedHour to null → open modal → verify path renders with all visible points, no highlight

### Implementation for User Story 2

- [x] T016 [US2] Implement full Solar3DMapCanvas with deck.gl layers (ScatterplotLayer, PathLayer) in src/components/solar3d/Solar3DMapCanvas.tsx
- [x] T017 [US2] Configure METER_OFFSETS coordinate system and coordinateOrigin for location-based positioning
- [x] T018 [US2] Handle empty state (no visible hours) with message "Sun does not rise on this date at this location" in src/components/solar3d/Solar3DMapCanvas.tsx
- [x] T019 [US2] Add E2E test scenario for no-selection case in tests/e2e/p1-3d-view.spec.ts
- [x] T020 [US2] Run E2E test and verify path renders without highlight: `npm run test:e2e -- tests/e2e/p1-3d-view.spec.ts`

**Checkpoint**: User Story 2 complete — trajectory renders correctly regardless of selection state

---

## Phase 5: User Story 3 — Highlight Selected Hour When Available (Priority: P1)

**Goal**: When selectedHour exists and is visible, that point is highlighted with distinct styling

**Independent Test**: Select an hour → open modal → verify that hour's point has different color/size

### Implementation for User Story 3

- [x] T021 [US3] Add conditional styling for selected hour in ScatterplotLayer (distinct color/size) in src/components/solar3d/Solar3DMapCanvas.tsx
- [x] T022 [US3] Verify isSelectedVisible derivation works for night hours (no highlight, no error)
- [x] T023 [US3] Add E2E test scenario for visible selected hour highlight in tests/e2e/p1-3d-view.spec.ts
- [x] T024 [US3] Add E2E test scenario for night selected hour (no crash) in tests/e2e/p1-3d-view.spec.ts
- [x] T025 [US3] Run E2E tests and verify highlight behavior: `npm run test:e2e -- tests/e2e/p1-3d-view.spec.ts`

**Checkpoint**: User Story 3 complete — selected hour highlighting works correctly

---

## Phase 6: User Story 4 — Tooltip on Hover (Priority: P1)

**Goal**: Hovering a point shows tooltip with hour/azimuth/altitude/daylight state

**Independent Test**: Open modal → hover over any point → tooltip appears with correct data

### Implementation for User Story 4

- [x] T026 [US4] Create Solar3DTooltip component in src/components/solar3d/Solar3DTooltip.tsx
- [x] T027 [US4] Add pickable: true and onHover callback to ScatterplotLayer in src/components/solar3d/Solar3DMapCanvas.tsx
- [x] T028 [US4] Manage tooltip state and positioning in Solar3DMapCanvas or Solar3DViewModal
- [x] T029 [US4] Add E2E test for tooltip display in tests/e2e/p1-3d-view.spec.ts (hover shows hour/azimuth/altitude/state)
- [x] T030 [US4] Run E2E test and verify tooltip behavior: `npm run test:e2e -- tests/e2e/p1-3d-view.spec.ts`

**Checkpoint**: User Story 4 complete — all P1 stories done, core feature functional

---

## Phase 7: User Story 5 — Basic Camera Controls (Priority: P2)

**Goal**: User can pan/zoom/pitch the 3D map and reset to default view

**Independent Test**: Open modal → drag/scroll to change view → click Reset View → camera returns to default

### Implementation for User Story 5

- [x] T031 [US5] Verify native MapLibre pan/zoom/pitch interactions work in src/components/solar3d/Solar3DMapCanvas.tsx
- [x] T032 [US5] Implement Reset View button functionality with map.easeTo(defaultCamera) in src/components/solar3d/Solar3DViewModal.tsx
- [x] T033 [US5] Store default camera state and expose reset handler
- [x] T034 [US5] Add E2E test for camera reset in tests/e2e/p1-3d-view.spec.ts
- [x] T035 [US5] Run E2E test and verify camera controls: `npm run test:e2e -- tests/e2e/p1-3d-view.spec.ts`

**Checkpoint**: User Story 5 complete — P2 camera controls working

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Accessibility, performance, and code quality

- [x] T036 [P] Create Solar3DLegend component in src/components/solar3d/Solar3DLegend.tsx (daylight state colors)
- [x] T037 [P] Create Solar3DAccessibleSummary component in src/components/solar3d/Solar3DAccessibleSummary.tsx (screen reader text list)
- [x] T038 Add legend and accessible summary to Solar3DViewModal in src/components/solar3d/Solar3DViewModal.tsx
- [x] T039 [P] Add WebGL detection and graceful degradation fallback per NFR3D-005 in src/components/solar3d/Solar3DMapCanvas.tsx
- [x] T040 [P] Add loading state to prevent layout jump during initialization
- [x] T041 Run full test suite: `npm run test && npm run test:e2e`
- [x] T042 Run typecheck and lint: `npm run typecheck && npm run lint`
- [x] T043 Run quickstart.md verification checklist

**Checkpoint**: Phase 8 complete — Feature implementation finished

---

## Dependencies & Execution Order

### Phase Dependencies

```text
Phase 1: Setup ────────────────────────────► No dependencies
    │
    ▼
Phase 2: Foundational ─────────────────────► Depends on Phase 1 - BLOCKS all user stories
    │
    ├──────────┬──────────┬──────────┬──────────┐
    ▼          ▼          ▼          ▼          ▼
Phase 3     Phase 4     Phase 5     Phase 6   Phase 7
(US1)       (US2)       (US3)       (US4)     (US5-P2)
    │          │          │          │          │
    └──────────┴──────────┴──────────┴──────────┘
                          │
                          ▼
                      Phase 8: Polish
```

### User Story Dependencies

| Story | Priority | Can Start After | Depends On Other Stories |
|-------|----------|-----------------|--------------------------|
| US1 - Open/Close | P1 | Phase 2 | None |
| US2 - Trajectory | P1 | Phase 2 | None (uses same components as US1) |
| US3 - Highlight | P1 | Phase 2 | None |
| US4 - Tooltip | P1 | Phase 2 | None |
| US5 - Camera | P2 | Phase 2 | None |

**Note**: US1-US4 are all P1 and build on the same components. In practice, implement sequentially as T010-T030 since they modify shared files (Solar3DMapCanvas.tsx).

### Parallel Opportunities

**Phase 1 (Setup)**:
- T002, T003, T004 can run in parallel (different files)

**Phase 2 (Foundational)**:
- T007, T008 can run in parallel (different test files)

**Phase 8 (Polish)**:
- T036, T037, T039, T040 can run in parallel (different files)

---

## Parallel Example: Phase 2

```bash
# Launch in parallel:
Task T007: "Create unit tests for geometry in tests/unit/solar3d/geometry.test.ts"
Task T008: "Create unit tests for visibility in tests/unit/solar3d/visibility.test.ts"

# Then sequentially:
Task T009: "Run tests and verify all pass"
```

---

## Implementation Strategy

### MVP First (User Stories 1-4)

1. Complete Phase 1: Setup (T001-T004)
2. Complete Phase 2: Foundational (T005-T009)
3. Complete Phase 3: US1 Open/Close (T010-T015)
4. Complete Phase 4: US2 Trajectory (T016-T020)
5. Complete Phase 5: US3 Highlight (T021-T025)
6. Complete Phase 6: US4 Tooltip (T026-T030)
7. **STOP and VALIDATE**: All P1 stories complete, core feature functional
8. Deploy/demo MVP

### Incremental Delivery

| Increment | Stories | Value Delivered |
|-----------|---------|-----------------|
| MVP | US1-US4 | Full 3D visualization with tooltip |
| v1.1 | + US5 | Camera controls and Reset View |
| v1.2 | + Polish | Accessibility, fallback, legend |

### Single Developer Timeline

| Day | Tasks | Milestone |
|-----|-------|-----------|
| Day 1 | T001-T009 | Setup + Foundation complete |
| Day 2 | T010-T020 | US1 + US2 complete (modal + trajectory) |
| Day 3 | T021-T035 | US3 + US4 + US5 complete (highlight, tooltip, camera) |
| Day 4 | T036-T043 | Polish phase complete |

---

## Success Metrics

- **Total Tasks**: 43
- **Setup Tasks**: 4
- **Foundational Tasks**: 5
- **User Story Tasks**: 26 (US1: 6, US2: 5, US3: 5, US4: 5, US5: 5)
- **Polish Tasks**: 8
- **Parallel Opportunities**: 9 tasks marked [P]
- **MVP Scope**: T001-T030 (Phases 1-6)
- **E2E Test Coverage**: 5 scenarios (open/close, no-selection, highlight, night-hour, tooltip)

---

## Notes

- All components under `src/components/solar3d/` are new
- All utilities under `src/lib/solar3d/` are new
- Only modification to existing code: `src/components/map/MapPanel.tsx` (add button + modal)
- deck.gl MapboxOverlay requires MapLibre GL JS map instance
- Client-only rendering via `dynamic({ ssr: false })`
- Static snapshot design means no reactive updates during modal session
