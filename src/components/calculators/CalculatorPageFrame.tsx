import Link from 'next/link';
import { ContentPageHeader } from '@/components/layout/ContentPageHeader';
import { SolarCalculator, type SolarCalculatorMode } from './SolarCalculator';

export interface CalculatorContentSection {
  heading: string;
  paragraphs: readonly string[];
}

interface CalculatorPageFrameProps {
  eyebrow: string;
  title: string;
  description: string;
  mode: SolarCalculatorMode;
  initialDateISO: string;
  sections: readonly CalculatorContentSection[];
  faqs: readonly { question: string; answer: string }[];
}

const glassPanel =
  'rounded-[30px] border [border-color:var(--solar-glass-border)] [background:var(--solar-glass-bg)] [box-shadow:var(--solar-glass-shadow)] backdrop-blur-2xl';

export function CalculatorPageFrame({
  eyebrow,
  title,
  description,
  mode,
  initialDateISO,
  sections,
  faqs,
}: CalculatorPageFrameProps) {
  return (
    <>
      <ContentPageHeader />
      <main className="relative z-10 mx-auto w-full max-w-screen-2xl px-3 py-4 sm:px-4 lg:px-6">
        <section className={`${glassPanel} px-4 py-6 sm:px-6 sm:py-8`}>
          <nav aria-label="Breadcrumb" className="mb-4 text-xs text-[var(--solar-text-muted)]">
            <Link href="/" className="hover:text-[var(--solar-text-strong)]">Home</Link>
            <span aria-hidden="true" className="mx-2">/</span>
            <span>{title}</span>
          </nav>
          <p className="text-[0.66rem] font-semibold uppercase tracking-[0.3em] text-[var(--solar-kicker)]">{eyebrow}</p>
          <h1 className="mt-3 max-w-5xl text-3xl font-semibold tracking-[-0.04em] text-[var(--solar-text-strong)] sm:text-5xl">{title}</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--solar-text)]">{description}</p>
        </section>

        <div className="mt-4">
          <SolarCalculator mode={mode} initialDateISO={initialDateISO} />
        </div>

        <section className={`${glassPanel} mt-4 p-4 sm:p-6`} aria-labelledby="understand-results-heading">
          <p className="text-[0.66rem] font-semibold uppercase tracking-[0.28em] text-[var(--solar-kicker)]">Interpretation</p>
          <h2 id="understand-results-heading" className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[var(--solar-text-strong)]">Understand the result</h2>
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {sections.map((section) => (
              <article key={section.heading} className="rounded-[22px] border p-4 [border-color:var(--solar-surface-border)] [background:var(--solar-surface-bg)]">
                <h3 className="text-lg font-semibold text-[var(--solar-text-strong)]">{section.heading}</h3>
                <div className="mt-3 space-y-3 text-sm leading-6 text-[var(--solar-text)]">
                  {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className={`${glassPanel} mt-4 p-4 sm:p-6`} aria-labelledby="calculator-faq-heading">
          <p className="text-[0.66rem] font-semibold uppercase tracking-[0.28em] text-[var(--solar-kicker)]">Questions</p>
          <h2 id="calculator-faq-heading" className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[var(--solar-text-strong)]">Frequently asked questions</h2>
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {faqs.map((faq) => (
              <article key={faq.question} className="rounded-[22px] border p-4 [border-color:var(--solar-surface-border)] [background:var(--solar-surface-bg)]">
                <h3 className="font-semibold text-[var(--solar-text-strong)]">{faq.question}</h3>
                <p className="mt-3 text-sm leading-6 text-[var(--solar-text)]">{faq.answer}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
