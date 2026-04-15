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

const title = 'Solar Azimuth & Altitude Calculator';
const description =
  'Measure solar azimuth and altitude for any location and date with a live sun path map, hourly angles, and sunrise-to-sunset context.';
const path = '/solar-azimuth-altitude';

const highlights: readonly IntentLandingHighlight[] = [
  {
    title: 'Measure sun direction precisely',
    description:
      'Use azimuth to understand whether light arrives from the east, south, west, or a narrow angle in between for the chosen hour.',
  },
  {
    title: 'Estimate sun height above the horizon',
    description:
      'Use altitude to compare shallow winter sun with high summer sun and to anticipate glare, heat, or long shadows.',
  },
  {
    title: 'Support solar and facade decisions',
    description:
      'The angle data helps with daylight studies, orientation checks, solar panel planning, and outdoor comfort reviews.',
  },
  {
    title: 'Cross-check angles on the map',
    description:
      'The live map and hourly table make it easy to verify whether the selected direction and elevation match the physical setting you care about.',
  },
];

const steps = [
  'Choose the observation point and set the date you want to study.',
  'Use the hourly table or solar rays to pin the moment that matters most.',
  'Read azimuth, altitude, daylight state, and the surrounding sunrise-to-sunset context before making a decision.',
] as const;

const faqs: readonly IntentLandingFaq[] = [
  {
    question: 'What does solar azimuth mean?',
    answer:
      'Solar azimuth is the compass direction of the sun. It helps you understand whether light is arriving from the east, south, west, or somewhere in between at a specific time.',
  },
  {
    question: 'What does solar altitude mean?',
    answer:
      'Solar altitude is the height of the sun above the horizon. Low altitude usually means longer shadows and softer light, while higher altitude means the sun is more directly overhead.',
  },
  {
    question: 'Who uses azimuth and altitude data?',
    answer:
      'Architects, solar installers, property researchers, photographers, and homeowners use these angles to evaluate exposure, shading, glare, and seasonal daylight behavior.',
  },
];

const relatedLinks: readonly IntentLandingLink[] = [
  {
    href: '/',
    label: 'Open the full sun path map',
    description: 'Review the angles directly on the interactive map with hourly solar rays.',
  },
  {
    href: '/sunrise-sunset-calculator',
    label: 'Sunrise & Sunset Calculator',
    description: 'Add first-light and last-light timing around the azimuth and altitude data.',
  },
  {
    href: '/golden-hour-calculator',
    label: 'Golden Hour Calculator',
    description: 'Connect solar angles to the warm-light windows used in photography and site planning.',
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
    'solar azimuth calculator',
    'solar altitude calculator',
    'sun angle calculator',
    'sun direction calculator',
    'solar position by location',
  ],
});

export default function SolarAzimuthAltitudePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <IntentLandingPage
        eyebrow="Solar angle analysis"
        title={title}
        description={description}
        intro="Use this solar azimuth and altitude calculator when you need the actual numbers behind a daylight decision. Solar Path Tracker combines exact solar angles with the live map, hourly breakdown, and sunrise-to-sunset context so you can evaluate exposure, shade, and seasonal change without leaving the browser."
        highlights={highlights}
        steps={steps}
        faqs={faqs}
        primaryCta={{ href: '/', label: 'Measure angles on the live map' }}
        secondaryCta={{ href: '/sunrise-sunset-calculator', label: 'Add sunrise and sunset context' }}
        relatedLinks={relatedLinks}
      />
    </>
  );
}
