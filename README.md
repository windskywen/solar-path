# ☀️ Solar Path Tracker

A web application that visualizes the sun's path across the sky for any location and date. Built with Next.js, MapLibre GL, and suncalc.

## Features

- **Interactive Map**: Visualize 24 solar rays showing the sun's azimuth throughout the day
- **Location Selection**: Use GPS, search for places, or enter coordinates manually
- **Date Selection**: View solar data for any date with easy navigation
- **Solar Data Display**: See azimuth, altitude, and daylight state for every hour
- **Charts**: Interactive altitude and azimuth charts
- **Sun Events**: Sunrise, sunset, and day length information
- **Smart Insights**: Rule-based contextual information about solar conditions
- **Timezone Support**: Configure timezone for accurate local time calculations
- **Responsive Design**: Works on desktop and mobile devices
- **Accessibility**: Keyboard navigation, screen reader support, WCAG 2.1 AA compliant
- **Trust Pages**: Built-in Privacy Policy and About/Contact routes for review readiness
- **Manual Ad Slot Support**: Optional, env-gated AdSense placement below the hourly data rail
- **SEO Foundations**: Metadata, structured data, `robots.txt`, `sitemap.xml`, and social share images

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm, yarn, pnpm, or bun

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/solar-path-tracker.git
   cd solar-path-tracker
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file (optional, for local overrides, SEO metadata, and AdSense scaffolding):
   ```bash
   cp .env.example .env.local
   ```

4. Optional SEO site URL configuration:
   ```bash
   NEXT_PUBLIC_SITE_URL=https://your-production-domain.example
   ```
   Set this in production so canonical URLs, `robots.txt`, `sitemap.xml`, and social metadata use the correct public domain.

   This repository also supports a committed `.env.production` for public, non-secret values such as the canonical site URL.

5. Optional AdSense configuration:
   ```bash
   NEXT_PUBLIC_ADSENSE_ENABLED=false
   NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-0000000000000000
   NEXT_PUBLIC_ADSENSE_SIDEBAR_SLOT_ID=0000000000
   ```
   Leave `NEXT_PUBLIC_ADSENSE_ENABLED=false` until you have a real AdSense publisher ID and slot ID.

6. Start the development server:
   ```bash
   npm run dev
   ```

7. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with Turbopack |
| `npm run build` | Create production build |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm test` | Run unit tests with Vitest |
| `npm run test:e2e` | Run E2E tests with Playwright |

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) with App Router
- **UI**: [React 19](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/)
- **Maps**: [MapLibre GL JS](https://maplibre.org/), [react-map-gl](https://visgl.github.io/react-map-gl/)
- **Solar Calculations**: [suncalc](https://github.com/mourner/suncalc)
- **Date/Time**: [Luxon](https://moment.github.io/luxon/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)
- **Data Fetching**: [TanStack Query](https://tanstack.com/query)
- **Charts**: [Recharts](https://recharts.org/)
- **Testing**: [Vitest](https://vitest.dev/), [Playwright](https://playwright.dev/)

## Project Structure

```
src/
├── app/                    # Next.js App Router pages and API routes
│   ├── api/               # API routes (geocode, ip-geo)
│   └── page.tsx           # Main application page
├── components/            # React components
│   ├── a11y/             # Accessibility components
│   ├── charts/           # Solar charts (altitude, azimuth)
│   ├── data/             # Data display components
│   ├── date/             # Date and timezone selectors
│   ├── insights/         # Sun events and insights panels
│   ├── location/         # Location input components
│   └── map/              # Map and solar rays components
├── hooks/                 # Custom React hooks
├── lib/                   # Utility libraries
│   ├── geo/              # Geolocation utilities
│   ├── solar/            # Solar calculations
│   └── utils/            # General utilities
├── store/                 # Zustand state management
└── types/                 # TypeScript type definitions

tests/
├── unit/                  # Vitest unit tests
└── e2e/                   # Playwright E2E tests
```

## Solar Calculations

The app uses the [suncalc](https://github.com/mourner/suncalc) library for accurate solar position calculations:

- **Azimuth**: Compass direction of the sun (0° = North, 90° = East, 180° = South, 270° = West)
- **Altitude**: Angle of the sun above/below the horizon (-90° to +90°)
- **Daylight State**: Day, Golden Hour, or Night based on altitude thresholds

### Insights Rules

The app provides rule-based insights for special solar conditions:

- **Polar Day**: Sun stays above horizon all day (midnight sun)
- **Polar Night**: Sun stays below horizon all day
- **High Latitude Winter**: Short daylight at latitudes ≥55° with <8h day length
- **Near Equator**: Minimal seasonal variation at latitudes ≤10°
- **Long Summer Day**: Extended daylight at latitudes ≥45° with >15h day length

## Testing

### Unit Tests

```bash
npm test                 # Run all unit tests
npm run test:watch       # Run in watch mode
npm run test:coverage    # Run with coverage report
```

### E2E Tests

```bash
npm run test:e2e         # Run all E2E tests
npm run test:e2e:ui      # Run with Playwright UI
```

## Accessibility

This application is designed with accessibility in mind:

- **Keyboard Navigation**: All interactive elements are keyboard accessible
- **Screen Readers**: ARIA labels and landmarks for screen reader users
- **Skip Links**: Quick navigation to main content areas
- **Color Contrast**: WCAG 2.1 AA compliant color ratios
- **Focus Management**: Clear focus indicators throughout

## Browser Support

- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

- Solar calculations by [mourner/suncalc](https://github.com/mourner/suncalc)
- Map tiles by [OpenStreetMap](https://www.openstreetmap.org/) contributors
- Geocoding by [Nominatim](https://nominatim.org/)
