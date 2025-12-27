# Quickstart: Solar Path Tracker

**Feature**: 001-solar-path-tracker  
**Date**: 2025-12-28

## Prerequisites

- Node.js 20+ installed
- pnpm (recommended) or npm
- Modern browser (Chrome, Firefox, Safari, Edge)

## Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Environment Variables

Create `.env.local` in the project root:

```env
# Required for geocoding proxy (identify your app to Nominatim)
NOMINATIM_USER_AGENT="SolarPathTracker/1.0 (contact@example.com)"

# Optional: Override default map tile URL
# NEXT_PUBLIC_MAP_TILES_URL="https://tiles.example.com/{z}/{x}/{y}.png"
```

### 3. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Main solar tracker page
│   └── api/               # API route handlers
├── components/            # React components
├── lib/                   # Core logic (solar, geo, utils)
├── store/                 # Zustand state management
├── hooks/                 # Custom React hooks
└── types/                 # TypeScript definitions

tests/
├── unit/                  # Vitest unit tests
└── e2e/                   # Playwright E2E tests
```

## Key Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm test` | Run unit tests |
| `pnpm test:e2e` | Run E2E tests |
| `pnpm lint` | Run ESLint |
| `pnpm typecheck` | Run TypeScript checks |

## Core Modules

### Solar Computation (`src/lib/solar/`)

```typescript
import { computeHourlyPositions } from '@/lib/solar/computation';
import { computeSunEvents } from '@/lib/solar/events';
import { generateInsights } from '@/lib/solar/insights';

// Compute 24-hour solar positions
const hourly = computeHourlyPositions(lat, lng, dateISO, timezone);

// Get sunrise/sunset/day length
const events = computeSunEvents(lat, lng, dateISO, timezone);

// Generate deterministic insights
const insights = generateInsights(lat, hourly, events);
```

### Ray Geometry (`src/lib/geo/`)

```typescript
import { computeRayEndpoints } from '@/lib/geo/ray-geometry';

// Compute ray endpoints that extend to viewport edge
const rays = computeRayEndpoints(centerLngLat, hourly, map);
// Returns GeoJSON FeatureCollection of LineStrings
```

### State Management (`src/store/`)

```typescript
import { useSolarStore } from '@/store/solar-store';

// In component
const { location, setLocation, selectedHour, setSelectedHour } = useSolarStore();
```

## Testing

### Unit Tests

```bash
# Run all unit tests
pnpm test

# Run with coverage
pnpm test:coverage

# Run specific test file
pnpm test src/lib/solar/computation.test.ts
```

### E2E Tests

```bash
# Install Playwright browsers (first time)
pnpm exec playwright install

# Run E2E tests
pnpm test:e2e

# Run with UI
pnpm test:e2e --ui
```

## Validation Checklist

Before submitting changes, ensure:

- [ ] `pnpm lint` passes with no errors
- [ ] `pnpm typecheck` passes
- [ ] `pnpm test` all unit tests pass
- [ ] `pnpm test:e2e` all E2E tests pass
- [ ] Manual smoke test: search location, change date, click rays

## Troubleshooting

### Map doesn't load
- Check browser console for CORS errors
- Verify tile URL is accessible
- Ensure MapLibre CSS is imported

### Geocoding fails
- Check `NOMINATIM_USER_AGENT` is set
- Verify network connectivity
- Check rate limit (60 req / 5 min)

### Solar calculations seem wrong
- Verify timezone handling (browser vs IANA)
- Check azimuth normalization (0° = North)
- Compare against [NOAA Solar Calculator](https://gml.noaa.gov/grad/solcalc/)

## Resources

- [spec.md](spec.md) - Feature specification
- [data-model.md](data-model.md) - Data model definitions
- [contracts/api.md](contracts/api.md) - API contracts
- [research.md](research.md) - Technology decisions
