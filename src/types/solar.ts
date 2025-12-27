/**
 * Solar Path Tracker - TypeScript Type Definitions
 * Based on data-model.md specification
 */

// ============================================================================
// Location Types
// ============================================================================

/** How the location was obtained */
export type LocationSource = 'ip' | 'gps' | 'search' | 'manual' | 'fallback';

/** Represents a geographic coordinate with metadata about its source */
export interface LocationPoint {
  /** Latitude in decimal degrees (-90 to 90) */
  lat: number;
  /** Longitude in decimal degrees (-180 to 180) */
  lng: number;
  /** Display name (from search or reverse geocoding) */
  name?: string;
  /** How the location was obtained */
  source?: LocationSource;
  /** OpenStreetMap verification link (for search results) */
  osmUrl?: string;
}

// ============================================================================
// Solar Position Types
// ============================================================================

/** Daylight classification based on altitude */
export type DaylightState = 'night' | 'golden' | 'day';

/** Represents the sun's position at a specific hour of the day */
export interface HourlySolarPosition {
  /** Hour of day (0-23) */
  hour: number;
  /** Formatted time string (e.g., "14:00") */
  localTimeLabel: string;
  /** Azimuth in degrees from North (0-360°, clockwise) */
  azimuthDeg: number;
  /** Altitude in degrees above horizon (can be negative) */
  altitudeDeg: number;
  /** Derived daylight classification */
  daylightState: DaylightState;
}

/** Contains astronomical event times for the selected date and location */
export interface SunEvents {
  /** Sunrise time in ISO format or null for polar conditions */
  sunriseISO?: string | null;
  /** Sunset time in ISO format or null for polar conditions */
  sunsetISO?: string | null;
  /** Sunrise time in local timezone (HH:mm) */
  sunriseLocal?: string;
  /** Sunset time in local timezone (HH:mm) */
  sunsetLocal?: string;
  /** Human-readable day length (e.g., "10h 32m") */
  dayLengthLabel?: string;
  /** Human-readable day length alias (for compatibility) */
  dayLengthFormatted?: string;
  /** Day length in hours (for computation) */
  dayLengthHours?: number | null;
  /** Special condition note (e.g., "Polar day") */
  note?: string;
}

/** Contains deterministic rule-based observations about solar conditions */
export interface SolarInsights {
  /** Array of insight messages */
  messages: string[];
}

/** Aggregates all computed data for a location/date/timezone combination */
export interface SolarDataset {
  /** The selected location */
  location: LocationPoint;
  /** Selected date in ISO format (YYYY-MM-DD) */
  dateISO: string;
  /** Timezone identifier ("browser" or IANA string) */
  timezone: string;
  /** Array of 24 hourly positions */
  hourly: HourlySolarPosition[];
  /** Sunrise/sunset/day length */
  events: SunEvents;
  /** Deterministic insights */
  insights: SolarInsights;
}

// ============================================================================
// API Response Types
// ============================================================================

/** Represents a single search result from geocoding */
export interface GeocodeResult {
  /** Human-readable location name */
  displayName: string;
  /** Latitude */
  lat: number;
  /** Longitude */
  lng: number;
  /** OpenStreetMap verification link */
  osmUrl: string;
}

/** Geocoding API response */
export interface GeocodeResponse {
  results: GeocodeResult[];
}

/** Response from IP-based geolocation service */
export interface IpGeoResponse {
  /** Approximate latitude */
  lat: number;
  /** Approximate longitude */
  lng: number;
  /** City name if available */
  city?: string;
  /** Country name if available */
  country?: string;
}

// ============================================================================
// Error Types
// ============================================================================

export type GeocodeErrorCode = 'INVALID_QUERY' | 'INVALID_LIMIT' | 'RATE_LIMITED' | 'UPSTREAM_ERROR';
export type IpGeoErrorCode = 'IP_GEO_UNAVAILABLE';

export interface ApiError {
  error: string;
  code: GeocodeErrorCode | IpGeoErrorCode;
  retryAfter?: number;
}

// ============================================================================
// Store State Types
// ============================================================================

/** Global application state shape */
export interface SolarState {
  /** Current selected location */
  location: LocationPoint | null;
  /** Selected date in ISO format (YYYY-MM-DD) */
  dateISO: string;
  /** Timezone identifier ("browser" or IANA string) */
  timezone: string;
  /** Currently selected hour (0-23) or null if none selected */
  selectedHour: number | null;
  /** Loading state for initial location */
  isLoadingLocation: boolean;
  /** Error message if any */
  error: string | null;
}

/** Store actions */
export interface SolarActions {
  setLocation: (location: LocationPoint) => void;
  setDateISO: (dateISO: string) => void;
  setTimezone: (timezone: string) => void;
  setSelectedHour: (hour: number | null) => void;
  setIsLoadingLocation: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

/** Combined store type */
export type SolarStore = SolarState & SolarActions;
