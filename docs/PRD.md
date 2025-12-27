# Product Requirement Document (PRD): Solar Path Tracker (Next.js, Free-Only Edition)

## 0. Product Constraints (Hard Requirements)
- **No paid services**: The product must not depend on paid AI models (e.g., Gemini), paid map APIs, or paid astronomy APIs.
- **Free-only dependencies**:
  - Use **free public APIs / free search** for geocoding and (optionally) sunrise/sunset metadata.
  - Use **open-source, deterministic solar computation** to generate hourly solar position (azimuth/altitude).
- **Provider abstraction**: All external services must be wrapped behind provider interfaces to allow swap/replacement without rewriting core UI logic.
- **Respect public API capacity**: Implement caching + throttling + debouncing. Do not perform bulk or automated scraping behavior.

---

## 1. Product Overview
Solar Path Tracker is a high-precision solar visualization tool that helps users understand the Sun’s movement for any coordinate on Earth and any date. The application produces **hourly solar trajectory data** (Azimuth and Altitude, 00:00–23:00) and renders it via an interactive map plus charts.

---

## 2. Target Audience
- Architects & Urban Planners: building orientation, daylighting, shadow impact
- Solar Professionals: preliminary PV placement assessments
- Photographers & Cinematographers: golden hour planning and solar-angle targeting
- Outdoor Enthusiasts: daylight availability for hiking/camping

---

## 3. Core Functional Requirements

### 3.1 Location & Date Configuration
**3.1.1 Manual Coordinate Input**
- High precision latitude/longitude input (>= 6 decimals)
- Validation:
  - Latitude: [-90, 90]
  - Longitude: [-180, 180]

**3.1.2 Free Place Search (Geocoding)**
- Provide keyword search (city/landmark/address) using a free geocoding source (primary: OpenStreetMap Nominatim).
- Search results must include:
  - Display name
  - Lat/Lng
  - Verification link (OpenStreetMap; optionally Google Maps link built from coordinates)

**3.1.3 Geolocation**
- “Use My GPS” button uses browser geolocation to fetch current coordinates.

**3.1.4 Date Selection**
- Supports any date (Gregorian).
- Default date: today in the user’s local timezone.

---

### 3.2 Solar Computation (Free-Only, Deterministic)
**3.2.1 Hourly Sun Position (00:00–23:00)**
- For each hour compute:
  - **Azimuth**: degrees from North (0–360°, clockwise)
  - **Altitude**: degrees above horizon (negative values allowed)
- Must be computed via open-source deterministic algorithm/library (no paid API).
- Recommended implementation:
  - **Client-side computation** (preferred for instant interaction and zero external calls).

**3.2.2 Key Astronomical Events**
Compute or fetch:
- Sunrise time
- Sunset time
- Day length

Allowed free sources:
- Free sunrise/sunset API (e.g., sunrise-sunset.org) OR
- Free weather/astronomy endpoint that provides sunrise/sunset in daily variables (optional)

Fallback:
- If free API fails or rate-limited, show “Unavailable” and allow retry; core hourly trajectory still functions.

**3.2.3 “Solar Insights” Without AI**
Replace LLM insights with deterministic rule-based insights, e.g.:
- “High latitude + winter date: shorter day length and lower peak altitude.”
- “Near equator: higher peak altitude, smaller seasonal variation.”

Inputs:
- Latitude
- Day length
- Max altitude
- Sunrise/sunset azimuth spread (if available)

---

### 3.3 Spatial Visualization (Map)
**3.3.1 Solar Ray Layer**
- Leaflet overlay projects 24 radial rays from the selected coordinate.
- Each ray corresponds to one hour and uses computed azimuth as direction.

**3.3.2 Daylight Indicators**
- Color-code by altitude bands:
  - Night: altitude < 0°
  - Golden hour band: configurable (e.g., 0°–6°) or time-window around sunrise/sunset
  - Daylight: altitude >= threshold

**3.3.3 Interactive Rays**
- Clicking a ray:
  - selects the hour
  - highlights the ray (blue)
  - updates table row, metrics panel, and charts (synced state)

**3.3.4 View Stability (Critical UX)**
- Map must preserve:
  - current center
  - current zoom
during:
- data updates
- ray selection
- table selection

Only change view when:
- user explicitly searches a new location
- user manually pans/zooms

---

### 3.4 Data Analysis & Utilities
**3.4.1 Charts**
- Altitude Area Chart (solar arc)
- Azimuth Line Chart (bearing trend)

**3.4.2 Copy Utilities**
- One-click copy for each hourly datapoint:
  - lat, lng, datetime, azimuth, altitude

**3.4.3 Vector Metrics Panel**
- Floating overlay showing selected-hour stats:
  - local time
  - azimuth (0–360)
  - altitude
  - daylight state (night/golden/day)

---

## 4. UI & UX

### 4.1 Design Language
- Space-tech theme
- Slate-900 panels; Yellow-400 highlights
- Dual-pane responsive layout:
  - Left: controls + summary
  - Right: map + charts

### 4.2 Interaction Model
- Synced selection state: ray <-> table row <-> charts
- Loading states:
  - skeleton/pulse for geocoding and sunrise/sunset fetch
  - hour selection must be instant (no blocking recompute)

### 4.3 Verification Links
- Place search results must provide a verification link to OpenStreetMap (and optionally Google Maps).

---

## 5. Next.js-Specific Technical Requirements

### 5.1 Rendering Model
- The app is built with **Next.js**.
- The **Map** and **Charts** must be **client-only** components:
  - Leaflet relies on `window` and cannot run during SSR.
  - Use `dynamic(() => import(...), { ssr: false })` for the map module.
- Avoid remounting the Leaflet map on state updates:
  - Keep the map instance stable (no key changes that trigger a full remount).

### 5.2 Server Routes (Free API Proxy + Caching)
To protect free public services and ensure consistent UX:
- Implement Next.js route handlers (API routes), for example:
  - `GET /api/geocode?q=...` → proxies to free geocoding provider
  - `GET /api/sun-events?lat=...&lng=...&date=...` → proxies to free sunrise/sunset provider (optional)

Required protections:
- **Debounce** place search on client (e.g., 300–500ms).
- **Caching**:
  - Client: cache recent results in memory + optional `localStorage`.
  - Server route: lightweight cache (in-memory best-effort) + `Cache-Control` headers.
- **Throttling**:
  - Basic per-IP request limiting (best-effort in serverless; must fail gracefully).
- **Graceful degradation**:
  - If geocoding provider is blocked/rate-limited, allow manual lat/lng entry.

### 5.3 Timezone Handling
- Hourly points (00:00–23:00) must be interpreted in the user-selected timezone or the coordinate’s local timezone.
- If you cannot reliably resolve timezone for arbitrary coordinates without a paid service:
  - Default to the user’s browser timezone and label it clearly.
  - Provide a timezone dropdown as an advanced option (IANA strings).

---

## 6. Technical Stack (Next.js Edition)
- Frontend framework: **Next.js + React**
- Styling: Tailwind CSS
- Maps: Leaflet.js + OpenStreetMap tiles
- Geocoding: free search provider (primary: Nominatim) via `/api/geocode`
- Solar computation: open-source deterministic library (client-side preferred)
- Sunrise/sunset: optional free endpoint via `/api/sun-events`
- Charts: Recharts

---

## 7. Success Metrics
- Accuracy: solar trajectory aligns with standard solar models (spot-check sampling)
- Performance:
  - ray selection is instant
  - map does not reset center/zoom
  - no full remount of Leaflet on selection
- Usability: first-time user finds home solar path and selects an hour within 10 seconds

---

## 8. Risks & Mitigations (Free-Only Reality)
- Public geocoding capacity constraints:
  - Mitigate with caching + debouncing + server proxy + fallback to manual coords
- Free endpoint variability:
  - Multi-provider abstraction + graceful fallback
- SSR compatibility issues with Leaflet:
  - Client-only dynamic imports and stable map instance management
