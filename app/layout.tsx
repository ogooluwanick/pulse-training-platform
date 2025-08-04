import type React from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { NextAuthProvider } from '@/components/next-auth-provider';
import './globals.css';
import { getServerSession } from 'next-auth';
import { Toaster } from 'react-hot-toast';
import QueryProvider from '@/components/query-provider';
import { NotificationProvider } from '@/app/contexts/NotificationContext';
import { UnifiedLayout } from '@/components/unified-layout';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Pulse - The Intelligent Workspace',
  description: 'Multi-tenant corporate training platform',
  icons: {
    icon: '/pulse-logo.png',
  },
  openGraph: {
    title: 'Pulse - The Intelligent Workspace',
    description: 'Multi-tenant corporate training platform',
    images: [
      {
        url: '/site-img.png',
        width: 1200,
        height: 630,
        alt: 'Pulse - The Intelligent Workspace',
      },
    ],
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();
  return (
    <html lang="en" className={inter.variable}>
      <body className={inter.className}>
        <NextAuthProvider session={session}>
          <QueryProvider>
            <NotificationProvider>
              <UnifiedLayout>{children}</UnifiedLayout>
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
            </NotificationProvider>
          </QueryProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}
