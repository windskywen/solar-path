'use client';

import { useMemo } from 'react';
import { CsvDownloadButton } from '@/components/data/CsvDownloadButton';
import { SOLAR_MODEL_INFO } from '@/lib/solar/model-info';
import type { CsvDataset } from '@/lib/utils/csv';
import type { SolarDataset } from '@/types/solar';

interface CalculationReportPanelProps {
  data: SolarDataset;
  className?: string;
}

export function CalculationReportPanel({ data, className = '' }: CalculationReportPanelProps) {
  const csvDataset = useMemo<CsvDataset>(
    () => ({
      filename: `solar-path-${data.dateISO}`,
      metadata: [
        { key: 'model_id', value: SOLAR_MODEL_INFO.id },
        { key: 'model_reviewed_date', value: SOLAR_MODEL_INFO.reviewedDate },
        { key: 'location_name', value: data.location.name ?? 'Selected location' },
        { key: 'latitude', value: data.location.lat },
        { key: 'longitude', value: data.location.lng },
        { key: 'date', value: data.dateISO },
        { key: 'timezone', value: data.timezone },
        { key: 'civil_dawn', value: data.events.civilDawnLocal },
        { key: 'sunrise', value: data.events.sunriseLocal },
        { key: 'solar_noon', value: data.events.solarNoonBoundary?.localTime },
        { key: 'sunset', value: data.events.sunsetLocal },
        { key: 'civil_dusk', value: data.events.civilDuskLocal },
        { key: 'day_length', value: data.events.dayLengthLabel },
      ],
      columns: ['local_time', 'azimuth_deg', 'altitude_deg', 'daylight_state'],
      rows: data.hourly.map((position) => [
        position.localTimeLabel,
        position.azimuthDeg.toFixed(2),
        position.altitudeDeg.toFixed(2),
        position.daylightState,
      ]),
    }),
    [data]
  );

  return (
    <section
      className={className}
      aria-labelledby="reproducible-report-heading"
      data-testid="home-calculation-evidence"
    >
      <div className="p-4 sm:p-5">
        <p className="text-[0.64rem] font-semibold uppercase tracking-[0.3em] text-[var(--solar-kicker)]">Reproducible output</p>
        <h2 id="reproducible-report-heading" className="mt-2 text-xl font-semibold tracking-[-0.02em] text-[var(--solar-text-strong)]">
          Reproducible calculation report
        </h2>
        <p className="mt-2 text-sm leading-6 text-[var(--solar-text)]">
          Export the exact inputs and 24 hourly positions shown by this page. The file contains calculated solar geometry only—not raw search-provider data or a surveyed horizon.
        </p>

        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-[18px] border p-3 [border-color:var(--solar-surface-border)] [background:var(--solar-surface-bg)]">
            <dt className="text-xs uppercase tracking-[0.18em] text-[var(--solar-text-muted)]">Model</dt>
            <dd className="mt-2 font-semibold text-[var(--solar-text-strong)]">{SOLAR_MODEL_INFO.id}</dd>
          </div>
          <div className="rounded-[18px] border p-3 [border-color:var(--solar-surface-border)] [background:var(--solar-surface-bg)]">
            <dt className="text-xs uppercase tracking-[0.18em] text-[var(--solar-text-muted)]">Date and timezone</dt>
            <dd className="mt-2 font-semibold text-[var(--solar-text-strong)]">{data.dateISO} · {data.timezone}</dd>
          </div>
          <div className="rounded-[18px] border p-3 [border-color:var(--solar-surface-border)] [background:var(--solar-surface-bg)] sm:col-span-2">
            <dt className="text-xs uppercase tracking-[0.18em] text-[var(--solar-text-muted)]">Observation point</dt>
            <dd className="mt-2 font-semibold text-[var(--solar-text-strong)]">
              {data.location.name ?? 'Selected location'} · {data.location.lat.toFixed(6)}, {data.location.lng.toFixed(6)}
            </dd>
          </div>
          <div className="rounded-[18px] border p-3 [border-color:var(--solar-surface-border)] [background:var(--solar-surface-bg)] sm:col-span-2">
            <dt className="text-xs uppercase tracking-[0.18em] text-[var(--solar-text-muted)]">Calculated event times</dt>
            <dd className="mt-2 grid gap-2 text-[var(--solar-text)] sm:grid-cols-3">
              <span><strong className="text-[var(--solar-text-strong)]">Sunrise:</strong> {data.events.sunriseLocal ?? 'Unavailable'}</span>
              <span><strong className="text-[var(--solar-text-strong)]">Solar noon:</strong> {data.events.solarNoonBoundary?.localTime ?? 'Unavailable'}</span>
              <span><strong className="text-[var(--solar-text-strong)]">Sunset:</strong> {data.events.sunsetLocal ?? 'Unavailable'}</span>
            </dd>
          </div>
        </dl>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <CsvDownloadButton dataset={csvDataset} label="Download home calculation CSV" />
          <a href="/methodology#validation-report" className="text-sm font-semibold text-[var(--solar-accent)] underline underline-offset-4">
            Review the validation report
          </a>
        </div>
      </div>
    </section>
  );
}
