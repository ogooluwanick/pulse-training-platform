'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import FilterBar from '@/components/reports/FilterBar';
import StatsWidgets from '@/components/reports/StatsWidgets';
import CompletionChart from '@/components/reports/CompletionChart';
import EmployeeProgressTable from '@/components/reports/EmployeeProgressTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import FullPageLoader from '@/components/full-page-loader';
import { Skeleton } from '@/components/ui/skeleton';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const fetchReportData = async (filters: ReportFilters) => {
  // In a real implementation, you would make an API call here
  // For now, we'll simulate it with a delay and mock data
  await new Promise((resolve) => setTimeout(resolve, 2000)); // Increased delay to see loader
  const mockData: ReportData = {
    overallCompletion: 72.5,
    coursesInProgress: 15,
    overdueEmployeesCount: 3,
    courseCompletionStats: [
      { courseName: 'Safety Training', completion: 85 },
      { courseName: 'Compliance 101', completion: 65 },
      { courseName: 'Leadership Development', completion: 45 },
    ],
    employeeProgressList: [
      {
        id: 'EMP-001',
        name: 'John Doe',
        email: 'john@example.com',
        department: 'Engineering',
        completionPercentage: 80,
        status: 'Completed',
      },
      {
        id: 'EMP-002',
        name: 'Jane Smith',
        email: 'jane@example.com',
        department: 'HR',
        completionPercentage: 65,
        status: 'In Progress',
      },
      {
        id: 'EMP-003',
        name: 'Bob Johnson',
        email: 'bob@example.com',
        department: 'Sales',
        completionPercentage: 30,
        status: 'Overdue',
      },
    ],
  };
  return mockData;
};

export default function ReportsPage() {
  const { data: session, status } = useSession();
  console.log('Session data:', session);
  const user = session?.user;

  const [filters, setFilters] = useState<ReportFilters>({});

  const {
    data: reportData,
    isLoading,
    error,
  } = useQuery<ReportData, Error>({
    queryKey: ['reportData', filters],
    queryFn: () => fetchReportData(filters),
    enabled: !!user,
  });

  const handleExport = (format: 'csv' | 'pdf') => {
    if (!reportData?.employeeProgressList) return;

    const dataToExport = reportData.employeeProgressList.map((emp) => ({
      Name: emp.name,
      Email: emp.email,
      Department: emp.department,
      Progress: `${emp.completionPercentage}%`,
      Status: emp.status,
    }));

    if (format === 'csv') {
      const csv = Papa.unparse(dataToExport);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', 'employee-progress.csv');
      link.click();
      URL.revokeObjectURL(url);
    } else if (format === 'pdf') {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text('Employee Progress Report', 14, 20);

      doc.autoTable({
        head: [['Name', 'Email', 'Department', 'Progress', 'Status']],
        body: dataToExport.map((emp) => [
          emp.Name,
          emp.Email,
          emp.Department,
          emp.Progress,
          emp.Status,
        ]),
        startY: 30,
        styles: {
          font: 'helvetica',
          fontSize: 10,
          cellPadding: 2,
          lineColor: [200, 200, 200],
          lineWidth: 0.2,
        },
        headStyles: {
          fillColor: [55, 65, 81],
        },
      });

      doc.save('employee-progress.pdf');
    }
  };

  // Return FullPageLoader directly outside layout structure (like working pages)
  if (status === 'loading' || !user?.firstName) {
    return <FullPageLoader placeholder="reports" />;
  }

  return (
    <div className="flex-1 space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-charcoal">
            Training Reports
          </h1>
          <p className="text-warm-gray mt-1">
            Comprehensive analytics and insights into your training programs
          </p>
        </div>
      </div>

      <FilterBar
        onApplyFilters={(newFilters) => setFilters(newFilters)}
        onExport={handleExport}
        loading={isLoading}
      />

      {isLoading ? (
        <div className="space-y-4 sm:space-y-6">
          <div className="grid gap-3 sm:gap-4 lg:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-20 sm:h-24" />
            <Skeleton className="h-20 sm:h-24" />
            <Skeleton className="h-20 sm:h-24" />
          </div>
          <div className="w-full">
            <Skeleton className="h-64 sm:h-80" />
          </div>
          <div className="w-full">
            <Skeleton className="h-64 sm:h-80" />
          </div>
        </div>
      ) : error ? (
        <div className="text-center text-red-500 p-4">
          <p className="text-sm sm:text-base">
            Failed to load report data: {error.message}
          </p>
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          <StatsWidgets
            overallCompletion={reportData?.overallCompletion}
            coursesInProgress={reportData?.coursesInProgress}
            overdueEmployeesCount={reportData?.overdueEmployeesCount}
            loading={isLoading}
          />

          {/* Chart Section - Full Width */}
          <div className="w-full">
            <CompletionChart
              data={reportData?.courseCompletionStats}
              loading={isLoading}
            />
          </div>

          {/* Employee Progress Table - Full Width */}
          <div className="w-full">
            <EmployeeProgressTable
              data={reportData?.employeeProgressList}
              loading={isLoading}
            />
          </div>
        </div>
      )}
    </div>
  );
}

interface ReportFilters {
  startDate?: Date;
  endDate?: Date;
  department?: string;
  courseId?: string;
}

interface EmployeeProgress {
  id: string;
  name: string;
  email: string;
  department: string;
  completionPercentage: number;
  status: 'Completed' | 'In Progress' | 'Overdue' | 'Not Started';
}

interface ReportData {
  overallCompletion: number;
  coursesInProgress: number;
  overdueEmployeesCount: number;
  courseCompletionStats: { courseName: string; completion: number }[];
  employeeProgressList: EmployeeProgress[];
}
