'use client';

/**
 * LocationInput Component
 *
 * Provides location input via:
 * - GPS button (browser geolocation)
 * - Search input (geocoding with debounced search)
 * - Display of current coordinates with OSM verification link
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useLocation, useIsLoadingLocation, useError, useSolarActions } from '@/store/solar-store';
import { useGeocode } from '@/hooks/useGeocode';
import { SearchResults } from './SearchResults';
import { ManualCoordinates } from './ManualCoordinates';
import type { LocationPoint } from '@/types/solar';

export interface LocationInputProps {
  /** Additional CSS classes */
  className?: string;
}

/**
 * LocationInput provides GPS and search functionality for setting location
 */
export function LocationInput({ className = '' }: LocationInputProps) {
  const location = useLocation();
  const isLoading = useIsLoadingLocation();
  const error = useError();
  const { setLocation, setIsLoadingLocation, setError } = useSolarActions();
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Geocoding hook with debouncing
  const {
    query,
    setQuery,
    results,
    isLoading: isSearching,
    error: searchError,
    clear: clearSearch,
  } = useGeocode({ limit: 5 });

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /**
   * Handle GPS button click
   * Uses browser geolocation API with two-phase approach:
   * 1. First try fast low-accuracy (WiFi/cell) with short timeout
   * 2. If that fails, fall back to high-accuracy GPS with longer timeout
   * This prevents timeout errors on first click while still getting good accuracy
   */
  const handleUseGps = useCallback(() => {
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser');
      return;
    }

    // Clear previous errors
    setGpsError(null);
    setError(null);
    setIsLoadingLocation(true);

    // Success callback - used for both phases
    const onSuccess = (position: GeolocationPosition) => {
      const { latitude, longitude, accuracy } = position.coords;

      // Round to 6 decimal places
      const roundedLat = Math.round(latitude * 1000000) / 1000000;
      const roundedLng = Math.round(longitude * 1000000) / 1000000;

      setLocation({
        lat: roundedLat,
        lng: roundedLng,
        name: `GPS Location${accuracy ? ` (±${Math.round(accuracy)}m)` : ''}`,
        source: 'gps',
      });
      setIsLoadingLocation(false);
    };

    // Error handler factory - creates error callback with optional fallback
    const createErrorHandler =
      (fallbackToHighAccuracy: boolean) => (err: GeolocationPositionError) => {
        // If low-accuracy failed due to timeout/unavailable, try high-accuracy as fallback
        if (
          fallbackToHighAccuracy &&
          (err.code === err.TIMEOUT || err.code === err.POSITION_UNAVAILABLE)
        ) {
          navigator.geolocation.getCurrentPosition(
            onSuccess,
            createErrorHandler(false), // No more fallbacks
            {
              enableHighAccuracy: true,
              timeout: 30000, // Give GPS more time to acquire satellites
              maximumAge: 60000,
            }
          );
          return;
        }

        // Final error - no more fallbacks
        setIsLoadingLocation(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setGpsError('Location access denied. Please enable location permissions.');
            break;
          case err.POSITION_UNAVAILABLE:
            setGpsError('Location unavailable. Please try again.');
            break;
          case err.TIMEOUT:
            setGpsError('Location request timed out. Please try again.');
            break;
          default:
            setGpsError('Failed to get location. Please try again.');
        }
      };

    // Phase 1: Try fast low-accuracy first (uses WiFi/cell towers, usually instant)
    // This works better on first click when GPS hasn't warmed up
    navigator.geolocation.getCurrentPosition(
      onSuccess,
      createErrorHandler(true), // Will fallback to high-accuracy on failure
      {
        enableHighAccuracy: false, // Start with low accuracy for speed
        timeout: 10000,
        maximumAge: 60000, // Accept cached position up to 1 minute old
      }
    );
  }, [setLocation, setIsLoadingLocation, setError]);

  /**
   * Handle search result selection
   */
  const handleSelectLocation = useCallback(
    (selectedLocation: LocationPoint) => {
      setLocation(selectedLocation);
      clearSearch();
      setIsSearchOpen(false);
    },
    [setLocation, clearSearch]
  );

  /**
   * Handle search input changes
   */
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setIsSearchOpen(true);
  };

  /**
   * Handle search input focus
   */
  const handleSearchFocus = () => {
    if (query.length > 0) {
      setIsSearchOpen(true);
    }
  };

  /**
   * Handle keyboard navigation
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsSearchOpen(false);
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1.32fr)_minmax(0,0.88fr)] md:gap-4">
        {/* Primary: Search + GPS */}
        <div className="rounded-[22px] border border-sky-300/10 bg-slate-950/42 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] sm:p-4">
          <label className="mb-2 block text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-slate-400">
            Search Location
          </label>
          <p className="mb-3 text-xs text-slate-500">
            Search by address, district, landmark, or city name.
          </p>
          <div className="flex gap-2">
            {/* Search Input */}
            <div className="relative min-w-0 flex-1" ref={searchContainerRef}>
              <input
                type="text"
                value={query}
                onChange={handleSearchChange}
                onFocus={handleSearchFocus}
                onKeyDown={handleKeyDown}
                placeholder="Search address or city..."
                autoComplete="off"
                role="combobox"
                aria-autocomplete="list"
                aria-controls="search-location-results"
                aria-expanded={isSearchOpen && query.length >= 2}
                className="h-12 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-3 py-2 pl-10 text-sm text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-all outline-none placeholder:text-slate-500 focus:border-sky-300/35 focus:ring-2 focus:ring-sky-300/20"
                aria-label="Search for a location"
                aria-haspopup="listbox"
              />
              <svg
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              {isSearching && (
                <svg
                  className="animate-spin absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sky-300"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              )}

              {/* Search Results Dropdown */}
              {isSearchOpen && query.length >= 2 && (
                <SearchResults
                  results={results}
                  isLoading={isSearching}
                  query={query}
                  onSelect={handleSelectLocation}
                  listboxId="search-location-results"
                />
              )}
            </div>

            {/* GPS Button */}
            <button
              type="button"
              onClick={handleUseGps}
              disabled={isLoading}
              className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:border-sky-300/30 hover:bg-sky-400/12 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Use current GPS location"
              title="Use current GPS location"
            >
              {isLoading ? (
                <svg
                  className="animate-spin h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  data-testid="gps-loading"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Secondary: Manual Coordinates */}
        <div className="rounded-[22px] border border-white/10 bg-slate-950/35 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <ManualCoordinates
            initialLat={location?.lat}
            initialLng={location?.lng}
            onSubmit={(newLocation) => {
              setLocation(newLocation);
              setError(null);
              setGpsError(null);
              clearSearch();
            }}
            className="w-full"
          />
        </div>
      </div>

      {/* Error Messages */}
      {(gpsError || searchError || error) && (
        <div className="rounded-2xl border border-rose-300/18 bg-rose-500/12 p-3">
          <p className="text-xs text-rose-100">{gpsError || searchError || error}</p>
        </div>
      )}

      {/* Current Location Display */}
      {location && (
        <div
          className="rounded-[22px] border border-white/10 bg-white/[0.05] p-3 shadow-[0_16px_40px_rgba(2,6,23,0.16)] backdrop-blur-xl"
          data-testid="location-display"
        >
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-sky-300 shadow-[0_0_12px_rgba(125,211,252,0.9)]" />
            <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-white">
                  {location.name || 'Selected Location'}
                </p>
                <p className="font-mono text-[10px] text-slate-400">
                  {location.lat.toFixed(4)}°, {location.lng.toFixed(4)}°
                </p>
              </div>
              {/* OSM Verification Link */}
              {location.osmUrl && (
                <a
                  href={location.osmUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 transition-colors hover:text-sky-100"
                  title="Verify on OpenStreetMap"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
