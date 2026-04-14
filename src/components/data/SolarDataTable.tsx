'use client';

/**
 * SolarDataTable Component
 *
 * Displays 24 rows of hourly solar positions with:
 * - Hour (local time)
 * - Azimuth (compass bearing)
 * - Altitude (elevation angle)
 * - Daylight state indicator
 */

import { useMemo } from 'react';
import type { HourlySolarPosition } from '@/types/solar';

// Color classes for daylight states
const STATE_COLORS = {
  night: {
    text: 'text-slate-400',
    dot: 'bg-slate-400',
  },
  twilight: {
    text: 'text-violet-200',
    dot: 'bg-violet-300',
  },
  golden: {
    text: 'text-amber-200',
    dot: 'bg-amber-300',
  },
  day: {
    text: 'text-sky-100',
    dot: 'bg-sky-300',
  },
};

export interface SolarDataTableProps {
  /** Array of 24 hourly positions */
  positions: HourlySolarPosition[];
  /** Currently selected hour (0-23) or null */
  selectedHour: number | null;
  /** Callback when a row is clicked */
  onRowClick?: (hour: number) => void;
  /** Timezone for display (e.g., "America/New_York") */
  timezone?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Format hour as 12-hour time with AM/PM
 */
function formatHour(hour: number): string {
  if (hour === 0) return '12 AM';
  if (hour === 12) return '12 PM';
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
}

/**
 * Format azimuth with cardinal direction
 */
function formatAzimuth(azimuth: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(azimuth / 45) % 8;
  return `${azimuth.toFixed(1)}° ${directions[index]}`;
}

/**
 * Format altitude with indicator for below horizon
 */
function formatAltitude(altitude: number): string {
  const formatted = `${altitude.toFixed(1)}°`;
  return altitude < 0 ? formatted : `+${formatted}`;
}

/**
 * SolarDataTable displays hourly solar position data in a scrollable table
 */
export function SolarDataTable({
  positions,
  selectedHour,
  onRowClick,
  timezone,
  className = '',
}: SolarDataTableProps) {
  // Sort positions by hour
  const sortedPositions = useMemo(
    () => [...positions].sort((a, b) => a.hour - b.hour),
    [positions]
  );

  return (
    <div className={`overflow-hidden ${className}`}>
      <div className="border-b border-white/10 bg-white/[0.04]">
        <div className="grid grid-cols-4 gap-2 px-3 py-3 text-[0.64rem] font-semibold uppercase tracking-[0.24em] text-slate-400 sm:px-4">
          <div>Time</div>
          <div>Azimuth</div>
          <div>Altitude</div>
          <div>State</div>
        </div>
      </div>

      <div>
        {sortedPositions.map((position) => {
          const isSelected = position.hour === selectedHour;
          const stateColors = STATE_COLORS[position.daylightState];
          const isBelowHorizon = position.altitudeDeg < 0;

          return (
            <button
              key={position.hour}
              type="button"
              onClick={() => onRowClick?.(position.hour)}
              className={`
                w-full grid grid-cols-4 gap-2 border-b border-white/8 px-3 py-3 text-left text-xs transition-all duration-200 last:border-b-0 sm:px-4 sm:text-sm
                ${
                  isSelected
                    ? 'bg-sky-400/12 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]'
                    : 'text-slate-200 hover:bg-white/[0.04]'
                }
                ${isBelowHorizon && !isSelected ? 'text-slate-400/70' : ''}
              `}
              aria-selected={isSelected}
              aria-label={`${formatHour(position.hour)}: Azimuth ${position.azimuthDeg.toFixed(
                1
              )}°, Altitude ${position.altitudeDeg.toFixed(1)}°, ${position.daylightState}`}
            >
              <div className="tabular-nums font-medium">{formatHour(position.hour)}</div>

              <div className="tabular-nums text-[10px] sm:text-sm">
                {formatAzimuth(position.azimuthDeg)}
              </div>

              <div className={`tabular-nums ${isBelowHorizon && !isSelected ? 'opacity-75' : ''}`}>
                {formatAltitude(position.altitudeDeg)}
              </div>

              <div className="flex items-center gap-2">
                <div className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${stateColors.dot}`} />
                <span
                  className={`hidden truncate text-[10px] capitalize sm:inline sm:text-xs ${
                    isSelected ? 'text-sky-100' : stateColors.text
                  }`}
                >
                  {position.daylightState}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {positions.length > 0 && (
        <div className="border-t border-white/10 bg-white/[0.04] px-3 py-3 sm:px-4">
          <div className="flex items-center justify-between gap-3 text-[0.7rem] text-slate-400 sm:text-xs">
            <span className="font-medium text-slate-300">
              {positions.filter((p) => p.altitudeDeg > 0).length} hours of daylight
            </span>
            {timezone && (
              <span className="max-w-[140px] truncate font-mono opacity-80 sm:max-w-none">
                {timezone.replace('_', ' ')}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Compact version of the table for smaller viewports
 */
export function SolarDataTableCompact({
  positions,
  selectedHour,
  onRowClick,
  className = '',
}: Omit<SolarDataTableProps, 'timezone'>) {
  return (
    <div className={`grid grid-cols-6 gap-1 ${className}`}>
      {positions
        .sort((a, b) => a.hour - b.hour)
        .map((position) => {
          const isSelected = position.hour === selectedHour;
          const stateColors = STATE_COLORS[position.daylightState];
          const isBelowHorizon = position.altitudeDeg < 0;

          return (
            <button
              key={position.hour}
              type="button"
              onClick={() => onRowClick?.(position.hour)}
              className={`
                rounded-xl border px-2 py-2 text-center text-xs
                ${isSelected ? 'border-sky-300/30 bg-sky-400/14 text-sky-50' : 'border-white/10 bg-white/[0.04] text-slate-300'}
                ${isBelowHorizon ? 'opacity-55' : ''}
              `}
              title={`${formatHour(position.hour)}: Az ${position.azimuthDeg.toFixed(
                1
              )}°, Alt ${position.altitudeDeg.toFixed(1)}°`}
            >
              <div className="font-medium">{position.hour}</div>
              <div className={`mx-auto mt-1 h-1.5 w-1.5 rounded-full ${stateColors.dot}`} />
            </button>
          );
        })}
    </div>
  );
}
