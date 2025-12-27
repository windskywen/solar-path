/**
 * MetricsPanel Component
 *
 * Displays detailed metrics for the selected hour:
 * - Time
 * - Azimuth (with compass direction)
 * - Altitude
 * - Daylight state
 * - Additional insights
 */

'use client';

import { useMemo } from 'react';
import type { HourlySolarPosition } from '@/types/solar';
import { CopyButton } from './CopyButton';

// Color schemes for daylight states
const STATE_STYLES = {
  night: {
    bg: 'bg-slate-800/50',
    border: 'border-slate-700',
    icon: '🌙',
    label: 'Night',
    description: 'Sun is below the horizon',
  },
  golden: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    border: 'border-amber-200 dark:border-amber-800',
    icon: '🌅',
    label: 'Golden Hour',
    description: 'Warm, diffused light ideal for photography',
  },
  day: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    border: 'border-yellow-200 dark:border-yellow-800',
    icon: '☀️',
    label: 'Day',
    description: 'Sun is high in the sky',
  },
};

/**
 * Get cardinal direction from azimuth
 */
function getCardinalDirection(azimuth: number): string {
  const directions = [
    'North',
    'North-Northeast',
    'Northeast',
    'East-Northeast',
    'East',
    'East-Southeast',
    'Southeast',
    'South-Southeast',
    'South',
    'South-Southwest',
    'Southwest',
    'West-Southwest',
    'West',
    'West-Northwest',
    'Northwest',
    'North-Northwest',
  ];
  const index = Math.round(azimuth / 22.5) % 16;
  return directions[index];
}

/**
 * Get short cardinal direction
 */
function getShortDirection(azimuth: number): string {
  const directions = [
    'N',
    'NNE',
    'NE',
    'ENE',
    'E',
    'ESE',
    'SE',
    'SSE',
    'S',
    'SSW',
    'SW',
    'WSW',
    'W',
    'WNW',
    'NW',
    'NNW',
  ];
  const index = Math.round(azimuth / 22.5) % 16;
  return directions[index];
}

/**
 * Format hour as readable time
 */
function formatTime(hour: number): string {
  if (hour === 0) return '12:00 AM';
  if (hour === 12) return '12:00 PM';
  if (hour < 12) return `${hour}:00 AM`;
  return `${hour - 12}:00 PM`;
}

/**
 * Get description based on altitude
 */
function getAltitudeDescription(altitude: number): string {
  if (altitude < -18) return 'Deep night (astronomical)';
  if (altitude < -12) return 'Astronomical twilight';
  if (altitude < -6) return 'Nautical twilight';
  if (altitude < 0) return 'Civil twilight';
  if (altitude < 6) return 'Low sun angle';
  if (altitude < 30) return 'Morning/afternoon sun';
  if (altitude < 60) return 'Mid-sky position';
  return 'Sun near zenith';
}

export interface MetricsPanelProps {
  /** Solar position for the selected hour */
  position: HourlySolarPosition | null | undefined;
  /** Additional CSS classes */
  className?: string;
}

/**
 * MetricsPanel displays detailed information for the selected hour
 */
export function MetricsPanel({ position, className = '' }: MetricsPanelProps) {
  // Compute derived values unconditionally to follow hooks rules
  const cardinalDir = useMemo(
    () => (position ? getCardinalDirection(position.azimuthDeg) : ''),
    [position]
  );
  const shortDir = useMemo(
    () => (position ? getShortDirection(position.azimuthDeg) : ''),
    [position]
  );
  const altDescription = useMemo(
    () => (position ? getAltitudeDescription(position.altitudeDeg) : ''),
    [position]
  );

  // No selection state
  if (!position) {
    return (
      <div
        className={`h-full flex flex-col items-center justify-center p-6 text-center ${className}`}
      >
        <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3">
          <span className="text-2xl grayscale opacity-50">☀️</span>
        </div>
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">No Hour Selected</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
          Click on the map or table to view details
        </p>
      </div>
    );
  }

  const stateStyle = STATE_STYLES[position.daylightState];

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Header with time and state */}
      <div
        className={`flex items-center justify-between p-3 rounded-lg mb-4 ${stateStyle.bg} border ${stateStyle.border}`}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl filter drop-shadow-sm">{stateStyle.icon}</span>
          <div>
            <p className="font-bold text-lg text-slate-900 dark:text-white leading-none">
              {formatTime(position.hour)}
            </p>
            <p className="text-[10px] font-medium uppercase tracking-wider opacity-70 mt-1">
              {position.localTimeLabel}
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-white/60 dark:bg-black/20 backdrop-blur-sm">
            {stateStyle.label}
          </span>
        </div>
      </div>

      {/* Main metrics */}
      <div className="flex-1 grid grid-cols-2 gap-4">
        {/* Azimuth */}
        <div className="flex flex-col justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Azimuth
            </p>
            <CopyButton text={position.azimuthDeg.toFixed(1)} label="Azimuth" />
          </div>

          <div className="flex items-end justify-between mt-auto">
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums tracking-tight">
                  {position.azimuthDeg.toFixed(0)}°
                </span>
              </div>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400 truncate">
                {cardinalDir} ({shortDir})
              </p>
            </div>
            <div className="transform scale-75 origin-bottom-right">
              <CompassIndicator azimuth={position.azimuthDeg} />
            </div>
          </div>
        </div>

        {/* Altitude */}
        <div className="flex flex-col justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Altitude
            </p>
            <CopyButton text={position.altitudeDeg.toFixed(1)} label="Altitude" />
          </div>

          <div className="mt-auto">
            <div className="flex items-baseline gap-1">
              <span
                className={`text-2xl font-bold tabular-nums tracking-tight ${
                  position.altitudeDeg < 0
                    ? 'text-slate-400 dark:text-slate-500'
                    : 'text-slate-900 dark:text-white'
                }`}
              >
                {position.altitudeDeg >= 0 ? '+' : ''}
                {position.altitudeDeg.toFixed(1)}°
              </span>
            </div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              {position.altitudeDeg < 0 ? 'Below Horizon' : 'Above Horizon'}
            </p>
          </div>
        </div>
      </div>

      {/* Additional info footer */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
        <p className="text-xs text-center text-slate-500 dark:text-slate-400 italic">
          {altDescription}
        </p>
      </div>
    </div>
  );
}

/**
 * Simple compass indicator showing sun direction
 */
function CompassIndicator({ azimuth }: { azimuth: number }) {
  return (
    <div className="relative w-12 h-12">
      {/* Compass circle */}
      <div className="absolute inset-0 rounded-full border border-slate-300 dark:border-slate-600" />

      {/* Cardinal directions */}
      <span className="absolute -top-1 left-1/2 -translate-x-1/2 text-[8px] font-medium text-slate-500">
        N
      </span>
      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[8px] font-medium text-slate-500">
        S
      </span>
      <span className="absolute top-1/2 -left-1.5 -translate-y-1/2 text-[8px] font-medium text-slate-500">
        W
      </span>
      <span className="absolute top-1/2 -right-1.5 -translate-y-1/2 text-[8px] font-medium text-slate-500">
        E
      </span>

      {/* Sun indicator line */}
      <div
        className="absolute top-1/2 left-1/2 w-4 h-0.5 bg-amber-500 origin-left"
        style={{ transform: `rotate(${azimuth - 90}deg)` }}
      >
        <div className="absolute -right-0.5 -top-0.5 w-1.5 h-1.5 bg-amber-400 rounded-full" />
      </div>

      {/* Center dot */}
      <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 -translate-x-1/2 -translate-y-1/2 bg-slate-400 dark:bg-slate-500 rounded-full" />
    </div>
  );
}

/**
 * Compact version for inline display
 */
export function MetricsPanelCompact({ position, className = '' }: MetricsPanelProps) {
  if (!position) {
    return <span className={`text-sm text-slate-400 ${className}`}>No hour selected</span>;
  }

  const shortDir = getShortDirection(position.azimuthDeg);
  const stateStyle = STATE_STYLES[position.daylightState];

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <span className="font-medium">{formatTime(position.hour)}</span>
      <span className="text-slate-600 dark:text-slate-400">
        {position.azimuthDeg.toFixed(1)}° {shortDir}
      </span>
      <span className={position.altitudeDeg < 0 ? 'text-slate-400' : ''}>
        {position.altitudeDeg >= 0 ? '+' : ''}
        {position.altitudeDeg.toFixed(1)}°
      </span>
      <span>{stateStyle.icon}</span>
    </div>
  );
}
