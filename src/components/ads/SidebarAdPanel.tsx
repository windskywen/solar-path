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
    <div className={className}>
      <div className="p-4 sm:p-5">
        <AdSlot slot={settings.sidebarSlotId} testId="sidebar-ad-slot" minHeight={250} />
      </div>
    </div>
  );
}
