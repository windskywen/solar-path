'use client';

/**
 * TimezoneSelector Component
 *
 * Allows users to select a timezone for solar calculations.
 * Uses IANA timezone identifiers with common presets and
 * supports custom input for advanced users.
 */

import React, { useState, useCallback, useId } from 'react';
import {
  getCommonTimezones,
  isValidTimezone,
  getTimezoneOffset,
  getTimezoneAbbreviation,
} from '@/lib/utils/timezone';

interface TimezoneSelectorProps {
  /** Current selected timezone */
  value: string;
  /** Callback when timezone changes */
  onChange: (timezone: string) => void;
  /** Current date for offset display (ISO format) */
  dateISO?: string;
  /** Optional class name */
  className?: string;
  /** Whether to show as compact mode */
  compact?: boolean;
  /** Whether the selector is disabled */
  disabled?: boolean;
}

export function TimezoneSelector({
  value,
  onChange,
  dateISO,
  className = '',
  compact = false,
  disabled = false,
}: TimezoneSelectorProps) {
  const [showCustom, setShowCustom] = useState(false);
  const [customValue, setCustomValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const selectId = useId();
  const customInputId = useId();
  const commonTimezones = getCommonTimezones();

  // Check if current value is in the common list
  const isCustomTimezone = value !== 'browser' && !commonTimezones.find((tz) => tz.value === value);

  const handleSelectChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newValue = e.target.value;
      setError(null);

      if (newValue === '__custom__') {
        setShowCustom(true);
        setCustomValue('');
      } else {
        setShowCustom(false);
        onChange(newValue);
      }
    },
    [onChange]
  );

  const handleCustomSubmit = useCallback(() => {
    const trimmedValue = customValue.trim();

    if (!trimmedValue) {
      setError('Please enter a timezone');
      return;
    }

    if (!isValidTimezone(trimmedValue)) {
      setError('Invalid timezone. Use IANA format (e.g., America/New_York)');
      return;
    }

    setError(null);
    setShowCustom(false);
    onChange(trimmedValue);
  }, [customValue, onChange]);

  const handleCustomKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleCustomSubmit();
      } else if (e.key === 'Escape') {
        setShowCustom(false);
        setError(null);
      }
    },
    [handleCustomSubmit]
  );

  // Get display info for current timezone
  const displayOffset = dateISO ? getTimezoneOffset(dateISO, value) : null;
  const displayAbbr = dateISO ? getTimezoneAbbreviation(dateISO, value) : null;

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <label htmlFor={selectId} className="sr-only">
          Timezone
        </label>
        <select
          id={selectId}
          value={isCustomTimezone ? value : showCustom ? '__custom__' : value}
          onChange={handleSelectChange}
          disabled={disabled}
          className="
            text-xs px-2 py-1 rounded border border-slate-300 dark:border-slate-600
            bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300
            focus:outline-none focus:ring-2 focus:ring-blue-500
            disabled:opacity-50 disabled:cursor-not-allowed
          "
          aria-label="Select timezone"
        >
          {commonTimezones.map((tz) => (
            <option key={tz.value} value={tz.value}>
              {tz.label}
            </option>
          ))}
          {isCustomTimezone && <option value={value}>{value}</option>}
          <option value="__custom__">Custom...</option>
        </select>

        {displayAbbr && (
          <span className="text-xs text-slate-500 dark:text-slate-400">{displayAbbr}</span>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <label
          htmlFor={selectId}
          className="text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          Timezone
        </label>

        {displayOffset && (
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {displayOffset} {displayAbbr && `(${displayAbbr})`}
          </span>
        )}
      </div>

      {showCustom ? (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              id={customInputId}
              type="text"
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              onKeyDown={handleCustomKeyDown}
              placeholder="e.g., America/New_York"
              disabled={disabled}
              className={`
                flex-1 px-3 py-2 text-sm rounded-lg border
                ${
                  error
                    ? 'border-red-300 dark:border-red-700 focus:ring-red-500'
                    : 'border-slate-300 dark:border-slate-600 focus:ring-blue-500'
                }
                bg-white dark:bg-slate-800 text-slate-900 dark:text-white
                focus:outline-none focus:ring-2
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
              aria-label="Custom timezone input"
              aria-invalid={!!error}
              aria-describedby={error ? `${customInputId}-error` : undefined}
            />

            <button
              type="button"
              onClick={handleCustomSubmit}
              disabled={disabled}
              className="
                px-3 py-2 text-sm font-medium rounded-lg
                bg-blue-600 text-white hover:bg-blue-700
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              Apply
            </button>

            <button
              type="button"
              onClick={() => {
                setShowCustom(false);
                setError(null);
              }}
              disabled={disabled}
              className="
                px-3 py-2 text-sm font-medium rounded-lg
                bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300
                hover:bg-slate-300 dark:hover:bg-slate-600
                focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              Cancel
            </button>
          </div>

          {error && (
            <p
              id={`${customInputId}-error`}
              className="text-xs text-red-600 dark:text-red-400"
              role="alert"
            >
              {error}
            </p>
          )}

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Enter an IANA timezone identifier.
            <a
              href="https://en.wikipedia.org/wiki/List_of_tz_database_time_zones"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-1 text-blue-600 dark:text-blue-400 hover:underline"
            >
              View list
            </a>
          </p>
        </div>
      ) : (
        <select
          id={selectId}
          value={isCustomTimezone ? value : value}
          onChange={handleSelectChange}
          disabled={disabled}
          className="
            w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600
            bg-white dark:bg-slate-800 text-slate-900 dark:text-white
            focus:outline-none focus:ring-2 focus:ring-blue-500
            disabled:opacity-50 disabled:cursor-not-allowed
          "
          aria-label="Select timezone"
        >
          {commonTimezones.map((tz) => (
            <option key={tz.value} value={tz.value}>
              {tz.label}
            </option>
          ))}
          {isCustomTimezone && <option value={value}>{value}</option>}
          <option value="__custom__">Enter custom timezone...</option>
        </select>
      )}
    </div>
  );
}
