/**
 * ManualCoordinates Component
 *
 * Input form for manually entering latitude and longitude coordinates.
 * Accepts a single string input in "lat, lng" format.
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { validateLatitude, validateLongitude } from '@/lib/geo/validation';
import type { LocationPoint } from '@/types/solar';

export interface ManualCoordinatesProps {
  /** Initial latitude value */
  initialLat?: number;
  /** Initial longitude value */
  initialLng?: number;
  /** Callback when valid coordinates are submitted */
  onSubmit: (location: LocationPoint) => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * ManualCoordinates provides precision coordinate input via a single text field
 */
export function ManualCoordinates({
  initialLat,
  initialLng,
  onSubmit,
  className = '',
}: ManualCoordinatesProps) {
  const [input, setInput] = useState(() => {
    if (initialLat !== undefined && initialLng !== undefined) {
      return `${initialLat}, ${initialLng}`;
    }
    return '';
  });
  const [error, setError] = useState<string | null>(null);
  const isEditingRef = useRef(false);

  // Sync input with props only when not actively editing
  useEffect(() => {
    if (isEditingRef.current) return;

    if (initialLat !== undefined && initialLng !== undefined) {
      setInput(`${initialLat}, ${initialLng}`);
    } else {
      setInput('');
    }
  }, [initialLat, initialLng]);

  const handleFocus = () => {
    isEditingRef.current = true;
  };

  const handleBlur = () => {
    isEditingRef.current = false;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    if (error) setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Parse input using regex to extract numbers
    // This handles various formats:
    // "23.5, 121.5"
    // "23.5 121.5"
    // "(23.5, 121.5)"
    // "Lat: 23.5, Lng: 121.5"
    const matches = input.match(/-?(\d+(\.\d*)?|\.\d+)/g);

    if (!matches || matches.length < 2) {
      setError('Please enter valid latitude and longitude coordinates');
      return;
    }

    const lat = parseFloat(matches[0]);
    const lng = parseFloat(matches[1]);

    if (isNaN(lat) || isNaN(lng)) {
      setError('Coordinates must be valid numbers');
      return;
    }

    // Validate ranges
    const latResult = validateLatitude(lat);
    if (!latResult.valid) {
      setError(`Latitude error: ${latResult.error}`);
      return;
    }

    const lngResult = validateLongitude(lng);
    if (!lngResult.valid) {
      setError(`Longitude error: ${lngResult.error}`);
      return;
    }

    // Submit valid location
    onSubmit({
      lat,
      lng,
      name: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      source: 'manual',
    });
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-2 ${className}`}>
      <div>
        <label
          htmlFor="coords-input"
          className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
        >
          Coordinates (Lat, Lng)
        </label>
        <div className="flex gap-1.5 sm:gap-2">
          <input
            type="text"
            id="coords-input"
            value={input}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder="e.g. 23.996, 121.572"
            className={`
              flex-1 min-w-0 px-2 sm:px-3 py-2 text-sm rounded-lg
              bg-white dark:bg-slate-800
              border ${error ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'}
              focus:outline-none focus:ring-2 focus:ring-blue-500
              placeholder:text-slate-400
            `}
          />
          <button
            type="submit"
            className="
              px-3 sm:px-4 py-2 text-sm font-medium
              bg-blue-600 hover:bg-blue-700
              text-white rounded-lg
              transition-colors
              whitespace-nowrap flex-shrink-0
            "
          >
            Set
          </button>
        </div>
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        <p className="mt-1 text-[9px] sm:text-[10px] text-slate-400">
          Paste coordinates from Google Maps
        </p>
      </div>
    </form>
  );
}
