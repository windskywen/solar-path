'use client';

import { Suspense, useEffect } from 'react';
import { MapPanel } from '@/components/map/MapPanel';
import { SolarRaysLayer, SolarRaysLegend } from '@/components/map/SolarRaysLayer';
import { LocationInput } from '@/components/location/LocationInput';
import { DatePicker } from '@/components/date';
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
import { getTimezoneFromCoordinates } from '@/lib/utils/timezone';

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

  // Auto-update timezone when location changes
  useEffect(() => {
    if (location) {
      const locationTimezone = getTimezoneFromCoordinates(location.lat, location.lng);
      setTimezone(locationTimezone);
    }
  }, [location, setTimezone]);

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
          className="lg:w-1/2 h-[40vh] lg:h-full relative bg-slate-100 dark:bg-slate-800"
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
          className="lg:w-1/2 flex-1 lg:flex-none overflow-y-auto bg-slate-50 dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 focus:outline-none"
          aria-label="Solar data and controls"
        >
          <Suspense fallback={<DataSkeleton />}>
            <div className="p-4 space-y-6 max-w-3xl mx-auto">
              {/* Configuration Card */}
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">⚙️</span>
                  <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                    Configuration
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Location Input Section */}
                  <section aria-labelledby="location-heading" className="space-y-2">
                    <label
                      id="location-heading"
                      className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide"
                    >
                      Location
                    </label>
                    <LocationInput />
                  </section>

                  {/* Date Picker Section */}
                  <section aria-labelledby="date-heading" className="space-y-2">
                    <label
                      id="date-heading"
                      className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide"
                    >
                      Date &amp; Time
                    </label>
                    <div className="space-y-3">
                      <DatePicker />
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <span>🌐</span>
                        <span>Timezone: {timezone}</span>
                      </div>
                    </div>
                  </section>
                </div>
              </div>


              {/* Combined Section 1: Daily Events & Charts */}
              <section
                aria-labelledby="overview-heading"
                className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden"
              >
                <div className="p-5 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📊</span>
                    <h2
                      id="overview-heading"
                      className="text-base font-semibold text-slate-900 dark:text-white"
                    >
                      Solar Overview
                    </h2>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 xl:grid-cols-3 divide-y xl:divide-y-0 xl:divide-x divide-slate-100 dark:divide-slate-800">
                  {/* Daily Events (Left/Top) */}
                  <div className="p-5 xl:col-span-1 flex flex-col">
                    <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-4">
                      Daily Events
                    </h3>
                    <SunEventsPanel events={solarData?.events ?? null} timezone={timezone} className="flex-1" />
                  </div>

                  {/* Charts (Right/Bottom) */}
                  <div className="p-5 xl:col-span-2">
                    <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-4">
                      Charts
                    </h3>
                    {solarData ? (
                      <ChartsPanel
                        positions={solarData.hourly}
                        selectedHour={selectedHour}
                        onHourClick={setSelectedHour}
                        className="bg-slate-50 dark:bg-slate-800/50"
                      />
                    ) : (
                      <div className="h-64 flex flex-col items-center justify-center text-center border border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
                        <span className="text-2xl mb-2">📈</span>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">
                          Select a location to view charts
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* Combined Section 2: Selected Hour & Hourly Data */}
              <section
                aria-labelledby="details-heading"
                className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden"
              >
                <div className="p-5 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📋</span>
                    <h2
                      id="details-heading"
                      className="text-base font-semibold text-slate-900 dark:text-white"
                    >
                      Detailed Data
                    </h2>
                  </div>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {/* Selected Hour Metrics */}
                  <div className="p-5">
                    <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-4">
                      Selected Hour
                    </h3>
                    <MetricsPanel position={selectedPosition} />
                  </div>

                  {/* Hourly Data Table */}
                  <div>
                    <div className="px-5 py-3 bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                      <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                        Hourly Breakdown
                      </h3>
                    </div>
                    {solarData ? (
                      <SolarDataTable
                        positions={solarData.hourly}
                        selectedHour={selectedHour}
                        onRowClick={setSelectedHour}
                        timezone={timezone}
                        className="border-0 rounded-none shadow-none"
                      />
                    ) : (
                      <div className="p-8 flex flex-col items-center justify-center text-center">
                        <p className="text-slate-500 dark:text-slate-400 text-sm">No data available</p>
                      </div>
                    )}
                  </div>
                </div>
              </section>


              {/* Insights Section */}
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-xl shadow-sm border border-indigo-100 dark:border-indigo-800/50 p-5">
                <InsightsPanel insights={insights} />
              </div>
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
