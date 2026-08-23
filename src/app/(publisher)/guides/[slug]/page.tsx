import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AdSenseScript } from '@/components/ads/AdSenseScript';
import { GuideArticle } from '@/components/guides/GuideArticle';
import { GUIDES, getGuide } from '@/lib/guides';
import { buildPageMetadata } from '@/lib/metadata';
import {
  buildArticleStructuredData,
  buildBreadcrumbStructuredData,
} from '@/lib/structured-data';

interface GuidePageProps {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return GUIDES.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: GuidePageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug);

  if (!guide) {
    return buildPageMetadata({
      title: 'Guide not found',
      description: 'The requested Solar Path Tracker guide could not be found.',
      path: `/guides/${slug}`,
      noIndex: true,
    });
  }

  return buildPageMetadata({
    title: guide.title,
    description: guide.description,
    path: `/guides/${guide.slug}`,
    keywords: guide.keywords,
  });
}

export default async function GuidePage({ params }: GuidePageProps) {
  const { slug } = await params;
  const guide = getGuide(slug);

  if (!guide) {
    notFound();
  }

  const path = `/guides/${guide.slug}`;
  const structuredData = [
    buildArticleStructuredData({
      path,
      title: guide.title,
      description: guide.description,
      publishedDate: guide.publishedDate,
      modifiedDate: guide.modifiedDate,
      keywords: guide.keywords,
    }),
    buildBreadcrumbStructuredData([
      { name: 'Home', path: '/' },
      { name: 'Guides', path: '/guides' },
      { name: guide.title, path },
    ]),
  ];

  return (
    <>
      <AdSenseScript />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <GuideArticle guide={guide} />
    </>
  );
}
