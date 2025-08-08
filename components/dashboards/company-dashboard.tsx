'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, AlertTriangle, Shield, Clock } from 'lucide-react';
import type { User } from 'next-auth';
import FullPageLoader from '@/components/full-page-loader';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

interface CompanyDashboardProps {
  user: User;
}

interface DashboardMetrics {
  overallCompliance: number;
  totalEmployees: number;
  employeesAtRisk: number;
  avgCompletionTime: number;
  employeesAtRiskPercentage: number;
}

interface EmployeeAtRisk {
  id: string;
  name: string;
  department: string;
  status: 'on-track' | 'at-risk' | 'overdue';
  assignments?: Array<{
    courseId: string;
    status: string;
    endDate: string;
    isOverdue: boolean;
  }>;
}

interface RecentActivity {
  id: string;
  user: string;
  action: string;
  course: string;
  timestamp: string;
  type: 'completion' | 'enrollment' | 'deadline';
}

const fetchDashboardMetrics = async (
  companyId?: string | null
): Promise<DashboardMetrics> => {
  console.log(
    '[CompanyDashboard] Fetching dashboard metrics for companyId:',
    companyId
  );

  const res = await fetch(`/api/company/dashboard-metrics`, {
    headers: companyId ? { 'x-company-id': companyId } : undefined,
  });

  console.log(
    '[CompanyDashboard] Dashboard metrics response status:',
    res.status
  );

  if (!res.ok) {
    const errorText = await res.text();
    console.error('[CompanyDashboard] Dashboard metrics error:', errorText);
    throw new Error(
      `Network response was not ok: ${res.status} - ${errorText}`
    );
  }

  const data = await res.json();
  console.log('[CompanyDashboard] Dashboard metrics data received:', data);
  return data;
};

const fetchEmployeesAtRisk = async (
  companyId?: string | null
): Promise<EmployeeAtRisk[]> => {
  console.log(
    '[CompanyDashboard] Fetching employees at risk for companyId:',
    companyId
  );

  const res = await fetch(`/api/company/employees-at-risk`, {
    headers: companyId ? { 'x-company-id': companyId } : undefined,
  });

  console.log(
    '[CompanyDashboard] Employees at risk response status:',
    res.status
  );

  if (!res.ok) {
    const errorText = await res.text();
    console.error('[CompanyDashboard] Employees at risk error:', errorText);
    throw new Error(
      `Network response was not ok: ${res.status} - ${errorText}`
    );
  }

  const data = await res.json();
  console.log('[CompanyDashboard] Employees at risk data received:', data);
  return data;
};

const fetchRecentActivity = async (
  companyId?: string | null
): Promise<RecentActivity[]> => {
  console.log(
    '[CompanyDashboard] Fetching recent activity for companyId:',
    companyId
  );

  const res = await fetch(`/api/company/recent-activity`, {
    headers: companyId ? { 'x-company-id': companyId } : undefined,
  });

  console.log(
    '[CompanyDashboard] Recent activity response status:',
    res.status
  );

  if (!res.ok) {
    const errorText = await res.text();
    console.error('[CompanyDashboard] Recent activity error:', errorText);
    throw new Error(
      `Network response was not ok: ${res.status} - ${errorText}`
    );
  }

  const data = await res.json();
  console.log('[CompanyDashboard] Recent activity data received:', data);
  return data;
};

export function CompanyDashboard({ user }: CompanyDashboardProps) {
  // Get company ID from user properties - try multiple sources
  const companyId =
    user.companyId ||
    user.activeCompanyId ||
    (user.companyIds && user.companyIds.length > 0 ? user.companyIds[0] : null);

  console.log('[CompanyDashboard] User:', {
    id: user.id,
    companyId: user.companyId,
    activeCompanyId: user.activeCompanyId,
    companyIds: user.companyIds,
    companyNames: user.companyNames,
    resolvedCompanyId: companyId,
  });

  const {
    data: metrics,
    isLoading: isLoadingMetrics,
    error: errorMetrics,
  } = useQuery<DashboardMetrics>({
    queryKey: ['dashboardMetrics', companyId],
    queryFn: () => fetchDashboardMetrics(companyId),
    // Let the API resolve company context if companyId is not present
    enabled: true,
  });

  console.log('[CompanyDashboard] Metrics query state:', {
    isLoading: isLoadingMetrics,
    hasError: !!errorMetrics,
    error: errorMetrics,
    hasData: !!metrics,
    data: metrics,
  });

  const {
    data: employeesAtRisk,
    isLoading: isLoadingEmployeesAtRisk,
    error: errorEmployeesAtRisk,
  } = useQuery<EmployeeAtRisk[]>({
    queryKey: ['employeesAtRisk', companyId],
    queryFn: () => fetchEmployeesAtRisk(companyId),
    enabled: true,
  });

  console.log('[CompanyDashboard] Employees at risk query state:', {
    isLoading: isLoadingEmployeesAtRisk,
    hasError: !!errorEmployeesAtRisk,
    error: errorEmployeesAtRisk,
    hasData: !!employeesAtRisk,
    dataLength: employeesAtRisk?.length,
  });

  const {
    data: recentActivity,
    isLoading: isLoadingRecentActivity,
    error: errorRecentActivity,
  } = useQuery<RecentActivity[]>({
    queryKey: ['recentActivity', companyId],
    queryFn: () => fetchRecentActivity(companyId),
    enabled: true,
  });

  console.log('[CompanyDashboard] Recent activity query state:', {
    isLoading: isLoadingRecentActivity,
    hasError: !!errorRecentActivity,
    error: errorRecentActivity,
    hasData: !!recentActivity,
    dataLength: recentActivity?.length,
  });

  const getStatusColor = (status: EmployeeAtRisk['status']) => {
    switch (status) {
      case 'on-track':
        return 'bg-success-green text-alabaster';
      case 'at-risk':
        return 'bg-warning-ochre text-alabaster';
      case 'overdue':
        return 'bg-red-500 text-alabaster';
      default:
        return 'bg-warm-gray text-alabaster';
    }
  };

  const formatCompletionTime = (time: number) => {
    if (time === 0) return 'N/A';
    return `${time} days`;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 168) {
      // 7 days
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const queryClient = useQueryClient();

  if (isLoadingMetrics || isLoadingEmployeesAtRisk || isLoadingRecentActivity) {
    return <FullPageLoader />;
  }

  return (
    <div
      className="flex-1 space-y-6 p-6 min-h-screen"
      style={{ backgroundColor: '#f5f4ed' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-charcoal">
              Company Dashboard
            </h1>
            <p className="text-warm-gray">Compliance Overview</p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {errorMetrics ? (
          <Card className="bg-card border-warm-gray/20">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-red-500">
                Error
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-red-500">Could not load metrics.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="bg-card border-warm-gray/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-warm-gray">
                  Overall Compliance
                </CardTitle>
                <Shield className="h-4 w-4 text-success-green" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-charcoal">
                  {metrics?.overallCompliance || 0}%
                </div>
                <Progress
                  value={Math.min(metrics?.overallCompliance || 0, 100)}
                  className="mt-2 h-2"
                />
              </CardContent>
            </Card>

            <Card className="bg-card border-warm-gray/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-warm-gray">
                  Total Employees
                </CardTitle>
                <Users className="h-4 w-4 text-charcoal" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-charcoal">
                  {metrics?.totalEmployees || 0}
                </div>
                <p className="text-xs text-warm-gray">Active learners</p>
              </CardContent>
            </Card>

            <Card className="bg-card border-warm-gray/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-warm-gray">
                  Employees at Risk
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-warning-ochre" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-charcoal">
                  {metrics?.employeesAtRisk || 0}
                </div>
                <p className="text-xs text-warm-gray">Need attention</p>
              </CardContent>
            </Card>

            <Card className="bg-card border-warm-gray/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-warm-gray">
                  Avg. Completion Time
                </CardTitle>
                <Clock className="h-4 w-4 text-charcoal" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-charcoal">
                  {formatCompletionTime(metrics?.avgCompletionTime || 0)}
                </div>
                <p className="text-xs text-warm-gray">Days per course</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        <div className="grid gap-6">
          {/* Compliance and Employees at Risk Donut Charts */}
          <Card className="lg:col-span-2 bg-card border-warm-gray/20">
            <CardHeader>
              <CardTitle className="text-charcoal">
                Compliance Overview
              </CardTitle>
              <CardDescription className="text-warm-gray">
                Compliance and risk metrics
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-around items-center h-64">
              {/* Compliance Donut Chart */}
              <div className="relative">
                <svg className="w-48 h-48 transform -rotate-90">
                  <circle
                    cx="96"
                    cy="96"
                    r="80"
                    stroke="#f5f4ed"
                    strokeWidth="16"
                    fill="transparent"
                    className="opacity-20"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="80"
                    stroke="#347458"
                    strokeWidth="16"
                    fill="transparent"
                    strokeDasharray={`${(Math.min(metrics?.overallCompliance || 0, 100) / 100) * 502.4} 502.4`}
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-charcoal">
                      {Math.min(metrics?.overallCompliance || 0, 100)}%
                    </div>
                    <div className="text-sm text-warm-gray">Compliant</div>
                  </div>
                </div>
              </div>
              {/* Employees at Risk Donut Chart */}
              <div className="relative">
                <svg className="w-48 h-48 transform -rotate-90">
                  <circle
                    cx="96"
                    cy="96"
                    r="80"
                    stroke="#f5f4ed"
                    strokeWidth="16"
                    fill="transparent"
                    className="opacity-20"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="80"
                    stroke="#f59e0b"
                    strokeWidth="16"
                    fill="transparent"
                    strokeDasharray={`${(Math.min(metrics?.employeesAtRiskPercentage || 0, 100) / 100) * 502.4} 502.4`}
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-charcoal">
                      {Math.min(metrics?.employeesAtRiskPercentage || 0, 100)}%
                    </div>
                    <div className="text-sm text-warm-gray">At Risk</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Employees at Risk List */}
          <Card className="bg-card border-warm-gray/20">
            <CardHeader>
              <CardTitle className="text-charcoal">Employees at Risk</CardTitle>
              <CardDescription className="text-warm-gray">
                Require immediate attention
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {errorEmployeesAtRisk ? (
                <p className="text-sm text-red-500">
                  Could not load employees at risk.
                </p>
              ) : employeesAtRisk?.length === 0 ? (
                <p className="text-sm text-warm-gray">
                  No employees are currently at risk.
                </p>
              ) : (
                employeesAtRisk?.map((employee) => (
                  <div
                    key={employee.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-alabaster"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-charcoal truncate">
                        {employee.name}
                      </p>
                      <p className="text-xs text-warm-gray">
                        {employee.department}
                      </p>
                      {employee.assignments &&
                        employee.assignments.length > 0 && (
                          <p className="text-xs text-warm-gray mt-1">
                            {employee.assignments.length} assignment
                            {employee.assignments.length > 1 ? 's' : ''}{' '}
                            {employee.status === 'overdue'
                              ? 'overdue'
                              : 'at risk'}
                          </p>
                        )}
                    </div>
                    <Badge
                      className={getStatusColor(employee.status)}
                      variant="secondary"
                    >
                      {employee.status === 'at-risk'
                        ? 'At Risk'
                        : employee.status === 'overdue'
                          ? 'Overdue'
                          : 'On Track'}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Activity Feed */}
          <Card className="bg-card border-warm-gray/20">
            <CardHeader>
              <CardTitle className="text-charcoal">Recent Activity</CardTitle>
              <CardDescription className="text-warm-gray">
                Latest learning activities in your organization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {errorRecentActivity ? (
                <p className="text-sm text-red-500">
                  Could not load recent activity.
                </p>
              ) : recentActivity?.length === 0 ? (
                <p className="text-sm text-warm-gray">
                  No recent activity to display.
                </p>
              ) : (
                <div className="space-y-3">
                  {recentActivity?.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-alabaster"
                    >
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full ${
                          activity.type === 'completion'
                            ? 'bg-success-green'
                            : activity.type === 'enrollment'
                              ? 'bg-charcoal'
                              : 'bg-warning-ochre'
                        } text-alabaster`}
                      >
                        {activity.type === 'completion'
                          ? '✓'
                          : activity.type === 'enrollment'
                            ? '📚'
                            : '⚠'}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-charcoal">
                          <strong>{activity.user}</strong> {activity.action}{' '}
                          <strong>{activity.course}</strong>
                        </p>
                        <p className="text-xs text-warm-gray">
                          {formatTimestamp(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
