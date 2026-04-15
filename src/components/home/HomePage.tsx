'use client';

import Link from 'next/link';
import { Suspense, useEffect } from 'react';
import { MapPanel } from '@/components/map/MapPanel';
import { SolarRaysLayer, SolarRaysLegend } from '@/components/map/SolarRaysLayer';
import { LocationInput } from '@/components/location/LocationInput';
import { DatePicker } from '@/components/date';
import { SunEventsPanel, InsightsPanel } from '@/components/insights';
import { SolarDataTable, MetricsPanel } from '@/components/data';
import { ChartsPanel } from '@/components/charts';
import { ThemeSwitcher } from '@/components/theme/ThemeSwitcher';
import { SidebarAdPanel } from '@/components/ads/SidebarAdPanel';
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
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-[28px] border [border-color:var(--solar-glass-border)] [background:var(--solar-surface-soft-bg)]">
      <div className="absolute inset-0 [background:var(--solar-map-bg)]" />
      <div className="relative flex flex-col items-center gap-3 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full border border-sky-300/25 bg-sky-400/10 shadow-[0_0_36px_rgba(56,189,248,0.18)]">
          <div className="h-6 w-6 animate-pulse rounded-full bg-sky-200/70" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-[var(--solar-text-strong)]">Loading map...</p>
          <p className="text-xs text-[var(--solar-text-muted)]">Calibrating the daylight canvas</p>
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
      <div className="h-20 rounded-[28px] border [border-color:var(--solar-glass-border)] [background:var(--solar-surface-soft-bg)]" />
      <div className="h-56 rounded-[28px] border [border-color:var(--solar-glass-border)] [background:var(--solar-surface-soft-bg)]" />
      <div className="h-40 rounded-[28px] border [border-color:var(--solar-glass-border)] [background:var(--solar-surface-soft-bg)]" />
      <div className="h-72 rounded-[28px] border [border-color:var(--solar-glass-border)] [background:var(--solar-surface-soft-bg)]" />
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
    'relative overflow-hidden rounded-[30px] border [border-color:var(--solar-glass-border)] [background:var(--solar-glass-bg)] [box-shadow:var(--solar-glass-shadow)] backdrop-blur-2xl';
  const railPanel =
    'relative overflow-hidden rounded-[28px] border [border-color:var(--solar-glass-border)] [background:var(--solar-rail-bg)] [box-shadow:var(--solar-rail-shadow)] backdrop-blur-xl';
  const insetPanel =
    'rounded-[24px] border [border-color:var(--solar-inset-border)] [background:var(--solar-inset-bg)] [box-shadow:var(--solar-inset-shadow)] backdrop-blur-xl';
  const eyebrow =
    'text-[0.64rem] font-semibold uppercase tracking-[0.32em] text-[var(--solar-kicker)]';
  const capsule =
    'inline-flex items-center gap-2 rounded-full border [border-color:var(--solar-pill-border)] [background:var(--solar-pill-bg)] px-3 py-1.5 text-[0.68rem] font-medium text-[var(--solar-pill-text)] backdrop-blur-xl';
  const focusedToolLinks = [
    {
      href: '/sunrise-sunset-calculator',
      label: 'Sunrise & Sunset Calculator',
      description: 'Check first light, last light, and daylight length with the map and hourly solar timeline.',
    },
    {
      href: '/golden-hour-calculator',
      label: 'Golden Hour Calculator',
      description: 'Plan soft-light shooting windows with golden-hour timing, sun direction, and 3D daylight context.',
    },
    {
      href: '/solar-azimuth-altitude',
      label: 'Solar Azimuth & Altitude Calculator',
      description: 'Measure solar angles for facade studies, outdoor comfort, and solar panel planning.',
    },
  ] as const;

  return (
    <>
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
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center">
              <div className="min-w-0 space-y-1">
                <p className={eyebrow}>Solar mission control</p>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-lg font-semibold tracking-[-0.02em] text-[var(--solar-text-strong)] sm:text-xl lg:text-2xl">
                    Solar Path Tracker
                  </p>
                  <span className="hidden h-1.5 w-1.5 rounded-full bg-sky-300/70 sm:inline-block" />
                  <p className="text-sm text-[var(--solar-text)]">
                    Visualize the sun&apos;s journey across the sky
                  </p>
                </div>
              </div>

              <ThemeSwitcher className="justify-self-center" />

              <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-self-end sm:justify-end">
                <span className={capsule}>
                  <span className="text-[var(--solar-pill-muted)]">Date</span>
                  <span>{displayDate}</span>
                </span>
                <span className={capsule}>
                  <span className="text-[var(--solar-pill-muted)]">Timezone</span>
                  <span className="truncate">{displayTimezone}</span>
                </span>
                <span className={`${capsule} hidden lg:inline-flex`}>
                  <span className="text-[var(--solar-pill-muted)]">Focus</span>
                  <span>{selectedStatus}</span>
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Hero + controls */}
        <section className="pb-4 sm:pb-6">
          <div className="grid gap-4 xl:grid-cols-[minmax(300px,0.68fr)_minmax(0,1.32fr)]">
            <div className={`${glassPanel} px-4 py-5 sm:px-6 sm:py-6`}>
              <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top_left,rgba(125,211,252,0.22),transparent_48%),radial-gradient(circle_at_top_right,rgba(250,204,21,0.14),transparent_38%)]" />

              <div className="relative space-y-5">
                <p className={eyebrow}>Cinematic daylight atlas</p>
                <div className="space-y-3">
                  <h1 className="max-w-3xl text-3xl font-semibold tracking-[-0.04em] text-[var(--solar-text-strong)] sm:text-4xl lg:text-[3.75rem] lg:leading-[0.95]">
                    Sun path map and solar tracker for any location.
                  </h1>
                  <p className="max-w-2xl text-sm leading-6 text-[var(--solar-text)] sm:text-base">
                    Search a place, pick a date, and read sunrise, sunset, golden hour, solar
                    azimuth, altitude, and 3D daylight views from one live map.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  <span className={capsule}>
                    <span className="text-[var(--solar-pill-muted)]">Location</span>
                    <span>{locationSource}</span>
                  </span>
                  <span className={capsule}>
                    <span className="text-[var(--solar-pill-muted)]">Daylight</span>
                    <span>{daylightSummary}</span>
                  </span>
                </div>

                <p className="max-w-xl text-xs uppercase tracking-[0.28em] text-[var(--solar-text-faint)] sm:text-[0.7rem]">
                  Compare daylight. Plan faster. Keep the map front and center.
                </p>
              </div>
            </div>

            <div className={`${glassPanel} overflow-visible px-4 py-4 sm:px-5 sm:py-5 lg:px-6`}>
              <div className="grid gap-4">
                <div className={`${insetPanel} relative z-20 p-4 sm:p-5`}>
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <p className={eyebrow}>Location studio</p>
                      <h2 className="mt-2 text-lg font-semibold tracking-[-0.02em] text-[var(--solar-text-strong)]">
                        Set the observation point
                      </h2>
                    </div>
                    <span className="hidden rounded-full border px-3 py-1 text-[0.68rem] font-medium [border-color:var(--solar-input-focus-border)] [background:var(--solar-accent-soft)] text-[var(--solar-text-strong)] sm:inline-flex">
                      GPS, search, or coordinates
                    </span>
                  </div>
                  <LocationInput className="!space-y-3" />
                </div>

                <div className={`${insetPanel} relative z-10 p-4 sm:p-5`}>
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <p className={eyebrow}>Temporal controls</p>
                      <h2 className="mt-2 text-lg font-semibold tracking-[-0.02em] text-[var(--solar-text-strong)]">
                        Tune the solar timeline
                      </h2>
                    </div>
                    <span className="hidden rounded-full border [border-color:var(--solar-warning-border)] [background:var(--solar-warning-bg)] px-3 py-1 text-[0.68rem] font-medium text-[var(--solar-warning-text)] sm:inline-flex">
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
                <h2 className="mt-2 text-xl font-semibold tracking-[-0.02em] text-[var(--solar-text-strong)] sm:text-2xl">
                  Live solar bearings
                </h2>
                <p className="mt-1 text-sm text-[var(--solar-text)]">
                  Tap rays or browse the hourly breakdown to pin any moment of the day.
                </p>
              </div>

              <div className="rounded-2xl border [border-color:var(--solar-surface-border)] [background:var(--solar-surface-bg)] px-4 py-3 text-sm text-[var(--solar-text)] [box-shadow:var(--solar-surface-inset-shadow)]">
                <p className="text-[0.64rem] font-semibold uppercase tracking-[0.28em] text-[var(--solar-kicker)]">
                  Active focus
                </p>
                <p className="mt-2 font-medium text-[var(--solar-text-strong)]">
                  {selectedPosition ? selectedPosition.localTimeLabel : 'Map ready for exploration'}
                </p>
                <p className="mt-1 text-xs text-[var(--solar-text-muted)]">
                  {selectedPosition
                    ? `${selectedPosition.daylightState} · ${selectedPosition.azimuthDeg.toFixed(0)}° azimuth`
                    : 'Select a visible ray to surface detailed solar metrics'}
                </p>
              </div>
            </div>

            <div className="relative flex-1 overflow-hidden rounded-[26px] border [border-color:var(--solar-map-frame-border)] [background:var(--solar-map-frame-bg)] [box-shadow:var(--solar-map-frame-shadow)]">
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
                <SolarRaysLegend className="absolute bottom-2 left-2 z-10 sm:bottom-5 sm:left-5" />
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
                <div className="border-b [border-color:var(--solar-divider)] px-4 pb-4 pt-4 sm:px-5 sm:pt-5">
                  <p className={eyebrow}>Overview deck</p>
                  <h2
                    id="overview-heading"
                    className="mt-2 text-lg font-semibold tracking-[-0.02em] text-[var(--solar-text-strong)] sm:text-xl"
                  >
                    Daily solar overview
                  </h2>
                  <p className="mt-1 text-sm text-[var(--solar-text)]">
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
                      <div className="flex h-44 flex-col items-center justify-center rounded-[24px] border border-dashed [border-color:var(--solar-empty-border)] [background:var(--solar-empty-bg)] px-6 text-center">
                        <span className="text-3xl">📈</span>
                        <p className="mt-3 text-sm font-medium text-[var(--solar-text-strong)]">
                          Select a location to view charts
                        </p>
                        <p className="mt-1 text-xs text-[var(--solar-text-muted)]">
                          The curve deck will populate once the solar profile is ready.
                        </p>
                      </div>
                  )}
                </div>
              </section>

              <section aria-labelledby="metrics-heading" className={railPanel}>
                <div className="border-b [border-color:var(--solar-divider)] px-4 pb-4 pt-4 sm:px-5 sm:pt-5">
                  <p className={eyebrow}>Precision metrics</p>
                  <h2
                    id="metrics-heading"
                    className="mt-2 text-lg font-semibold tracking-[-0.02em] text-[var(--solar-text-strong)] sm:text-xl"
                  >
                    Selected hour
                  </h2>
                  <p className="mt-1 text-sm text-[var(--solar-text)]">
                    Azimuth, altitude, and daylight state for the pinned solar moment.
                  </p>
                </div>

                <div className="p-4 sm:p-5">
                  <MetricsPanel position={selectedPosition} />
                </div>
              </section>

              <section
                className={`${railPanel} [background:linear-gradient(180deg,var(--solar-accent-soft),var(--solar-rail-bg))] [border-color:var(--solar-glass-border)]`}
              >
                <div className="p-4 sm:p-5">
                  <InsightsPanel insights={insights} />
                </div>
              </section>

              <section
                aria-labelledby="details-heading"
                className={`${railPanel} flex flex-col overflow-hidden`}
              >
                <div className="border-b [border-color:var(--solar-divider)] px-4 pb-4 pt-4 sm:px-5 sm:pt-5">
                  <p className={eyebrow}>Hourly rail</p>
                  <h2
                    id="details-heading"
                    className="mt-2 text-lg font-semibold tracking-[-0.02em] text-[var(--solar-text-strong)] sm:text-xl"
                  >
                    Hourly breakdown
                  </h2>
                  <p className="mt-1 text-sm text-[var(--solar-text)]">
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
                        <p className="text-sm font-medium text-[var(--solar-text-strong)]">
                          No data available
                        </p>
                        <p className="mt-1 text-xs text-[var(--solar-text-muted)]">
                          Add a location to generate the hourly solar table.
                        </p>
                      </div>
                  )}
                </div>
              </section>

              <SidebarAdPanel className={railPanel} />
            </Suspense>
          </div>
        </main>

        <section className="mt-4 pb-2" aria-labelledby="how-it-works-heading">
          <div className={`${glassPanel} px-4 py-5 sm:px-6 sm:py-6`}>
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)]">
              <section className={`${insetPanel} p-4 sm:p-5`} aria-labelledby="how-it-works-heading">
                <p className={eyebrow}>How it works</p>
                <h2
                  id="how-it-works-heading"
                  className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[var(--solar-text-strong)]"
                >
                  How it works
                </h2>
                <div className="mt-4 space-y-4 text-sm leading-6 text-[var(--solar-text)] sm:text-base">
                  <p>
                    Use Solar Path Tracker to read azimuth, altitude, and daylight behavior before
                    you build, buy, film, or install.
                  </p>
                  <p>
                    Start by searching a place, using your device&apos;s GPS, or entering manual
                    coordinates. Solar Path Tracker then computes the Sun&apos;s hourly position for
                    the selected date so you can read the daylight pattern on the live map, in the
                    charts, and inside the Hourly breakdown.
                  </p>
                  <p>
                    <strong className="text-[var(--solar-text-strong)]">Azimuth</strong> describes
                    the compass direction of the Sun, which is useful when you want to compare east
                    light, south exposure, or harsh west-facing afternoon conditions.{' '}
                    <strong className="text-[var(--solar-text-strong)]">Altitude</strong> measures
                    how high the Sun sits above the horizon, helping you estimate glare, shadow
                    length, and seasonal solar intensity.
                  </p>
                  <p>
                    The 3D view and hourly table make it easier to cross-check the same solar data
                    from two perspectives: a fast visual path for exploration, and a precise set of
                    values for decision-making. That is especially useful when comparing Golden Hour
                    timing, winter sun angles, or all-day exposure on a facade, roof, or outdoor
                    scene.
                  </p>
                </div>
              </section>

              <div className="grid gap-4">
                <section className={`${insetPanel} p-4 sm:p-5`} aria-labelledby="use-cases-heading">
                  <p className={eyebrow}>Use cases</p>
                  <h2
                    id="use-cases-heading"
                    className="mt-2 text-xl font-semibold tracking-[-0.02em] text-[var(--solar-text-strong)]"
                  >
                    Use cases
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-[var(--solar-text)]">
                    Who uses Solar Path Tracker to evaluate daylight, Golden Hour, and solar
                    exposure?
                  </p>
                  <ul className="mt-4 space-y-3 text-sm leading-6 text-[var(--solar-text)]">
                    <li>
                      <strong className="text-[var(--solar-text-strong)]">Real-estate buyers:</strong>{' '}
                      evaluate orientation, morning light, and west-sun heat before committing to a
                      home.
                    </li>
                    <li>
                      <strong className="text-[var(--solar-text-strong)]">Solar panel planning:</strong>{' '}
                      compare seasonal daylight hours and the best installation angle for a site.
                    </li>
                    <li>
                      <strong className="text-[var(--solar-text-strong)]">Photographers and architects:</strong>{' '}
                      predict Golden Hour, shadow direction, and facade exposure for schedules and
                      designs.
                    </li>
                    <li>
                      <strong className="text-[var(--solar-text-strong)]">General daylight research:</strong>{' '}
                      understand how azimuth and altitude shift across the calendar before a field
                      visit.
                    </li>
                  </ul>
                </section>

                <section className={`${insetPanel} p-4 sm:p-5`} aria-labelledby="focused-tools-heading">
                  <p className={eyebrow}>Focused tools</p>
                  <h2
                    id="focused-tools-heading"
                    className="mt-2 text-xl font-semibold tracking-[-0.02em] text-[var(--solar-text-strong)]"
                  >
                    Explore focused solar calculators
                  </h2>
                  <p className="mt-4 text-sm leading-6 text-[var(--solar-text)]">
                    Jump into dedicated pages for sunrise and sunset, golden hour, and solar angle
                    planning, then return to the live map when you need the full picture.
                  </p>
                  <div className="mt-4 grid gap-3">
                    {focusedToolLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="rounded-[20px] border [border-color:var(--solar-surface-border)] [background:var(--solar-surface-bg)] p-4 [box-shadow:var(--solar-surface-inset-shadow)] transition-colors hover:border-sky-300/35 hover:text-[var(--solar-text-strong)]"
                      >
                        <p className="text-sm font-semibold text-[var(--solar-text-strong)]">
                          {link.label}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-[var(--solar-text)]">
                          {link.description}
                        </p>
                        <span className="mt-3 inline-flex text-xs font-medium text-[var(--solar-accent)]">
                          Open page -&gt;
                        </span>
                      </Link>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
