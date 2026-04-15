import { SITE_CONTACT_EMAIL, SITE_DESCRIPTION, SITE_NAME, absoluteUrl } from '@/lib/site';

export interface StructuredDataBreadcrumbItem {
  name: string;
  path: string;
}

export interface StructuredDataFaqItem {
  question: string;
  answer: string;
}

interface WebPageStructuredDataOptions {
  path: string;
  title: string;
  description: string;
}

export function buildOrganizationStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: absoluteUrl('/'),
    description: SITE_DESCRIPTION,
    email: SITE_CONTACT_EMAIL,
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: SITE_CONTACT_EMAIL,
        url: absoluteUrl('/about#contact'),
      },
    ],
  };
}

export function buildWebPageStructuredData({
  path,
  title,
  description,
}: WebPageStructuredDataOptions) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title,
    url: absoluteUrl(path),
    description,
    isPartOf: {
      '@type': 'WebSite',
      name: SITE_NAME,
      url: absoluteUrl('/'),
    },
  };
}

export function buildBreadcrumbStructuredData(
  items: readonly StructuredDataBreadcrumbItem[]
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function buildFaqStructuredData(faqs: readonly StructuredDataFaqItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}
