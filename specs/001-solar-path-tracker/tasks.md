# Tasks: Solar Path Tracker

**Input**: Design documents from `/specs/001-solar-path-tracker/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: Tests are included as E2E tests for P1/P2 acceptance scenarios per constitution requirements.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Initialize Next.js 15 project with TypeScript in repository root
- [x] T002 [P] Configure ESLint and Prettier with project rules in .eslintrc.json and .prettierrc
- [x] T003 [P] Configure Tailwind CSS in tailwind.config.ts
- [x] T004 [P] Add core dependencies: maplibre-gl, react-map-gl, suncalc, luxon, zustand, recharts, @tanstack/react-query
- [x] T005 [P] Create TypeScript type definitions in src/types/solar.ts per data-model.md
- [x] T006 [P] Setup Vitest for unit testing in vitest.config.ts
- [x] T007 [P] Setup Playwright for E2E testing in playwright.config.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Core Libraries

- [x] T008 Implement azimuth normalization function in src/lib/solar/normalize.ts (0°=North convention)
- [x] T009 [P] Write unit tests for azimuth normalization in tests/unit/solar/normalize.test.ts
- [x] T010 Implement hourly solar position computation in src/lib/solar/computation.ts using suncalc
- [x] T011 [P] Write unit tests for hourly computation in tests/unit/solar/computation.test.ts with reference values
- [x] T012 Implement sunrise/sunset/day length computation in src/lib/solar/events.ts
- [x] T013 [P] Write unit tests for sun events (including polar edge cases) in tests/unit/solar/events.test.ts
- [x] T014 Implement coordinate validation in src/lib/geo/validation.ts (lat -90..90, lng -180..180, 6 decimals)
- [x] T015 [P] Write unit tests for coordinate validation in tests/unit/geo/validation.test.ts
- [x] T016 Implement timezone helpers using Luxon in src/lib/utils/timezone.ts
- [x] T017 [P] Write unit tests for timezone helpers (including DST) in tests/unit/utils/timezone.test.ts

### State Management

- [x] T018 Create Zustand store with location, date, timezone, selectedHour state in src/store/solar-store.ts
- [x] T019 Create useSolarData hook for computed solar data in src/hooks/useSolarData.ts

### Application Shell

- [x] T020 Create root layout with providers (QueryClientProvider, etc.) in src/app/layout.tsx
- [x] T021 Create main page shell with dual-pane layout in src/app/page.tsx

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - View Solar Path for Current Location (Priority: P1) 🎯 MVP

**Goal**: Users can click "Use My GPS" to see 24 solar rays at their current location with today's date

**Independent Test**: Click "Use My GPS", grant permission, verify map shows 24 rays and data table displays 24 hours of azimuth/altitude

### API Routes for User Story 1

- [x] T022 Implement IP geolocation API route in src/app/api/ip-geo/route.ts per contracts/api.md
- [x] T023 [P] [US1] Create useIpGeo hook with fallback chain in src/hooks/useIpGeo.ts

### Map Components for User Story 1

- [x] T024 [US1] Implement ray geometry calculation (viewport intersection) in src/lib/geo/ray-geometry.ts
- [x] T025 [P] [US1] Write unit tests for ray geometry in tests/unit/geo/ray-geometry.test.ts
- [x] T026 [US1] Create MapPanel component with MapLibre in src/components/map/MapPanel.tsx (client-only)
- [x] T027 [US1] Create SolarRaysLayer component with GeoJSON rays in src/components/map/SolarRaysLayer.tsx
- [x] T028 [US1] Implement ray color-coding by daylight state (night/golden/day) in SolarRaysLayer.tsx

### Location Components for User Story 1

- [x] T029 [US1] Create LocationInput container component in src/components/location/LocationInput.tsx
- [x] T030 [US1] Implement "Use My GPS" button with browser geolocation in LocationInput.tsx
- [x] T031 [US1] Implement initial load location cascade (IP → GPS prompt → Taipei fallback) in useIpGeo.ts

### Data Display for User Story 1

- [x] T032 [US1] Create SolarDataTable component with 24 rows in src/components/data/SolarDataTable.tsx
- [x] T033 [US1] Create SunEventsPanel showing sunrise/sunset/day length in src/components/insights/SunEventsPanel.tsx
- [x] T034 [US1] Create DatePicker component defaulting to today in src/components/date/DatePicker.tsx

### E2E Test for User Story 1

- [x] T035 [US1] Write E2E test for GPS location flow in tests/e2e/p1-gps-location.spec.ts

**Checkpoint**: User Story 1 complete - users can view solar path for their GPS location

---

## Phase 4: User Story 2 - Search and Explore Any Location (Priority: P1) 🎯 MVP

**Goal**: Users can search for any location and see its solar path with OSM verification link

**Independent Test**: Type "Tokyo", select result, verify map centers on Tokyo and shows 24 rays

### API Routes for User Story 2

- [x] T036 [US2] Implement geocoding proxy API route in src/app/api/geocode/route.ts per contracts/api.md
- [x] T037 [US2] Add LRU cache and rate limiting to geocode route in src/app/api/geocode/route.ts
- [x] T038 [US2] Create useGeocode hook with debouncing in src/hooks/useGeocode.ts

### Search Components for User Story 2

- [x] T039 [US2] Create search input field with debounce (400ms) in src/components/location/LocationInput.tsx
- [x] T040 [US2] Create SearchResults dropdown component in src/components/location/SearchResults.tsx
- [x] T041 [US2] Display OSM verification link in search results per FR-004

### Map Integration for User Story 2

- [x] T042 [US2] Implement map recentering on location selection (fly to new location)
- [x] T043 [US2] Ensure map preserves center/zoom during data updates (FR-015)

### E2E Test for User Story 2

- [x] T044 [US2] Write E2E test for search location flow in tests/e2e/p1-search-location.spec.ts

**Checkpoint**: User Story 2 complete - users can search any location

---

## Phase 5: User Story 3 - Select Different Date (Priority: P1) 🎯 MVP

**Goal**: Users can select any date and see updated solar path for that date

**Independent Test**: Select winter solstice date for Stockholm, verify shorter day length and lower max altitude

### Date Components for User Story 3

- [x] T045 [US3] Enhance DatePicker to allow any Gregorian date selection in src/components/date/DatePicker.tsx
- [x] T046 [US3] Connect date selection to store and trigger solar recomputation
- [x] T047 [US3] Ensure map preserves center/zoom on date change (FR-015)

### E2E Test for User Story 3

- [x] T048 [US3] Write E2E test for date selection flow in tests/e2e/p1-date-selection.spec.ts

**Checkpoint**: User Story 3 complete - MVP fully functional (GPS/Search/Date)

---

## Phase 6: User Story 4 - Interactive Hour Selection (Priority: P2)

**Goal**: Users can click on map ray, table row, or chart to see detailed hour info synced across all views

**Independent Test**: Click ray for 14:00, verify table row 14:00 highlighted, metrics panel shows 14:00 data

### Synchronization Infrastructure

- [x] T049 [US4] Add selectedHour sync logic to Zustand store actions in src/store/solar-store.ts
- [x] T050 [US4] Implement ray click handler in SolarRaysLayer to set selectedHour
- [x] T051 [US4] Implement selected ray highlight styling (blue) in SolarRaysLayer.tsx

### Data Table Sync for User Story 4

- [x] T052 [US4] Add row click handler to SolarDataTable to set selectedHour
- [x] T053 [US4] Add row highlight styling for selected hour in SolarDataTable.tsx

### Metrics Panel for User Story 4

- [x] T054 [US4] Create MetricsPanel showing selected hour details in src/components/data/MetricsPanel.tsx
- [x] T055 [US4] Display time, azimuth, altitude, daylight state in MetricsPanel

### E2E Test for User Story 4

- [x] T056 [US4] Write E2E test for hour selection sync in tests/e2e/p2-hour-selection.spec.ts

**Checkpoint**: User Story 4 complete - interactive hour selection works across map and table

---

## Phase 7: User Story 5 - Visualize Daylight Periods (Priority: P2)

**Goal**: Users can visually distinguish night, golden hour, and daylight periods on the map

**Independent Test**: View map and verify rays are color-coded: dark for night, amber for golden, yellow for day

### Visualization Enhancements

- [x] T057 [US5] Refine ray color scheme in SolarRaysLayer (night: dark, golden: amber, day: yellow)
- [x] T058 [US5] Add daylight state indicator to MetricsPanel with clear labels
- [x] T059 [US5] Add legend component showing color meanings in src/components/map/MapLegend.tsx

**Checkpoint**: User Story 5 complete - daylight periods are visually clear

---

## Phase 8: User Story 6 - View Solar Charts (Priority: P2)

**Goal**: Users can see altitude and azimuth charts that sync with map/table selection

**Independent Test**: View charts, click on 12:00 in altitude chart, verify map ray 12:00 is highlighted

### Charts Implementation

- [x] T060 [P] [US6] Create AltitudeChart component (area chart) in src/components/charts/AltitudeChart.tsx
- [x] T061 [P] [US6] Create AzimuthChart component (line chart) in src/components/charts/AzimuthChart.tsx
- [x] T062 [US6] Create ChartsPanel container in src/components/charts/ChartsPanel.tsx
- [x] T063 [US6] Implement chart click handlers to set selectedHour
- [x] T064 [US6] Add selected hour marker/highlight on charts

**Checkpoint**: User Story 6 complete - charts render and sync with other views

---

## Phase 9: User Story 7 - Copy Solar Data (Priority: P3)

**Goal**: Users can copy individual field values (lat, lng, azimuth, altitude) to clipboard

**Independent Test**: Click copy button for azimuth value, paste in text editor, verify value copied

### Copy Functionality

- [x] T065 [P] [US7] Create clipboard utility in src/lib/utils/clipboard.ts
- [x] T066 [US7] Create CopyButton component with feedback toast in src/components/data/CopyButton.tsx
- [x] T067 [US7] Add per-field copy buttons to SolarDataTable (lat, lng, datetime, azimuth, altitude)
- [x] T068 [US7] Add copy buttons to MetricsPanel for selected hour values

**Checkpoint**: User Story 7 complete - users can copy individual values

---

## Phase 10: User Story 8 - Enter Manual Coordinates (Priority: P3)

**Goal**: Users can enter precise lat/lng coordinates manually as fallback or power-user feature

**Independent Test**: Enter lat 35.6762, lng 139.6503, submit, verify map shows Tokyo location

### Manual Input Components

- [x] T069 [US8] Create ManualCoordinates input component in src/components/location/ManualCoordinates.tsx
- [x] T070 [US8] Implement real-time validation with error messages for invalid coordinates
- [x] T071 [US8] Connect manual coordinate submission to location store and map recentering
- [x] T072 [US8] Ensure manual entry works when geocoding service is unavailable (FR-024)

**Checkpoint**: User Story 8 complete - manual coordinate entry fully functional

---

## Phase 11: User Story 9 - Receive Deterministic Solar Insights (Priority: P3)

**Goal**: Users see rule-based contextual insights about solar conditions

**Independent Test**: Select Stockholm in winter, verify insight about short daylight and low elevation appears

### Insights Implementation

- [x] T073 [US9] Implement deterministic insight rules in src/lib/solar/insights.ts per data-model.md
- [x] T074 [P] [US9] Write unit tests for insight rules in tests/unit/solar/insights.test.ts
- [x] T075 [US9] Create InsightsPanel component in src/components/insights/InsightsPanel.tsx
- [x] T076 [US9] Integrate InsightsPanel into main page layout

**Checkpoint**: User Story 9 complete - all user stories implemented

---

## Phase 12: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

### Timezone Advanced Feature

- [x] T077 [P] Create TimezoneSelector component with IANA dropdown in src/components/date/TimezoneSelector.tsx
- [x] T078 Integrate TimezoneSelector as advanced option in UI

### Accessibility & UX

- [x] T079 [P] Add ARIA labels and keyboard navigation to all interactive elements
- [x] T080 [P] Ensure color contrast meets WCAG 2.1 AA standards
- [x] T081 Add responsive styling for mobile viewport in Tailwind classes

### Error Handling & Loading States

- [x] T082 [P] Add loading skeletons for geocoding and initial load states
- [x] T083 [P] Add user-friendly error messages for all failure scenarios

### Documentation & Validation

- [x] T084 [P] Update README.md with setup and usage instructions
- [x] T085 Run quickstart.md validation checklist
- [x] T086 Verify all success criteria (SC-001 through SC-008) pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-11)**: All depend on Foundational phase completion
  - P1 stories (US1-US3) should complete before P2 stories
  - P2 stories (US4-US6) should complete before P3 stories
  - P3 stories (US7-US9) are optional for MVP
- **Polish (Phase 12)**: Depends on at least P1 user stories being complete

### User Story Dependencies

| Story | Depends On | Can Parallelize With |
|-------|------------|---------------------|
| US1 (GPS Location) | Foundational | - |
| US2 (Search Location) | Foundational | US1 (different files) |
| US3 (Date Selection) | Foundational | US1, US2 (different files) |
| US4 (Hour Selection) | US1 (map exists) | US2, US3 |
| US5 (Daylight Viz) | US1 (rays exist) | US4 |
| US6 (Charts) | Foundational | US1-US5 |
| US7 (Copy) | US1 (data table exists) | US4-US6 |
| US8 (Manual Coords) | Foundational | US1-US7 |
| US9 (Insights) | Foundational | US1-US8 |

### Parallel Opportunities

**Phase 1 (all [P] tasks can run simultaneously)**:
- T002, T003, T004, T005, T006, T007

**Phase 2 (after dependencies met)**:
- T009 (after T008)
- T011 (after T010)
- T013 (after T012)
- T015 (after T014)
- T017 (after T016)

**Within User Stories**:
- Tests and unit tests marked [P] can run in parallel
- Components operating on different files can parallelize

---

## Implementation Strategy

### MVP First (P1 Stories Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (GPS Location)
4. Complete Phase 4: User Story 2 (Search Location)
5. Complete Phase 5: User Story 3 (Date Selection)
6. **STOP and VALIDATE**: Test all P1 scenarios
7. Deploy MVP if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 (GPS) → Deploy MVP v0.1
3. Add US2 (Search) → Deploy MVP v0.2
4. Add US3 (Date) → Deploy MVP v1.0 (full P1)
5. Add US4-US6 (P2) → Deploy v1.1
6. Add US7-US9 (P3) → Deploy v1.2
7. Polish → Deploy v1.3

---

## Summary

| Phase | Tasks | Story Coverage |
|-------|-------|----------------|
| Phase 1: Setup | T001-T007 (7 tasks) | Infrastructure |
| Phase 2: Foundational | T008-T021 (14 tasks) | Core libraries |
| Phase 3: US1 GPS Location | T022-T035 (14 tasks) | P1 MVP |
| Phase 4: US2 Search Location | T036-T044 (9 tasks) | P1 MVP |
| Phase 5: US3 Date Selection | T045-T048 (4 tasks) | P1 MVP |
| Phase 6: US4 Hour Selection | T049-T056 (8 tasks) | P2 |
| Phase 7: US5 Daylight Viz | T057-T059 (3 tasks) | P2 |
| Phase 8: US6 Charts | T060-T064 (5 tasks) | P2 |
| Phase 9: US7 Copy Data | T065-T068 (4 tasks) | P3 |
| Phase 10: US8 Manual Coords | T069-T072 (4 tasks) | P3 |
| Phase 11: US9 Insights | T073-T076 (4 tasks) | P3 |
| Phase 12: Polish | T077-T086 (10 tasks) | Cross-cutting |

**Total**: 86 tasks

**MVP (P1 only)**: 48 tasks (Phases 1-5)

**Independent Test Criteria per Story**: Each user story phase includes its own checkpoint for independent validation.
