'use client';

/**
 * Solar3DTooltip Component
 *
 * Displays hourly information when hovering over a point in the 3D view.
 * Shows: hour label, azimuth°, altitude°, daylight state.
 */

import type { Solar3DTooltipData } from '@/types/solar3d';

export interface Solar3DTooltipProps {
  /**
   * Tooltip data or null if not showing.
   */
  data: Solar3DTooltipData;
}

/**
 * Solar3DTooltip
 *
 * Displays hourly information on point hover.
 */
export function Solar3DTooltip({ data }: Solar3DTooltipProps) {
  if (!data) return null;

  // Format daylight state for display
  const stateLabel = data.daylightState === 'golden' ? 'Golden Hour' : 'Daylight';
  const stateColor = data.daylightState === 'golden' ? 'text-amber-400' : 'text-yellow-300';

  return (
    <div
      className="absolute z-20 pointer-events-none"
      style={{
        left: data.x + 10,
        top: data.y - 10,
        transform: 'translateY(-100%)',
      }}
    >
      <div className="bg-gray-900/95 backdrop-blur border border-gray-700 rounded-lg shadow-xl px-3 py-2 min-w-[160px]">
        {/* Time label */}
        <p className="text-base font-semibold text-white mb-1">{data.localTimeLabel}</p>

        {/* Solar data */}
        <div className="space-y-0.5 text-sm">
          <p className="text-gray-300">
            <span className="text-gray-500">Azimuth:</span>{' '}
            <span className="font-mono">{data.azimuthDeg.toFixed(1)}°</span>
          </p>
          <p className="text-gray-300">
            <span className="text-gray-500">Altitude:</span>{' '}
            <span className="font-mono">{data.altitudeDeg.toFixed(1)}°</span>
          </p>
          <p className={stateColor}>{stateLabel}</p>
        </div>
      </div>
    </div>
  );
}
