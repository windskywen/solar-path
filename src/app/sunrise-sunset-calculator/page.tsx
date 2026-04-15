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

const title = 'Sunrise & Sunset Calculator';
const description =
  'Check sunrise, sunset, and daylight length for any location with a live sun path map, seasonal solar charts, and 3D daylight views.';
const path = '/sunrise-sunset-calculator';

const highlights: readonly IntentLandingHighlight[] = [
  {
    title: 'Plan first light and last light',
    description:
      'See when the sun rises and sets before a site visit, property tour, installation, or outdoor shoot.',
  },
  {
    title: 'Compare daylight across the year',
    description:
      'Move between winter, summer, and shoulder seasons to understand how much useful daylight a location gains or loses.',
  },
  {
    title: 'Read more than a single timestamp',
    description:
      'Pair sunrise and sunset times with the hourly map, azimuth curve, and altitude changes so the full day is easier to interpret.',
  },
  {
    title: 'Validate exposure before you go',
    description:
      'Use the live map and supporting metrics to confirm whether morning or evening light better matches your plan.',
  },
];

const steps = [
  'Search for a place, use GPS, or enter coordinates to set the observation point.',
  'Choose the date you want to evaluate, then read the sunrise, sunset, and daylight duration cards.',
  'Use the map, charts, and hourly table to compare how the sun moves between those event times.',
] as const;

const faqs: readonly IntentLandingFaq[] = [
  {
    question: 'Can I compare sunrise and sunset for different seasons?',
    answer:
      'Yes. Change the date to compare winter, summer, and equinox conditions for the same location and review how daylight length shifts across the year.',
  },
  {
    question: 'Does the calculator only show sunrise and sunset times?',
    answer:
      'No. Solar Path Tracker also shows the sun path on a live map, hourly solar angles, and supporting charts so you can see how the day develops between those times.',
  },
  {
    question: 'Who is this page useful for?',
    answer:
      'It is useful for property research, travel planning, outdoor production, solar site checks, and any situation where first light, last light, or total daylight matters.',
  },
];

const relatedLinks: readonly IntentLandingLink[] = [
  {
    href: '/',
    label: 'Open the full sun path map',
    description: 'Jump back to the live map when you want the complete interactive workflow.',
  },
  {
    href: '/golden-hour-calculator',
    label: 'Golden Hour Calculator',
    description: 'Refine the soft-light window after you know when sunrise and sunset happen.',
  },
  {
    href: '/solar-azimuth-altitude',
    label: 'Solar Azimuth & Altitude Calculator',
    description: 'Measure the exact solar angles that sit between first light and last light.',
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
    'sunrise sunset calculator',
    'daylight calculator',
    'sunrise time by location',
    'sunset time by location',
    'day length calculator',
  ],
});

export default function SunriseSunsetCalculatorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <IntentLandingPage
        eyebrow="Daylight planning"
        title={title}
        description={description}
        intro="Use this sunrise and sunset calculator when you need to know first light, last light, and how long the day lasts before a visit, install, or shoot. Solar Path Tracker connects those event times to the live map, hourly table, and azimuth-altitude charts so you can understand the whole daylight window instead of relying on one number."
        highlights={highlights}
        steps={steps}
        faqs={faqs}
        primaryCta={{ href: '/', label: 'Open the live sun path map' }}
        secondaryCta={{ href: '/golden-hour-calculator', label: 'See golden hour timing' }}
        relatedLinks={relatedLinks}
      />
    </>
  );
}
