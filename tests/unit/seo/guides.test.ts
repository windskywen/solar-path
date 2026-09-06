import { afterEach, describe, expect, it } from 'vitest';
import sitemap from '@/app/sitemap';
import {
  buildGuideEvidenceCsvDataset,
  buildGuideEvidenceData,
  calculateShadowGeometry,
  getCameraBearingForLightingSetup,
} from '@/lib/guide-evidence';
import { GUIDES, GUIDE_EVIDENCE_KEYS, GUIDE_SLUGS, getGuide } from '@/lib/guides';
import { computeSolarPositionAtLocalTime } from '@/lib/solar/extended-events';
import { serializeCsv } from '@/lib/utils/csv';

const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

afterEach(() => {
  if (originalSiteUrl === undefined) {
    delete process.env.NEXT_PUBLIC_SITE_URL;
  } else {
    process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
  }
});

describe('guide registry', () => {
  it('contains the six planned, independently addressable guides', () => {
    expect(GUIDES).toHaveLength(6);
    expect(GUIDES.map((guide) => guide.slug)).toEqual(GUIDE_SLUGS);
    expect(new Set(GUIDES.map((guide) => guide.title)).size).toBe(6);
    expect(new Set(GUIDES.map((guide) => guide.description)).size).toBe(6);
    expect(GUIDES.map((guide) => guide.evidenceKey)).toEqual(GUIDE_EVIDENCE_KEYS);
    expect(new Set(GUIDES.map((guide) => guide.contentTypeLabel)).size).toBe(6);
  });

  it('uses the organization author and exactly three valid related guides', () => {
    for (const guide of GUIDES) {
      expect(guide.author).toBe('Solar Path Tracker');
      expect(guide.relatedGuides).toHaveLength(3);
      expect(new Set(guide.relatedGuides).size).toBe(3);
      expect(guide.relatedGuides).not.toContain(guide.slug);
      for (const relatedSlug of guide.relatedGuides) {
        expect(getGuide(relatedSlug)).toBeDefined();
      }
    }
  });

  it('maps every Tier S or Tier A supporting guide to an existing live tool', () => {
    const expectedTools: Record<string, readonly string[]> = {
      'how-to-read-a-sun-path-diagram': ['/'],
      'brisbane-winter-vs-summer-sun-path': ['/', '/sunrise-sunset-calculator'],
      'east-vs-west-facing-homes-australia': ['/solar-azimuth-altitude'],
      'golden-hour-direction-brisbane': ['/golden-hour-calculator', '/', '/sunrise-sunset-calculator'],
      'solar-azimuth-altitude-worked-example': ['/solar-azimuth-altitude'],
      'estimating-shadow-direction-from-solar-angles': ['/solar-azimuth-altitude'],
    };
    for (const guide of GUIDES) {
      expect(guide.modifiedDate).toBe(guide.evidenceKey === 'nrel-spa-benchmark' ? '2026-08-24' : guide.slug === 'golden-hour-direction-brisbane' ? '2026-09-07' : '2026-09-06');
      expect(guide.relatedTools?.map((tool) => tool.href)).toEqual(expectedTools[guide.slug]);
      for (const tool of guide.relatedTools ?? []) {
        expect(tool.label.length).toBeGreaterThan(8);
        expect(tool.description.length).toBeGreaterThan(20);
      }
    }
  });

  it('defines a reproducible user task for the three expanded application cases', () => {
    const expandedSlugs = [
      'brisbane-winter-vs-summer-sun-path',
      'golden-hour-direction-brisbane',
      'estimating-shadow-direction-from-solar-angles',
    ] as const;

    for (const slug of expandedSlugs) {
      const guide = getGuide(slug);
      expect(guide?.applicationCase?.task.length).toBeGreaterThan(60);
      expect(guide?.applicationCase?.assumptions.length).toBeGreaterThanOrEqual(3);
      expect(guide?.applicationCase?.reproduction.steps).toHaveLength(4);
      expect(guide?.applicationCase?.reproduction.toolHref).toMatch(/^\//);
    }

    expect(GUIDES.filter((guide) => guide.applicationCase)).toHaveLength(3);
  });

  it('provides a unique source-backed CSV contract for every evidence page', () => {
    const filenames = new Set<string>();
    for (const guide of GUIDES) {
      expect(guide.evidenceSources.length).toBeGreaterThan(0);
      expect(guide.csvDefinition.columns.length).toBeGreaterThan(3);

      const dataset = buildGuideEvidenceCsvDataset(guide);
      expect(dataset.columns).toEqual(guide.csvDefinition.columns);
      expect(dataset.rows.length).toBeGreaterThan(0);
      expect(filenames.has(dataset.filename)).toBe(false);
      filenames.add(dataset.filename);

      const serialized = serializeCsv(dataset);
      expect(serialized.startsWith('\uFEFF')).toBe(true);
      expect(serialized).toContain(guide.csvDefinition.columns.join(','));
    }
  });

  it('keeps every fixed example reproducible through the production solar engine', () => {
    for (const guide of GUIDES) {
      expect(guide.example.dates.length).toBeGreaterThan(0);
      for (const date of guide.example.dates) {
        expect(date.localTimes.length).toBeGreaterThan(0);
        for (const localTime of date.localTimes) {
          const position = computeSolarPositionAtLocalTime(
            guide.example.latitude,
            guide.example.longitude,
            date.dateISO,
            localTime,
            guide.example.timezone
          );
          expect(Number.isFinite(position.azimuthDeg)).toBe(true);
          expect(Number.isFinite(position.altitudeDeg)).toBe(true);
        }
      }
    }
  });
});

describe('guide application-case geometry', () => {
  it('places the camera correctly for front, side, and back light', () => {
    const sunBearing = 300.2;
    expect(getCameraBearingForLightingSetup(sunBearing, 'front')).toBeCloseTo(300.2, 5);
    expect(getCameraBearingForLightingSetup(sunBearing, 'side')).toBeCloseTo(30.2, 5);
    expect(getCameraBearingForLightingSetup(sunBearing, 'back')).toBeCloseTo(120.2, 5);
  });

  it('reverses a solar bearing, scales length with height, and stops below the horizon', () => {
    const twoMetres = calculateShadowGeometry(70, 45, 2);
    const fourMetres = calculateShadowGeometry(70, 45, 4);

    expect(twoMetres.shadowBearingDeg).toBeCloseTo(250, 5);
    expect(twoMetres.shadowLengthM).toBeCloseTo(2, 5);
    expect(fourMetres.shadowLengthM).toBeCloseTo(4, 5);
    expect(calculateShadowGeometry(70, 0, 2)).toEqual({
      shadowBearingDeg: null,
      shadowLengthM: null,
    });
    expect(calculateShadowGeometry(70, -1, 2)).toEqual({
      shadowBearingDeg: null,
      shadowLengthM: null,
    });
  });

  it('uses the same engine-backed rows for case cards, tables, and CSV output', () => {
    const seasonalGuide = getGuide('brisbane-winter-vs-summer-sun-path');
    const goldenGuide = getGuide('golden-hour-direction-brisbane');
    const shadowGuide = getGuide('estimating-shadow-direction-from-solar-angles');
    expect(seasonalGuide).toBeDefined();
    expect(goldenGuide).toBeDefined();
    expect(shadowGuide).toBeDefined();

    const seasonal = buildGuideEvidenceData(seasonalGuide!);
    const golden = buildGuideEvidenceData(goldenGuide!);
    const shadow = buildGuideEvidenceData(shadowGuide!);
    if (seasonal.kind !== 'seasonal-comparison' || golden.kind !== 'golden-hour-shot-plan' || shadow.kind !== 'shadow-direction-model') {
      throw new Error('Expanded application-case evidence kinds do not match their guides.');
    }

    expect(seasonal.observations.map((row) => row.localTime)).toEqual(['08:00', '12:00', '16:00']);
    for (const observation of seasonal.observations) {
      expect(seasonal.seasons[0].positions).toContain(observation.winter);
      expect(seasonal.seasons[1].positions).toContain(observation.summer);
    }

    const winterEveningStart = golden.rows.find(
      (row) => row.season === 'Winter reference' && row.window === 'Evening' && row.boundary === 'Start'
    );
    expect(winterEveningStart?.value).toBeDefined();
    expect(golden.dataset.rows).toContainEqual(expect.arrayContaining([
      'Winter reference',
      'Evening',
      'Start',
      winterEveningStart?.value?.localTime,
    ]));

    const tenAm = shadow.rows.find((row) => row.localTime === '10:00');
    expect(tenAm).toBeDefined();
    expect(tenAm?.shadowBearingDeg).toBeCloseTo((tenAm!.position.azimuthDeg + 180) % 360, 5);
    expect(tenAm?.shadowLengthM).toBeCloseTo(
      tenAm!.objectHeightM / Math.tan((tenAm!.position.altitudeDeg * Math.PI) / 180),
      5
    );
  });
});
describe('public sitemap', () => {
  it('contains every tool, trust page, index, and guide exactly once', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://solarpathtracker.example';
    const entries = sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(new Set(urls).size).toBe(urls.length);
    expect(urls).toEqual(
      expect.arrayContaining([
        'https://solarpathtracker.example/',
        'https://solarpathtracker.example/sunrise-sunset-calculator',
        'https://solarpathtracker.example/golden-hour-calculator',
        'https://solarpathtracker.example/solar-azimuth-altitude',
        'https://solarpathtracker.example/guides',
        'https://solarpathtracker.example/methodology',
        'https://solarpathtracker.example/contact',
        'https://solarpathtracker.example/about',
        'https://solarpathtracker.example/privacy',
        'https://solarpathtracker.example/terms',
      ])
    );

    for (const guide of GUIDES) {
      const entry = entries.find(
        (candidate) => candidate.url === `https://solarpathtracker.example/guides/${guide.slug}`
      );
      expect(entry).toBeDefined();
      expect(entry?.lastModified).toEqual(new Date(`${guide.modifiedDate}T00:00:00Z`));
    }

    for (const [route, date] of Object.entries({ '/': '2026-09-07', '/sunrise-sunset-calculator': '2026-09-06', '/golden-hour-calculator': '2026-09-06', '/about': '2026-09-06', '/methodology': '2026-09-07', '/privacy': '2026-09-05' })) {
      const entry = entries.find((candidate) => candidate.url === `https://solarpathtracker.example${route}`);
      expect(entry?.lastModified).toEqual(new Date(`${date}T00:00:00Z`));
    }

    const guideIndex = entries.find(
      (candidate) => candidate.url === 'https://solarpathtracker.example/guides'
    );
    expect(guideIndex?.lastModified).toEqual(new Date('2026-09-06T00:00:00Z'));
  });
});
