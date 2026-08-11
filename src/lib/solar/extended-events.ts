import SunCalc from 'suncalc';
import { DateTime } from 'luxon';
import type {
  ExtendedSunEvents,
  SolarEventBoundary,
  SolarEventWindow,
  SolarPositionAtTime,
} from '@/types/solar';
import { computeSunEvents } from './events';
import { computeSunPosition, getDaylightState } from './computation';
import { resolveTimezone } from '@/lib/utils/timezone';

function isValidDate(value: Date | undefined): value is Date {
  return value instanceof Date && !Number.isNaN(value.getTime());
}

function toBoundaryAtLocation(
  value: Date | undefined,
  timezone: string,
  lat: number,
  lng: number
): SolarEventBoundary | undefined {
  if (!isValidDate(value)) {
    return undefined;
  }

  const position = computeSunPosition(value, lat, lng);
  return {
    localTime: DateTime.fromJSDate(value, { zone: timezone }).toFormat('HH:mm'),
    ...position,
  };
}

function buildWindow(
  start: Date | undefined,
  end: Date | undefined,
  timezone: string,
  lat: number,
  lng: number,
  unavailableNote: string
): SolarEventWindow {
  const startBoundary = toBoundaryAtLocation(start, timezone, lat, lng);
  const endBoundary = toBoundaryAtLocation(end, timezone, lat, lng);

  if (!startBoundary || !endBoundary) {
    return { available: false, note: unavailableNote };
  }

  return { available: true, start: startBoundary, end: endBoundary };
}

export function computeExtendedSunEvents(
  lat: number,
  lng: number,
  dateISO: string,
  timezone: string
): ExtendedSunEvents {
  const zone = resolveTimezone(timezone);
  const dateTime = DateTime.fromISO(`${dateISO}T12:00:00`, { zone });
  const base = computeSunEvents(lat, lng, dateISO, zone);
  const unavailableNote = base.note ?? 'This event does not occur for the selected date and location.';

  if (!dateTime.isValid) {
    return {
      ...base,
      timezone: zone,
      morningGoldenHour: { available: false, note: 'Invalid date.' },
      eveningGoldenHour: { available: false, note: 'Invalid date.' },
    };
  }

  const times = SunCalc.getTimes(dateTime.toJSDate(), lat, lng);

  return {
    ...base,
    timezone: zone,
    civilDawnLocal: isValidDate(times.dawn)
      ? DateTime.fromJSDate(times.dawn, { zone }).toFormat('HH:mm')
      : undefined,
    civilDuskLocal: isValidDate(times.dusk)
      ? DateTime.fromJSDate(times.dusk, { zone }).toFormat('HH:mm')
      : undefined,
    morningGoldenHour: buildWindow(
      times.sunrise,
      times.goldenHourEnd,
      zone,
      lat,
      lng,
      unavailableNote
    ),
    eveningGoldenHour: buildWindow(
      times.goldenHour,
      times.sunset,
      zone,
      lat,
      lng,
      unavailableNote
    ),
  };
}

export function computeSolarPositionAtLocalTime(
  lat: number,
  lng: number,
  dateISO: string,
  localTime: string,
  timezone: string
): SolarPositionAtTime {
  const zone = resolveTimezone(timezone);
  const dateTime = DateTime.fromISO(`${dateISO}T${localTime}:00`, { zone });

  if (!dateTime.isValid) {
    throw new Error('Invalid local date or time.');
  }

  const position = computeSunPosition(dateTime.toJSDate(), lat, lng);
  return {
    localTimeLabel: dateTime.toFormat('HH:mm'),
    ...position,
    daylightState: getDaylightState(position.altitudeDeg),
  };
}

export function getCardinalDirection(azimuthDeg: number): string {
  const directions = ['North', 'North-east', 'East', 'South-east', 'South', 'South-west', 'West', 'North-west'];
  return directions[Math.round(azimuthDeg / 45) % directions.length];
}
