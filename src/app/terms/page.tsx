import type { Metadata } from 'next';
import Link from 'next/link';
import { ContentPageHeader } from '@/components/layout/ContentPageHeader';
import { buildPageMetadata } from '@/lib/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Terms of Use',
  description:
    'Terms governing use of Solar Path Tracker, including TomTom search data and third-party services.',
  path: '/terms',
  keywords: ['solar path tracker terms', 'TomTom search terms', 'solar data disclaimer'],
});

const glassPanel =
  'relative overflow-hidden rounded-[30px] border [border-color:var(--solar-glass-border)] [background:var(--solar-glass-bg)] [box-shadow:var(--solar-glass-shadow)] backdrop-blur-2xl';
const railPanel =
  'relative overflow-hidden rounded-[28px] border [border-color:var(--solar-glass-border)] [background:var(--solar-rail-bg)] [box-shadow:var(--solar-rail-shadow)] backdrop-blur-xl';
const eyebrow =
  'text-[0.64rem] font-semibold uppercase tracking-[0.32em] text-[var(--solar-kicker)]';
const linkClass =
  'text-[var(--solar-accent)] underline decoration-sky-200/40 underline-offset-4 transition-colors hover:text-[var(--solar-text-strong)]';

export default function TermsPage() {
  return (
    <>
      <ContentPageHeader />
      <main className="relative z-10 mx-auto flex w-full max-w-screen-2xl flex-1 flex-col px-3 py-4 sm:px-4 lg:px-6">
      <section className={`${glassPanel} px-4 py-5 sm:px-6 sm:py-6`}>
        <div className="max-w-4xl space-y-3">
          <p className={eyebrow}>Terms & licensed data</p>
          <h1 className="text-3xl font-semibold tracking-[-0.04em] text-[var(--solar-text-strong)] sm:text-4xl">
            Terms of Use
          </h1>
          <p className="max-w-3xl text-sm leading-6 text-[var(--solar-text)] sm:text-base">
            By accessing or using Solar Path Tracker, you agree to these terms. If you do not
            agree, do not use the site or its address-search services.
          </p>
          <p className="text-xs text-[var(--solar-text-muted)]">
            Last updated: <time dateTime="2026-08-12">12 August 2026</time>
          </p>
        </div>
      </section>

      <div className="mt-4 grid gap-4">
        <section className={railPanel} aria-labelledby="service-heading">
          <div className="border-b [border-color:var(--solar-divider)] px-4 pb-4 pt-4 sm:px-5 sm:pt-5">
            <p className={eyebrow}>Service scope</p>
            <h2
              id="service-heading"
              className="mt-2 text-xl font-semibold tracking-[-0.02em] text-[var(--solar-text-strong)]"
            >
              Informational use only
            </h2>
          </div>
          <div className="space-y-4 p-4 text-sm leading-6 text-[var(--solar-text)] sm:p-5">
            <p>
              Solar paths, sun-event times, maps, 3D views, address matches, and coordinates are
              provided for general informational and planning purposes. They are not surveying,
              navigation, safety, architectural, engineering, or installation advice.
            </p>
            <p>
              You are responsible for independently verifying important locations and calculations
              before making decisions. The service may change, be interrupted, or contain
              incomplete or inaccurate third-party data.
            </p>
          </div>
        </section>

        <section className={railPanel} aria-labelledby="tomtom-heading">
          <div className="border-b [border-color:var(--solar-divider)] px-4 pb-4 pt-4 sm:px-5 sm:pt-5">
            <p className={eyebrow}>TomTom search</p>
            <h2
              id="tomtom-heading"
              className="mt-2 text-xl font-semibold tracking-[-0.02em] text-[var(--solar-text-strong)]"
            >
              Licensed address and place results
            </h2>
          </div>
          <div className="space-y-4 p-4 text-sm leading-6 text-[var(--solar-text)] sm:p-5">
            <p>
              Address autocomplete and place-search results are licensed from TomTom and its
              suppliers. Your use of those results is also subject to the{' '}
              <a
                href="https://docs.tomtom.com/legal/terms-and-conditions"
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                TomTom Maps API terms
              </a>{' '}
              and the current{' '}
              <a
                href="https://www.tomtom.com/en-gb/legal/third-party-product-terms/"
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                TomTom Third Party Product Terms
              </a>
              , which are incorporated into these terms for use of TomTom-provided content.
            </p>
            <p>
              TomTom search results are licensed for your personal or internal use with this site.
              You must not resell, sublicense, redistribute, bulk download, scrape, systematically
              extract, or use the results to create or help create a digital map database. You must
              not remove or obscure copyright notices, use the results to provide competitive
              information about TomTom, or attempt to reverse engineer the licensed service.
            </p>
            <p>
              TomTom and its suppliers retain their intellectual-property rights in their licensed
              products and results. To the extent required by the applicable TomTom terms, TomTom
              is an intended third-party beneficiary of these provisions. TomTom-provided
              materials must not be disclosed except as the service and applicable licence permit.
            </p>
          </div>
        </section>

        <section className={railPanel} aria-labelledby="third-party-heading">
          <div className="border-b [border-color:var(--solar-divider)] px-4 pb-4 pt-4 sm:px-5 sm:pt-5">
            <p className={eyebrow}>Other providers</p>
            <h2
              id="third-party-heading"
              className="mt-2 text-xl font-semibold tracking-[-0.02em] text-[var(--solar-text-strong)]"
            >
              Open data and third-party services
            </h2>
          </div>
          <div className="space-y-4 p-4 text-sm leading-6 text-[var(--solar-text)] sm:p-5">
            <p>
              Map tiles and the explicitly triggered fallback search may use OpenStreetMap and
              Nominatim data under their applicable attribution and usage terms. Solar calculations
              use SunCalc. Other operational services are described in our Privacy Policy.
            </p>
            <p>
              You must use the site lawfully and must not overload, bypass limits on, interfere
              with, or attempt unauthorized access to the site or any upstream service.
            </p>
          </div>
        </section>

        <section className={railPanel} aria-labelledby="liability-heading">
          <div className="border-b [border-color:var(--solar-divider)] px-4 pb-4 pt-4 sm:px-5 sm:pt-5">
            <p className={eyebrow}>Warranty & contact</p>
            <h2
              id="liability-heading"
              className="mt-2 text-xl font-semibold tracking-[-0.02em] text-[var(--solar-text-strong)]"
            >
              Availability, warranties, and questions
            </h2>
          </div>
          <div className="space-y-4 p-4 text-sm leading-6 text-[var(--solar-text)] sm:p-5">
            <p>
              To the maximum extent permitted by law, the site and third-party data are provided
              “as is” and “as available,” without warranties of accuracy, availability, fitness for
              a particular purpose, or non-infringement. TomTom and its suppliers disclaim
              warranties and liability to the extent allowed by the applicable licence and law.
            </p>
            <p>
              Questions about these terms can be sent through the{' '}
              <Link href="/contact" className={linkClass}>Contact page</Link>.
            </p>
          </div>
        </section>
      </div>
      </main>
    </>
  );
}
