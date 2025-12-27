# planning.md — Solar Path Tracker (Technical Plan)

**Feature Branch**: `001-solar-path-tracker`  
**Created**: 2025-12-28  
**Status**: Draft  
**Source**: `spec.md` (Solar Path Tracker feature specification)

---

## 0. Objectives

This plan describes how to implement Solar Path Tracker in a Next.js project with:
- Deterministic, open-source solar calculations (no paid solar APIs).
- Free geocoding (OpenStreetMap Nominatim) via a server-side proxy with caching and protection.
- Stable map visualization using 24 radial rays (hourly sun positions) extending to the viewport boundary.
- Synchronized interaction across map rays, table, and charts.
- Desktop-first responsive UI.

Success is measured by meeting all P1 acceptance scenarios and core success criteria (SC-001..SC-008).

---

## 1. Key Decisions (Tech)

### 1.1 Solar Computation
- Use an **open-source deterministic library** for sun position + sun events:
  - Primary: `suncalc` (JS) (or equivalent if requirements demand higher precision).
- Compute **all hourly sun positions on the client** (fast, free, deterministic).
- Compute sunrise/sunset/day length using the same library when possible (avoid external sunrise/sunset APIs).

### 1.2 Map & Tiles
- Use **MapLibre GL JS** (open-source) for interactive map rendering.
- Tiles: configurable via environment variables.
  - Note: OpenStreetMap standard tiles have usage policies; for production, switch to a compliant provider or self-host tiles.

### 1.3 Geocoding
- Use **Nominatim** (OpenStreetMap) for keyword-based search.
- Do **not** call Nominatim directly from the browser. Use a Next.js API route proxy:
  - Adds required headers (User-Agent).
  - Enables server-side caching.
  - Enables lightweight rate limiting.
- Client uses debounced search (300–500ms) and caches results (FR-022, FR-023).

### 1.4 Initial Location Strategy
Implement the first-load cascade (FR-007a/b/c):
1. Attempt IP-based geolocation (`/api/ip-geo`).
2. If unavailable, prompt browser geolocation permission (user clicks “Use My GPS”).
3. If denied/unavailable, fallback to **Taipei** (25.0330, 121.5654).

### 1.5 State Management
- Use a small global store (Zustand preferred, or React Context if minimal).
- Keep map camera state controlled by user actions only.

### 1.6 Testing
- Unit tests for pure calculation + geometry.
- Playwright E2E for acceptance scenarios.

---

## 2. System Architecture

### 2.1 Components
- **LocationInput**
  - Search box (Nominatim results)
  - Manual lat/lng input + validation
  - “Use My GPS” button
- **DatePicker**
  - Defaults to today in selected timezone (browser timezone by default)
- **TimezoneSelector (Advanced)**
  - Default “Browser”
  - Optional IANA selection
- **MapPanel**
  - MapLibre map
  - 24 rays (GeoJSON)
  - Selected ray highlight
- **SolarDataTable**
  - 24 rows (00:00–23:00)
  - Row click selects hour
  - Per-field copy controls
- **ChartsPanel**
  - Altitude area chart
  - Azimuth line chart
  - Click selects hour
- **MetricsPanel**
  - Selected hour details: hour, azimuth, altitude, daylight state
- **SunEventsPanel**
  - Sunrise, sunset, day length (or “Unavailable”)
- **InsightsPanel**
  - Deterministic rule-based insights

### 2.2 Data Flow
1. Location/date/timezone resolved.
2. Compute:
   - `hourly[]` (24 points)
   - `sunEvents`
   - `insights`
3. Render:
   - Map rays from hourly azimuth (extend to viewport edge)
   - Table and charts
4. Interactions update `selectedHour` and sync UI highlights.

---

## 3. Data Models (TypeScript)

```ts
export type DaylightState = "night" | "golden" | "day";

export type LocationPoint = {
  lat: number;
  lng: number;
  name?: string;
  source?: "ip" | "gps" | "search" | "manual" | "fallback";
  osmUrl?: string; // for search results verification link
};

export type HourlySolarPosition = {
  hour: number;            // 0..23
  localTimeLabel: string;  // "00:00".."23:00"
  azimuthDeg: number;      // 0..360 (0 = North)
  altitudeDeg: number;     // degrees above horizon (can be negative)
  daylightState: DaylightState;
};

export type SunEvents = {
  sunriseLocal?: string;   // "HH:mm" (optional)
  sunsetLocal?: string;    // "HH:mm" (optional)
  dayLengthLabel?: string; // "10h 32m" or "24h daylight" or "0h daylight"
  note?: string;           // e.g., "Polar day/night; sunrise/sunset unavailable"
};

export type SolarInsights = {
  messages: string[];
};

export type SolarDataset = {
  location: LocationPoint;
  dateISO: string;         // "YYYY-MM-DD"
  timezone: string;        // "browser" or IANA e.g. "Asia/Taipei"
  hourly: HourlySolarPosition[];
  events: SunEvents;
  insights: SolarInsights;
};
4. Solar Computation (Deterministic)
4.1 Hourly Computation Requirements (FR-008)
Compute hourly sun position for local hours 00:00..23:00.

Implementation approach:

Build 24 DateTimes in the selected timezone:

Default: browser timezone.

Advanced: IANA timezone (Luxon recommended).

For each hour:

Convert to JS Date

Use solar library to compute position

Convert radians to degrees

Normalize azimuth to 0..360 where 0 = North

Determine daylight state using fixed thresholds:

night: altitude < 0

golden: 0 <= altitude < 6

day: altitude >= 6

4.2 Azimuth Normalization (Critical)
Different libraries define azimuth differently. Standard output required:

0° = North

90° = East

180° = South

270° = West

Plan:

Implement a single normalization function:

normalizeAzimuthToNorth0_360(rawAzimuthRadians, libraryConvention) => degrees

Add unit tests + documented spot checks (SC-004).

4.3 Sunrise/Sunset/Day Length (FR-010)
Prefer computing using the same solar library (avoid external API).

Convert times to local timezone display.

Handle polar regions:

If sunrise/sunset not available:

show sunrise/sunset as “Unavailable”

compute day condition from hourly pattern:

all altitude < 0 => “0h daylight”

all altitude > 0 => “24h daylight”

else dayLength computed normally if possible

5. Map Visualization (MapLibre) — Rays to Viewport Edge
5.1 Requirements (FR-012, FR-012a)
24 radial rays from the selected coordinate.

Each ray corresponds to an hour’s azimuth.

Rays must extend to the edge of the visible viewport.

5.2 Geometry Algorithm (Screen-Space Intersection)
Compute each ray endpoint by intersecting a direction line with the map canvas rectangle:

Project center coordinate to pixel: centerPx = map.project([lng, lat])

For azimuth bearing (degrees from North):

rad = degToRad(azimuthDeg)

dx = Math.sin(rad)

dy = -Math.cos(rad) (screen Y increases downward)

Ray: P(t) = centerPx + t*(dx, dy), t > 0

Find minimal positive t where P(t) hits one of:

x=0, x=width, y=0, y=height

Unproject endpoint pixel back to lng/lat: map.unproject(endPx)

Store as a GeoJSON LineString [centerLngLat, endLngLat]

This ensures rays always end exactly at the current viewport boundary, regardless of zoom/pan.

5.3 Map Stability (FR-015, FR-016)
Preserve camera state during:

date changes

hour selection

data recomputation

Only recenter/fly when user explicitly:

chooses a search result

submits manual coordinates

uses GPS

5.4 Styling (FR-013)
Color-code by daylight state:

night (altitude < 0)

golden (0–6)

day (>= 6)

Implementation options:

Either three separate line layers filtered by feature property daylightState,

Or single layer with data-driven styling.

Selected ray highlight:

Add another layer filtered by selectedHour.

6. UI Synchronization (FR-014, FR-019)
6.1 Selection Source of Truth
Global state field: selectedHour: number | null

6.2 Sync Behavior
Map ray click -> set selectedHour

Table row click -> set selectedHour

Chart click -> set selectedHour

On selectedHour change:

highlight ray

highlight table row

show marker/tooltip on charts

update metrics panel

7. Geocoding (Free) — Server Proxy + Client Debounce
7.1 API Route: /api/geocode
Purpose: Proxy to Nominatim with caching/rate limiting.

Request:

GET /api/geocode?q=<query>&limit=5

Response:

ts
Copy code
type GeocodeResult = {
  displayName: string;
  lat: number;
  lng: number;
  osmUrl: string; // verification link (FR-004)
};
Server responsibilities:

Add required headers:

User-Agent (configurable)

Accept-Language optional (based on user preference)

LRU cache (query -> results) with TTL (e.g., 24h)

Basic rate limiting (per-IP, e.g., 60 requests / 5 minutes)

Return friendly error payload on upstream failures

Client responsibilities:

Debounce input 300–500ms (FR-022)

Cancel previous requests on new input

Cache results via React Query staleTime (e.g., 24h)

If unavailable: show error and allow manual lat/lng fallback (FR-024)

8. IP Geolocation (FR-007a)
8.1 API Route: /api/ip-geo
Purpose: Get a default approximate location on first load.

Request:

GET /api/ip-geo

Response:

ts
Copy code
type IpGeoResponse = { lat: number; lng: number; city?: string; country?: string };
Behavior:

If success: set location with source="ip"

If failure: do not block the app; proceed to prompt GPS or fallback to Taipei.

9. Manual Coordinates (FR-001, FR-002)
Validation rules:

latitude: -90..90

longitude: -180..180

supports 6+ decimals

show clear inline errors; do not update map/dataset on invalid input

On success:

set location source="manual"

recenter map to new coordinate

10. Copy-to-Clipboard (FR-020)
Requirement: copy individual field values separately, not a combined row.

Implementation:

Provide copy controls for:

latitude

longitude

datetime (local time with timezone label; also ISO variant if desired)

azimuth

altitude

Use navigator.clipboard.writeText(value)

Provide non-blocking toast/inline feedback “Copied”.

11. Deterministic Insights (FR-011)
Rules should use measurable attributes:

latAbs = Math.abs(lat)

dayLengthHours

maxAltitudeDeg

minAltitudeDeg

maxAltitudeHour

Example deterministic rules:

Polar day/night:

if hourly.every(a > 0) => “Midnight sun: the Sun stays above the horizon all day.”

if hourly.every(a < 0) => “Polar night: the Sun stays below the horizon all day.”

High latitude winter:

if latAbs >= 55 && dayLengthHours < 8 => “Short daylight window and low solar elevation.”

Near equator:

if latAbs <= 10 => “High peak solar altitude with smaller seasonal variation.”

All insights must be unit-testable and not AI-generated.

12. Performance & Reliability
12.1 Search Debounce (FR-022)
Debounce 400ms (within 300–500ms requirement)

Cancel in-flight requests when query changes

12.2 Caching (FR-023)
Server LRU cache for geocode

Client React Query cache for geocode and IP geo

12.3 Graceful Degradation (FR-024)
If geocoding fails: manual lat/lng still fully functional

If sunrise/sunset cannot be computed: show “Unavailable” and keep hourly positions working

13. Timezone (FR-025, FR-026)
Default:

Interpret hourly points in browser timezone with clear labeling.

Advanced:

Provide timezone dropdown (IANA list subset or searchable input).

Use Luxon for conversions:

store timezone as "browser" or IANA string

Ensure label in UI: “Times shown in: <timezone>”.

Edge considerations:

DST transitions may cause repeated/missing local hours.

For V1, still display 24 rows 00–23; internally use timezone-aware DateTime creation.

Add unit tests for a DST date in a known zone (e.g., America/New_York) to ensure stable behavior.