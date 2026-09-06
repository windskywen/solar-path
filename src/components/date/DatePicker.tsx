'use client';

/**
 * DatePicker Component
 *
 * Date selection for solar calculations.
 * Defaults to today's date and allows selecting any Gregorian date.
 */

import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import { useDateISO, useSolarActions, useTimezone } from '@/store/solar-store';
import { getTodayISO } from '@/lib/utils/timezone';

export interface DatePickerProps {
  /** Additional CSS classes */
  className?: string;
  /** Server-generated UTC date used for the hydration-safe first render */
  initialDateISO: string;
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

function subscribeToDate(onChange: () => void) {
  const timer = setInterval(onChange, 60_000);
  return () => clearInterval(timer);
}

/**
 * DatePicker provides date selection for solar calculations
 */
export function DatePicker({ className = '', initialDateISO, onChange }: DatePickerProps) {
  const dateISO = useDateISO();
  const timezone = useTimezone();
  const { setDateISO } = useSolarActions();
  const dateInputRef = useRef<HTMLInputElement>(null);

  const automaticDate = useRef(true);
  const lastAutomaticDate = useRef(initialDateISO);

  // Preserve the server snapshot, then resolve today in the observation timezone.
  const today = useSyncExternalStore(
    subscribeToDate,
    () => getTodayISO(timezone),
    () => initialDateISO
  );
  const dateIsToday = useMemo(() => dateISO === today, [dateISO, today]);

  useEffect(() => {
    if (!automaticDate.current || dateISO !== lastAutomaticDate.current) return;
    lastAutomaticDate.current = today;
    if (dateISO !== today) setDateISO(today);
  }, [dateISO, today, setDateISO]);

  const selectDate = useCallback((value: string) => {
    automaticDate.current = false;
    setDateISO(value);
    onChange?.(value);
  }, [setDateISO, onChange]);

  const handleDateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newDate = e.target.value;
      if (newDate) {
        selectDate(newDate);
      }
    },
    [selectDate]
  );

  const handleTodayClick = useCallback(() => {
    selectDate(getTodayISO(timezone));
  }, [timezone, selectDate]);

  const handlePrevDay = useCallback(() => {
    const current = new Date(dateISO + 'T12:00:00');
    current.setDate(current.getDate() - 1);
    const newDate = current.toISOString().split('T')[0];
    selectDate(newDate);
  }, [dateISO, selectDate]);

  const handleNextDay = useCallback(() => {
    const current = new Date(dateISO + 'T12:00:00');
    current.setDate(current.getDate() + 1);
    const newDate = current.toISOString().split('T')[0];
    selectDate(newDate);
  }, [dateISO, selectDate]);

  const handleQuickDateChange = useCallback(
    (newDate: string) => {
      selectDate(newDate);
    },
    [selectDate]
  );

  const handleOpenPicker = useCallback(() => {
    const input = dateInputRef.current;
    if (!input) return;

    input.focus({ preventScroll: true });
    if (typeof input.showPicker === 'function') {
      input.showPicker();
      return;
    }

    input.click();
  }, []);

  const iconButtonClass =
    'flex h-11 w-11 items-center justify-center rounded-2xl border text-[var(--solar-button-text)] [border-color:var(--solar-button-border)] [background:var(--solar-button-bg)] [box-shadow:var(--solar-button-shadow)] transition-all duration-200 hover:-translate-y-0.5 hover:[border-color:var(--solar-button-hover-border)] hover:[background:var(--solar-button-hover-bg)] hover:text-[var(--solar-button-hover-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--solar-input-focus-ring)]';

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
            ref={dateInputRef}
            type="date"
            value={dateISO}
            onChange={handleDateChange}
            className="solar-date-input h-11 w-full rounded-2xl border px-4 pr-12 text-center text-sm font-semibold tracking-[0.02em] text-[var(--solar-text-strong)] [border-color:var(--solar-input-border)] [background:var(--solar-input-bg)] [box-shadow:var(--solar-input-shadow)] outline-none transition-all focus:[border-color:var(--solar-input-focus-border)] focus:ring-2 focus:ring-[var(--solar-input-focus-ring)] sm:text-base"
            aria-label="Select date"
          />
          <button
            type="button"
            onClick={handleOpenPicker}
            className="absolute right-1.5 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-[var(--solar-accent)] transition-colors hover:bg-[var(--solar-accent-soft)] hover:text-[var(--solar-text-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--solar-input-focus-ring)]"
            aria-label="Open calendar"
          >
            <svg
              className="h-4 w-4 sm:h-[1.05rem] sm:w-[1.05rem]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="1.75" />
              <path strokeWidth="1.75" strokeLinecap="round" d="M8 2v4M16 2v4M3 10h18" />
            </svg>
          </button>
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
      <div className="flex items-center justify-between gap-3 rounded-2xl border [border-color:var(--solar-surface-border)] [background:var(--solar-surface-soft-bg)] px-3 py-2.5 [box-shadow:var(--solar-surface-inset-shadow)]">
        <span className="truncate text-xs text-[var(--solar-text)] sm:text-sm">{formatDateDisplay(dateISO)}</span>

        {!dateIsToday ? (
          <button
            type="button"
            onClick={handleTodayClick}
            className="whitespace-nowrap rounded-full border px-3 py-1 text-[0.7rem] font-semibold text-[var(--solar-accent)] transition-colors [border-color:var(--solar-input-focus-border)] [background:var(--solar-accent-soft)] hover:[background:var(--solar-row-hover)] sm:text-xs"
          >
            Go to Today
          </button>
        ) : (
          <span className="whitespace-nowrap rounded-full border px-3 py-1 text-[0.7rem] font-semibold [border-color:var(--solar-success-border)] [background:var(--solar-success-bg)] text-[var(--solar-success-text)] sm:text-xs">
            ✓ Today
          </span>
        )}
      </div>

      <p className="text-xs text-[var(--solar-text-muted)]">These are fixed seasonal reference dates, not the exact local dates of the solstices or equinoxes.</p>
      {/* Quick date buttons */}
      <div className="flex flex-wrap gap-2">
        <QuickDateButton
          label="Jun 21"
          fullLabel="June reference"
          dateISO={`${today.slice(0, 4)}-06-21`}
          currentDate={dateISO}
          onClick={handleQuickDateChange}
        />
        <QuickDateButton
          label="Mar 20"
          fullLabel="March reference"
          dateISO={`${today.slice(0, 4)}-03-20`}
          currentDate={dateISO}
          onClick={handleQuickDateChange}
        />
        <QuickDateButton
          label="Dec 21"
          fullLabel="December reference"
          dateISO={`${today.slice(0, 4)}-12-21`}
          currentDate={dateISO}
          onClick={handleQuickDateChange}
        />
        <QuickDateButton
          label="Sep 22"
          fullLabel="September reference"
          dateISO={`${today.slice(0, 4)}-09-22`}
          currentDate={dateISO}
          onClick={handleQuickDateChange}
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
  fullLabel,
  dateISO,
  currentDate,
  onClick,
}: {
  label: string;
  fullLabel: string;
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
          ? '[border-color:var(--solar-input-focus-border)] [background:var(--solar-accent-soft)] text-[var(--solar-text-strong)] shadow-[0_0_24px_rgba(56,189,248,0.14)]'
          : '[border-color:var(--solar-surface-border)] [background:var(--solar-surface-soft-bg)] text-[var(--solar-text)] hover:[background:var(--solar-button-hover-bg)]'
      }`}
    >
      <span className="sr-only">{fullLabel}</span>
      <span aria-hidden="true">{label}</span>
    </button>
  );
}

/**
 * Compact date display for header
 */
export function DateDisplayCompact({ className = '' }: { className?: string }) {
  const dateISO = useDateISO();
  const timezone = useTimezone();

  const today = useSyncExternalStore(subscribeToDate, () => getTodayISO(timezone), () => "");

  return (
    <div className={`flex items-center gap-2 text-sm ${className}`}>
      <span className="text-muted-foreground">Date:</span>
      <span className="font-medium text-foreground">{formatDateDisplay(dateISO)}</span>
      {dateISO === today && (
        <span className="rounded-full border px-2 py-0.5 text-xs [border-color:var(--solar-success-border)] [background:var(--solar-success-bg)] text-[var(--solar-success-text)]">
          Today
        </span>
      )}
    </div>
  );
}
