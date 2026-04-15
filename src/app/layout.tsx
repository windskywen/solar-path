import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { AdSenseScript } from '@/components/ads/AdSenseScript';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { SITE_DESCRIPTION, SITE_KEYWORDS, SITE_LOCALE, SITE_NAME, absoluteUrl, getSiteUrl } from '@/lib/site';
import { Providers } from '@/components/providers/Providers';
import { buildThemeInitScript, THEME_META_COLORS } from '@/lib/theme/theme';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [...SITE_KEYWORDS],
  authors: [{ name: SITE_NAME, url: absoluteUrl('/about') }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: 'technology',
  referrer: 'origin-when-cross-origin',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    type: 'website',
    locale: SITE_LOCALE,
    siteName: SITE_NAME,
    url: '/',
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: THEME_META_COLORS.dark,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning: Browser extensions (password managers, etc.) inject
    // attributes like fdprocessedid that cause harmless hydration mismatches
    <html lang="en" className="h-full" data-theme="dark" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased h-full`}>
        <script
          dangerouslySetInnerHTML={{
            __html: buildThemeInitScript(),
          }}
        />
        <AdSenseScript />
        <Providers>
          <div className="solar-main-shell relative flex min-h-screen flex-col">
            <div className="flex-1">{children}</div>
            <SiteFooter />
          </div>
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
