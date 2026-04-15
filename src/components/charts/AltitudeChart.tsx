/**
 * AltitudeChart Component
 *
 * Area chart showing solar altitude throughout the day.
 * Altitude is the angle of the sun above (or below) the horizon.
 * - Positive values: sun is above horizon
 * - Negative values: sun is below horizon (nighttime)
 */

'use client';

import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import type { HourlySolarPosition, DaylightState } from '@/types/solar';

// Colors matching the app's design system
const COLORS = {
  day: '#fbbf24',
  golden: '#f59e0b',
  night: '#0f172a',
  selected: '#7dd3fc',
  grid: 'var(--solar-chart-grid)',
  axis: 'var(--solar-chart-axis)',
  horizon: '#fb7185',
  dotStroke: 'var(--solar-chart-dot-stroke)',
};

interface ChartDataPoint {
  hour: number;
  altitude: number;
  label: string;
  daylightState: DaylightState;
  fill: string;
}

/**
 * Get fill color based on daylight state
 */
function getFillColor(state: DaylightState): string {
  switch (state) {
    case 'day':
      return COLORS.day;
    case 'golden':
      return COLORS.golden;
    case 'night':
      return COLORS.night;
    default:
      return COLORS.day;
  }
}

/**
 * Format hour as time label
 */
function formatHour(hour: number): string {
  if (hour === 0 || hour === 24) return '12AM';
  if (hour === 12) return '12PM';
  if (hour < 12) return `${hour}AM`;
  return `${hour - 12}PM`;
}

/**
 * Custom tooltip for altitude chart
 */
function AltitudeTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: ChartDataPoint }>;
}) {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0].payload;
  const stateLabels: Record<DaylightState, string> = {
    day: '☀️ Day',
    golden: '🌅 Golden Hour',
    night: '🌙 Night',
  };

  return (
    <div className="rounded-2xl border [border-color:var(--solar-tooltip-border)] [background:var(--solar-tooltip-bg)] p-3 [box-shadow:var(--solar-tooltip-shadow)] backdrop-blur-xl">
      <p className="font-semibold text-[var(--solar-tooltip-strong)]">{data.label}</p>
      <p className="text-sm text-[var(--solar-tooltip-text)]">
        Altitude: <span className="font-mono">{data.altitude.toFixed(1)}°</span>
      </p>
      <p className="mt-1 text-xs text-[var(--solar-tooltip-muted)]">
        {stateLabels[data.daylightState]}
      </p>
    </div>
  );
}

export interface AltitudeChartProps {
  /** Hourly solar positions */
  positions: HourlySolarPosition[];
  /** Currently selected hour */
  selectedHour: number | null;
  /** Callback when an hour is clicked */
  onHourClick?: (hour: number) => void;
  /** Additional CSS classes */
  className?: string;
  /** Chart height in pixels */
  height?: number;
}

/**
 * AltitudeChart displays solar altitude throughout the day as an area chart
 */
export function AltitudeChart({
  positions,
  selectedHour,
  onHourClick,
  className = '',
  height = 200,
}: AltitudeChartProps) {
  // Transform positions into chart data
  const chartData = useMemo<ChartDataPoint[]>(() => {
    return positions.map((pos) => ({
      hour: pos.hour,
      altitude: pos.altitudeDeg,
      label: formatHour(pos.hour),
      daylightState: pos.daylightState,
      fill: getFillColor(pos.daylightState),
    }));
  }, [positions]);

  // Handle chart click
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleClick = (data: any) => {
    if (onHourClick && data?.activePayload?.[0]?.payload?.hour !== undefined) {
      onHourClick(data.activePayload[0].payload.hour);
    }
  };

  if (positions.length === 0) {
    return (
      <div
        className={`flex items-center justify-center text-[var(--solar-text-muted)] ${className}`}
        style={{ height }}
      >
        No data available
      </div>
    );
  }

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          onClick={handleClick}
        >
          <defs>
            <linearGradient id="altitudeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.day} stopOpacity={0.82} />
              <stop offset="55%" stopColor={COLORS.golden} stopOpacity={0.28} />
              <stop offset="95%" stopColor={COLORS.day} stopOpacity={0.06} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: COLORS.axis }}
            tickLine={false}
            axisLine={{ stroke: COLORS.grid }}
            interval={2}
          />
          <YAxis
            tick={{ fontSize: 10, fill: COLORS.axis }}
            tickLine={false}
            axisLine={{ stroke: COLORS.grid }}
            domain={['dataMin - 10', 'dataMax + 10']}
            tickFormatter={(value) => `${value}°`}
          />
          <Tooltip content={<AltitudeTooltip />} />
          <ReferenceLine
            y={0}
            stroke={COLORS.horizon}
            strokeDasharray="5 5"
            label={{
              value: 'Horizon',
              position: 'left',
              fill: COLORS.horizon,
              fontSize: 10,
            }}
          />
          <Area
            type="monotone"
            dataKey="altitude"
            stroke={COLORS.day}
            strokeWidth={2}
            fill="url(#altitudeGradient)"
            activeDot={{
              r: 6,
              fill: selectedHour !== null ? COLORS.selected : COLORS.day,
               stroke: COLORS.dotStroke,
               strokeWidth: 2,
             }}
          />
          {/* Selected hour marker */}
          {selectedHour !== null && (
            <ReferenceLine
              x={formatHour(selectedHour)}
              stroke={COLORS.selected}
              strokeWidth={2}
              strokeDasharray="5 5"
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
