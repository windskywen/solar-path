'use client';

/**
 * Solar3DLegend Component
 *
 * Displays a legend for the daylight state colors used in the 3D view.
 * Shows golden hour (amber) and daylight (yellow) point colors.
 */

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
  return (
    <div
      className={`bg-gray-900/90 backdrop-blur rounded-lg px-3 py-2 shadow-lg ${className}`}
      role="complementary"
      aria-label="Color legend for sun positions"
    >
      <h3 className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">Legend</h3>
      <ul className="space-y-1.5 text-sm">
        <li className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: 'rgb(255, 183, 77)' }}
            aria-hidden="true"
          />
          <span className="text-gray-300">Golden Hour</span>
        </li>
        <li className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: 'rgb(255, 235, 59)' }}
            aria-hidden="true"
          />
          <span className="text-gray-300">Daylight</span>
        </li>
        <li className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: 'rgb(255, 87, 34)' }}
            aria-hidden="true"
          />
          <span className="text-gray-300">Selected Hour</span>
        </li>
        <li className="flex items-center gap-2">
          <span
            className="w-6 h-0.5 rounded"
            style={{ backgroundColor: 'rgb(255, 193, 7)' }}
            aria-hidden="true"
          />
          <span className="text-gray-300">Sun Path</span>
        </li>
      </ul>
    </div>
  );
}
