import type { Metadata } from 'next';
import { CalculatorPageFrame } from '@/components/calculators/CalculatorPageFrame';
import { buildPageMetadata } from '@/lib/metadata';
import { buildBreadcrumbStructuredData, buildFaqStructuredData, buildWebPageStructuredData } from '@/lib/structured-data';
import { getTodayISO } from '@/lib/utils/timezone';

export const revalidate = 3600;
const metadataTitle = 'Sun Position & Angle Calculator';
const title = 'Sun Position, Azimuth & Altitude Calculator';
const description = 'Calculate sun position, angle, azimuth, altitude or elevation, and a 24-hour curve for any location, date, and local time.';
const path = '/solar-azimuth-altitude';
const faqs = [
  { question: 'What is sun position?', answer: 'Sun position combines azimuth, the compass bearing around the horizon, with altitude or elevation, the angle above or below the horizon, at a particular place, date, and local time.' },
  { question: 'How do I calculate a sun angle for a location and time?', answer: 'Enter a location, date, and local time. The calculator reports the Sun’s azimuth and altitude for that instant, then shows the daily angle curve for the same location and date.' },
  { question: 'What is the difference between altitude and elevation?', answer: 'In this calculator, altitude and elevation refer to the same solar angle above or below the astronomical horizon. Positive values are above the horizon and negative values are below it.' },
  { question: 'What does solar azimuth measure?', answer: 'Azimuth is the Sun’s compass bearing measured clockwise from north: 0 degrees is north, 90 east, 180 south, and 270 west.' },
  { question: 'Does this calculate the best solar-panel tilt?', answer: 'No. Panel yield and tilt require additional assumptions about equipment, shading, roof geometry, losses, and energy objectives. This tool reports solar position only.' },
] as const;

export const metadata: Metadata = buildPageMetadata({ title: metadataTitle, description, path, keywords: ['solar azimuth calculator', 'solar altitude calculator', 'sun angle by time', 'sun compass direction'] });
const structuredData = [buildWebPageStructuredData({ path, title, description }), buildBreadcrumbStructuredData([{ name: 'Home', path: '/' }, { name: title, path }]), buildFaqStructuredData(faqs)];

export default function SolarAzimuthAltitudePage() {
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} /><CalculatorPageFrame eyebrow="Sun position calculator" title={title} description={description} mode="angles" initialDateISO={getTodayISO('UTC')} faqs={faqs} sections={[
    { heading: 'Azimuth describes direction', paragraphs: ['Solar Path Tracker reports azimuth clockwise from true north. This makes the value directly comparable with a compass bearing and helps identify whether light approaches from the east, north, west, or a direction between them.', 'Direction changes continuously throughout the day, so always pair the bearing with the selected local time.'] },
    { heading: 'Altitude and elevation describe height', paragraphs: ['Altitude, also called elevation, is the Sun’s angle above or below the horizon. A low positive value produces long shadows and shallow light, while a higher value places the Sun more directly overhead. Negative values mean the Sun is below the astronomical horizon.', 'The 24-hour curve reveals how quickly the solar angle changes around the time you selected.'] },
    { heading: 'Position is not system design', paragraphs: ['These angles support early daylight research, facade observations, photography planning, and orientation checks. They do not calculate roof suitability, panel yield, structural constraints, glare compliance, or professional design outcomes.', 'Use qualified site data and professional analysis for consequential engineering or installation decisions.'] },
  ]} relatedLinks={[
    { href: '/', label: 'Open the Sun Path Map', description: 'Inspect the complete solar path and hourly bearings for the same location and date.' },
    { href: '/sunrise-sunset-calculator', label: 'Sunrise & Sunset Calculator', description: 'Check the day’s event times, daylight length, and sunrise or sunset direction.' },
    { href: '/guides/solar-azimuth-altitude-worked-example', label: 'Read a worked sun-position example', description: 'Compare the canonical NREL SPA Golden case with this site’s expected, actual, delta, and tolerance values.' },
  ]} /></>;
}
