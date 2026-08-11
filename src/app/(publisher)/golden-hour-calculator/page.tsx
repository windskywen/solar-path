import type { Metadata } from 'next';
import { CalculatorPageFrame } from '@/components/calculators/CalculatorPageFrame';
import { buildPageMetadata } from '@/lib/metadata';
import { buildBreadcrumbStructuredData, buildFaqStructuredData, buildWebPageStructuredData } from '@/lib/structured-data';
import { getTodayISO } from '@/lib/utils/timezone';

export const revalidate = 3600;
const title = 'Golden Hour Calculator';
const description = 'Calculate morning and evening golden-hour windows, sun direction, and solar altitude for any location and date.';
const path = '/golden-hour-calculator';
const faqs = [
  { question: 'How does this calculator define golden hour?', answer: 'It uses SunCalc’s astronomical window from sunrise to a solar altitude of 6 degrees in the morning, and from 6 degrees down to sunset in the evening.' },
  { question: 'Is every golden-hour minute visually golden?', answer: 'No. Cloud, haze, terrain, nearby buildings, surface colour, and camera exposure all affect the visible result. The calculated window describes solar geometry only.' },
  { question: 'Why is sun direction included?', answer: 'Timing alone cannot tell you which facade or landscape will receive direct light. Azimuth shows the compass direction at the beginning and end of each window.' },
] as const;

export const metadata: Metadata = buildPageMetadata({ title, description, path, keywords: ['golden hour calculator', 'golden hour direction', 'photography light planner', 'sun altitude 6 degrees'] });
const structuredData = [buildWebPageStructuredData({ path, title, description }), buildBreadcrumbStructuredData([{ name: 'Home', path: '/' }, { name: title, path }]), buildFaqStructuredData(faqs)];

export default function GoldenHourCalculatorPage() {
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} /><CalculatorPageFrame eyebrow="Soft-light calculator" title={title} description={description} mode="golden-hour" initialDateISO={getTodayISO('UTC')} faqs={faqs} sections={[
    { heading: 'Timing and direction work together', paragraphs: ['The displayed window gives the astronomical start and end, while the boundary azimuths show where the Sun sits on the compass. Use both when choosing a camera angle or deciding which side of a property will receive low-angle light.', 'A west-facing subject may suit the evening window, while an east-facing subject is more likely to receive direct morning light.'] },
    { heading: 'Exact window versus hourly labels', paragraphs: ['The main sun-path map classifies each whole hour between 0 and 6 degrees altitude as an approximate golden condition. This dedicated calculator uses SunCalc event boundaries to report precise timestamps.', 'The altitude chart provides the wider daily context so the low-angle window is not interpreted in isolation.'] },
    { heading: 'Local obstructions still matter', paragraphs: ['The calculation does not know whether a hill, tree, tower, or neighbouring building blocks the horizon. Weather and atmospheric clarity also change colour and contrast.', 'Use the result to shortlist a window, then check the location and forecast before committing a shoot or inspection.'] },
  ]} /></>;
}
