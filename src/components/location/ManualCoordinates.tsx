/**
 * ManualCoordinates Component
 *
 * Input form for manually entering latitude and longitude coordinates.
 * Provides real-time validation and error messages.
 */

'use client';

import { useState, useCallback } from 'react';
import { validateLatitude, validateLongitude, validateCoordinates } from '@/lib/geo/validation';
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
  /** Whether to show in expanded state */
  expanded?: boolean;
}

interface ValidationState {
  lat: string | null;
  lng: string | null;
}

/**
 * ManualCoordinates provides precision coordinate input
 */
export function ManualCoordinates({
  initialLat,
  initialLng,
  onSubmit,
  className = '',
  expanded = false,
}: ManualCoordinatesProps) {
  const [isExpanded, setIsExpanded] = useState(expanded);
  const [latInput, setLatInput] = useState(initialLat?.toString() ?? '');
  const [lngInput, setLngInput] = useState(initialLng?.toString() ?? '');
  const [errors, setErrors] = useState<ValidationState>({ lat: null, lng: null });
  const [touched, setTouched] = useState({ lat: false, lng: false });

  // Validate latitude
  const validateLat = useCallback((value: string): string | null => {
    if (!value.trim()) {
      return 'Latitude is required';
    }
    const num = parseFloat(value);
    if (isNaN(num)) {
      return 'Must be a valid number';
    }
    const result = validateLatitude(num);
    if (!result.valid) {
      return result.error || 'Invalid latitude';
    }
    return null;
  }, []);

  // Validate longitude
  const validateLng = useCallback((value: string): string | null => {
    if (!value.trim()) {
      return 'Longitude is required';
    }
    const num = parseFloat(value);
    if (isNaN(num)) {
      return 'Must be a valid number';
    }
    const result = validateLongitude(num);
    if (!result.valid) {
      return result.error || 'Invalid longitude';
    }
    return null;
  }, []);

  // Handle latitude change
  const handleLatChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setLatInput(value);
      if (touched.lat) {
        setErrors((prev) => ({ ...prev, lat: validateLat(value) }));
      }
    },
    [touched.lat, validateLat]
  );

  // Handle longitude change
  const handleLngChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setLngInput(value);
      if (touched.lng) {
        setErrors((prev) => ({ ...prev, lng: validateLng(value) }));
      }
    },
    [touched.lng, validateLng]
  );

  // Handle blur for validation
  const handleLatBlur = useCallback(() => {
    setTouched((prev) => ({ ...prev, lat: true }));
    setErrors((prev) => ({ ...prev, lat: validateLat(latInput) }));
  }, [latInput, validateLat]);

  const handleLngBlur = useCallback(() => {
    setTouched((prev) => ({ ...prev, lng: true }));
    setErrors((prev) => ({ ...prev, lng: validateLng(lngInput) }));
  }, [lngInput, validateLng]);

  // Handle form submission
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      // Validate both fields
      const latError = validateLat(latInput);
      const lngError = validateLng(lngInput);
      setErrors({ lat: latError, lng: lngError });
      setTouched({ lat: true, lng: true });

      if (latError || lngError) {
        return;
      }

      const lat = parseFloat(latInput);
      const lng = parseFloat(lngInput);

      const coordResult = validateCoordinates(lat, lng);
      if (!coordResult.valid) {
        return;
      }

      // Submit the location
      onSubmit({
        lat,
        lng,
        name: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      });

      // Collapse after successful submission
      setIsExpanded(false);
    },
    [latInput, lngInput, validateLat, validateLng, onSubmit]
  );

  // Collapsed state - show toggle button
  if (!isExpanded) {
    return (
      <button
        type="button"
        onClick={() => setIsExpanded(true)}
        className={`
          w-full py-1.5 px-3 text-xs text-slate-500 dark:text-slate-400
          border border-dashed border-slate-300 dark:border-slate-600
          rounded-lg hover:border-slate-400 dark:hover:border-slate-500
          hover:text-slate-600 dark:hover:text-slate-300
          transition-colors
          ${className}
        `}
      >
        📍 Enter coordinates manually
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-medium text-slate-700 dark:text-slate-300">
          Manual Coordinates
        </h3>
        <button
          type="button"
          onClick={() => setIsExpanded(false)}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          aria-label="Close manual input"
        >
          ✕
        </button>
      </div>

      {/* Latitude input */}
      <div>
        <label
          htmlFor="manual-lat"
          className="block text-[10px] font-medium text-slate-600 dark:text-slate-400 mb-0.5"
        >
          Latitude
        </label>
        <input
          type="text"
          id="manual-lat"
          value={latInput}
          onChange={handleLatChange}
          onBlur={handleLatBlur}
          placeholder="e.g., 47.6062"
          inputMode="decimal"
          className={`
            w-full px-2 py-1.5 text-xs rounded-lg
            bg-white dark:bg-slate-800
            border ${
              errors.lat && touched.lat
                ? 'border-red-500'
                : 'border-slate-300 dark:border-slate-600'
            }
            focus:outline-none focus:ring-2 focus:ring-blue-500
            placeholder:text-slate-400
          `}
          aria-invalid={errors.lat && touched.lat ? 'true' : 'false'}
          aria-describedby={errors.lat ? 'lat-error' : undefined}
        />
        {errors.lat && touched.lat && (
          <p id="lat-error" className="mt-0.5 text-[10px] text-red-500">
            {errors.lat}
          </p>
        )}
        <p className="mt-0.5 text-[10px] text-slate-400">Range: -90 to 90 (positive = North)</p>
      </div>

      {/* Longitude input */}
      <div>
        <label
          htmlFor="manual-lng"
          className="block text-[10px] font-medium text-slate-600 dark:text-slate-400 mb-0.5"
        >
          Longitude
        </label>
        <input
          type="text"
          id="manual-lng"
          value={lngInput}
          onChange={handleLngChange}
          onBlur={handleLngBlur}
          placeholder="e.g., -122.3321"
          inputMode="decimal"
          className={`
            w-full px-2 py-1.5 text-xs rounded-lg
            bg-white dark:bg-slate-800
            border ${
              errors.lng && touched.lng
                ? 'border-red-500'
                : 'border-slate-300 dark:border-slate-600'
            }
            focus:outline-none focus:ring-2 focus:ring-blue-500
            placeholder:text-slate-400
          `}
          aria-invalid={errors.lng && touched.lng ? 'true' : 'false'}
          aria-describedby={errors.lng ? 'lng-error' : undefined}
        />
        {errors.lng && touched.lng && (
          <p id="lng-error" className="mt-0.5 text-[10px] text-red-500">
            {errors.lng}
          </p>
        )}
        <p className="mt-0.5 text-[10px] text-slate-400">Range: -180 to 180 (positive = East)</p>
      </div>

      {/* Submit button */}
      <button
        type="submit"
        className="
          w-full py-1.5 px-3 text-xs font-medium
          bg-blue-600 hover:bg-blue-700
          text-white rounded-lg
          transition-colors
          disabled:opacity-50 disabled:cursor-not-allowed
        "
      >
        Set Location
      </button>

      {/* Example locations */}
      <div className="text-[10px] text-slate-400">
        <p className="mb-0.5">Examples:</p>
        <ul className="space-y-0.5 ml-2">
          <li>• Seattle: 47.6062, -122.3321</li>
          <li>• Tokyo: 35.6762, 139.6503</li>
          <li>• Sydney: -33.8688, 151.2093</li>
        </ul>
      </div>
    </form>
  );
}
