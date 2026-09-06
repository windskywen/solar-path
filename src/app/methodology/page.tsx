import { CONTENT_MODIFIED } from '@/lib/content-dates';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ContentPageHeader } from '@/components/layout/ContentPageHeader';
import { SolarValidationResults } from '@/components/validation/SolarValidationResults';
import { buildPageMetadata } from '@/lib/metadata';
import { SOLAR_MODEL_INFO } from '@/lib/solar/model-info';
import { evaluateAllSolarValidationBenchmarks } from '@/lib/solar/validation-benchmarks';
import {
  buildBreadcrumbStructuredData,
  buildWebPageStructuredData,
} from '@/lib/structured-data';

const title = 'Calculation Methodology';
const description =
  'How Solar Path Tracker calculates solar position, event times, timezones, golden hour, daylight states, and polar conditions, including precision limits.';
const path = '/methodology';
const lastUpdated = CONTENT_MODIFIED.methodology;

export const metadata: Metadata = buildPageMetadata({
  title,
  description,
  path,
  keywords: [
    'solar calculation methodology',
    'SunCalc methodology',
    'solar azimuth normalization',
    'golden hour definition',
    'polar day calculation',
  ],
});

const structuredData = [
  buildWebPageStructuredData({ path, title, description }),
  buildBreadcrumbStructuredData([
    { name: 'Home', path: '/' },
    { name: title, path },
  ]),
];

const panel =
  'rounded-[28px] border [border-color:var(--solar-glass-border)] [background:var(--solar-rail-bg)] [box-shadow:var(--solar-rail-shadow)] backdrop-blur-xl';
const eyebrow =
  'text-[0.64rem] font-semibold uppercase tracking-[0.3em] text-[var(--solar-kicker)]';

export default function MethodologyPage() {
  const validationResults = evaluateAllSolarValidationBenchmarks();

  return (
    <>
      <ContentPageHeader />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <main className="relative z-10 mx-auto w-full max-w-screen-2xl px-3 py-4 sm:px-4 lg:px-6">
        <header className="rounded-[30px] border px-4 py-6 [border-color:var(--solar-glass-border)] [background:var(--solar-glass-bg)] [box-shadow:var(--solar-glass-shadow)] backdrop-blur-2xl sm:px-6 sm:py-9">
          <nav aria-label="Breadcrumb" className="text-xs text-[var(--solar-text-muted)]">
            <Link href="/" className="hover:text-[var(--solar-text-strong)]">Home</Link>
            <span aria-hidden="true" className="mx-2">/</span>
            <span>{title}</span>
          </nav>
          <p className={`${eyebrow} mt-6`}>Transparent calculations</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.045em] text-[var(--solar-text-strong)] sm:text-5xl">{title}</h1>
          <p className="mt-5 max-w-4xl text-base leading-7 text-[var(--solar-text)] sm:text-lg">{description}</p>
          <p className="mt-5 text-xs text-[var(--solar-text-muted)]">Last updated: <time dateTime={lastUpdated}>{new Intl.DateTimeFormat('en-AU', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${lastUpdated}T00:00:00Z`))}</time></p>
        </header>

        <div className="mt-4 grid gap-4">
          <section id="validation-report" className={`${panel} scroll-mt-24 p-4 sm:p-6`} aria-labelledby="validation-report-heading">
            <p className={eyebrow}>Reproducible checks</p>
            <h2 id="validation-report-heading" className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[var(--solar-text-strong)]">Independent validation report</h2>
            <div className="mt-4 max-w-5xl space-y-4 text-sm leading-7 text-[var(--solar-text)] sm:text-base">
              <p>
                Solar Path Tracker identifies this calculation profile as <strong className="text-[var(--solar-text-strong)]">{SOLAR_MODEL_INFO.id}</strong>. The checks below run the same production solar engine used by the calculators against fixed, independently published reference values. They do not call NREL, USNO, NOAA, or any other external service while browsing, building, or downloading a CSV.
              </p>
              <p>
                A pass means the calculated result is within the stated tolerance for this exact input—not that every site condition has been measured. These references do not certify, approve, or endorse Solar Path Tracker.
              </p>
            </div>

            <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-[20px] border p-4 [border-color:var(--solar-surface-border)] [background:var(--solar-surface-bg)]">
                <dt className="text-xs uppercase tracking-[0.16em] text-[var(--solar-text-muted)]">Model</dt>
                <dd className="mt-2 font-semibold text-[var(--solar-text-strong)]">{SOLAR_MODEL_INFO.id}</dd>
              </div>
              <div className="rounded-[20px] border p-4 [border-color:var(--solar-surface-border)] [background:var(--solar-surface-bg)]">
                <dt className="text-xs uppercase tracking-[0.16em] text-[var(--solar-text-muted)]">Sun position</dt>
                <dd className="mt-2 font-semibold text-[var(--solar-text-strong)]">SunCalc {SOLAR_MODEL_INFO.dependencies.suncalc}</dd>
              </div>
              <div className="rounded-[20px] border p-4 [border-color:var(--solar-surface-border)] [background:var(--solar-surface-bg)]">
                <dt className="text-xs uppercase tracking-[0.16em] text-[var(--solar-text-muted)]">Local time</dt>
                <dd className="mt-2 font-semibold text-[var(--solar-text-strong)]">Luxon {SOLAR_MODEL_INFO.dependencies.luxon}</dd>
              </div>
              <div className="rounded-[20px] border p-4 [border-color:var(--solar-surface-border)] [background:var(--solar-surface-bg)]">
                <dt className="text-xs uppercase tracking-[0.16em] text-[var(--solar-text-muted)]">Timezone lookup</dt>
                <dd className="mt-2 font-semibold text-[var(--solar-text-strong)]">tz-lookup {SOLAR_MODEL_INFO.dependencies.timezoneLookup}</dd>
              </div>
            </dl>

            <SolarValidationResults results={validationResults} />
          </section>

          <section className={`${panel} p-4 sm:p-6`} aria-labelledby="inputs-heading">
            <p className={eyebrow}>Inputs and time</p>
            <h2 id="inputs-heading" className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[var(--solar-text-strong)]">Location, date, and timezone handling</h2>
            <div className="mt-4 max-w-5xl space-y-4 text-sm leading-7 text-[var(--solar-text)] sm:text-base">
              <p>Latitude and longitude identify the observer. The <a href="https://github.com/photostructure/tz-lookup" target="_blank" rel="noopener noreferrer" className="text-[var(--solar-accent)] underline underline-offset-4">@photostructure/tz-lookup</a> dataset maps those coordinates to an IANA timezone where possible. For unmapped ocean coordinates, the site uses a longitude-based fixed-offset fallback.</p>
              <p><a href="https://moment.github.io/luxon/" target="_blank" rel="noopener noreferrer" className="text-[var(--solar-accent)] underline underline-offset-4">Luxon</a> constructs each selected local date and time in that timezone and converts the instant for calculation. This preserves timezone-boundary and daylight-saving rules represented by the runtime’s IANA data. The browser’s timezone is not substituted for the selected location.</p>
              <p>The interactive home receives its initial UTC date from the server so server HTML and the first browser render match. After mount, an old incremental-static-render date is refreshed only if the user has not already selected a different date.</p>
            </div>
          </section>

          <section className={`${panel} p-4 sm:p-6`} aria-labelledby="position-heading">
            <p className={eyebrow}>Position engine</p>
            <h2 id="position-heading" className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[var(--solar-text-strong)]">SunCalc position and angle conventions</h2>
            <div className="mt-4 max-w-5xl space-y-4 text-sm leading-7 text-[var(--solar-text)] sm:text-base">
              <p>The site uses the open-source <a href="https://github.com/mourner/suncalc" target="_blank" rel="noopener noreferrer" className="text-[var(--solar-accent)] underline underline-offset-4">SunCalc</a> library for solar positions and event times. SunCalc returns altitude in radians and azimuth in radians relative to south. Solar Path Tracker converts radians to degrees and normalizes azimuth with <code className="rounded bg-black/15 px-1.5 py-0.5">(degrees + 180) mod 360</code>.</p>
              <p>The public convention is clockwise from true north: north 0°, east 90°, south 180°, and west 270°. Altitude is signed: 0° at the astronomical horizon, positive above it, and negative below it. Internal values are rounded to two decimal places; most interface values display one decimal place.</p>
              <p>The 24-hour dataset samples each whole local hour. A selected local time in the Solar Azimuth &amp; Altitude Calculator is calculated directly and is not interpolated from those hourly samples.</p>
            </div>
          </section>

          <section className={`${panel} p-4 sm:p-6`} aria-labelledby="events-heading">
            <p className={eyebrow}>Event definitions</p>
            <h2 id="events-heading" className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[var(--solar-text-strong)]">Sunrise, civil twilight, and golden hour</h2>
            <div className="mt-5 overflow-x-auto rounded-[22px] border [border-color:var(--solar-surface-border)]">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="[background:var(--solar-surface-bg)] text-xs uppercase tracking-[0.16em] text-[var(--solar-text-muted)]">
                  <tr><th className="px-4 py-3" scope="col">Output</th><th className="px-4 py-3" scope="col">Definition used</th><th className="px-4 py-3" scope="col">How it appears</th></tr>
                </thead>
                <tbody className="text-[var(--solar-text)]">
                  <tr className="border-t [border-color:var(--solar-divider)]"><th scope="row" className="px-4 py-4 text-[var(--solar-text-strong)]">Sunrise / sunset</th><td className="px-4 py-4">SunCalc’s standard sunrise and sunset events, including its conventional horizon/refraction model.</td><td className="px-4 py-4">Exact local event timestamps when available.</td></tr>
                  <tr className="border-t [border-color:var(--solar-divider)]"><th scope="row" className="px-4 py-4 text-[var(--solar-text-strong)]">Civil dawn / dusk</th><td className="px-4 py-4">The Sun crosses −6° altitude before sunrise or after sunset.</td><td className="px-4 py-4">Exact local event timestamps when available.</td></tr>
                  <tr className="border-t [border-color:var(--solar-divider)]"><th scope="row" className="px-4 py-4 text-[var(--solar-text-strong)]">Calculator golden hour</th><td className="px-4 py-4">Morning: sunrise to +6°. Evening: +6° to sunset.</td><td className="px-4 py-4">Exact window boundaries with angle and bearing.</td></tr>
                  <tr className="border-t [border-color:var(--solar-divider)]"><th scope="row" className="px-4 py-4 text-[var(--solar-text-strong)]">Home hourly state</th><td className="px-4 py-4">A sampled altitude below 0° is night, 0–6° is approximate golden, and above 6° is day.</td><td className="px-4 py-4">A whole-hour classification, not an exact event boundary. Home daylight and golden-hour duration summaries use event boundaries rather than counts of hourly samples.</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className={`${panel} p-4 sm:p-6`} aria-labelledby="polar-heading">
            <p className={eyebrow}>Edge conditions</p>
            <h2 id="polar-heading" className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[var(--solar-text-strong)]">Polar day, polar night, and unavailable events</h2>
            <div className="mt-4 max-w-5xl space-y-4 text-sm leading-7 text-[var(--solar-text)] sm:text-base">
              <p>If both standard sunrise and sunset are unavailable, the engine checks the Sun’s altitude at local noon. A positive altitude is reported as midnight sun with 24 hours of daylight; a negative altitude is reported as polar night with zero hours of daylight. Transition dates where only one boundary occurs are labelled explicitly.</p>
              <p>Civil and golden-hour events are returned as unavailable when their boundary timestamps do not exist. The calculators do not invent, clamp, or reuse a neighbouring day’s time.</p>
            </div>
          </section>

          <section className={`${panel} p-4 sm:p-6`} aria-labelledby="limits-heading">
            <p className={eyebrow}>Precision and scope</p>
            <h2 id="limits-heading" className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[var(--solar-text-strong)]">What the model does not calculate</h2>
            <p className="mt-4 max-w-5xl text-sm leading-7 text-[var(--solar-text)]">Terrain and buildings may appear in the 3D view as visual context where available. These visual layers are separate from the astronomical engine and do not change its solar positions or event times.</p>
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <ul className="space-y-3 rounded-[22px] border p-4 text-sm leading-6 [border-color:var(--solar-surface-border)] [background:var(--solar-surface-bg)] text-[var(--solar-text)]">
                <li>• No shading calculation from terrain elevation, skyline masks, buildings, trees, or window geometry.</li>
                <li>• No live cloud, haze, smoke, aerosol, visibility, or weather-dependent refraction.</li>
                <li>• No observer elevation correction or surveyed true-horizon measurement.</li>
              </ul>
              <ul className="space-y-3 rounded-[22px] border p-4 text-sm leading-6 [border-color:var(--solar-surface-border)] [background:var(--solar-surface-bg)] text-[var(--solar-text)]">
                <li>• No solar-panel yield, optimal tilt, equipment loss, structural, glare, or compliance model.</li>
                <li>• No guarantee that a rounded display time matches a visible event to the minute at an obstructed site.</li>
                <li>• No replacement for professional surveying, architectural, engineering, or installation analysis.</li>
              </ul>
            </div>
            <p className="mt-5 text-sm leading-7 text-[var(--solar-text)]">To report a reproducible discrepancy, include the coordinates, date, local time, expected timezone, page used, displayed result, comparison source, and a screenshot. See the <Link href="/contact" className="text-[var(--solar-accent)] underline underline-offset-4">Contact page</Link>.</p>
          </section>
        </div>
      </main>
    </>
  );
}
