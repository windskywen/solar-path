'use client';

import Link from 'next/link';
import {
  lazy,
  Suspense,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { MapPanel } from '@/components/map/MapPanel';
import { SolarRaysLayer, SolarRaysLegend } from '@/components/map/SolarRaysLayer';
import { LocationInput } from '@/components/location/LocationInput';
import { DatePicker } from '@/components/date';
import { SunEventsPanel, InsightsPanel } from '@/components/insights';
import { SolarDataTable, MetricsPanel } from '@/components/data';
import { CalculationReportPanel } from '@/components/home/CalculationReportPanel';
import { DeferredChartsPanel } from '@/components/charts/DeferredChartsPanel';
import { AdSenseScript } from '@/components/ads/AdSenseScript';
import { SidebarAdPanel } from '@/components/ads/SidebarAdPanel';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { useSolarData } from '@/hooks/useSolarData';
import { useIpGeo } from '@/hooks/useIpGeo';
import {
  useLocation,
  useTimezone,
  useDateISO,
  useSelectedHour,
  useSolarActions,
} from '@/store/solar-store';
import { SkipLinks } from '@/components/a11y';
import { getTodayISO } from '@/lib/utils/timezone';
import type { HourlySolarPosition, SunEvents } from '@/types/solar';

type Solar3DViewModalModule = typeof import('@/components/solar3d/Solar3DViewModal');
let solar3DViewModalPromise: Promise<Solar3DViewModalModule> | null = null;
let solar3DViewPreloadScheduled = false;

function loadSolar3DViewModal(): Promise<Solar3DViewModalModule> {
  solar3DViewModalPromise ??= import('@/components/solar3d/Solar3DViewModal');
  return solar3DViewModalPromise;
}

function preloadSolar3DViewModal() {
  if (solar3DViewModalPromise || solar3DViewPreloadScheduled) return;
  solar3DViewPreloadScheduled = true;

  // A deliberate hover/focus gets the chunk two frames later. When intent and
  // click happen in the same touch frame, the first frame is reserved for the
  // lightweight shell, preventing cached module evaluation from blocking it.
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      window.setTimeout(() => {
        solar3DViewPreloadScheduled = false;
        void loadSolar3DViewModal();
      }, 300);
    });
  });
}

const Solar3DViewModal = lazy(async () => {
  const loadedModule = await loadSolar3DViewModal();
  return { default: loadedModule.Solar3DViewModal };
});

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

interface Solar3DViewButtonProps {
  disabled: boolean;
  onClick: () => void;
  onPreload: () => void;
}

function Solar3DViewButton({ disabled, onClick, onPreload }: Solar3DViewButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      onPointerEnter={onPreload}
      onFocus={onPreload}
      onTouchStart={onPreload}
      disabled={disabled}
      className="group relative flex min-h-20 w-full items-center gap-3 overflow-hidden rounded-2xl border px-3.5 py-3 text-left text-[var(--solar-cta-text)] [border-color:var(--solar-cta-border)] [background:var(--solar-cta-bg)] [box-shadow:var(--solar-cta-shadow)] transition-all duration-300 hover:-translate-y-0.5 hover:[background:var(--solar-cta-hover-bg)] hover:[box-shadow:var(--solar-cta-hover-shadow)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--solar-bg)] disabled:cursor-not-allowed disabled:[border-color:var(--solar-cta-disabled-border)] disabled:[background:var(--solar-cta-disabled-bg)] disabled:text-[var(--solar-cta-disabled-text)] disabled:shadow-none disabled:hover:translate-y-0 sm:w-[19rem] sm:px-4"
      aria-label="Open 3D solar path view"
      title={disabled ? 'Select a location to enable 3D view' : 'Open 3D View'}
      data-testid="3d-view-button"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 w-28 bg-[radial-gradient(circle_at_center,rgba(250,204,21,0.18),transparent_70%)] opacity-80 transition-opacity group-hover:opacity-100"
      />
      <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl [background:var(--solar-cta-icon-bg)] text-[var(--solar-cta-icon-text)] shadow-[inset_0_1px_0_rgba(255,255,255,0.16)]">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
          <path d="m4.3 7.7 7.7 4.4 7.7-4.4M12 12.1V21" />
          <path d="M8.5 5 16 9.3" />
        </svg>
      </span>
      <span className="relative min-w-0 flex-1">
        <span className="block text-[0.62rem] font-semibold uppercase tracking-[0.25em] text-[var(--solar-cta-kicker)]">
          Explore in depth
        </span>
        <span className="mt-1 block text-base font-semibold tracking-[-0.01em]">
          Open 3D View
        </span>
        <span className="mt-1 block text-xs text-[var(--solar-text-muted)]">
          Explore the sun path in 3D
        </span>
      </span>
      <span
        aria-hidden="true"
        className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 transition-transform duration-300 group-hover:translate-x-0.5"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
      </span>
    </button>
  );
}

function Solar3DLoadingShell({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      onClose();
    };

    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950 p-3" role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="solar-3d-loading-title"
        aria-describedby="solar-3d-loading-description"
        className="flex min-h-[280px] w-full max-w-5xl flex-col rounded-[28px] border p-4 [border-color:var(--solar-glass-border)] [background:var(--solar-glass-bg)] [box-shadow:var(--solar-glass-shadow)] sm:p-5"
        data-testid="3d-loading-shell"
      >
        <div className="flex items-start justify-between gap-4 border-b pb-4 [border-color:var(--solar-divider)]">
          <div>
            <p className="text-[0.64rem] font-semibold uppercase tracking-[0.28em] text-[var(--solar-kicker)]">3D daylight model</p>
            <h2 id="solar-3d-loading-title" className="mt-2 text-xl font-semibold text-[var(--solar-text-strong)]">3D Solar Path View</h2>
            <p id="solar-3d-loading-description" className="mt-2 text-sm text-[var(--solar-text)]">Preparing the interactive 3D scene. The dialog shell is ready while the first-use chunk loads.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            autoFocus
            aria-label="Close 3D view"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-xl text-[var(--solar-text-strong)] [border-color:var(--solar-pill-border)] [background:var(--solar-pill-bg)]"
          >
            ×
          </button>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <span className="mx-auto block h-10 w-10 animate-spin rounded-full border-2 border-sky-300/25 border-t-sky-300" aria-hidden="true" />
            <p className="mt-4 text-sm font-semibold text-[var(--solar-text-strong)]">Loading 3D view…</p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface Solar3DControllerProps {
  disabled: boolean;
  hourly: HourlySolarPosition[];
  events: SunEvents;
}

/**
 * Keep first-use modal state below the home page so opening and closing the 3D
 * viewer does not rerender the map, reports, tables, or charts in the same
 * interaction.
 */
function Solar3DController({ disabled, hourly, events }: Solar3DControllerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const releaseTimerRef = useRef<number | null>(null);

  const cancelRelease = () => {
    if (releaseTimerRef.current === null) return;
    window.clearTimeout(releaseTimerRef.current);
    releaseTimerRef.current = null;
  };

  useEffect(
    () => () => {
      if (releaseTimerRef.current !== null) window.clearTimeout(releaseTimerRef.current);
    },
    []
  );

  useEffect(() => {
    if (!isOpen) return;

    let readyTimer: number | undefined;
    const readyFrame = window.requestAnimationFrame(() => {
      // Keep the lightweight, closable shell through the first presentation.
      // Mount the real viewer later so module evaluation and scene setup cannot
      // extend the opening interaction's next paint.
      readyTimer = window.setTimeout(() => setIsReady(true), 350);
    });

    return () => {
      window.cancelAnimationFrame(readyFrame);
      if (readyTimer !== undefined) window.clearTimeout(readyTimer);
    };
  }, [isOpen]);

  const openViewer = () => {
    cancelRelease();
    setHasRequested(true);
    setIsReady(false);
    setIsOpen(true);
  };

  const handleViewerOpenChange = (nextOpen: boolean) => {
    cancelRelease();
    setIsOpen(nextOpen);
    if (nextOpen) return;

    // Preserve the already-painted closed state for a short grace period, then
    // release WebGL resources and stop any remaining provider work.
    releaseTimerRef.current = window.setTimeout(() => {
      setHasRequested(false);
      setIsReady(false);
      releaseTimerRef.current = null;
    }, 350);
  };

  return (
    <>
      <Solar3DViewButton
        disabled={disabled}
        onPreload={preloadSolar3DViewModal}
        onClick={openViewer}
      />
      {hasRequested ? (
        isOpen && !isReady ? (
          <Solar3DLoadingShell onClose={() => handleViewerOpenChange(false)} />
        ) : (
          <Suspense
            fallback={
              isOpen ? (
                <Solar3DLoadingShell onClose={() => handleViewerOpenChange(false)} />
              ) : null
            }
          >
            <Solar3DViewModal
              open={isOpen}
              onOpenChange={handleViewerOpenChange}
              hourly={hourly}
              events={events}
            />
          </Suspense>
        )
      ) : null}
    </>
  );
}

/**
 * Main application page
 */
interface HomePageProps {
  initialDateISO: string;
}

export default function HomePage({ initialDateISO }: HomePageProps) {
  const location = useLocation();
  const timezone = useTimezone();
  const dateISO = useDateISO();
  const selectedHour = useSelectedHour();
  const { setDateISO, setLocation, setSelectedHour } = useSolarActions();
  const automaticLocationAllowedRef = useRef(true);
  const hasAppliedIpLocationRef = useRef(false);

  // Get initial location from IP
  const {
    location: ipLocation,
    isLoading: ipLoading,
    isDefault: ipIsDefault,
    error: ipError,
  } = useIpGeo();

  const stopAutomaticLocation = useCallback(() => {
    automaticLocationAllowedRef.current = false;
  }, []);

  const selectHour = useCallback(
    (hour: number) => {
      stopAutomaticLocation();
      setSelectedHour(hour);
    },
    [setSelectedHour, stopAutomaticLocation]
  );

  // Refresh an ISR-provided date only after hydration. The first client render
  // still matches the server exactly, so cached pages do not create text
  // hydration errors around midnight or after a long-lived deployment.
  useEffect(() => {
    const currentDateISO = getTodayISO('UTC');
    if (dateISO === initialDateISO && currentDateISO !== initialDateISO) {
      setDateISO(currentDateISO);
    }
  }, [dateISO, initialDateISO, setDateISO]);

  // Replace the server-rendered example with the approximate IP location only
  // while the visitor has not begun working with the tool.
  useEffect(() => {
    if (
      ipLoading ||
      ipIsDefault ||
      hasAppliedIpLocationRef.current ||
      !automaticLocationAllowedRef.current ||
      location?.source !== 'fallback'
    ) {
      return;
    }

    hasAppliedIpLocationRef.current = true;
    setLocation(ipLocation);
  }, [ipIsDefault, ipLoading, ipLocation, location?.source, setLocation]);

  // Compute solar data
  const solarData = useSolarData();
  const deferredSolarData = useDeferredValue(solarData.data);
  const deferredSelectedHour = useDeferredValue(selectedHour);
  const can3DViewOpen = location !== null && solarData.hourly.length > 0;

  // Reuse the dataset already computed above instead of running the solar pipeline again.
  const selectedPosition = useMemo(() => {
    if (selectedHour === null) return undefined;
    return solarData.hourly.find((position) => position.hour === selectedHour);
  }, [selectedHour, solarData.hourly]);
  const insights = location ? solarData.insights : null;

  const displayDate = formatDisplayDate(dateISO);
  const displayTimezone = timezone.replace('_', ' ');
  const locationSource =
    location?.source === 'gps'
      ? 'GPS lock'
      : location?.source === 'manual'
        ? 'Manual coordinates'
        : location?.source === 'search'
          ? 'Search result'
          : location?.source === 'ip'
            ? 'Approximate location'
            : location?.source === 'fallback'
              ? 'Example location · Taipei'
              : 'Set a location';
  const selectedStatus = selectedPosition
    ? `${selectedPosition.localTimeLabel} · ${selectedPosition.daylightState}`
    : 'Choose a ray or row';
  const daylightSummary =
    solarData?.events?.dayLengthLabel ||
    solarData?.events?.dayLengthFormatted ||
    'Awaiting solar data';
  const sunriseSummary = solarData.events.sunriseLocal ?? 'Unavailable';
  const sunsetSummary = solarData.events.sunsetLocal ?? 'Unavailable';
  const isShowingExample = location?.source === 'fallback';

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
      description: 'Check sunrise, sunset, civil twilight, daylight length, and event direction for a location and date.',
    },
    {
      href: '/golden-hour-calculator',
      label: 'Golden Hour Calculator',
      description: 'Plan soft-light windows with exact event times, boundary bearings, and an altitude chart.',
    },
    {
      href: '/solar-azimuth-altitude',
      label: 'Sun Position & Angle Calculator',
      description: 'Measure sun direction, azimuth, altitude, and the daily angle curve for a selected time.',
    },
  ] as const;

  return (
    <>
      {solarData.data ? <AdSenseScript /> : null}

      {/* Skip Links for keyboard navigation */}
      <SkipLinks
        links={[
          { targetId: 'main-content', label: 'Skip to main content' },
          { targetId: 'solar-data', label: 'Skip to solar data panel' },
        ]}
      />

      <SiteHeader sticky />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-screen-2xl flex-col px-3 pb-4 sm:px-4 lg:px-6">
        {/* Hero + controls */}
        <section className="pb-4 sm:pb-6">
          <div className="grid gap-4 xl:grid-cols-[minmax(300px,0.68fr)_minmax(0,1.32fr)]">
            <div
              className={`${glassPanel} min-w-0 px-4 py-5 sm:px-6 sm:py-6`}
              data-testid="home-hero"
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top_left,rgba(125,211,252,0.22),transparent_48%),radial-gradient(circle_at_top_right,rgba(250,204,21,0.14),transparent_38%)]" />

              <div className="relative min-w-0 space-y-4">
                <p className={eyebrow}>Solar planning dashboard</p>
                <div className="space-y-3">
                  <h1 className="max-w-3xl text-3xl font-semibold tracking-[-0.04em] text-[var(--solar-text-strong)] sm:text-4xl lg:text-5xl lg:leading-none">
                    Sun path map and sun tracker for any location.
                  </h1>
                  <p className="max-w-2xl text-sm leading-6 text-[var(--solar-text)] sm:text-base">
                    Search a place, pick a date, and read daylight events, golden hour, solar
                    azimuth, altitude, and 3D daylight views from one live map.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  <span className={capsule} data-testid="location-source">
                    <span className="text-[var(--solar-pill-muted)]">Location</span>
                    <span>{locationSource}</span>
                  </span>
                  <span className={capsule}>
                    <span className="text-[var(--solar-pill-muted)]">Date</span>
                    <span>{displayDate}</span>
                  </span>
                  <span className={capsule} data-testid="location-timezone">
                    <span className="text-[var(--solar-pill-muted)]">Timezone</span>
                    <span>{displayTimezone}</span>
                  </span>
                </div>

                <dl
                  className="grid grid-cols-3 gap-2 rounded-[22px] border p-3 [border-color:var(--solar-surface-border)] [background:var(--solar-surface-bg)] [box-shadow:var(--solar-surface-inset-shadow)]"
                  data-testid="initial-solar-summary"
                >
                  <div className="min-w-0">
                    <dt className="text-[0.62rem] uppercase tracking-[0.18em] text-[var(--solar-text-faint)]">
                      Sunrise
                    </dt>
                    <dd className="mt-1 text-base font-semibold tabular-nums text-[var(--solar-text-strong)]">
                      {sunriseSummary}
                    </dd>
                  </div>
                  <div className="min-w-0 border-x px-2 [border-color:var(--solar-divider)]">
                    <dt className="text-[0.62rem] uppercase tracking-[0.18em] text-[var(--solar-text-faint)]">
                      Sunset
                    </dt>
                    <dd className="mt-1 text-base font-semibold tabular-nums text-[var(--solar-text-strong)]">
                      {sunsetSummary}
                    </dd>
                  </div>
                  <div className="min-w-0 pl-1">
                    <dt className="text-[0.62rem] uppercase tracking-[0.18em] text-[var(--solar-text-faint)]">
                      Daylight
                    </dt>
                    <dd className="mt-1 truncate text-base font-semibold tabular-nums text-[var(--solar-text-strong)]">
                      {daylightSummary}
                    </dd>
                  </div>
                </dl>

                <div className="space-y-2 text-xs leading-5 text-[var(--solar-text-muted)]">
                  <p>
                    Times use the selected location&apos;s timezone. Results do not account for
                    shading from terrain, buildings or trees.
                  </p>
                  <p aria-live="polite">
                    {isShowingExample && ipLoading
                      ? 'Showing a Taipei example while approximate location is checked.'
                      : isShowingExample && ipError
                        ? 'Showing the Taipei example. Search or enter coordinates to choose another place.'
                        : `Current focus: ${selectedStatus}.`}
                  </p>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold">
                  <a
                    href="#solar-data"
                    className="inline-flex min-h-11 items-center text-[var(--solar-accent)] underline decoration-sky-200/40 underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--solar-input-focus-ring)]"
                  >
                    View full results
                  </a>
                  <Link
                    href="/guides/how-to-read-a-sun-path-diagram"
                    className="inline-flex min-h-11 items-center text-[var(--solar-text)] underline decoration-sky-200/30 underline-offset-4 hover:text-[var(--solar-text-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--solar-input-focus-ring)]"
                  >
                    How to read a sun path
                  </Link>
                  <Link
                    href="/guides/brisbane-winter-vs-summer-sun-path"
                    className="inline-flex min-h-11 items-center text-[var(--solar-text)] underline decoration-sky-200/30 underline-offset-4 hover:text-[var(--solar-text-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--solar-input-focus-ring)]"
                  >
                    Brisbane winter vs summer
                  </Link>
                </div>
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
                  <div
                    onPointerDownCapture={stopAutomaticLocation}
                    onKeyDownCapture={stopAutomaticLocation}
                  >
                    <LocationInput className="!space-y-3" />
                  </div>
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
                  <DatePicker
                    className="w-full"
                    initialDateISO={initialDateISO}
                    onChange={stopAutomaticLocation}
                  />
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

              <Solar3DController
                disabled={!can3DViewOpen}
                hourly={solarData.hourly}
                events={solarData.events}
              />
            </div>

            <div className="relative flex-1 overflow-hidden rounded-[26px] border [border-color:var(--solar-map-frame-border)] [background:var(--solar-map-frame-bg)] [box-shadow:var(--solar-map-frame-shadow)]">
              <Suspense fallback={<MapSkeleton />}>
                <MapPanel
                  className="h-full w-full"
                  onUserInteraction={stopAutomaticLocation}
                >
                  {deferredSolarData ? (
                    <SolarRaysLayer
                      location={deferredSolarData.location}
                      positions={deferredSolarData.hourly}
                      selectedHour={deferredSelectedHour}
                      onRayClick={selectHour}
                    />
                  ) : null}
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
                    Daylight boundary times and azimuth-altitude curves for the selected day.
                  </p>
                </div>

                <div className="space-y-5 p-4 sm:p-5">
                  <SunEventsPanel events={solarData?.events ?? null} timezone={timezone} />

                  {solarData ? (
                    <DeferredChartsPanel
                      positions={deferredSolarData?.hourly ?? solarData.hourly}
                      selectedHour={deferredSelectedHour}
                      onHourClick={selectHour}
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
                      events={solarData.events}
                      positions={solarData.hourly}
                      selectedHour={selectedHour}
                      onRowClick={selectHour}
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

              {solarData.data ? (
                <CalculationReportPanel data={solarData.data} className={railPanel} />
              ) : null}

              {solarData.data ? <SidebarAdPanel className={railPanel} /> : null}
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
                    scene. Terrain and buildings may appear in the 3D scene as visual context, but
                    they do not change the calculated solar path or model shading from terrain,
                    buildings, or trees.
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
                      compare seasonal daylight hours and solar angles before a detailed site assessment.
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
                    Jump into dedicated pages for daylight times, golden hour, and solar angle
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
