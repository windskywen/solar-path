import Link from 'next/link';
import { ArticleAdPlacement } from '@/components/ads/ArticleAdPlacement';
import { GuideEvidence } from '@/components/guides/GuideEvidence';
import { ContentPageHeader } from '@/components/layout/ContentPageHeader';
import type { GuideDefinition, GuideSectionDefinition } from '@/lib/guides';
import { getGuide } from '@/lib/guides';

interface GuideArticleProps {
  guide: GuideDefinition;
}

const glassPanel =
  'rounded-[30px] border [border-color:var(--solar-glass-border)] [background:var(--solar-glass-bg)] [box-shadow:var(--solar-glass-shadow)] backdrop-blur-2xl';
const railPanel =
  'rounded-[28px] border [border-color:var(--solar-glass-border)] [background:var(--solar-rail-bg)] [box-shadow:var(--solar-rail-shadow)] backdrop-blur-xl';
const eyebrow =
  'text-[0.64rem] font-semibold uppercase tracking-[0.3em] text-[var(--solar-kicker)]';

function formatDate(dateISO: string) {
  return new Intl.DateTimeFormat('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${dateISO}T00:00:00Z`));
}

function GuideSection({ section }: { section: GuideSectionDefinition }) {
  const headingId = `section-${section.heading.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-')}`;
  return (
    <section className={railPanel} aria-labelledby={headingId}>
      <div className="p-4 sm:p-6">
        <h2 id={headingId} className="text-2xl font-semibold tracking-[-0.03em] text-[var(--solar-text-strong)]">{section.heading}</h2>
        <div className="mt-4 space-y-4 text-sm leading-7 text-[var(--solar-text)] sm:text-base">
          {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </div>
        {section.points ? (
          <ul className="mt-5 grid gap-3 text-sm leading-6 text-[var(--solar-text)] lg:grid-cols-3">
            {section.points.map((point) => (
              <li key={point} className="rounded-[20px] border p-4 [border-color:var(--solar-surface-border)] [background:var(--solar-surface-bg)]">{point}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}

export function GuideArticle({ guide }: GuideArticleProps) {
  const sources = [...guide.evidenceSources, ...guide.sources];

  return (
    <>
      <ContentPageHeader />
      <main className="relative z-10 mx-auto w-full max-w-screen-2xl px-3 py-4 sm:px-4 lg:px-6">
        <article>
          <header className={`${glassPanel} px-4 py-6 sm:px-6 sm:py-9`}>
            <nav aria-label="Breadcrumb" className="text-xs text-[var(--solar-text-muted)]">
              <Link href="/" className="transition-colors hover:text-[var(--solar-text-strong)]">Home</Link>
              <span aria-hidden="true" className="mx-2">/</span>
              <Link href="/guides" className="transition-colors hover:text-[var(--solar-text-strong)]">Guides</Link>
              <span aria-hidden="true" className="mx-2">/</span>
              <span>{guide.title}</span>
            </nav>
            <p className={`${eyebrow} mt-6`}>Solar guide · {guide.contentTypeLabel}</p>
            <h1 className="mt-3 max-w-5xl text-3xl font-semibold tracking-[-0.045em] text-[var(--solar-text-strong)] sm:text-5xl">{guide.title}</h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-[var(--solar-text)] sm:text-lg">{guide.description}</p>
            <dl className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-xs text-[var(--solar-text-muted)]">
              <div className="flex gap-2">
                <dt>By</dt>
                <dd>
                  <Link href="/about#editorial-process" className="font-semibold text-[var(--solar-text-strong)] underline decoration-sky-200/40 underline-offset-4">
                    Solar Path Tracker · Editorial and technical review by the site maintainer
                  </Link>
                </dd>
              </div>
              <div className="flex gap-2"><dt>Published</dt><dd><time dateTime={guide.publishedDate}>{formatDate(guide.publishedDate)}</time></dd></div>
              <div className="flex gap-2"><dt>Updated</dt><dd><time dateTime={guide.modifiedDate}>{formatDate(guide.modifiedDate)}</time></dd></div>
            </dl>
          </header>

          <div className={`${railPanel} mt-4 p-4 sm:p-6`}>
            <div className="max-w-4xl space-y-4 text-base leading-8 text-[var(--solar-text)]">
              {guide.introduction.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </div>
          </div>

          <div className="mt-4 grid gap-4">
            {guide.sectionsBeforeExample.map((section) => <GuideSection key={section.heading} section={section} />)}
          </div>

          <GuideEvidence guide={guide} />

          <ArticleAdPlacement />

          <div className="mt-4 grid gap-4">
            {guide.sectionsAfterExample.map((section) => <GuideSection key={section.heading} section={section} />)}
          </div>

          <section className={`${glassPanel} mt-4 p-4 sm:p-6`} aria-labelledby="uses-and-limits-heading">
            <p className={eyebrow}>Responsible use</p>
            <h2 id="uses-and-limits-heading" className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[var(--solar-text-strong)]">Practical uses and model limits</h2>
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <div className="rounded-[22px] border p-4 [border-color:var(--solar-surface-border)] [background:var(--solar-surface-bg)]">
                <h3 className="font-semibold text-[var(--solar-text-strong)]">Useful for</h3>
                <ul className="mt-3 space-y-3 text-sm leading-6 text-[var(--solar-text)]">{guide.useCases.map((useCase) => <li key={useCase}>• {useCase}</li>)}</ul>
              </div>
              <div className="rounded-[22px] border p-4 [border-color:var(--solar-surface-border)] [background:var(--solar-surface-bg)]">
                <h3 className="font-semibold text-[var(--solar-text-strong)]">Do not overlook</h3>
                <ul className="mt-3 space-y-3 text-sm leading-6 text-[var(--solar-text)]">{guide.limitations.map((limitation) => <li key={limitation}>• {limitation}</li>)}</ul>
              </div>
            </div>
          </section>

          <section className={`${railPanel} mt-4 p-4 sm:p-6`} aria-labelledby="sources-heading">
            <p className={eyebrow}>Sources and reproducibility</p>
            <h2 id="sources-heading" className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[var(--solar-text-strong)]">Evidence and calculation sources</h2>
            <ul className="mt-5 grid gap-4 lg:grid-cols-3">
              {sources.map((source) => (
                <li key={`${source.label}-${source.url}`} className="rounded-[22px] border p-4 [border-color:var(--solar-surface-border)] [background:var(--solar-surface-bg)]">
                  {source.url.startsWith('/') ? (
                    <Link href={source.url} className="font-semibold text-[var(--solar-accent)] underline decoration-sky-200/40 underline-offset-4">{source.label}</Link>
                  ) : (
                    <a href={source.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-[var(--solar-accent)] underline decoration-sky-200/40 underline-offset-4">{source.label}</a>
                  )}
                  <p className="mt-3 text-sm leading-6 text-[var(--solar-text)]">{source.note}</p>
                </li>
              ))}
            </ul>
          </section>

          {guide.relatedTools?.length ? (
            <aside className={`${glassPanel} mt-4 p-4 sm:p-6`} aria-labelledby="related-tools-heading">
              <p className={eyebrow}>Apply the evidence</p>
              <h2 id="related-tools-heading" className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[var(--solar-text-strong)]">Use the live tool</h2>
              <div className="mt-5 grid gap-4 lg:grid-cols-3">
                {guide.relatedTools.map((tool) => (
                  <Link key={tool.href} href={tool.href} className="rounded-[22px] border p-4 transition-colors [border-color:var(--solar-surface-border)] [background:var(--solar-surface-bg)] hover:[border-color:var(--solar-pill-border)]">
                    <h3 className="font-semibold text-[var(--solar-text-strong)]">{tool.label}</h3>
                    <p className="mt-3 text-sm leading-6 text-[var(--solar-text)]">{tool.description}</p>
                  </Link>
                ))}
              </div>
            </aside>
          ) : null}

          <aside className={`${glassPanel} mt-4 p-4 sm:p-6`} aria-labelledby="related-guides-heading">
            <p className={eyebrow}>Continue learning</p>
            <h2 id="related-guides-heading" className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[var(--solar-text-strong)]">Related guides</h2>
            <div className="mt-5 grid gap-4 lg:grid-cols-3">
              {guide.relatedGuides.map((slug) => {
                const related = getGuide(slug);
                if (!related) return null;
                return (
                  <Link key={slug} href={`/guides/${slug}`} className="rounded-[22px] border p-4 transition-colors [border-color:var(--solar-surface-border)] [background:var(--solar-surface-bg)] hover:[border-color:var(--solar-pill-border)]">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--solar-kicker)]">{related.contentTypeLabel}</p>
                    <h3 className="mt-2 font-semibold text-[var(--solar-text-strong)]">{related.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-[var(--solar-text)]">{related.description}</p>
                  </Link>
                );
              })}
            </div>
          </aside>
        </article>
      </main>
    </>
  );
}
