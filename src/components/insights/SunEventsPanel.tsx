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
    <div className={`flex flex-col gap-4 ${className}`}>
      {/* Special condition banner */}
      {condition && (
        <div
          className={`
            rounded-lg p-2 text-center text-xs font-medium
            ${
              isPolarDay
                ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200'
                : ''
            }
            ${isPolarNight ? 'bg-slate-800 dark:bg-slate-900 text-slate-200' : ''}
          `}
        >
          {condition}
        </div>
      )}

      {/* Sun events list - Horizontal Row */}
      <div className="grid grid-cols-3 gap-2">
        {/* Sunrise */}
        <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
          <div className="text-xl mb-1">🌅</div>
          <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase">
            Sunrise
          </p>
          <p className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
            {sunriseTime || '—'}
          </p>
        </div>

        {/* Sunset */}
        <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
          <div className="text-xl mb-1">🌇</div>
          <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase">
            Sunset
          </p>
          <p className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
            {sunsetTime || '—'}
          </p>
        </div>

        {/* Day Length */}
        <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
          <div className="text-xl mb-1">⏱️</div>
          <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase">
            Day Length
          </p>
          <p className="text-sm font-bold text-slate-900 dark:text-white">
            {dayLengthLabel || '—'}
          </p>
        </div>
      </div>

      {/* Day length visual bar */}
      {events.dayLengthHours !== null && events.dayLengthHours !== undefined && (
        <div className="">
          <div className="flex justify-between text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-1.5">
            <span>
              Day ({Math.min(100, Math.max(0, Math.round((events.dayLengthHours / 24) * 100)))}%)
            </span>
            <span>
              Night (
              {100 - Math.min(100, Math.max(0, Math.round((events.dayLengthHours / 24) * 100)))}%)
            </span>
          </div>
          <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden ring-1 ring-slate-200 dark:ring-slate-700">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-orange-400 transition-all duration-500"
              style={{
                width: `${Math.min(100, Math.max(0, (events.dayLengthHours / 24) * 100))}%`,
              }}
            />
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
