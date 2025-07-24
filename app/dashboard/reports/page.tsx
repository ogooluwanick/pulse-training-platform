'use client';

import { useState, useEffect } from 'react';
import FilterBar from '@/components/reports/FilterBar';
import StatsWidgets from '@/components/reports/StatsWidgets';
import CompletionChart from '@/components/reports/CompletionChart';
import EmployeeProgressTable from '@/components/reports/EmployeeProgressTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function ReportsPage() {
  const [filters, setFilters] = useState<ReportFilters>({});
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real implementation, this would call your backend API
    const fetchData = async () => {
      try {
        setLoading(true);
        // Example mock data - replace with actual API call
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
        setReportData(mockData);
      } catch (error) {
        console.error('Failed to fetch report data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (filters) {
      fetchData();
    }
  }, [filters]);

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

  return (
    <div className="p-6 space-y-6">
      <Card className="bg-card text-card-foreground shadow-neumorphic">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Training Reports</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <FilterBar
            onApplyFilters={(newFilters) => setFilters(newFilters)}
            onExport={handleExport}
          />

          {loading ? (
            <div className="flex justify-center p-8">Loading...</div>
          ) : (
            <>
              <StatsWidgets
                overallCompletion={reportData?.overallCompletion}
                coursesInProgress={reportData?.coursesInProgress}
                overdueEmployeesCount={reportData?.overdueEmployeesCount}
              />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="lg:col-span-2">
                  <CompletionChart data={reportData?.courseCompletionStats} />
                </div>
                <EmployeeProgressTable
                  data={reportData?.employeeProgressList}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
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
