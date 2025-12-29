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

import { useCallback, useMemo } from 'react';
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
import { useState } from 'react';

// Dynamically import the 3D canvas to avoid SSR issues with MapLibre/deck.gl
const Solar3DMapCanvas = dynamic(
  () => import('./Solar3DMapCanvas').then((m) => m.Solar3DMapCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center w-full h-full bg-gray-900">
        <div className="flex items-center gap-2 text-gray-400">
          <svg
            className="animate-spin h-5 w-5"
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
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Loading 3D view...</span>
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

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        {/* Overlay with blur effect */}
        <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        {/* Modal content - near fullscreen */}
        <Dialog.Content
          className="fixed inset-4 z-50 bg-gray-900 rounded-lg shadow-2xl overflow-hidden focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          aria-describedby="solar-3d-description"
        >
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 bg-gray-900/90 backdrop-blur border-b border-gray-800">
            <Dialog.Title className="text-lg font-semibold text-white">
              3D Solar Path View
            </Dialog.Title>

            <div className="flex items-center gap-2">
              {/* Reset View button */}
              <button
                onClick={handleResetView}
                className="px-3 py-1.5 text-sm text-gray-300 hover:text-white hover:bg-gray-800 rounded transition-colors"
                aria-label="Reset camera view to default"
              >
                Reset View
              </button>

              {/* Close button */}
              <Dialog.Close asChild>
                <button
                  className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
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
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </Dialog.Close>
            </div>
          </div>

          {/* Hidden description for screen readers */}
          <Dialog.Description id="solar-3d-description" className="sr-only">
            Interactive 3D visualization of the sun&apos;s path across the sky.
            {viewData &&
              !viewData.isEmpty &&
              ` Showing ${viewData.visiblePoints.length} visible hourly positions.`}
            {viewData?.isEmpty && ' The sun does not rise at this location on this date.'}
          </Dialog.Description>

          {/* Accessible summary for screen readers */}
          {viewData && <Solar3DAccessibleSummary viewData={viewData} />}

          {/* 3D Canvas */}
          <div className="absolute inset-0 pt-14">
            {viewData ? (
              <Solar3DMapCanvas viewData={viewData} onHover={handleHover} resetKey={resetKey} />
            ) : (
              <div className="flex items-center justify-center w-full h-full bg-gray-900">
                <span className="text-gray-400">No location selected</span>
              </div>
            )}

            {/* Tooltip overlay */}
            <Solar3DTooltip data={tooltip} />

            {/* Legend - bottom left of canvas */}
            {viewData && !viewData.isEmpty && (
              <Solar3DLegend className="absolute bottom-14 left-4 z-10" />
            )}
          </div>

          {/* Location info footer */}
          {viewData && (
            <div className="absolute bottom-0 left-0 right-0 z-10 px-4 py-2 bg-gray-900/90 backdrop-blur border-t border-gray-800">
              <p className="text-sm text-gray-400">
                {viewData.snapshot.location.name ||
                  `${viewData.snapshot.location.lat.toFixed(
                    4
                  )}, ${viewData.snapshot.location.lng.toFixed(4)}`}
                {' · '}
                {viewData.snapshot.dateISO}
                {' · '}
                {viewData.snapshot.timezone}
                {viewData.isSelectedVisible && viewData.snapshot.selectedHour !== null && (
                  <span className="ml-2 text-amber-400">
                    Selected: {viewData.snapshot.selectedHour.toString().padStart(2, '0')}:00
                  </span>
                )}
              </p>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
