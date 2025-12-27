/**
 * useSolarData Hook
 *
 * Computes solar data from current location, date, and timezone.
 */

import { useMemo } from 'react';
import { useLocation, useDateISO, useTimezone } from '@/store/solar-store';
import { computeHourlyPositions } from '@/lib/solar/computation';
import { computeSunEvents } from '@/lib/solar/events';
import { generateInsights } from '@/lib/solar/insights';
import type { SolarDataset, HourlySolarPosition, SunEvents, SolarInsights } from '@/types/solar';

interface UseSolarDataResult {
  /** Complete solar dataset or null if no location */
  data: SolarDataset | null;
  /** True while computing (currently synchronous, so always false) */
  isComputing: boolean;
  /** Hourly positions or empty array */
  hourly: HourlySolarPosition[];
  /** Sun events or default empty */
  events: SunEvents;
  /** Solar insights or empty messages */
  insights: SolarInsights;
}

/**
 * Hook to compute solar data for the current state
 *
 * @returns Solar data computed from current location/date/timezone
 */
export function useSolarData(): UseSolarDataResult {
  const location = useLocation();
  const dateISO = useDateISO();
  const timezone = useTimezone();

  const data = useMemo(() => {
    if (!location) return null;

    const hourly = computeHourlyPositions(location.lat, location.lng, dateISO, timezone);
    const events = computeSunEvents(location.lat, location.lng, dateISO, timezone);
    const insights = generateInsights(location.lat, hourly, events);

    return {
      location,
      dateISO,
      timezone,
      hourly,
      events,
      insights,
    };
  }, [location, dateISO, timezone]);

  return {
    data,
    isComputing: false,
    hourly: data?.hourly ?? [],
    events: data?.events ?? {},
    insights: data?.insights ?? { messages: [] },
  };
}

/**
 * Hook to get a specific hour's solar position
 *
 * @param hour - Hour to retrieve (0-23)
 * @returns Solar position for that hour or undefined
 */
export function useSolarPositionForHour(hour: number | null): HourlySolarPosition | undefined {
  const { hourly } = useSolarData();

  return useMemo(() => {
    if (hour === null) return undefined;
    return hourly.find((p) => p.hour === hour);
  }, [hourly, hour]);
}
