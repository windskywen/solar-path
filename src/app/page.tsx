'use client';

import { Suspense, useEffect } from 'react';
import { MapPanel } from '@/components/map/MapPanel';
import { SolarRaysLayer, SolarRaysLegend } from '@/components/map/SolarRaysLayer';
import { LocationInput } from '@/components/location/LocationInput';
import { DatePicker, TimezoneSelector } from '@/components/date';
import { SunEventsPanel, InsightsPanel } from '@/components/insights';
import { SolarDataTable, MetricsPanel } from '@/components/data';
import { ChartsPanel } from '@/components/charts';
import { useSolarData, useSolarPositionForHour } from '@/hooks/useSolarData';
import { useIpGeo } from '@/hooks/useIpGeo';
import {
  useLocation,
  useTimezone,
  useDateISO,
  useSelectedHour,
  useSolarActions,
} from '@/store/solar-store';
import { SkipLinks } from '@/components/a11y';
import { generateInsights } from '@/lib/solar/insights';

/**
 * Loading skeleton for the map panel
 */
function MapSkeleton() {
  return (
    <div className="h-full w-full bg-slate-200 dark:bg-slate-800 animate-pulse flex items-center justify-center">
      <div className="text-slate-400 dark:text-slate-600">Loading map...</div>
    </div>
  );
}

/**
 * Loading skeleton for the data panel
 */
function DataSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
      <div className="h-32 bg-slate-200 dark:bg-slate-700 rounded" />
      <div className="h-24 bg-slate-200 dark:bg-slate-700 rounded" />
      <div className="h-48 bg-slate-200 dark:bg-slate-700 rounded" />
    </div>
  );
}

/**
 * Main application page
 *
 * Implements dual-pane layout per plan.md:
 * - Left pane: Interactive map (60% width on desktop)
 * - Right pane: Solar data, controls, and charts (40% width on desktop)
 * - Mobile: Stacked layout (map on top, data below)
 */
export default function HomePage() {
  const location = useLocation();
  const timezone = useTimezone();
  const dateISO = useDateISO();
  const selectedHour = useSelectedHour();
  const { setLocation, setSelectedHour, setTimezone } = useSolarActions();

  // Get initial location from IP
  const { location: ipLocation, isLoading: ipLoading } = useIpGeo();

  // Set initial location from IP geo on first load
  useEffect(() => {
    if (!location && ipLocation && !ipLoading) {
      setLocation(ipLocation);
    }
  }, [ipLocation, ipLoading, location, setLocation]);

  // Compute solar data
  const solarData = useSolarData();

  // Get selected hour's position for metrics panel
  const selectedPosition = useSolarPositionForHour(selectedHour);

  // Generate insights
  const insights =
    location && solarData
      ? generateInsights(location.lat, solarData.hourly, solarData.events)
      : null;

  return (
    <div className="h-full flex flex-col">
      {/* Skip Links for keyboard navigation */}
      <SkipLinks
        links={[
          { targetId: 'main-content', label: 'Skip to main content' },
          { targetId: 'solar-data', label: 'Skip to solar data panel' },
        ]}
      />

      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
            ☀️ Solar Path Tracker
          </h1>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            Visualize the sun&apos;s journey across the sky
          </div>
        </div>
      </header>

      {/* Main content - dual pane layout */}
      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 flex flex-col lg:flex-row overflow-hidden focus:outline-none"
      >
        {/* Left pane: Map */}
        <section
          className="lg:w-3/5 h-[50vh] lg:h-full relative bg-slate-100 dark:bg-slate-800"
          aria-label="Solar path map"
        >
          <Suspense fallback={<MapSkeleton />}>
            <MapPanel>
              {location && solarData && (
                <SolarRaysLayer
                  location={location}
                  positions={solarData.hourly}
                  selectedHour={selectedHour}
                  onRayClick={setSelectedHour}
                />
              )}
            </MapPanel>
            {/* Map legend */}
            <SolarRaysLegend className="absolute bottom-4 left-4 z-10" />
          </Suspense>
        </section>

        {/* Right pane: Data and controls */}
        <aside
          id="solar-data"
          tabIndex={-1}
          className="lg:w-2/5 flex-1 lg:flex-none overflow-y-auto bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700 focus:outline-none"
          aria-label="Solar data and controls"
        >
          <Suspense fallback={<DataSkeleton />}>
            <div className="p-4 lg:p-6 space-y-6">
              {/* Location Input Section */}
              <section aria-labelledby="location-heading">
                <h2
                  id="location-heading"
                  className="text-lg font-medium text-slate-900 dark:text-white mb-3"
                >
                  Location
                </h2>
                <LocationInput />
              </section>

              {/* Date Picker Section */}
              <section aria-labelledby="date-heading">
                <h2
                  id="date-heading"
                  className="text-lg font-medium text-slate-900 dark:text-white mb-3"
                >
                  Date &amp; Time
                </h2>
                <div className="space-y-4">
                  <DatePicker />
                  <details className="group">
                    <summary className="text-sm text-slate-500 dark:text-slate-400 cursor-pointer hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1">
                      <span className="group-open:rotate-90 transition-transform">▶</span>
                      Advanced: Timezone
                    </summary>
                    <div className="mt-3 pl-4">
                      <TimezoneSelector value={timezone} onChange={setTimezone} dateISO={dateISO} />
                    </div>
                  </details>
                </div>
              </section>

              {/* Selected Hour Metrics Section */}
              <section aria-labelledby="metrics-heading">
                <h2
                  id="metrics-heading"
                  className="text-lg font-medium text-slate-900 dark:text-white mb-3"
                >
                  Selected Hour
                </h2>
                <MetricsPanel position={selectedPosition} />
              </section>

              {/* Sun Events Section */}
              <section aria-labelledby="events-heading">
                <h2
                  id="events-heading"
                  className="text-lg font-medium text-slate-900 dark:text-white mb-3"
                >
                  Sun Events
                </h2>
                <SunEventsPanel events={solarData?.events ?? null} timezone={timezone} />
              </section>

              {/* Hourly Data Table Section */}
              <section aria-labelledby="hourly-heading">
                <h2
                  id="hourly-heading"
                  className="text-lg font-medium text-slate-900 dark:text-white mb-3"
                >
                  Hourly Solar Positions
                </h2>
                {solarData ? (
                  <SolarDataTable
                    positions={solarData.hourly}
                    selectedHour={selectedHour}
                    onRowClick={setSelectedHour}
                    timezone={timezone}
                  />
                ) : (
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 min-h-[200px] flex items-center justify-center">
                    <p className="text-slate-400">Select a location to see solar data</p>
                  </div>
                )}
              </section>

              {/* Solar Charts Section */}
              <section aria-labelledby="charts-heading">
                <h2
                  id="charts-heading"
                  className="text-lg font-medium text-slate-900 dark:text-white mb-3"
                >
                  Solar Charts
                </h2>
                {solarData ? (
                  <ChartsPanel
                    positions={solarData.hourly}
                    selectedHour={selectedHour}
                    onHourClick={setSelectedHour}
                  />
                ) : (
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 min-h-[200px] flex items-center justify-center">
                    <p className="text-slate-400">Select a location to see charts</p>
                  </div>
                )}
              </section>

              {/* Insights Section */}
              <InsightsPanel insights={insights} />
            </div>
          </Suspense>
        </aside>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 px-4 py-2 flex-shrink-0">
        <div className="text-center text-xs text-slate-500 dark:text-slate-400">
          Solar calculations powered by{' '}
          <a
            href="https://github.com/mourner/suncalc"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-slate-700 dark:hover:text-slate-300"
          >
            SunCalc
          </a>
        </div>
      </footer>
    </div>
  );
}
