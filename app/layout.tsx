import type React from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={inter.className}>
        <Providers
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <UnifiedLayout>{children}</UnifiedLayout>
        </Providers>
      </body>
    </html>
  );
}
