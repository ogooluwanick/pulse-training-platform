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

const fetchReportData = async (filters: ReportFilters): Promise<ReportData> => {
  const params = new URLSearchParams();

  if (filters.startDate) {
    params.append('startDate', filters.startDate.toISOString());
  }
  if (filters.endDate) {
    params.append('endDate', filters.endDate.toISOString());
  }
  if (filters.department && filters.department !== 'all') {
    params.append('department', filters.department);
  }
  if (filters.courseId && filters.courseId !== 'all') {
    params.append('courseId', filters.courseId);
  }

  const url = `/api/company/reports?${params.toString()}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Failed to fetch report data');
  }

  return response.json();
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

  const handleExport = async (format: 'csv' | 'pdf') => {
    if (!reportData?.employeeProgressList) return;

    try {
      const exportFilters = {
        startDate: filters.startDate?.toISOString(),
        endDate: filters.endDate?.toISOString(),
        department: filters.department,
        courseId: filters.courseId,
        format,
      };

      const response = await fetch('/api/company/reports/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(exportFilters),
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      if (format === 'csv') {
        // Handle CSV download
        const csvData = await response.text();
        const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute(
          'download',
          `employee-progress-report-${new Date().toISOString().split('T')[0]}.csv`
        );
        link.click();
        URL.revokeObjectURL(url);
      } else if (format === 'pdf') {
        // Handle PDF generation client-side with server data
        const { data: exportData } = await response.json();

        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text('Employee Progress Report', 14, 20);

        // Add export date and filters info
        doc.setFontSize(10);
        let yPosition = 35;
        doc.text(
          `Export Date: ${new Date().toLocaleDateString()}`,
          14,
          yPosition
        );
        yPosition += 5;

        if (filters.department && filters.department !== 'all') {
          doc.text(`Department: ${filters.department}`, 14, yPosition);
          yPosition += 5;
        }
        if (filters.startDate || filters.endDate) {
          const dateRange = `Date Range: ${filters.startDate?.toLocaleDateString() || 'Start'} - ${filters.endDate?.toLocaleDateString() || 'End'}`;
          doc.text(dateRange, 14, yPosition);
          yPosition += 5;
        }

        doc.autoTable({
          head: [
            ['Name', 'Email', 'Department', 'Courses', 'Progress', 'Status'],
          ],
          body: exportData.map((emp: any) => [
            emp.Name,
            emp.Email,
            emp.Department,
            emp['Courses Assigned'],
            `${emp['Progress (%)']}%`,
            emp.Status,
          ]),
          startY: yPosition + 5,
          styles: {
            font: 'helvetica',
            fontSize: 8,
            cellPadding: 2,
            lineColor: [200, 200, 200],
            lineWidth: 0.2,
          },
          headStyles: {
            fillColor: [55, 65, 81],
          },
        });

        doc.save(
          `employee-progress-report-${new Date().toISOString().split('T')[0]}.pdf`
        );
      }
    } catch (error) {
      console.error('Export error:', error);
      // You might want to show a toast notification here
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
          {/* Stats Widgets Skeleton */}
          <div className="grid gap-3 sm:gap-4 lg:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="bg-alabaster border-warm-gray/20">
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24 bg-warm-gray/30" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 bg-charcoal/20" />
                <Skeleton className="h-3 w-32 mt-2 bg-warm-gray/30" />
              </CardContent>
            </Card>
            <Card className="bg-alabaster border-warm-gray/20">
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24 bg-warm-gray/30" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 bg-charcoal/20" />
                <Skeleton className="h-3 w-32 mt-2 bg-warm-gray/30" />
              </CardContent>
            </Card>
            <Card className="bg-alabaster border-warm-gray/20">
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24 bg-warm-gray/30" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 bg-charcoal/20" />
                <Skeleton className="h-3 w-32 mt-2 bg-warm-gray/30" />
              </CardContent>
            </Card>
          </div>
          
          {/* Chart Skeleton */}
          <Card className="bg-alabaster border-warm-gray/20">
            <CardHeader>
              <Skeleton className="h-6 w-48 bg-charcoal/20" />
              <Skeleton className="h-4 w-64 bg-warm-gray/30" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 sm:h-80 w-full bg-warm-gray/20" />
            </CardContent>
          </Card>
          
          {/* Table Skeleton */}
          <Card className="bg-alabaster border-warm-gray/20">
            <CardHeader>
              <Skeleton className="h-6 w-48 bg-charcoal/20" />
              <Skeleton className="h-4 w-64 bg-warm-gray/30" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-4 py-2 border-b border-warm-gray/20">
                  <Skeleton className="h-4 w-32 bg-warm-gray/30" />
                  <Skeleton className="h-4 w-24 bg-warm-gray/30" />
                  <Skeleton className="h-4 w-20 bg-warm-gray/30" />
                  <Skeleton className="h-4 w-16 bg-warm-gray/30" />
                </div>
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4 py-2">
                    <Skeleton className="h-4 w-32 bg-warm-gray/20" />
                    <Skeleton className="h-4 w-24 bg-warm-gray/20" />
                    <Skeleton className="h-4 w-20 bg-warm-gray/20" />
                    <Skeleton className="h-4 w-16 bg-warm-gray/20" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
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
