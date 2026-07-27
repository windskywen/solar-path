export type GeocodeProvider = 'tomtom' | 'nominatim';

export interface GeocodeResult {
  id: string;
  displayName: string;
  lat: number;
  lng: number;
  resultType: string;
  osmUrl: string;
}

export interface GeocodeResponse {
  provider: GeocodeProvider;
  attribution: string;
  fallbackAvailable: boolean;
  results: GeocodeResult[];
  error?: string;
  code?: GeocodeErrorCode;
  retryAfter?: number;
}

export type GeocodeErrorCode =
  | 'INVALID_QUERY'
  | 'INVALID_LIMIT'
  | 'INVALID_MODE'
  | 'INVALID_BIAS'
  | 'RATE_LIMITED'
  | 'PROVIDER_UNAVAILABLE'
  | 'UPSTREAM_ERROR';

export interface TomTomSearchResult {
  type: string;
  id?: string;
  entityType?: string;
  poi?: {
    name?: string;
  };
  address?: {
    streetNumber?: string;
    streetName?: string;
    municipalitySubdivision?: string;
    municipality?: string;
    countrySecondarySubdivision?: string;
    countrySubdivision?: string;
    postalCode?: string;
    country?: string;
    freeformAddress?: string;
  };
  position?: {
    lat?: number;
    lon?: number;
  };
}

export interface TomTomSearchResponse {
  results?: TomTomSearchResult[];
}

export interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  osm_type: string;
  osm_id: number;
}

export const TOMTOM_ATTRIBUTION = 'Search data © TomTom';
export const NOMINATIM_ATTRIBUTION = '© OpenStreetMap contributors';

const SUPPORTED_LANGUAGE_TAGS = [
  'NGT',
  'NGT-Latn',
  'af-ZA',
  'ar',
  'eu-ES',
  'bg-BG',
  'ca-ES',
  'zh-CN',
  'zh-TW',
  'cs-CZ',
  'da-DK',
  'nl-BE',
  'nl-NL',
  'en-AU',
  'en-NZ',
  'en-GB',
  'en-US',
  'et-EE',
  'fi-FI',
  'fr-CA',
  'fr-FR',
  'gl-ES',
  'de-DE',
  'el-GR',
  'hr-HR',
  'he-IL',
  'hu-HU',
  'id-ID',
  'it-IT',
  'kk-KZ',
  'ko-KR',
  'ko-Latn-KR',
  'ko-Kore-KR',
  'lv-LV',
  'lt-LT',
  'ms-MY',
  'no-NO',
  'nb-NO',
  'pl-PL',
  'pt-BR',
  'pt-PT',
  'ro-RO',
  'ru-RU',
  'ru-Latn-RU',
  'ru-Cyrl-RU',
  'sr-RS',
  'sk-SK',
  'sl-SI',
  'es-ES',
  'es-419',
  'sv-SE',
  'th-TH',
  'tr-TR',
  'uk-UA',
  'vi-VN',
] as const;

const LANGUAGE_TAG_LOOKUP = new Map(
  SUPPORTED_LANGUAGE_TAGS.map((tag) => [tag.toLowerCase(), tag])
);

const DEFAULT_LANGUAGE_BY_BASE: Record<string, string> = {
  af: 'af-ZA',
  ar: 'ar',
  eu: 'eu-ES',
  bg: 'bg-BG',
  ca: 'ca-ES',
  cs: 'cs-CZ',
  da: 'da-DK',
  nl: 'nl-NL',
  en: 'en-US',
  et: 'et-EE',
  fi: 'fi-FI',
  fr: 'fr-FR',
  gl: 'gl-ES',
  de: 'de-DE',
  el: 'el-GR',
  hr: 'hr-HR',
  he: 'he-IL',
  hu: 'hu-HU',
  id: 'id-ID',
  it: 'it-IT',
  kk: 'kk-KZ',
  ko: 'ko-KR',
  lv: 'lv-LV',
  lt: 'lt-LT',
  ms: 'ms-MY',
  no: 'no-NO',
  nb: 'nb-NO',
  pl: 'pl-PL',
  pt: 'pt-PT',
  ro: 'ro-RO',
  ru: 'ru-RU',
  sr: 'sr-RS',
  sk: 'sk-SK',
  sl: 'sl-SI',
  es: 'es-ES',
  sv: 'sv-SE',
  th: 'th-TH',
  tr: 'tr-TR',
  uk: 'uk-UA',
  vi: 'vi-VN',
};

function firstLanguageTag(language: string): string {
  return language.split(',')[0]?.split(';')[0]?.trim() ?? '';
}

/**
 * Converts a browser/Accept-Language value to a TomTom-supported IETF tag.
 * Unsupported languages are omitted so TomTom can match the query language.
 */
export function normalizeTomTomLanguage(language?: string | null): string | undefined {
  if (!language) return undefined;

  const rawTag = firstLanguageTag(language).replace(/_/g, '-');
  if (!rawTag) return undefined;

  const exactMatch = LANGUAGE_TAG_LOOKUP.get(rawTag.toLowerCase());
  if (exactMatch) return exactMatch;

  const parts = rawTag.toLowerCase().split('-');
  const base = parts[0];
  if (!base) return undefined;

  if (base === 'zh') {
    const prefersTraditional = parts.some((part) =>
      ['tw', 'hk', 'mo', 'hant'].includes(part)
    );
    return prefersTraditional ? 'zh-TW' : 'zh-CN';
  }

  if (base === 'en') {
    const region = parts.find((part) => ['au', 'nz', 'gb', 'us'].includes(part));
    return region ? `en-${region.toUpperCase()}` : 'en-US';
  }

  if (base === 'fr' && parts.includes('ca')) return 'fr-CA';
  if (base === 'nl' && parts.includes('be')) return 'nl-BE';
  if (base === 'pt' && parts.includes('br')) return 'pt-BR';
  if (base === 'es' && parts.includes('419')) return 'es-419';

  return DEFAULT_LANGUAGE_BY_BASE[base];
}

export function buildCoordinateUrl(lat: number, lng: number): string {
  const encodedLat = encodeURIComponent(lat.toString());
  const encodedLng = encodeURIComponent(lng.toString());
  return `https://www.openstreetmap.org/?mlat=${encodedLat}&mlon=${encodedLng}#map=18/${encodedLat}/${encodedLng}`;
}

function buildAddressFallback(address?: TomTomSearchResult['address']): string {
  if (!address) return '';

  const street = [address.streetNumber, address.streetName].filter(Boolean).join(' ');
  return [
    street,
    address.municipalitySubdivision,
    address.municipality,
    address.countrySubdivision,
    address.postalCode,
    address.country,
  ]
    .filter((value, index, values): value is string => Boolean(value) && values.indexOf(value) === index)
    .join(', ');
}

function getTomTomDisplayName(result: TomTomSearchResult): string {
  const poiName = result.poi?.name?.trim() ?? '';
  const address = result.address?.freeformAddress?.trim() || buildAddressFallback(result.address);

  if (poiName && address && !address.toLocaleLowerCase().includes(poiName.toLocaleLowerCase())) {
    return `${poiName}, ${address}`;
  }

  return address || poiName || result.entityType || result.type;
}

export function convertTomTomResult(
  result: TomTomSearchResult,
  index = 0
): GeocodeResult | null {
  const lat = result.position?.lat;
  const lng = result.position?.lon;

  if (
    typeof lat !== 'number' ||
    typeof lng !== 'number' ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    return null;
  }

  const resultType = result.entityType
    ? `${result.type} · ${result.entityType}`
    : result.type || 'Place';

  return {
    id: result.id || `tomtom:${result.type || 'place'}:${lat}:${lng}:${index}`,
    displayName: getTomTomDisplayName(result),
    lat,
    lng,
    resultType,
    osmUrl: buildCoordinateUrl(lat, lng),
  };
}

export function convertTomTomResults(response: TomTomSearchResponse): GeocodeResult[] {
  return (response.results ?? [])
    .map((result, index) => convertTomTomResult(result, index))
    .filter((result): result is GeocodeResult => result !== null);
}

export function convertNominatimResult(result: NominatimResult): GeocodeResult {
  const osmType =
    result.osm_type === 'node' ? 'node' : result.osm_type === 'way' ? 'way' : 'relation';

  return {
    id: `nominatim:${result.place_id}`,
    displayName: result.display_name,
    lat: Number.parseFloat(result.lat),
    lng: Number.parseFloat(result.lon),
    resultType: `OpenStreetMap ${osmType}`,
    osmUrl: `https://www.openstreetmap.org/${osmType}/${result.osm_id}`,
  };
}
