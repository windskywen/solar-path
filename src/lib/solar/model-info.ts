export const SOLAR_MODEL_INFO = {
  id: 'SPT-SUN-V1',
  reviewedDate: '2026-08-24',
  dependencies: {
    suncalc: '1.9.0',
    luxon: '3.7.2',
    timezoneLookup: '11.3.0',
  },
  summary:
    'SunCalc solar geometry normalized clockwise from true north, with Luxon and coordinate-based IANA timezone resolution.',
} as const;
