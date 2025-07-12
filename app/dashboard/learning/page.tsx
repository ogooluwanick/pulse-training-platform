"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { BookOpen, Clock, Award, Play, CheckCircle, Search, Filter } from "lucide-react"
import Link from "next/link"

interface LearningPath {
  id: string
  title: string
  description: string
  totalCourses: number
  completedCourses: number
  estimatedTime: string
  difficulty: "Beginner" | "Intermediate" | "Advanced"
  category: "compliance" | "skills" | "culture"
}

interface Assignment {
  id: string
  courseTitle: string
  assignedBy: string
  dueDate: string
  priority: "high" | "medium" | "low"
  status: "pending" | "in-progress" | "completed" | "overdue"
}

const mockLearningPaths: LearningPath[] = [
  {
    id: "1",
    title: "Financial Compliance Fundamentals",
    description: "Complete training path for financial services compliance",
    totalCourses: 5,
    completedCourses: 3,
    estimatedTime: "8 hours",
    difficulty: "Intermediate",
    category: "compliance",
  },
  {
    id: "2",
    title: "Leadership Development",
    description: "Build essential leadership and management skills",
    totalCourses: 4,
    completedCourses: 1,
    estimatedTime: "12 hours",
    difficulty: "Advanced",
    category: "skills",
  },
  {
    id: "3",
    title: "Company Culture & Values",
    description: "Understanding our organizational culture",
    totalCourses: 3,
    completedCourses: 0,
    estimatedTime: "4 hours",
    difficulty: "Beginner",
    category: "culture",
  },
]

const mockAssignments: Assignment[] = [
  {
    id: "1",
    courseTitle: "Data Privacy & GDPR Compliance",
    assignedBy: "Sarah Johnson",
    dueDate: "2024-01-15",
    priority: "high",
    status: "in-progress",
  },
  {
    id: "2",
    courseTitle: "Cybersecurity Awareness",
    assignedBy: "Mike Davis",
    dueDate: "2024-01-10",
    priority: "high",
    status: "overdue",
  },
  {
    id: "3",
    courseTitle: "Company Culture & Values",
    assignedBy: "HR Department",
    dueDate: "2024-01-20",
    priority: "medium",
    status: "pending",
  },
]

export default function MyLearningPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedFilter, setSelectedFilter] = useState("all")

  const getDifficultyColor = (difficulty: LearningPath["difficulty"]) => {
    switch (difficulty) {
      case "Beginner":
        return "bg-success-green text-alabaster"
      case "Intermediate":
        return "bg-warning-ochre text-alabaster"
      case "Advanced":
        return "bg-charcoal text-alabaster"
      default:
        return "bg-warm-gray text-alabaster"
    }
  }

  const getPriorityColor = (priority: Assignment["priority"]) => {
    switch (priority) {
      case "high":
        return "bg-red-500 text-alabaster"
      case "medium":
        return "bg-warning-ochre text-alabaster"
      case "low":
        return "bg-success-green text-alabaster"
      default:
        return "bg-warm-gray text-alabaster"
    }
  }

  const getStatusColor = (status: Assignment["status"]) => {
    switch (status) {
      case "completed":
        return "bg-success-green text-alabaster"
      case "in-progress":
        return "bg-charcoal text-alabaster"
      case "overdue":
        return "bg-red-500 text-alabaster"
      default:
        return "bg-warm-gray text-alabaster"
    }
  }

  return (
    <div className="flex-1 space-y-6 p-6" style={{ backgroundColor: "#f5f4ed" }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-charcoal">My Learning</h1>
          <p className="text-warm-gray">Track your progress and continue your learning journey</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-warm-gray" />
            <Input
              placeholder="Search learning content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-alabaster border-warm-gray/30 focus:border-charcoal"
            />
          </div>
          <Button variant="outline" size="icon" className="bg-transparent border-warm-gray/30">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Learning Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card border-warm-gray/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-warm-gray">Courses in Progress</CardTitle>
            <BookOpen className="h-4 w-4 text-charcoal" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-charcoal">3</div>
            <p className="text-xs text-warm-gray">2 due this week</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-warm-gray/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-warm-gray">Completed This Month</CardTitle>
            <CheckCircle className="h-4 w-4 text-success-green" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-charcoal">5</div>
            <p className="text-xs text-warm-gray">+2 from last month</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-warm-gray/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-warm-gray">Learning Hours</CardTitle>
            <Clock className="h-4 w-4 text-charcoal" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-charcoal">24.5</div>
            <p className="text-xs text-warm-gray">This quarter</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-warm-gray/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-warm-gray">Certificates</CardTitle>
            <Award className="h-4 w-4 text-warning-ochre" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-charcoal">8</div>
            <p className="text-xs text-warm-gray">Ready to download</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="assignments" className="space-y-6">
        <TabsList className="bg-parchment border border-warm-gray/20">
          <TabsTrigger value="assignments" className="data-[state=active]:bg-alabaster">
            My Assignments
          </TabsTrigger>
          <TabsTrigger value="paths" className="data-[state=active]:bg-alabaster">
            Learning Paths
          </TabsTrigger>
          <TabsTrigger value="progress" className="data-[state=active]:bg-alabaster">
            Progress Tracking
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assignments" className="space-y-6">
          <Card className="bg-card border-warm-gray/20">
            <CardHeader>
              <CardTitle className="text-charcoal">Current Assignments</CardTitle>
              <CardDescription className="text-warm-gray">
                Courses assigned to you by your manager or HR department
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockAssignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="flex items-center gap-4 p-4 rounded-lg bg-alabaster border border-warm-gray/20"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-charcoal">{assignment.courseTitle}</h3>
                        <Badge className={getPriorityColor(assignment.priority)} variant="secondary">
                          {assignment.priority.toUpperCase()}
                        </Badge>
                        <Badge className={getStatusColor(assignment.status)} variant="secondary">
                          {assignment.status === "in-progress" && "In Progress"}
                          {assignment.status === "pending" && "Not Started"}
                          {assignment.status === "completed" && "Completed"}
                          {assignment.status === "overdue" && "Overdue"}
                        </Badge>
                      </div>
                      <p className="text-sm text-warm-gray">Assigned by: {assignment.assignedBy}</p>
                      <p className="text-sm text-warm-gray">Due: {assignment.dueDate}</p>
                    </div>
                    <div className="flex gap-2">
                      {assignment.status === "completed" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-transparent border-success-green text-success-green"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Completed
                        </Button>
                      ) : (
                        <Link href={`/dashboard/course/${assignment.id}`}>
                          <Button size="sm" className="bg-charcoal hover:bg-charcoal/90 text-alabaster">
                            <Play className="h-4 w-4 mr-2" />
                            {assignment.status === "pending" ? "Start" : "Continue"}
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="paths" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {mockLearningPaths.map((path) => (
              <Card
                key={path.id}
                className="bg-card border-warm-gray/20 shadow-soft hover:shadow-soft-lg transition-soft"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-lg text-charcoal">{path.title}</CardTitle>
                      <CardDescription className="text-warm-gray">{path.description}</CardDescription>
                    </div>
                    <Badge className={getDifficultyColor(path.difficulty)} variant="secondary">
                      {path.difficulty}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-warm-gray">Progress</span>
                      <span className="text-charcoal font-medium">
                        {path.completedCourses} of {path.totalCourses} courses
                      </span>
                    </div>
                    <Progress value={(path.completedCourses / path.totalCourses) * 100} className="h-2" />
                  </div>
                  <div className="flex items-center justify-between text-sm text-warm-gray">
                    <span>Estimated time: {path.estimatedTime}</span>
                  </div>
                  <Button className="w-full bg-charcoal hover:bg-charcoal/90 text-alabaster">
                    {path.completedCourses === 0 ? "Start Path" : "Continue Path"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="progress" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="bg-card border-warm-gray/20">
              <CardHeader>
                <CardTitle className="text-charcoal">Learning Progress</CardTitle>
                <CardDescription className="text-warm-gray">Your learning activity over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-warm-gray">
                  <p>Progress chart would be displayed here</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-warm-gray/20">
              <CardHeader>
                <CardTitle className="text-charcoal">Skill Development</CardTitle>
                <CardDescription className="text-warm-gray">Areas of expertise you're building</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-warm-gray">Data Privacy</span>
                    <span className="text-sm font-medium text-charcoal">85%</span>
                  </div>
                  <Progress value={85} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-warm-gray">Cybersecurity</span>
                    <span className="text-sm font-medium text-charcoal">72%</span>
                  </div>
                  <Progress value={72} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-warm-gray">Leadership</span>
                    <span className="text-sm font-medium text-charcoal">45%</span>
                  </div>
                  <Progress value={45} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-warm-gray">Communication</span>
                    <span className="text-sm font-medium text-charcoal">68%</span>
                  </div>
                  <Progress value={68} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
