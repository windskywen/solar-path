'use client';

import { useMemo, useState } from 'react';
import { CalculatorLocationPicker } from './CalculatorLocationPicker';
import { ChartsPanel } from '@/components/charts/ChartsPanel';
import { ToolAdPlacement } from '@/components/ads/ToolAdPlacement';
import { computeHourlyPositions } from '@/lib/solar/computation';
import {
  computeExtendedSunEvents,
  computeSolarPositionAtLocalTime,
  getCardinalDirection,
} from '@/lib/solar/extended-events';
import { getTimezoneFromCoordinates } from '@/lib/utils/timezone';
import type { ExtendedSunEvents, LocationPoint, SolarEventWindow } from '@/types/solar';

export type SolarCalculatorMode = 'sunrise' | 'golden-hour' | 'angles';

interface SolarCalculatorProps {
  mode: SolarCalculatorMode;
  initialDateISO: string;
}

const BRISBANE_LOCATION: LocationPoint = {
  lat: -27.4698,
  lng: 153.0251,
  name: 'Brisbane, Queensland, Australia',
  source: 'fallback',
};
const BRISBANE_REFERENCE_DATE = '2026-06-21';
const BRISBANE_REFERENCE_TIMEZONE = 'Australia/Brisbane';

const panelClass =
  'rounded-[28px] border [border-color:var(--solar-glass-border)] [background:var(--solar-rail-bg)] [box-shadow:var(--solar-glass-shadow)]';

function ResultCard({ label, value, helper }: { label: string; value: string; helper?: string }) {
  return (
    <div className="rounded-[22px] border p-4 [border-color:var(--solar-surface-border)] [background:var(--solar-surface-bg)]">
      <p className="text-[0.66rem] font-semibold uppercase tracking-[0.24em] text-[var(--solar-text-muted)]">{label}</p>
      <p className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-[var(--solar-text-strong)]">{value}</p>
      {helper ? <p className="mt-2 text-xs leading-5 text-[var(--solar-text-muted)]">{helper}</p> : null}
    </div>
  );
}

function EventWindowCard({ title, window }: { title: string; window: SolarEventWindow }) {
  if (!window.available || !window.start || !window.end) {
    return <ResultCard label={title} value="Unavailable" helper={window.note} />;
  }

  return (
    <div className="rounded-[22px] border p-4 [border-color:var(--solar-surface-border)] [background:var(--solar-surface-bg)]">
      <p className="text-[0.66rem] font-semibold uppercase tracking-[0.24em] text-[var(--solar-text-muted)]">{title}</p>
      <p className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-[var(--solar-text-strong)]">
        {window.start.localTime}–{window.end.localTime}
      </p>
      <dl className="mt-4 grid gap-3 text-xs text-[var(--solar-text)] sm:grid-cols-2">
        <div>
          <dt className="text-[var(--solar-text-muted)]">Start direction</dt>
          <dd className="mt-1 font-semibold text-[var(--solar-text-strong)]">
            {window.start.azimuthDeg.toFixed(1)}° {getCardinalDirection(window.start.azimuthDeg)}
          </dd>
          <dd className="mt-1 text-[var(--solar-text-muted)]">Altitude {window.start.altitudeDeg.toFixed(1)}°</dd>
        </div>
        <div>
          <dt className="text-[var(--solar-text-muted)]">End direction</dt>
          <dd className="mt-1 font-semibold text-[var(--solar-text-strong)]">
            {window.end.azimuthDeg.toFixed(1)}° {getCardinalDirection(window.end.azimuthDeg)}
          </dd>
          <dd className="mt-1 text-[var(--solar-text-muted)]">Altitude {window.end.altitudeDeg.toFixed(1)}°</dd>
        </div>
      </dl>
    </div>
  );
}

function SunriseResults({ events, timezone }: { events: ExtendedSunEvents; timezone: string }) {
  const specialCondition = events.note;
  return (
    <>
      {specialCondition ? (
        <p className="rounded-2xl border px-4 py-3 text-sm [border-color:var(--solar-warning-border)] [background:var(--solar-warning-bg)] text-[var(--solar-warning-text)]">
          {specialCondition}
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <ResultCard label="Civil dawn" value={events.civilDawnLocal ?? 'Unavailable'} helper="Sun at −6° altitude" />
        <ResultCard label="Sunrise" value={events.sunriseLocal ?? 'Unavailable'} />
        <ResultCard label="Sunset" value={events.sunsetLocal ?? 'Unavailable'} />
        <ResultCard label="Civil dusk" value={events.civilDuskLocal ?? 'Unavailable'} helper="Sun at −6° altitude" />
        <ResultCard label="Day length" value={events.dayLengthLabel ?? 'Unavailable'} helper={timezone} />
      </div>
    </>
  );
}

export function SolarCalculator({ mode, initialDateISO }: SolarCalculatorProps) {
  const [location, setLocation] = useState<LocationPoint>(BRISBANE_LOCATION);
  const [dateISO, setDateISO] = useState(initialDateISO);
  const [localTime, setLocalTime] = useState('12:00');
  const timezone = useMemo(
    () => getTimezoneFromCoordinates(location.lat, location.lng),
    [location.lat, location.lng]
  );
  const events = useMemo(
    () => computeExtendedSunEvents(location.lat, location.lng, dateISO, timezone),
    [dateISO, location.lat, location.lng, timezone]
  );
  const hourly = useMemo(
    () => computeHourlyPositions(location.lat, location.lng, dateISO, timezone),
    [dateISO, location.lat, location.lng, timezone]
  );
  const position = useMemo(
    () => computeSolarPositionAtLocalTime(location.lat, location.lng, dateISO, localTime, timezone),
    [dateISO, localTime, location.lat, location.lng, timezone]
  );
  const selectedHour = Number(localTime.slice(0, 2));
  const year = Number(dateISO.slice(0, 4));
  const seasonalEvents = useMemo(
    () => [
      { label: 'June solstice', date: `${year}-06-21`, events: computeExtendedSunEvents(location.lat, location.lng, `${year}-06-21`, timezone) },
      { label: 'December solstice', date: `${year}-12-21`, events: computeExtendedSunEvents(location.lat, location.lng, `${year}-12-21`, timezone) },
    ],
    [location.lat, location.lng, timezone, year]
  );
  const brisbaneReference = useMemo(
    () =>
      computeExtendedSunEvents(
        BRISBANE_LOCATION.lat,
        BRISBANE_LOCATION.lng,
        BRISBANE_REFERENCE_DATE,
        BRISBANE_REFERENCE_TIMEZONE
      ),
    []
  );

  return (
    <div className="space-y-4">
      <section className={`${panelClass} p-4 sm:p-5`} aria-labelledby="calculator-controls-heading">
        <div className="mb-5">
          <p className="text-[0.66rem] font-semibold uppercase tracking-[0.28em] text-[var(--solar-kicker)]">Calculator controls</p>
          <h2 id="calculator-controls-heading" className="mt-2 text-xl font-semibold text-[var(--solar-text-strong)]">Choose a location and date</h2>
        </div>
        <CalculatorLocationPicker value={location} onChange={setLocation} />
        <div className={`mt-4 grid gap-4 ${mode === 'angles' ? 'sm:grid-cols-2' : ''}`}>
          <label className="rounded-[20px] border p-4 text-sm [border-color:var(--solar-surface-border)] [background:var(--solar-surface-bg)]">
            <span className="block text-xs font-semibold uppercase tracking-[0.22em] text-[var(--solar-text-muted)]">Date</span>
            <input
              type="date"
              value={dateISO}
              onChange={(event) => {
                if (event.target.value) setDateISO(event.target.value);
              }}
              className="mt-3 h-11 w-full rounded-2xl border px-3 text-[var(--solar-text-strong)] [border-color:var(--solar-input-border)] [background:var(--solar-input-bg)]"
            />
          </label>
          {mode === 'angles' ? (
            <label className="rounded-[20px] border p-4 text-sm [border-color:var(--solar-surface-border)] [background:var(--solar-surface-bg)]">
              <span className="block text-xs font-semibold uppercase tracking-[0.22em] text-[var(--solar-text-muted)]">Local time</span>
              <input
                type="time"
                value={localTime}
                onChange={(event) => {
                  if (event.target.value) setLocalTime(event.target.value);
                }}
                className="mt-3 h-11 w-full rounded-2xl border px-3 text-[var(--solar-text-strong)] [border-color:var(--solar-input-border)] [background:var(--solar-input-bg)]"
              />
            </label>
          ) : null}
        </div>
      </section>

      <section className={`${panelClass} p-4 sm:p-5`} aria-labelledby="calculator-results-heading" aria-live="polite">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[0.66rem] font-semibold uppercase tracking-[0.28em] text-[var(--solar-kicker)]">Calculated result</p>
            <h2 id="calculator-results-heading" className="mt-2 text-xl font-semibold text-[var(--solar-text-strong)]">{location.name ?? 'Selected location'}</h2>
          </div>
          <p className="text-xs text-[var(--solar-text-muted)]">{dateISO} · {timezone}</p>
        </div>

        {mode === 'sunrise' ? <SunriseResults events={events} timezone={timezone} /> : null}

        {mode === 'golden-hour' ? (
          <div className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <EventWindowCard title="Morning golden hour" window={events.morningGoldenHour} />
              <EventWindowCard title="Evening golden hour" window={events.eveningGoldenHour} />
            </div>
            <ChartsPanel positions={hourly} selectedHour={null} defaultView="altitude" />
          </div>
        ) : null}

        {mode === 'angles' ? (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <ResultCard label="Local time" value={position.localTimeLabel} helper={timezone} />
              <ResultCard label="Azimuth" value={`${position.azimuthDeg.toFixed(1)}°`} helper={getCardinalDirection(position.azimuthDeg)} />
              <ResultCard label="Altitude" value={`${position.altitudeDeg >= 0 ? '+' : ''}${position.altitudeDeg.toFixed(1)}°`} helper="Angle above or below the horizon" />
              <ResultCard label="Daylight state" value={position.daylightState} helper="Hourly classification used by the main tool" />
            </div>
            <ChartsPanel
              positions={hourly}
              selectedHour={selectedHour}
              defaultView="both"
              onHourClick={(hour) => setLocalTime(`${hour.toString().padStart(2, '0')}:00`)}
            />
          </div>
        ) : null}
      </section>

      {mode === 'sunrise' ? (
        <div className="space-y-4">
          <section className={`${panelClass} overflow-hidden`} aria-labelledby="seasonal-comparison-heading">
            <div className="border-b px-4 py-4 [border-color:var(--solar-divider)] sm:px-5">
              <h2 id="seasonal-comparison-heading" className="text-xl font-semibold text-[var(--solar-text-strong)]">Solstice comparison</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="text-xs uppercase tracking-[0.18em] text-[var(--solar-text-muted)]">
                  <tr><th scope="col" className="px-5 py-3">Date</th><th scope="col" className="px-5 py-3">Sunrise</th><th scope="col" className="px-5 py-3">Sunset</th><th scope="col" className="px-5 py-3">Day length</th></tr>
                </thead>
                <tbody>
                  {seasonalEvents.map((row) => (
                    <tr key={row.date} className="border-t [border-color:var(--solar-divider)]">
                      <th scope="row" className="px-5 py-4 text-[var(--solar-text-strong)]">{row.label}<span className="ml-2 font-normal text-[var(--solar-text-muted)]">{row.date}</span></th>
                      <td className="px-5 py-4 text-[var(--solar-text)]">{row.events.sunriseLocal ?? 'Unavailable'}</td>
                      <td className="px-5 py-4 text-[var(--solar-text)]">{row.events.sunsetLocal ?? 'Unavailable'}</td>
                      <td className="px-5 py-4 text-[var(--solar-text)]">{row.events.dayLengthLabel ?? 'Unavailable'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className={`${panelClass} p-4 sm:p-5`} aria-labelledby="brisbane-reference-heading">
            <p className="text-[0.66rem] font-semibold uppercase tracking-[0.28em] text-[var(--solar-kicker)]">Stable worked example</p>
            <h2 id="brisbane-reference-heading" className="mt-2 text-xl font-semibold text-[var(--solar-text-strong)]">Brisbane · 21 June 2026</h2>
            <p className="mt-3 max-w-4xl text-sm leading-6 text-[var(--solar-text)]">At −27.4698, 153.0251 in Australia/Brisbane time, the engine reports civil dawn at {brisbaneReference.civilDawnLocal ?? 'unavailable'}, sunrise at {brisbaneReference.sunriseLocal ?? 'unavailable'}, sunset at {brisbaneReference.sunsetLocal ?? 'unavailable'}, and civil dusk at {brisbaneReference.civilDuskLocal ?? 'unavailable'}. Calculated daylight is {brisbaneReference.dayLengthLabel ?? 'unavailable'}.</p>
            <p className="mt-3 text-xs leading-5 text-[var(--solar-text-muted)]">This fixed reference is independent of the controls above, so readers and tests can reproduce it across visits.</p>
          </section>
        </div>
      ) : null}

      <ToolAdPlacement />
    </div>
  );
}
