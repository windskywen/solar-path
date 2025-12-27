# API Contracts: Solar Path Tracker

**Feature**: 001-solar-path-tracker  
**Date**: 2025-12-28  
**Status**: Complete

## Overview

This document defines the API contracts for the Solar Path Tracker's server-side routes. All routes are Next.js API Route Handlers.

---

## GET /api/geocode

Proxy for OpenStreetMap Nominatim geocoding service.

### Request

```
GET /api/geocode?q={query}&limit={limit}
```

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| q | string | ✅ | - | Search query (city, address, landmark) |
| limit | number | ❌ | 5 | Maximum results to return (1-10) |

### Response

**Success (200)**:
```typescript
type GeocodeResponse = {
  results: GeocodeResult[];
};

type GeocodeResult = {
  displayName: string;  // e.g., "Tokyo, Japan"
  lat: number;          // e.g., 35.6762
  lng: number;          // e.g., 139.6503
  osmUrl: string;       // e.g., "https://www.openstreetmap.org/..."
};
```

**Error (400 - Bad Request)**:
```typescript
type ErrorResponse = {
  error: string;
  code: "INVALID_QUERY" | "INVALID_LIMIT";
};
```

**Error (429 - Rate Limited)**:
```typescript
type ErrorResponse = {
  error: string;
  code: "RATE_LIMITED";
  retryAfter?: number;  // seconds
};
```

**Error (502 - Upstream Error)**:
```typescript
type ErrorResponse = {
  error: string;
  code: "UPSTREAM_ERROR";
};
```

### Example

```bash
GET /api/geocode?q=sydney&limit=3

# Response
{
  "results": [
    {
      "displayName": "Sydney, New South Wales, Australia",
      "lat": -33.8688,
      "lng": 151.2093,
      "osmUrl": "https://www.openstreetmap.org/relation/3143887"
    },
    {
      "displayName": "Sydney, Cape Breton, Nova Scotia, Canada",
      "lat": 46.1368,
      "lng": -60.1942,
      "osmUrl": "https://www.openstreetmap.org/relation/6585188"
    }
  ]
}
```

### Implementation Notes

- Server adds `User-Agent` header (required by Nominatim ToS)
- LRU cache with 24h TTL for repeated queries
- Rate limit: 60 requests per 5 minutes per IP
- Debounce on client side (400ms) before calling

---

## GET /api/ip-geo

Returns approximate location based on client IP address.

### Request

```
GET /api/ip-geo
```

No parameters required. Client IP is extracted from request headers.

### Response

**Success (200)**:
```typescript
type IpGeoResponse = {
  lat: number;
  lng: number;
  city?: string;
  country?: string;
};
```

**Error (503 - Service Unavailable)**:
```typescript
type ErrorResponse = {
  error: string;
  code: "IP_GEO_UNAVAILABLE";
};
```

### Example

```bash
GET /api/ip-geo

# Response
{
  "lat": 25.0330,
  "lng": 121.5654,
  "city": "Taipei",
  "country": "Taiwan"
}
```

### Implementation Notes

- Uses ip-api.com free tier
- Cache response for 1 hour per IP
- On failure: return 503, client falls back to GPS prompt → Taipei default
- Never blocks app initialization

---

## Client-Side Contracts

### useSolarData Hook

Computes solar data locally (no API call).

```typescript
function useSolarData(
  location: LocationPoint | null,
  dateISO: string,
  timezone: string
): {
  data: SolarDataset | null;
  isComputing: boolean;
};
```

### useGeocode Hook

Fetches geocoding results with debouncing and caching.

```typescript
function useGeocode(query: string): {
  results: GeocodeResult[];
  isLoading: boolean;
  error: string | null;
};
```

### useIpGeo Hook

Fetches initial location on app load.

```typescript
function useIpGeo(): {
  location: LocationPoint | null;
  isLoading: boolean;
  error: string | null;
};
```

---

## Error Codes Reference

| Code | HTTP Status | Description |
|------|-------------|-------------|
| INVALID_QUERY | 400 | Missing or empty search query |
| INVALID_LIMIT | 400 | Limit parameter out of range |
| RATE_LIMITED | 429 | Too many requests from this IP |
| UPSTREAM_ERROR | 502 | Nominatim/external service failed |
| IP_GEO_UNAVAILABLE | 503 | IP geolocation service failed |

---

## Cache Headers

### /api/geocode
```
Cache-Control: public, max-age=86400, stale-while-revalidate=3600
```

### /api/ip-geo
```
Cache-Control: private, max-age=3600
```
