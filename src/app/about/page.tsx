import type { Metadata } from 'next';
import Link from 'next/link';
import { ContentPageHeader } from '@/components/layout/ContentPageHeader';
import { buildPageMetadata } from '@/lib/metadata';
import {
  buildBreadcrumbStructuredData,
  buildOrganizationStructuredData,
  buildWebPageStructuredData,
} from '@/lib/structured-data';

const title = 'About';
const description =
  'Learn why Solar Path Tracker exists, how its solar results are calculated and checked, which data sources it uses, and how to report an error.';
const path = '/about';
const lastUpdated = '2026-08-24';

export const metadata: Metadata = buildPageMetadata({
  title,
  description,
  path,
  keywords: [
    'about solar path tracker',
    'solar daylight planning tool',
    'solar calculation verification',
    'contact solar path tracker',
  ],
});

const structuredData = [
  buildOrganizationStructuredData(),
  buildWebPageStructuredData({ path, title, description }),
  buildBreadcrumbStructuredData([
    { name: 'Home', path: '/' },
    { name: 'About', path },
  ]),
];

const panel =
  'rounded-[28px] border [border-color:var(--solar-glass-border)] [background:var(--solar-rail-bg)] [box-shadow:var(--solar-rail-shadow)] backdrop-blur-xl';
const eyebrow =
  'text-[0.64rem] font-semibold uppercase tracking-[0.3em] text-[var(--solar-kicker)]';

export default function AboutPage() {
  return (
    <>
      <ContentPageHeader />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <main className="relative z-10 mx-auto w-full max-w-screen-2xl px-3 py-4 sm:px-4 lg:px-6">
        <header className="rounded-[30px] border px-4 py-6 [border-color:var(--solar-glass-border)] [background:var(--solar-glass-bg)] [box-shadow:var(--solar-glass-shadow)] backdrop-blur-2xl sm:px-6 sm:py-9">
          <nav aria-label="Breadcrumb" className="text-xs text-[var(--solar-text-muted)]">
            <Link href="/" className="hover:text-[var(--solar-text-strong)]">Home</Link>
            <span aria-hidden="true" className="mx-2">/</span>
            <span>About</span>
          </nav>
          <p className={`${eyebrow} mt-6`}>Purpose and accountability</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.045em] text-[var(--solar-text-strong)] sm:text-5xl">About Solar Path Tracker</h1>
          <p className="mt-5 max-w-4xl text-base leading-7 text-[var(--solar-text)] sm:text-lg">Solar Path Tracker turns a location, date, and local time into a readable sun path, solar angles, astronomical events, and educational worked examples. It is designed for first-pass daylight research before an on-site or professional assessment.</p>
          <p className="mt-5 text-xs text-[var(--solar-text-muted)]">Last updated: <time dateTime={lastUpdated}>24 August 2026</time></p>
        </header>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <section className={`${panel} p-4 sm:p-6`} aria-labelledby="purpose-heading">
            <p className={eyebrow}>Why it exists</p>
            <h2 id="purpose-heading" className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[var(--solar-text-strong)]">Make solar geometry easier to inspect</h2>
            <div className="mt-4 space-y-4 text-sm leading-7 text-[var(--solar-text)]">
              <p>Questions about direct light usually involve several facts at once: where the Sun sits around the compass, how high it is, how the path changes through the day, and when the horizon events occur. The site keeps those facts together in one visual workflow.</p>
              <p>The map and 3D scene support exploration. The calculators provide focused inputs and results. The guides explain how to interpret those results without claiming that an unobstructed astronomical model can see a real building, tree, hill, cloud layer, or window.</p>
            </div>
          </section>

          <section className={`${panel} p-4 sm:p-6`} aria-labelledby="audience-heading">
            <p className={eyebrow}>Who it helps</p>
            <h2 id="audience-heading" className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[var(--solar-text-strong)]">Typical use cases</h2>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-[var(--solar-text)]">
              <li>• Property researchers comparing morning, afternoon, winter, and summer exposure.</li>
              <li>• Photographers planning a low-angle light window and compass direction.</li>
              <li>• Designers and installers preparing observations before qualified site analysis.</li>
              <li>• Students and everyday users learning how azimuth, altitude, daylight, and shadows relate.</li>
            </ul>
          </section>
        </div>

        <section className={`${panel} mt-4 p-4 sm:p-6`} aria-labelledby="calculation-heading">
          <p className={eyebrow}>Sources and method</p>
          <h2 id="calculation-heading" className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[var(--solar-text-strong)]">Where the results come from</h2>
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            <article className="rounded-[22px] border p-4 [border-color:var(--solar-surface-border)] [background:var(--solar-surface-bg)]">
              <h3 className="font-semibold text-[var(--solar-text-strong)]">Solar calculations</h3>
              <p className="mt-3 text-sm leading-7 text-[var(--solar-text)]"><a href="https://github.com/mourner/suncalc" target="_blank" rel="noopener noreferrer" className="text-[var(--solar-accent)] underline underline-offset-4">SunCalc</a> supplies astronomical solar positions and events. Solar Path Tracker normalizes the angles and formats them for the selected local timezone.</p>
            </article>
            <article className="rounded-[22px] border p-4 [border-color:var(--solar-surface-border)] [background:var(--solar-surface-bg)]">
              <h3 className="font-semibold text-[var(--solar-text-strong)]">Time and location context</h3>
              <p className="mt-3 text-sm leading-7 text-[var(--solar-text)]">Luxon applies IANA timezone rules. Coordinate-to-timezone lookup is handled locally with @photostructure/tz-lookup. Geoapify powers primary location search, TomTom provides an automatically limited backup, and OpenStreetMap provides map data and coordinate links.</p>
            </article>
            <article className="rounded-[22px] border p-4 [border-color:var(--solar-surface-border)] [background:var(--solar-surface-bg)]">
              <h3 className="font-semibold text-[var(--solar-text-strong)]">Definitions and limits</h3>
              <p className="mt-3 text-sm leading-7 text-[var(--solar-text)]">The public <Link href="/methodology" className="text-[var(--solar-accent)] underline underline-offset-4">Methodology</Link> documents timezone conversion, azimuth normalization, altitude and event definitions, golden-hour differences, polar handling, rounding, and excluded real-world factors.</p>
            </article>
          </div>
        </section>

        <section id="editorial-process" className={`${panel} mt-4 scroll-mt-24 p-4 sm:p-6`} aria-labelledby="editorial-process-heading">
          <p className={eyebrow}>Editorial ownership</p>
          <h2 id="editorial-process-heading" className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[var(--solar-text-strong)]">Editorial and technical review process</h2>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <div className="space-y-4 text-sm leading-7 text-[var(--solar-text)]">
              <p><strong className="text-[var(--solar-text-strong)]">Solar Path Tracker is an independently operated educational and research tool.</strong> Its public author identity is the Solar Path Tracker organization. The site does not use a fabricated personal author or imply that its maintainers hold professional solar, architectural, surveying, or engineering certification.</p>
              <p>The <strong className="text-[var(--solar-text-strong)]">site maintainer</strong> is responsible for technical maintenance, reproducible datasets, worked examples, source checks, calculation tests, accessibility checks, and corrections to published content. Guide bylines link to this section so readers can see the role behind the review without requiring a private individual&apos;s name.</p>
            </div>
            <div className="space-y-4 text-sm leading-7 text-[var(--solar-text)]">
              <p>Reported discrepancies are reproduced from the submitted coordinates, local date and time, timezone, page, displayed output, and comparison source. A confirmed calculation or explanation error is corrected in code or content, covered by an automated regression check where practical, and released with the page&apos;s visible modified date changed only when that page actually changes.</p>
              <p>Model limits remain visible even when a benchmark passes: the engine describes unobstructed astronomical geometry and does not inspect terrain, buildings, vegetation, clouds, equipment, or a surveyed horizon. For consequential decisions, compare the output with an independent source and a qualified on-site assessment.</p>
            </div>
          </div>
          <div className="mt-5 rounded-[22px] border p-4 [border-color:var(--solar-surface-border)] [background:var(--solar-surface-bg)]">
            <h3 className="font-semibold text-[var(--solar-text-strong)]">Request a correction</h3>
            <p className="mt-2 text-sm leading-7 text-[var(--solar-text)]">Email <a href="mailto:solarpathtracker@gmail.com" className="font-semibold text-[var(--solar-accent)] underline underline-offset-4">solarpathtracker@gmail.com</a> or use the <Link href="/contact" className="font-semibold text-[var(--solar-accent)] underline underline-offset-4">Contact page</Link>. Include enough inputs to reproduce the result; private location details should be reduced to the precision needed for the check.</p>
          </div>
        </section>

        <section className={`${panel} mt-4 p-4 sm:p-6`} aria-labelledby="verification-heading">
          <p className={eyebrow}>Verification approach</p>
          <h2 id="verification-heading" className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[var(--solar-text-strong)]">How changes and examples are checked</h2>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <div className="space-y-4 text-sm leading-7 text-[var(--solar-text)]">
              <p>Calculation tests cover known locations, timezone conversion, normal sunrise/sunset days, polar day, polar night, event availability, and angle normalization. Fixed guide examples are recomputed from the same engine rather than copied from unrelated tables.</p>
              <p>Interface checks separately cover server/client date agreement, location search, manual coordinates, GPS on the main tool, date and hour selection, map and 3D interaction, calculator state isolation, structured data, sitemap entries, and disabled/enabled advertising modes.</p>
            </div>
            <div className="space-y-4 text-sm leading-7 text-[var(--solar-text)]">
              <p>A production HTTP response confirms routing and crawlability; a browser run confirms rendering and console behaviour. Neither is presented as proof of a particular physical horizon or device until that environment is actually tested.</p>
              <p>For consequential work, users should compare the result with a reliable independent source and an on-site observation. Rounded web output is not surveyed precision or professional certification.</p>
            </div>
          </div>
        </section>

        <section id="contact" className={`${panel} mt-4 p-4 sm:p-6`} aria-labelledby="contact-heading">
          <p className={eyebrow}>Contact and corrections</p>
          <h2 id="contact-heading" className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[var(--solar-text-strong)]">Report an error or ask a question</h2>
          <p className="mt-4 max-w-4xl text-sm leading-7 text-[var(--solar-text)]">The dedicated Contact page explains what to include for a reproducible calculation discrepancy, software bug, privacy question, or general request. The historical <code className="rounded bg-black/15 px-1.5 py-0.5">/about#contact</code> link remains available here for compatibility.</p>
          <p className="mt-3 text-sm text-[var(--solar-text)]">Public email: <a href="mailto:solarpathtracker@gmail.com" className="font-semibold text-[var(--solar-accent)] underline underline-offset-4">solarpathtracker@gmail.com</a></p>
          <Link href="/contact" className="mt-5 inline-flex min-h-11 items-center rounded-full border px-5 text-sm font-semibold text-[var(--solar-text-strong)] [border-color:var(--solar-pill-border)] [background:var(--solar-accent-soft)]">Go to Contact</Link>
        </section>
      </main>
    </>
  );
}
