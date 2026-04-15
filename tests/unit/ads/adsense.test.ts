import { afterEach, describe, expect, it } from 'vitest';
import { getAdSenseSettings, hasAdSenseScriptConfig, hasSidebarAdSlotConfig } from '@/lib/adsense';

const originalEnv = {
  enabled: process.env.NEXT_PUBLIC_ADSENSE_ENABLED,
  clientId: process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID,
  sidebarSlotId: process.env.NEXT_PUBLIC_ADSENSE_SIDEBAR_SLOT_ID,
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
}

afterEach(() => {
  restoreEnv();
});

describe('adsense settings', () => {
  it('enables the global script when the publisher ID is configured', () => {
    process.env.NEXT_PUBLIC_ADSENSE_ENABLED = 'true';
    process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID = 'ca-pub-5483347501870595';
    delete process.env.NEXT_PUBLIC_ADSENSE_SIDEBAR_SLOT_ID;

    const settings = getAdSenseSettings();

    expect(settings).toEqual({
      enabled: true,
      clientId: 'ca-pub-5483347501870595',
      sidebarSlotId: '',
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
});
