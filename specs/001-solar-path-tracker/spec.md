# Feature Specification: Solar Path Tracker

**Feature Branch**: `001-solar-path-tracker`  
**Created**: December 28, 2025  
**Status**: Draft  
**Input**: User description: "Solar Path Tracker - A high-precision solar visualization tool that helps users understand the Sun's movement for any coordinate on Earth and any date"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Solar Path for Current Location (Priority: P1)

As a user, I want to quickly see the sun's path at my current location for today so I can understand when and where the sun will be throughout the day.

**Why this priority**: This is the core value proposition - users need to see solar data immediately with minimal setup. Without this, the product has no utility.

**Independent Test**: Can be fully tested by clicking "Use My GPS", viewing the map with solar rays, and verifying altitude/azimuth data displays correctly for 24 hours.

**Acceptance Scenarios**:

1. **Given** I am on the application homepage, **When** I click "Use My GPS" and grant location permission, **Then** the map centers on my coordinates and displays 24 radial rays representing hourly sun positions.
2. **Given** my location is displayed on the map, **When** I view the solar data table, **Then** I see azimuth (0-360°) and altitude values for each hour from 00:00 to 23:00.
3. **Given** I have granted location permission, **When** the map loads, **Then** I see today's date pre-selected and sunrise/sunset times displayed.

---

### User Story 2 - Search and Explore Any Location (Priority: P1)

As a user, I want to search for any location by name (city, landmark, address) so I can explore the sun's path for places I plan to visit or work at.

**Why this priority**: Location flexibility is essential - users often need solar data for locations other than their current position.

**Independent Test**: Can be fully tested by typing a location name, selecting from search results, and verifying the map updates to show that location's solar path.

**Acceptance Scenarios**:

1. **Given** I am on the application, **When** I type "Tokyo" in the search field and wait briefly, **Then** I see a list of matching locations with display names and coordinates.
2. **Given** search results are displayed, **When** I click on a result, **Then** the map centers on that location and solar rays update accordingly.
3. **Given** search results are displayed, **When** I view a result, **Then** I see a verification link to OpenStreetMap to confirm the location.
4. **Given** the geocoding service is unavailable, **When** I attempt to search, **Then** I can still manually enter latitude/longitude coordinates.

---

### User Story 3 - Select Different Date (Priority: P1)

As a user, I want to select any date so I can see the sun's path for past or future dates relevant to my planning needs.

**Why this priority**: Date flexibility is core functionality - architects need to plan for different seasons, photographers need to plan shoots ahead.

**Independent Test**: Can be fully tested by selecting a different date and verifying the solar calculations update for that date.

**Acceptance Scenarios**:

1. **Given** I have a location displayed, **When** I select a different date using the date picker, **Then** the solar rays, altitude/azimuth values, and sunrise/sunset times update for the selected date.
2. **Given** I am viewing solar data, **When** I select a winter solstice date for a high-latitude location, **Then** I see shorter day length and lower maximum altitude values.
3. **Given** I am viewing solar data, **When** I select a summer date near the equator, **Then** I see high peak altitude values.

---

### User Story 4 - Interactive Hour Selection (Priority: P2)

As a user, I want to click on an hour (on the map ray, table row, or chart) to see detailed information about the sun position at that specific time.

**Why this priority**: Detailed exploration enhances user understanding but requires basic solar visualization to be working first.

**Independent Test**: Can be fully tested by clicking a ray on the map and verifying the selection syncs across all UI elements.

**Acceptance Scenarios**:

1. **Given** solar rays are displayed on the map, **When** I click on a ray, **Then** that ray is highlighted and the metrics panel shows the selected hour's azimuth, altitude, and daylight state.
2. **Given** I selected an hour via the map, **When** I view the data table, **Then** the corresponding row is highlighted.
3. **Given** I selected an hour via the table, **When** I view the map, **Then** the corresponding ray is highlighted.
4. **Given** I selected an hour, **When** I view the charts, **Then** the selected hour is indicated on both altitude and azimuth charts.

---

### User Story 5 - Visualize Daylight Periods (Priority: P2)

As a user, I want to clearly distinguish between night, golden hour, and full daylight periods so I can plan activities requiring specific lighting conditions.

**Why this priority**: Visual differentiation of daylight states is a key usability feature for photographers and outdoor planners.

**Independent Test**: Can be fully tested by observing color-coded rays on the map and verifying they match expected daylight periods based on altitude thresholds.

**Acceptance Scenarios**:

1. **Given** solar rays are displayed, **When** I view the map, **Then** rays are color-coded: night hours (altitude < 0°), golden hour (0°-6°), and daylight (altitude ≥ 6°).
2. **Given** I select an hour, **When** I view the metrics panel, **Then** the daylight state (night/golden hour/day) is clearly indicated.
3. **Given** sunrise/sunset times are available, **When** I view the map, **Then** I can identify the transition periods visually.

---

### User Story 6 - View Solar Charts (Priority: P2)

As a user, I want to see altitude and azimuth charts so I can visualize the sun's arc and bearing trend throughout the day.

**Why this priority**: Charts provide an alternative visualization that helps users understand patterns more intuitively.

**Independent Test**: Can be fully tested by viewing the charts panel and verifying altitude area chart and azimuth line chart display correctly.

**Acceptance Scenarios**:

1. **Given** a location and date are selected, **When** I view the charts panel, **Then** I see an altitude area chart showing the solar arc throughout the day.
2. **Given** a location and date are selected, **When** I view the charts panel, **Then** I see an azimuth line chart showing bearing changes.
3. **Given** I select an hour on the chart, **When** the selection updates, **Then** the map ray and table row sync to the same hour.

---

### User Story 7 - Copy Solar Data (Priority: P3)

As a user, I want to copy specific hourly solar data so I can use it in other applications or documentation.

**Why this priority**: Data export is a convenience feature that enhances usability but isn't required for core functionality.

**Independent Test**: Can be fully tested by clicking copy on a data row and pasting the result to verify correct format.

**Acceptance Scenarios**:

1. **Given** I am viewing the hourly data table, **When** I click the copy button for a specific hour, **Then** the latitude, longitude, datetime, azimuth, and altitude are copied to clipboard.
2. **Given** I copied data, **When** I paste it into another application, **Then** the data is in a usable format.

---

### User Story 8 - Enter Manual Coordinates (Priority: P3)

As a user, I want to enter precise latitude/longitude coordinates manually so I can view solar data for exact locations not found via search.

**Why this priority**: Manual input serves as both a power-user feature and a fallback when geocoding is unavailable.

**Independent Test**: Can be fully tested by entering coordinates manually and verifying the map updates to that location.

**Acceptance Scenarios**:

1. **Given** I am on the application, **When** I enter latitude 35.6762 and longitude 139.6503, **Then** the map centers on those coordinates and displays solar data.
2. **Given** I enter invalid coordinates (e.g., latitude 95), **When** I submit, **Then** I see a validation error and the map does not update.
3. **Given** geocoding is unavailable, **When** I enter valid coordinates manually, **Then** I can still use all solar visualization features.

---

### User Story 9 - Receive Deterministic Solar Insights (Priority: P3)

As a user, I want to see contextual insights about the solar conditions so I can better understand what the data means for my use case.

**Why this priority**: Insights enhance understanding but are supplementary to the core visualization features.

**Independent Test**: Can be fully tested by viewing insights for different location/date combinations and verifying rule-based messages appear correctly.

**Acceptance Scenarios**:

1. **Given** I am viewing a high-latitude location in winter, **When** insights are displayed, **Then** I see information about shorter day length and lower peak altitude.
2. **Given** I am viewing a location near the equator, **When** insights are displayed, **Then** I see information about higher peak altitude and smaller seasonal variation.
3. **Given** any location/date, **When** insights are displayed, **Then** the insights are based on deterministic rules (not AI-generated).

---

### Edge Cases

- What happens when the user's browser blocks geolocation permissions?
  - Manual coordinate entry remains available; search functionality works normally.
- What happens when the geocoding service is rate-limited or unavailable?
  - Display error message with retry option; allow manual lat/lng entry as fallback.
- What happens when sunrise/sunset API is unavailable?
  - Core hourly trajectory still functions; show "Unavailable" for sunrise/sunset times with retry option.
- What happens when user enters coordinates at extreme latitudes (polar regions)?
  - System handles 24-hour daylight or darkness correctly; altitude values accurately reflect polar conditions.
- What happens when user rapidly pans/zooms the map while data is loading?
  - Map view state is preserved; no unexpected jumps or resets.
- What happens when user selects a location with ambiguous timezone?
  - Default to browser timezone with clear labeling; provide timezone dropdown for manual selection.

## Requirements *(mandatory)*

### Functional Requirements

**Location & Input**
- **FR-001**: System MUST allow users to enter latitude (-90 to 90) and longitude (-180 to 180) with at least 6 decimal places of precision.
- **FR-002**: System MUST validate coordinate inputs and display clear error messages for invalid values.
- **FR-003**: System MUST provide keyword-based location search using a free geocoding service.
- **FR-004**: System MUST display search results with location name, coordinates, and verification link to OpenStreetMap.
- **FR-005**: System MUST support browser geolocation to fetch user's current coordinates.
- **FR-006**: System MUST allow date selection for any valid Gregorian calendar date.
- **FR-007**: System MUST default to today's date in the user's local timezone.
- **FR-007a**: On initial load, system MUST attempt IP-based geolocation to display a default location.
- **FR-007b**: If IP geolocation is unavailable, system MUST prompt user for browser geolocation permission.
- **FR-007c**: If browser geolocation is denied or unavailable, system MUST default to Taipei (25.0330°N, 121.5654°E) as the fallback location.

**Solar Computation**
- **FR-008**: System MUST compute hourly sun position (azimuth 0-360° and altitude) for hours 00:00 through 23:00.
- **FR-009**: System MUST use deterministic open-source solar calculation (no paid API dependencies).
- **FR-010**: System MUST display or fetch sunrise time, sunset time, and day length.
- **FR-011**: System MUST provide rule-based solar insights based on latitude, day length, and altitude data.

**Map Visualization**
- **FR-012**: System MUST display an interactive map with 24 radial rays from the selected coordinate, each representing an hour's azimuth.
- **FR-012a**: Solar rays MUST extend from the selected coordinate to the edge of the visible map viewport.
- **FR-013**: System MUST color-code rays based on altitude bands (night, golden hour, daylight).
- **FR-014**: System MUST allow ray selection by clicking, which updates all synchronized views.
- **FR-015**: System MUST preserve map center and zoom during data updates, ray selection, and table selection.
- **FR-016**: System MUST only change map view when user explicitly searches a new location or manually pans/zooms.

**Data & Charts**
- **FR-017**: System MUST display an altitude area chart showing the solar arc.
- **FR-018**: System MUST display an azimuth line chart showing bearing trend.
- **FR-019**: System MUST synchronize selection state across map rays, table rows, and charts.
- **FR-020**: System MUST provide one-click copy functionality for individual field values (latitude, longitude, datetime, azimuth, altitude) allowing users to copy each value separately.
- **FR-021**: System MUST display a metrics panel showing selected hour's time, azimuth, altitude, and daylight state.

**Service Protection**
- **FR-022**: System MUST debounce search requests (300-500ms delay) to respect public API capacity.
- **FR-023**: System MUST cache geocoding results to minimize redundant requests.
- **FR-024**: System MUST gracefully degrade when external services are unavailable (allow manual coordinate entry).

**Timezone**
- **FR-025**: System MUST interpret hourly points in the user's browser timezone by default with clear labeling.
- **FR-026**: System MUST provide timezone selection as an advanced option.

### Key Entities

- **Location**: Represents a geographic point with latitude, longitude, and optional display name. Used as the center point for all solar calculations.
- **Date Selection**: A specific calendar date for which solar calculations are performed.
- **Hourly Solar Position**: Contains hour (0-23), azimuth (degrees from North), altitude (degrees above/below horizon), and derived daylight state.
- **Sun Events**: Contains sunrise time, sunset time, and calculated day length for the selected location and date.
- **Solar Insights**: Rule-based textual observations derived from location latitude, day length, and altitude patterns.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can find their home location's solar path and select an hour within 10 seconds of first interaction.
- **SC-002**: Hour selection (via map, table, or chart) provides instant visual feedback with no perceived delay.
- **SC-003**: Map view remains stable (no center/zoom reset) during data updates and selections.
- **SC-004**: Solar trajectory data aligns with established solar position standards (spot-check validation against reference sources).
- **SC-005**: 95% of geocoding searches return relevant results within 2 seconds.
- **SC-006**: Application remains fully functional when external geocoding or sunrise/sunset services are unavailable (manual coordinate entry works).
- **SC-007**: Users can successfully complete core tasks (location selection, date selection, hour exploration) without documentation.
- **SC-008**: All 24 hourly solar positions display correctly for any valid coordinate and date combination.

## Assumptions

- Users have access to a modern web browser with JavaScript enabled.
- Browser geolocation API is available but may be blocked by user privacy settings.
- Free geocoding services (primarily OpenStreetMap Nominatim) will be available with reasonable rate limits.
- Client-side solar computation will provide accuracy sufficient for practical use cases (architectural planning, photography, etc.).
- Users understand basic concepts like compass directions (North/East/South/West) and time of day.
- Application is desktop-first responsive: optimized for desktop use but functional on mobile devices.

## Clarifications

### Session 2025-12-28

- Q: What should users see on first load before any location is selected? → A: Use IP-based geolocation as default; if unavailable, prompt for browser geolocation; if denied, default to Taipei.
- Q: How long should the solar rays extend on the map? → A: Extend to map edge/viewport boundary.
- Q: What format should copied solar data use? → A: Copy individual field values (lat, lng, azimuth, altitude, etc.) separately, not combined.
- Q: Should golden hour threshold be configurable? → A: Fixed at 0°–6° (standard golden hour definition).
- Q: Desktop or mobile priority? → A: Desktop-first responsive (works on mobile but optimized for desktop).
