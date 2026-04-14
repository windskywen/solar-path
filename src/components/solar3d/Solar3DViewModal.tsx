'use client';

/**
 * Solar3DViewModal Component
 *
 * Near-fullscreen modal displaying 3D solar path visualization.
 * Uses Radix UI Dialog for accessible modal behavior with:
 * - Focus trap and Esc close (NFR3D-004)
 * - Data snapshot capture on open (FR3D-013)
 * - Preserves main map camera on close (FR3D-004)
 */

import { useCallback, useMemo, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import dynamic from 'next/dynamic';
import { useLocation, useDateISO, useTimezone, useSelectedHour } from '@/store/solar-store';
import { useSolarData } from '@/hooks/useSolarData';
import {
  filterVisibleHours,
  buildSolar3DPoints,
  buildSolar3DPath,
  isSelectedHourVisible,
} from '@/lib/solar3d/visibility';
import type { Solar3DSnapshot, Solar3DViewData, Solar3DTooltipData } from '@/types/solar3d';

// Dynamically import the 3D canvas to avoid SSR issues with MapLibre/deck.gl
const Solar3DMapCanvas = dynamic(
  () => import('./Solar3DMapCanvas').then((m) => m.Solar3DMapCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-[#040611] p-6">
        <div className="rounded-[28px] border border-white/10 bg-[#071022]/78 px-6 py-5 text-center shadow-[0_28px_90px_rgba(2,6,23,0.48)] backdrop-blur-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-400/10 shadow-[0_0_40px_rgba(56,189,248,0.18)]">
            <svg
              className="h-6 w-6 animate-spin text-cyan-100"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-90"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
          <p className="mt-4 text-[0.65rem] font-medium uppercase tracking-[0.32em] text-cyan-200/65">
            Initializing
          </p>
          <span className="mt-2 block text-sm text-slate-300">Loading 3D view...</span>
        </div>
      </div>
    ),
  }
);

// Import tooltip component (non-dynamic since it's just a DOM overlay)
import { Solar3DTooltip } from './Solar3DTooltip';
import { Solar3DLegend } from './Solar3DLegend';
import { Solar3DAccessibleSummary } from './Solar3DAccessibleSummary';

export interface Solar3DViewModalProps {
  /**
   * Whether the modal is open.
   */
  open: boolean;

  /**
   * Callback when modal open state changes.
   * Called with false when user closes via Esc or close button.
   */
  onOpenChange: (open: boolean) => void;
}

/**
 * Solar3DViewModal
 *
 * Near-fullscreen modal displaying 3D solar path visualization.
 */
export function Solar3DViewModal({ open, onOpenChange }: Solar3DViewModalProps) {
  // Get current store state for snapshot
  const location = useLocation();
  const dateISO = useDateISO();
  const timezone = useTimezone();
  const selectedHour = useSelectedHour();
  const { hourly } = useSolarData();

  // Tooltip state
  const [tooltip, setTooltip] = useState<Solar3DTooltipData>(null);

  // Capture snapshot when modal opens
  // This creates a static copy of the data that won't change while modal is open
  const snapshot: Solar3DSnapshot | null = useMemo(() => {
    if (!open || !location) return null;

    return {
      location,
      dateISO,
      timezone,
      hourly,
      selectedHour,
    };
  }, [open, location, dateISO, timezone, hourly, selectedHour]);

  // Derive 3D view data from snapshot
  const viewData: Solar3DViewData | null = useMemo(() => {
    if (!snapshot) return null;

    const visibleHours = filterVisibleHours(snapshot.hourly);
    const visiblePoints = buildSolar3DPoints(visibleHours);
    const path = buildSolar3DPath(visiblePoints);
    const isSelectedVisible = isSelectedHourVisible(snapshot.selectedHour, snapshot.hourly);

    return {
      snapshot,
      visiblePoints,
      path,
      isSelectedVisible,
      isEmpty: visiblePoints.length === 0,
    };
  }, [snapshot]);

  // Handle hover
  const handleHover = useCallback((data: Solar3DTooltipData) => {
    setTooltip(data);
  }, []);

  // Reset key - increment to trigger camera reset
  const [resetKey, setResetKey] = useState(0);
  const handleResetView = useCallback(() => {
    setResetKey((prev) => prev + 1);
  }, []);

  const locationLabel = viewData
    ? viewData.snapshot.location.name ||
      `${viewData.snapshot.location.lat.toFixed(4)}°, ${viewData.snapshot.location.lng.toFixed(4)}°`
    : 'No location selected';

  const visibleHoursLabel = viewData
    ? `${viewData.visiblePoints.length} ${viewData.visiblePoints.length === 1 ? 'visible hour' : 'visible hours'}`
    : null;

  const selectedHourLabel =
    viewData?.isSelectedVisible && viewData.snapshot.selectedHour !== null
      ? `${viewData.snapshot.selectedHour.toString().padStart(2, '0')}:00`
      : null;

  const actionButtonClassName =
    'inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.06] px-3.5 py-2 text-xs font-medium text-slate-100 shadow-[0_12px_36px_rgba(2,6,23,0.28)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-300/35 hover:bg-white/[0.1] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200/60 sm:px-4 sm:text-sm';

  const iconButtonClassName =
    'inline-flex size-9 items-center justify-center rounded-full border border-white/12 bg-white/[0.06] text-slate-200 shadow-[0_12px_36px_rgba(2,6,23,0.28)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.1] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200/60 sm:size-10';

  const detailPillClassName =
    'inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3.5 py-2 text-xs font-medium text-slate-200/90 shadow-[0_10px_28px_rgba(2,6,23,0.22)] backdrop-blur-xl';

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[#02040c]/72 backdrop-blur-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        <Dialog.Content
          className="solar-3d-viewer fixed inset-0 z-50 overflow-hidden bg-[#040611] text-white shadow-[0_40px_160px_rgba(2,6,23,0.82)] focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 sm:inset-4 sm:rounded-[28px] sm:border sm:border-white/10 sm:data-[state=closed]:zoom-out-95 sm:data-[state=open]:zoom-in-95"
          aria-describedby="solar-3d-description"
        >
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute inset-x-[-15%] top-[-30%] h-[34rem] rounded-full bg-cyan-400/18 blur-3xl" />
            <div className="absolute right-[-10%] top-1/4 h-[28rem] w-[28rem] rounded-full bg-indigo-500/16 blur-3xl" />
            <div className="absolute bottom-[-25%] left-[-5%] h-[26rem] w-[26rem] rounded-full bg-amber-300/14 blur-3xl" />
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(180deg, rgba(5,10,24,0.94) 0%, rgba(4,8,17,0.82) 36%, rgba(4,8,17,0.55) 100%)',
              }}
            />
            <div
              className="absolute inset-0 opacity-[0.16]"
              style={{
                backgroundImage: 'radial-gradient(rgba(255,255,255,0.35) 0.8px, transparent 0.8px)',
                backgroundSize: '22px 22px',
              }}
            />
          </div>

          <div className="relative flex h-full flex-col">
            <header className="relative z-20 border-b border-white/10 bg-[#050816]/60 px-4 pb-4 pt-[calc(env(safe-area-inset-top)+1rem)] backdrop-blur-xl sm:px-6 sm:pb-5 sm:pt-5">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-white/[0.08] px-3 py-1 text-[0.65rem] font-medium uppercase tracking-[0.28em] text-cyan-100/80 shadow-[0_8px_30px_rgba(14,165,233,0.14)]">
                      Immersive viewer
                    </span>
                    <Dialog.Title className="mt-3 text-[clamp(1.35rem,1.1rem+1.2vw,2.15rem)] font-semibold tracking-[-0.04em] text-white">
                      3D Solar Path View
                    </Dialog.Title>
                    <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-300/90">
                      Trace the sun across a cinematic sky dome with daylight markers, golden
                      hour cues, and anchored context for the current scene.
                    </p>
                  </div>

                  <div className="flex w-full shrink-0 items-center justify-end gap-2 sm:w-auto">
                    <button
                      type="button"
                      onClick={handleResetView}
                      className={actionButtonClassName}
                      aria-label="Reset camera view to default"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M3 2v6h6" />
                        <path d="M21 12A9 9 0 0 0 6 5.3L3 8" />
                        <path d="M21 22v-6h-6" />
                        <path d="M3 12a9 9 0 0 0 15 6.7l3-2.7" />
                      </svg>
                      <span>Reset View</span>
                    </button>

                    <Dialog.Close asChild>
                      <button
                        type="button"
                        className={iconButtonClassName}
                        aria-label="Close 3D view"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </Dialog.Close>
                  </div>
                </div>

                {viewData && (
                  <div className="flex flex-wrap gap-2">
                    <div className={detailPillClassName}>
                      <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_16px_rgba(103,232,249,0.9)]" />
                      <span className="truncate">{locationLabel}</span>
                    </div>
                    {visibleHoursLabel && (
                      <div className={detailPillClassName}>
                        <span className="text-cyan-200/75">Visible</span>
                        <span>{visibleHoursLabel}</span>
                      </div>
                    )}
                    {selectedHourLabel && (
                      <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-3.5 py-2 text-xs font-medium text-amber-100 shadow-[0_10px_28px_rgba(251,191,36,0.12)] backdrop-blur-xl">
                        <span className="h-2 w-2 rounded-full bg-amber-300 shadow-[0_0_16px_rgba(252,211,77,0.75)]" />
                        <span>Selected {selectedHourLabel}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </header>

            <Dialog.Description id="solar-3d-description" className="sr-only">
              Interactive 3D visualization of the sun&apos;s path across the sky.
              {viewData &&
                !viewData.isEmpty &&
                ` Showing ${viewData.visiblePoints.length} visible hourly positions.`}
              {viewData?.isEmpty && ' The sun does not rise at this location on this date.'}
            </Dialog.Description>

            {viewData && <Solar3DAccessibleSummary viewData={viewData} />}

            <div className="relative min-h-0 flex-1 px-3 pb-3 pt-3 sm:px-4 sm:pb-4 sm:pt-4">
              <div className="relative h-full overflow-hidden rounded-[26px] border border-white/10 bg-[#03060f]/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_32px_100px_rgba(2,6,23,0.45)]">
                <div className="absolute inset-0">
                  {viewData ? (
                    <Solar3DMapCanvas
                      viewData={viewData}
                      onHover={handleHover}
                      resetKey={resetKey}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[#040611] p-6">
                      <div className="max-w-sm rounded-[24px] border border-white/10 bg-[#071022]/76 px-5 py-4 text-center shadow-[0_24px_80px_rgba(2,6,23,0.4)] backdrop-blur-xl">
                        <p className="text-[0.65rem] font-medium uppercase tracking-[0.3em] text-slate-400/70">
                          Viewer unavailable
                        </p>
                        <span className="mt-2 block text-sm text-slate-300">
                          No location selected
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#040611] via-[#040611]/55 to-transparent" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#040611]/90 via-[#040611]/35 to-transparent" />

                <Solar3DTooltip data={tooltip} />

                {viewData && !viewData.isEmpty && (
                  <Solar3DLegend className="absolute bottom-4 left-4 right-20 z-20 sm:bottom-6 sm:left-6 sm:right-auto sm:w-[290px]" />
                )}
              </div>
            </div>

            {viewData && (
              <div className="relative z-20 border-t border-white/10 bg-[#050816]/72 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-3 backdrop-blur-xl sm:px-6 sm:pb-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-[0.65rem] font-medium uppercase tracking-[0.3em] text-slate-400/70">
                      Scene capture
                    </p>
                    <p className="mt-1 text-sm text-gray-400 leading-6">
                      {locationLabel}
                      {' · '}
                      {viewData.snapshot.dateISO}
                      {' · '}
                      {viewData.snapshot.timezone}
                      {selectedHourLabel && (
                        <span className="ml-2 text-amber-300">Selected: {selectedHourLabel}</span>
                      )}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:min-w-[320px]">
                    <div className="rounded-[18px] border border-white/10 bg-white/[0.05] px-3 py-2.5 shadow-[0_14px_36px_rgba(2,6,23,0.24)] backdrop-blur-xl">
                      <p className="text-[0.62rem] uppercase tracking-[0.24em] text-slate-400/70">
                        Orbit
                      </p>
                      <p className="mt-1 text-sm font-semibold text-white">Live 3D camera</p>
                    </div>
                    <div className="rounded-[18px] border border-white/10 bg-white/[0.05] px-3 py-2.5 shadow-[0_14px_36px_rgba(2,6,23,0.24)] backdrop-blur-xl">
                      <p className="text-[0.62rem] uppercase tracking-[0.24em] text-slate-400/70">
                        Points
                      </p>
                      <p className="mt-1 text-sm font-semibold text-white">
                        {viewData.visiblePoints.length} tracked
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
