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
    shell:
      'border-white/10 bg-[linear-gradient(135deg,rgba(30,41,59,0.72),rgba(2,6,23,0.84))] text-slate-100',
    pill: 'border-white/10 bg-white/[0.06] text-slate-200',
    icon: '🌙',
    label: 'Night',
    description: 'Sun is below the horizon',
  },
  golden: {
    shell:
      'border-amber-300/18 bg-[linear-gradient(135deg,rgba(251,191,36,0.18),rgba(15,23,42,0.82))] text-amber-50',
    pill: 'border-amber-300/20 bg-amber-400/10 text-amber-100',
    icon: '🌅',
    label: 'Golden Hour',
    description: 'Warm, diffused light ideal for photography',
  },
  day: {
    shell:
      'border-sky-300/18 bg-[linear-gradient(135deg,rgba(56,189,248,0.18),rgba(15,23,42,0.82))] text-sky-50',
    pill: 'border-sky-300/20 bg-sky-400/10 text-sky-100',
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
        className={`flex h-full flex-col items-center justify-center rounded-[24px] border border-white/10 bg-slate-950/35 p-6 text-center ${className}`}
      >
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/[0.05]">
          <span className="text-2xl grayscale opacity-70">☀️</span>
        </div>
        <p className="text-sm font-semibold text-white">No hour selected</p>
        <p className="mt-1 max-w-xs text-xs leading-5 text-slate-400">
          Click on the map rays or the hourly rail to surface a focused solar metric card.
        </p>
      </div>
    );
  }

  const stateStyle = STATE_STYLES[position.daylightState];

  return (
    <div className={`flex h-full flex-col ${className}`}>
      <div
        className={`mb-4 rounded-[24px] border p-4 shadow-[0_18px_46px_rgba(2,6,23,0.18)] backdrop-blur-xl ${stateStyle.shell}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl drop-shadow-sm sm:text-3xl">{stateStyle.icon}</span>
            <div>
              <p className="text-[0.64rem] font-semibold uppercase tracking-[0.28em] text-slate-300/72">
                Selected focus
              </p>
              <p className="mt-1 text-lg font-semibold tracking-[-0.02em] text-white sm:text-xl">
                {formatTime(position.hour)}
              </p>
              <p className="mt-1 text-xs text-slate-300/80">{position.localTimeLabel}</p>
            </div>
          </div>

          <span
            className={`inline-flex rounded-full border px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.22em] backdrop-blur-sm ${stateStyle.pill}`}
          >
            {stateStyle.label}
          </span>
        </div>

        <p className="mt-4 text-sm text-slate-200/85">{stateStyle.description}</p>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
        <MetricCard
          label="Azimuth"
          value={`${position.azimuthDeg.toFixed(0)}°`}
          meta={`${cardinalDir} (${shortDir})`}
          helper="Compass bearing of the sun"
          copyText={position.azimuthDeg.toFixed(1)}
          copyLabel="Azimuth"
          accent="from-sky-300/16 via-cyan-300/10 to-transparent"
        >
          <div className="hidden sm:block">
            <CompassIndicator azimuth={position.azimuthDeg} />
          </div>
        </MetricCard>

        <MetricCard
          label="Altitude"
          value={`${position.altitudeDeg >= 0 ? '+' : ''}${position.altitudeDeg.toFixed(1)}°`}
          meta={position.altitudeDeg < 0 ? 'Below horizon' : 'Above horizon'}
          helper={altDescription}
          copyText={position.altitudeDeg.toFixed(1)}
          copyLabel="Altitude"
          accent="from-amber-300/16 via-orange-300/10 to-transparent"
          dimmed={position.altitudeDeg < 0}
        />
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  meta,
  helper,
  copyText,
  copyLabel,
  accent,
  dimmed = false,
  children,
}: {
  label: string;
  value: string;
  meta: string;
  helper: string;
  copyText: string;
  copyLabel: string;
  accent: string;
  dimmed?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-[22px] border border-white/10 bg-slate-950/40 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${accent}`} />
      <div className="relative flex h-full flex-col">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-[0.64rem] font-semibold uppercase tracking-[0.24em] text-slate-400">
              {label}
            </p>
            <p
              className={`mt-3 text-2xl font-semibold tracking-[-0.04em] sm:text-3xl ${
                dimmed ? 'text-slate-300/60' : 'text-white'
              }`}
            >
              {value}
            </p>
          </div>
          <CopyButton text={copyText} label={copyLabel} />
        </div>

        <p className="text-sm font-medium text-slate-200">{meta}</p>
        <p className="mt-1 text-xs text-slate-400">{helper}</p>

        {children && <div className="mt-auto pt-4">{children}</div>}
      </div>
    </div>
  );
}

/**
 * Simple compass indicator showing sun direction
 */
function CompassIndicator({ azimuth }: { azimuth: number }) {
  return (
    <div className="relative h-16 w-16">
      <div className="absolute inset-0 rounded-full border border-white/10 bg-white/[0.03]" />

      <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] font-semibold text-slate-400">
        N
      </span>
      <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[9px] font-semibold text-slate-400">
        S
      </span>
      <span className="absolute top-1/2 -left-2.5 -translate-y-1/2 text-[9px] font-semibold text-slate-400">
        W
      </span>
      <span className="absolute top-1/2 -right-2.5 -translate-y-1/2 text-[9px] font-semibold text-slate-400">
        E
      </span>

      <div
        className="absolute left-1/2 top-1/2 h-0.5 w-5 origin-left bg-gradient-to-r from-amber-300 to-sky-300"
        style={{ transform: `rotate(${azimuth - 90}deg)` }}
      >
        <div className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-sky-200 shadow-[0_0_16px_rgba(125,211,252,0.75)]" />
      </div>

      <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
    </div>
  );
}

/**
 * Compact version for inline display
 */
export function MetricsPanelCompact({ position, className = '' }: MetricsPanelProps) {
  if (!position) {
    return <span className={`text-sm text-muted-foreground ${className}`}>No hour selected</span>;
  }

  const shortDir = getShortDirection(position.azimuthDeg);
  const stateStyle = STATE_STYLES[position.daylightState];

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <span className="font-medium">{formatTime(position.hour)}</span>
      <span className="text-muted-foreground">
        {position.azimuthDeg.toFixed(1)}° {shortDir}
      </span>
      <span className={position.altitudeDeg < 0 ? 'text-muted-foreground' : ''}>
        {position.altitudeDeg >= 0 ? '+' : ''}
        {position.altitudeDeg.toFixed(1)}°
      </span>
      <span>{stateStyle.icon}</span>
    </div>
  );
}
