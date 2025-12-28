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
    <div className={`space-y-2 ${className}`}>
      <div className="grid grid-cols-2 gap-4">
        {/* Left: Manual Coordinates */}
        <div>
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

        {/* Right: Search + GPS */}
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            Search Location
          </label>
          <div className="flex gap-2">
            {/* Search Input */}
            <div className="relative flex-1" ref={searchContainerRef}>
              <input
                type="text"
                value={query}
                onChange={handleSearchChange}
                onFocus={handleSearchFocus}
                onKeyDown={handleKeyDown}
                placeholder="City, address..."
                className="w-full px-3 py-2 pl-9 bg-background 
                           border border-input
                           text-foreground text-sm
                           rounded-lg focus:outline-none focus:ring-2 focus:ring-ring
                           placeholder:text-muted-foreground"
                aria-label="Search for a location"
                aria-expanded={isSearchOpen}
                aria-haspopup="listbox"
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
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
                  className="animate-spin absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary"
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
              className="flex items-center justify-center px-4 py-2 
                         bg-secondary 
                         text-secondary-foreground 
                         hover:bg-secondary/80 
                         border border-border
                         rounded-lg transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed"
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
      </div>

      {/* Error Messages */}
      {(gpsError || searchError || error) && (
        <div className="p-2 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-xs text-destructive">{gpsError || searchError || error}</p>
        </div>
      )}

      {/* Current Location Display */}
      {location && (
        <div className="p-2 bg-card rounded-lg border border-border" data-testid="location-display">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0" />
            <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-medium text-foreground truncate">
                  {location.name || 'Selected Location'}
                </p>
                <p className="text-[10px] text-muted-foreground font-mono">
                  {location.lat.toFixed(4)}°, {location.lng.toFixed(4)}°
                </p>
              </div>
              {/* OSM Verification Link */}
              {location.osmUrl && (
                <a
                  href={location.osmUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary"
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
