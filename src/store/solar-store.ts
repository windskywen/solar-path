/**
 * Zustand Global State Store
 *
 * Manages application-wide state for location, date, timezone, and selected hour.
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { SolarStore, LocationPoint } from '@/types/solar';
import { getTodayISO } from '@/lib/utils/timezone';

/**
 * Initial state values
 */
const initialState = {
  location: null as LocationPoint | null,
  dateISO: getTodayISO('browser'),
  timezone: 'browser',
  selectedHour: null as number | null,
  isLoadingLocation: true,
  error: null as string | null,
};

/**
 * Solar Path Tracker store
 *
 * Manages:
 * - location: Current selected geographic location
 * - dateISO: Selected date in YYYY-MM-DD format
 * - timezone: "browser" or IANA timezone string
 * - selectedHour: Currently selected hour (0-23) or null
 * - isLoadingLocation: Loading state for initial location
 * - error: Error message if any
 */
export const useSolarStore = create<SolarStore>()(
  devtools(
    (set) => ({
      ...initialState,

      /**
       * Set the current location
       */
      setLocation: (location: LocationPoint) =>
        set(
          { location, error: null, isLoadingLocation: false },
          undefined,
          'setLocation'
        ),

      /**
       * Set the selected date
       */
      setDateISO: (dateISO: string) =>
        set({ dateISO }, undefined, 'setDateISO'),

      /**
       * Set the timezone
       */
      setTimezone: (timezone: string) =>
        set({ timezone }, undefined, 'setTimezone'),

      /**
       * Set the selected hour (0-23) or null to deselect
       */
      setSelectedHour: (hour: number | null) =>
        set({ selectedHour: hour }, undefined, 'setSelectedHour'),

      /**
       * Set loading state
       */
      setIsLoadingLocation: (isLoading: boolean) =>
        set({ isLoadingLocation: isLoading }, undefined, 'setIsLoadingLocation'),

      /**
       * Set error message
       */
      setError: (error: string | null) =>
        set({ error, isLoadingLocation: false }, undefined, 'setError'),

      /**
       * Reset store to initial state
       */
      reset: () =>
        set(
          { ...initialState, dateISO: getTodayISO('browser') },
          undefined,
          'reset'
        ),
    }),
    { name: 'SolarStore' }
  )
);

/**
 * Selector hooks for individual state slices
 */
export const useLocation = () => useSolarStore((state) => state.location);
export const useDateISO = () => useSolarStore((state) => state.dateISO);
export const useTimezone = () => useSolarStore((state) => state.timezone);
export const useSelectedHour = () => useSolarStore((state) => state.selectedHour);
export const useIsLoadingLocation = () => useSolarStore((state) => state.isLoadingLocation);
export const useError = () => useSolarStore((state) => state.error);

/**
 * Selector hooks for actions
 */
export const useSolarActions = () =>
  useSolarStore((state) => ({
    setLocation: state.setLocation,
    setDateISO: state.setDateISO,
    setTimezone: state.setTimezone,
    setSelectedHour: state.setSelectedHour,
    setIsLoadingLocation: state.setIsLoadingLocation,
    setError: state.setError,
    reset: state.reset,
  }));
