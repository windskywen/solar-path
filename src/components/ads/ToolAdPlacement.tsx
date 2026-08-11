'use client';

import { AdSlot } from './AdSlot';
import { getAdSenseSettings, hasToolAdSlotConfig } from '@/lib/adsense';

export function ToolAdPlacement() {
  const settings = getAdSenseSettings();

  if (!hasToolAdSlotConfig(settings)) {
    return null;
  }

  return (
    <div className="rounded-[28px] border p-4 [border-color:var(--solar-glass-border)] [background:var(--solar-rail-bg)] [box-shadow:var(--solar-glass-shadow)] sm:p-5">
      <AdSlot slot={settings.toolSlotId} minHeight={250} testId="tool-ad-slot" />
    </div>
  );
}
