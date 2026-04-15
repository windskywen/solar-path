'use client';

import { AdSlot } from './AdSlot';
import { getAdSenseSettings, hasSidebarAdSlotConfig } from '@/lib/adsense';

export interface SidebarAdPanelProps {
  className?: string;
}

export function SidebarAdPanel({ className = '' }: SidebarAdPanelProps) {
  const settings = getAdSenseSettings();

  if (!hasSidebarAdSlotConfig(settings)) {
    return null;
  }

  return (
    <section aria-labelledby="sponsored-placement-heading" className={className}>
      <div className="border-b [border-color:var(--solar-divider)] px-4 pb-4 pt-4 sm:px-5 sm:pt-5">
        <p className="text-[0.64rem] font-semibold uppercase tracking-[0.28em] text-[var(--solar-kicker)]">
          Manual ad slot
        </p>
        <h2
          id="sponsored-placement-heading"
          className="mt-2 text-lg font-semibold tracking-[-0.02em] text-[var(--solar-text-strong)] sm:text-xl"
        >
          Sponsored placement
        </h2>
        <p className="mt-1 text-sm text-[var(--solar-text)]">
          A single responsive ad unit lives below the hourly table so the map and 3D controls
          stay unobstructed.
        </p>
      </div>

      <div className="p-4 sm:p-5">
        <AdSlot slot={settings.sidebarSlotId} testId="sidebar-ad-slot" />
      </div>
    </section>
  );
}
