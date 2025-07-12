"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Users, AlertTriangle, UserPlus, Mail, Download, FileText, Shield, Clock } from "lucide-react"
import type { User } from "@/lib/auth"

interface CompanyDashboardProps {
  user: User
}

interface Employee {
  id: string
  name: string
  email: string
  role: string
  department: string
  overallProgress: number
  coursesAssigned: number
  coursesCompleted: number
  lastActivity: string
  status: "on-track" | "at-risk" | "overdue"
}

const mockEmployees: Employee[] = [
  {
    id: "1",
    name: "John Smith",
    email: "john.smith@company.com",
    role: "Employee",
    department: "Engineering",
    overallProgress: 85,
    coursesAssigned: 4,
    coursesCompleted: 3,
    lastActivity: "2 hours ago",
    status: "on-track",
  },
  {
    id: "2",
    name: "Sarah Johnson",
    email: "sarah.johnson@company.com",
    role: "Employee",
    department: "Marketing",
    overallProgress: 45,
    coursesAssigned: 3,
    coursesCompleted: 1,
    lastActivity: "1 day ago",
    status: "at-risk",
  },
  {
    id: "3",
    name: "Mike Davis",
    email: "mike.davis@company.com",
    role: "Employee",
    department: "Sales",
    overallProgress: 25,
    coursesAssigned: 5,
    coursesCompleted: 1,
    lastActivity: "5 days ago",
    status: "overdue",
  },
]

export function CompanyDashboard({ user }: CompanyDashboardProps) {
  const [inviteEmails, setInviteEmails] = useState("")
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)

  const overallCompliance = 72
  const employeesAtRisk = mockEmployees.filter((emp) => emp.status === "at-risk" || emp.status === "overdue")

  const getStatusColor = (status: Employee["status"]) => {
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

  const handleInviteEmployees = () => {
    // Handle employee invitation logic
    console.log("Inviting employees:", inviteEmails)
    setIsInviteDialogOpen(false)
    setInviteEmails("")
  }

  return (
    <div className="flex-1 space-y-6 p-6 min-h-screen" style={{ backgroundColor: "#f5f4ed" }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-charcoal">Company Dashboard</h1>
            <p className="text-warm-gray">{user.organizationName} - Compliance Overview</p>
          </div>
        </div>
        <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button className="btn-primary">
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
                <Button onClick={handleInviteEmployees} className="btn-primary">
                  <Mail className="h-4 w-4 mr-2" />
                  Send Invitations
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
        <Card className="bg-card border-warm-gray/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-warm-gray">Overall Compliance</CardTitle>
            <Shield className="h-4 w-4 text-success-green" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-charcoal">{overallCompliance}%</div>
            <Progress value={overallCompliance} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card className="bg-card border-warm-gray/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-warm-gray">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-charcoal" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-charcoal">{mockEmployees.length}</div>
            <p className="text-xs text-warm-gray">Active learners</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-warm-gray/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-warm-gray">Employees at Risk</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning-ochre" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-charcoal">{employeesAtRisk.length}</div>
            <p className="text-xs text-warm-gray">Need attention</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-warm-gray/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-warm-gray">Avg. Completion Time</CardTitle>
            <Clock className="h-4 w-4 text-charcoal" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-charcoal">12.5</div>
            <p className="text-xs text-warm-gray">Days per course</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-parchment border border-warm-gray/20">
          <TabsTrigger value="overview" className="data-[state=active]:bg-alabaster">
            Overview
          </TabsTrigger>
          <TabsTrigger value="employees" className="data-[state=active]:bg-alabaster">
            Employee Management
          </TabsTrigger>
          <TabsTrigger value="courses" className="data-[state=active]:bg-alabaster">
            Course Assignment
          </TabsTrigger>
          <TabsTrigger value="culture" className="data-[state=active]:bg-alabaster">
            Culture Builder
          </TabsTrigger>
          <TabsTrigger value="reports" className="data-[state=active]:bg-alabaster">
            Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Compliance Donut Chart */}
            <Card className="lg:col-span-2 bg-card border-warm-gray/20">
              <CardHeader>
                <CardTitle className="text-charcoal">Compliance Health</CardTitle>
                <CardDescription className="text-warm-gray">Overall organization compliance status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-64">
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
                        strokeDasharray={`${(overallCompliance / 100) * 502.4} 502.4`}
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-charcoal">{overallCompliance}%</div>
                        <div className="text-sm text-warm-gray">Compliant</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Employees at Risk */}
            <Card className="bg-card border-warm-gray/20">
              <CardHeader>
                <CardTitle className="text-charcoal">Employees at Risk</CardTitle>
                <CardDescription className="text-warm-gray">Require immediate attention</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {employeesAtRisk.map((employee) => (
                  <div key={employee.id} className="flex items-center gap-3 p-3 rounded-lg bg-alabaster">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-charcoal truncate">{employee.name}</p>
                      <p className="text-xs text-warm-gray">{employee.department}</p>
                    </div>
                    <Badge className={getStatusColor(employee.status)} variant="secondary">
                      {employee.status === "at-risk" ? "At Risk" : "Overdue"}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Activity Feed */}
          <Card className="bg-card border-warm-gray/20">
            <CardHeader>
              <CardTitle className="text-charcoal">Recent Activity</CardTitle>
              <CardDescription className="text-warm-gray">
                Latest learning activities in your organization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-alabaster">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success-green text-alabaster">
                    ✓
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-charcoal">
                      <strong>John Smith</strong> completed <strong>Data Privacy & GDPR Compliance</strong>
                    </p>
                    <p className="text-xs text-warm-gray">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-alabaster">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-charcoal text-alabaster">
                    📚
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-charcoal">
                      <strong>Sarah Johnson</strong> started <strong>Cybersecurity Awareness</strong>
                    </p>
                    <p className="text-xs text-warm-gray">1 day ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-alabaster">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-warning-ochre text-alabaster">
                    ⚠
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-charcoal">
                      <strong>Mike Davis</strong> missed deadline for <strong>AML Training</strong>
                    </p>
                    <p className="text-xs text-warm-gray">3 days ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="employees" className="space-y-6">
          <Card className="bg-card border-warm-gray/20">
            <CardHeader>
              <CardTitle className="text-charcoal">Employee Management</CardTitle>
              <CardDescription className="text-warm-gray">
                Manage your organization's employees and their progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockEmployees.map((employee) => (
                  <div
                    key={employee.id}
                    className="flex items-center gap-4 p-4 rounded-lg bg-alabaster border border-warm-gray/20"
                  >
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <p className="font-medium text-charcoal">{employee.name}</p>
                        <p className="text-sm text-warm-gray">{employee.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-warm-gray">Department</p>
                        <p className="text-sm text-charcoal">{employee.department}</p>
                      </div>
                      <div>
                        <p className="text-sm text-warm-gray">Progress</p>
                        <div className="flex items-center gap-2">
                          <Progress value={employee.overallProgress} className="flex-1 h-2" />
                          <span className="text-sm text-charcoal">{employee.overallProgress}%</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-warm-gray">Status</p>
                        <Badge className={getStatusColor(employee.status)} variant="secondary">
                          {employee.status === "on-track" && "On Track"}
                          {employee.status === "at-risk" && "At Risk"}
                          {employee.status === "overdue" && "Overdue"}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="bg-transparent border-warm-gray/30">
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" className="bg-transparent border-warm-gray/30">
                        Assign
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card className="bg-card border-warm-gray/20">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-charcoal">Compliance Reports</CardTitle>
                <CardDescription className="text-warm-gray">
                  Export detailed compliance and progress reports
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="bg-transparent border-warm-gray/30">
                  <FileText className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button variant="outline" className="bg-transparent border-warm-gray/30">
                  <Download className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <Card className="bg-alabaster border-warm-gray/20">
                  <CardHeader>
                    <CardTitle className="text-lg text-charcoal">Completion Rates</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-warm-gray">Data Privacy</span>
                        <span className="text-sm font-medium text-charcoal">85%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-warm-gray">AML Training</span>
                        <span className="text-sm font-medium text-charcoal">72%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-warm-gray">Cybersecurity</span>
                        <span className="text-sm font-medium text-charcoal">68%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-alabaster border-warm-gray/20">
                  <CardHeader>
                    <CardTitle className="text-lg text-charcoal">Department Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-warm-gray">Engineering</span>
                        <span className="text-sm font-medium text-charcoal">92%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-warm-gray">Marketing</span>
                        <span className="text-sm font-medium text-charcoal">78%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-warm-gray">Sales</span>
                        <span className="text-sm font-medium text-charcoal">65%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
