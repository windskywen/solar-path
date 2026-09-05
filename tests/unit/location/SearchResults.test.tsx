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
  it('shows linked Geoapify attribution and neutral coordinate wording', () => {
    render(
      <SearchResults
        results={[result]}
        isLoading={false}
        query="Jieli"
        provider="geoapify"
        attribution="Powered by Geoapify"
        attributionUrl="https://www.geoapify.com/"
        onSelect={vi.fn()}
      />
    );

    expect(screen.getByRole('link', { name: 'Powered by Geoapify' })).toHaveAttribute(
      'href',
      'https://www.geoapify.com/'
    );
    expect(screen.getByRole('link', { name: /Open coordinates/i })).toHaveAttribute(
      'href',
      result.osmUrl
    );
    expect(screen.queryByText('OSM ↗')).not.toBeInTheDocument();
  });

  it('shows manual alternatives when both providers are unavailable', () => {
    render(
      <SearchResults
        results={[]}
        isLoading={false}
        query="Brisbane"
        provider="tomtom"
        attribution="Search data © TomTom"
        error="Address search is temporarily unavailable."
        onSelect={vi.fn()}
      />
    );

    expect(
      screen.getByText('Address search is temporarily unavailable.')
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
        provider="geoapify"
        attribution="Powered by Geoapify"
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

  it.each([
    ['介禮街20號, 花蓮市, 花蓮縣', '介禮街'],
    ['20 Jieli Street, Hualien City', 'Jieli'],
    ['東京都千代田区丸の内', '千代田区'],
    ['서울특별시 중구 세종대로', '서울특별시'],
    ['شارع الشيخ زايد، دبي', 'الشيخ'],
    ['Taipei 台北 101', 'Taipei 台北'],
  ])('renders provider displayName unchanged for "%s"', (displayName, query) => {
    render(
      <SearchResults
        results={[{ ...result, id: displayName, displayName }]}
        isLoading={false}
        query={query}
        provider="tomtom"
        attribution="Search data © TomTom"
        onSelect={vi.fn()}
      />
    );

    expect(screen.getByRole('button')).toHaveTextContent(displayName);
  });
});
