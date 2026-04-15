import type { Metadata } from 'next';
import HomePage from '@/components/home/HomePage';
import { buildPageMetadata } from '@/lib/metadata';
import {
  buildOrganizationStructuredData,
  buildWebPageStructuredData,
} from '@/lib/structured-data';
import { SITE_DESCRIPTION, SITE_KEYWORDS, SITE_NAME, absoluteUrl } from '@/lib/site';

const homeDescription =
  'Track sunrise, sunset, golden hour, solar azimuth, altitude, and 3D daylight views for any location with a live sun path map.';

export const metadata: Metadata = buildPageMetadata({
  title: 'Sun Path Map & Solar Tracker',
  description: homeDescription,
  path: '/',
  keywords: [
    ...SITE_KEYWORDS,
    'sun path chart',
    'daylight analysis tool',
    'sun tracker map',
  ],
});

const homeStructuredData = [
  buildOrganizationStructuredData(),
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: absoluteUrl('/'),
    description: SITE_DESCRIPTION,
    inLanguage: 'en',
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: SITE_NAME,
    url: absoluteUrl('/'),
    description: homeDescription,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Web',
    browserRequirements: 'Requires JavaScript and a modern web browser.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      'Interactive sun path map',
      'Solar azimuth and altitude charts',
      'Sunrise and sunset calculations',
      'Golden hour planning',
      '3D solar visualization',
      'Location search and coordinate lookup',
    ],
    image: absoluteUrl('/opengraph-image'),
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: absoluteUrl('/'),
    },
  },
  buildWebPageStructuredData({
    path: '/',
    title: 'Sun Path Map & Solar Tracker',
    description: homeDescription,
  }),
];

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeStructuredData) }}
      />
      <HomePage />
    </>
  );
}
