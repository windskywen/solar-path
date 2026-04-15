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
      className={`overflow-hidden rounded-[24px] border [border-color:var(--solar-surface-border)] [background:var(--solar-surface-bg)] [box-shadow:var(--solar-surface-inset-shadow)] ${className}`}
    >
      <div className="border-b [border-color:var(--solar-divider)] px-3 pb-3 pt-3 sm:px-4 sm:pb-4 sm:pt-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[0.64rem] font-semibold uppercase tracking-[0.28em] text-[var(--solar-kicker)]">
              Curve deck
            </p>
            <p className="mt-1 text-sm text-[var(--solar-text)]">
              Compare the sun&apos;s height and compass path across the day.
            </p>
          </div>

          <div className="flex gap-1 rounded-full border [border-color:var(--solar-pill-border)] [background:var(--solar-pill-bg)] p-1">
            {viewButtons.map((btn) => (
              <button
                key={btn.value}
                type="button"
                onClick={() => setView(btn.value)}
                className={`flex-1 rounded-full px-3 py-1.5 text-[0.68rem] font-semibold transition-all duration-200 sm:flex-none sm:text-xs ${
                  view === btn.value
                    ? '[background:var(--solar-accent-soft)] text-[var(--solar-text-strong)] shadow-[0_0_24px_rgba(56,189,248,0.12)]'
                    : 'text-[var(--solar-text-muted)] hover:[background:var(--solar-button-hover-bg)] hover:text-[var(--solar-text-strong)]'
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
    <div className="rounded-[22px] border [border-color:var(--solar-chart-card-border)] [background:var(--solar-chart-card-bg)] p-3 [box-shadow:var(--solar-surface-inset-shadow)] sm:p-4">
      <p className="mb-3 text-center text-[0.72rem] leading-5 text-[var(--solar-text-muted)] sm:text-xs">
        {description}
      </p>
      {children}
    </div>
  );
}
