import type { Metadata } from 'next';
import {
  IntentLandingPage,
  type IntentLandingFaq,
  type IntentLandingHighlight,
  type IntentLandingLink,
} from '@/components/seo/IntentLandingPage';
import { buildPageMetadata } from '@/lib/metadata';
import {
  buildBreadcrumbStructuredData,
  buildFaqStructuredData,
  buildWebPageStructuredData,
} from '@/lib/structured-data';

const title = 'Golden Hour Calculator';
const description =
  'Estimate golden hour timing, sun direction, and soft-light windows for any location with a live map, hourly sun path data, and 3D views.';
const path = '/golden-hour-calculator';

const highlights: readonly IntentLandingHighlight[] = [
  {
    title: 'Time soft light with more context',
    description:
      'See when golden hour begins and ends, then review the sun path to understand how that light lands on your scene or site.',
  },
  {
    title: 'Check direction as well as timing',
    description:
      'Golden hour quality depends on direction, not just the clock. Use the map and azimuth data to see where the sun sits during the warm-light window.',
  },
  {
    title: 'Plan for location-specific conditions',
    description:
      'Switch places and dates quickly to compare soft-light timing for travel, real-estate photography, or outdoor production schedules.',
  },
  {
    title: 'Verify the rest of the day too',
    description:
      'Use the same workflow to review sunrise, sunset, and the hourly angle curve when you need broader daylight context around golden hour.',
  },
];

const steps = [
  'Set the location you care about with search, GPS, or manual coordinates.',
  'Choose the date and review the selected hour, hourly table, and insights panel for warm-light periods.',
  'Pin moments on the map to compare direction, altitude, and how the scene changes before and after golden hour.',
] as const;

const faqs: readonly IntentLandingFaq[] = [
  {
    question: 'Is golden hour the same as sunrise or sunset?',
    answer:
      'Not exactly. Golden hour is the warm, low-angle light window that usually happens shortly after sunrise and shortly before sunset, but the most useful moment depends on your location and direction of view.',
  },
  {
    question: 'Can I use this for photography and real-estate shoots?',
    answer:
      'Yes. The page is designed for photographers, creators, and location scouts who want a quick way to anticipate soft-light timing and sun direction before they arrive.',
  },
  {
    question: 'Why do azimuth and altitude still matter for golden hour?',
    answer:
      'They explain where the sun is and how high it sits above the horizon, which determines whether the light hits a facade directly, skims across it, or disappears behind nearby obstructions.',
  },
];

const relatedLinks: readonly IntentLandingLink[] = [
  {
    href: '/',
    label: 'Open the full sun path map',
    description: 'Use the main tool to pin exact moments on the map and compare the entire day.',
  },
  {
    href: '/sunrise-sunset-calculator',
    label: 'Sunrise & Sunset Calculator',
    description: 'Start with the day boundaries, then narrow down to the warm-light window.',
  },
  {
    href: '/solar-azimuth-altitude',
    label: 'Solar Azimuth & Altitude Calculator',
    description: 'Review the exact solar angles behind your golden-hour decisions.',
  },
];

const structuredData = [
  buildWebPageStructuredData({ path, title, description }),
  buildBreadcrumbStructuredData([
    { name: 'Home', path: '/' },
    { name: title, path },
  ]),
  buildFaqStructuredData(faqs),
];

export const metadata: Metadata = buildPageMetadata({
  title,
  description,
  path,
  keywords: [
    'golden hour calculator',
    'golden hour time calculator',
    'golden hour photography planner',
    'sunset photography planning',
    'soft light calculator',
  ],
});

export default function GoldenHourCalculatorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <IntentLandingPage
        eyebrow="Soft-light planning"
        title={title}
        description={description}
        intro="Use this golden hour calculator when you need a better answer than a generic photo app can give. Solar Path Tracker pairs warm-light timing with the live map, hourly solar positions, and 3D daylight context so you can plan the best shooting window for a facade, landscape, or outdoor scene."
        highlights={highlights}
        steps={steps}
        faqs={faqs}
        primaryCta={{ href: '/', label: 'Plan with the live map' }}
        secondaryCta={{ href: '/sunrise-sunset-calculator', label: 'Check sunrise and sunset' }}
        relatedLinks={relatedLinks}
      />
    </>
  );
}
