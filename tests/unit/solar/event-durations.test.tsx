import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import SunCalc from 'suncalc';
import { computeExtendedSunEvents } from '@/lib/solar/extended-events';
import { generateInsights } from '@/lib/solar/insights';
import { computeHourlyPositions } from '@/lib/solar/computation';
import { SolarDataTable } from '@/components/data/SolarDataTable';

afterEach(() => vi.restoreAllMocks());

describe('event-derived duration summaries', () => {
  it('reports short windows even when no whole-hour sample hits golden hour', () => {
    const hourly = computeHourlyPositions(-27.4698, 153.0251, '2026-09-06', 'Australia/Brisbane');
    const events = computeExtendedSunEvents(-27.4698, 153.0251, '2026-09-06', 'Australia/Brisbane');
    expect(hourly.filter((position) => position.daylightState === 'golden')).toHaveLength(0);
    expect(generateInsights(-27.4698, hourly, events).messages).toContain(
      'Calculated golden-hour windows: morning 0h 31m; evening 0h 31m.'
    );
    const html = renderToStaticMarkup(<SolarDataTable positions={hourly} selectedHour={null} events={events} />);
    expect(html).toContain('Daylight: 11h 40m');
    expect(html).not.toContain('11 hours of daylight');
  });

  it.each([
    ['2026-03-07T23:50:00-05:00', '2026-03-08T00:20:00-05:00', 30],
    ['2026-03-08T01:50:00-05:00', '2026-03-08T03:10:00-04:00', 20],
    ['2026-11-01T01:50:00-04:00', '2026-11-01T01:10:00-05:00', 20],
    ['2026-03-08T04:00:00Z', '2026-03-08T04:59:40Z', 59 + 2 / 3],
  ])('uses elapsed instants across midnight, DST, and rounding: %s', (start, end, minutes) => {
    const original = SunCalc.getTimes(new Date('2026-03-08T12:00:00Z'), 40.7, -74);
    vi.spyOn(SunCalc, 'getTimes').mockReturnValue({ ...original, sunrise: new Date(start), goldenHourEnd: new Date(end) });
    const events = computeExtendedSunEvents(40.7, -74, '2026-03-08', 'America/New_York');
    expect(events.morningGoldenHour.durationMinutes).toBeCloseTo(minutes, 8);
    if (minutes > 59) {
      expect(generateInsights(40.7, [], events).messages.join(' ')).toContain('morning 1h 0m');
    }
  });

  it('does not invent a duration for a missing or reversed boundary', () => {
    const original = SunCalc.getTimes(new Date('2026-03-08T12:00:00Z'), 40.7, -74);
    vi.spyOn(SunCalc, 'getTimes').mockReturnValue({ ...original, goldenHourEnd: new Date(NaN) });
    let events = computeExtendedSunEvents(40.7, -74, '2026-03-08', 'America/New_York');
    expect(events.morningGoldenHour).toMatchObject({ available: false });
    expect(events.morningGoldenHour.durationMinutes).toBeUndefined();
    expect(generateInsights(40.7, [], events).messages.join(' ')).toContain('morning unavailable; evening');
    vi.mocked(SunCalc.getTimes).mockReturnValue({ ...original, goldenHourEnd: new Date(original.sunrise.getTime() - 1) });
    events = computeExtendedSunEvents(40.7, -74, '2026-03-08', 'America/New_York');
    expect(events.morningGoldenHour.available).toBe(false);
  });

  it.each(['2026-06-21', '2026-12-21'])('keeps polar windows unavailable on %s', (date) => {
    const events = computeExtendedSunEvents(78.22, 15.63, date, 'Arctic/Longyearbyen');
    const hourly = computeHourlyPositions(78.22, 15.63, date, 'Arctic/Longyearbyen');
    expect(events.morningGoldenHour.durationMinutes).toBeUndefined();
    expect(events.eveningGoldenHour.durationMinutes).toBeUndefined();
    expect(generateInsights(78.22, hourly, events).messages.join(' ')).not.toContain('Calculated golden-hour');
  });

  it('preserves special-condition notes and labels missing daylight as unavailable', () => {
    const hourly = computeHourlyPositions(-27.4698, 153.0251, '2026-09-06', 'Australia/Brisbane');
    const html = renderToStaticMarkup(<SolarDataTable positions={hourly} selectedHour={null} events={{ dayLengthLabel: '24h 0m', note: 'Only sunrise occurs today' }} />);
    expect(html).toContain('Only sunrise occurs today');
    expect(renderToStaticMarkup(<SolarDataTable positions={hourly} selectedHour={null} />)).toContain('Daylight: unavailable');
  });
});
