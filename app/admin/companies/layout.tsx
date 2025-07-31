'use client';

import type React from 'react';
import { useState } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { TopMenu } from '@/components/top-menu';
import { AuthGuard } from '@/components/auth-guard';

export default function AdminCompaniesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <AuthGuard>
      <div className="min-h-screen" style={{ backgroundColor: '#f5f4ed' }}>
        <TopMenu />
        <SidebarProvider>
          <AppSidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
          <main className="flex-1 pl-12 sm:pl-16 lg:pl-0">{children}</main>
        </SidebarProvider>
      </div>
    </AuthGuard>
  );
}
