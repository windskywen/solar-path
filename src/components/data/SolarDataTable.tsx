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
    bg: 'bg-muted',
    text: 'text-muted-foreground',
    dot: 'bg-muted-foreground',
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
    <div className={`overflow-hidden ${className}`}>
      {/* Table header */}
      <div className="bg-muted/50 border-b border-border">
        <div className="grid grid-cols-4 gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-2.5 text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <div>Time</div>
          <div>Azimuth</div>
          <div>Altitude</div>
          <div>State</div>
        </div>
      </div>

      {/* Table body - full height */}
      <div className="">
        {sortedPositions.map((position) => {
          const isSelected = position.hour === selectedHour;
          const stateColors = STATE_COLORS[position.daylightState];
          const isBelowHorizon = position.altitudeDeg < 0;

          return (
            <button
              key={position.hour}
              onClick={() => onRowClick?.(position.hour)}
              className={`
                w-full grid grid-cols-4 gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-left
                transition-all duration-200
                ${isSelected ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted'}
                ${isBelowHorizon && !isSelected ? 'text-muted-foreground/50' : 'text-foreground'}
                border-b border-border last:border-b-0
              `}
              aria-selected={isSelected}
              aria-label={`${formatHour(position.hour)}: Azimuth ${position.azimuthDeg.toFixed(
                1
              )}°, Altitude ${position.altitudeDeg.toFixed(1)}°, ${position.daylightState}`}
            >
              {/* Time */}
              <div className="tabular-nums">{formatHour(position.hour)}</div>

              {/* Azimuth */}
              <div className="tabular-nums text-[10px] sm:text-sm">
                {formatAzimuth(position.azimuthDeg)}
              </div>

              {/* Altitude */}
              <div className={`tabular-nums ${isBelowHorizon && !isSelected ? 'opacity-75' : ''}`}>
                {formatAltitude(position.altitudeDeg)}
              </div>

              {/* State indicator */}
              <div className="flex items-center gap-1 sm:gap-2">
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${stateColors.dot}`} />
                <span
                  className={`text-[10px] sm:text-xs capitalize truncate hidden sm:inline ${
                    isSelected ? 'text-primary' : stateColors.text
                  }`}
                >
                  {position.daylightState}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Summary footer */}
      {positions.length > 0 && (
        <div className="bg-muted/50 border-t border-border px-2 sm:px-4 py-2 sm:py-2.5">
          <div className="flex items-center justify-between text-[10px] sm:text-xs text-muted-foreground">
            <span className="font-medium">
              {positions.filter((p) => p.altitudeDeg > 0).length} hours of daylight
            </span>
            {timezone && (
              <span className="font-mono opacity-75 truncate max-w-[120px] sm:max-w-none">
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
                ${isSelected ? 'ring-2 ring-primary' : ''}
                ${isBelowHorizon ? 'opacity-50' : ''}
                ${stateColors.bg}
              `}
              title={`${formatHour(position.hour)}: Az ${position.azimuthDeg.toFixed(
                1
              )}°, Alt ${position.altitudeDeg.toFixed(1)}°`}
            >
              <div className="font-medium">{position.hour}</div>
            </button>
          );
        })}
    </div>
  );
}
