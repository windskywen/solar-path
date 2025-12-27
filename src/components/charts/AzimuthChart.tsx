/**
 * AzimuthChart Component
 *
 * Line chart showing solar azimuth throughout the day.
 * Azimuth is the compass direction of the sun (0° = North, 90° = East, etc.)
 */

'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
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
  line: '#f59e0b', // amber-500
  selected: '#3b82f6', // blue-500
  grid: '#e2e8f0', // slate-200
  axis: '#94a3b8', // slate-400
  cardinal: '#94a3b8', // slate-400
};

// Cardinal direction reference lines
const CARDINAL_DIRECTIONS = [
  { value: 0, label: 'N' },
  { value: 90, label: 'E' },
  { value: 180, label: 'S' },
  { value: 270, label: 'W' },
];

interface ChartDataPoint {
  hour: number;
  azimuth: number;
  label: string;
  daylightState: DaylightState;
  cardinal: string;
}

/**
 * Get cardinal direction from azimuth
 */
function getCardinalDirection(azimuth: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(azimuth / 45) % 8;
  return directions[index];
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
 * Custom tooltip for azimuth chart
 */
function AzimuthTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: ChartDataPoint }> }) {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0].payload;

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-3">
      <p className="font-semibold text-slate-900 dark:text-white">{data.label}</p>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Azimuth: <span className="font-mono">{data.azimuth.toFixed(1)}°</span>
      </p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
        Direction: {data.cardinal}
      </p>
    </div>
  );
}

export interface AzimuthChartProps {
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
 * AzimuthChart displays solar azimuth throughout the day as a line chart
 */
export function AzimuthChart({
  positions,
  selectedHour,
  onHourClick,
  className = '',
  height = 200,
}: AzimuthChartProps) {
  // Transform positions into chart data
  const chartData = useMemo<ChartDataPoint[]>(() => {
    return positions.map((pos) => ({
      hour: pos.hour,
      azimuth: pos.azimuthDeg,
      label: formatHour(pos.hour),
      daylightState: pos.daylightState,
      cardinal: getCardinalDirection(pos.azimuthDeg),
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
      <div className={`flex items-center justify-center text-slate-400 ${className}`} style={{ height }}>
        No data available
      </div>
    );
  }

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart
          data={chartData}
          margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          onClick={handleClick}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
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
            domain={[0, 360]}
            ticks={[0, 90, 180, 270, 360]}
            tickFormatter={(value) => {
              const dir = CARDINAL_DIRECTIONS.find((d) => d.value === value);
              return dir ? `${value}° ${dir.label}` : `${value}°`;
            }}
          />
          <Tooltip content={<AzimuthTooltip />} />
          {/* Cardinal direction reference lines */}
          {CARDINAL_DIRECTIONS.map((dir) => (
            <ReferenceLine
              key={dir.label}
              y={dir.value}
              stroke={COLORS.cardinal}
              strokeDasharray="2 4"
              strokeOpacity={0.5}
            />
          ))}
          <Line
            type="monotone"
            dataKey="azimuth"
            stroke={COLORS.line}
            strokeWidth={2}
            dot={false}
            activeDot={{
              r: 6,
              fill: selectedHour !== null ? COLORS.selected : COLORS.line,
              stroke: '#fff',
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
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
