export const SITE_NAME = 'Solar Path Tracker';
export const SITE_DESCRIPTION =
  'Interactive sun path map for any location and date. Explore solar altitude, azimuth, sunrise, sunset, daylight duration, and 3D solar visualizations.';
export const SITE_CONTACT_EMAIL = 'solarpathtracker@gmail.com';
export const SITE_LOCALE = 'en_US';
export const SITE_TITLE = 'Sun Path Map, Azimuth & Altitude Visualizer';
export const SITE_KEYWORDS = [
  'solar path tracker',
  'sun path map',
  'sun position calculator',
  'solar azimuth',
  'solar altitude',
  'sunrise sunset calculator',
  '3D solar visualization',
  'golden hour planner',
  'solar panel planning',
  'architectural daylight analysis',
] as const;

const LOCAL_SITE_URL = 'http://localhost:3000';

function normalizeSiteUrl(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

export function getSiteUrl(): URL {
  const rawUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL ||
    LOCAL_SITE_URL;

  return new URL(normalizeSiteUrl(rawUrl));
}

export function absoluteUrl(path: string = '/'): string {
  return new URL(path, getSiteUrl()).toString();
}
