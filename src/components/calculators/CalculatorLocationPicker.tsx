'use client';

import { useEffect, useRef, useState } from 'react';
import { useGeocode } from '@/hooks/useGeocode';
import { SearchResults } from '@/components/location/SearchResults';
import { ManualCoordinates } from '@/components/location/ManualCoordinates';
import type { LocationPoint } from '@/types/solar';

interface CalculatorLocationPickerProps {
  value: LocationPoint;
  onChange: (location: LocationPoint) => void;
}

export function CalculatorLocationPicker({ value, onChange }: CalculatorLocationPickerProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    query,
    setQuery,
    results,
    provider,
    attribution,
    attributionUrl,
    isLoading,
    error,
    submitSearch,
    clear,
    canSearch,
  } = useGeocode({ limit: 5, bias: { lat: value.lat, lng: value.lng } });

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, []);

  const selectLocation = (location: LocationPoint) => {
    onChange(location);
    clear();
    setIsSearchOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-[22px] border p-4 [border-color:var(--solar-surface-border)] [background:var(--solar-surface-bg)]">
          <label htmlFor="calculator-location-search" className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--solar-text-muted)]">
            Search location
          </label>
          <p className="mt-2 text-xs text-[var(--solar-text-faint)]">Search by address, place, district, or city.</p>
          <div ref={containerRef} className="mt-3 flex gap-2">
            <div className="relative min-w-0 flex-1">
              <input
                id="calculator-location-search"
                type="text"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setIsSearchOpen(true);
                }}
                onFocus={() => setIsSearchOpen(query.length > 0)}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') setIsSearchOpen(false);
                  if (event.key === 'Enter' && canSearch) {
                    event.preventDefault();
                    setIsSearchOpen(true);
                    void submitSearch();
                  }
                }}
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={isSearchOpen && canSearch}
                aria-controls="calculator-search-results"
                autoComplete="off"
                placeholder="Brisbane, Queen Street, or a landmark"
                className="h-11 w-full rounded-2xl border px-3 text-sm text-[var(--solar-text-strong)] [border-color:var(--solar-input-border)] [background:var(--solar-input-bg)] outline-none placeholder:text-[var(--solar-input-placeholder)] focus:ring-2 focus:ring-[var(--solar-input-focus-ring)]"
              />
              {isSearchOpen && canSearch ? (
                <SearchResults
                  results={results}
                  isLoading={isLoading}
                  query={query}
                  provider={provider}
                  attribution={attribution}
                  attributionUrl={attributionUrl}
                  error={error}
                  onSelect={selectLocation}
                  listboxId="calculator-search-results"
                  unavailableGuidance="Or enter coordinates manually below."
                />
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => {
                setIsSearchOpen(true);
                void submitSearch();
              }}
              disabled={!canSearch || isLoading}
              className="h-11 flex-shrink-0 rounded-2xl border px-4 text-sm font-semibold text-[var(--solar-button-text)] [border-color:var(--solar-button-border)] [background:var(--solar-button-bg)] transition-colors hover:[background:var(--solar-button-hover-bg)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Search
            </button>
          </div>
        </div>

        <div className="rounded-[22px] border p-4 [border-color:var(--solar-surface-border)] [background:var(--solar-surface-bg)]">
          <ManualCoordinates
            initialLat={value.lat}
            initialLng={value.lng}
            onSubmit={selectLocation}
          />
        </div>
      </div>

      <div className="rounded-[20px] border px-4 py-3 [border-color:var(--solar-surface-border)] [background:var(--solar-surface-soft-bg)]">
        <p className="text-sm font-semibold text-[var(--solar-text-strong)]">{value.name ?? 'Selected location'}</p>
        <p className="mt-1 font-mono text-xs text-[var(--solar-text-muted)]">
          {value.lat.toFixed(4)}°, {value.lng.toFixed(4)}°
        </p>
      </div>
    </div>
  );
}
