'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState, type ReactNode } from 'react';
import { ThemeProvider } from './ThemeProvider';

interface ProvidersProps {
  children: ReactNode;
}

/**
 * Application providers wrapper
 *
 * Includes:
 * - React Query for server state management
 * - Zustand store is automatically available (no provider needed)
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
        {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </ThemeProvider>
  );
}
