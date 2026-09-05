import { ImageResponse } from 'next/og';
import { SeoImageCard } from '@/lib/seo-image';

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(<SeoImageCard />, size);
}
