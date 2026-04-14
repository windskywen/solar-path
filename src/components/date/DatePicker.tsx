'use client';

/**
 * DatePicker Component
 *
 * Date selection for solar calculations.
 * Defaults to today's date and allows selecting any Gregorian date.
 */

import { useCallback, useMemo } from 'react';
import { useDateISO, useSolarActions } from '@/store/solar-store';
import { getTodayISO } from '@/lib/utils/timezone';

export interface DatePickerProps {
  /** Additional CSS classes */
  className?: string;
  /** Callback when date changes */
  onChange?: (dateISO: string) => void;
}

/**
 * Format ISO date for display
 */
function formatDateDisplay(dateISO: string): string {
  try {
    const date = new Date(dateISO + 'T12:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateISO;
  }
}

/**
 * Check if a date is today
 */
function isToday(dateISO: string): boolean {
  return dateISO === getTodayISO();
}

/**
 * DatePicker provides date selection for solar calculations
 */
export function DatePicker({ className = '', onChange }: DatePickerProps) {
  const dateISO = useDateISO();
  const { setDateISO } = useSolarActions();

  // Calculate relative dates
  const today = useMemo(() => getTodayISO(), []);
  const dateIsToday = useMemo(() => isToday(dateISO), [dateISO]);

  const handleDateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newDate = e.target.value;
      if (newDate) {
        setDateISO(newDate);
        onChange?.(newDate);
      }
    },
    [setDateISO, onChange]
  );

  const handleTodayClick = useCallback(() => {
    setDateISO(today);
    onChange?.(today);
  }, [today, setDateISO, onChange]);

  const handlePrevDay = useCallback(() => {
    const current = new Date(dateISO + 'T12:00:00');
    current.setDate(current.getDate() - 1);
    const newDate = current.toISOString().split('T')[0];
    setDateISO(newDate);
    onChange?.(newDate);
  }, [dateISO, setDateISO, onChange]);

  const handleNextDay = useCallback(() => {
    const current = new Date(dateISO + 'T12:00:00');
    current.setDate(current.getDate() + 1);
    const newDate = current.toISOString().split('T')[0];
    setDateISO(newDate);
    onChange?.(newDate);
  }, [dateISO, setDateISO, onChange]);

  const iconButtonClass =
    'flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/45 text-slate-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-all duration-200 hover:-translate-y-0.5 hover:border-sky-300/30 hover:bg-sky-400/10';

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Date display and navigation */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handlePrevDay}
          className={iconButtonClass}
          aria-label="Previous day"
        >
          <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="relative flex-1">
          <input
            type="date"
            value={dateISO}
            onChange={handleDateChange}
            className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/45 px-4 text-center text-sm font-semibold tracking-[0.02em] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] outline-none transition-all focus:border-sky-300/35 focus:ring-2 focus:ring-sky-300/20 sm:text-base"
            aria-label="Select date"
          />
        </div>

        <button
          type="button"
          onClick={handleNextDay}
          className={iconButtonClass}
          aria-label="Next day"
        >
          <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Today button and formatted date */}
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
        <span className="truncate text-xs text-slate-300 sm:text-sm">{formatDateDisplay(dateISO)}</span>

        {!dateIsToday ? (
          <button
            type="button"
            onClick={handleTodayClick}
            className="whitespace-nowrap rounded-full border border-sky-300/20 bg-sky-400/10 px-3 py-1 text-[0.7rem] font-semibold text-sky-100 transition-colors hover:bg-sky-400/16 sm:text-xs"
          >
            Go to Today
          </button>
        ) : (
          <span className="whitespace-nowrap rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-[0.7rem] font-semibold text-emerald-100 sm:text-xs">
            ✓ Today
          </span>
        )}
      </div>

      {/* Quick date buttons */}
      <div className="flex flex-wrap gap-2">
        <QuickDateButton
          label="Jun Sol"
          dateISO={`${new Date().getFullYear()}-06-21`}
          currentDate={dateISO}
          onClick={setDateISO}
        />
        <QuickDateButton
          label="Mar Eq"
          dateISO={`${new Date().getFullYear()}-03-20`}
          currentDate={dateISO}
          onClick={setDateISO}
        />
        <QuickDateButton
          label="Dec Sol"
          dateISO={`${new Date().getFullYear()}-12-21`}
          currentDate={dateISO}
          onClick={setDateISO}
        />
        <QuickDateButton
          label="Sep Eq"
          dateISO={`${new Date().getFullYear()}-09-22`}
          currentDate={dateISO}
          onClick={setDateISO}
        />
      </div>
    </div>
  );
}

/**
 * Quick date selection button
 */
function QuickDateButton({
  label,
  dateISO,
  currentDate,
  onClick,
}: {
  label: string;
  dateISO: string;
  currentDate: string;
  onClick: (date: string) => void;
}) {
  const isActive = dateISO === currentDate;

  return (
    <button
      type="button"
      onClick={() => onClick(dateISO)}
      className={`rounded-full border px-3 py-1.5 text-[0.7rem] font-semibold transition-all duration-200 sm:text-xs ${
        isActive
          ? 'border-sky-300/24 bg-sky-400/14 text-sky-50 shadow-[0_0_24px_rgba(56,189,248,0.14)]'
          : 'border-white/10 bg-white/[0.04] text-slate-300 hover:border-white/16 hover:bg-white/[0.07]'
      }`}
    >
      {label}
    </button>
  );
}

/**
 * Compact date display for header
 */
export function DateDisplayCompact({ className = '' }: { className?: string }) {
  const dateISO = useDateISO();

  return (
    <div className={`flex items-center gap-2 text-sm ${className}`}>
      <span className="text-muted-foreground">Date:</span>
      <span className="font-medium text-foreground">{formatDateDisplay(dateISO)}</span>
      {isToday(dateISO) && (
        <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2 py-0.5 text-xs text-emerald-100">
          Today
        </span>
      )}
    </div>
  );
}
