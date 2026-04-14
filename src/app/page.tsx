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

function formatDisplayDate(dateISO: string): string {
  try {
    return new Date(`${dateISO}T12:00:00`).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateISO;
  }
}

/**
 * Loading skeleton for the map panel
 */
function MapSkeleton() {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.04]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(125,211,252,0.18),transparent_42%),linear-gradient(180deg,rgba(8,15,30,0.94),rgba(2,6,23,0.9))]" />
      <div className="relative flex flex-col items-center gap-3 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full border border-sky-300/25 bg-sky-400/10 shadow-[0_0_36px_rgba(56,189,248,0.18)]">
          <div className="h-6 w-6 animate-pulse rounded-full bg-sky-200/70" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-100">Loading map...</p>
          <p className="text-xs text-slate-400">Calibrating the daylight canvas</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Loading skeleton for the data panel
 */
function DataSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-20 rounded-[28px] border border-white/10 bg-white/[0.04]" />
      <div className="h-56 rounded-[28px] border border-white/10 bg-white/[0.04]" />
      <div className="h-40 rounded-[28px] border border-white/10 bg-white/[0.04]" />
      <div className="h-72 rounded-[28px] border border-white/10 bg-white/[0.04]" />
    </div>
  );
}

/**
 * Main application page
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

  const displayDate = formatDisplayDate(dateISO);
  const displayTimezone = timezone.replace('_', ' ');
  const locationName = location?.name || 'No location selected';
  const locationSource =
    location?.source === 'gps'
      ? 'GPS lock'
      : location?.source === 'manual'
        ? 'Manual coordinates'
        : location?.source === 'search'
          ? 'Search result'
          : 'Set a location';
  const selectedStatus = selectedPosition
    ? `${selectedPosition.localTimeLabel} · ${selectedPosition.daylightState}`
    : 'Choose a ray or row';
  const daylightSummary =
    solarData?.events?.dayLengthLabel ||
    solarData?.events?.dayLengthFormatted ||
    'Awaiting solar data';

  const glassPanel =
    'relative overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.045] shadow-[0_28px_90px_rgba(2,6,23,0.5)] backdrop-blur-2xl';
  const railPanel =
    'relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.045] shadow-[0_20px_70px_rgba(2,6,23,0.42)] backdrop-blur-xl';
  const insetPanel =
    'rounded-[24px] border border-white/10 bg-slate-950/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl';
  const eyebrow = 'text-[0.64rem] font-semibold uppercase tracking-[0.32em] text-sky-200/72';
  const capsule =
    'inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[0.68rem] font-medium text-slate-200 backdrop-blur-xl';
  const statCard =
    'rounded-[22px] border border-white/10 bg-slate-950/40 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]';

  return (
    <div className="solar-main-shell relative min-h-screen">
      {/* Skip Links for keyboard navigation */}
      <SkipLinks
        links={[
          { targetId: 'main-content', label: 'Skip to main content' },
          { targetId: 'solar-data', label: 'Skip to solar data panel' },
        ]}
      />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-screen-2xl flex-col px-3 pb-4 sm:px-4 lg:px-6">
        {/* Header */}
        <header className="sticky top-0 z-30 py-3 sm:py-4">
          <div className={`${glassPanel} px-4 py-3 sm:px-5`}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className={eyebrow}>Solar mission control</p>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-lg font-semibold tracking-[-0.02em] text-white sm:text-xl lg:text-2xl">
                    Solar Path Tracker
                  </h1>
                  <span className="hidden h-1.5 w-1.5 rounded-full bg-sky-300/70 sm:inline-block" />
                  <p className="text-sm text-slate-300">
                    Visualize the sun&apos;s journey across the sky
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 sm:justify-end">
                <span className={capsule}>
                  <span className="text-slate-400">Date</span>
                  <span>{displayDate}</span>
                </span>
                <span className={capsule}>
                  <span className="text-slate-400">Timezone</span>
                  <span className="truncate">{displayTimezone}</span>
                </span>
                <span className={`${capsule} hidden lg:inline-flex`}>
                  <span className="text-slate-400">Focus</span>
                  <span>{selectedStatus}</span>
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Hero + controls */}
        <section className="pb-4 sm:pb-6">
          <div className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
            <div className={`${glassPanel} px-4 py-5 sm:px-6 sm:py-6`}>
              <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top_left,rgba(125,211,252,0.22),transparent_48%),radial-gradient(circle_at_top_right,rgba(250,204,21,0.14),transparent_38%)]" />

              <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(260px,0.8fr)]">
                <div className="space-y-5">
                  <p className={eyebrow}>Cinematic daylight atlas</p>
                  <div className="space-y-3">
                    <h2 className="max-w-3xl text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl lg:text-[3.75rem] lg:leading-[0.95]">
                      Track the sun with a live atmospheric workspace.
                    </h2>
                    <p className="max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                      Search a place, lock a date, and inspect solar bearings, altitude, and
                      daylight rhythm from one dark-glass control deck tuned to the 3D experience.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2.5">
                    <span className={capsule}>
                      <span className="text-slate-400">Location</span>
                      <span>{locationSource}</span>
                    </span>
                    <span className={capsule}>
                      <span className="text-slate-400">Daylight</span>
                      <span>{daylightSummary}</span>
                    </span>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                  <div className={statCard}>
                    <p className={eyebrow}>Current place</p>
                    <p className="mt-2 truncate text-base font-semibold text-white">{locationName}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {location
                        ? `${location.lat.toFixed(3)}°, ${location.lng.toFixed(3)}°`
                        : 'Search, paste coordinates, or use GPS'}
                    </p>
                  </div>

                  <div className={statCard}>
                    <p className={eyebrow}>Selected focus</p>
                    <p className="mt-2 text-base font-semibold text-white">
                      {selectedPosition ? selectedPosition.localTimeLabel : 'No hour pinned'}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {selectedPosition
                        ? `${selectedPosition.azimuthDeg.toFixed(0)}° azimuth · ${selectedPosition.altitudeDeg.toFixed(1)}° altitude`
                        : 'Tap the map or hourly rail to inspect a solar moment'}
                    </p>
                  </div>

                  <div className={statCard}>
                    <p className={eyebrow}>Solar profile</p>
                    <p className="mt-2 text-base font-semibold text-white">{displayDate}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {solarData?.events?.dayLengthHours !== undefined &&
                      solarData?.events?.dayLengthHours !== null
                        ? `${Math.round((solarData.events.dayLengthHours / 24) * 100)}% daylight coverage`
                        : 'Waiting for the daily sun events'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className={`${glassPanel} px-4 py-4 sm:px-5 sm:py-5`}>
              <div className="grid gap-4">
                <div className={`${insetPanel} p-4 sm:p-5`}>
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <p className={eyebrow}>Location studio</p>
                      <h2 className="mt-2 text-lg font-semibold tracking-[-0.02em] text-white">
                        Set the observation point
                      </h2>
                    </div>
                    <span className="hidden rounded-full border border-sky-300/20 bg-sky-400/10 px-3 py-1 text-[0.68rem] font-medium text-sky-100 sm:inline-flex">
                      GPS, search, or coordinates
                    </span>
                  </div>
                  <LocationInput className="!space-y-3" />
                </div>

                <div className={`${insetPanel} p-4 sm:p-5`}>
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <p className={eyebrow}>Temporal controls</p>
                      <h2 className="mt-2 text-lg font-semibold tracking-[-0.02em] text-white">
                        Tune the solar timeline
                      </h2>
                    </div>
                    <span className="hidden rounded-full border border-amber-300/20 bg-amber-400/10 px-3 py-1 text-[0.68rem] font-medium text-amber-100 sm:inline-flex">
                      {displayTimezone}
                    </span>
                  </div>
                  <DatePicker className="w-full" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Main content */}
        <main
          id="main-content"
          tabIndex={-1}
          className="grid flex-1 gap-4 focus:outline-none xl:grid-cols-[minmax(0,1.16fr)_minmax(360px,0.84fr)] xl:items-start"
        >
          {/* Map panel */}
          <section
            className={`${glassPanel} flex min-h-[420px] flex-col p-3 sm:p-4 xl:sticky xl:top-24 xl:h-[calc(100vh-7.5rem)]`}
            aria-label="Solar path map"
          >
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className={eyebrow}>Sky atlas</p>
                <h2 className="mt-2 text-xl font-semibold tracking-[-0.02em] text-white sm:text-2xl">
                  Live solar bearings
                </h2>
                <p className="mt-1 text-sm text-slate-300">
                  Tap rays or browse the hourly breakdown to pin any moment of the day.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-300">
                <p className="text-[0.64rem] font-semibold uppercase tracking-[0.28em] text-sky-200/72">
                  Active focus
                </p>
                <p className="mt-2 font-medium text-white">
                  {selectedPosition ? selectedPosition.localTimeLabel : 'Map ready for exploration'}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {selectedPosition
                    ? `${selectedPosition.daylightState} · ${selectedPosition.azimuthDeg.toFixed(0)}° azimuth`
                    : 'Select a visible ray to surface detailed solar metrics'}
                </p>
              </div>
            </div>

            <div className="relative flex-1 overflow-hidden rounded-[26px] border border-white/10 bg-[#06101d]/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
              <Suspense fallback={<MapSkeleton />}>
                <MapPanel className="h-full w-full">
                  {location && solarData && (
                    <SolarRaysLayer
                      location={location}
                      positions={solarData.hourly}
                      selectedHour={selectedHour}
                      onRayClick={setSelectedHour}
                    />
                  )}
                </MapPanel>
                <SolarRaysLegend className="absolute bottom-3 left-3 z-10 sm:bottom-5 sm:left-5" />
              </Suspense>
            </div>
          </section>

          {/* Data rail */}
          <div
            id="solar-data"
            className="space-y-4 focus:outline-none xl:pr-1"
          >
            <Suspense fallback={<DataSkeleton />}>
              <section aria-labelledby="overview-heading" className={railPanel}>
                <div className="border-b border-white/10 px-4 pb-4 pt-4 sm:px-5 sm:pt-5">
                  <p className={eyebrow}>Overview deck</p>
                  <h2
                    id="overview-heading"
                    className="mt-2 text-lg font-semibold tracking-[-0.02em] text-white sm:text-xl"
                  >
                    Daily solar overview
                  </h2>
                  <p className="mt-1 text-sm text-slate-300">
                    Sunrise, sunset, and azimuth-altitude curves for the selected day.
                  </p>
                </div>

                <div className="space-y-5 p-4 sm:p-5">
                  <SunEventsPanel events={solarData?.events ?? null} timezone={timezone} />

                  {solarData ? (
                    <ChartsPanel
                      positions={solarData.hourly}
                      selectedHour={selectedHour}
                      onHourClick={setSelectedHour}
                    />
                  ) : (
                    <div className="flex h-44 flex-col items-center justify-center rounded-[24px] border border-dashed border-white/10 bg-slate-950/30 px-6 text-center">
                      <span className="text-3xl">📈</span>
                      <p className="mt-3 text-sm font-medium text-white">
                        Select a location to view charts
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        The curve deck will populate once the solar profile is ready.
                      </p>
                    </div>
                  )}
                </div>
              </section>

              <section aria-labelledby="metrics-heading" className={railPanel}>
                <div className="border-b border-white/10 px-4 pb-4 pt-4 sm:px-5 sm:pt-5">
                  <p className={eyebrow}>Precision metrics</p>
                  <h2
                    id="metrics-heading"
                    className="mt-2 text-lg font-semibold tracking-[-0.02em] text-white sm:text-xl"
                  >
                    Selected hour
                  </h2>
                  <p className="mt-1 text-sm text-slate-300">
                    Azimuth, altitude, and daylight state for the pinned solar moment.
                  </p>
                </div>

                <div className="p-4 sm:p-5">
                  <MetricsPanel position={selectedPosition} />
                </div>
              </section>

              <section className={`${railPanel} border-sky-300/12 bg-[linear-gradient(180deg,rgba(14,165,233,0.12),rgba(255,255,255,0.04))]`}>
                <div className="p-4 sm:p-5">
                  <InsightsPanel insights={insights} />
                </div>
              </section>

              <section
                aria-labelledby="details-heading"
                className={`${railPanel} flex flex-col overflow-hidden`}
              >
                <div className="border-b border-white/10 px-4 pb-4 pt-4 sm:px-5 sm:pt-5">
                  <p className={eyebrow}>Hourly rail</p>
                  <h2
                    id="details-heading"
                    className="mt-2 text-lg font-semibold tracking-[-0.02em] text-white sm:text-xl"
                  >
                    Hourly breakdown
                  </h2>
                  <p className="mt-1 text-sm text-slate-300">
                    Browse the full day to compare each solar angle and daylight state.
                  </p>
                </div>

                <div className="max-h-[430px] overflow-y-auto xl:max-h-none">
                  {solarData ? (
                    <SolarDataTable
                      positions={solarData.hourly}
                      selectedHour={selectedHour}
                      onRowClick={setSelectedHour}
                      timezone={timezone}
                      className="border-0 rounded-none shadow-none"
                    />
                  ) : (
                    <div className="flex h-56 flex-col items-center justify-center px-6 text-center">
                      <p className="text-sm font-medium text-white">No data available</p>
                      <p className="mt-1 text-xs text-slate-400">
                        Add a location to generate the hourly solar table.
                      </p>
                    </div>
                  )}
                </div>
              </section>
            </Suspense>
          </div>
        </main>

        {/* Footer */}
        <footer className="mt-4 pb-2">
          <div className="rounded-[24px] border border-white/10 bg-white/[0.04] px-4 py-3 text-center text-[11px] text-slate-400 backdrop-blur-xl">
            Solar calculations powered by{' '}
            <a
              href="https://github.com/mourner/suncalc"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-100 underline decoration-sky-200/40 underline-offset-4 transition-colors hover:text-white"
            >
              SunCalc
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}
