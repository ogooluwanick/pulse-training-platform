'use client';

import { useSession } from 'next-auth/react';
import FullPageLoader from '@/components/full-page-loader';
import { CompanyDashboard } from '@/components/dashboards/company-dashboard';
import { EmployeeDashboard } from '@/components/dashboards/employee-dashboard';
import AdminDashboard from '@/components/dashboards/admin-dashboard';

export default function DashboardPage() {
  const { data: session, status } = useSession();

  // Show loading while session is loading
  if (status === 'loading') {
    return <FullPageLoader />;
  }

  // Render appropriate dashboard based on user role
  switch (session?.user?.role) {
    case 'ADMIN':
      return <AdminDashboard />;
    case 'COMPANY':
      return <CompanyDashboard user={session.user} />;
    case 'EMPLOYEE':
      return <EmployeeDashboard user={session.user} />;
    default:
      return <FullPageLoader />;
  }
}
