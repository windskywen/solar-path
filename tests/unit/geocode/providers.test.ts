import { describe, expect, it } from 'vitest';
import {
  buildCoordinateUrl,
  convertGeoapifyResult,
  convertGeoapifyResults,
  convertTomTomResult,
  convertTomTomResults,
} from '@/lib/geocode/providers';
import {
  isGeocodeQueryEligible,
  minimumGeocodeQueryLength,
} from '@/hooks/useGeocode';

describe('TomTom geocode provider conversion', () => {
  it.each([
    ['Point Address', undefined, '20 Jieli Street, Hualien City, Hualien County'],
    ['Street', undefined, 'Jieli Street, Hualien City'],
    ['Geography', 'Municipality', 'Hualien City, Taiwan'],
  ])('converts %s results to the shared shape', (type, entityType, freeformAddress) => {
    const result = convertTomTomResult({
      type,
      entityType,
      id: `${type}-id`,
      address: { freeformAddress },
      position: { lat: 23.991, lon: 121.611 },
    });

    expect(result).toMatchObject({
      id: `${type}-id`,
      displayName: freeformAddress,
      lat: 23.991,
      lng: 121.611,
    });
    expect(result?.resultType).toContain(type);
    expect(result?.osmUrl).toContain('mlat=23.991');
  });

  it('combines a POI name with its address', () => {
    const result = convertTomTomResult({
      type: 'POI',
      id: 'poi-1',
      poi: { name: 'Taipei 101' },
      address: { freeformAddress: 'No. 7, Section 5, Xinyi Road, Taipei' },
      position: { lat: 25.0339, lon: 121.5645 },
    });

    expect(result?.displayName).toBe(
      'Taipei 101, No. 7, Section 5, Xinyi Road, Taipei'
    );
    expect(result?.resultType).toBe('POI');
  });

  it('filters results without valid coordinates', () => {
    const results = convertTomTomResults({
      results: [
        {
          type: 'Street',
          id: 'valid',
          address: { freeformAddress: 'Valid Street' },
          position: { lat: -27.47, lon: 153.02 },
        },
        {
          type: 'Street',
          id: 'invalid',
          address: { freeformAddress: 'Invalid Street' },
        },
      ],
    });

    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('valid');
  });

  it('creates a neutral coordinate link for TomTom results', () => {
    expect(buildCoordinateUrl(23.991, 121.611)).toBe(
      'https://www.openstreetmap.org/?mlat=23.991&mlon=121.611#map=18/23.991/121.611'
    );
  });
});

describe('Geoapify geocode provider conversion', () => {
  it('converts a formatted result to the shared shape', () => {
    const result = convertGeoapifyResult({
      place_id: 'geo-place-1',
      formatted: 'Queen Street, Brisbane QLD, Australia',
      result_type: 'street',
      lat: -27.4698,
      lon: 153.0251,
    });

    expect(result).toMatchObject({
      id: 'geo-place-1',
      displayName: 'Queen Street, Brisbane QLD, Australia',
      resultType: 'street',
      lat: -27.4698,
      lng: 153.0251,
    });
    expect(result?.osmUrl).toContain('mlat=-27.4698');
  });

  it('filters Geoapify results without valid coordinates', () => {
    const results = convertGeoapifyResults({
      results: [
        { place_id: 'valid', formatted: 'Valid', lat: 1, lon: 2 },
        { place_id: 'missing', formatted: 'Missing coordinates' },
      ],
    });

    expect(results.map((result) => result.id)).toEqual(['valid']);
  });
});

describe('autocomplete query thresholds', () => {
  it('searches CJK input after two characters', () => {
    expect(minimumGeocodeQueryLength('介禮')).toBe(2);
    expect(isGeocodeQueryEligible('介禮')).toBe(true);
    expect(isGeocodeQueryEligible('介')).toBe(false);
  });

  it('requires three characters for non-CJK input', () => {
    expect(minimumGeocodeQueryLength('Pa')).toBe(3);
    expect(isGeocodeQueryEligible('Pa')).toBe(false);
    expect(isGeocodeQueryEligible('Par')).toBe(true);
  });
});
