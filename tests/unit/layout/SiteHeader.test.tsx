import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SiteHeader } from '@/components/layout/SiteHeader';

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

vi.mock('@/components/theme/ThemeSwitcher', () => ({
  ThemeSwitcher: () => <button type="button">Theme</button>,
}));

describe('SiteHeader', () => {
  it('uses one calculator link set in the desktop and mobile navigation', () => {
    render(<SiteHeader />);

    fireEvent.click(screen.getByRole('button', { name: 'Calculators' }));
    const desktopNavigation = screen.getByRole('navigation', {
      name: 'Calculator navigation',
    });
    expect(desktopNavigation).toHaveTextContent('Sunrise & Sunset');
    expect(desktopNavigation).toHaveTextContent('Golden Hour');
    expect(desktopNavigation).toHaveTextContent('Azimuth & Altitude');

    fireEvent.click(screen.getByRole('button', { name: /Menu/ }));
    const mobileNavigation = screen.getByRole('navigation', {
      name: 'Mobile primary navigation',
    });
    expect(mobileNavigation).toHaveTextContent('Sun Path Map');
    expect(mobileNavigation).toHaveTextContent('Sunrise & Sunset');
    expect(mobileNavigation).toHaveTextContent('Guides');
    expect(mobileNavigation).toHaveTextContent('Methodology');
    expect(mobileNavigation).toHaveTextContent('About');
  });

  it('closes the mobile navigation with Escape and restores trigger focus', () => {
    render(<SiteHeader />);
    const menuButton = screen.getByRole('button', { name: /Menu/ });

    fireEvent.click(menuButton);
    expect(
      screen.getByRole('navigation', { name: 'Mobile primary navigation' })
    ).toBeVisible();

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(
      screen.queryByRole('navigation', { name: 'Mobile primary navigation' })
    ).not.toBeInTheDocument();
    expect(menuButton).toHaveFocus();
  });

  it('closes the mobile navigation after a link is selected', () => {
    render(<SiteHeader />);
    fireEvent.click(screen.getByRole('button', { name: /Menu/ }));
    const mobileNavigation = screen.getByRole('navigation', {
      name: 'Mobile primary navigation',
    });
    fireEvent.click(within(mobileNavigation).getByRole('link', { name: 'Guides' }));

    expect(
      screen.queryByRole('navigation', { name: 'Mobile primary navigation' })
    ).not.toBeInTheDocument();
  });
});
