/**
 * SearchResults Component
 *
 * Dropdown component displaying geocoding search results.
 * Shows display name and OSM verification link for each result.
 *
 * @see FR-004: OSM verification link requirement
 */

'use client';

import { memo } from 'react';
import type { LocationPoint } from '@/types/solar';
import type { GeocodeResult } from '@/hooks/useGeocode';

export interface SearchResultsProps {
  /** Search results to display */
  results: GeocodeResult[];
  /** Whether results are loading */
  isLoading: boolean;
  /** Current search query (for highlighting) */
  query: string;
  /** Callback when a result is selected */
  onSelect: (location: LocationPoint) => void;
  /** Callback when OSM link is clicked */
  onOsmClick?: (osmUrl: string) => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Highlight matching text in display name
 */
function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;

  const parts = text.split(new RegExp(`(${query})`, 'gi'));

  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={i} className="bg-amber-200 dark:bg-amber-800 text-inherit rounded px-0.5">
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
  onOsmClick,
}: {
  result: GeocodeResult;
  query: string;
  onSelect: (location: LocationPoint) => void;
  onOsmClick?: (osmUrl: string) => void;
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

  const handleOsmClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onOsmClick) {
      onOsmClick(result.osmUrl);
    } else {
      window.open(result.osmUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <button
      type="button"
      onClick={handleSelect}
      className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 
                 focus:bg-slate-100 dark:focus:bg-slate-700 focus:outline-none
                 transition-colors group"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-slate-900 dark:text-white truncate">
            {highlightMatch(result.displayName, query)}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
            {result.lat.toFixed(4)}°, {result.lng.toFixed(4)}°
          </p>
        </div>
        <a
          href={result.osmUrl}
          onClick={handleOsmClick}
          className="flex-shrink-0 text-xs text-blue-600 dark:text-blue-400 
                     hover:text-blue-800 dark:hover:text-blue-300
                     opacity-0 group-hover:opacity-100 transition-opacity
                     underline focus:opacity-100"
          title="Verify on OpenStreetMap"
        >
          OSM ↗
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
    <div className="p-3 space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="animate-pulse space-y-1.5">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
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
      <p className="text-sm text-slate-500 dark:text-slate-400">
        No results found for &ldquo;{query}&rdquo;
      </p>
      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
        Try a different search term
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
  onSelect,
  onOsmClick,
  className = '',
}: SearchResultsProps) {
  // Don't show anything if no query
  if (!query.trim()) {
    return null;
  }

  // Show loading state
  if (isLoading) {
    return (
      <div
        className={`absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 
                    rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 
                    z-50 overflow-hidden ${className}`}
      >
        <LoadingSkeleton />
      </div>
    );
  }

  // Show empty state
  if (results.length === 0) {
    return (
      <div
        className={`absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 
                    rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 
                    z-50 ${className}`}
      >
        <NoResults query={query} />
      </div>
    );
  }

  // Show results
  return (
    <div
      className={`absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 
                  rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 
                  z-50 overflow-hidden max-h-64 overflow-y-auto ${className}`}
      role="listbox"
      aria-label="Search results"
    >
      {results.map((result) => (
        <SearchResultItem
          key={result.osmUrl}
          result={result}
          query={query}
          onSelect={onSelect}
          onOsmClick={onOsmClick}
        />
      ))}
      <div className="px-3 py-2 text-xs text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-700">
        Data from OpenStreetMap contributors
      </div>
    </div>
  );
}
