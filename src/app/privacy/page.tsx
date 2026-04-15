import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'Privacy Policy for Solar Path Tracker, including location handling, cookies, analytics, and Google AdSense disclosures.',
};

const glassPanel =
  'relative overflow-hidden rounded-[30px] border [border-color:var(--solar-glass-border)] [background:var(--solar-glass-bg)] [box-shadow:var(--solar-glass-shadow)] backdrop-blur-2xl';
const railPanel =
  'relative overflow-hidden rounded-[28px] border [border-color:var(--solar-glass-border)] [background:var(--solar-rail-bg)] [box-shadow:var(--solar-rail-shadow)] backdrop-blur-xl';
const eyebrow =
  'text-[0.64rem] font-semibold uppercase tracking-[0.32em] text-[var(--solar-kicker)]';

export default function PrivacyPage() {
  return (
    <main className="relative z-10 mx-auto flex w-full max-w-screen-2xl flex-1 flex-col px-3 py-4 sm:px-4 lg:px-6">
      <section className={`${glassPanel} px-4 py-5 sm:px-6 sm:py-6`}>
        <div className="max-w-4xl space-y-3">
          <p className={eyebrow}>Privacy & transparency</p>
          <h1 className="text-3xl font-semibold tracking-[-0.04em] text-[var(--solar-text-strong)] sm:text-4xl">
            Privacy Policy
          </h1>
          <p className="max-w-3xl text-sm leading-6 text-[var(--solar-text)] sm:text-base">
            This policy explains how Solar Path Tracker handles location inputs, search requests,
            analytics, and advertising. We aim to keep the core solar calculations client-friendly
            while being transparent about the third-party services that help operate the site.
          </p>
        </div>
      </section>

      <div className="mt-4 grid gap-4">
        <section className={railPanel} aria-labelledby="ads-heading">
          <div className="border-b [border-color:var(--solar-divider)] px-4 pb-4 pt-4 sm:px-5 sm:pt-5">
            <p className={eyebrow}>Advertising</p>
            <h2
              id="ads-heading"
              className="mt-2 text-xl font-semibold tracking-[-0.02em] text-[var(--solar-text-strong)]"
            >
              Google AdSense, cookies, and ad personalization
            </h2>
          </div>

          <div className="space-y-4 p-4 text-sm leading-6 text-[var(--solar-text)] sm:p-5">
            <p>
              This website uses Google AdSense to display advertisements. Google and its partners
              may use cookies based on a user&apos;s previous visits to this website or other
              websites in order to serve relevant ads. That may include the use of the DoubleClick
              cookie for ad personalization and measurement.
            </p>
            <p>
              Users can manage or disable personalized advertising by visiting{' '}
              <a
                href="https://adssettings.google.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--solar-accent)] underline decoration-sky-200/40 underline-offset-4 transition-colors hover:text-[var(--solar-text-strong)]"
              >
                Google Ads Settings
              </a>
              .
            </p>
            <p>
              We do not enable AdSense Auto Ads on this site. When advertising is active, it is
              limited to manually placed slots so the interactive map and 3D solar tools remain
              readable and unobstructed.
            </p>
          </div>
        </section>

        <section className={railPanel} aria-labelledby="location-heading">
          <div className="border-b [border-color:var(--solar-divider)] px-4 pb-4 pt-4 sm:px-5 sm:pt-5">
            <p className={eyebrow}>Location handling</p>
            <h2
              id="location-heading"
              className="mt-2 text-xl font-semibold tracking-[-0.02em] text-[var(--solar-text-strong)]"
            >
              Search Location, Geolocation, and coordinate processing
            </h2>
          </div>

          <div className="space-y-4 p-4 text-sm leading-6 text-[var(--solar-text)] sm:p-5">
            <p>
              If you choose the browser Geolocation option, your device shares coordinates only
              after you grant permission. Those coordinates are used to center the map and calculate
              solar data in the client experience. We do not persist your precise GPS coordinates in
              a user account database.
            </p>
            <p>
              If you use Search Location, your query is sent through our `/api/geocode` endpoint to
              OpenStreetMap Nominatim so we can return matching places. Search responses may be
              cached in server memory for up to 24 hours to reduce repeated upstream lookups, and
              request metadata may be used for rate limiting.
            </p>
            <p>
              On first load, the site may request an approximate location from our `/api/ip-geo`
              endpoint to suggest a starting map center. That lookup uses the visitor IP address and
              may cache a coarse city-level result in server memory for up to 1 hour. We keep this
              behavior to improve first-use convenience and disclose it here for transparency.
            </p>
          </div>
        </section>

        <section className={railPanel} aria-labelledby="services-heading">
          <div className="border-b [border-color:var(--solar-divider)] px-4 pb-4 pt-4 sm:px-5 sm:pt-5">
            <p className={eyebrow}>Services and retention</p>
            <h2
              id="services-heading"
              className="mt-2 text-xl font-semibold tracking-[-0.02em] text-[var(--solar-text-strong)]"
            >
              Third-party services used by the site
            </h2>
          </div>

          <div className="space-y-4 p-4 text-sm leading-6 text-[var(--solar-text)] sm:p-5">
            <ul className="space-y-3">
              <li>
                <strong className="text-[var(--solar-text-strong)]">Google AdSense:</strong>{' '}
                provides advertising when enabled and may use cookies for ad delivery and
                measurement.
              </li>
              <li>
                <strong className="text-[var(--solar-text-strong)]">OpenStreetMap / Nominatim:</strong>{' '}
                powers place search and map verification links.
              </li>
              <li>
                <strong className="text-[var(--solar-text-strong)]">ip-api.com:</strong> provides
                approximate IP-based location lookup for the initial map suggestion.
              </li>
              <li>
                <strong className="text-[var(--solar-text-strong)]">Vercel Analytics:</strong>{' '}
                helps us understand aggregated site usage and performance trends.
              </li>
            </ul>
            <p>
              We do not sell personal data. We use temporary caching and service-provider requests
              to deliver the search, approximate location, analytics, and advertising features that
              support the app.
            </p>
          </div>
        </section>

        <section className={railPanel} aria-labelledby="choices-heading">
          <div className="border-b [border-color:var(--solar-divider)] px-4 pb-4 pt-4 sm:px-5 sm:pt-5">
            <p className={eyebrow}>Your choices</p>
            <h2
              id="choices-heading"
              className="mt-2 text-xl font-semibold tracking-[-0.02em] text-[var(--solar-text-strong)]"
            >
              Controls, opt-out, and contact
            </h2>
          </div>

          <div className="space-y-4 p-4 text-sm leading-6 text-[var(--solar-text)] sm:p-5">
            <p>
              You can decline browser geolocation permissions, skip Search Location, or manually
              enter coordinates instead. You can also manage ad personalization through{' '}
              <a
                href="https://adssettings.google.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--solar-accent)] underline decoration-sky-200/40 underline-offset-4 transition-colors hover:text-[var(--solar-text-strong)]"
              >
                Google Ads Settings
              </a>
              .
            </p>
            <p>
              If you have a privacy question or want clarification about this policy, contact us at{' '}
              <a
                href="mailto:solarpathtracker@gmail.com"
                className="text-[var(--solar-accent)] underline decoration-sky-200/40 underline-offset-4 transition-colors hover:text-[var(--solar-text-strong)]"
              >
                solarpathtracker@gmail.com
              </a>
              .
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
