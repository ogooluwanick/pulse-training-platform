"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookOpen, Clock, Award, Users, Star, Search, Play } from "lucide-react"
import Link from "next/link"

interface Course {
  id: string
  title: string
  description: string
  instructor: string
  duration: string
  difficulty: "Beginner" | "Intermediate" | "Advanced"
  category: "compliance" | "skills" | "culture" | "technical"
  rating: number
  enrolledCount: number
  tags: string[]
  isEnrolled: boolean
  isFeatured: boolean
}

const mockCourses: Course[] = [
  {
    id: "1",
    title: "Advanced Data Analytics",
    description: "Master data analysis techniques and tools for business insights",
    instructor: "Dr. Sarah Chen",
    duration: "6 hours",
    difficulty: "Advanced",
    category: "technical",
    rating: 4.8,
    enrolledCount: 1250,
    tags: ["Analytics", "Data Science", "Business Intelligence"],
    isEnrolled: false,
    isFeatured: true,
  },
  {
    id: "2",
    title: "Effective Communication Skills",
    description: "Develop professional communication and presentation skills",
    instructor: "Michael Rodriguez",
    duration: "4 hours",
    difficulty: "Intermediate",
    category: "skills",
    rating: 4.6,
    enrolledCount: 2100,
    tags: ["Communication", "Presentation", "Leadership"],
    isEnrolled: false,
    isFeatured: true,
  },
  {
    id: "3",
    title: "Cybersecurity Fundamentals",
    description: "Essential cybersecurity practices for modern organizations",
    instructor: "Alex Thompson",
    duration: "5 hours",
    difficulty: "Beginner",
    category: "compliance",
    rating: 4.7,
    enrolledCount: 3200,
    tags: ["Security", "Risk Management", "Compliance"],
    isEnrolled: true,
    isFeatured: false,
  },
  {
    id: "4",
    title: "Project Management Essentials",
    description: "Learn project management methodologies and best practices",
    instructor: "Jennifer Park",
    duration: "8 hours",
    difficulty: "Intermediate",
    category: "skills",
    rating: 4.5,
    enrolledCount: 1800,
    tags: ["Project Management", "Agile", "Leadership"],
    isEnrolled: false,
    isFeatured: false,
  },
  {
    id: "5",
    title: "Company Culture Deep Dive",
    description: "Understanding our values, mission, and workplace culture",
    instructor: "HR Team",
    duration: "3 hours",
    difficulty: "Beginner",
    category: "culture",
    rating: 4.4,
    enrolledCount: 950,
    tags: ["Culture", "Values", "Onboarding"],
    isEnrolled: false,
    isFeatured: false,
  },
  {
    id: "6",
    title: "Financial Compliance Training",
    description: "Comprehensive training on financial regulations and compliance",
    instructor: "Robert Kim",
    duration: "7 hours",
    difficulty: "Advanced",
    category: "compliance",
    rating: 4.9,
    enrolledCount: 1100,
    tags: ["Finance", "Compliance", "Regulations"],
    isEnrolled: false,
    isFeatured: true,
  },
]

export default function CourseCatalogPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedDifficulty, setSelectedDifficulty] = useState("all")

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

  const filteredCourses = mockCourses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = selectedCategory === "all" || course.category === selectedCategory
    const matchesDifficulty = selectedDifficulty === "all" || course.difficulty === selectedDifficulty

    return matchesSearch && matchesCategory && matchesDifficulty
  })

  const featuredCourses = mockCourses.filter((course) => course.isFeatured)

  return (
    <div className="flex-1 space-y-6 p-6" style={{ backgroundColor: "#f5f4ed" }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-charcoal">Course Catalog</h1>
          <p className="text-warm-gray">Discover and enroll in courses to advance your skills</p>
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
          <TabsTrigger value="featured" className="data-[state=active]:bg-alabaster">
            Featured
          </TabsTrigger>
          <TabsTrigger value="enrolled" className="data-[state=active]:bg-alabaster">
            My Courses
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredCourses.map((course) => (
              <Card
                key={course.id}
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
                      <span>{course.duration}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span>{course.enrolledCount.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {course.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs bg-alabaster border-warm-gray/30">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    {course.isEnrolled ? (
                      <Link href={`/dashboard/course/${course.id}`} className="flex-1">
                        <Button className="w-full bg-success-green hover:bg-success-green/90 text-alabaster">
                          <Play className="h-4 w-4 mr-2" />
                          Continue
                        </Button>
                      </Link>
                    ) : (
                      <Button className="flex-1 bg-charcoal hover:bg-charcoal/90 text-alabaster">
                        <BookOpen className="h-4 w-4 mr-2" />
                        Enroll
                      </Button>
                    )}
                    <Button variant="outline" size="icon" className="bg-transparent border-warm-gray/30">
                      <Award className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="featured" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featuredCourses.map((course) => (
              <Card
                key={course.id}
                className="bg-card border-warm-gray/20 shadow-soft hover:shadow-soft-lg transition-soft relative"
              >
                <div className="absolute top-4 left-4 z-10">
                  <Badge className="bg-warning-ochre text-alabaster">Featured</Badge>
                </div>
                <CardHeader className="space-y-4 pt-12">
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
                      <span>{course.duration}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span>{course.enrolledCount.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {course.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs bg-alabaster border-warm-gray/30">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    {course.isEnrolled ? (
                      <Link href={`/dashboard/course/${course.id}`} className="flex-1">
                        <Button className="w-full bg-success-green hover:bg-success-green/90 text-alabaster">
                          <Play className="h-4 w-4 mr-2" />
                          Continue
                        </Button>
                      </Link>
                    ) : (
                      <Button className="flex-1 bg-charcoal hover:bg-charcoal/90 text-alabaster">
                        <BookOpen className="h-4 w-4 mr-2" />
                        Enroll
                      </Button>
                    )}
                    <Button variant="outline" size="icon" className="bg-transparent border-warm-gray/30">
                      <Award className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="enrolled" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {mockCourses
              .filter((course) => course.isEnrolled)
              .map((course) => (
                <Card
                  key={course.id}
                  className="bg-card border-warm-gray/20 shadow-soft hover:shadow-soft-lg transition-soft"
                >
                  <CardHeader className="space-y-4">
                    <div className="flex items-start justify-between">
                      <Badge className="bg-success-green text-alabaster">Enrolled</Badge>
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
                    <Link href={`/dashboard/course/${course.id}`}>
                      <Button className="w-full bg-success-green hover:bg-success-green/90 text-alabaster">
                        <Play className="h-4 w-4 mr-2" />
                        Continue Learning
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
