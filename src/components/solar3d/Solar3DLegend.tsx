'use client';

/**
 * Solar3DLegend Component
 *
 * Displays a legend for the daylight state colors used in the 3D view.
 * Shows golden hour (amber) and daylight (yellow) point colors.
 */

export interface Solar3DLegendProps {
  /**
   * Additional CSS classes.
   */
  className?: string;
}

/**
 * Solar3DLegend
 *
 * Displays legend for point colors in the 3D view.
 */
export function Solar3DLegend({ className = '' }: Solar3DLegendProps) {
  return (
    <div
      className={`rounded-[22px] border [border-color:var(--solar-3d-surface-border)] [background:var(--solar-3d-legend-bg)] p-2.5 [box-shadow:var(--solar-3d-surface-shadow)] backdrop-blur-xl sm:rounded-[26px] sm:p-3.5 ${className}`}
      role="complementary"
      aria-label="Color legend for sun positions"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[0.56rem] font-medium uppercase tracking-[0.28em] text-[var(--solar-3d-kicker)] sm:text-[0.62rem] sm:tracking-[0.3em]">
            Legend
          </p>
          <h3 className="mt-0.5 text-[0.78rem] font-semibold text-[var(--solar-text-strong)] sm:mt-1 sm:text-sm">
            Light states
          </h3>
        </div>
        <div className="hidden h-10 w-10 items-center justify-center rounded-full border [border-color:var(--solar-surface-border)] [background:var(--solar-surface-soft-bg)] text-[var(--solar-warning-text)] sm:flex">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="3.5" />
            <path d="M12 2v2.5M12 19.5V22M4.93 4.93l1.77 1.77M17.3 17.3l1.77 1.77M2 12h2.5M19.5 12H22M4.93 19.07l1.77-1.77M17.3 6.7l1.77-1.77" />
          </svg>
        </div>
      </div>

      <ul className="mt-2.5 grid grid-cols-2 gap-1.5 text-[0.68rem] sm:mt-3 sm:grid-cols-1 sm:gap-2 sm:text-sm">
        <li className="rounded-[16px] border [border-color:var(--solar-surface-border)] [background:var(--solar-surface-soft-bg)] px-2.5 py-2 sm:rounded-[18px] sm:px-3 sm:py-2.5">
          <div className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full shadow-[0_0_16px_rgba(255,183,77,0.45)] sm:h-3 sm:w-3"
              style={{ backgroundColor: 'rgb(255, 183, 77)' }}
              aria-hidden="true"
            />
            <span className="font-medium text-[var(--solar-text-strong)]">Golden Hour</span>
          </div>
          <p className="mt-1 hidden text-[0.72rem] text-[var(--solar-text-muted)] sm:block">
            Warm, low-angle sun
          </p>
        </li>
        <li className="rounded-[16px] border [border-color:var(--solar-surface-border)] [background:var(--solar-surface-soft-bg)] px-2.5 py-2 sm:rounded-[18px] sm:px-3 sm:py-2.5">
          <div className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full shadow-[0_0_16px_rgba(255,235,59,0.4)] sm:h-3 sm:w-3"
              style={{ backgroundColor: 'rgb(255, 235, 59)' }}
              aria-hidden="true"
            />
            <span className="font-medium text-[var(--solar-text-strong)]">Daylight</span>
          </div>
          <p className="mt-1 hidden text-[0.72rem] text-[var(--solar-text-muted)] sm:block">
            Direct visible sun
          </p>
        </li>
        <li className="rounded-[16px] border [border-color:var(--solar-surface-border)] [background:var(--solar-surface-soft-bg)] px-2.5 py-2 sm:rounded-[18px] sm:px-3 sm:py-2.5">
          <div className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full shadow-[0_0_16px_rgba(255,87,34,0.4)] sm:h-3 sm:w-3"
              style={{ backgroundColor: 'rgb(255, 87, 34)' }}
              aria-hidden="true"
            />
            <span className="font-medium text-[var(--solar-text-strong)]">Selected Hour</span>
          </div>
          <p className="mt-1 hidden text-[0.72rem] text-[var(--solar-text-muted)] sm:block">
            Focused comparison point
          </p>
        </li>
        <li className="rounded-[16px] border [border-color:var(--solar-surface-border)] [background:var(--solar-surface-soft-bg)] px-2.5 py-2 sm:rounded-[18px] sm:px-3 sm:py-2.5">
          <div className="flex items-center gap-2">
            <span
              className="h-px w-5 rounded-full shadow-[0_0_16px_rgba(255,193,7,0.35)] sm:h-1 sm:w-7"
              style={{ backgroundColor: 'rgb(255, 193, 7)' }}
              aria-hidden="true"
            />
            <span className="font-medium text-[var(--solar-text-strong)]">Sun Path</span>
          </div>
          <p className="mt-1 hidden text-[0.72rem] text-[var(--solar-text-muted)] sm:block">
            Daily trajectory arc
          </p>
        </li>
      </ul>
    </div>
  );
}
