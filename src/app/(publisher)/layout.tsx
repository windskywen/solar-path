import { AdSenseScript } from '@/components/ads/AdSenseScript';

export default function PublisherLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <AdSenseScript />
      {children}
    </>
  );
}
