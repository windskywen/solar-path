/**
 * SearchResults Component
 *
 * Dropdown component displaying geocoding search results.
 * Shows provider attribution and a neutral coordinate link for each result.
 */

'use client';

import { memo } from 'react';
import type { LocationPoint } from '@/types/solar';
import type { GeocodeProvider, GeocodeResult } from '@/lib/geocode/providers';

export interface SearchResultsProps {
  /** Search results to display */
  results: GeocodeResult[];
  /** Whether results are loading */
  isLoading: boolean;
  /** Current search query (for highlighting) */
  query: string;
  /** Provider used for the active result set */
  provider: GeocodeProvider | null;
  /** Provider-required attribution */
  attribution: string;
  /** Search error shown inside the dropdown */
  error?: string | null;
  /** Whether Enter can trigger the one-off fallback */
  fallbackAvailable?: boolean;
  /** Callback when a result is selected */
  onSelect: (location: LocationPoint) => void;
  /** Callback when the coordinate link is clicked */
  onCoordinateClick?: (coordinateUrl: string) => void;
  /** Additional CSS classes */
  className?: string;
  /** Optional id for the listbox element */
  listboxId?: string;
}

/**
 * Highlight matching text in display name
 */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;

  const parts = text.split(new RegExp(`(${escapeRegExp(query)})`, 'gi'));

  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark
        key={i}
        className="rounded-md border px-1 py-0.5 font-semibold [background:var(--solar-highlight-bg)] [border-color:var(--solar-highlight-border)] text-[var(--solar-highlight-text)] [box-shadow:var(--solar-highlight-shadow)]"
      >
        {part}
      </mark>
    ) : (
      part
    )
  );
}

/**
 * Single search result item
 */
const SearchResultItem = memo(function SearchResultItem({
  result,
  query,
  onSelect,
  onCoordinateClick,
}: {
  result: GeocodeResult;
  query: string;
  onSelect: (location: LocationPoint) => void;
  onCoordinateClick?: (coordinateUrl: string) => void;
}) {
  const handleSelect = () => {
    onSelect({
      lat: result.lat,
      lng: result.lng,
      name: result.displayName,
      osmUrl: result.osmUrl,
      source: 'search',
    });
  };

  const handleCoordinateClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onCoordinateClick) {
      onCoordinateClick(result.osmUrl);
    } else {
      window.open(result.osmUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <button
      type="button"
      onClick={handleSelect}
      className="group w-full px-3 py-2.5 text-left transition-colors hover:bg-[var(--solar-row-hover)] focus:bg-[var(--solar-row-hover)] focus:outline-none"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="truncate text-xs leading-5 text-[var(--solar-text-strong)]">
            {highlightMatch(result.displayName, query)}
          </p>
          <p className="mt-1 font-mono text-[10px] text-[var(--solar-text-muted)]">
            {result.lat.toFixed(4)}°, {result.lng.toFixed(4)}°
          </p>
        </div>
        <a
          href={result.osmUrl}
          onClick={handleCoordinateClick}
          className="flex-shrink-0 text-[10px] text-[var(--solar-accent)] underline transition-opacity hover:text-[var(--solar-text-strong)] sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
          title="Open coordinates"
        >
          Open coordinates ↗
        </a>
      </div>
    </button>
  );
});

/**
 * Loading skeleton for search results
 */
function LoadingSkeleton() {
  return (
    <div className="space-y-2 p-3">
      {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse space-y-1">
            <div className="h-3 w-3/4 rounded [background-color:var(--solar-divider)]" />
            <div className="h-2 w-1/3 rounded [background-color:var(--solar-divider)]" />
          </div>
        ))}
    </div>
  );
}

/**
 * Empty state when no results found
 */
function NoResults({ query }: { query: string }) {
  return (
    <div className="p-4 text-center">
      <p className="text-xs text-[var(--solar-text)]">No results found for &ldquo;{query}&rdquo;</p>
      <p className="mt-0.5 text-[10px] text-[var(--solar-text-faint)]">Try a different search term</p>
    </div>
  );
}

function ProviderUnavailable({ message }: { message: string }) {
  return (
    <div className="p-4 text-center" role="status">
      <p className="text-xs font-medium text-[var(--solar-text-strong)]">{message}</p>
      <p className="mt-1 text-[10px] text-[var(--solar-text-faint)]">
        Or use GPS or enter coordinates manually.
      </p>
    </div>
  );
}

/**
 * SearchResults component
 */
export function SearchResults({
  results,
  isLoading,
  query,
  provider,
  attribution,
  error,
  fallbackAvailable = false,
  onSelect,
  onCoordinateClick,
  className = '',
  listboxId,
}: SearchResultsProps) {
  // Don't show anything if no query
  if (!query.trim()) {
    return null;
  }

  // Show loading state
  if (isLoading) {
    return (
      <div
        className={`absolute left-0 right-0 top-full z-[80] mt-2 overflow-hidden rounded-[22px] border [border-color:var(--solar-dropdown-border)] [background:var(--solar-dropdown-bg)] [box-shadow:var(--solar-dropdown-shadow)] backdrop-blur-2xl ${className}`}
      >
        <LoadingSkeleton />
      </div>
    );
  }

  if (error && (fallbackAvailable || results.length === 0)) {
    return (
      <div
        className={`absolute left-0 right-0 top-full z-[80] mt-2 rounded-[22px] border [border-color:var(--solar-dropdown-border)] [background:var(--solar-dropdown-bg)] [box-shadow:var(--solar-dropdown-shadow)] backdrop-blur-2xl ${className}`}
      >
        <ProviderUnavailable message={error} />
      </div>
    );
  }

  // Show empty state
  if (results.length === 0) {
    return (
      <div
        className={`absolute left-0 right-0 top-full z-[80] mt-2 rounded-[22px] border [border-color:var(--solar-dropdown-border)] [background:var(--solar-dropdown-bg)] [box-shadow:var(--solar-dropdown-shadow)] backdrop-blur-2xl ${className}`}
      >
        <NoResults query={query} />
      </div>
    );
  }

  // Show results
  return (
    <div
      id={listboxId}
      className={`absolute left-0 right-0 top-full z-[80] mt-2 max-h-72 overflow-y-auto overflow-hidden rounded-[22px] border [border-color:var(--solar-dropdown-border)] [background:var(--solar-dropdown-bg)] [box-shadow:var(--solar-dropdown-shadow)] backdrop-blur-2xl ${className}`}
      role="listbox"
      aria-label="Search results"
    >
      {results.map((result) => (
        <SearchResultItem
          key={result.id}
          result={result}
          query={query}
          onSelect={onSelect}
          onCoordinateClick={onCoordinateClick}
        />
      ))}
      <div className="border-t [border-color:var(--solar-divider)] px-3 py-2 text-xs text-[var(--solar-text-muted)]">
        {attribution || (provider === 'tomtom' ? 'Search data © TomTom' : '© OpenStreetMap contributors')}
      </div>
    </div>
  );
}
