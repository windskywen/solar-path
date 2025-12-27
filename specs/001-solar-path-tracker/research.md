# Research: Solar Path Tracker

**Feature**: 001-solar-path-tracker  
**Date**: 2025-12-28  
**Status**: Complete

## Research Tasks

### 1. Solar Computation Library Selection

**Decision**: `suncalc` (npm package)

**Rationale**:
- Open-source, deterministic, no API dependencies
- Widely used (>1M weekly downloads), well-maintained
- Provides both sun position (azimuth/altitude) and sun times (sunrise/sunset)
- Client-side computation = zero latency, no rate limits
- MIT licensed

**Alternatives Considered**:
- `astronomy-engine`: More precise but heavier; overkill for practical planning use
- `solar-calculator`: Less maintained, smaller community
- External APIs (sunrise-sunset.org): Adds latency, rate limits, failure modes

**Implementation Notes**:
- `suncalc.getPosition(date, lat, lng)` returns `{azimuth, altitude}` in radians
- Azimuth is measured from South, clockwise → requires normalization to North=0°
- `suncalc.getTimes(date, lat, lng)` returns sunrise/sunset/dawn/dusk times

### 2. Map Library Selection

**Decision**: MapLibre GL JS

**Rationale**:
- Open-source fork of Mapbox GL JS (BSD license)
- WebGL-based for smooth rendering of 24 rays
- GeoJSON support for dynamic ray geometry
- Event handling for ray click interactions
- Active community, regular updates

**Alternatives Considered**:
- Leaflet: Simpler but SVG-based; less performant for dynamic overlays
- OpenLayers: More complex API; steeper learning curve
- Mapbox GL JS: Requires API key, usage-based pricing

**Implementation Notes**:
- Use `react-map-gl` for React integration (supports MapLibre)
- Rays as GeoJSON LineString features in a dedicated layer
- Data-driven styling for daylight state colors
- Separate highlight layer for selected ray

### 3. Geocoding Service Selection

**Decision**: OpenStreetMap Nominatim (via server proxy)

**Rationale**:
- Free, no API key required
- Good coverage globally
- Returns structured data with display name, coordinates
- Provides OSM URL for verification links (FR-004)

**Alternatives Considered**:
- Google Maps Geocoding: Paid beyond free tier
- Mapbox Geocoding: Requires API key, usage limits
- Photon: Based on OSM but less maintained

**Implementation Notes**:
- Must proxy via Next.js API route (Nominatim ToS requires server-side calls)
- Required headers: `User-Agent` with app name/contact
- Implement LRU cache (24h TTL) to reduce upstream calls
- Rate limit: ~1 request/second max to respect fair use

### 4. IP Geolocation Service Selection

**Decision**: ip-api.com (free tier)

**Rationale**:
- Free for non-commercial use, no API key
- Returns lat/lng, city, country
- Sufficient accuracy for initial location approximation
- Fast response times

**Alternatives Considered**:
- ipinfo.io: Requires API key for commercial use
- MaxMind GeoLite2: Requires database download, more complex setup
- Browser geolocation only: Requires user permission upfront (poor UX)

**Implementation Notes**:
- Call from `/api/ip-geo` route (server-side only)
- Fallback chain: IP geo → browser GPS prompt → Taipei default
- Cache response briefly (1 hour) to avoid repeated calls

### 5. Timezone Library Selection

**Decision**: Luxon

**Rationale**:
- First-class IANA timezone support
- Immutable DateTime objects
- Better DST handling than native Date
- Tree-shakeable, reasonable bundle size

**Alternatives Considered**:
- date-fns-tz: Good but Luxon's DateTime API is more ergonomic
- Temporal API: Not yet widely supported
- moment-timezone: Deprecated, large bundle size

**Implementation Notes**:
- Use `DateTime.fromObject({ hour }, { zone })` to build hourly timestamps
- Handle DST edge cases (repeated/skipped hours) gracefully
- Display timezone label clearly in UI

### 6. Charts Library Selection

**Decision**: Recharts

**Rationale**:
- React-native, composable API
- Good default styling, customizable
- Area chart for altitude, Line chart for azimuth
- Click event support for hour selection sync

**Alternatives Considered**:
- Victory: More verbose API
- Chart.js + react-chartjs-2: More setup required
- D3 direct: Too low-level for this use case

**Implementation Notes**:
- AreaChart for altitude (shows "fill" under the curve)
- LineChart for azimuth trend
- Custom tooltip showing hour details
- onClick handler to sync selectedHour

### 7. State Management Selection

**Decision**: Zustand

**Rationale**:
- Minimal boilerplate, TypeScript-friendly
- No providers required (simpler component tree)
- Selective re-renders via selectors
- Easy to test (plain functions)

**Alternatives Considered**:
- React Context: Sufficient but more boilerplate, potential re-render issues
- Redux Toolkit: Overkill for this scope
- Jotai: Good but Zustand more established

**Implementation Notes**:
- Single store with: location, date, timezone, selectedHour
- Derived data (hourly[], events, insights) computed via hooks
- Map camera state NOT in global store (controlled by MapLibre internally)

### 8. Azimuth Normalization Research

**Decision**: Implement custom normalization function

**Rationale**:
- suncalc returns azimuth from South, clockwise (180° offset from standard)
- Standard convention needed: 0°=North, 90°=East, 180°=South, 270°=West

**Implementation**:
```typescript
// suncalc azimuth: 0 = South, clockwise
// Standard azimuth: 0 = North, clockwise
function normalizeAzimuth(rawRadians: number): number {
  // Convert to degrees
  let degrees = rawRadians * (180 / Math.PI);
  // Add 180° to shift from South=0 to North=0
  degrees = (degrees + 180) % 360;
  // Ensure positive
  if (degrees < 0) degrees += 360;
  return degrees;
}
```

**Validation**: Unit tests against known reference values (e.g., NOAA Solar Calculator)

### 9. Ray Geometry Algorithm Research

**Decision**: Screen-space viewport intersection

**Rationale**:
- Rays must extend to viewport edge regardless of zoom level
- Geographic projection makes fixed-distance rays look inconsistent
- Screen-space math is zoom-independent and precise

**Implementation**:
1. Project center (lat/lng) to screen pixels
2. For each azimuth, compute direction vector (sin/cos with Y-flip)
3. Ray-cast to viewport boundary (x=0, x=width, y=0, y=height)
4. Unproject endpoint pixels back to lat/lng
5. Create GeoJSON LineString from center to endpoint

**Notes**:
- Recalculate on viewport change (pan/zoom events)
- Use `map.on('moveend')` to trigger recomputation
- Debounce if needed for smooth interaction

### 10. Testing Strategy Research

**Decision**: Vitest (unit) + Playwright (E2E)

**Rationale**:
- Vitest: Fast, Vite-native, Jest-compatible API
- Playwright: Cross-browser E2E, good async handling, visual testing support

**Unit Test Coverage Targets**:
- `lib/solar/computation.ts`: 100% (critical path)
- `lib/solar/normalize.ts`: 100% (critical path)
- `lib/solar/events.ts`: 100%
- `lib/solar/insights.ts`: 100%
- `lib/geo/ray-geometry.ts`: 100%
- `lib/geo/validation.ts`: 100%

**E2E Test Coverage**:
- P1 scenarios: GPS location, search location, date selection
- P2 scenarios: Hour selection sync, daylight visualization, charts
- Edge cases: Geocoding failure, polar regions, DST dates

## Summary

All technical decisions resolved. No NEEDS CLARIFICATION items remaining. Ready for Phase 1 design.
