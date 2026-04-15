import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: absoluteUrl('/'),
      lastModified,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: absoluteUrl('/about'),
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: absoluteUrl('/privacy'),
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: absoluteUrl('/sunrise-sunset-calculator'),
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: absoluteUrl('/golden-hour-calculator'),
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: absoluteUrl('/solar-azimuth-altitude'),
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ];
}
