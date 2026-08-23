import type { ReactNode } from 'react';
import { CsvDownloadButton } from '@/components/data/CsvDownloadButton';
import {
  buildGuideEvidenceData,
  formatEvidenceDirection,
  type FacadeOrientationEvidence,
  type GuideEvidenceData,
  type GoldenHourShotPlanEvidence,
  type NrelSpaEvidence,
  type SeasonalComparisonEvidence,
  type ShadowDirectionEvidence,
  type SunPathDiagramEvidence,
} from '@/lib/guide-evidence';
import type { GuideDefinition } from '@/lib/guides';

const panelClass =
  'rounded-[30px] border [border-color:var(--solar-glass-border)] [background:var(--solar-glass-bg)] [box-shadow:var(--solar-glass-shadow)] backdrop-blur-2xl';
const eyebrow =
  'text-[0.64rem] font-semibold uppercase tracking-[0.3em] text-[var(--solar-kicker)]';

function EvidenceShell({
  guide,
  heading,
  intro,
  dataset,
  children,
}: {
  guide: GuideDefinition;
  heading: string;
  intro: string;
  dataset: GuideEvidenceData['dataset'];
  children: ReactNode;
}) {
  const headingId = `evidence-${guide.evidenceKey}`;

  return (
    <section
      className={`${panelClass} mt-4 overflow-hidden`}
      aria-labelledby={headingId}
      data-testid="guide-evidence"
      data-evidence-key={guide.evidenceKey}
    >
      <div className="border-b px-4 py-5 [border-color:var(--solar-divider)] sm:px-6">
        <p className={eyebrow}>{guide.contentTypeLabel}</p>
        <h2 id={headingId} className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[var(--solar-text-strong)]">{heading}</h2>
        <p className="mt-3 max-w-4xl text-sm leading-7 text-[var(--solar-text)]">{intro}</p>
      </div>
      <div className="p-4 sm:p-6">
        {children}
        <div className="mt-6 rounded-[22px] border p-4 [border-color:var(--solar-surface-border)] [background:var(--solar-surface-bg)]">
          <h3 className="font-semibold text-[var(--solar-text-strong)]">Download the evidence dataset</h3>
          <p className="mt-2 text-sm leading-6 text-[var(--solar-text)]">{guide.csvDefinition.description} The UTF-8 CSV uses a fixed column order and contains calculated values only.</p>
          <div className="mt-4">
            <CsvDownloadButton dataset={dataset} label={`Download ${guide.contentTypeLabel.toLowerCase()} CSV`} />
          </div>
        </div>
      </div>
    </section>
  );
}

function DiagramEvidence({ guide, data }: { guide: GuideDefinition; data: SunPathDiagramEvidence }) {
  const toX = (index: number) => 58 + index * 72;
  const toY = (altitude: number) => 232 - Math.max(-10, Math.min(90, altitude)) * 2.05;
  const path = data.rows.map((row, index) => `${index === 0 ? 'M' : 'L'} ${toX(index)} ${toY(row.altitudeDeg)}`).join(' ');

  return (
    <EvidenceShell
      guide={guide}
      heading="Brisbane equinox sun-path diagram dataset"
      intro="This original diagram plots seven fixed Brisbane readings on 23 September 2026. Every labelled point has the same time, azimuth, and altitude in the table and downloadable CSV, so the visual can be checked without estimating from pixels."
      dataset={data.dataset}
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(420px,0.8fr)]">
        <figure className="rounded-[24px] border p-4 [border-color:var(--solar-surface-border)] [background:var(--solar-surface-bg)]">
          <svg viewBox="0 0 560 320" role="img" aria-labelledby="diagram-title diagram-desc" className="h-auto w-full">
            <title id="diagram-title">Brisbane equinox solar altitude and azimuth points</title>
            <desc id="diagram-desc">A time-based curve rises from near the horizon in the morning to its highest altitude near noon and returns toward the horizon by evening. Each point is labelled with time and azimuth.</desc>
            <rect x="0" y="0" width="560" height="320" rx="18" fill="currentColor" fillOpacity="0.025" />
            {[0, 20, 40, 60, 80].map((altitude) => (
              <g key={altitude}>
                <line x1="44" y1={toY(altitude)} x2="524" y2={toY(altitude)} stroke="currentColor" strokeOpacity={altitude === 0 ? 0.45 : 0.13} strokeDasharray={altitude === 0 ? undefined : '5 7'} />
                <text x="36" y={toY(altitude) + 4} textAnchor="end" fill="currentColor" fillOpacity="0.7" fontSize="12">{altitude}°</text>
              </g>
            ))}
            <text x="48" y={toY(0) - 8} fill="currentColor" fillOpacity="0.72" fontSize="12" fontWeight="700">Astronomical horizon</text>
            <path d={path} fill="none" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            {data.rows.map((row, index) => {
              const x = toX(index);
              const y = toY(row.altitudeDeg);
              return (
                <g key={row.localTimeLabel}>
                  <circle cx={x} cy={y} r="6" fill="#f59e0b" stroke="white" strokeWidth="2" />
                  <text x={x} y={Math.max(18, y - 15)} textAnchor="middle" fill="currentColor" fontSize="11" fontWeight="700">{row.localTimeLabel}</text>
                  <text x={x} y={Math.min(302, y + 20)} textAnchor="middle" fill="currentColor" fillOpacity="0.72" fontSize="10">Az {row.azimuthDeg.toFixed(0)}°</text>
                </g>
              );
            })}
            <text x="284" y="316" textAnchor="middle" fill="currentColor" fillOpacity="0.68" fontSize="12">Local time · Australia/Brisbane</text>
          </svg>
          <figcaption className="mt-3 text-sm leading-6 text-[var(--solar-text)]">Altitude controls vertical position; the azimuth label identifies the compass bearing at the same timestamp. This is an unobstructed astronomical path, not a visible-horizon survey.</figcaption>
        </figure>

        <div className="overflow-x-auto rounded-[24px] border [border-color:var(--solar-surface-border)]">
          <table className="w-full min-w-[520px] text-left text-sm">
            <caption className="sr-only">Text alternative for every plotted Brisbane equinox point</caption>
            <thead className="[background:var(--solar-surface-bg)] text-xs uppercase tracking-[0.16em] text-[var(--solar-text-muted)]">
              <tr><th scope="col" className="px-4 py-3">Local time</th><th scope="col" className="px-4 py-3">Azimuth</th><th scope="col" className="px-4 py-3">Altitude</th><th scope="col" className="px-4 py-3">State</th></tr>
            </thead>
            <tbody className="text-[var(--solar-text)]">
              {data.rows.map((row) => (
                <tr key={row.localTimeLabel} className="border-t [border-color:var(--solar-divider)]">
                  <th scope="row" className="px-4 py-4 text-[var(--solar-text-strong)]">{row.localTimeLabel}</th>
                  <td className="px-4 py-4">{formatEvidenceDirection(row.azimuthDeg)}</td>
                  <td className="px-4 py-4">{row.altitudeDeg.toFixed(1)}°</td>
                  <td className="px-4 py-4 capitalize">{row.daylightState}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </EvidenceShell>
  );
}

function SeasonalEvidence({ guide, data }: { guide: GuideDefinition; data: SeasonalComparisonEvidence }) {
  const [winter, summer] = data.seasons;
  return (
    <EvidenceShell
      guide={guide}
      heading="Brisbane solstice 24-hour comparison"
      intro="The same Brisbane coordinates and timezone are calculated for 21 June and 21 December 2026. The event summary and every whole-hour pair make the seasonal change inspectable instead of reducing it to a generic claim about longer summer days."
      dataset={data.dataset}
    >
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        {data.seasons.map((season) => (
          <div key={season.dateISO} className="rounded-[22px] border p-4 [border-color:var(--solar-surface-border)] [background:var(--solar-surface-bg)] lg:col-span-1 xl:col-span-2">
            <h3 className="font-semibold text-[var(--solar-text-strong)]">{season.label} · {season.dateISO}</h3>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm text-[var(--solar-text)] sm:grid-cols-4">
              <div><dt className="text-xs text-[var(--solar-text-muted)]">Sunrise</dt><dd className="mt-1 font-semibold">{season.events.sunriseLocal ?? 'Unavailable'}</dd></div>
              <div><dt className="text-xs text-[var(--solar-text-muted)]">Solar noon</dt><dd className="mt-1 font-semibold">{season.events.solarNoonBoundary?.localTime ?? 'Unavailable'}</dd></div>
              <div><dt className="text-xs text-[var(--solar-text-muted)]">Sunset</dt><dd className="mt-1 font-semibold">{season.events.sunsetLocal ?? 'Unavailable'}</dd></div>
              <div><dt className="text-xs text-[var(--solar-text-muted)]">Day length</dt><dd className="mt-1 font-semibold">{season.events.dayLengthLabel ?? 'Unavailable'}</dd></div>
            </dl>
          </div>
        ))}
        <div className="rounded-[22px] border p-4 [border-color:var(--solar-pill-border)] [background:var(--solar-accent-soft)] lg:col-span-2 xl:col-span-2">
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--solar-text-muted)]">Solar-noon altitude change</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--solar-text-strong)]">{data.noonAltitudeDeltaDeg === null ? 'Unavailable' : `${data.noonAltitudeDeltaDeg.toFixed(1)}° higher in December`}</p>
        </div>
        <div className="rounded-[22px] border p-4 [border-color:var(--solar-pill-border)] [background:var(--solar-accent-soft)] lg:col-span-2 xl:col-span-2">
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--solar-text-muted)]">Calculated daylight change</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--solar-text-strong)]">{data.dayLengthDeltaHours === null ? 'Unavailable' : `${data.dayLengthDeltaHours.toFixed(2)} hours longer in December`}</p>
        </div>
      </div>

      <div className="mt-5 overflow-x-auto rounded-[24px] border [border-color:var(--solar-surface-border)]">
        <table className="w-full min-w-[900px] text-left text-sm">
          <caption className="sr-only">Twenty-four hour Brisbane winter and summer solar-angle comparison</caption>
          <thead className="[background:var(--solar-surface-bg)] text-xs uppercase tracking-[0.16em] text-[var(--solar-text-muted)]">
            <tr><th scope="col" className="px-4 py-3">Time</th><th scope="col" className="px-4 py-3">June azimuth</th><th scope="col" className="px-4 py-3">June altitude</th><th scope="col" className="px-4 py-3">December azimuth</th><th scope="col" className="px-4 py-3">December altitude</th><th scope="col" className="px-4 py-3">Altitude delta</th></tr>
          </thead>
          <tbody className="text-[var(--solar-text)]">
            {winter.positions.map((winterPosition, index) => {
              const summerPosition = summer.positions[index];
              return (
                <tr key={winterPosition.localTimeLabel} className="border-t [border-color:var(--solar-divider)]">
                  <th scope="row" className="px-4 py-3 text-[var(--solar-text-strong)]">{winterPosition.localTimeLabel}</th>
                  <td className="px-4 py-3">{winterPosition.azimuthDeg.toFixed(1)}°</td>
                  <td className="px-4 py-3">{winterPosition.altitudeDeg.toFixed(1)}°</td>
                  <td className="px-4 py-3">{summerPosition.azimuthDeg.toFixed(1)}°</td>
                  <td className="px-4 py-3">{summerPosition.altitudeDeg.toFixed(1)}°</td>
                  <td className="px-4 py-3">{(summerPosition.altitudeDeg - winterPosition.altitudeDeg).toFixed(1)}°</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </EvidenceShell>
  );
}

function FacadeEvidence({ guide, data }: { guide: GuideDefinition; data: FacadeOrientationEvidence }) {
  return (
    <EvidenceShell
      guide={guide}
      heading="Australian east–west facade bearing matrix"
      intro="Darwin, Brisbane, and Hobart are sampled at 08:00 and 16:00 on both solstices. The matrix reports solar geometry only: it identifies whether the bearing lies in the east-facing or west-facing half-sky and makes no claim about room temperature, cooling energy, or comfort."
      dataset={data.dataset}
    >
      <div className="rounded-[22px] border p-4 [border-color:var(--solar-warning-border)] [background:var(--solar-warning-bg)] text-sm leading-6 text-[var(--solar-warning-text)]">
        Geometry rule: an east-facing vertical plane can face bearings from 0° to 180°; a west-facing plane can face bearings from 180° to 360°. Actual direct light still depends on facade rotation, obstacles, opening depth, and solar altitude.
      </div>
      <div className="mt-5 overflow-x-auto rounded-[24px] border [border-color:var(--solar-surface-border)]">
        <table className="w-full min-w-[980px] text-left text-sm">
          <caption className="sr-only">Darwin, Brisbane, and Hobart seasonal facade orientation matrix</caption>
          <thead className="[background:var(--solar-surface-bg)] text-xs uppercase tracking-[0.16em] text-[var(--solar-text-muted)]">
            <tr><th scope="col" className="px-4 py-3">City</th><th scope="col" className="px-4 py-3">Season</th><th scope="col" className="px-4 py-3">Local time</th><th scope="col" className="px-4 py-3">Solar bearing</th><th scope="col" className="px-4 py-3">Altitude</th><th scope="col" className="px-4 py-3">Geometric exposure</th></tr>
          </thead>
          <tbody className="text-[var(--solar-text)]">
            {data.rows.map((row) => (
              <tr key={`${row.city}-${row.dateISO}-${row.position.localTimeLabel}`} className="border-t [border-color:var(--solar-divider)]">
                <th scope="row" className="px-4 py-4 text-[var(--solar-text-strong)]">{row.city}<span className="mt-1 block text-xs font-normal text-[var(--solar-text-muted)]">{row.timezone}</span></th>
                <td className="px-4 py-4">{row.season}<span className="mt-1 block text-xs text-[var(--solar-text-muted)]">{row.dateISO}</span></td>
                <td className="px-4 py-4">{row.position.localTimeLabel}</td>
                <td className="px-4 py-4">{formatEvidenceDirection(row.position.azimuthDeg)}</td>
                <td className="px-4 py-4">{row.position.altitudeDeg.toFixed(1)}°</td>
                <td className="px-4 py-4 font-semibold text-[var(--solar-text-strong)]">{row.exposure}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </EvidenceShell>
  );
}

function GoldenEvidence({ guide, data }: { guide: GuideDefinition; data: GoldenHourShotPlanEvidence }) {
  return (
    <EvidenceShell
      guide={guide}
      heading="Brisbane winter and summer directional shot plan"
      intro="This fixed planning sheet applies Solar Path Tracker’s explicit definition: morning golden hour runs from sunrise to +6° altitude, and evening golden hour runs from +6° altitude to sunset. The live calculator handles other dates and locations; this guide focuses on repeatable field preparation for Brisbane’s two solstices."
      dataset={data.dataset}
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="overflow-x-auto rounded-[24px] border [border-color:var(--solar-surface-border)]">
          <table className="w-full min-w-[820px] text-left text-sm">
            <caption className="sr-only">Brisbane golden hour boundary bearings for winter and summer</caption>
            <thead className="[background:var(--solar-surface-bg)] text-xs uppercase tracking-[0.16em] text-[var(--solar-text-muted)]">
              <tr><th scope="col" className="px-4 py-3">Season</th><th scope="col" className="px-4 py-3">Window</th><th scope="col" className="px-4 py-3">Boundary</th><th scope="col" className="px-4 py-3">Time</th><th scope="col" className="px-4 py-3">Direction</th><th scope="col" className="px-4 py-3">Altitude</th></tr>
            </thead>
            <tbody className="text-[var(--solar-text)]">
              {data.rows.map((row) => (
                <tr key={`${row.dateISO}-${row.window}-${row.boundary}`} className="border-t [border-color:var(--solar-divider)]">
                  <th scope="row" className="px-4 py-4 text-[var(--solar-text-strong)]">{row.season}<span className="mt-1 block text-xs font-normal text-[var(--solar-text-muted)]">{row.dateISO}</span></th>
                  <td className="px-4 py-4">{row.window}</td>
                  <td className="px-4 py-4">{row.boundary}</td>
                  <td className="px-4 py-4">{row.value?.localTime ?? 'Unavailable'}</td>
                  <td className="px-4 py-4">{row.value ? formatEvidenceDirection(row.value.azimuthDeg) : 'Unavailable'}</td>
                  <td className="px-4 py-4">{row.value ? `${row.value.altitudeDeg.toFixed(1)}°` : 'Unavailable'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <figure className="rounded-[24px] border p-4 [border-color:var(--solar-surface-border)] [background:var(--solar-surface-bg)]">
          <svg viewBox="0 0 280 280" role="img" aria-labelledby="guide-compass-title guide-compass-desc" className="mx-auto h-auto w-full">
            <title id="guide-compass-title">Golden hour field compass</title>
            <desc id="guide-compass-desc">A compass measured clockwise from true north with example arrows toward the north-east and north-west quadrants. Exact bearings are provided in the table.</desc>
            <circle cx="140" cy="140" r="105" fill="none" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2" />
            <line x1="140" y1="30" x2="140" y2="250" stroke="currentColor" strokeOpacity="0.25" />
            <line x1="30" y1="140" x2="250" y2="140" stroke="currentColor" strokeOpacity="0.25" />
            <path d="M140 140 76 72" stroke="#f59e0b" strokeWidth="7" strokeLinecap="round" />
            <path d="M140 140 210 76" stroke="#fb7185" strokeWidth="7" strokeLinecap="round" />
            <circle cx="140" cy="140" r="7" fill="currentColor" />
            <g fill="currentColor" fontSize="15" fontWeight="700" textAnchor="middle"><text x="140" y="20">N</text><text x="267" y="146">E</text><text x="140" y="274">S</text><text x="13" y="146">W</text></g>
          </svg>
          <figcaption className="mt-3 text-sm leading-6 text-[var(--solar-text)]">Use true-north bearings from the table. Arrive before the first boundary, check the actual horizon, and allow for cloud and setup time.</figcaption>
        </figure>
      </div>
      <ol className="mt-5 grid gap-3 text-sm leading-6 text-[var(--solar-text)] md:grid-cols-3">
        <li className="rounded-[20px] border p-4 [border-color:var(--solar-surface-border)] [background:var(--solar-surface-bg)]"><strong className="text-[var(--solar-text-strong)]">1. Scout:</strong> confirm the subject and horizon from the listed compass sector.</li>
        <li className="rounded-[20px] border p-4 [border-color:var(--solar-surface-border)] [background:var(--solar-surface-bg)]"><strong className="text-[var(--solar-text-strong)]">2. Arrive:</strong> set up before the start boundary; the window is not setup time.</li>
        <li className="rounded-[20px] border p-4 [border-color:var(--solar-surface-border)] [background:var(--solar-surface-bg)]"><strong className="text-[var(--solar-text-strong)]">3. Recheck:</strong> recalculate for the actual date if it is not a solstice reference.</li>
      </ol>
    </EvidenceShell>
  );
}

function NrelEvidence({ guide, data }: { guide: GuideDefinition; data: NrelSpaEvidence }) {
  return (
    <EvidenceShell
      guide={guide}
      heading="NREL SPA canonical Golden, Colorado comparison"
      intro="The published NREL Solar Position Algorithm example supplies a fixed instant, coordinates, and expected angles. Solar Path Tracker runs those inputs through its production engine, uses clockwise-from-true-north azimuth, and reports the absolute circular difference against a 0.5° tolerance."
      dataset={data.dataset}
    >
      <dl className="grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[20px] border p-4 [border-color:var(--solar-surface-border)] [background:var(--solar-surface-bg)]"><dt className="text-xs uppercase tracking-[0.16em] text-[var(--solar-text-muted)]">UTC instant</dt><dd className="mt-2 font-semibold text-[var(--solar-text-strong)]">{data.input.instantISO}</dd></div>
        <div className="rounded-[20px] border p-4 [border-color:var(--solar-surface-border)] [background:var(--solar-surface-bg)]"><dt className="text-xs uppercase tracking-[0.16em] text-[var(--solar-text-muted)]">Coordinates</dt><dd className="mt-2 font-semibold text-[var(--solar-text-strong)]">{data.input.latitude}, {data.input.longitude}</dd></div>
        <div className="rounded-[20px] border p-4 [border-color:var(--solar-surface-border)] [background:var(--solar-surface-bg)]"><dt className="text-xs uppercase tracking-[0.16em] text-[var(--solar-text-muted)]">Tolerance</dt><dd className="mt-2 font-semibold text-[var(--solar-text-strong)]">±0.5° per angle</dd></div>
        <div className={`rounded-[20px] border p-4 ${data.passed ? '[border-color:var(--solar-success-border)] [background:var(--solar-success-bg)]' : '[border-color:var(--solar-danger-border)] [background:var(--solar-danger-bg)]'}`}><dt className="text-xs uppercase tracking-[0.16em] text-[var(--solar-text-muted)]">Overall result</dt><dd className="mt-2 font-semibold text-[var(--solar-text-strong)]">{data.passed ? 'Pass' : 'Fail'}</dd></div>
      </dl>
      <div className="mt-5 overflow-x-auto rounded-[24px] border [border-color:var(--solar-surface-border)]">
        <table className="w-full min-w-[760px] text-left text-sm">
          <caption className="sr-only">NREL expected and Solar Path Tracker actual angle comparison</caption>
          <thead className="[background:var(--solar-surface-bg)] text-xs uppercase tracking-[0.16em] text-[var(--solar-text-muted)]"><tr><th scope="col" className="px-4 py-3">Angle</th><th scope="col" className="px-4 py-3">NREL expected</th><th scope="col" className="px-4 py-3">Site result</th><th scope="col" className="px-4 py-3">Absolute delta</th><th scope="col" className="px-4 py-3">Result</th></tr></thead>
          <tbody className="text-[var(--solar-text)]">
            {data.rows.map((row) => (
              <tr key={row.angle} className="border-t [border-color:var(--solar-divider)]"><th scope="row" className="px-4 py-4 text-[var(--solar-text-strong)]">{row.angle}</th><td className="px-4 py-4">{row.expectedDeg.toFixed(5)}°</td><td className="px-4 py-4">{row.actualDeg.toFixed(5)}°</td><td className="px-4 py-4">{row.deltaDeg.toFixed(5)}°</td><td className="px-4 py-4 font-semibold">{row.passed ? 'Pass' : 'Fail'}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-sm leading-7 text-[var(--solar-text)]">Azimuth is normalized to 0–360° clockwise from true north. Altitude is positive above the astronomical horizon. The comparison validates this fixed case only and is not NREL certification or approval.</p>
    </EvidenceShell>
  );
}

function ShadowEvidence({ guide, data }: { guide: GuideDefinition; data: ShadowDirectionEvidence }) {
  return (
    <EvidenceShell
      guide={guide}
      heading="Perth two-metre shadow direction test"
      intro="A two-metre vertical object in Perth is evaluated every two hours from 08:00 to 16:00 on 20 March 2026. Shadow bearing is (solar azimuth + 180) mod 360; theoretical length is object height divided by tan(solar altitude). No length is emitted when altitude is at or below 0°."
      dataset={data.dataset}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-[22px] border p-4 [border-color:var(--solar-surface-border)] [background:var(--solar-surface-bg)]"><p className="text-xs uppercase tracking-[0.16em] text-[var(--solar-text-muted)]">Direction</p><p className="mt-2 font-mono text-sm font-semibold text-[var(--solar-text-strong)]">shadow bearing = (azimuth + 180) mod 360</p></div>
        <div className="rounded-[22px] border p-4 [border-color:var(--solar-surface-border)] [background:var(--solar-surface-bg)]"><p className="text-xs uppercase tracking-[0.16em] text-[var(--solar-text-muted)]">Length on level ground</p><p className="mt-2 font-mono text-sm font-semibold text-[var(--solar-text-strong)]">length = 2 m / tan(altitude)</p></div>
      </div>
      <div className="mt-5 overflow-x-auto rounded-[24px] border [border-color:var(--solar-surface-border)]">
        <table className="w-full min-w-[920px] text-left text-sm">
          <caption className="sr-only">Perth theoretical shadow direction and length table for a two-metre object</caption>
          <thead className="[background:var(--solar-surface-bg)] text-xs uppercase tracking-[0.16em] text-[var(--solar-text-muted)]"><tr><th scope="col" className="px-4 py-3">Local time</th><th scope="col" className="px-4 py-3">Solar direction</th><th scope="col" className="px-4 py-3">Altitude</th><th scope="col" className="px-4 py-3">Shadow direction</th><th scope="col" className="px-4 py-3">Shadow length</th><th scope="col" className="px-4 py-3">State</th></tr></thead>
          <tbody className="text-[var(--solar-text)]">
            {data.rows.map((row) => (
              <tr key={row.localTime} className="border-t [border-color:var(--solar-divider)]">
                <th scope="row" className="px-4 py-4 text-[var(--solar-text-strong)]">{row.dateISO} {row.localTime}</th>
                <td className="px-4 py-4">{formatEvidenceDirection(row.position.azimuthDeg)}</td>
                <td className="px-4 py-4">{row.position.altitudeDeg.toFixed(1)}°</td>
                <td className="px-4 py-4">{row.shadowBearingDeg === null ? 'Unavailable' : formatEvidenceDirection(row.shadowBearingDeg)}</td>
                <td className="px-4 py-4">{row.shadowLengthM === null ? 'Unavailable' : `${row.shadowLengthM.toFixed(2)} m`}</td>
                <td className="px-4 py-4">{row.shadowLengthM === null ? 'No geometric shadow length' : 'Calculated on level ground'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-sm leading-7 text-[var(--solar-text)]">This result assumes a vertical object and level ground. Slope, object shape, diffuse light, terrain, and obstructions can change the visible shadow. It is a geometry estimate, not a surveyed shadow diagram.</p>
    </EvidenceShell>
  );
}

export function GuideEvidence({ guide }: { guide: GuideDefinition }) {
  const data = buildGuideEvidenceData(guide);
  switch (data.kind) {
    case 'sun-path-diagram':
      return <DiagramEvidence guide={guide} data={data} />;
    case 'seasonal-comparison':
      return <SeasonalEvidence guide={guide} data={data} />;
    case 'facade-orientation-matrix':
      return <FacadeEvidence guide={guide} data={data} />;
    case 'golden-hour-shot-plan':
      return <GoldenEvidence guide={guide} data={data} />;
    case 'nrel-spa-benchmark':
      return <NrelEvidence guide={guide} data={data} />;
    case 'shadow-direction-model':
      return <ShadowEvidence guide={guide} data={data} />;
  }
}
