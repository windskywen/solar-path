import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HomeSeoContent } from '@/components/home/HomeSeoContent';

describe('HomeSeoContent', () => {
  it('renders Tier S guidance, visible FAQs, and descriptive internal links without client state', () => {
    render(<HomeSeoContent />);

    expect(screen.getByRole('heading', { name: 'Check a sun path for a place, date, and time' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'A calculated solar position, not a live sensor' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'What does a sun path map show?' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Does the map include terrain, buildings, trees, or weather?' })).toBeVisible();

    expect(screen.getByRole('link', { name: 'Sunrise & Sunset Calculator' })).toHaveAttribute(
      'href',
      '/sunrise-sunset-calculator'
    );
    expect(screen.getByRole('link', { name: 'Sun Position & Angle Calculator' })).toHaveAttribute(
      'href',
      '/solar-azimuth-altitude'
    );
    expect(screen.getByRole('link', { name: 'How to Read a Sun Path Diagram' })).toHaveAttribute(
      'href',
      '/guides/how-to-read-a-sun-path-diagram'
    );
  });
});
