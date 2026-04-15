import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'About',
  description:
    'Learn why Solar Path Tracker exists, who it helps, and how to contact the project.',
  path: '/about',
  keywords: ['about solar path tracker', 'solar daylight planning tool', 'contact solar path tracker'],
});

const glassPanel =
  'relative overflow-hidden rounded-[30px] border [border-color:var(--solar-glass-border)] [background:var(--solar-glass-bg)] [box-shadow:var(--solar-glass-shadow)] backdrop-blur-2xl';
const railPanel =
  'relative overflow-hidden rounded-[28px] border [border-color:var(--solar-glass-border)] [background:var(--solar-rail-bg)] [box-shadow:var(--solar-rail-shadow)] backdrop-blur-xl';
const eyebrow =
  'text-[0.64rem] font-semibold uppercase tracking-[0.32em] text-[var(--solar-kicker)]';

export default function AboutPage() {
  return (
    <main className="relative z-10 mx-auto flex w-full max-w-screen-2xl flex-1 flex-col px-3 py-4 sm:px-4 lg:px-6">
      <section className={`${glassPanel} px-4 py-5 sm:px-6 sm:py-6`}>
        <div className="max-w-4xl space-y-3">
          <p className={eyebrow}>About & contact</p>
          <h1 className="text-3xl font-semibold tracking-[-0.04em] text-[var(--solar-text-strong)] sm:text-4xl">
            About Solar Path Tracker
          </h1>
          <p className="max-w-3xl text-sm leading-6 text-[var(--solar-text)] sm:text-base">
            Solar Path Tracker was built to make daylight decisions easier to read before a site
            visit, install, or design review. The tool turns location, date, azimuth, altitude,
            and hourly sun-path data into a visual workspace that helps people understand how the
            Sun moves across a property or neighborhood.
          </p>
        </div>
      </section>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <section className={railPanel} aria-labelledby="purpose-heading">
          <div className="border-b [border-color:var(--solar-divider)] px-4 pb-4 pt-4 sm:px-5 sm:pt-5">
            <p className={eyebrow}>Purpose</p>
            <h2
              id="purpose-heading"
              className="mt-2 text-xl font-semibold tracking-[-0.02em] text-[var(--solar-text-strong)]"
            >
              Why this tool exists
            </h2>
          </div>

          <div className="space-y-4 p-4 text-sm leading-6 text-[var(--solar-text)] sm:p-5">
            <p>
              We built Solar Path Tracker for people who need a fast answer to practical daylight
              questions: Which facade gets the harshest afternoon sun? How high will the Sun climb
              in winter? When will a site enter Golden Hour? How much seasonal swing should a solar
              installation expect?
            </p>
            <p>
              The goal is not to replace on-site measurement, but to give architects, solar
              installers, property researchers, and everyday users a reliable first-pass view of
              solar conditions before they commit time, budget, or equipment.
            </p>
          </div>
        </section>

        <section className={railPanel} aria-labelledby="contact-heading" id="contact">
          <div className="border-b [border-color:var(--solar-divider)] px-4 pb-4 pt-4 sm:px-5 sm:pt-5">
            <p className={eyebrow}>Contact</p>
            <h2
              id="contact-heading"
              className="mt-2 text-xl font-semibold tracking-[-0.02em] text-[var(--solar-text-strong)]"
            >
              Contact us
            </h2>
          </div>

          <div className="space-y-4 p-4 text-sm leading-6 text-[var(--solar-text)] sm:p-5">
            <p>
              For product questions, review requests, or partnership conversations, email us at:
            </p>
            <p>
              <a
                href="mailto:solarpathtracker@gmail.com"
                className="text-base font-semibold text-[var(--solar-accent)] underline decoration-sky-200/40 underline-offset-4 transition-colors hover:text-[var(--solar-text-strong)]"
              >
                solarpathtracker@gmail.com
              </a>
            </p>
            <p className="text-xs text-[var(--solar-text-muted)]">
              We use this mailbox as the public contact point for site operations, trust requests,
              and policy-related questions.
            </p>
          </div>
        </section>
      </div>

      <section className={`${railPanel} mt-4`} aria-labelledby="audience-heading">
        <div className="border-b [border-color:var(--solar-divider)] px-4 pb-4 pt-4 sm:px-5 sm:pt-5">
          <p className={eyebrow}>Who it helps</p>
          <h2
            id="audience-heading"
            className="mt-2 text-xl font-semibold tracking-[-0.02em] text-[var(--solar-text-strong)]"
          >
            Typical use cases
          </h2>
        </div>

        <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-4">
          <article className="rounded-[22px] border [border-color:var(--solar-surface-border)] [background:var(--solar-surface-bg)] p-4 [box-shadow:var(--solar-surface-inset-shadow)]">
            <h3 className="text-sm font-semibold text-[var(--solar-text-strong)]">
              Architects and planners
            </h3>
            <p className="mt-2 text-sm leading-6 text-[var(--solar-text)]">
              Review building orientation, facade exposure, and shadow-sensitive spaces before a
              concept is finalized.
            </p>
          </article>

          <article className="rounded-[22px] border [border-color:var(--solar-surface-border)] [background:var(--solar-surface-bg)] p-4 [box-shadow:var(--solar-surface-inset-shadow)]">
            <h3 className="text-sm font-semibold text-[var(--solar-text-strong)]">
              Solar installers
            </h3>
            <p className="mt-2 text-sm leading-6 text-[var(--solar-text)]">
              Compare seasonal sun angle, direction, and daylight windows before choosing panel
              placement or tilt assumptions.
            </p>
          </article>

          <article className="rounded-[22px] border [border-color:var(--solar-surface-border)] [background:var(--solar-surface-bg)] p-4 [box-shadow:var(--solar-surface-inset-shadow)]">
            <h3 className="text-sm font-semibold text-[var(--solar-text-strong)]">
              Real-estate buyers
            </h3>
            <p className="mt-2 text-sm leading-6 text-[var(--solar-text)]">
              Check morning light, afternoon heat load, and west-facing sun exposure before buying
              or renting a property.
            </p>
          </article>

          <article className="rounded-[22px] border [border-color:var(--solar-surface-border)] [background:var(--solar-surface-bg)] p-4 [box-shadow:var(--solar-surface-inset-shadow)]">
            <h3 className="text-sm font-semibold text-[var(--solar-text-strong)]">
              Photographers and creators
            </h3>
            <p className="mt-2 text-sm leading-6 text-[var(--solar-text)]">
              Anticipate Golden Hour timing, sun direction, and predictable shadow movement for
              outdoor shoots.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
