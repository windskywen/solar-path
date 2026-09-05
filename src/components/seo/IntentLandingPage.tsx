import Link from 'next/link';

export interface IntentLandingHighlight {
  title: string;
  description: string;
}

export interface IntentLandingFaq {
  question: string;
  answer: string;
}

export interface IntentLandingLink {
  href: string;
  label: string;
  description: string;
}

interface IntentLandingPageProps {
  eyebrow: string;
  title: string;
  description: string;
  intro: string;
  highlights: readonly IntentLandingHighlight[];
  steps: readonly string[];
  faqs: readonly IntentLandingFaq[];
  primaryCta: {
    href: string;
    label: string;
  };
  secondaryCta?: {
    href: string;
    label: string;
  };
  relatedLinks: readonly IntentLandingLink[];
}

export function IntentLandingPage({
  eyebrow,
  title,
  description,
  intro,
  highlights,
  steps,
  faqs,
  primaryCta,
  secondaryCta,
  relatedLinks,
}: IntentLandingPageProps) {
  const glassPanel =
    'relative overflow-hidden rounded-[30px] border [border-color:var(--solar-glass-border)] [background:var(--solar-glass-bg)] [box-shadow:var(--solar-glass-shadow)] backdrop-blur-2xl';
  const railPanel =
    'relative overflow-hidden rounded-[28px] border [border-color:var(--solar-glass-border)] [background:var(--solar-rail-bg)] [box-shadow:var(--solar-rail-shadow)] backdrop-blur-xl';
  const surfacePanel =
    'rounded-[22px] border [border-color:var(--solar-surface-border)] [background:var(--solar-surface-bg)] p-4 [box-shadow:var(--solar-surface-inset-shadow)]';
  const eyebrowClass =
    'text-[0.64rem] font-semibold uppercase tracking-[0.32em] text-[var(--solar-kicker)]';
  const primaryButton =
    'inline-flex items-center justify-center rounded-full border border-sky-300/30 bg-sky-400/12 px-4 py-2 text-sm font-medium text-[var(--solar-text-strong)] transition-colors hover:border-sky-300/50 hover:bg-sky-400/18';
  const secondaryButton =
    'inline-flex items-center justify-center rounded-full border [border-color:var(--solar-surface-border)] px-4 py-2 text-sm font-medium text-[var(--solar-text)] transition-colors hover:text-[var(--solar-text-strong)]';

  return (
    <main className="relative z-10 mx-auto flex w-full max-w-screen-2xl flex-1 flex-col px-3 py-4 sm:px-4 lg:px-6">
      <section className={`${glassPanel} px-4 py-5 sm:px-6 sm:py-6`}>
        <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-2 text-xs text-[var(--solar-text-muted)]">
          <Link href="/" className="transition-colors hover:text-[var(--solar-text-strong)]">
            Home
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-[var(--solar-text-strong)]">{title}</span>
        </nav>

        <div className="max-w-4xl space-y-4">
          <p className={eyebrowClass}>{eyebrow}</p>
          <h1 className="text-3xl font-semibold tracking-[-0.04em] text-[var(--solar-text-strong)] sm:text-4xl lg:text-5xl">
            {title}
          </h1>
          <p className="max-w-3xl text-base leading-7 text-[var(--solar-text)]">{description}</p>
          <p className="max-w-3xl text-sm leading-6 text-[var(--solar-text)] sm:text-base">
            {intro}
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <Link href={primaryCta.href} className={primaryButton}>
              {primaryCta.label}
            </Link>
            {secondaryCta ? (
              <Link href={secondaryCta.href} className={secondaryButton}>
                {secondaryCta.label}
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)]">
        <section className={railPanel} aria-labelledby="highlights-heading">
          <div className="border-b [border-color:var(--solar-divider)] px-4 pb-4 pt-4 sm:px-5 sm:pt-5">
            <p className={eyebrowClass}>Why it helps</p>
            <h2
              id="highlights-heading"
              className="mt-2 text-xl font-semibold tracking-[-0.02em] text-[var(--solar-text-strong)]"
            >
              What you can answer quickly
            </h2>
          </div>

          <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
            {highlights.map((highlight) => (
              <article key={highlight.title} className={surfacePanel}>
                <h3 className="text-sm font-semibold text-[var(--solar-text-strong)]">
                  {highlight.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[var(--solar-text)]">
                  {highlight.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className={railPanel} aria-labelledby="steps-heading">
          <div className="border-b [border-color:var(--solar-divider)] px-4 pb-4 pt-4 sm:px-5 sm:pt-5">
            <p className={eyebrowClass}>Workflow</p>
            <h2
              id="steps-heading"
              className="mt-2 text-xl font-semibold tracking-[-0.02em] text-[var(--solar-text-strong)]"
            >
              How to use the live tool
            </h2>
          </div>

          <ol className="space-y-3 p-4 sm:p-5">
            {steps.map((step, index) => (
              <li key={step} className={`${surfacePanel} flex gap-3`}>
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-sky-300/30 bg-sky-400/10 text-xs font-semibold text-[var(--solar-text-strong)]">
                  {index + 1}
                </span>
                <p className="text-sm leading-6 text-[var(--solar-text)]">{step}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
        <section className={railPanel} aria-labelledby="faq-heading">
          <div className="border-b [border-color:var(--solar-divider)] px-4 pb-4 pt-4 sm:px-5 sm:pt-5">
            <p className={eyebrowClass}>Questions</p>
            <h2
              id="faq-heading"
              className="mt-2 text-xl font-semibold tracking-[-0.02em] text-[var(--solar-text-strong)]"
            >
              Frequently asked questions
            </h2>
          </div>

          <div className="space-y-4 p-4 sm:p-5">
            {faqs.map((faq) => (
              <article key={faq.question} className={surfacePanel}>
                <h3 className="text-sm font-semibold text-[var(--solar-text-strong)]">
                  {faq.question}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[var(--solar-text)]">{faq.answer}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={railPanel} aria-labelledby="related-heading">
          <div className="border-b [border-color:var(--solar-divider)] px-4 pb-4 pt-4 sm:px-5 sm:pt-5">
            <p className={eyebrowClass}>Related pages</p>
            <h2
              id="related-heading"
              className="mt-2 text-xl font-semibold tracking-[-0.02em] text-[var(--solar-text-strong)]"
            >
              Continue planning
            </h2>
          </div>

          <div className="space-y-3 p-4 sm:p-5">
            {relatedLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`${surfacePanel} block transition-colors hover:border-sky-300/35 hover:text-[var(--solar-text-strong)]`}
              >
                <p className="text-sm font-semibold text-[var(--solar-text-strong)]">
                  {link.label}
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--solar-text)]">
                  {link.description}
                </p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
