'use client';

import { useEffect, useMemo, useRef, type CSSProperties } from 'react';
import { getAdSenseSettings, hasAdSenseScriptConfig } from '@/lib/adsense';

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export interface AdSlotProps {
  slot: string;
  className?: string;
  format?: 'auto' | 'rectangle' | 'horizontal' | 'vertical';
  fullWidthResponsive?: boolean;
  minHeight?: number;
  style?: CSSProperties;
  testId?: string;
}

export function AdSlot({
  slot,
  className = '',
  format = 'auto',
  fullWidthResponsive = true,
  minHeight = 280,
  style,
  testId,
}: AdSlotProps) {
  const adRef = useRef<HTMLModElement | null>(null);
  const hasPushedRef = useRef(false);
  const settings = getAdSenseSettings();
  const isEnabled = hasAdSenseScriptConfig(settings) && slot.length > 0;

  const adStyle = useMemo<CSSProperties>(
    () => ({
      display: 'block',
      width: '100%',
      minHeight,
      ...style,
    }),
    [minHeight, style]
  );

  useEffect(() => {
    if (!isEnabled || !adRef.current || hasPushedRef.current) {
      return;
    }

    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});
      hasPushedRef.current = true;
    } catch (error) {
      const resolvedError =
        error instanceof Error ? error : new Error('Failed to initialize AdSense slot.');
      console.error('[adsense] Failed to initialize ad slot.', resolvedError);
    }
  }, [isEnabled]);

  if (!isEnabled) {
    return null;
  }

  return (
    <div
      className={`space-y-3 ${className}`.trim()}
      role="complementary"
      aria-label="Advertisement"
      data-testid={testId}
    >
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-[var(--solar-text-muted)]">
        Advertisement
      </p>

      <div className="rounded-[22px] border [border-color:var(--solar-surface-border)] [background:var(--solar-surface-bg)] p-3 [box-shadow:var(--solar-surface-inset-shadow)]">
        <ins
          ref={adRef}
          className="adsbygoogle block w-full overflow-hidden rounded-[16px]"
          style={adStyle}
          data-ad-client={settings.clientId}
          data-ad-slot={slot}
          data-ad-format={format}
          data-full-width-responsive={fullWidthResponsive ? 'true' : 'false'}
          data-adtest={process.env.NODE_ENV === 'production' ? undefined : 'on'}
        />
      </div>
    </div>
  );
}
