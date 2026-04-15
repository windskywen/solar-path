import type { Metadata } from 'next';
import HomePage from '@/components/home/HomePage';
import { buildPageMetadata } from '@/lib/metadata';
import { SITE_DESCRIPTION, SITE_KEYWORDS, SITE_NAME, absoluteUrl } from '@/lib/site';

const homeDescription =
  'Explore the Sun path for any location and date with a live solar map, azimuth and altitude charts, sunrise and sunset data, and immersive 3D daylight visualizations.';

export const metadata: Metadata = buildPageMetadata({
  title: 'Sun Path Map, Azimuth & Altitude Visualizer',
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
      '3D solar visualization',
      'Location search and coordinate lookup',
    ],
    image: absoluteUrl('/opengraph-image'),
  },
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
