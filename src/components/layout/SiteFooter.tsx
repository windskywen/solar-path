import Link from 'next/link';

const footerLinkClass =
  'transition-colors hover:text-[var(--solar-text-strong)] underline decoration-sky-200/40 underline-offset-4';

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative z-10 px-3 pb-4 sm:px-4 lg:px-6">
      <div className="mx-auto max-w-screen-2xl">
        <div className="rounded-[24px] border [border-color:var(--solar-glass-border)] [background:var(--solar-surface-soft-bg)] px-4 py-3 text-[11px] text-[var(--solar-text-muted)] backdrop-blur-xl">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-center sm:text-left">&copy; {year} Solar Path Tracker</p>

            <nav
              aria-label="Footer navigation"
              className="flex flex-wrap items-center justify-center gap-2 sm:justify-end"
            >
              <Link href="/privacy" className={footerLinkClass}>
                Privacy Policy
              </Link>
              <span aria-hidden="true" className="hidden text-[var(--solar-text-faint)] sm:inline">
                &middot;
              </span>
              <Link href="/about" className={footerLinkClass}>
                About
              </Link>
              <span aria-hidden="true" className="hidden text-[var(--solar-text-faint)] sm:inline">
                &middot;
              </span>
              <Link href="/about#contact" className={footerLinkClass}>
                Contact Us
              </Link>
            </nav>
          </div>

          <p className="mt-2 text-center sm:text-left">
            Data sources:{' '}
            <a
              href="https://www.openstreetmap.org/copyright"
              target="_blank"
              rel="noopener noreferrer"
              className={footerLinkClass}
            >
              OpenStreetMap
            </a>
            ,{' '}
            <a
              href="https://github.com/mourner/suncalc"
              target="_blank"
              rel="noopener noreferrer"
              className={footerLinkClass}
            >
              SunCalc
            </a>
          </p>

          <p className="mt-2 text-[10px] leading-4 text-[var(--solar-text-faint)] sm:max-w-5xl">
            Disclaimer: The solar data and 3D visualizations provided on this website are for
            general informational purposes only. While we strive for accuracy, we do not guarantee
            the data is suitable for professional architectural, engineering, or solar installation
            decisions. Users should verify all information independently.
          </p>
        </div>
      </div>
    </footer>
  );
}
