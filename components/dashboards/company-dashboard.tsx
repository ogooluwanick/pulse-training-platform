"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Users, AlertTriangle, UserPlus, Mail, Shield, Clock } from "lucide-react"
import type { User } from "next-auth"
import FullPageLoader from "@/components/full-page-loader"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "react-hot-toast"

interface CompanyDashboardProps {
  user: User
}

interface DashboardMetrics {
  overallCompliance: number
  totalEmployees: number
  employeesAtRisk: number
  avgCompletionTime: number
  employeesAtRiskPercentage: number
}

interface EmployeeAtRisk {
  id: string
  name: string
  department: string
  status: "on-track" | "at-risk" | "overdue"
}

interface RecentActivity {
  id: string
  user: string
  action: string
  course: string
  timestamp: string
  type: "completion" | "enrollment" | "deadline"
}

const fetchDashboardMetrics = async (companyId: string): Promise<DashboardMetrics> => {
  const res = await fetch(`/api/company/dashboard-metrics?companyId=${companyId}`)
  if (!res.ok) {
    throw new Error("Network response was not ok")
  }
  return res.json()
}

const fetchEmployeesAtRisk = async (companyId: string): Promise<EmployeeAtRisk[]> => {
  const res = await fetch(`/api/company/employees-at-risk?companyId=${companyId}`)
  if (!res.ok) {
    throw new Error("Network response was not ok")
  }
  return res.json()
}

const fetchRecentActivity = async (companyId: string): Promise<RecentActivity[]> => {
  const res = await fetch(`/api/company/recent-activity?companyId=${companyId}`)
  if (!res.ok) {
    throw new Error("Network response was not ok")
  }
  return res.json()
}

export function CompanyDashboard({ user }: CompanyDashboardProps) {
  const [inviteEmails, setInviteEmails] = useState("")
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)

  const {
    data: metrics,
    isLoading: isLoadingMetrics,
    error: errorMetrics,
  } = useQuery<DashboardMetrics>({
    queryKey: ["dashboardMetrics", user.companyId],
    queryFn: () => fetchDashboardMetrics(user.companyId as string),
    enabled: !!user.companyId,
  })

  const {
    data: employeesAtRisk,
    isLoading: isLoadingEmployeesAtRisk,
    error: errorEmployeesAtRisk,
  } = useQuery<EmployeeAtRisk[]>({
    queryKey: ["employeesAtRisk", user.companyId],
    queryFn: () => fetchEmployeesAtRisk(user.companyId as string),
    enabled: !!user.companyId,
  })

  const {
    data: recentActivity,
    isLoading: isLoadingRecentActivity,
    error: errorRecentActivity,
  } = useQuery<RecentActivity[]>({
    queryKey: ["recentActivity", user.companyId],
    queryFn: () => fetchRecentActivity(user.companyId as string),
    enabled: !!user.companyId,
  })

  const getStatusColor = (status: EmployeeAtRisk["status"]) => {
    switch (status) {
      case "on-track":
        return "bg-success-green text-alabaster"
      case "at-risk":
        return "bg-warning-ochre text-alabaster"
      case "overdue":
        return "bg-red-500 text-alabaster"
      default:
        return "bg-warm-gray text-alabaster"
    }
  }

  const queryClient = useQueryClient()

  const inviteMutation = useMutation({
    mutationFn: (emails: string[]) =>
      fetch("/api/company/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ emails }),
      }).then(async (res) => {
        const data = await res.json()
        if (!res.ok) {
          throw new Error(data.message || "Something went wrong")
        }
        return data
      }),
    onSuccess: (data) => {
      toast.success(
        `Invitations sent! Successful: ${data.invitedUsers.length}, Failed: ${data.failedInvites.length}`
      )
      if (data.failedInvites.length > 0) {
        toast.error(
          `Failed invites: ${data.failedInvites
            .map((f: any) => f.email)
            .join(", ")}`
        )
      }
      setIsInviteDialogOpen(false)
      setInviteEmails("")
      queryClient.invalidateQueries({ queryKey: ["dashboardMetrics"] })
    },
    onError: (error: any) => {
      toast.error(`Failed to send invitations: ${error.message}`)
    },
  })

  const handleInviteEmployees = () => {
    const emailRegex = /\S+@\S+\.\S+/
    const emails = inviteEmails
      .split(/[,\s\n]+/)
      .map((email) => email.trim())
      .filter((email) => email && emailRegex.test(email))

    if (emails.length === 0) {
      toast.error("No valid email addresses entered.")
      return
    }

    inviteMutation.mutate(emails)
  }

  if (isLoadingMetrics || isLoadingEmployeesAtRisk || isLoadingRecentActivity) {
    return <FullPageLoader />
  }

  return (
    <div className="flex-1 space-y-6 p-6 min-h-screen" style={{ backgroundColor: "#f5f4ed" }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-charcoal">Company Dashboard</h1>
            <p className="text-warm-gray">Compliance Overview</p>
          </div>
        </div>
        <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button className="px-4 py-2 rounded-md bg-charcoal text-white hover:text-white hover:bg-charcoal/90 transition-colors">
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Employees
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-parchment border-warm-gray/20">
            <DialogHeader>
              <DialogTitle className="text-charcoal">Invite Employees</DialogTitle>
              <DialogDescription className="text-warm-gray">
                Enter email addresses to invite employees to your organization
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
                  onClick={handleInviteEmployees}
                  disabled={inviteMutation.isPending}
                  className="px-4 py-2 rounded-md bg-charcoal text-white hover:text-white hover:bg-charcoal/90 transition-colors"
                >
                  {inviteMutation.isPending ? (
                    "Sending..."
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Send Invitations
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)} className="bg-transparent">
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {errorMetrics ? (
          <Card className="bg-card border-warm-gray/20">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-red-500">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-red-500">Could not load metrics.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="bg-card border-warm-gray/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-warm-gray">Overall Compliance</CardTitle>
                <Shield className="h-4 w-4 text-success-green" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-charcoal">{metrics?.overallCompliance}%</div>
                <Progress value={metrics?.overallCompliance} className="mt-2 h-2" />
              </CardContent>
            </Card>

            <Card className="bg-card border-warm-gray/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-warm-gray">Total Employees</CardTitle>
                <Users className="h-4 w-4 text-charcoal" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-charcoal">{metrics?.totalEmployees}</div>
                <p className="text-xs text-warm-gray">Active learners</p>
              </CardContent>
            </Card>

            <Card className="bg-card border-warm-gray/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-warm-gray">Employees at Risk</CardTitle>
                <AlertTriangle className="h-4 w-4 text-warning-ochre" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-charcoal">{metrics?.employeesAtRisk}</div>
                <p className="text-xs text-warm-gray">Need attention</p>
              </CardContent>
            </Card>

            <Card className="bg-card border-warm-gray/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-warm-gray">Avg. Completion Time</CardTitle>
                <Clock className="h-4 w-4 text-charcoal" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-charcoal">{metrics?.avgCompletionTime}</div>
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
              <CardTitle className="text-charcoal">Compliance Overview</CardTitle>
              <CardDescription className="text-warm-gray">Compliance and risk metrics</CardDescription>
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
                    strokeDasharray={`${((metrics?.overallCompliance || 0) / 100) * 502.4} 502.4`}
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-charcoal">{metrics?.overallCompliance}%</div>
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
                    strokeDasharray={`${((metrics?.employeesAtRiskPercentage || 0) / 100) * 502.4} 502.4`}
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-charcoal">{metrics?.employeesAtRiskPercentage}%</div>
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
              <CardDescription className="text-warm-gray">Require immediate attention</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {errorEmployeesAtRisk ? (
                <p className="text-sm text-red-500">Could not load employees at risk.</p>
              ) : employeesAtRisk?.length === 0 ? (
                <p className="text-sm text-warm-gray">No employees are currently at risk.</p>
              ) : (
                employeesAtRisk?.map((employee) => (
                  <div key={employee.id} className="flex items-center gap-3 p-3 rounded-lg bg-alabaster">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-charcoal truncate">{employee.name}</p>
                      <p className="text-xs text-warm-gray">{employee.department}</p>
                    </div>
                    <Badge className={getStatusColor(employee.status)} variant="secondary">
                      {employee.status === "at-risk" ? "At Risk" : "Overdue"}
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
                <p className="text-sm text-red-500">Could not load recent activity.</p>
              ) : recentActivity?.length === 0 ? (
                <p className="text-sm text-warm-gray">No recent activity to display.</p>
              ) : (
                <div className="space-y-3">
                  {recentActivity?.map((activity) => (
                    <div key={activity.id} className="flex items-center gap-3 p-3 rounded-lg bg-alabaster">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full ${
                          activity.type === "completion"
                            ? "bg-success-green"
                            : activity.type === "enrollment"
                            ? "bg-charcoal"
                            : "bg-warning-ochre"
                        } text-alabaster`}
                      >
                        {activity.type === "completion" ? "✓" : activity.type === "enrollment" ? "📚" : "⚠"}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-charcoal">
                          <strong>{activity.user}</strong> {activity.action} <strong>{activity.course}</strong>
                        </p>
                        <p className="text-xs text-warm-gray">{activity.timestamp}</p>
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
  )
}
