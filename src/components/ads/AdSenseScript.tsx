import Script from 'next/script';
import { getAdSenseSettings, hasAdSenseScriptConfig } from '@/lib/adsense';

export function AdSenseScript() {
  const settings = getAdSenseSettings();

  if (!hasAdSenseScriptConfig(settings)) {
    return null;
  }

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-before-interactive-script-outside-document -- In the App Router, root-layout beforeInteractive scripts are injected into <head>, which matches AdSense's implementation guidance. */}
      <Script
        id="adsense-script"
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(settings.clientId)}`}
        strategy="beforeInteractive"
        crossOrigin="anonymous"
      />
    </>
  );
}
