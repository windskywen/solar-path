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
      <mark key={i} className="bg-primary/10 text-primary font-medium rounded px-0.5">
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
      className="group w-full px-3 py-2 text-left transition-colors hover:bg-white/[0.05] focus:bg-white/[0.05] focus:outline-none"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="truncate text-xs text-slate-100">
            {highlightMatch(result.displayName, query)}
          </p>
          <p className="mt-0.5 font-mono text-[10px] text-slate-500">
            {result.lat.toFixed(4)}°, {result.lng.toFixed(4)}°
          </p>
        </div>
        <a
          href={result.osmUrl}
          onClick={handleOsmClick}
          className="flex-shrink-0 text-[10px] text-sky-200 opacity-0 underline transition-opacity hover:text-white group-hover:opacity-100 focus:opacity-100"
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
    <div className="space-y-2 p-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="animate-pulse space-y-1">
          <div className="h-3 w-3/4 rounded bg-white/[0.08]" />
          <div className="h-2 w-1/3 rounded bg-white/[0.06]" />
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
      <p className="text-xs text-slate-300">No results found for &ldquo;{query}&rdquo;</p>
      <p className="mt-0.5 text-[10px] text-slate-500">Try a different search term</p>
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
        className={`absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-[22px] border border-white/10 bg-[rgba(5,10,20,0.94)] shadow-[0_24px_60px_rgba(2,6,23,0.45)] backdrop-blur-2xl ${className}`}
      >
        <LoadingSkeleton />
      </div>
    );
  }

  // Show empty state
  if (results.length === 0) {
    return (
      <div
        className={`absolute left-0 right-0 top-full z-50 mt-2 rounded-[22px] border border-white/10 bg-[rgba(5,10,20,0.94)] shadow-[0_24px_60px_rgba(2,6,23,0.45)] backdrop-blur-2xl ${className}`}
      >
        <NoResults query={query} />
      </div>
    );
  }

  // Show results
  return (
    <div
      className={`absolute left-0 right-0 top-full z-50 mt-2 max-h-64 overflow-y-auto overflow-hidden rounded-[22px] border border-white/10 bg-[rgba(5,10,20,0.94)] shadow-[0_24px_60px_rgba(2,6,23,0.45)] backdrop-blur-2xl ${className}`}
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
      <div className="border-t border-white/10 px-3 py-2 text-xs text-slate-500">
        Data from OpenStreetMap contributors
      </div>
    </div>
  );
}
