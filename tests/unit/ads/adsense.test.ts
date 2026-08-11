import { afterEach, describe, expect, it } from 'vitest';
import {
  getAdSenseSettings,
  hasAdSenseScriptConfig,
  hasArticleAdSlotConfig,
  hasSidebarAdSlotConfig,
  hasToolAdSlotConfig,
} from '@/lib/adsense';

const originalEnv = {
  enabled: process.env.NEXT_PUBLIC_ADSENSE_ENABLED,
  clientId: process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID,
  sidebarSlotId: process.env.NEXT_PUBLIC_ADSENSE_SIDEBAR_SLOT_ID,
  toolSlotId: process.env.NEXT_PUBLIC_ADSENSE_TOOL_SLOT_ID,
  articleSlotId: process.env.NEXT_PUBLIC_ADSENSE_ARTICLE_SLOT_ID,
};

function restoreEnv() {
  if (originalEnv.enabled === undefined) {
    delete process.env.NEXT_PUBLIC_ADSENSE_ENABLED;
  } else {
    process.env.NEXT_PUBLIC_ADSENSE_ENABLED = originalEnv.enabled;
  }

  if (originalEnv.clientId === undefined) {
    delete process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
  } else {
    process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID = originalEnv.clientId;
  }

  if (originalEnv.sidebarSlotId === undefined) {
    delete process.env.NEXT_PUBLIC_ADSENSE_SIDEBAR_SLOT_ID;
  } else {
    process.env.NEXT_PUBLIC_ADSENSE_SIDEBAR_SLOT_ID = originalEnv.sidebarSlotId;
  }

  if (originalEnv.toolSlotId === undefined) {
    delete process.env.NEXT_PUBLIC_ADSENSE_TOOL_SLOT_ID;
  } else {
    process.env.NEXT_PUBLIC_ADSENSE_TOOL_SLOT_ID = originalEnv.toolSlotId;
  }

  if (originalEnv.articleSlotId === undefined) {
    delete process.env.NEXT_PUBLIC_ADSENSE_ARTICLE_SLOT_ID;
  } else {
    process.env.NEXT_PUBLIC_ADSENSE_ARTICLE_SLOT_ID = originalEnv.articleSlotId;
  }
}

afterEach(() => {
  restoreEnv();
});

describe('adsense settings', () => {
  it('enables the global script when the publisher ID is configured', () => {
    process.env.NEXT_PUBLIC_ADSENSE_ENABLED = 'true';
    process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID = 'ca-pub-5483347501870595';
    delete process.env.NEXT_PUBLIC_ADSENSE_SIDEBAR_SLOT_ID;
    delete process.env.NEXT_PUBLIC_ADSENSE_TOOL_SLOT_ID;
    delete process.env.NEXT_PUBLIC_ADSENSE_ARTICLE_SLOT_ID;

    const settings = getAdSenseSettings();

    expect(settings).toEqual({
      enabled: true,
      clientId: 'ca-pub-5483347501870595',
      sidebarSlotId: '',
      toolSlotId: '',
      articleSlotId: '',
    });
    expect(hasAdSenseScriptConfig(settings)).toBe(true);
    expect(hasSidebarAdSlotConfig(settings)).toBe(false);
  });

  it('requires a dedicated slot id before rendering the manual sidebar ad', () => {
    process.env.NEXT_PUBLIC_ADSENSE_ENABLED = 'true';
    process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID = 'ca-pub-5483347501870595';
    process.env.NEXT_PUBLIC_ADSENSE_SIDEBAR_SLOT_ID = '1234567890';

    const settings = getAdSenseSettings();

    expect(hasAdSenseScriptConfig(settings)).toBe(true);
    expect(hasSidebarAdSlotConfig(settings)).toBe(true);
  });

  it('requires dedicated tool and article slot ids before rendering those units', () => {
    process.env.NEXT_PUBLIC_ADSENSE_ENABLED = 'true';
    process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID = 'ca-pub-5483347501870595';
    process.env.NEXT_PUBLIC_ADSENSE_TOOL_SLOT_ID = '2345678901';
    process.env.NEXT_PUBLIC_ADSENSE_ARTICLE_SLOT_ID = '3456789012';

    const settings = getAdSenseSettings();

    expect(hasToolAdSlotConfig(settings)).toBe(true);
    expect(hasArticleAdSlotConfig(settings)).toBe(true);
  });

  it('keeps every script and slot disabled in review mode even when ids are present', () => {
    process.env.NEXT_PUBLIC_ADSENSE_ENABLED = 'false';
    process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID = 'ca-pub-5483347501870595';
    process.env.NEXT_PUBLIC_ADSENSE_SIDEBAR_SLOT_ID = '1234567890';
    process.env.NEXT_PUBLIC_ADSENSE_TOOL_SLOT_ID = '2345678901';
    process.env.NEXT_PUBLIC_ADSENSE_ARTICLE_SLOT_ID = '3456789012';

    const settings = getAdSenseSettings();

    expect(hasAdSenseScriptConfig(settings)).toBe(false);
    expect(hasSidebarAdSlotConfig(settings)).toBe(false);
    expect(hasToolAdSlotConfig(settings)).toBe(false);
    expect(hasArticleAdSlotConfig(settings)).toBe(false);
  });
});
