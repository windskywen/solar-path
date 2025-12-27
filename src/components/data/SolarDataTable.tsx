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
    bg: 'bg-slate-800',
    text: 'text-slate-300',
    dot: 'bg-slate-500',
  },
  twilight: {
    bg: 'bg-violet-100 dark:bg-violet-900/30',
    text: 'text-violet-700 dark:text-violet-300',
    dot: 'bg-violet-500',
  },
  golden: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-300',
    dot: 'bg-amber-500',
  },
  day: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    text: 'text-yellow-700 dark:text-yellow-300',
    dot: 'bg-yellow-500',
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
    <div className={`overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 ${className}`}>
      {/* Table header */}
      <div className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="grid grid-cols-4 gap-2 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-400">
          <div>Time</div>
          <div>Azimuth</div>
          <div>Altitude</div>
          <div>State</div>
        </div>
      </div>

      {/* Table body - scrollable */}
      <div className="max-h-[400px] overflow-y-auto">
        {sortedPositions.map((position) => {
          const isSelected = position.hour === selectedHour;
          const stateColors = STATE_COLORS[position.daylightState];
          const isBelowHorizon = position.altitudeDeg < 0;

          return (
            <button
              key={position.hour}
              onClick={() => onRowClick?.(position.hour)}
              className={`
                w-full grid grid-cols-4 gap-2 px-3 py-2 text-sm text-left
                transition-colors hover:bg-slate-50 dark:hover:bg-slate-800
                ${isSelected ? 'bg-blue-50 dark:bg-blue-900/30 ring-2 ring-blue-500 ring-inset' : ''}
                ${isBelowHorizon ? 'text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-slate-100'}
                border-b border-slate-100 dark:border-slate-800 last:border-b-0
              `}
              aria-selected={isSelected}
              aria-label={`${formatHour(position.hour)}: Azimuth ${position.azimuthDeg.toFixed(1)}°, Altitude ${position.altitudeDeg.toFixed(1)}°, ${position.daylightState}`}
            >
              {/* Time */}
              <div className="font-medium tabular-nums">
                {formatHour(position.hour)}
              </div>

              {/* Azimuth */}
              <div className="tabular-nums">
                {formatAzimuth(position.azimuthDeg)}
              </div>

              {/* Altitude */}
              <div className={`tabular-nums ${isBelowHorizon ? 'text-slate-400' : ''}`}>
                {formatAltitude(position.altitudeDeg)}
              </div>

              {/* State indicator */}
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${stateColors.dot}`} />
                <span className={`text-xs capitalize ${stateColors.text}`}>
                  {position.daylightState}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Summary footer */}
      {positions.length > 0 && (
        <div className="bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 px-3 py-2">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>
              {positions.filter((p) => p.altitudeDeg > 0).length} hours above horizon
            </span>
            {timezone && (
              <span className="font-mono">
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
              onClick={() => onRowClick?.(position.hour)}
              className={`
                p-2 rounded text-center text-xs
                ${isSelected ? 'ring-2 ring-blue-500' : ''}
                ${isBelowHorizon ? 'opacity-50' : ''}
                ${stateColors.bg}
              `}
              title={`${formatHour(position.hour)}: Az ${position.azimuthDeg.toFixed(1)}°, Alt ${position.altitudeDeg.toFixed(1)}°`}
            >
              <div className="font-medium">{position.hour}</div>
            </button>
          );
        })}
    </div>
  );
}
