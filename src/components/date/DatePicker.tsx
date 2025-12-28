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

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Date display and navigation */}
      <div className="flex items-center gap-2">
        {/* Previous day button */}
        <button
          onClick={handlePrevDay}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
          aria-label="Previous day"
        >
          <svg
            className="w-5 h-5 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        {/* Date input */}
        <div className="flex-1 relative">
          <input
            type="date"
            value={dateISO}
            onChange={handleDateChange}
            className="w-full px-3 py-2 bg-background border border-input rounded-lg text-center font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Select date"
          />
        </div>

        {/* Next day button */}
        <button
          onClick={handleNextDay}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
          aria-label="Next day"
        >
          <svg
            className="w-5 h-5 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Today button and formatted date */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{formatDateDisplay(dateISO)}</span>

        {!dateIsToday && (
          <button
            onClick={handleTodayClick}
            className="text-sm text-primary hover:text-primary/80 font-medium"
          >
            Go to Today
          </button>
        )}

        {dateIsToday && (
          <span className="text-sm text-green-600 dark:text-green-400 font-medium">✓ Today</span>
        )}
      </div>

      {/* Quick date buttons */}
      <div className="flex gap-1 flex-wrap">
        <QuickDateButton
          label="Solstice (Jun)"
          dateISO={`${new Date().getFullYear()}-06-21`}
          currentDate={dateISO}
          onClick={setDateISO}
        />
        <QuickDateButton
          label="Equinox (Mar)"
          dateISO={`${new Date().getFullYear()}-03-20`}
          currentDate={dateISO}
          onClick={setDateISO}
        />
        <QuickDateButton
          label="Solstice (Dec)"
          dateISO={`${new Date().getFullYear()}-12-21`}
          currentDate={dateISO}
          onClick={setDateISO}
        />
        <QuickDateButton
          label="Equinox (Sep)"
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
      onClick={() => onClick(dateISO)}
      className={`
        px-2 py-1 text-xs rounded-full transition-colors
        ${
          isActive
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground hover:bg-muted/80'
        }
      `}
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
        <span className="px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded">
          Today
        </span>
      )}
    </div>
  );
}
