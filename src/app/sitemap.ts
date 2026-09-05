import type { MetadataRoute } from 'next';
import { GUIDES } from '@/lib/guides';
import { absoluteUrl } from '@/lib/site';

const UPDATED_2026_08_12 = new Date('2026-08-12T00:00:00Z');
const UPDATED_2026_08_24 = new Date('2026-08-24T00:00:00Z');

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl('/'),
      lastModified: UPDATED_2026_08_24,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: absoluteUrl('/sunrise-sunset-calculator'),
      lastModified: UPDATED_2026_08_24,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: absoluteUrl('/golden-hour-calculator'),
      lastModified: UPDATED_2026_08_24,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: absoluteUrl('/solar-azimuth-altitude'),
      lastModified: UPDATED_2026_08_24,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: absoluteUrl('/guides'),
      lastModified: UPDATED_2026_08_24,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: absoluteUrl('/methodology'),
      lastModified: UPDATED_2026_08_24,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: absoluteUrl('/about'),
      lastModified: UPDATED_2026_08_24,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: absoluteUrl('/contact'),
      lastModified: UPDATED_2026_08_12,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: absoluteUrl('/privacy'),
      lastModified: UPDATED_2026_08_24,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: absoluteUrl('/terms'),
      lastModified: UPDATED_2026_08_12,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  const guidePages: MetadataRoute.Sitemap = GUIDES.map((guide) => ({
    url: absoluteUrl(`/guides/${guide.slug}`),
    lastModified: new Date(`${guide.modifiedDate}T00:00:00Z`),
    changeFrequency: 'monthly',
    priority: 0.75,
  }));

  return [...staticPages, ...guidePages];
}
