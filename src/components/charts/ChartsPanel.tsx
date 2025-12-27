/**
 * ChartsPanel Component
 *
 * Container for altitude and azimuth charts with tabs or stacked layout.
 */

'use client';

import { useState } from 'react';
import { AltitudeChart } from './AltitudeChart';
import { AzimuthChart } from './AzimuthChart';
import type { HourlySolarPosition } from '@/types/solar';

type ChartView = 'altitude' | 'azimuth' | 'both';

export interface ChartsPanelProps {
  /** Hourly solar positions */
  positions: HourlySolarPosition[];
  /** Currently selected hour */
  selectedHour: number | null;
  /** Callback when an hour is clicked on chart */
  onHourClick?: (hour: number) => void;
  /** Initial view mode */
  defaultView?: ChartView;
  /** Additional CSS classes */
  className?: string;
}

/**
 * ChartsPanel provides altitude and azimuth charts with view controls
 */
export function ChartsPanel({
  positions,
  selectedHour,
  onHourClick,
  defaultView = 'altitude',
  className = '',
}: ChartsPanelProps) {
  const [view, setView] = useState<ChartView>(defaultView);

  const viewButtons: Array<{ value: ChartView; label: string }> = [
    { value: 'altitude', label: 'Altitude' },
    { value: 'azimuth', label: 'Azimuth' },
    { value: 'both', label: 'Both' },
  ];

  return (
    <div className={`bg-slate-50 dark:bg-slate-800/50 rounded-lg overflow-hidden ${className}`}>
      {/* View toggle buttons */}
      <div className="flex border-b border-slate-200 dark:border-slate-700">
        {viewButtons.map((btn) => (
          <button
            key={btn.value}
            type="button"
            onClick={() => setView(btn.value)}
            className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
              view === btn.value
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white border-b-2 border-amber-500'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50'
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Chart content */}
      <div className="p-3">
        {view === 'altitude' && (
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
              Sun altitude (angle above horizon) throughout the day
            </p>
            <AltitudeChart
              positions={positions}
              selectedHour={selectedHour}
              onHourClick={onHourClick}
              height={200}
            />
          </div>
        )}

        {view === 'azimuth' && (
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
              Sun azimuth (compass direction) throughout the day
            </p>
            <AzimuthChart
              positions={positions}
              selectedHour={selectedHour}
              onHourClick={onHourClick}
              height={200}
            />
          </div>
        )}

        {view === 'both' && (
          <div className="space-y-4">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                Altitude (angle above horizon)
              </p>
              <AltitudeChart
                positions={positions}
                selectedHour={selectedHour}
                onHourClick={onHourClick}
                height={150}
              />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                Azimuth (compass direction)
              </p>
              <AzimuthChart
                positions={positions}
                selectedHour={selectedHour}
                onHourClick={onHourClick}
                height={150}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
