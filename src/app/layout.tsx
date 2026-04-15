import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
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
  title: 'Solar Path Tracker',
  description:
    "Visualize the sun's path across the sky for any location and date. See sunrise, sunset, solar altitude, and azimuth.",
  keywords: [
    'solar path',
    'sun position',
    'sunrise',
    'sunset',
    'solar altitude',
    'azimuth',
    'astronomy',
    'solar tracker',
  ],
  authors: [{ name: 'Solar Path Tracker' }],
  openGraph: {
    title: 'Solar Path Tracker',
    description: "Visualize the sun's path across the sky for any location and date.",
    type: 'website',
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
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
