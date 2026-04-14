/**
 * ManualCoordinates Component
 *
 * Input form for manually entering latitude and longitude coordinates.
 * Accepts a single string input in "lat, lng" format.
 */

'use client';

import { useEffect, useRef, useState } from 'react';
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

function formatCoordinates(lat?: number, lng?: number): string {
  if (lat !== undefined && lng !== undefined) {
    return `${lat}, ${lng}`;
  }

  return '';
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
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isEditingRef = useRef(false);

  useEffect(() => {
    if (!inputRef.current || isEditingRef.current) return;
    inputRef.current.value = formatCoordinates(initialLat, initialLng);
  }, [initialLat, initialLng]);

  const handleFocus = () => {
    isEditingRef.current = true;
  };

  const handleBlur = () => {
    isEditingRef.current = false;
  };

  const handleChange = () => {
    if (error) setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const input = inputRef.current?.value ?? '';

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
          className="mb-2 block text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-slate-400"
        >
          Manual Coordinates
        </label>
        <p className="mb-3 text-xs text-slate-500">Exact latitude and longitude when you already know the point.</p>
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            id="coords-input"
            defaultValue={formatCoordinates(initialLat, initialLng)}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder="e.g. 23.996, 121.572"
            className={`
              h-10 min-w-0 flex-1 rounded-2xl border px-3 text-sm text-white
              shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] outline-none transition-all
              placeholder:text-slate-500
              ${
                error
                  ? 'border-rose-300/40 bg-rose-500/12 focus:border-rose-300/50 focus:ring-2 focus:ring-rose-300/20'
                  : 'border-white/10 bg-slate-950/50 focus:border-sky-300/35 focus:ring-2 focus:ring-sky-300/20'
              }
            `}
          />
          <button
            type="submit"
            className="flex h-10 flex-shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] px-3 text-sm font-semibold text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:border-sky-300/30 hover:bg-sky-400/12 whitespace-nowrap"
          >
            Set
          </button>
        </div>
        {error && <p className="mt-2 text-xs text-rose-200">{error}</p>}
        <p className="mt-2 text-[10px] text-slate-500">Paste coordinates from Google Maps</p>
      </div>
    </form>
  );
}
