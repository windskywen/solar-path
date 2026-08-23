import type { Metadata } from 'next';
import Link from 'next/link';
import { ContentPageHeader } from '@/components/layout/ContentPageHeader';
import { getAdSenseSettings } from '@/lib/adsense';
import { buildPageMetadata } from '@/lib/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Privacy Policy',
  description:
    'Privacy Policy for Solar Path Tracker, including location handling, cookies, analytics, and Google AdSense disclosures.',
  path: '/privacy',
  keywords: ['solar path tracker privacy policy', 'adsense privacy policy', 'location data privacy'],
});

const glassPanel =
  'relative overflow-hidden rounded-[30px] border [border-color:var(--solar-glass-border)] [background:var(--solar-glass-bg)] [box-shadow:var(--solar-glass-shadow)] backdrop-blur-2xl';
const railPanel =
  'relative overflow-hidden rounded-[28px] border [border-color:var(--solar-glass-border)] [background:var(--solar-rail-bg)] [box-shadow:var(--solar-rail-shadow)] backdrop-blur-xl';
const eyebrow =
  'text-[0.64rem] font-semibold uppercase tracking-[0.32em] text-[var(--solar-kicker)]';

export default function PrivacyPage() {
  const adsEnabled = getAdSenseSettings().enabled;

  return (
    <>
      <ContentPageHeader />
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
          <p className="text-xs text-[var(--solar-text-muted)]">
            Last updated: <time dateTime="2026-08-24">24 August 2026</time>
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
            {adsEnabled ? (
              <p>
                Google AdSense is currently enabled only on the home page after a valid solar
                dataset exists, the three calculator pages after successful results and evidence,
                and the six individual guide articles after their page-specific evidence.
              </p>
            ) : (
              <p>
                Solar Path Tracker is prepared to use Google AdSense, but advertising is currently
                disabled while the site is in review mode. In this mode the site may publish an
                AdSense account-verification meta tag and ads.txt record, but it does not load the
                AdSense advertising script, create ad slots, or display ads.
              </p>
            )}
            <p>
              Third-party vendors, including Google, may use cookies or similar identifiers to
              serve ads based on users&apos; prior visits to this website or other websites.
              Google&apos;s use of advertising cookies enables Google and its partners to serve
              personalized ads where consent permits, and contextual, non-personalized, or limited
              ads where applicable.
            </p>
            <p>
              Google-certified ad networks and other third-party ad vendors may also serve ads on
              eligible pages. Visitors can review Google&apos;s{' '}
              <a
                href="https://support.google.com/adsense/answer/94149?hl=en"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--solar-accent)] underline decoration-sky-200/40 underline-offset-4 transition-colors hover:text-[var(--solar-text-strong)]"
              >
                certified third-party vendors
              </a>{' '}
              and use the opt-out controls offered by those vendors where available. Visitors can
              also review{' '}
              <a
                href="https://www.aboutads.info/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--solar-accent)] underline decoration-sky-200/40 underline-offset-4 transition-colors hover:text-[var(--solar-text-strong)]"
              >
                AboutAds opt-out information
              </a>
              .
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
              . Google advertising technologies may include the DoubleClick cookie where
              applicable to the user&apos;s region, consent choice, and current Google services.
            </p>
            <p>
              AdSense Auto Ads are not used. When advertising is active, it is limited to manually
              placed responsive units after completed results or page-specific evidence, with no
              more than one unit per eligible page. The Guides index, an empty home result, About,
              Privacy, Terms, Contact, Methodology, not-found, loading, and error states do not load
              the AdSense script, create an empty slot, or display ads.
            </p>
            <p>
              Where consent is required in the EEA, United Kingdom, or Switzerland, advertising
              is intended to use a Google-certified consent management platform with clear consent,
              non-consent, and settings choices. Available controls depend on region and the
              current advertising state.
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
              TomTom so we can return matching global addresses, places, streets, and administrative
              areas. If a starting location is available, its coordinates are also sent as a soft
              location preference; they do not restrict the search to that area. TomTom autocomplete
              results are not placed in our shared 24-hour search cache.
            </p>
            <p>
              If TomTom autocomplete is unavailable, the interface offers a one-time fallback after
              you explicitly press Enter. Only then is the current query sent to OpenStreetMap
              Nominatim. Those fallback responses may be cached in server memory for up to 24 hours
              to reduce repeated upstream lookups. Request metadata may also be used for rate
              limiting.
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
                {adsEnabled
                  ? ' currently provides advertising on eligible pages and may use cookies or similar technologies for ad delivery and measurement.'
                  : ' is configured for account/site verification, but its advertising script and ad slots are disabled in review mode.'}
              </li>
              <li>
                <strong className="text-[var(--solar-text-strong)]">TomTom:</strong> powers global
                address and place autocomplete and may receive the search text and a soft location
                preference.
              </li>
              <li>
                <strong className="text-[var(--solar-text-strong)]">
                  OpenStreetMap / Nominatim:
                </strong>{' '}
                provides map tiles, coordinate links, and the explicitly triggered fallback search.
              </li>
              <li>
                <strong className="text-[var(--solar-text-strong)]">ip-api.com:</strong> provides
                approximate IP-based location lookup for the initial map suggestion.
              </li>
              <li>
                <strong className="text-[var(--solar-text-strong)]">
                  Vercel Analytics and Speed Insights:
                </strong>{' '}
                help us understand aggregated site usage and anonymous Web Vitals. Performance
                measurements may be grouped by route, device type, browser, and country so we can
                identify slow experiences without building individual visitor profiles.
              </li>
            </ul>
            <p>
              We do not sell personal data. We use temporary caching and service-provider requests
              to deliver the search, approximate location, analytics, and advertising features that
              support the app.
            </p>
            <p>
              Vercel Speed Insights does not provide us with visitor IP addresses or a way to
              reconstruct an individual browsing session. Its measurements are used to improve page
              loading stability and interaction responsiveness.
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
              <Link href="/contact" className="text-[var(--solar-accent)] underline decoration-sky-200/40 underline-offset-4 transition-colors hover:text-[var(--solar-text-strong)]">our Contact page</Link>.
            </p>
          </div>
        </section>
      </div>
      </main>
    </>
  );
}
