'use client';

/**
 * SunEventsPanel Component
 *
 * Displays sunrise, sunset, and day length information
 * with visual indicators for polar day/night conditions.
 */

import type { SunEvents } from '@/types/solar';

export interface SunEventsPanelProps {
  /** Sun events data */
  events: SunEvents | null;
  /** Timezone for display */
  timezone?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Get description for special conditions
 */
function getConditionDescription(events: SunEvents): string | null {
  // Check for polar conditions via note field or missing sunrise/sunset
  if (events.note) {
    return events.note;
  }

  const hasSunrise = events.sunriseLocal || events.sunriseISO;
  const hasSunset = events.sunsetLocal || events.sunsetISO;

  if (!hasSunrise && !hasSunset) {
    if (events.dayLengthHours === 24) {
      return 'Midnight Sun - Sun does not set';
    }
    if (events.dayLengthHours === 0) {
      return 'Polar Night - Sun does not rise';
    }
  }
  return null;
}

/**
 * Get sunrise time from events (handles both formats)
 */
function getSunriseTime(events: SunEvents): string | null {
  return events.sunriseLocal || events.sunriseISO || null;
}

/**
 * Get sunset time from events (handles both formats)
 */
function getSunsetTime(events: SunEvents): string | null {
  return events.sunsetLocal || events.sunsetISO || null;
}

/**
 * Get day length label from events (handles both formats)
 */
function getDayLengthLabel(events: SunEvents): string | null {
  return events.dayLengthLabel || events.dayLengthFormatted || null;
}

/**
 * SunEventsPanel displays sunrise, sunset, and day length
 */
export function SunEventsPanel({ events, className = '' }: SunEventsPanelProps) {
  // Loading/empty state
  if (!events) {
    return (
      <div className={`bg-slate-50 dark:bg-slate-800 rounded-lg p-4 ${className}`}>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
        </div>
      </div>
    );
  }

  const condition = getConditionDescription(events);
  const sunriseTime = getSunriseTime(events);
  const sunsetTime = getSunsetTime(events);
  const dayLengthLabel = getDayLengthLabel(events);
  const isPolarDay = events.dayLengthHours === 24;
  const isPolarNight = events.dayLengthHours === 0;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Special condition banner */}
      {condition && (
        <div
          className={`
            rounded-lg p-3 text-center
            ${
              isPolarDay
                ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200'
                : ''
            }
            ${isPolarNight ? 'bg-slate-800 dark:bg-slate-900 text-slate-200' : ''}
          `}
        >
          <p className="font-medium">{condition}</p>
        </div>
      )}

      {/* Sun events grid */}
      <div className="grid grid-cols-3 gap-3">
        {/* Sunrise */}
        <div className="bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-lg p-3 text-center">
          <div className="flex justify-center mb-1">
            <span className="text-2xl" role="img" aria-label="Sunrise">
              🌅
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Sunrise</p>
          <p className="text-lg font-semibold text-slate-900 dark:text-white tabular-nums">
            {sunriseTime || '—'}
          </p>
        </div>

        {/* Sunset */}
        <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg p-3 text-center">
          <div className="flex justify-center mb-1">
            <span className="text-2xl" role="img" aria-label="Sunset">
              🌇
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Sunset</p>
          <p className="text-lg font-semibold text-slate-900 dark:text-white tabular-nums">
            {sunsetTime || '—'}
          </p>
        </div>

        {/* Day Length */}
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg p-3 text-center">
          <div className="flex justify-center mb-1">
            <span className="text-2xl" role="img" aria-label="Day length">
              ⏱️
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Day Length</p>
          <p className="text-lg font-semibold text-slate-900 dark:text-white">
            {dayLengthLabel || '—'}
          </p>
        </div>
      </div>

      {/* Day length visual bar */}
      {events.dayLengthHours !== null && events.dayLengthHours !== undefined && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Night</span>
            <span>Day</span>
          </div>
          <div className="h-2 bg-slate-700 dark:bg-slate-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-yellow-400 transition-all duration-500"
              style={{ width: `${(events.dayLengthHours / 24) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>0h</span>
            <span>12h</span>
            <span>24h</span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Compact version for smaller displays
 */
export function SunEventsPanelCompact({
  events,
  className = '',
}: Omit<SunEventsPanelProps, 'timezone'>) {
  if (!events) {
    return (
      <div className={`flex items-center gap-4 text-sm ${className}`}>
        <span className="text-slate-400">Loading...</span>
      </div>
    );
  }

  const sunriseTime = getSunriseTime(events);
  const sunsetTime = getSunsetTime(events);
  const dayLengthLabel = getDayLengthLabel(events);

  return (
    <div className={`flex items-center gap-4 text-sm ${className}`}>
      <span className="flex items-center gap-1">
        <span>🌅</span>
        <span className="font-medium tabular-nums">{sunriseTime || '—'}</span>
      </span>
      <span className="flex items-center gap-1">
        <span>🌇</span>
        <span className="font-medium tabular-nums">{sunsetTime || '—'}</span>
      </span>
      <span className="flex items-center gap-1">
        <span>⏱️</span>
        <span className="font-medium">{dayLengthLabel || '—'}</span>
      </span>
    </div>
  );
}
