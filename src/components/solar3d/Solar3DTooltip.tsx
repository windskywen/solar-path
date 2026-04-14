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
  const stateClasses =
    data.daylightState === 'golden'
      ? 'border-amber-300/20 bg-amber-300/10 text-amber-100'
      : 'border-yellow-300/20 bg-yellow-300/10 text-yellow-100';

  return (
    <div
      className="pointer-events-none absolute z-20 max-w-[calc(100vw-1.5rem)]"
      style={{
        left: data.x + 14,
        top: data.y - 14,
        transform: 'translateY(-100%)',
      }}
    >
      <div className="min-w-[190px] rounded-[24px] border border-white/10 bg-[#071022]/92 p-3.5 shadow-[0_26px_80px_rgba(2,6,23,0.45)] backdrop-blur-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[0.62rem] font-medium uppercase tracking-[0.28em] text-cyan-200/65">
              Sun position
            </p>
            <p className="mt-1 text-lg font-semibold tracking-[-0.03em] text-white">
              {data.localTimeLabel}
            </p>
          </div>
          <span
            className={`inline-flex rounded-full border px-2 py-1 text-[0.65rem] font-medium ${stateClasses}`}
          >
            {stateLabel}
          </span>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-[18px] border border-white/10 bg-white/[0.04] px-3 py-2">
            <p className="text-[0.65rem] uppercase tracking-[0.22em] text-slate-400/75">Azimuth</p>
            <p className="mt-1 font-mono text-slate-100">{data.azimuthDeg.toFixed(1)}°</p>
          </div>
          <div className="rounded-[18px] border border-white/10 bg-white/[0.04] px-3 py-2">
            <p className="text-[0.65rem] uppercase tracking-[0.22em] text-slate-400/75">
              Altitude
            </p>
            <p className="mt-1 font-mono text-slate-100">{data.altitudeDeg.toFixed(1)}°</p>
          </div>
        </div>
      </div>
    </div>
  );
}
