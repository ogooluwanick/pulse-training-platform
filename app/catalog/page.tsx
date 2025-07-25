"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import FullPageLoader from "@/components/full-page-loader"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookOpen, Clock, Award, Users, Star, Search, Play } from "lucide-react"
import Link from "next/link"
import { formatDuration } from "@/lib/duration"

interface Course {
  _id: string
  title: string
  description: string
  instructor: string
  duration: number
  difficulty: "Beginner" | "Intermediate" | "Advanced"
  category: "compliance" | "skills" | "culture" | "technical"
  rating: number
  enrolledCount: number
  tags: string[]
  isEnrolled: boolean
}

interface AssignedCourse extends Course {
  assignedCount: number
}

export default function CourseCatalogPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedDifficulty, setSelectedDifficulty] = useState("all")

  const { data: courses = [], isLoading, isError } = useQuery<Course[]>({
    queryKey: ["courses"],
    queryFn: async () => {
      const response = await fetch("/api/course")
      if (!response.ok) {
        throw new Error("Failed to fetch courses")
      }
      return response.json()
    },
  })

  const { data: assignedCourses = [] } = useQuery<AssignedCourse[]>({
    queryKey: ["assignedCourses"],
    queryFn: async () => {
      const response = await fetch("/api/course-assignment")
      if (!response.ok) {
        throw new Error("Failed to fetch assigned courses")
      }
      return response.json()
    },
  })

  const getDifficultyColor = (difficulty: Course["difficulty"]) => {
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

  const getCategoryColor = (category: Course["category"]) => {
    switch (category) {
      case "compliance":
        return "bg-red-100 text-red-800 border-red-200"
      case "skills":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "culture":
        return "bg-green-100 text-green-800 border-green-200"
      case "technical":
        return "bg-purple-100 text-purple-800 border-purple-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = selectedCategory === "all" || course.category === selectedCategory
    const matchesDifficulty = selectedDifficulty === "all" || course.difficulty === selectedDifficulty

    return matchesSearch && matchesCategory && matchesDifficulty
  })

  if (isLoading) {
    return <FullPageLoader />
  }

  if (isError) {
    return (
      <div className="flex-1 space-y-6 p-6" style={{ backgroundColor: "#f5f4ed" }}>
        <div className="flex items-center justify-center h-full">
          <p className="text-red-500">Failed to load courses. Please try again later.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-6" style={{ backgroundColor: "#f5f4ed" }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-charcoal">Course Catalog</h1>
          <p className="text-warm-gray">Discover and assign courses to your staff</p>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="bg-card border-warm-gray/20">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-warm-gray" />
              <Input
                placeholder="Search courses, instructors, or topics..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-alabaster border-warm-gray/30 focus:border-charcoal"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-48 bg-alabaster border-warm-gray/30">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="compliance">Compliance</SelectItem>
                <SelectItem value="skills">Skills</SelectItem>
                <SelectItem value="culture">Culture</SelectItem>
                <SelectItem value="technical">Technical</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
              <SelectTrigger className="w-full md:w-48 bg-alabaster border-warm-gray/30">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="Beginner">Beginner</SelectItem>
                <SelectItem value="Intermediate">Intermediate</SelectItem>
                <SelectItem value="Advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="bg-parchment border border-warm-gray/20">
          <TabsTrigger value="all" className="data-[state=active]:bg-alabaster">
            All Courses
          </TabsTrigger>
          <TabsTrigger value="enrolled" className="data-[state=active]:bg-alabaster">
            Assigned Courses
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          {filteredCourses.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredCourses.map((course) => (
                <Card
                  key={course._id}
                  className="bg-card border-warm-gray/20 shadow-soft hover:shadow-soft-lg transition-soft"
                >
                  <CardHeader className="space-y-4">
                    <div className="flex items-start justify-between">
                      <Badge className={getCategoryColor(course.category)} variant="outline">
                        {course.category.charAt(0).toUpperCase() + course.category.slice(1)}
                      </Badge>
                      <Badge className={getDifficultyColor(course.difficulty)} variant="secondary">
                        {course.difficulty}
                      </Badge>
                    </div>
                    <div>
                      <CardTitle className="text-lg text-charcoal">{course.title}</CardTitle>
                      <CardDescription className="text-warm-gray mt-2">{course.description}</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between text-sm text-warm-gray">
                      <span>By {course.instructor}</span>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-warning-ochre text-warning-ochre" />
                        <span>{course.rating}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-warm-gray">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatDuration(course.duration)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>{course.enrolledCount.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {course.tags.map((tag: any) => (
                        <Badge key={tag} variant="outline" className="text-xs bg-alabaster border-warm-gray/30">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      {course.isEnrolled ? (
                        <Link href={`/dashboard/course/${course._id}`} className="flex-1">
                          <Button className="w-full bg-success-green hover:bg-success-green/90 text-alabaster">
                            <Play className="h-4 w-4 mr-2" />
                            Continue
                          </Button>
                        </Link>
                      ) : (
                        <Link href={`/dashboard/course/${course._id}`} className="flex-1">
                          <Button className="w-full bg-charcoal hover:bg-charcoal/90 text-alabaster">
                            <Play className="h-4 w-4 mr-2" />
                            Try It
                          </Button>
                        </Link>
                      )}
                      <Button variant="outline" size="icon" className="bg-transparent border-warm-gray/30">
                        <Award className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-warm-gray">No courses found.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="enrolled" className="space-y-6">
          {assignedCourses.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {assignedCourses.map((course) => (
                <Card
                  key={course._id}
                  className="bg-card border-warm-gray/20 shadow-soft hover:shadow-soft-lg transition-soft"
                >
                  <CardHeader className="space-y-4">
                    <div className="flex items-start justify-between">
                      <Badge className={getCategoryColor(course.category)} variant="outline">
                        {course.category.charAt(0).toUpperCase() + course.category.slice(1)}
                      </Badge>
                      <Badge className={getDifficultyColor(course.difficulty)} variant="secondary">
                        {course.difficulty}
                      </Badge>
                    </div>
                    <div>
                      <CardTitle className="text-lg text-charcoal">{course.title}</CardTitle>
                      <CardDescription className="text-warm-gray mt-2">{course.description}</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between text-sm text-warm-gray">
                      <span>By {course.instructor}</span>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>{course.assignedCount} Assigned</span>
                      </div>
                    </div>
                    <Link href={`/dashboard/course/${course._id}`} className="mt-3 w-full">
                      <Button className="w-full bg-charcoal hover:bg-charcoal/90 text-alabaster">
                        <Play className="h-4 w-4 mr-2" />
                        View Course
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-warm-gray">You have not assigned any courses yet.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
