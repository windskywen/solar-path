'use client';

/**
 * Solar3DLegend Component
 *
 * Compact observatory key for the daylight states rendered in the 3D view.
 */

import { SOLAR_3D_COLORS, solarColorToCss } from '@/lib/solar3d/geometry';

export interface Solar3DLegendProps {
  /**
   * Additional CSS classes.
   */
  className?: string;
}

/**
 * Solar3DLegend
 *
 * Displays legend for point colors in the 3D view.
 */
export function Solar3DLegend({ className = '' }: Solar3DLegendProps) {
  const items = [
    {
      label: 'Golden',
      description: 'Golden-hour sun position',
      color: solarColorToCss(SOLAR_3D_COLORS.golden),
      kind: 'point',
    },
    {
      label: 'Daylight',
      description: 'Direct daylight sun position',
      color: solarColorToCss(SOLAR_3D_COLORS.day),
      kind: 'point',
    },
    {
      label: 'Selected',
      description: 'Selected hourly sun position',
      color: solarColorToCss(SOLAR_3D_COLORS.selected),
      kind: 'selected',
    },
    {
      label: 'Path',
      description: 'Daily solar trajectory',
      color: solarColorToCss(SOLAR_3D_COLORS.path),
      kind: 'path',
    },
  ] as const;

  return (
    <div
      className={`rounded-[18px] border [border-color:var(--solar-3d-surface-border)] [background:var(--solar-3d-legend-bg)] px-2 py-2 [box-shadow:var(--solar-3d-surface-shadow)] backdrop-blur-xl sm:rounded-full sm:px-3 sm:py-2 ${className}`}
      role="complementary"
      aria-label="Solar observatory legend: Golden Hour, Daylight, Selected Hour, and Sun Path"
      data-testid="solar-3d-legend"
    >
      <p className="sr-only">Solar scene color key</p>
      <ul className="grid grid-cols-2 gap-x-2.5 gap-y-1.5 text-[0.64rem] sm:flex sm:items-center sm:gap-3 sm:text-[0.68rem]">
        {items.map((item) => (
          <li
            key={item.label}
            className="flex min-w-0 items-center gap-1.5 whitespace-nowrap text-[var(--solar-text-strong)]"
            aria-label={item.description}
          >
            <span
              className={
                item.kind === 'path'
                  ? 'h-0.5 w-4 rounded-full'
                  : item.kind === 'selected'
                    ? 'h-2.5 w-2.5 rounded-full ring-2 ring-amber-200/30'
                    : 'h-2 w-2 rounded-full'
              }
              style={{
                backgroundColor: item.color,
                boxShadow:
                  item.kind === 'selected'
                    ? `0 0 10px ${solarColorToCss(SOLAR_3D_COLORS.selectedHalo)}`
                    : undefined,
              }}
              aria-hidden="true"
              data-legend-color={item.label.toLowerCase()}
            />
            <span className="font-medium">{item.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
