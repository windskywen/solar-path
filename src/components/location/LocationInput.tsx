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
   * Uses browser geolocation API with fallback
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

    navigator.geolocation.getCurrentPosition(
      // Success callback
      (position) => {
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
      },
      // Error callback
      (err) => {
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
      },
      // Options
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000, // Cache position for 1 minute
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
    <div className={`space-y-4 ${className}`}>
      {/* Manual Coordinates Input - Primary Method */}
      <ManualCoordinates
        initialLat={location?.lat}
        initialLng={location?.lng}
        onSubmit={(newLocation) => {
          setLocation(newLocation);
          setError(null);
          setGpsError(null);
          clearSearch();
        }}
      />

      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-slate-200 dark:border-slate-700" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white dark:bg-slate-900 px-2 text-[10px] text-slate-400 uppercase">
            Or search
          </span>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative" ref={searchContainerRef}>
        <input
          type="text"
          value={query}
          onChange={handleSearchChange}
          onFocus={handleSearchFocus}
          onKeyDown={handleKeyDown}
          placeholder="Search location..."
          className="w-full px-3 py-1.5 pl-9 bg-white dark:bg-slate-700 
                     border border-slate-300 dark:border-slate-600
                     text-slate-900 dark:text-white text-sm
                     rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500
                     placeholder:text-slate-400"
          aria-label="Search for a location"
          aria-expanded={isSearchOpen}
          aria-haspopup="listbox"
        />
        <svg
          className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
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
            className="animate-spin absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500"
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
          />
        )}
      </div>

      {/* GPS Button */}
      <button
        onClick={handleUseGps}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 px-3 py-1.5 
                   bg-blue-50 dark:bg-blue-900/20 
                   text-blue-600 dark:text-blue-400 
                   hover:bg-blue-100 dark:hover:bg-blue-900/40 
                   border border-blue-200 dark:border-blue-800
                   rounded-lg transition-colors text-sm font-medium
                   disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Use current GPS location"
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin h-4 w-4"
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
            <span>Locating...</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <span>Use My GPS</span>
          </>
        )}
      </button>

      {/* GPS Error Message */}
      {gpsError && (
        <div className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-xs text-red-600 dark:text-red-400">{gpsError}</p>
        </div>
      )}

      {/* Search Error Message */}
      {searchError && (
        <div className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-xs text-red-600 dark:text-red-400">{searchError}</p>
        </div>
      )}

      {/* Store Error Message */}
      {error && (
        <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-xs text-yellow-600 dark:text-yellow-400">{error}</p>
        </div>
      )}

      {/* Current Location Display */}
      {location && (
        <div
          className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg"
          data-testid="location-display"
        >
          <div className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 mt-1.5 bg-blue-500 rounded-full flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-900 dark:text-white truncate">
                {location.name || 'Selected Location'}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                {location.lat.toFixed(4)}°, {location.lng.toFixed(4)}°
              </p>
              {/* OSM Verification Link */}
              {location.osmUrl && (
                <a
                  href={location.osmUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 
                           hover:text-blue-800 dark:hover:text-blue-300 mt-0.5"
                >
                  Verify on OpenStreetMap
                  <svg
                    className="w-2.5 h-2.5"
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
