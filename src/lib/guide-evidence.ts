import type { GuideDefinition } from './guides';
import { computeHourlyPositions } from './solar/computation';
import {
  computeExtendedSunEvents,
  computeSolarPositionAtLocalTime,
  getCardinalDirection,
} from './solar/extended-events';
import { SOLAR_MODEL_INFO } from './solar/model-info';
import { getSolarValidationResult } from './solar/validation-benchmarks';
import type { CsvDataset } from './utils/csv';
import type {
  ExtendedSunEvents,
  HourlySolarPosition,
  SolarEventBoundary,
  SolarPositionAtTime,
} from '@/types/solar';

interface GuideEvidenceBase {
  dataset: CsvDataset;
}

export interface SunPathDiagramEvidence extends GuideEvidenceBase {
  kind: 'sun-path-diagram';
  locationName: string;
  dateISO: string;
  timezone: string;
  rows: readonly SolarPositionAtTime[];
}

export interface SeasonalEvidenceSeason {
  label: string;
  dateISO: string;
  events: ExtendedSunEvents;
  positions: readonly HourlySolarPosition[];
  noonAltitudeDeg: number | null;
}

export interface SeasonalComparisonEvidence extends GuideEvidenceBase {
  kind: 'seasonal-comparison';
  seasons: readonly [SeasonalEvidenceSeason, SeasonalEvidenceSeason];
  observations: readonly {
    localTime: string;
    winter: HourlySolarPosition;
    summer: HourlySolarPosition;
  }[];
  noonAltitudeDeltaDeg: number | null;
  dayLengthDeltaHours: number | null;
}

export interface FacadeOrientationRow {
  city: string;
  season: string;
  dateISO: string;
  timezone: string;
  position: SolarPositionAtTime;
  exposure: string;
}

export interface FacadeOrientationEvidence extends GuideEvidenceBase {
  kind: 'facade-orientation-matrix';
  rows: readonly FacadeOrientationRow[];
}

export interface GoldenHourBoundaryRow {
  season: string;
  dateISO: string;
  window: 'Morning' | 'Evening';
  boundary: 'Start' | 'End';
  value?: SolarEventBoundary;
  fieldNote: string;
}

export interface GoldenHourShotPlanEvidence extends GuideEvidenceBase {
  kind: 'golden-hour-shot-plan';
  rows: readonly GoldenHourBoundaryRow[];
}

export interface NrelSpaEvidence extends GuideEvidenceBase {
  kind: 'nrel-spa-benchmark';
  input: {
    latitude: number;
    longitude: number;
    instantISO: string;
  };
  rows: readonly {
    angle: 'Azimuth' | 'Altitude';
    expectedDeg: number;
    actualDeg: number;
    deltaDeg: number;
    toleranceDeg: number;
    passed: boolean;
  }[];
  passed: boolean;
}

export interface ShadowDirectionRow {
  dateISO: string;
  localTime: string;
  objectHeightM: number;
  position: SolarPositionAtTime;
  shadowBearingDeg: number | null;
  shadowLengthM: number | null;
}

export interface ShadowDirectionEvidence extends GuideEvidenceBase {
  kind: 'shadow-direction-model';
  rows: readonly ShadowDirectionRow[];
}

export type LightingSetup = 'front' | 'side' | 'back';

export function normalizeBearing(bearingDeg: number): number {
  return ((bearingDeg % 360) + 360) % 360;
}

export function getCameraBearingForLightingSetup(
  sunBearingDeg: number,
  setup: LightingSetup
): number {
  const offsetBySetup: Record<LightingSetup, number> = {
    front: 0,
    side: 90,
    back: 180,
  };
  return normalizeBearing(sunBearingDeg + offsetBySetup[setup]);
}

export function calculateShadowGeometry(
  solarAzimuthDeg: number,
  solarAltitudeDeg: number,
  objectHeightM: number
): { shadowBearingDeg: number | null; shadowLengthM: number | null } {
  if (solarAltitudeDeg <= 0) {
    return { shadowBearingDeg: null, shadowLengthM: null };
  }

  return {
    shadowBearingDeg: normalizeBearing(solarAzimuthDeg + 180),
    shadowLengthM: objectHeightM / Math.tan((solarAltitudeDeg * Math.PI) / 180),
  };
}

export type GuideEvidenceData =
  | SunPathDiagramEvidence
  | SeasonalComparisonEvidence
  | FacadeOrientationEvidence
  | GoldenHourShotPlanEvidence
  | NrelSpaEvidence
  | ShadowDirectionEvidence;

function baseMetadata(guide: GuideDefinition): NonNullable<CsvDataset['metadata']> {
  return [
    { key: 'model_id', value: SOLAR_MODEL_INFO.id },
    { key: 'model_reviewed_date', value: SOLAR_MODEL_INFO.reviewedDate },
    { key: 'guide_slug', value: guide.slug },
    { key: 'dataset_description', value: guide.csvDefinition.description },
  ];
}

function buildSunPathDiagramEvidence(guide: GuideDefinition): SunPathDiagramEvidence {
  const latitude = -27.4698;
  const longitude = 153.0251;
  const dateISO = '2026-09-23';
  const timezone = 'Australia/Brisbane';
  const rows = ['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00'].map(
    (localTime) =>
      computeSolarPositionAtLocalTime(latitude, longitude, dateISO, localTime, timezone)
  );

  return {
    kind: 'sun-path-diagram',
    locationName: 'Brisbane, Queensland, Australia',
    dateISO,
    timezone,
    rows,
    dataset: {
      filename: guide.csvDefinition.filenameStem,
      metadata: [
        ...baseMetadata(guide),
        { key: 'location_name', value: 'Brisbane, Queensland, Australia' },
        { key: 'latitude', value: latitude },
        { key: 'longitude', value: longitude },
        { key: 'date', value: dateISO },
        { key: 'timezone', value: timezone },
      ],
      columns: guide.csvDefinition.columns,
      rows: rows.map((position) => [
        position.localTimeLabel,
        position.azimuthDeg.toFixed(2),
        position.altitudeDeg.toFixed(2),
        position.daylightState,
      ]),
    },
  };
}

function buildSeasonalComparisonEvidence(guide: GuideDefinition): SeasonalComparisonEvidence {
  const { latitude, longitude, timezone, locationName } = guide.example;
  const buildSeason = (label: string, dateISO: string): SeasonalEvidenceSeason => {
    const events = computeExtendedSunEvents(latitude, longitude, dateISO, timezone);
    return {
      label,
      dateISO,
      events,
      positions: computeHourlyPositions(latitude, longitude, dateISO, timezone),
      noonAltitudeDeg: events.solarNoonBoundary?.altitudeDeg ?? null,
    };
  };
  const winter = buildSeason('Winter solstice', '2026-06-21');
  const summer = buildSeason('Summer solstice', '2026-12-21');
  const seasons: readonly [SeasonalEvidenceSeason, SeasonalEvidenceSeason] = [winter, summer];
  const observations = ['08:00', '12:00', '16:00'].map((localTime) => {
    const winterPosition = winter.positions.find((position) => position.localTimeLabel === localTime);
    const summerPosition = summer.positions.find((position) => position.localTimeLabel === localTime);
    if (!winterPosition || !summerPosition) {
      throw new Error(`Seasonal comparison is missing the ${localTime} observation.`);
    }
    return { localTime, winter: winterPosition, summer: summerPosition };
  });
  const noonAltitudeDeltaDeg =
    winter.noonAltitudeDeg === null || summer.noonAltitudeDeg === null
      ? null
      : summer.noonAltitudeDeg - winter.noonAltitudeDeg;
  const dayLengthDeltaHours =
    winter.events.dayLengthHours == null || summer.events.dayLengthHours == null
      ? null
      : summer.events.dayLengthHours - winter.events.dayLengthHours;

  return {
    kind: 'seasonal-comparison',
    seasons,
    observations,
    noonAltitudeDeltaDeg,
    dayLengthDeltaHours,
    dataset: {
      filename: guide.csvDefinition.filenameStem,
      metadata: [
        ...baseMetadata(guide),
        { key: 'location_name', value: locationName },
        { key: 'latitude', value: latitude },
        { key: 'longitude', value: longitude },
        { key: 'timezone', value: timezone },
      ],
      columns: guide.csvDefinition.columns,
      rows: seasons.flatMap((season) =>
        season.positions.map((position) => [
          season.label,
          season.dateISO,
          position.localTimeLabel,
          position.azimuthDeg.toFixed(2),
          position.altitudeDeg.toFixed(2),
          position.daylightState,
          season.events.sunriseLocal ?? 'Unavailable',
          season.events.solarNoonBoundary?.localTime ?? 'Unavailable',
          season.events.sunsetLocal ?? 'Unavailable',
          season.events.dayLengthLabel ?? 'Unavailable',
        ])
      ),
    },
  };
}

function facadeExposure(azimuthDeg: number, altitudeDeg: number): string {
  if (altitudeDeg <= 0) {
    return 'Sun below horizon';
  }
  if (azimuthDeg > 0 && azimuthDeg < 180) {
    return 'East-facing half-sky';
  }
  if (azimuthDeg > 180 && azimuthDeg < 360) {
    return 'West-facing half-sky';
  }
  return 'Parallel to east/west facade plane';
}

function buildFacadeOrientationEvidence(guide: GuideDefinition): FacadeOrientationEvidence {
  const cities = [
    { city: 'Darwin', latitude: -12.4637, longitude: 130.8444, timezone: 'Australia/Darwin' },
    { city: 'Brisbane', latitude: -27.4698, longitude: 153.0251, timezone: 'Australia/Brisbane' },
    { city: 'Hobart', latitude: -42.8821, longitude: 147.3272, timezone: 'Australia/Hobart' },
  ] as const;
  const seasons = [
    { label: 'Winter solstice', dateISO: '2026-06-21' },
    { label: 'Summer solstice', dateISO: '2026-12-21' },
  ] as const;
  const rows = cities.flatMap((city) =>
    seasons.flatMap((season) =>
      ['08:00', '16:00'].map((localTime) => {
        const position = computeSolarPositionAtLocalTime(
          city.latitude,
          city.longitude,
          season.dateISO,
          localTime,
          city.timezone
        );
        return {
          city: city.city,
          season: season.label,
          dateISO: season.dateISO,
          timezone: city.timezone,
          position,
          exposure: facadeExposure(position.azimuthDeg, position.altitudeDeg),
        };
      })
    )
  );

  return {
    kind: 'facade-orientation-matrix',
    rows,
    dataset: {
      filename: guide.csvDefinition.filenameStem,
      metadata: [
        ...baseMetadata(guide),
        { key: 'geometry_rule', value: 'East-facing half-sky is azimuth 0-180; west-facing half-sky is azimuth 180-360, only when altitude is above 0 degrees.' },
        { key: 'scope_limit', value: 'No indoor temperature, energy, glazing, shade, or comfort inference.' },
      ],
      columns: guide.csvDefinition.columns,
      rows: rows.map((row) => [
        row.city,
        row.season,
        row.dateISO,
        row.position.localTimeLabel,
        row.position.azimuthDeg.toFixed(2),
        row.position.altitudeDeg.toFixed(2),
        row.exposure,
      ]),
    },
  };
}

function buildGoldenHourShotPlanEvidence(guide: GuideDefinition): GoldenHourShotPlanEvidence {
  const { latitude, longitude, timezone, locationName } = guide.example;
  const seasons = [
    { label: 'Winter solstice', dateISO: '2026-06-21' },
    { label: 'Summer solstice', dateISO: '2026-12-21' },
  ] as const;
  const rows: GoldenHourBoundaryRow[] = [];

  for (const season of seasons) {
    const events = computeExtendedSunEvents(latitude, longitude, season.dateISO, timezone);
    const windows = [
      { label: 'Morning' as const, value: events.morningGoldenHour },
      { label: 'Evening' as const, value: events.eveningGoldenHour },
    ];
    for (const window of windows) {
      rows.push(
        {
          season: season.label,
          dateISO: season.dateISO,
          window: window.label,
          boundary: 'Start',
          value: window.value.start,
          fieldNote: window.label === 'Morning' ? 'Arrive before sunrise and face the start bearing.' : 'Begin before the Sun descends through +6 degrees.',
        },
        {
          season: season.label,
          dateISO: season.dateISO,
          window: window.label,
          boundary: 'End',
          value: window.value.end,
          fieldNote: window.label === 'Morning' ? 'The site-defined window ends near +6 degrees altitude.' : 'The site-defined window ends at sunset.',
        }
      );
    }
  }

  return {
    kind: 'golden-hour-shot-plan',
    rows,
    dataset: {
      filename: guide.csvDefinition.filenameStem,
      metadata: [
        ...baseMetadata(guide),
        { key: 'location_name', value: locationName },
        { key: 'latitude', value: latitude },
        { key: 'longitude', value: longitude },
        { key: 'timezone', value: timezone },
        { key: 'golden_hour_definition', value: 'Morning sunrise to +6 degrees; evening +6 degrees to sunset.' },
      ],
      columns: guide.csvDefinition.columns,
      rows: rows.map((row) => [
        row.season,
        row.window,
        row.boundary,
        row.value?.localTime ?? 'Unavailable',
        row.value?.azimuthDeg.toFixed(2) ?? '',
        row.value?.altitudeDeg.toFixed(2) ?? '',
        row.fieldNote,
      ]),
    },
  };
}

function buildNrelSpaEvidence(guide: GuideDefinition): NrelSpaEvidence {
  const result = getSolarValidationResult('nrel-spa-golden-2003');
  if (!result || result.kind !== 'position') {
    throw new Error('NREL SPA validation benchmark is unavailable.');
  }
  const rows = [
    {
      angle: 'Azimuth' as const,
      expectedDeg: result.benchmark.expected.azimuthDeg,
      actualDeg: result.actual.azimuthDeg,
      deltaDeg: result.delta.azimuthDeg,
      toleranceDeg: result.benchmark.toleranceDeg,
      passed: result.delta.azimuthDeg <= result.benchmark.toleranceDeg,
    },
    {
      angle: 'Altitude' as const,
      expectedDeg: result.benchmark.expected.altitudeDeg,
      actualDeg: result.actual.altitudeDeg,
      deltaDeg: result.delta.altitudeDeg,
      toleranceDeg: result.benchmark.toleranceDeg,
      passed: result.delta.altitudeDeg <= result.benchmark.toleranceDeg,
    },
  ];

  return {
    kind: 'nrel-spa-benchmark',
    input: result.benchmark.input,
    rows,
    passed: result.passed,
    dataset: {
      filename: guide.csvDefinition.filenameStem,
      metadata: [
        ...baseMetadata(guide),
        { key: 'external_source', value: result.benchmark.source.label },
        { key: 'source_snapshot_date', value: result.benchmark.source.retrievedDate },
        { key: 'latitude', value: result.benchmark.input.latitude },
        { key: 'longitude', value: result.benchmark.input.longitude },
        { key: 'instant_utc', value: result.benchmark.input.instantISO },
        { key: 'azimuth_convention', value: 'Clockwise from true north, 0-360 degrees' },
      ],
      columns: guide.csvDefinition.columns,
      rows: rows.map((row) => [
        row.angle,
        row.expectedDeg.toFixed(5),
        row.actualDeg.toFixed(5),
        row.deltaDeg.toFixed(5),
        row.toleranceDeg.toFixed(2),
        row.passed ? 'Pass' : 'Fail',
      ]),
    },
  };
}

function buildShadowDirectionEvidence(guide: GuideDefinition): ShadowDirectionEvidence {
  const { latitude, longitude, timezone, locationName } = guide.example;
  const dateISO = guide.example.dates[0]?.dateISO;
  if (!dateISO) {
    throw new Error('Shadow direction example date is unavailable.');
  }
  const objectHeightM = 2;
  const localTimes = guide.example.dates[0]?.localTimes ?? [];
  const rows = localTimes.map((localTime) => {
    const position = computeSolarPositionAtLocalTime(
      latitude,
      longitude,
      dateISO,
      localTime,
      timezone
    );
    const shadow = calculateShadowGeometry(
      position.azimuthDeg,
      position.altitudeDeg,
      objectHeightM
    );
    return {
      dateISO,
      localTime,
      objectHeightM,
      position,
      ...shadow,
    };
  });

  return {
    kind: 'shadow-direction-model',
    rows,
    dataset: {
      filename: guide.csvDefinition.filenameStem,
      metadata: [
        ...baseMetadata(guide),
        { key: 'location_name', value: locationName },
        { key: 'latitude', value: latitude },
        { key: 'longitude', value: longitude },
        { key: 'timezone', value: timezone },
        { key: 'shadow_bearing_formula', value: '(solar azimuth + 180) mod 360' },
        { key: 'shadow_length_formula', value: 'object height / tan(solar altitude)' },
      ],
      columns: guide.csvDefinition.columns,
      rows: rows.map((row) => [
        row.dateISO,
        row.localTime,
        row.objectHeightM.toFixed(2),
        row.position.azimuthDeg.toFixed(2),
        row.position.altitudeDeg.toFixed(2),
        row.shadowBearingDeg?.toFixed(2) ?? '',
        row.shadowLengthM?.toFixed(2) ?? '',
        row.shadowLengthM === null ? 'Unavailable: solar altitude is at or below 0 degrees' : 'Available',
      ]),
    },
  };
}

export function buildGuideEvidenceData(guide: GuideDefinition): GuideEvidenceData {
  switch (guide.evidenceKey) {
    case 'sun-path-diagram':
      return buildSunPathDiagramEvidence(guide);
    case 'seasonal-comparison':
      return buildSeasonalComparisonEvidence(guide);
    case 'facade-orientation-matrix':
      return buildFacadeOrientationEvidence(guide);
    case 'golden-hour-shot-plan':
      return buildGoldenHourShotPlanEvidence(guide);
    case 'nrel-spa-benchmark':
      return buildNrelSpaEvidence(guide);
    case 'shadow-direction-model':
      return buildShadowDirectionEvidence(guide);
  }
}

export function buildGuideEvidenceCsvDataset(guide: GuideDefinition): CsvDataset {
  return buildGuideEvidenceData(guide).dataset;
}

export function formatEvidenceDirection(azimuthDeg: number): string {
  return `${azimuthDeg.toFixed(1)}° ${getCardinalDirection(azimuthDeg)}`;
}
