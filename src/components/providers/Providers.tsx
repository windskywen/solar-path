'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState, type ReactNode } from 'react';
import { ThemeProvider } from './ThemeProvider';

interface ProvidersProps {
  children: ReactNode;
}

const showQueryDevtools =
  process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_E2E_TEST !== 'true';

/**
 * Application providers wrapper
 *
 * Includes:
 * - React Query for server state management
 * - Theme state shared across public pages
 *
 * The interactive home owns its hydration-safe Zustand provider at the route
 * boundary; calculators intentionally keep independent local state.
 */
export function Providers({ children }: ProvidersProps) {
  // Create QueryClient in state to avoid recreation on re-render
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Solar data is relatively stable, cache for 5 minutes
            staleTime: 5 * 60 * 1000,
            // Keep data in cache for 30 minutes
            gcTime: 30 * 60 * 1000,
            // Don't refetch on window focus for solar calculations
            refetchOnWindowFocus: false,
            // Retry failed requests once
            retry: 1,
          },
        },
      })
  );

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        {children}
        {showQueryDevtools && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </ThemeProvider>
  );
}
