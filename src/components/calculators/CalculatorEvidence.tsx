import { SolarValidationResults } from '@/components/validation/SolarValidationResults';
import { computeExtendedSunEvents, getCardinalDirection } from '@/lib/solar/extended-events';
import {
  evaluateAllSolarValidationBenchmarks,
  getSolarValidationResult,
} from '@/lib/solar/validation-benchmarks';
import type { SolarEventWindow } from '@/types/solar';
import type { SolarCalculatorMode } from './SolarCalculator';

const panelClass =
  'rounded-[28px] border p-4 [border-color:var(--solar-glass-border)] [background:var(--solar-rail-bg)] [box-shadow:var(--solar-glass-shadow)] sm:p-5';

interface ShotPlanRow {
  season: string;
  window: string;
  start: string;
  end: string;
  startDirection: string;
  endDirection: string;
}

function toShotPlanRows(season: string, morning: SolarEventWindow, evening: SolarEventWindow): ShotPlanRow[] {
  return [
    { label: 'Morning', window: morning },
    { label: 'Evening', window: evening },
  ].map(({ label, window }) => ({
    season,
    window: label,
    start: window.start?.localTime ?? 'Unavailable',
    end: window.end?.localTime ?? 'Unavailable',
    startDirection: window.start
      ? `${window.start.azimuthDeg.toFixed(1)}° ${getCardinalDirection(window.start.azimuthDeg)}`
      : 'Unavailable',
    endDirection: window.end
      ? `${window.end.azimuthDeg.toFixed(1)}° ${getCardinalDirection(window.end.azimuthDeg)}`
      : 'Unavailable',
  }));
}

function GoldenHourCompass() {
  return (
    <figure className="rounded-[24px] border p-4 [border-color:var(--solar-surface-border)] [background:var(--solar-surface-bg)]">
      <svg viewBox="0 0 300 300" role="img" aria-labelledby="calculator-compass-title calculator-compass-desc" className="mx-auto h-auto w-full max-w-[280px]">
        <title id="calculator-compass-title">Golden hour direction compass</title>
        <desc id="calculator-compass-desc">A compass explains how azimuth is measured clockwise from true north. Use the table for exact winter and summer bearings.</desc>
        <circle cx="150" cy="150" r="112" fill="none" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2" />
        <circle cx="150" cy="150" r="74" fill="none" stroke="currentColor" strokeOpacity="0.15" strokeDasharray="5 7" />
        <line x1="150" y1="28" x2="150" y2="272" stroke="currentColor" strokeOpacity="0.28" />
        <line x1="28" y1="150" x2="272" y2="150" stroke="currentColor" strokeOpacity="0.28" />
        <path d="M150 150 L88 74" stroke="#f59e0b" strokeWidth="7" strokeLinecap="round" />
        <path d="M150 150 L228 82" stroke="#fb7185" strokeWidth="7" strokeLinecap="round" />
        <circle cx="150" cy="150" r="8" fill="currentColor" />
        <g fill="currentColor" fontSize="16" fontWeight="700" textAnchor="middle">
          <text x="150" y="20">N · 0°</text>
          <text x="282" y="156">E · 90°</text>
          <text x="150" y="296">S · 180°</text>
          <text x="18" y="156">W · 270°</text>
        </g>
      </svg>
      <figcaption className="mt-3 text-sm leading-6 text-[var(--solar-text)]">
        Bearings are measured clockwise from true north. The diagram is explanatory; the table gives the calculated window boundaries.
      </figcaption>
    </figure>
  );
}

function EventEvidence() {
  const eventResults = evaluateAllSolarValidationBenchmarks().filter(
    (result) => result.kind === 'events'
  );

  return (
    <section className={panelClass} aria-labelledby="calculator-event-evidence-heading" data-testid="calculator-validation-evidence">
      <p className="text-[0.66rem] font-semibold uppercase tracking-[0.28em] text-[var(--solar-kicker)]">Independent comparison</p>
      <h2 id="calculator-event-evidence-heading" className="mt-2 text-xl font-semibold text-[var(--solar-text-strong)]">Independent event-time checks</h2>
      <p className="mt-3 max-w-4xl text-sm leading-6 text-[var(--solar-text)]">
        Fixed USNO API v4.0.1 snapshots for Brisbane, London, and Singapore are compared with this site&apos;s production engine. A pass requires every displayed event to be within two minutes.
      </p>
      <SolarValidationResults results={eventResults} />
    </section>
  );
}

function GoldenHourEvidence() {
  const winter = computeExtendedSunEvents(-27.4698, 153.0251, '2026-06-21', 'Australia/Brisbane');
  const summer = computeExtendedSunEvents(-27.4698, 153.0251, '2026-12-21', 'Australia/Brisbane');
  const rows = [
    ...toShotPlanRows('Winter solstice · 21 Jun', winter.morningGoldenHour, winter.eveningGoldenHour),
    ...toShotPlanRows('Summer solstice · 21 Dec', summer.morningGoldenHour, summer.eveningGoldenHour),
  ];

  return (
    <section className={panelClass} aria-labelledby="calculator-golden-evidence-heading" data-testid="calculator-validation-evidence">
      <p className="text-[0.66rem] font-semibold uppercase tracking-[0.28em] text-[var(--solar-kicker)]">Directional field plan</p>
      <h2 id="calculator-golden-evidence-heading" className="mt-2 text-xl font-semibold text-[var(--solar-text-strong)]">Brisbane golden-hour shot plan</h2>
      <p className="mt-3 max-w-4xl text-sm leading-6 text-[var(--solar-text)]">
        This calculator defines morning golden hour as sunrise to +6° altitude and evening golden hour as +6° altitude to sunset. The fixed winter and summer examples show why both timing and camera direction change by season.
      </p>
      <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(260px,0.36fr)]">
        <div className="overflow-x-auto rounded-[24px] border [border-color:var(--solar-surface-border)]">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="[background:var(--solar-surface-bg)] text-xs uppercase tracking-[0.16em] text-[var(--solar-text-muted)]">
              <tr>
                <th scope="col" className="px-4 py-3">Season</th>
                <th scope="col" className="px-4 py-3">Window</th>
                <th scope="col" className="px-4 py-3">Time</th>
                <th scope="col" className="px-4 py-3">Start bearing</th>
                <th scope="col" className="px-4 py-3">End bearing</th>
              </tr>
            </thead>
            <tbody className="text-[var(--solar-text)]">
              {rows.map((row) => (
                <tr key={`${row.season}-${row.window}`} className="border-t [border-color:var(--solar-divider)]">
                  <th scope="row" className="px-4 py-4 text-[var(--solar-text-strong)]">{row.season}</th>
                  <td className="px-4 py-4">{row.window}</td>
                  <td className="px-4 py-4">{row.start}–{row.end}</td>
                  <td className="px-4 py-4">{row.startDirection}</td>
                  <td className="px-4 py-4">{row.endDirection}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <GoldenHourCompass />
      </div>
      <ul className="mt-5 grid gap-3 text-sm leading-6 text-[var(--solar-text)] md:grid-cols-3">
        <li className="rounded-[20px] border p-4 [border-color:var(--solar-surface-border)] [background:var(--solar-surface-bg)]"><strong className="text-[var(--solar-text-strong)]">Before:</strong> confirm the horizon is unobstructed and note true north independently.</li>
        <li className="rounded-[20px] border p-4 [border-color:var(--solar-surface-border)] [background:var(--solar-surface-bg)]"><strong className="text-[var(--solar-text-strong)]">During:</strong> begin before the first boundary so setup time does not consume the window.</li>
        <li className="rounded-[20px] border p-4 [border-color:var(--solar-surface-border)] [background:var(--solar-surface-bg)]"><strong className="text-[var(--solar-text-strong)]">Limit:</strong> cloud, terrain, buildings, and visible-horizon refraction are not forecast here.</li>
      </ul>
    </section>
  );
}

function AngleEvidence() {
  const result = getSolarValidationResult('nrel-spa-golden-2003');
  if (!result) {
    return null;
  }

  return (
    <section className={panelClass} aria-labelledby="calculator-angle-evidence-heading" data-testid="calculator-validation-evidence">
      <p className="text-[0.66rem] font-semibold uppercase tracking-[0.28em] text-[var(--solar-kicker)]">Independent angular check</p>
      <h2 id="calculator-angle-evidence-heading" className="mt-2 text-xl font-semibold text-[var(--solar-text-strong)]">NREL SPA angle benchmark</h2>
      <p className="mt-3 max-w-4xl text-sm leading-6 text-[var(--solar-text)]">
        The canonical Golden, Colorado case compares external expected azimuth and altitude with the same production function used for the selected-time result above. The allowed absolute difference is 0.5°.
      </p>
      <SolarValidationResults results={[result]} />
    </section>
  );
}

export function CalculatorEvidence({ mode }: { mode: SolarCalculatorMode }) {
  if (mode === 'sunrise') {
    return <EventEvidence />;
  }
  if (mode === 'golden-hour') {
    return <GoldenHourEvidence />;
  }
  return <AngleEvidence />;
}
