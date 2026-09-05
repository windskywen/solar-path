import { afterEach, describe, expect, it } from 'vitest';
import {
  buildArticleStructuredData,
  buildBreadcrumbStructuredData,
  buildFaqStructuredData,
  buildOrganizationStructuredData,
  buildWebPageStructuredData,
} from '@/lib/structured-data';

const originalEnv = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
};

function restoreEnv() {
  if (originalEnv.siteUrl === undefined) {
    delete process.env.NEXT_PUBLIC_SITE_URL;
  } else {
    process.env.NEXT_PUBLIC_SITE_URL = originalEnv.siteUrl;
  }
}

afterEach(() => {
  restoreEnv();
});

describe('structured data builders', () => {
  it('builds organization and webpage URLs from NEXT_PUBLIC_SITE_URL', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://solarpathtracker.example';

    expect(buildOrganizationStructuredData()).toMatchObject({
      '@type': 'Organization',
      url: 'https://solarpathtracker.example/',
      contactPoint: [
        {
          url: 'https://solarpathtracker.example/contact',
        },
      ],
    });

    expect(
      buildWebPageStructuredData({
        path: '/golden-hour-calculator',
        title: 'Golden Hour Calculator',
        description: 'Plan the warm-light window.',
      })
    ).toMatchObject({
      '@type': 'WebPage',
      url: 'https://solarpathtracker.example/golden-hour-calculator',
    });
  });

  it('builds article dates, organization author, keywords, and canonical entity URL', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://solarpathtracker.example';

    expect(
      buildArticleStructuredData({
        path: '/guides/example',
        title: 'Example Guide',
        description: 'A reproducible example.',
        publishedDate: '2026-08-10',
        modifiedDate: '2026-08-11',
        keywords: ['solar example'],
      })
    ).toMatchObject({
      '@type': 'Article',
      url: 'https://solarpathtracker.example/guides/example',
      mainEntityOfPage: 'https://solarpathtracker.example/guides/example',
      datePublished: '2026-08-10',
      dateModified: '2026-08-11',
      author: {
        '@type': 'Organization',
        name: 'Solar Path Tracker',
      },
      keywords: ['solar example'],
    });
  });

  it('creates ordered breadcrumb items with absolute URLs', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://solarpathtracker.example';

    expect(
      buildBreadcrumbStructuredData([
        { name: 'Home', path: '/' },
        { name: 'Golden Hour Calculator', path: '/golden-hour-calculator' },
      ])
    ).toMatchObject({
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          position: 1,
          item: 'https://solarpathtracker.example/',
        },
        {
          position: 2,
          item: 'https://solarpathtracker.example/golden-hour-calculator',
        },
      ],
    });
  });

  it('creates faq schema entries for each question', () => {
    expect(
      buildFaqStructuredData([
        {
          question: 'What is golden hour?',
          answer: 'It is the warm-light window near sunrise or sunset.',
        },
      ])
    ).toMatchObject({
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is golden hour?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'It is the warm-light window near sunrise or sunset.',
          },
        },
      ],
    });
  });
});
