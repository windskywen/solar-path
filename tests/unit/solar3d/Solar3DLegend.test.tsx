import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Solar3DLegend } from '@/components/solar3d/Solar3DLegend';
import { SOLAR_3D_COLORS, solarColorToCss } from '@/lib/solar3d/geometry';

describe('Solar3DLegend', () => {
  it('uses the shared observatory tokens for every rendered state', () => {
    render(<Solar3DLegend />);

    expect(
      screen.getByRole('complementary', {
        name: /Golden Hour, Daylight, Selected Hour, and Sun Path/i,
      })
    ).toBeVisible();
    expect(screen.getByText('Golden')).toBeVisible();
    expect(screen.getByText('Daylight')).toBeVisible();
    expect(screen.getByText('Selected')).toBeVisible();
    expect(screen.getByText('Path')).toBeVisible();

    expect(screen.getByText('Golden').previousElementSibling).toHaveStyle({
      backgroundColor: solarColorToCss(SOLAR_3D_COLORS.golden),
    });
    expect(screen.getByText('Daylight').previousElementSibling).toHaveStyle({
      backgroundColor: solarColorToCss(SOLAR_3D_COLORS.day),
    });
    expect(screen.getByText('Selected').previousElementSibling).toHaveStyle({
      backgroundColor: solarColorToCss(SOLAR_3D_COLORS.selected),
    });
    expect(screen.getByText('Path').previousElementSibling).toHaveStyle({
      backgroundColor: solarColorToCss(SOLAR_3D_COLORS.path),
    });
  });
});
