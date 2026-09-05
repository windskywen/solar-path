import type { Metadata } from 'next';
import { CalculatorPageFrame } from '@/components/calculators/CalculatorPageFrame';
import { buildPageMetadata } from '@/lib/metadata';
import { buildBreadcrumbStructuredData, buildFaqStructuredData, buildWebPageStructuredData } from '@/lib/structured-data';
import { getTodayISO } from '@/lib/utils/timezone';

export const revalidate = 3600;
const title = 'Sunrise & Sunset Calculator';
const description = 'Calculate sunrise, sunset, civil dawn, civil dusk, daylight length, and event direction for any location and date.';
const path = '/sunrise-sunset-calculator';
const faqs = [
  { question: 'What is the difference between civil dawn and sunrise?', answer: 'Civil dawn begins when the Sun is 6 degrees below the horizon. Sunrise is the later event when the Sun’s upper edge becomes visible under the standard astronomical model.' },
  { question: 'How can I check sunrise or sunset direction?', answer: 'The result cards show the event azimuth and a compass direction for sunrise and sunset. Use the degree value when you need to compare a facade, street, camera axis, or other bearing precisely.' },
  { question: 'Can I compare these event times with the Sun Path Map?', answer: 'Yes. Open the Sun Path Map separately and enter the same location and date to inspect the full daily arc. Settings are not carried between tools, so enter the inputs again when comparing results.' },
  { question: 'Why might the visible sunrise be later?', answer: 'Buildings, hills, trees, local terrain, and weather can block the horizon. This calculator reports astronomical event times and does not model those obstructions.' },
  { question: 'How are polar days handled?', answer: 'When sunrise or sunset does not occur, the calculator reports the event as unavailable and identifies midnight sun or polar night instead of inventing a time.' },
] as const;

export const metadata: Metadata = buildPageMetadata({ title, description, path, keywords: ['sunrise sunset calculator', 'civil dawn calculator', 'daylight length calculator', 'sunrise time by location'] });
const structuredData = [buildWebPageStructuredData({ path, title, description }), buildBreadcrumbStructuredData([{ name: 'Home', path: '/' }, { name: title, path }]), buildFaqStructuredData(faqs)];

export default function SunriseSunsetCalculatorPage() {
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} /><CalculatorPageFrame eyebrow="Daylight calculator" title={title} description={description} mode="sunrise" initialDateISO={getTodayISO('UTC')} faqs={faqs} sections={[
    { heading: 'Read the full daylight boundary', paragraphs: ['Sunrise and sunset mark the standard horizon crossings used by SunCalc. Civil dawn and civil dusk extend the useful low-light period to the point where the Sun is 6 degrees below the horizon.', 'Use the timestamps with the displayed azimuths when planning travel, site access, photography, or an observation where both the light window and its direction matter.'] },
    { heading: 'Compare seasons, not just days', paragraphs: ['Day length changes because Earth’s axis is tilted. The solstice comparison uses the same selected coordinates so the difference comes from season rather than location.', 'At higher latitudes the seasonal swing becomes larger. Near the equator, sunrise, sunset, and day length stay comparatively consistent.'] },
    { heading: 'Know the model limits', paragraphs: ['The calculation uses geographic coordinates, date, and timezone. It does not include local skyline height, elevation masks, cloud, refraction changes caused by weather, or visibility through nearby structures.', 'Treat the result as a planning reference and verify critical observations on site.'] },
  ]} relatedLinks={[
    { href: '/', label: 'Open the Sun Path Map', description: 'Enter the same location and date to inspect the full solar arc, hourly direction, and altitude.' },
    { href: '/solar-azimuth-altitude', label: 'Sun Position & Angle Calculator', description: 'Check azimuth and altitude for a specific local time between sunrise and sunset.' },
    { href: '/guides/brisbane-winter-vs-summer-sun-path', label: 'Compare seasonal sun paths', description: 'See how sunrise, sunset, direction, altitude, and daylight change between Brisbane solstices.' },
  ]} /></>;
}
