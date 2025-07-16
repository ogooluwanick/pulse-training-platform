"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BookOpen, Clock, Award, Play, CheckCircle, AlertTriangle, TrendingUp, Users } from "lucide-react"
import type { User } from "next-auth"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"

interface Course {
  id: string
  title: string
  description: string
  progress: number
  totalLessons: number
  completedLessons: number
  dueDate?: string
  status: "not-started" | "in-progress" | "completed" | "overdue"
  category: "compliance" | "skills" | "culture"
  duration: number
}

interface EmployeeDashboardProps {
  user: User
}

export function EmployeeDashboard({ user }: EmployeeDashboardProps) {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<"all" | "in-progress" | "completed">("all")

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch("/api/employee/courses")
        if (!response.ok) {
          throw new Error("Failed to fetch courses")
        }
        const data = await response.json()
        setCourses(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchCourses()
  }, [])
  const getStatusColor = (status: Course["status"]) => {
    switch (status) {
      case "completed":
        return "bg-success-green text-alabaster"
      case "in-progress":
        return "bg-charcoal text-alabaster"
      case "overdue":
        return "bg-warning-ochre text-alabaster"
      default:
        return "bg-warm-gray text-alabaster"
    }
  }

  const getCategoryIcon = (category: Course["category"]) => {
    switch (category) {
      case "compliance":
        return <Award className="h-8 w-8 text-warning-ochre" />
      case "skills":
        return <TrendingUp className="h-8 w-8 text-charcoal" />
      case "culture":
        return <Users className="h-8 w-8 text-success-green" />
      default:
        return <BookOpen className="h-8 w-8 text-charcoal" />
    }
  }

  const overdueCourses = courses.filter((course) => course.status === "overdue")
  const inProgressCourses = courses.filter((course) => course.status === "in-progress")
  const completedCourses = courses.filter((course) => course.status === "completed")
  const timeInvested = courses.reduce((acc, course) => acc + course.duration, 0)

  const filteredCourses = courses.filter(course => {
    if (activeFilter === "in-progress") {
      return course.status === "in-progress"
    }
    if (activeFilter === "completed") {
      return course.status === "completed"
    }
    return true
  })

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
              Welcome back,{' '}
              <span className="capitalize">
                {user.firstName
                  ? user.firstName
                  : user.name
                    ? user.name.split(' ')[0]
                    : ''}
              </span>
            </h1>
            <p className="text-warm-gray">Continue your learning journey</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {overdueCourses.length > 0 ? (
            <Badge className="bg-warning-ochre text-alabaster">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {overdueCourses.length} Overdue
            </Badge>
          ) : (
            <Badge className="bg-success-green text-alabaster">
              <CheckCircle className="h-3 w-3 mr-1" />
              On Track
            </Badge>
          )}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card border-warm-gray/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-warm-gray">
              Assigned Courses
            </CardTitle>
            <BookOpen className="h-4 w-4 text-charcoal" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-charcoal">
              {courses.length}
            </div>
            <p className="text-xs text-warm-gray">
              {completedCourses.length} completed
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-warm-gray/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-warm-gray">
              Overall Progress
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-success-green" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-charcoal">
              {courses.length > 0
                ? `${Math.round(courses.reduce((acc, course) => acc + course.progress, 0) / courses.length)}%`
                : '0%'}
            </div>
            <p className="text-xs text-warm-gray">Average completion</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-warm-gray/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-warm-gray">
              Certificates Earned
            </CardTitle>
            <Award className="h-4 w-4 text-warning-ochre" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-charcoal">
              {completedCourses.length}
            </div>
            <p className="text-xs text-warm-gray">Ready for download</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-warm-gray/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-warm-gray">
              Time Invested
            </CardTitle>
            <Clock className="h-4 w-4 text-charcoal" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-charcoal">{`${timeInvested}h`}</div>
            <p className="text-xs text-warm-gray">This quarter</p>
          </CardContent>
        </Card>
      </div>

      {/* Course Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-charcoal">My Courses</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className={activeFilter === 'all' ? 'bg-charcoal text-white' : 'bg-transparent border-warm-gray/30'}
              onClick={() => setActiveFilter('all')}
            >
              All Courses
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={activeFilter === 'in-progress' ? 'bg-charcoal text-white' : 'bg-transparent border-warm-gray/30'}
              onClick={() => setActiveFilter('in-progress')}
            >
              In Progress
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={activeFilter === 'completed' ? 'bg-charcoal text-white' : 'bg-transparent border-warm-gray/30'}
              onClick={() => setActiveFilter('completed')}
            >
              Completed
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <Card
                key={index}
                className="bg-card border-warm-gray/20 shadow-soft"
              >
                <CardHeader className="space-y-4">
                  <div className="flex items-start justify-between">
                    <Skeleton className="h-12 w-12 rounded-lg bg-gray-300" />
                    <Skeleton className="h-6 w-24 rounded-full bg-gray-300" />
                  </div>
                  <div>
                    <Skeleton className="h-6 w-3/4 bg-gray-300" />
                    <Skeleton className="h-4 w-full mt-2 bg-gray-300" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-1/4 bg-gray-300" />
                      <Skeleton className="h-4 w-1/4 bg-gray-300" />
                    </div>
                    <Skeleton className="h-2 w-full bg-gray-300" />
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-3 w-1/3 bg-gray-300" />
                      <Skeleton className="h-3 w-1/4 bg-gray-300" />
                    </div>
                  </div>
                  <Skeleton className="h-10 w-full bg-gray-300" />
                </CardContent>
              </Card>
            ))
          ) : error ? (
            <div className="col-span-full text-center text-warning-ochre">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
              <p>Error loading courses: {error}</p>
            </div>
          ) : filteredCourses.length > 0 ? (
            filteredCourses.map((course) => (
              <Card
                key={course.id}
                className="bg-card border-warm-gray/20 shadow-soft hover:shadow-soft-lg transition-soft cursor-pointer group"
              >
                <CardHeader className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-alabaster border border-warm-gray/20">
                      {getCategoryIcon(course.category)}
                    </div>
                    <Badge
                      className={getStatusColor(course.status)}
                      variant="secondary"
                    >
                      {course.status === 'not-started' && 'Not Started'}
                      {course.status === 'in-progress' && 'In Progress'}
                      {course.status === 'completed' && 'Completed'}
                      {course.status === 'overdue' && 'Overdue'}
                    </Badge>
                  </div>
                  <div>
                    <CardTitle className="text-lg text-charcoal group-hover:text-charcoal/80 transition-soft">
                      {course.title}
                    </CardTitle>
                    <CardDescription className="text-warm-gray mt-2">
                      {course.description}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-warm-gray">Progress</span>
                      <span className="text-charcoal font-medium">
                        {course.progress}%
                      </span>
                    </div>
                    <Progress value={course.progress} className="h-2" />
                    <div className="flex items-center justify-between text-xs text-warm-gray">
                      <span>
                        {course.completedLessons} of {course.totalLessons}{' '}
                        lessons
                      </span>
                      {course.dueDate && (
                        <span>
                          Due {new Date(course.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/dashboard/course/${course.id}`}
                      className="flex-1"
                    >
                      <Button
                        className="btn-primary w-full"
                        disabled={course.status === 'completed'}
                      >
                        {course.status === 'completed' ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Completed
                          </>
                        ) : course.status === 'not-started' ? (
                          <>
                            <Play className="h-4 w-4 mr-2" />
                            Start Course
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-2" />
                            Continue
                          </>
                        )}
                      </Button>
                    </Link>
                    {course.status === 'completed' && (
                      <Button
                        variant="outline"
                        size="icon"
                        className="bg-transparent border-warm-gray/30"
                      >
                        <Award className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center text-warm-gray min-h-[200px] flex flex-col items-center justify-center">
              <BookOpen className="h-8 w-8 mx-auto mb-2" />
              <p>No courses to display in this category.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
