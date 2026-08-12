import Script from 'next/script';
import { getAdSenseSettings, hasAdSenseScriptConfig } from '@/lib/adsense';

export function AdSenseScript() {
  const settings = getAdSenseSettings();

  if (!hasAdSenseScriptConfig(settings)) {
    return null;
  }

  return (
    <Script
      id="adsense-script"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(settings.clientId)}`}
      strategy="afterInteractive"
      crossOrigin="anonymous"
    />
  );
}
