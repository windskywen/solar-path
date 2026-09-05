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
export function SunEventsPanel({ events, timezone, className = '' }: SunEventsPanelProps) {
  // Loading/empty state
  if (!events) {
      return (
      <div
        className={`rounded-[24px] border [border-color:var(--solar-surface-border)] [background:var(--solar-surface-bg)] p-4 ${className}`}
      >
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-1/2 rounded [background-color:var(--solar-divider)]" />
          <div className="h-24 rounded-[20px] [background:var(--solar-surface-soft-bg)]" />
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
  const dayPercentage =
    events.dayLengthHours !== null && events.dayLengthHours !== undefined
      ? Math.min(100, Math.max(0, (events.dayLengthHours / 24) * 100))
      : 0;
  const metaLabel = timezone ? timezone.replace('_', ' ') : 'Local solar time';

  const eventCards = [
    {
      label: 'Sunrise',
      value: sunriseTime || '—',
      icon: '🌅',
      accent: 'from-amber-300/18 via-amber-200/10 to-transparent',
    },
    {
      label: 'Sunset',
      value: sunsetTime || '—',
      icon: '🌇',
      accent: 'from-orange-300/18 via-rose-200/10 to-transparent',
    },
    {
      label: 'Day Length',
      value: dayLengthLabel || '—',
      icon: '⏱️',
      accent: 'from-sky-300/18 via-cyan-200/10 to-transparent',
    },
  ];

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[0.64rem] font-semibold uppercase tracking-[0.28em] text-[var(--solar-kicker)]">
            Event timeline
          </p>
          <p className="mt-1 text-sm text-[var(--solar-text)]">Daily light window in local time</p>
        </div>
        <span className="text-[0.68rem] font-medium uppercase tracking-[0.22em] text-[var(--solar-text-faint)]">
          {metaLabel}
        </span>
      </div>

      {condition && (
        <div
          className={`rounded-2xl border px-3 py-2 text-center text-xs font-medium ${
            isPolarDay
              ? '[border-color:var(--solar-warning-border)] [background:var(--solar-warning-bg)] text-[var(--solar-warning-text)]'
              : isPolarNight
                ? '[border-color:var(--solar-state-night-border)] [background:var(--solar-state-night-pill-bg)] text-[var(--solar-text)]'
                : '[border-color:var(--solar-input-focus-border)] [background:var(--solar-accent-soft)] text-[var(--solar-accent)]'
          }`}
        >
          {condition}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {eventCards.map((card) => (
          <div
            key={card.label}
            className="relative overflow-hidden rounded-[22px] border [border-color:var(--solar-surface-border)] [background:var(--solar-surface-bg)] p-4 [box-shadow:var(--solar-surface-inset-shadow)]"
          >
            <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${card.accent}`} />
            <div className="relative">
              <div className="text-xl">{card.icon}</div>
              <p className="mt-3 text-[0.64rem] font-semibold uppercase tracking-[0.26em] text-[var(--solar-text-muted)]">
                {card.label}
              </p>
              <p className="mt-2 text-lg font-semibold tracking-[-0.02em] text-[var(--solar-text-strong)] sm:text-xl">
                {card.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {events.dayLengthHours !== null && events.dayLengthHours !== undefined && (
        <div className="rounded-[22px] border [border-color:var(--solar-surface-border)] [background:var(--solar-surface-bg)] p-4 [box-shadow:var(--solar-surface-inset-shadow)]">
          <div className="mb-2 flex items-center justify-between text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-[var(--solar-text-muted)]">
            <span>Day {Math.round(dayPercentage)}%</span>
            <span>Night {100 - Math.round(dayPercentage)}%</span>
          </div>

          <div className="h-2.5 overflow-hidden rounded-full [background:var(--solar-surface-soft-bg)] ring-1 ring-[var(--solar-surface-border)]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-300 via-orange-300 to-sky-300 transition-all duration-500"
              style={{ width: `${dayPercentage}%` }}
            />
          </div>

          <p className="mt-3 text-xs text-[var(--solar-text-muted)]">
            {dayLengthLabel || 'Solar event data available once the selected location resolves.'}
          </p>
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
        <span className="text-[var(--solar-text-muted)]">Loading...</span>
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
