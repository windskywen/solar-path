# Data Model: Solar Path Tracker

**Feature**: 001-solar-path-tracker  
**Date**: 2025-12-28  
**Status**: Complete

## Entity Definitions

### LocationPoint

Represents a geographic coordinate with metadata about its source.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| lat | number | ✅ | Latitude in decimal degrees (-90 to 90) |
| lng | number | ✅ | Longitude in decimal degrees (-180 to 180) |
| name | string | ❌ | Display name (from search or reverse geocoding) |
| source | LocationSource | ❌ | How the location was obtained |
| osmUrl | string | ❌ | OpenStreetMap verification link (for search results) |

**LocationSource Enum**: `"ip"` | `"gps"` | `"search"` | `"manual"` | `"fallback"`

**Validation Rules**:
- lat: Must be >= -90 and <= 90
- lng: Must be >= -180 and <= 180
- Precision: Support at least 6 decimal places

---

### HourlySolarPosition

Represents the sun's position at a specific hour of the day.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| hour | number | ✅ | Hour of day (0-23) |
| localTimeLabel | string | ✅ | Formatted time string (e.g., "14:00") |
| azimuthDeg | number | ✅ | Azimuth in degrees from North (0-360°, clockwise) |
| altitudeDeg | number | ✅ | Altitude in degrees above horizon (can be negative) |
| daylightState | DaylightState | ✅ | Derived daylight classification |

**DaylightState Enum**: `"night"` | `"golden"` | `"day"`

**Derivation Rules**:
- `night`: altitudeDeg < 0
- `golden`: altitudeDeg >= 0 AND altitudeDeg < 6
- `day`: altitudeDeg >= 6

---

### SunEvents

Contains astronomical event times for the selected date and location.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| sunriseLocal | string | ❌ | Sunrise time in local timezone (HH:mm) |
| sunsetLocal | string | ❌ | Sunset time in local timezone (HH:mm) |
| dayLengthLabel | string | ❌ | Human-readable day length (e.g., "10h 32m") |
| note | string | ❌ | Special condition note (e.g., "Polar day") |

**State Transitions**:
- Normal day: All fields populated
- Polar day (24h sun): sunriseLocal/sunsetLocal = undefined, dayLengthLabel = "24h daylight", note = "Midnight sun"
- Polar night (0h sun): sunriseLocal/sunsetLocal = undefined, dayLengthLabel = "0h daylight", note = "Polar night"

---

### SolarInsights

Contains deterministic rule-based observations about solar conditions.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| messages | string[] | ✅ | Array of insight messages |

**Rules** (inputs: lat, hourly[], events):
1. Polar day: `hourly.every(h => h.altitudeDeg > 0)` → "Midnight sun: the Sun stays above the horizon all day."
2. Polar night: `hourly.every(h => h.altitudeDeg < 0)` → "Polar night: the Sun stays below the horizon all day."
3. High latitude winter: `|lat| >= 55 && dayLengthHours < 8` → "Short daylight window and low solar elevation typical of high-latitude winter."
4. Near equator: `|lat| <= 10` → "Near-equatorial location: expect high peak solar altitude with minimal seasonal variation."
5. Long summer day: `|lat| >= 45 && dayLengthHours > 15` → "Extended daylight typical of mid-to-high latitude summer."

---

### SolarDataset

Aggregates all computed data for a location/date/timezone combination.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| location | LocationPoint | ✅ | The selected location |
| dateISO | string | ✅ | Selected date in ISO format (YYYY-MM-DD) |
| timezone | string | ✅ | Timezone identifier ("browser" or IANA string) |
| hourly | HourlySolarPosition[] | ✅ | Array of 24 hourly positions |
| events | SunEvents | ✅ | Sunrise/sunset/day length |
| insights | SolarInsights | ✅ | Deterministic insights |

---

### GeocodeResult

Represents a single search result from geocoding.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| displayName | string | ✅ | Human-readable location name |
| lat | number | ✅ | Latitude |
| lng | number | ✅ | Longitude |
| osmUrl | string | ✅ | OpenStreetMap verification link |

---

### IpGeoResponse

Response from IP-based geolocation service.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| lat | number | ✅ | Approximate latitude |
| lng | number | ✅ | Approximate longitude |
| city | string | ❌ | City name if available |
| country | string | ❌ | Country name if available |

---

## Relationships

```
┌─────────────────┐
│  LocationPoint  │
└────────┬────────┘
         │
         │ 1:1
         ▼
┌─────────────────┐       ┌─────────────────┐
│  SolarDataset   │───────│   SunEvents     │
└────────┬────────┘  1:1  └─────────────────┘
         │
         │ 1:24
         ▼
┌─────────────────┐       ┌─────────────────┐
│HourlySolarPos[] │       │  SolarInsights  │
└─────────────────┘       └─────────────────┘
                                  ▲
                                  │ derived from
                                  │
                          lat, hourly[], events
```

## State Shape (Zustand Store)

```typescript
interface SolarStore {
  // Core state
  location: LocationPoint | null;
  dateISO: string;              // Default: today
  timezone: string;             // Default: "browser"
  selectedHour: number | null;  // 0-23 or null
  
  // UI state
  isLoadingLocation: boolean;
  geocodeError: string | null;
  
  // Actions
  setLocation: (loc: LocationPoint) => void;
  setDate: (dateISO: string) => void;
  setTimezone: (tz: string) => void;
  setSelectedHour: (hour: number | null) => void;
  clearError: () => void;
}
```

**Derived Data** (computed via hooks, not stored):
- `hourly[]` - computed from location + date + timezone
- `events` - computed from location + date + timezone
- `insights` - computed from location + hourly + events
