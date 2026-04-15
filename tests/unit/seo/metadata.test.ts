import { afterEach, describe, expect, it } from 'vitest';
import { buildPageMetadata } from '@/lib/metadata';
import { absoluteUrl, getSiteUrl } from '@/lib/site';

const originalEnv = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
  vercelProjectUrl: process.env.VERCEL_PROJECT_PRODUCTION_URL,
  vercelUrl: process.env.VERCEL_URL,
};

function restoreEnv() {
  if (originalEnv.siteUrl === undefined) {
    delete process.env.NEXT_PUBLIC_SITE_URL;
  } else {
    process.env.NEXT_PUBLIC_SITE_URL = originalEnv.siteUrl;
  }

  if (originalEnv.vercelProjectUrl === undefined) {
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
  } else {
    process.env.VERCEL_PROJECT_PRODUCTION_URL = originalEnv.vercelProjectUrl;
  }

  if (originalEnv.vercelUrl === undefined) {
    delete process.env.VERCEL_URL;
  } else {
    process.env.VERCEL_URL = originalEnv.vercelUrl;
  }
}

afterEach(() => {
  restoreEnv();
});

describe('site URL helpers', () => {
  it('normalizes NEXT_PUBLIC_SITE_URL without protocol', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'solarpathtracker.example';

    expect(getSiteUrl().toString()).toBe('https://solarpathtracker.example/');
    expect(absoluteUrl('/privacy')).toBe('https://solarpathtracker.example/privacy');
  });

  it('falls back to localhost when no deployment URL exists', () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
    delete process.env.VERCEL_URL;

    expect(getSiteUrl().toString()).toBe('http://localhost:3000/');
  });
});

describe('buildPageMetadata', () => {
  it('adds canonical, robots, and share metadata for indexable pages', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://solarpathtracker.example';

    const metadata = buildPageMetadata({
      title: 'About',
      description: 'About the app',
      path: '/about',
    });

    expect(metadata.alternates?.canonical).toBe('/about');
    expect(metadata.robots).toMatchObject({
      index: true,
      follow: true,
    });
    expect(metadata.openGraph?.url).toBe('/about');
    expect(metadata.twitter && 'card' in metadata.twitter ? metadata.twitter.card : undefined).toBe(
      'summary_large_image'
    );
  });
});
