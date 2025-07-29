'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Users,
  Building,
  Shield,
  Clock,
  UserPlus,
  Mail,
  AlertTriangle,
} from 'lucide-react';
import FullPageLoader from '@/components/full-page-loader';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

interface AdminDashboardMetrics {
  totalCompanies: number;
  totalEmployees: number;
  overallCompliance: number;
  avgCompletionTime: number;
  platformRisk: {
    companiesAtRisk: number;
    employeesAtRisk: number;
  };
  recentActivity: RecentActivity[];
}

interface RecentActivity {
  id: string;
  user: string;
  action: string;
  course: string;
  timestamp: string;
  type: 'completion' | 'enrollment' | 'deadline';
}

const fetchAdminDashboardMetrics = async (): Promise<AdminDashboardMetrics> => {
  const res = await fetch('/api/admin/dashboard-metrics');
  if (!res.ok) {
    throw new Error('Network response was not ok');
  }
  return res.json();
};

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const [inviteEmails, setInviteEmails] = useState('');
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);

  const {
    data: metrics,
    isLoading,
    error,
  } = useQuery<AdminDashboardMetrics>({
    queryKey: ['adminDashboardMetrics'],
    queryFn: fetchAdminDashboardMetrics,
  });

  const inviteMutation = useMutation({
    mutationFn: (emails: string[]) =>
      fetch('/api/admin/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emails }),
      }).then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || 'Something went wrong');
        }
        return data;
      }),
    onSuccess: (data) => {
      toast.success(
        `Invitations sent! Successful: ${data.invitedUsers.length}, Failed: ${data.failedInvites.length}`
      );
      if (data.failedInvites.length > 0) {
        toast.error(
          `Failed invites: ${data.failedInvites
            .map((f: any) => f.email)
            .join(', ')}`
        );
      }
      setIsInviteDialogOpen(false);
      setInviteEmails('');
    },
    onError: (error: any) => {
      toast.error(`Failed to send invitations: ${error.message}`);
    },
  });

  const handleInviteAdmins = () => {
    const emailRegex = /\S+@\S+\.\S+/;
    const emails = inviteEmails
      .split(/[,\s\n]+/)
      .map((email) => email.trim())
      .filter((email) => email && emailRegex.test(email));

    if (emails.length === 0) {
      toast.error('No valid email addresses entered.');
      return;
    }

    inviteMutation.mutate(emails);
  };

  if (isLoading) {
    return <FullPageLoader />;
  }

  if (error) {
    return (
      <div
        className="flex-1 space-y-6 p-6 min-h-screen"
        style={{ backgroundColor: '#f5f4ed' }}
      >
        <Card className="bg-card border-warm-gray/20">
          <CardHeader>
            <CardTitle className="text-charcoal">Admin Dashboard</CardTitle>
            <CardDescription className="text-warm-gray">
              Platform-wide overview
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-500">Could not load metrics.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div
      className="flex-1 space-y-6 p-6 min-h-screen"
      style={{ backgroundColor: '#f5f4ed' }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-charcoal">Admin Dashboard</h1>
          <p className="text-warm-gray">Platform-wide overview</p>
        </div>
        <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button className="px-4 py-2 rounded-md bg-charcoal text-white hover:text-white hover:bg-charcoal/90 transition-colors">
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Admins
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-parchment border-warm-gray/20">
            <DialogHeader>
              <DialogTitle className="text-charcoal">Invite Admins</DialogTitle>
              <DialogDescription className="text-warm-gray">
                Enter email addresses to invite admins to the platform
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="emails" className="text-charcoal">
                  Email Addresses
                </Label>
                <Textarea
                  id="emails"
                  placeholder="Enter email addresses, one per line or separated by commas"
                  value={inviteEmails}
                  onChange={(e) => setInviteEmails(e.target.value)}
                  className="bg-alabaster border-warm-gray/30 focus:border-charcoal"
                  rows={4}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleInviteAdmins}
                  disabled={inviteMutation.isPending}
                  className="px-4 py-2 rounded-md bg-charcoal text-white hover:text-white hover:bg-charcoal/90 transition-colors"
                >
                  {inviteMutation.isPending ? (
                    'Sending...'
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Send Invitations
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsInviteDialogOpen(false)}
                  className="bg-transparent"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card border-warm-gray/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-warm-gray">
              Total Companies
            </CardTitle>
            <Building className="h-4 w-4 text-charcoal" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-charcoal">
              {metrics?.totalCompanies}
            </div>
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
              {metrics?.totalEmployees}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-warm-gray/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-warm-gray">
              Overall Compliance
            </CardTitle>
            <Shield className="h-4 w-4 text-success-green" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-charcoal">
              {metrics?.overallCompliance}%
            </div>
            <Progress value={metrics?.overallCompliance} className="mt-2 h-2" />
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
              {metrics?.avgCompletionTime}
            </div>
            <p className="text-xs text-warm-gray">Days per course</p>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Overview Section */}
      <div className="space-y-6">
        <div className="grid gap-6">
          <Card className="lg:col-span-2 bg-card border-warm-gray/20">
            <CardHeader>
              <CardTitle className="text-charcoal">
                Compliance Overview
              </CardTitle>
              <CardDescription className="text-warm-gray">
                Platform-wide compliance and risk metrics
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-around items-center h-64">
              {/* Overall Compliance Donut Chart */}
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
                    strokeDasharray={`${((metrics?.overallCompliance || 0) / 100) * 502.4} 502.4`}
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-charcoal">
                      {metrics?.overallCompliance}%
                    </div>
                    <div className="text-sm text-warm-gray">
                      Platform Compliance
                    </div>
                  </div>
                </div>
              </div>
              {/* Companies at Risk Donut Chart */}
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
                    strokeDasharray={`${((metrics?.platformRisk.companiesAtRisk || 0) / (metrics?.totalCompanies || 1)) * 502.4} 502.4`}
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-charcoal">
                      {metrics?.platformRisk.companiesAtRisk}
                    </div>
                    <div className="text-sm text-warm-gray">
                      Companies at Risk
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-card border-warm-gray/20">
          <CardHeader>
            <CardTitle className="text-charcoal">Platform Risk</CardTitle>
            <CardDescription className="text-warm-gray">
              Companies and employees at risk
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning-ochre" />
                <p className="text-sm font-medium text-charcoal">
                  Companies at Risk
                </p>
              </div>
              <p className="text-lg font-bold text-charcoal">
                {metrics?.platformRisk.companiesAtRisk}
              </p>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning-ochre" />
                <p className="text-sm font-medium text-charcoal">
                  Employees at Risk
                </p>
              </div>
              <p className="text-lg font-bold text-charcoal">
                {metrics?.platformRisk.employeesAtRisk}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-warm-gray/20">
          <CardHeader>
            <CardTitle className="text-charcoal">Recent Activity</CardTitle>
            <CardDescription className="text-warm-gray">
              Latest platform-wide activities
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {metrics?.recentActivity.map((activity) => (
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
                  <p className="text-xs text-warm-gray">{activity.timestamp}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
 