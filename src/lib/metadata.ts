import type { Metadata } from 'next';
import { SITE_KEYWORDS, SITE_LOCALE, SITE_NAME, getSiteUrl } from '@/lib/site';

interface BuildPageMetadataOptions {
  title: string;
  description: string;
  path?: string;
  keywords?: readonly string[];
  noIndex?: boolean;
}

function formatTitle(title: string): string {
  return title === SITE_NAME ? SITE_NAME : `${title} | ${SITE_NAME}`;
}

export function buildPageMetadata({
  title,
  description,
  path = '/',
  keywords = SITE_KEYWORDS,
  noIndex = false,
}: BuildPageMetadataOptions): Metadata {
  const resolvedTitle = formatTitle(title);

  return {
    metadataBase: getSiteUrl(),
    title,
    description,
    keywords: [...keywords],
    alternates: {
      canonical: path,
    },
    robots: {
      index: !noIndex,
      follow: !noIndex,
      googleBot: {
        index: !noIndex,
        follow: !noIndex,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
    openGraph: {
      type: 'website',
      locale: SITE_LOCALE,
      siteName: SITE_NAME,
      url: path,
      title: resolvedTitle,
      description,
      images: [
        {
          url: '/opengraph-image',
          width: 1200,
          height: 630,
          alt: `${SITE_NAME} preview image`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: resolvedTitle,
      description,
      images: ['/twitter-image'],
    },
  };
}
