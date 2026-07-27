import { describe, expect, it } from 'vitest';
import {
  buildCoordinateUrl,
  convertTomTomResult,
  convertTomTomResults,
  normalizeTomTomLanguage,
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

describe('TomTom language normalization', () => {
  it.each([
    ['zh-Hant-TW', 'zh-TW'],
    ['zh-CN', 'zh-CN'],
    ['en-AU', 'en-AU'],
    ['en-CA', 'en-US'],
    ['fr-CA,fr;q=0.9', 'fr-CA'],
    ['pt-BR', 'pt-BR'],
  ])('normalizes %s to %s', (input, expected) => {
    expect(normalizeTomTomLanguage(input)).toBe(expected);
  });

  it('omits unsupported browser languages so TomTom can infer from the query', () => {
    expect(normalizeTomTomLanguage('ja-JP')).toBeUndefined();
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
