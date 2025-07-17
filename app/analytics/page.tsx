"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { BarChart3, TrendingUp, TrendingDown, Users, Clock, Award, Download, Target } from "lucide-react"
import { AuthGuard } from "@/components/auth-guard"

interface AnalyticsData {
  totalEmployees: number
  activeEmployees: number
  completionRate: number
  averageScore: number
  totalCourses: number
  completedCourses: number
  timeSpent: number
  certificatesEarned: number
}

interface CourseAnalytics {
  id: string
  name: string
  enrolled: number
  completed: number
  averageScore: number
  averageTime: number
  completionRate: number
  trend: "up" | "down" | "stable"
}

interface DepartmentAnalytics {
  name: string
  employees: number
  completionRate: number
  averageScore: number
  trend: "up" | "down" | "stable"
}

const mockAnalytics: AnalyticsData = {
  totalEmployees: 150,
  activeEmployees: 142,
  completionRate: 87,
  averageScore: 85,
  totalCourses: 12,
  completedCourses: 8,
  timeSpent: 2340, // minutes
  certificatesEarned: 89,
}

const mockCourseAnalytics: CourseAnalytics[] = [
  {
    id: "1",
    name: "Data Privacy & GDPR Compliance",
    enrolled: 150,
    completed: 128,
    averageScore: 88,
    averageTime: 45,
    completionRate: 85,
    trend: "up",
  },
  {
    id: "2",
    name: "Cybersecurity Awareness",
    enrolled: 145,
    completed: 98,
    averageScore: 82,
    averageTime: 38,
    completionRate: 68,
    trend: "down",
  },
  {
    id: "3",
    name: "Anti-Money Laundering (AML)",
    enrolled: 120,
    completed: 87,
    averageScore: 91,
    averageTime: 52,
    completionRate: 73,
    trend: "up",
  },
]

const mockDepartmentAnalytics: DepartmentAnalytics[] = [
  {
    name: "Engineering",
    employees: 45,
    completionRate: 92,
    averageScore: 89,
    trend: "up",
  },
  {
    name: "Marketing",
    employees: 28,
    completionRate: 78,
    averageScore: 83,
    trend: "stable",
  },
  {
    name: "Sales",
    employees: 35,
    completionRate: 65,
    averageScore: 79,
    trend: "down",
  },
  {
    name: "HR",
    employees: 12,
    completionRate: 95,
    averageScore: 92,
    trend: "up",
  },
  {
    name: "Finance",
    employees: 18,
    completionRate: 88,
    averageScore: 87,
    trend: "up",
  },
]

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("30d")
  const [selectedDepartment, setSelectedDepartment] = useState("all")
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)

  const getTrendIcon = (trend: "up" | "down" | "stable") => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-success-green" />
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-500" />
      default:
        return <div className="h-4 w-4" />
    }
  }

  const getTrendColor = (trend: "up" | "down" | "stable") => {
    switch (trend) {
      case "up":
        return "text-success-green"
      case "down":
        return "text-red-500"
      default:
        return "text-warm-gray"
    }
  }

  const handleExportReport = (format: string) => {
    console.log(`Exporting analytics report in ${format} format`)
    setIsExportDialogOpen(false)
  }

  return (
    <AuthGuard allowedRoles={["COMPANY", "ADMIN"]}>
      <div className="flex-1 space-y-6 p-6 min-h-screen" style={{ backgroundColor: "#f5f4ed" }}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-charcoal">Analytics Dashboard</h1>
            <p className="text-warm-gray">Comprehensive learning analytics and insights</p>
          </div>
          <div className="flex items-center gap-4">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32 bg-alabaster border-warm-gray/30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-parchment border-warm-gray/20">
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
              <DialogTrigger asChild>
                <Button className="btn-primary">
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-parchment border-warm-gray/20 shadow-xl">
                <DialogHeader>
                  <DialogTitle className="text-charcoal">Export Analytics Report</DialogTitle>
                  <DialogDescription className="text-warm-gray">
                    Choose the format for your analytics report
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Button onClick={() => handleExportReport("pdf")} className="btn-primary h-20 flex-col">
                      <Download className="h-6 w-6 mb-2" />
                      PDF Report
                    </Button>
                    <Button
                      onClick={() => handleExportReport("csv")}
                      variant="outline"
                      className="h-20 flex-col bg-alabaster border-warm-gray/30"
                    >
                      <Download className="h-6 w-6 mb-2" />
                      CSV Data
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-card border-warm-gray/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-warm-gray">Overall Completion</CardTitle>
              <Target className="h-4 w-4 text-success-green" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-charcoal">{mockAnalytics.completionRate}%</div>
              <Progress value={mockAnalytics.completionRate} className="mt-2 h-2" />
              <p className="text-xs text-success-green mt-1">+5% from last month</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-warm-gray/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-warm-gray">Average Score</CardTitle>
              <Award className="h-4 w-4 text-charcoal" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-charcoal">{mockAnalytics.averageScore}%</div>
              <p className="text-xs text-success-green">+2% from last month</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-warm-gray/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-warm-gray">Active Learners</CardTitle>
              <Users className="h-4 w-4 text-charcoal" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-charcoal">{mockAnalytics.activeEmployees}</div>
              <p className="text-xs text-warm-gray">of {mockAnalytics.totalEmployees} employees</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-warm-gray/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-warm-gray">Learning Hours</CardTitle>
              <Clock className="h-4 w-4 text-charcoal" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-charcoal">{Math.round(mockAnalytics.timeSpent / 60)}h</div>
              <p className="text-xs text-warm-gray">Total time invested</p>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-parchment border border-warm-gray/20">
            <TabsTrigger value="overview" className="data-[state=active]:bg-alabaster">
              Overview
            </TabsTrigger>
            <TabsTrigger value="courses" className="data-[state=active]:bg-alabaster">
              Course Performance
            </TabsTrigger>
            <TabsTrigger value="departments" className="data-[state=active]:bg-alabaster">
              Department Analysis
            </TabsTrigger>
            <TabsTrigger value="trends" className="data-[state=active]:bg-alabaster">
              Trends & Insights
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Completion Rate Chart */}
              <Card className="bg-card border-warm-gray/20">
                <CardHeader>
                  <CardTitle className="text-charcoal">Completion Rate Trend</CardTitle>
                  <CardDescription className="text-warm-gray">Monthly completion rates over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center">
                    <div className="text-center">
                      <BarChart3 className="h-16 w-16 text-warm-gray mx-auto mb-4" />
                      <p className="text-warm-gray">Chart visualization would be rendered here</p>
                      <p className="text-sm text-warm-gray mt-2">Showing steady improvement over the last 6 months</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Top Performers */}
              <Card className="bg-card border-warm-gray/20">
                <CardHeader>
                  <CardTitle className="text-charcoal">Top Performing Employees</CardTitle>
                  <CardDescription className="text-warm-gray">Highest completion rates this month</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { name: "Sarah Johnson", department: "Engineering", score: 98, courses: 5 },
                    { name: "Mike Chen", department: "Marketing", score: 96, courses: 4 },
                    { name: "Lisa Rodriguez", department: "HR", score: 94, courses: 6 },
                    { name: "David Kim", department: "Finance", score: 92, courses: 4 },
                  ].map((employee, index) => (
                    <div key={employee.name} className="flex items-center gap-3 p-3 rounded-lg bg-alabaster">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success-green text-alabaster text-sm font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-charcoal">{employee.name}</p>
                        <p className="text-xs text-warm-gray">{employee.department}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-charcoal">{employee.score}%</p>
                        <p className="text-xs text-warm-gray">{employee.courses} courses</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="courses" className="space-y-6">
            <Card className="bg-card border-warm-gray/20">
              <CardHeader>
                <CardTitle className="text-charcoal">Course Performance Analysis</CardTitle>
                <CardDescription className="text-warm-gray">
                  Detailed analytics for each training course
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockCourseAnalytics.map((course) => (
                    <div
                      key={course.id}
                      className="flex items-center gap-4 p-4 rounded-lg bg-alabaster border border-warm-gray/20"
                    >
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div>
                          <p className="font-medium text-charcoal">{course.name}</p>
                          <p className="text-sm text-warm-gray">{course.enrolled} enrolled</p>
                        </div>
                        <div>
                          <p className="text-sm text-warm-gray">Completion Rate</p>
                          <div className="flex items-center gap-2">
                            <Progress value={course.completionRate} className="flex-1 h-2" />
                            <span className="text-sm text-charcoal">{course.completionRate}%</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-warm-gray">Average Score</p>
                          <p className="text-sm font-medium text-charcoal">{course.averageScore}%</p>
                        </div>
                        <div>
                          <p className="text-sm text-warm-gray">Avg. Time</p>
                          <p className="text-sm text-charcoal">{course.averageTime} min</p>
                        </div>
                        <div>
                          <p className="text-sm text-warm-gray">Trend</p>
                          <div className="flex items-center gap-1">
                            {getTrendIcon(course.trend)}
                            <span className={`text-sm ${getTrendColor(course.trend)}`}>
                              {course.trend === "up" ? "Improving" : course.trend === "down" ? "Declining" : "Stable"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="departments" className="space-y-6">
            <Card className="bg-card border-warm-gray/20">
              <CardHeader>
                <CardTitle className="text-charcoal">Department Performance</CardTitle>
                <CardDescription className="text-warm-gray">
                  Learning analytics broken down by department
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockDepartmentAnalytics.map((dept) => (
                    <div
                      key={dept.name}
                      className="flex items-center gap-4 p-4 rounded-lg bg-alabaster border border-warm-gray/20"
                    >
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <p className="font-medium text-charcoal">{dept.name}</p>
                          <p className="text-sm text-warm-gray">{dept.employees} employees</p>
                        </div>
                        <div>
                          <p className="text-sm text-warm-gray">Completion Rate</p>
                          <div className="flex items-center gap-2">
                            <Progress value={dept.completionRate} className="flex-1 h-2" />
                            <span className="text-sm text-charcoal">{dept.completionRate}%</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-warm-gray">Average Score</p>
                          <p className="text-sm font-medium text-charcoal">{dept.averageScore}%</p>
                        </div>
                        <div>
                          <p className="text-sm text-warm-gray">Trend</p>
                          <div className="flex items-center gap-1">
                            {getTrendIcon(dept.trend)}
                            <span className={`text-sm ${getTrendColor(dept.trend)}`}>
                              {dept.trend === "up" ? "Improving" : dept.trend === "down" ? "Declining" : "Stable"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="bg-card border-warm-gray/20">
                <CardHeader>
                  <CardTitle className="text-charcoal">Key Insights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-success-green/10 border border-success-green/20">
                    <TrendingUp className="h-5 w-5 text-success-green mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-charcoal">Completion rates are improving</p>
                      <p className="text-xs text-warm-gray">15% increase over the last quarter</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-warning-ochre/10 border border-warning-ochre/20">
                    <TrendingDown className="h-5 w-5 text-warning-ochre mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-charcoal">Sales department needs attention</p>
                      <p className="text-xs text-warm-gray">Below average completion rate</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-charcoal/10 border border-charcoal/20">
                    <Award className="h-5 w-5 text-charcoal mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-charcoal">High engagement in compliance courses</p>
                      <p className="text-xs text-warm-gray">Above 90% completion rate</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-warm-gray/20">
                <CardHeader>
                  <CardTitle className="text-charcoal">Recommendations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 rounded-lg bg-alabaster border border-warm-gray/20">
                    <p className="text-sm font-medium text-charcoal mb-1">Focus on Sales Training</p>
                    <p className="text-xs text-warm-gray">
                      Consider additional support or incentives for the sales team
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-alabaster border border-warm-gray/20">
                    <p className="text-sm font-medium text-charcoal mb-1">Expand Successful Programs</p>
                    <p className="text-xs text-warm-gray">
                      Replicate the success of compliance training in other areas
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-alabaster border border-warm-gray/20">
                    <p className="text-sm font-medium text-charcoal mb-1">Implement Peer Learning</p>
                    <p className="text-xs text-warm-gray">Connect high performers with those who need support</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AuthGuard>
  )
}
