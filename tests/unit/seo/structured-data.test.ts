import { afterEach, describe, expect, it } from 'vitest';
import {
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
          url: 'https://solarpathtracker.example/about#contact',
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
