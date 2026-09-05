import type { Metadata } from 'next';
import Link from 'next/link';
import { ContentPageHeader } from '@/components/layout/ContentPageHeader';
import { buildPageMetadata } from '@/lib/metadata';
import { SITE_CONTACT_EMAIL } from '@/lib/site';
import {
  buildBreadcrumbStructuredData,
  buildWebPageStructuredData,
} from '@/lib/structured-data';

const title = 'Contact';
const description =
  'Contact Solar Path Tracker about calculation discrepancies, software bugs, privacy questions, or general site feedback.';
const path = '/contact';

export const metadata: Metadata = buildPageMetadata({
  title,
  description,
  path,
  keywords: ['contact solar path tracker', 'report solar data error', 'solar calculator bug report'],
});

const structuredData = [
  buildWebPageStructuredData({ path, title, description }),
  buildBreadcrumbStructuredData([
    { name: 'Home', path: '/' },
    { name: title, path },
  ]),
];

const categories = [
  {
    title: 'Calculation or data discrepancy',
    subject: 'Solar calculation discrepancy',
    details: 'Include the page, latitude/longitude, date, local time, timezone, displayed result, expected result, comparison source, and screenshot.',
  },
  {
    title: 'Software bug',
    subject: 'Solar Path Tracker bug report',
    details: 'Include the URL, steps to reproduce, expected and actual behaviour, device, browser version, and screenshot or console message.',
  },
  {
    title: 'Privacy or policy question',
    subject: 'Solar Path Tracker privacy question',
    details: 'Describe the service or disclosure you are asking about. Do not email precise location data unless it is necessary to investigate your request.',
  },
  {
    title: 'General question or feedback',
    subject: 'Solar Path Tracker feedback',
    details: 'Tell us which tool or guide you used and what would make the information clearer or more useful.',
  },
] as const;

export default function ContactPage() {
  return (
    <>
      <ContentPageHeader />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <main className="relative z-10 mx-auto w-full max-w-screen-2xl px-3 py-4 sm:px-4 lg:px-6">
        <header className="rounded-[30px] border px-4 py-6 [border-color:var(--solar-glass-border)] [background:var(--solar-glass-bg)] [box-shadow:var(--solar-glass-shadow)] backdrop-blur-2xl sm:px-6 sm:py-9">
          <nav aria-label="Breadcrumb" className="text-xs text-[var(--solar-text-muted)]">
            <Link href="/" className="hover:text-[var(--solar-text-strong)]">Home</Link>
            <span aria-hidden="true" className="mx-2">/</span>
            <span>Contact</span>
          </nav>
          <p className="mt-6 text-[0.64rem] font-semibold uppercase tracking-[0.3em] text-[var(--solar-kicker)]">Questions and corrections</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.045em] text-[var(--solar-text-strong)] sm:text-5xl">Contact Solar Path Tracker</h1>
          <p className="mt-5 max-w-4xl text-base leading-7 text-[var(--solar-text)] sm:text-lg">We use one public mailbox for calculation reports, bugs, privacy requests, and general feedback. This page does not submit or store a contact form.</p>
          <a href={`mailto:${SITE_CONTACT_EMAIL}`} className="mt-6 inline-flex min-h-11 items-center rounded-full border px-5 text-sm font-semibold text-[var(--solar-text-strong)] [border-color:var(--solar-pill-border)] [background:var(--solar-accent-soft)]">
            {SITE_CONTACT_EMAIL}
          </a>
        </header>

        <section className="mt-4 grid gap-4 lg:grid-cols-2" aria-label="Contact categories">
          {categories.map((category) => (
            <article key={category.title} className="rounded-[28px] border p-4 [border-color:var(--solar-glass-border)] [background:var(--solar-rail-bg)] [box-shadow:var(--solar-rail-shadow)] sm:p-6">
              <h2 className="text-xl font-semibold text-[var(--solar-text-strong)]">{category.title}</h2>
              <p className="mt-3 text-sm leading-7 text-[var(--solar-text)]">{category.details}</p>
              <a
                href={`mailto:${SITE_CONTACT_EMAIL}?subject=${encodeURIComponent(category.subject)}`}
                className="mt-5 inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-semibold text-[var(--solar-accent)] [border-color:var(--solar-pill-border)] [background:var(--solar-pill-bg)]"
              >
                Start email
              </a>
            </article>
          ))}
        </section>

        <section className="mt-4 rounded-[28px] border p-4 [border-color:var(--solar-glass-border)] [background:var(--solar-rail-bg)] [box-shadow:var(--solar-rail-shadow)] sm:p-6" aria-labelledby="before-email-heading">
          <h2 id="before-email-heading" className="text-2xl font-semibold text-[var(--solar-text-strong)]">Before reporting a solar result</h2>
          <p className="mt-4 max-w-5xl text-sm leading-7 text-[var(--solar-text)]">Check the angle conventions, timezone method, event definitions, polar handling, and known limitations on the <Link href="/methodology" className="text-[var(--solar-accent)] underline underline-offset-4">Methodology page</Link>. Those details make independent comparison and investigation faster.</p>
          <p className="mt-4 text-xs text-[var(--solar-text-muted)]">Do not send passwords, advertising-account credentials, private API keys, or other sensitive information.</p>
        </section>
      </main>
    </>
  );
}
