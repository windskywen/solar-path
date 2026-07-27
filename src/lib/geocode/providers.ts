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
