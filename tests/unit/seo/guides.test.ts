import { afterEach, describe, expect, it } from 'vitest';
import sitemap from '@/app/sitemap';
import { GUIDES, GUIDE_SLUGS, getGuide } from '@/lib/guides';
import { computeSolarPositionAtLocalTime } from '@/lib/solar/extended-events';

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
  });
});
