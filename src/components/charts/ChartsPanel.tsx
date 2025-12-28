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
      <div className="p-1 bg-slate-100 dark:bg-slate-800 rounded-lg m-3 flex gap-1">
        {viewButtons.map((btn) => (
          <button
            key={btn.value}
            type="button"
            onClick={() => setView(btn.value)}
            className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              view === btn.value
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Chart content */}
      <div className="px-3 pb-3">
        {view === 'altitude' && (
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 text-center">
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
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 text-center">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 text-center">
                Altitude (angle above horizon)
              </p>
              <AltitudeChart
                positions={positions}
                selectedHour={selectedHour}
                onHourClick={onHourClick}
                height={200}
              />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 text-center">
                Azimuth (compass direction)
              </p>
              <AzimuthChart
                positions={positions}
                selectedHour={selectedHour}
                onHourClick={onHourClick}
                height={200}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
