'use client';

/**
 * Solar3DAccessibleSummary Component
 *
 * Provides a screen-reader accessible text summary of the 3D solar path data.
 * This is hidden visually but announced by assistive technologies.
 */

import type { Solar3DViewData } from '@/types/solar3d';

export interface Solar3DAccessibleSummaryProps {
  /**
   * The 3D view data to summarize.
   */
  viewData: Solar3DViewData;
}

/**
 * Solar3DAccessibleSummary
 *
 * Screen reader accessible summary of the 3D solar path.
 * Lists all visible hourly positions with their data.
 */
export function Solar3DAccessibleSummary({ viewData }: Solar3DAccessibleSummaryProps) {
  const { snapshot, visiblePoints, isEmpty, isSelectedVisible } = viewData;

  if (isEmpty) {
    return (
      <div className="sr-only" role="region" aria-label="Solar path data summary">
        <p>
          The sun does not rise at this location (
          {snapshot.location.name ||
            `${snapshot.location.lat.toFixed(4)}, ${snapshot.location.lng.toFixed(4)}`}
          ) on {snapshot.dateISO}.
        </p>
      </div>
    );
  }

  // Find sunrise and sunset times from visible points
  const firstVisible = visiblePoints[0];
  const lastVisible = visiblePoints[visiblePoints.length - 1];

  // Find solar noon (highest altitude)
  const solarNoon = visiblePoints.reduce(
    (highest, current) => (current.altitudeDeg > highest.altitudeDeg ? current : highest),
    visiblePoints[0]
  );

  return (
    <div className="sr-only" role="region" aria-label="Solar path data summary">
      <h2>Solar Path Summary</h2>
      <p>
        Location:{' '}
        {snapshot.location.name ||
          `${snapshot.location.lat.toFixed(4)}°, ${snapshot.location.lng.toFixed(4)}°`}
      </p>
      <p>Date: {snapshot.dateISO}</p>
      <p>Timezone: {snapshot.timezone}</p>
      <p>Visible hours: {visiblePoints.length} positions</p>

      {firstVisible && (
        <p>
          First visible: {firstVisible.localTimeLabel} at {firstVisible.azimuthDeg.toFixed(1)}°
          azimuth
        </p>
      )}
      {lastVisible && (
        <p>
          Last visible: {lastVisible.localTimeLabel} at {lastVisible.azimuthDeg.toFixed(1)}° azimuth
        </p>
      )}
      {solarNoon && (
        <p>
          Highest point: {solarNoon.localTimeLabel} at {solarNoon.altitudeDeg.toFixed(1)}° altitude
        </p>
      )}

      {isSelectedVisible && snapshot.selectedHour !== null && (
        <p>Selected hour: {snapshot.selectedHour.toString().padStart(2, '0')}:00</p>
      )}

      <h3>Hourly Positions</h3>
      <ul>
        {visiblePoints.map((point) => (
          <li key={point.hour}>
            {point.localTimeLabel}: Azimuth {point.azimuthDeg.toFixed(1)}°, Altitude{' '}
            {point.altitudeDeg.toFixed(1)}°,
            {point.daylightState === 'golden' ? 'Golden hour' : 'Daylight'}
            {isSelectedVisible && snapshot.selectedHour === point.hour && ' (selected)'}
          </li>
        ))}
      </ul>
    </div>
  );
}
