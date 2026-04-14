'use client';

/**
 * ChartsPanel Component
 *
 * Container for altitude and azimuth charts with tabs or stacked layout.
 */

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
    <div
      className={`overflow-hidden rounded-[24px] border border-white/10 bg-slate-950/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] ${className}`}
    >
      <div className="border-b border-white/10 px-3 pb-3 pt-3 sm:px-4 sm:pb-4 sm:pt-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[0.64rem] font-semibold uppercase tracking-[0.28em] text-sky-200/72">
              Curve deck
            </p>
            <p className="mt-1 text-sm text-slate-300">
              Compare the sun&apos;s height and compass path across the day.
            </p>
          </div>

          <div className="flex gap-1 rounded-full border border-white/10 bg-white/[0.04] p-1">
            {viewButtons.map((btn) => (
              <button
                key={btn.value}
                type="button"
                onClick={() => setView(btn.value)}
                className={`flex-1 rounded-full px-3 py-1.5 text-[0.68rem] font-semibold transition-all duration-200 sm:flex-none sm:text-xs ${
                  view === btn.value
                    ? 'bg-sky-400/14 text-sky-50 shadow-[0_0_24px_rgba(56,189,248,0.12)]'
                    : 'text-slate-400 hover:bg-white/[0.05] hover:text-slate-200'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4 px-3 pb-3 pt-4 sm:px-4 sm:pb-4">
        {view === 'altitude' && (
          <ChartSection
            description="Sun altitude - the angle above or below the horizon through the day."
          >
            <AltitudeChart
              positions={positions}
              selectedHour={selectedHour}
              onHourClick={onHourClick}
              height={220}
            />
          </ChartSection>
        )}

        {view === 'azimuth' && (
          <ChartSection description="Sun azimuth - the compass bearing the sun travels across the sky.">
            <AzimuthChart
              positions={positions}
              selectedHour={selectedHour}
              onHourClick={onHourClick}
              height={220}
            />
          </ChartSection>
        )}

        {view === 'both' && (
          <div className="grid grid-cols-1 gap-4">
            <ChartSection description="Altitude - angle above or below the horizon.">
              <AltitudeChart
                positions={positions}
                selectedHour={selectedHour}
                onHourClick={onHourClick}
                height={220}
              />
            </ChartSection>

            <ChartSection description="Azimuth - compass direction across the full day.">
              <AzimuthChart
                positions={positions}
                selectedHour={selectedHour}
                onHourClick={onHourClick}
                height={220}
              />
            </ChartSection>
          </div>
        )}
      </div>
    </div>
  );
}

function ChartSection({
  description,
  children,
}: {
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:p-4">
      <p className="mb-3 text-center text-[0.72rem] leading-5 text-slate-400 sm:text-xs">
        {description}
      </p>
      {children}
    </div>
  );
}
