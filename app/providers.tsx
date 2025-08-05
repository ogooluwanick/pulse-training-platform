'use client';

import React from 'react';
import { SessionProvider } from 'next-auth/react';
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from 'next-themes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { NotificationProvider } from '@/app/contexts/NotificationContext';

// Create a single QueryClient instance
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Default query options can go here, e.g.,
        // staleTime: 60 * 1000, // 1 minute
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always make a new query client
    return makeQueryClient();
  } else {
    // Browser: make a new query client if we don't already have one
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}

export function Providers({ children, ...props }: ThemeProviderProps) {
  // Initialize queryClient. The same client will be shared across components.
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <NotificationProvider>
          <NextThemesProvider {...props}>
            {children}
            <Toaster
              position="bottom-right"
              toastOptions={{
                style: {
                  borderRadius: '0',
                  borderWidth: '1.5px',
                },
                success: {
                  style: {
                    borderColor: 'green',
                  },
                },
                error: {
                  style: {
                    borderColor: 'red',
                  },
                },
              }}
            />
          </NextThemesProvider>
        </NotificationProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}
