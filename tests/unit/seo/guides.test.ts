import { afterEach, describe, expect, it } from 'vitest';
import sitemap from '@/app/sitemap';
import { buildGuideEvidenceCsvDataset } from '@/lib/guide-evidence';
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
      'golden-hour-direction-brisbane': ['/', '/sunrise-sunset-calculator'],
      'solar-azimuth-altitude-worked-example': ['/solar-azimuth-altitude'],
      'estimating-shadow-direction-from-solar-angles': ['/solar-azimuth-altitude'],
    };

    for (const guide of GUIDES) {
      expect(guide.modifiedDate).toBe('2026-08-24');
      expect(guide.relatedTools?.map((tool) => tool.href)).toEqual(expectedTools[guide.slug]);
      for (const tool of guide.relatedTools ?? []) {
        expect(tool.label.length).toBeGreaterThan(8);
        expect(tool.description.length).toBeGreaterThan(20);
      }
    }
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

    for (const route of ['/', '/sunrise-sunset-calculator', '/solar-azimuth-altitude']) {
      const entry = entries.find((candidate) => candidate.url === `https://solarpathtracker.example${route}`);
      expect(entry?.lastModified).toEqual(new Date('2026-08-24T00:00:00Z'));
    }
  });
});
