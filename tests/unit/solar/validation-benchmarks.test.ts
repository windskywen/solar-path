import { describe, expect, it } from 'vitest';
import packageJson from '../../../package.json';
import { SOLAR_MODEL_INFO } from '@/lib/solar/model-info';
import {
  SOLAR_VALIDATION_BENCHMARKS,
  circularAngleDifference,
  evaluateAllSolarValidationBenchmarks,
  localTimeDifferenceMinutes,
} from '@/lib/solar/validation-benchmarks';

describe('solar validation benchmarks', () => {
  it('keeps the declared model dependency versions aligned with package.json', () => {
    expect(packageJson.dependencies.suncalc).toBe(`^${SOLAR_MODEL_INFO.dependencies.suncalc}`);
    expect(packageJson.dependencies.luxon).toBe(`^${SOLAR_MODEL_INFO.dependencies.luxon}`);
    expect(packageJson.dependencies['@photostructure/tz-lookup']).toBe(
      `^${SOLAR_MODEL_INFO.dependencies.timezoneLookup}`
    );
  });

  it('contains one position, three event, and one grouped polar benchmark', () => {
    expect(SOLAR_VALIDATION_BENCHMARKS).toHaveLength(5);
    expect(SOLAR_VALIDATION_BENCHMARKS.map((entry) => entry.kind)).toEqual([
      'position',
      'events',
      'events',
      'events',
      'polar',
    ]);
  });

  it('passes every fixed independent benchmark', () => {
    const results = evaluateAllSolarValidationBenchmarks();
    expect(results).toHaveLength(5);
    expect(results.every((entry) => entry.passed)).toBe(true);
  });

  it('uses circular angle and cross-midnight time differences', () => {
    expect(circularAngleDifference(359.8, 0.2)).toBeCloseTo(0.4, 8);
    expect(localTimeDifferenceMinutes('23:59', '00:01')).toBe(2);
  });
});
