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
      className={`rounded-[26px] border border-white/10 bg-[#071022]/74 p-3.5 shadow-[0_24px_60px_rgba(2,6,23,0.38)] backdrop-blur-xl ${className}`}
      role="complementary"
      aria-label="Color legend for sun positions"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[0.62rem] font-medium uppercase tracking-[0.3em] text-cyan-200/60">
            Legend
          </p>
          <h3 className="mt-1 text-sm font-semibold text-white">Light states</h3>
        </div>
        <div className="hidden h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-amber-200/90 sm:flex">
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

      <ul className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-1 sm:text-sm">
        <li className="rounded-[18px] border border-white/10 bg-white/[0.04] px-3 py-2.5">
          <div className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-full shadow-[0_0_16px_rgba(255,183,77,0.45)]"
              style={{ backgroundColor: 'rgb(255, 183, 77)' }}
              aria-hidden="true"
            />
            <span className="font-medium text-slate-100">Golden Hour</span>
          </div>
          <p className="mt-1 text-[0.72rem] text-slate-400">Warm, low-angle sun</p>
        </li>
        <li className="rounded-[18px] border border-white/10 bg-white/[0.04] px-3 py-2.5">
          <div className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-full shadow-[0_0_16px_rgba(255,235,59,0.4)]"
              style={{ backgroundColor: 'rgb(255, 235, 59)' }}
              aria-hidden="true"
            />
            <span className="font-medium text-slate-100">Daylight</span>
          </div>
          <p className="mt-1 text-[0.72rem] text-slate-400">Direct visible sun</p>
        </li>
        <li className="rounded-[18px] border border-white/10 bg-white/[0.04] px-3 py-2.5">
          <div className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-full shadow-[0_0_16px_rgba(255,87,34,0.4)]"
              style={{ backgroundColor: 'rgb(255, 87, 34)' }}
              aria-hidden="true"
            />
            <span className="font-medium text-slate-100">Selected Hour</span>
          </div>
          <p className="mt-1 text-[0.72rem] text-slate-400">Focused comparison point</p>
        </li>
        <li className="rounded-[18px] border border-white/10 bg-white/[0.04] px-3 py-2.5">
          <div className="flex items-center gap-2">
            <span
              className="h-1 w-7 rounded-full shadow-[0_0_16px_rgba(255,193,7,0.35)]"
              style={{ backgroundColor: 'rgb(255, 193, 7)' }}
              aria-hidden="true"
            />
            <span className="font-medium text-slate-100">Sun Path</span>
          </div>
          <p className="mt-1 text-[0.72rem] text-slate-400">Daily trajectory arc</p>
        </li>
      </ul>
    </div>
  );
}
