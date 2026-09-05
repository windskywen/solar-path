import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { AdSlot } from '@/components/ads/AdSlot';

const originalEnv = {
  enabled: process.env.NEXT_PUBLIC_ADSENSE_ENABLED,
  clientId: process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID,
  sidebarSlotId: process.env.NEXT_PUBLIC_ADSENSE_SIDEBAR_SLOT_ID,
};

function resetAdSenseEnv() {
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
  cleanup();
  resetAdSenseEnv();
  delete (window as Window & { adsbygoogle?: unknown[] }).adsbygoogle;
});

describe('AdSlot', () => {
  it('renders nothing when AdSense is disabled', () => {
    delete process.env.NEXT_PUBLIC_ADSENSE_ENABLED;
    delete process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

    render(<AdSlot slot="12345" testId="ad-slot" />);

    expect(screen.queryByTestId('ad-slot')).not.toBeInTheDocument();
  });

  it('renders the slot and pushes to adsbygoogle only once when configured', async () => {
    process.env.NEXT_PUBLIC_ADSENSE_ENABLED = 'true';
    process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID = 'ca-pub-1234567890';
    (window as Window & { adsbygoogle?: unknown[] }).adsbygoogle = [];

    const { rerender } = render(<AdSlot slot="12345" testId="ad-slot" />);

    const adSlot = await screen.findByTestId('ad-slot');
    const adElement = adSlot.querySelector('ins.adsbygoogle');

    expect(adElement).not.toBeNull();
    expect(adElement).toHaveAttribute('data-ad-client', 'ca-pub-1234567890');
    expect(adElement).toHaveAttribute('data-ad-slot', '12345');

    await waitFor(() => {
      expect((window as Window & { adsbygoogle?: unknown[] }).adsbygoogle).toHaveLength(1);
    });

    rerender(<AdSlot slot="12345" testId="ad-slot" className="rerendered" />);

    await waitFor(() => {
      expect((window as Window & { adsbygoogle?: unknown[] }).adsbygoogle).toHaveLength(1);
    });
  });
});
