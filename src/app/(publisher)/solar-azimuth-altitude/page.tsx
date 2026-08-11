import type { Metadata } from 'next';
import { CalculatorPageFrame } from '@/components/calculators/CalculatorPageFrame';
import { buildPageMetadata } from '@/lib/metadata';
import { buildBreadcrumbStructuredData, buildFaqStructuredData, buildWebPageStructuredData } from '@/lib/structured-data';
import { getTodayISO } from '@/lib/utils/timezone';

export const revalidate = 3600;
const title = 'Solar Azimuth & Altitude Calculator';
const description = 'Calculate the Sun’s azimuth, altitude, compass direction, and daily angle curve for a selected location, date, and local time.';
const path = '/solar-azimuth-altitude';
const faqs = [
  { question: 'What does solar azimuth measure?', answer: 'Azimuth is the Sun’s compass bearing measured clockwise from north: 0 degrees is north, 90 east, 180 south, and 270 west.' },
  { question: 'What does solar altitude measure?', answer: 'Altitude is the angle above or below the horizon. Positive values are above the horizon; negative values mean the Sun is below it.' },
  { question: 'Does this calculate the best solar-panel tilt?', answer: 'No. Panel yield and tilt require additional assumptions about equipment, shading, roof geometry, losses, and energy objectives. This tool reports solar position only.' },
] as const;

export const metadata: Metadata = buildPageMetadata({ title, description, path, keywords: ['solar azimuth calculator', 'solar altitude calculator', 'sun angle by time', 'sun compass direction'] });
const structuredData = [buildWebPageStructuredData({ path, title, description }), buildBreadcrumbStructuredData([{ name: 'Home', path: '/' }, { name: title, path }]), buildFaqStructuredData(faqs)];

export default function SolarAzimuthAltitudePage() {
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} /><CalculatorPageFrame eyebrow="Solar angle calculator" title={title} description={description} mode="angles" initialDateISO={getTodayISO('UTC')} faqs={faqs} sections={[
    { heading: 'Azimuth describes direction', paragraphs: ['Solar Path Tracker reports azimuth clockwise from true north. This makes the value directly comparable with a compass bearing and helps identify whether light approaches from the east, north, west, or a direction between them.', 'Direction changes continuously throughout the day, so always pair the bearing with the selected local time.'] },
    { heading: 'Altitude describes height', paragraphs: ['A low positive altitude produces long shadows and shallow light. A higher altitude places the Sun more directly overhead. Negative altitude means the Sun is below the astronomical horizon.', 'The 24-hour curve reveals how quickly the altitude changes around the time you selected.'] },
    { heading: 'Position is not system design', paragraphs: ['These angles support early daylight research, facade observations, photography planning, and orientation checks. They do not calculate roof suitability, panel yield, structural constraints, glare compliance, or professional design outcomes.', 'Use qualified site data and professional analysis for consequential engineering or installation decisions.'] },
  ]} /></>;
}
