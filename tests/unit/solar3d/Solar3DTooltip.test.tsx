import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Solar3DTooltip } from '@/components/solar3d/Solar3DTooltip';

describe('Solar3DTooltip', () => {
  it('shows a compact observatory readout with cardinal direction', () => {
    render(
      <Solar3DTooltip
        data={{
          x: 980,
          y: 24,
          hour: 12,
          localTimeLabel: '12:00',
          azimuthDeg: 181.2,
          altitudeDeg: 64.35,
          daylightState: 'day',
        }}
      />
    );

    const tooltip = screen.getByTestId('solar-3d-tooltip');
    expect(tooltip).toBeVisible();
    expect(tooltip.style.getPropertyValue('--tooltip-x')).toBe('992px');
    expect(tooltip.style.getPropertyValue('--tooltip-y')).toBe('14px');
    expect(tooltip.className).toContain('left-[clamp');
    expect(tooltip.className).toContain('top-[clamp');
    expect(screen.getByText('12:00')).toBeVisible();
    expect(screen.getByText('Daylight')).toBeVisible();
    expect(screen.getByText('181.2°')).toBeVisible();
    expect(screen.getByText('S')).toBeVisible();
    expect(screen.getByText('+64.3°')).toBeVisible();
  });

  it('renders nothing without hovered sun data', () => {
    const { container } = render(<Solar3DTooltip data={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});
