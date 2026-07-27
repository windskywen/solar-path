import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SearchResults } from '@/components/location/SearchResults';

const result = {
  id: 'result-1',
  displayName: '20 Jieli Street, Hualien City',
  lat: 23.991,
  lng: 121.611,
  resultType: 'Point Address',
  osmUrl:
    'https://www.openstreetmap.org/?mlat=23.991&mlon=121.611#map=18/23.991/121.611',
};

describe('SearchResults', () => {
  it('shows TomTom attribution and neutral coordinate wording', () => {
    render(
      <SearchResults
        results={[result]}
        isLoading={false}
        query="Jieli"
        provider="tomtom"
        attribution="Search data © TomTom"
        onSelect={vi.fn()}
      />
    );

    expect(screen.getByText('Search data © TomTom')).toBeVisible();
    expect(screen.getByRole('link', { name: /Open coordinates/i })).toHaveAttribute(
      'href',
      result.osmUrl
    );
    expect(screen.queryByText('OSM ↗')).not.toBeInTheDocument();
  });

  it('shows the explicit Enter fallback prompt on provider failure', () => {
    render(
      <SearchResults
        results={[]}
        isLoading={false}
        query="Brisbane"
        provider="tomtom"
        attribution="Search data © TomTom"
        error="Autocomplete unavailable — press Enter to search"
        fallbackAvailable
        onSelect={vi.fn()}
      />
    );

    expect(
      screen.getByText('Autocomplete unavailable — press Enter to search')
    ).toBeVisible();
    expect(screen.getByText(/GPS or enter coordinates manually/i)).toBeVisible();
  });

  it('passes the selected coordinates through the existing LocationPoint contract', () => {
    const onSelect = vi.fn();
    render(
      <SearchResults
        results={[result]}
        isLoading={false}
        query="Jieli"
        provider="nominatim"
        attribution="© OpenStreetMap contributors"
        onSelect={onSelect}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /20 Jieli Street/i }));
    expect(onSelect).toHaveBeenCalledWith({
      lat: 23.991,
      lng: 121.611,
      name: '20 Jieli Street, Hualien City',
      osmUrl: result.osmUrl,
      source: 'search',
    });
  });
});
