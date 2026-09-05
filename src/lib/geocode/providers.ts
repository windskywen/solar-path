export type GeocodeProvider = 'geoapify' | 'tomtom';

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
  attributionUrl?: string;
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

export interface GeoapifyResult {
  place_id?: string;
  formatted?: string;
  name?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  country?: string;
  result_type?: string;
  lat?: number;
  lon?: number;
}

export interface GeoapifySearchResponse {
  results?: GeoapifyResult[];
}

export const TOMTOM_ATTRIBUTION = 'Search data © TomTom';
export const TOMTOM_ATTRIBUTION_URL = 'https://www.tomtom.com/';
export const GEOAPIFY_ATTRIBUTION = 'Powered by Geoapify';
export const GEOAPIFY_ATTRIBUTION_URL = 'https://www.geoapify.com/';

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

function getGeoapifyDisplayName(result: GeoapifyResult): string {
  if (result.formatted?.trim()) return result.formatted.trim();

  return [
    result.name,
    result.address_line1,
    result.address_line2,
    result.city,
    result.state,
    result.country,
  ]
    .filter((value, index, values): value is string =>
      Boolean(value?.trim()) && values.indexOf(value) === index
    )
    .join(', ');
}

export function convertGeoapifyResult(
  result: GeoapifyResult,
  index = 0
): GeocodeResult | null {
  const lat = result.lat;
  const lng = result.lon;

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

  return {
    id: result.place_id || `geoapify:${result.result_type || 'place'}:${lat}:${lng}:${index}`,
    displayName: getGeoapifyDisplayName(result) || result.result_type || 'Place',
    lat,
    lng,
    resultType: result.result_type || 'Place',
    osmUrl: buildCoordinateUrl(lat, lng),
  };
}

export function convertGeoapifyResults(response: GeoapifySearchResponse): GeocodeResult[] {
  return (response.results ?? [])
    .map((result, index) => convertGeoapifyResult(result, index))
    .filter((result): result is GeocodeResult => result !== null);
}
