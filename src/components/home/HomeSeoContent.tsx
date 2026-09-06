import Link from 'next/link';

const glassPanel =
  'rounded-[30px] border [border-color:var(--solar-glass-border)] [background:var(--solar-glass-bg)] [box-shadow:var(--solar-glass-shadow)] backdrop-blur-2xl';
const surfacePanel =
  'rounded-[22px] border p-4 [border-color:var(--solar-surface-border)] [background:var(--solar-surface-bg)]';
const eyebrow =
  'text-[0.64rem] font-semibold uppercase tracking-[0.3em] text-[var(--solar-kicker)]';
const textLink =
  'font-semibold text-[var(--solar-accent)] underline decoration-sky-200/40 underline-offset-4 transition-colors hover:text-[var(--solar-text-strong)]';

/**
 * Server-rendered supporting content for the primary Sun Path / Sun Tracker intent.
 * It intentionally lives outside the interactive home app so it does not depend on
 * SolarStore state or add a client-side bundle to the map experience.
 */
export function HomeSeoContent() {
  return (
    <section
      className="relative z-10 mx-auto w-full max-w-screen-2xl px-3 pb-4 sm:px-4 lg:px-6"
      aria-labelledby="sun-path-map-guide-heading"
    >
      <div className={glassPanel}>
        <div className="grid gap-4 p-4 sm:p-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
          <section aria-labelledby="sun-path-map-guide-heading">
            <p className={eyebrow}>Use the map</p>
            <h2
              id="sun-path-map-guide-heading"
              className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[var(--solar-text-strong)]"
            >
              Check a sun path for a place, date, and time
            </h2>
            <div className="mt-4 max-w-3xl space-y-4 text-sm leading-7 text-[var(--solar-text)] sm:text-base">
              <p>
                Search for an address, landmark, city, or coordinates, then choose the date and
                time you want to inspect. The interactive sun path map calculates the solar path
                for that observation point so you can compare where the Sun sits across the day.
              </p>
              <p>
                Use <strong className="text-[var(--solar-text-strong)]">azimuth</strong> to read
                the Sun&apos;s compass direction and <strong className="text-[var(--solar-text-strong)]">altitude</strong>{' '}
                (also called elevation) to read its height above or below the horizon. Together,
                those values describe the Sun&apos;s position at a selected moment.
              </p>
              <p>
                For exact event times, open the{' '}
                <Link href="/sunrise-sunset-calculator" className={textLink}>
                  Sunrise &amp; Sunset Calculator
                </Link>
                . For a focused bearing and angle result, use the{' '}
                <Link href="/solar-azimuth-altitude" className={textLink}>
                  Sun Position &amp; Angle Calculator
                </Link>
                . You can also learn how to interpret the curves in{' '}
                <Link href="/guides/how-to-read-a-sun-path-diagram" className={textLink}>
                  How to Read a Sun Path Diagram
                </Link>
                .
              </p>
            </div>
          </section>

          <aside className={surfacePanel} aria-labelledby="sun-tracker-model-heading">
            <p className={eyebrow}>What the tracker calculates</p>
            <h2
              id="sun-tracker-model-heading"
              className="mt-2 text-xl font-semibold tracking-[-0.02em] text-[var(--solar-text-strong)]"
            >
              A calculated solar position, not a live sensor
            </h2>
            <div className="mt-4 space-y-4 text-sm leading-7 text-[var(--solar-text)]">
              <p>
                This sun tracker is an interactive calculator, not a live sensor. It calculates
                the Sun&apos;s geometric position from the location, date, and local time you choose.
              </p>
              <p>
                Terrain and buildings may appear in the 3D view as visual context where data and
                device display mode allow. Those visual layers do not affect the calculation: it
                does not calculate shading from terrain, buildings, or trees and does not model
                weather, cloud, or surveyed site geometry. Check real obstructions on site before
                making an architectural, engineering, safety, or installation decision.
              </p>
            </div>
          </aside>
        </div>

        <section className="border-t p-4 [border-color:var(--solar-divider)] sm:p-6" aria-labelledby="sun-path-faq-heading">
          <p className={eyebrow}>Questions</p>
          <h2
            id="sun-path-faq-heading"
            className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[var(--solar-text-strong)]"
          >
            Sun path map FAQs
          </h2>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <article className={surfacePanel}>
              <h3 className="font-semibold text-[var(--solar-text-strong)]">
                What does a sun path map show?
              </h3>
              <p className="mt-3 text-sm leading-6 text-[var(--solar-text)]">
                It shows the calculated path of the Sun across the sky for a location and date,
                including the changing compass direction and height above the horizon.
              </p>
            </article>
            <article className={surfacePanel}>
              <h3 className="font-semibold text-[var(--solar-text-strong)]">
                Can I track the Sun for an address and date?
              </h3>
              <p className="mt-3 text-sm leading-6 text-[var(--solar-text)]">
                Yes. Search for the address or place, choose a date, and inspect the calculated
                sun path and hourly solar positions for that location.
              </p>
            </article>
            <article className={surfacePanel}>
              <h3 className="font-semibold text-[var(--solar-text-strong)]">
                How are sun direction, azimuth, and altitude related?
              </h3>
              <p className="mt-3 text-sm leading-6 text-[var(--solar-text)]">
                Sun direction is the readable compass description of azimuth. Altitude is the
                separate vertical angle that describes how high or low the Sun is in the sky.
              </p>
            </article>
            <article className={surfacePanel}>
              <h3 className="font-semibold text-[var(--solar-text-strong)]">
                Can the 3D view display terrain and buildings?
              </h3>
              <p className="mt-3 text-sm leading-6 text-[var(--solar-text)]">
                It may display terrain and buildings for visual context where data is available and
                the device uses a supported display mode. Availability and detail can vary.
              </p>
            </article>
            <article className={surfacePanel}>
              <h3 className="font-semibold text-[var(--solar-text-strong)]">
                Does the calculation include shading from terrain, buildings, or trees?
              </h3>
              <p className="mt-3 text-sm leading-6 text-[var(--solar-text)]">
                No. Results are an unobstructed astronomical baseline. Terrain, buildings, and
                trees shown for visual context do not change the calculated solar values.
              </p>
            </article>
          </div>
        </section>
      </div>
    </section>
  );
}
