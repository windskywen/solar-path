'use client';

import dynamic from 'next/dynamic';
import { memo, useEffect, useRef, useState } from 'react';
import type { ChartsPanelProps } from './ChartsPanel';

const LazyChartsPanel = dynamic(
  () => import('./ChartsPanel').then((module) => module.ChartsPanel),
  { ssr: false }
);

export interface DeferredChartsPanelProps extends ChartsPanelProps {
  /** Start loading before the chart reaches the viewport. */
  rootMargin?: string;
  /** Reserved vertical space while the chart bundle is loading. */
  minHeight?: number;
}

/**
 * Keeps Recharts out of the initial route bundle until the chart is close to view.
 * The reserved height prevents the surrounding content from shifting when it loads.
 */
export const DeferredChartsPanel = memo(function DeferredChartsPanel({
  rootMargin = '300px 0px',
  minHeight,
  defaultView = 'altitude',
  ...chartProps
}: DeferredChartsPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const reservedHeight = minHeight ?? (defaultView === 'both' ? 700 : 380);

  useEffect(() => {
    if (shouldLoad) return;

    if (typeof window.IntersectionObserver !== 'function') {
      const fallbackTimer = window.setTimeout(() => setShouldLoad(true), 0);
      return () => window.clearTimeout(fallbackTimer);
    }

    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting || entry.intersectionRatio > 0)) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin, threshold: 0.01 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [rootMargin, shouldLoad]);

  return (
    <div
      ref={containerRef}
      data-testid="deferred-charts-panel"
      data-state={shouldLoad ? 'loaded' : 'deferred'}
      style={{ minHeight: reservedHeight }}
    >
      {shouldLoad ? (
        <LazyChartsPanel {...chartProps} defaultView={defaultView} />
      ) : (
        <div
          aria-hidden="true"
          className="flex h-full min-h-[inherit] flex-col justify-center overflow-hidden rounded-[24px] border [border-color:var(--solar-surface-border)] [background:var(--solar-surface-bg)] p-4 [box-shadow:var(--solar-surface-inset-shadow)]"
        >
          <div className="h-3 w-28 animate-pulse rounded-full [background:var(--solar-pill-bg)]" />
          <div className="mt-5 h-56 animate-pulse rounded-[22px] [background:var(--solar-chart-card-bg)]" />
        </div>
      )}
    </div>
  );
});
