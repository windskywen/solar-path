import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Providers } from '@/components/providers/Providers';
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
    'Visualize the sun\'s path across the sky for any location and date. See sunrise, sunset, solar altitude, and azimuth.',
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
    description: 'Visualize the sun\'s path across the sky for any location and date.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0066cc',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-full`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
