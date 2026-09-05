'use client';

import { AdSlot } from './AdSlot';
import { getAdSenseSettings, hasArticleAdSlotConfig } from '@/lib/adsense';

export function ArticleAdPlacement() {
  const settings = getAdSenseSettings();

  if (!hasArticleAdSlotConfig(settings)) {
    return null;
  }

  return (
    <div className="mt-4 rounded-[28px] border p-4 [border-color:var(--solar-glass-border)] [background:var(--solar-rail-bg)] [box-shadow:var(--solar-glass-shadow)] sm:p-5">
      <AdSlot slot={settings.articleSlotId} minHeight={250} testId="article-ad-slot" />
    </div>
  );
}
