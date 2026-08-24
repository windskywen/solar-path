import { computeSunPosition } from './computation';
import { computeExtendedSunEvents } from './extended-events';

export interface ValidationSource {
  label: string;
  url: string;
  retrievedDate: string;
  note: string;
}
interface BaseValidationBenchmark {
  id: string;
  label: string;
  source: ValidationSource;
}

export interface PositionValidationBenchmark extends BaseValidationBenchmark {
  kind: 'position';
  input: {
    latitude: number;
    longitude: number;
    instantISO: string;
  };
  expected: {
    azimuthDeg: number;
    altitudeDeg: number;
  };
  toleranceDeg: number;
}

export interface EventValidationBenchmark extends BaseValidationBenchmark {
  kind: 'events';
  input: {
    latitude: number;
    longitude: number;
    dateISO: string;
    timezone: string;
  };
  expected: {
    civilDawnLocal: string;
    sunriseLocal: string;
    solarNoonLocal: string;
    sunsetLocal: string;
    civilDuskLocal: string;
  };
  toleranceMinutes: number;
}

export interface PolarValidationCase {
  label: string;
  dateISO: string;
  timezone: string;
  expectedState: 'continuous-day' | 'continuous-night';
}

export interface PolarValidationBenchmark extends BaseValidationBenchmark {
  kind: 'polar';
  input: {
    latitude: number;
    longitude: number;
    cases: readonly PolarValidationCase[];
  };
}

export type SolarValidationBenchmark =
  | PositionValidationBenchmark
  | EventValidationBenchmark
  | PolarValidationBenchmark;

const NREL_SOURCE: ValidationSource = {
  label: 'NREL Solar Position Algorithm (SPA)',
  url: 'https://docs.nrel.gov/docs/fy08osti/34302.pdf',
  retrievedDate: '2026-08-24',
  note: 'Published SPA example used as an independent angular reference. NREL does not endorse Solar Path Tracker.',
};

const USNO_SOURCE: ValidationSource = {
  label: 'U.S. Naval Observatory Astronomical Applications API v4.0.1',
  url: 'https://aa.usno.navy.mil/data/api.html',
  retrievedDate: '2026-08-24',
  note: 'Fixed rise, transit, set, twilight, and polar-state snapshots. The API is not called at runtime.',
};

export const SOLAR_VALIDATION_BENCHMARKS: readonly SolarValidationBenchmark[] = [
  {
    id: 'nrel-spa-golden-2003',
    kind: 'position',
    label: 'NREL SPA canonical position · Golden, Colorado',
    source: NREL_SOURCE,
    input: {
      latitude: 39.742476,
      longitude: -105.1786,
      instantISO: '2003-10-17T19:30:30.000Z',
    },
    expected: {
      azimuthDeg: 194.34024,
      altitudeDeg: 39.88838,
    },
    toleranceDeg: 0.5,
  },
  {
    id: 'usno-brisbane-2026-06-21',
    kind: 'events',
    label: 'USNO event snapshot · Brisbane winter solstice',
    source: USNO_SOURCE,
    input: {
      latitude: -27.4698,
      longitude: 153.0251,
      dateISO: '2026-06-21',
      timezone: 'Australia/Brisbane',
    },
    expected: {
      civilDawnLocal: '06:12',
      sunriseLocal: '06:38',
      solarNoonLocal: '11:50',
      sunsetLocal: '17:02',
      civilDuskLocal: '17:27',
    },
    toleranceMinutes: 2,
  },
  {
    id: 'usno-london-2026-03-20',
    kind: 'events',
    label: 'USNO event snapshot · London near the March equinox',
    source: USNO_SOURCE,
    input: {
      latitude: 51.5074,
      longitude: -0.1278,
      dateISO: '2026-03-20',
      timezone: 'Europe/London',
    },
    expected: {
      civilDawnLocal: '05:30',
      sunriseLocal: '06:03',
      solarNoonLocal: '12:08',
      sunsetLocal: '18:13',
      civilDuskLocal: '18:47',
    },
    toleranceMinutes: 2,
  },
  {
    id: 'usno-singapore-2026-09-23',
    kind: 'events',
    label: 'USNO event snapshot · Singapore near the September equinox',
    source: USNO_SOURCE,
    input: {
      latitude: 1.3521,
      longitude: 103.8198,
      dateISO: '2026-09-23',
      timezone: 'Asia/Singapore',
    },
    expected: {
      civilDawnLocal: '06:33',
      sunriseLocal: '06:54',
      solarNoonLocal: '12:57',
      sunsetLocal: '19:00',
      civilDuskLocal: '19:21',
    },
    toleranceMinutes: 2,
  },
  {
    id: 'usno-longyearbyen-polar-2026',
    kind: 'polar',
    label: 'USNO polar-state snapshots · Longyearbyen',
    source: USNO_SOURCE,
    input: {
      latitude: 78.22,
      longitude: 15.63,
      cases: [
        {
          label: 'June solstice',
          dateISO: '2026-06-21',
          timezone: 'Arctic/Longyearbyen',
          expectedState: 'continuous-day',
        },
        {
          label: 'December solstice',
          dateISO: '2026-12-21',
          timezone: 'Arctic/Longyearbyen',
          expectedState: 'continuous-night',
        },
      ],
    },
  },
] as const;

export interface PositionValidationResult {
  kind: 'position';
  benchmark: PositionValidationBenchmark;
  actual: { azimuthDeg: number; altitudeDeg: number };
  delta: { azimuthDeg: number; altitudeDeg: number };
  passed: boolean;
}

export interface EventValidationResult {
  kind: 'events';
  benchmark: EventValidationBenchmark;
  actual: EventValidationBenchmark['expected'];
  deltaMinutes: Record<keyof EventValidationBenchmark['expected'], number>;
  passed: boolean;
}

export interface PolarValidationResult {
  kind: 'polar';
  benchmark: PolarValidationBenchmark;
  cases: readonly {
    label: string;
    dateISO: string;
    expectedState: PolarValidationCase['expectedState'];
    actualState: PolarValidationCase['expectedState'] | 'transition';
    hasInventedBoundary: boolean;
    passed: boolean;
  }[];
  passed: boolean;
}

export type SolarValidationResult =
  | PositionValidationResult
  | EventValidationResult
  | PolarValidationResult;

export function circularAngleDifference(first: number, second: number): number {
  const difference = Math.abs(first - second) % 360;
  return Math.min(difference, 360 - difference);
}

function parseLocalMinutes(value: string): number {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) {
    throw new Error(`Invalid local time: ${value}`);
  }

  return Number(match[1]) * 60 + Number(match[2]);
}

export function localTimeDifferenceMinutes(first: string, second: string): number {
  const difference = Math.abs(parseLocalMinutes(first) - parseLocalMinutes(second));
  return Math.min(difference, 24 * 60 - difference);
}

function requireEventTime(value: string | undefined, label: string): string {
  if (!value) {
    throw new Error(`Missing calculated ${label}.`);
  }
  return value;
}

export function evaluateSolarValidationBenchmark(
  benchmark: SolarValidationBenchmark
): SolarValidationResult {
  if (benchmark.kind === 'position') {
    const actual = computeSunPosition(
      new Date(benchmark.input.instantISO),
      benchmark.input.latitude,
      benchmark.input.longitude
    );
    const delta = {
      azimuthDeg: circularAngleDifference(actual.azimuthDeg, benchmark.expected.azimuthDeg),
      altitudeDeg: Math.abs(actual.altitudeDeg - benchmark.expected.altitudeDeg),
    };

    return {
      kind: 'position',
      benchmark,
      actual,
      delta,
      passed:
        delta.azimuthDeg <= benchmark.toleranceDeg &&
        delta.altitudeDeg <= benchmark.toleranceDeg,
    };
  }

  if (benchmark.kind === 'events') {
    const events = computeExtendedSunEvents(
      benchmark.input.latitude,
      benchmark.input.longitude,
      benchmark.input.dateISO,
      benchmark.input.timezone
    );
    const actual: EventValidationBenchmark['expected'] = {
      civilDawnLocal: requireEventTime(events.civilDawnLocal, 'civil dawn'),
      sunriseLocal: requireEventTime(events.sunriseLocal, 'sunrise'),
      solarNoonLocal: requireEventTime(events.solarNoonBoundary?.localTime, 'solar noon'),
      sunsetLocal: requireEventTime(events.sunsetLocal, 'sunset'),
      civilDuskLocal: requireEventTime(events.civilDuskLocal, 'civil dusk'),
    };
    const keys = Object.keys(benchmark.expected) as Array<keyof typeof benchmark.expected>;
    const deltaMinutes = Object.fromEntries(
      keys.map((key) => [
        key,
        localTimeDifferenceMinutes(actual[key], benchmark.expected[key]),
      ])
    ) as EventValidationResult['deltaMinutes'];

    return {
      kind: 'events',
      benchmark,
      actual,
      deltaMinutes,
      passed: keys.every((key) => deltaMinutes[key] <= benchmark.toleranceMinutes),
    };
  }

  const cases = benchmark.input.cases.map((entry) => {
    const events = computeExtendedSunEvents(
      benchmark.input.latitude,
      benchmark.input.longitude,
      entry.dateISO,
      entry.timezone
    );
    const actualState =
      events.dayLengthHours === 24
        ? 'continuous-day'
        : events.dayLengthHours === 0
          ? 'continuous-night'
          : 'transition';
    const hasInventedBoundary = Boolean(events.sunriseBoundary || events.sunsetBoundary);

    return {
      label: entry.label,
      dateISO: entry.dateISO,
      expectedState: entry.expectedState,
      actualState,
      hasInventedBoundary,
      passed: actualState === entry.expectedState && !hasInventedBoundary,
    } as const;
  });

  return {
    kind: 'polar',
    benchmark,
    cases,
    passed: cases.every((entry) => entry.passed),
  };
}

export function evaluateAllSolarValidationBenchmarks(): readonly SolarValidationResult[] {
  return SOLAR_VALIDATION_BENCHMARKS.map(evaluateSolarValidationBenchmark);
}

export function getSolarValidationResult(id: string): SolarValidationResult | undefined {
  const benchmark = SOLAR_VALIDATION_BENCHMARKS.find((entry) => entry.id === id);
  return benchmark ? evaluateSolarValidationBenchmark(benchmark) : undefined;
}
