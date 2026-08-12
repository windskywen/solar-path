import type { Metadata } from 'next';
import Link from 'next/link';
import { ContentPageHeader } from '@/components/layout/ContentPageHeader';
import { GUIDES } from '@/lib/guides';
import { buildPageMetadata } from '@/lib/metadata';
import {
  buildBreadcrumbStructuredData,
  buildWebPageStructuredData,
} from '@/lib/structured-data';

const title = 'Solar Path Guides';
const description =
  'Evidence-led guides to solar azimuth, altitude, seasonal sun paths, golden-hour direction, home orientation, and shadow estimates.';
const path = '/guides';

export const metadata: Metadata = buildPageMetadata({
  title,
  description,
  path,
  keywords: [
    'solar path guides',
    'sun angle education',
    'solar azimuth guide',
    'solar altitude guide',
    'shadow direction guide',
  ],
});

const structuredData = [
  buildWebPageStructuredData({ path, title, description }),
  buildBreadcrumbStructuredData([
    { name: 'Home', path: '/' },
    { name: 'Guides', path },
  ]),
];

export default function GuidesIndexPage() {
  return (
    <>
      <ContentPageHeader />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <main className="relative z-10 mx-auto w-full max-w-screen-2xl px-3 py-4 sm:px-4 lg:px-6">
        <section className="rounded-[30px] border px-4 py-6 [border-color:var(--solar-glass-border)] [background:var(--solar-glass-bg)] [box-shadow:var(--solar-glass-shadow)] backdrop-blur-2xl sm:px-6 sm:py-9">
          <nav aria-label="Breadcrumb" className="text-xs text-[var(--solar-text-muted)]">
            <Link href="/" className="transition-colors hover:text-[var(--solar-text-strong)]">Home</Link>
            <span aria-hidden="true" className="mx-2">/</span>
            <span>Guides</span>
          </nav>
          <p className="mt-6 text-[0.64rem] font-semibold uppercase tracking-[0.3em] text-[var(--solar-kicker)]">Learn the geometry</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.045em] text-[var(--solar-text-strong)] sm:text-5xl">Solar Path Guides</h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-[var(--solar-text)] sm:text-lg">{description}</p>
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-2" aria-label="Published solar guides">
          {GUIDES.map((guide, index) => (
            <article
              key={guide.slug}
              className="rounded-[28px] border p-4 [border-color:var(--solar-glass-border)] [background:var(--solar-rail-bg)] [box-shadow:var(--solar-rail-shadow)] backdrop-blur-xl sm:p-6"
            >
              <p className="text-[0.64rem] font-semibold uppercase tracking-[0.28em] text-[var(--solar-kicker)]">Guide {String(index + 1).padStart(2, '0')}</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-[var(--solar-text-strong)]">
                <Link href={`/guides/${guide.slug}`} className="transition-colors hover:text-[var(--solar-accent)]">
                  {guide.title}
                </Link>
              </h2>
              <p className="mt-4 text-sm leading-7 text-[var(--solar-text)]">{guide.description}</p>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--solar-text-muted)]">
                <span>{guide.author}</span>
                <time dateTime={guide.modifiedDate}>Updated {guide.modifiedDate}</time>
              </div>
              <Link
                href={`/guides/${guide.slug}`}
                className="mt-5 inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-semibold text-[var(--solar-text-strong)] transition-colors [border-color:var(--solar-pill-border)] [background:var(--solar-pill-bg)] hover:[background:var(--solar-button-hover-bg)]"
              >
                Read guide
              </Link>
            </article>
          ))}
        </section>
      </main>
    </>
  );
}
