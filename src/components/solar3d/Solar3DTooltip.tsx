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

function getCardinalDirection(azimuthDeg: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return directions[Math.round(azimuthDeg / 45) % directions.length];
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
      ? '[border-color:var(--solar-warning-border)] [background:var(--solar-warning-bg)] text-[var(--solar-warning-text)]'
      : '[border-color:var(--solar-input-focus-border)] [background:var(--solar-accent-soft)] text-[var(--solar-accent)]';
  const cardinalDirection = getCardinalDirection(data.azimuthDeg);

  return (
    <div
      className="pointer-events-none absolute left-[clamp(0.75rem,var(--tooltip-x),calc(100%_-_13.25rem))] top-[clamp(5.75rem,var(--tooltip-y),calc(100%_-_0.75rem))] z-20 w-[12.5rem] max-w-[calc(100%-1.5rem)]"
      style={{
        '--tooltip-x': `${data.x + 12}px`,
        '--tooltip-y': `${data.y - 10}px`,
        transform: 'translateY(-100%)',
      } as React.CSSProperties}
      data-testid="solar-3d-tooltip"
    >
      <div className="rounded-[18px] border [border-color:var(--solar-3d-surface-border)] [background:var(--solar-3d-tooltip-bg)] px-3 py-2.5 [box-shadow:var(--solar-3d-surface-shadow)] backdrop-blur-xl">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-2">
            <p className="font-mono text-base font-semibold tracking-[-0.03em] text-[var(--solar-text-strong)]">
              {data.localTimeLabel}
            </p>
            <span className="text-[0.56rem] font-medium uppercase tracking-[0.2em] text-[var(--solar-3d-kicker)]">
              Sun
            </span>
          </div>
          <span
            className={`inline-flex rounded-full border px-1.5 py-0.5 text-[0.58rem] font-medium ${stateClasses}`}
          >
            {stateLabel}
          </span>
        </div>

        <div className="mt-2 flex items-center rounded-full border [border-color:var(--solar-surface-border)] [background:var(--solar-surface-soft-bg)] px-2.5 py-1.5 font-mono text-[0.68rem] text-[var(--solar-text-strong)]">
          <span className="text-[var(--solar-text-muted)]">Az</span>
          <span className="ml-1">{data.azimuthDeg.toFixed(1)}°</span>
          <span className="ml-1 font-semibold text-cyan-200">{cardinalDirection}</span>
          <span className="mx-2 h-3 w-px bg-white/10" aria-hidden="true" />
          <span className="text-[var(--solar-text-muted)]">Alt</span>
          <span className="ml-1">
            {data.altitudeDeg >= 0 ? '+' : ''}
            {data.altitudeDeg.toFixed(1)}°
          </span>
        </div>
      </div>
    </div>
  );
}
