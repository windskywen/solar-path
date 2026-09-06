'use client';

/**
 * Hydration-safe Zustand store for the interactive home experience.
 *
 * The store is scoped to a provider so the server-rendered date can be passed
 * to the browser unchanged. This preserves the existing public selector and
 * action hooks while avoiding a build-time/client-time date mismatch.
 */

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from 'react';
import { useStore } from 'zustand';
import { devtools } from 'zustand/middleware';
import { createStore, type StoreApi } from 'zustand/vanilla';
import { useShallow } from 'zustand/react/shallow';
import type { SolarStore, LocationPoint } from '@/types/solar';
import { getTodayISO, getTimezoneFromCoordinates } from '@/lib/utils/timezone';

export interface SolarStoreProviderProps {
  children: ReactNode;
  initialDateISO: string;
  initialLocation?: LocationPoint | null;
}

function createSolarStore(
  initialDateISO: string,
  initialLocation: LocationPoint | null = null
): StoreApi<SolarStore> {
  const initialState = {
    location: initialLocation,
    dateISO: initialDateISO,
    timezone: initialLocation
      ? getTimezoneFromCoordinates(initialLocation.lat, initialLocation.lng)
      : 'UTC',
    selectedHour: null as number | null,
    isLoadingLocation: initialLocation === null,
    error: null as string | null,
  };

  return createStore<SolarStore>()(
    devtools(
      (set) => ({
        ...initialState,
        setLocation: (location: LocationPoint) =>
          set(
            {
              location,
              timezone: getTimezoneFromCoordinates(location.lat, location.lng),
              error: null,
              isLoadingLocation: false,
            },
            undefined,
            'setLocation'
          ),
        setDateISO: (dateISO: string) => set({ dateISO }, undefined, 'setDateISO'),
        setTimezone: (timezone: string) => set({ timezone }, undefined, 'setTimezone'),
        setSelectedHour: (hour: number | null) =>
          set({ selectedHour: hour }, undefined, 'setSelectedHour'),
        setIsLoadingLocation: (isLoadingLocation: boolean) =>
          set({ isLoadingLocation }, undefined, 'setIsLoadingLocation'),
        setError: (error: string | null) =>
          set({ error, isLoadingLocation: false }, undefined, 'setError'),
        reset: () =>
          set(
            {
              ...initialState,
              dateISO: getTodayISO('UTC'),
            },
            undefined,
            'reset'
          ),
      }),
      { name: 'SolarStore' }
    )
  );
}

const SolarStoreContext = createContext<StoreApi<SolarStore> | null>(null);

export function SolarStoreProvider({
  children,
  initialDateISO,
  initialLocation = null,
}: SolarStoreProviderProps) {
  const [store] = useState(() => createSolarStore(initialDateISO, initialLocation));

  return (
    <SolarStoreContext.Provider value={store}>
      {children}
    </SolarStoreContext.Provider>
  );
}

export function useSolarStore<T>(selector: (state: SolarStore) => T): T {
  const store = useContext(SolarStoreContext);

  if (!store) {
    throw new Error('useSolarStore must be used within SolarStoreProvider.');
  }

  return useStore(store, selector);
}

export const useLocation = () => useSolarStore((state) => state.location);
export const useDateISO = () => useSolarStore((state) => state.dateISO);
export const useTimezone = () => useSolarStore((state) => state.timezone);
export const useSelectedHour = () => useSolarStore((state) => state.selectedHour);
export const useIsLoadingLocation = () => useSolarStore((state) => state.isLoadingLocation);
export const useError = () => useSolarStore((state) => state.error);

export const useSolarActions = () =>
  useSolarStore(
    useShallow((state) => ({
      setLocation: state.setLocation,
      setDateISO: state.setDateISO,
      setTimezone: state.setTimezone,
      setSelectedHour: state.setSelectedHour,
      setIsLoadingLocation: state.setIsLoadingLocation,
      setError: state.setError,
      reset: state.reset,
    }))
  );
