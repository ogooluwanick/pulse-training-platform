"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ArrowLeft, Play, CheckCircle, Lock, Award, BookOpen } from "lucide-react"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"

interface Lesson {
  _id: string
  title: string
  type: "text" | "video" | "image"
  content: string
}

interface Quiz {
  _id: string
  title: string
  questions: {
    _id: string
    question: string
    options: string[]
    answer: string
  }[]
}

interface Course {
  _id: string
  title: string
  description: string
  category: string
  lessons: Lesson[]
  quiz?: Quiz
}

export default function CoursePage() {
  const params = useParams()
  const router = useRouter()
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCelebration, setShowCelebration] = useState(false)
  // Mock progress and completion status for now
  const [progress, setProgress] = useState(0)
  const [completedItems, setCompletedItems] = useState<string[]>([])

  useEffect(() => {
    const fetchCourse = async () => {
      if (!params.id) return
      try {
        const response = await fetch(`/api/course/${params.id}`)
        if (!response.ok) {
          throw new Error("Failed to fetch course")
        }
        const data = await response.json()
        setCourse(data)
        // Mock progress calculation
        const totalItems = data.lessons.length + (data.quiz ? 1 : 0)
        const completedCount = Math.floor(Math.random() * totalItems) // Mock completed count
        setCompletedItems(
          [...data.lessons, data.quiz]
            .filter(Boolean)
            .slice(0, completedCount)
            .map((item) => item._id)
        )
        setProgress(Math.round((completedCount / totalItems) * 100))
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchCourse()
  }, [params.id])

  const handleLessonComplete = (lessonId: string) => {
    // Handle lesson completion logic
    setShowCelebration(true)
    setTimeout(() => setShowCelebration(false), 3000)
  }

  const getTypeIcon = (type: Lesson["type"] | "quiz") => {
    switch (type) {
      case "video":
        return <Play className="h-4 w-4" />
      case "text":
      case "image":
        return <BookOpen className="h-4 w-4" />
      case "quiz":
        return <Award className="h-4 w-4" />
      default:
        return <Play className="h-4 w-4" />
    }
  }

  const getTypeColor = (type: Lesson["type"] | "quiz") => {
    switch (type) {
      case "video":
        return "bg-charcoal text-alabaster"
      case "text":
      case "image":
        return "bg-success-green text-alabaster"
      case "quiz":
        return "bg-warning-ochre text-alabaster"
      default:
        return "bg-warm-gray text-alabaster"
    }
  }

  if (loading) {
    return (
      <div className="flex-1 space-y-6 p-6" style={{ backgroundColor: "#f5f4ed" }}>
        <Skeleton className="h-10 w-1/4" />
        <Skeleton className="h-24 w-full" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 space-y-6 p-6 text-center text-warning-ochre" style={{ backgroundColor: "#f5f4ed" }}>
        <h1 className="text-2xl">Error: {error}</h1>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="flex-1 space-y-6 p-6 text-center" style={{ backgroundColor: "#f5f4ed" }}>
        <h1 className="text-2xl">Course not found.</h1>
      </div>
    )
  }

  const totalItems = course.lessons.length + (course.quiz ? 1 : 0)
  const isCompleted = (itemId: string) => completedItems.includes(itemId)
  // For now, we'll say nothing is locked.
  const isLocked = (itemId: string, index: number) => false

  return (
    <div className="flex-1 space-y-6 p-6" style={{ backgroundColor: "#f5f4ed" }}>
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="outline" size="sm" className="bg-transparent border-warm-gray/30">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-charcoal">{course.title}</h1>
          <p className="text-warm-gray">{course.description}</p>
        </div>
      </div>

      {/* Course Progress */}
      <Card className="bg-card border-warm-gray/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-charcoal">Course Progress</CardTitle>
              <CardDescription className="text-warm-gray">
                {completedItems.length} of {totalItems} items completed
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-charcoal">{progress}%</div>
              <p className="text-sm text-warm-gray">Complete</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={progress} className="h-3" />
        </CardContent>
      </Card>

      {/* Lessons */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-charcoal">Course Content</h2>
        <div className="space-y-3">
          {course.lessons.map((lesson, index) => (
            <Card
              key={lesson._id}
              className={`bg-card border-warm-gray/20 transition-soft ${
                isLocked(lesson._id, index) ? "opacity-60" : "hover:shadow-soft-lg cursor-pointer"
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-parchment text-sm font-medium text-charcoal">
                      {index + 1}
                    </div>
                    {isCompleted(lesson._id) ? (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-success-green">
                        <CheckCircle className="h-4 w-4 text-alabaster" />
                      </div>
                    ) : isLocked(lesson._id, index) ? (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-warm-gray">
                        <Lock className="h-4 w-4 text-alabaster" />
                      </div>
                    ) : null}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-charcoal">{lesson.title}</h3>
                      <Badge className={getTypeColor(lesson.type)} variant="secondary">
                        {getTypeIcon(lesson.type)}
                        <span className="ml-1 capitalize">{lesson.type}</span>
                      </Badge>
                    </div>
                    {/* <p className="text-sm text-warm-gray">{lesson.content}</p> */}
                  </div>

                  <div className="flex gap-2">
                    {isCompleted(lesson._id) ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-transparent border-success-green text-success-green"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Completed
                      </Button>
                    ) : isLocked(lesson._id, index) ? (
                      <Button variant="outline" size="sm" disabled className="bg-transparent">
                        <Lock className="h-4 w-4 mr-2" />
                        Locked
                      </Button>
                    ) : (
                      <Link href={`/dashboard/course/${params.id}/lesson/${lesson._id}`}>
                        <Button size="sm" className="bg-charcoal hover:bg-charcoal/90 text-alabaster">
                          <Play className="h-4 w-4 mr-2" />
                          Start
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {course.quiz && (
            <Card
              key={course.quiz._id}
              className={`bg-card border-warm-gray/20 transition-soft ${
                isLocked(course.quiz._id, course.lessons.length)
                  ? "opacity-60"
                  : "hover:shadow-soft-lg cursor-pointer"
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-parchment text-sm font-medium text-charcoal">
                      {course.lessons.length + 1}
                    </div>
                    {isCompleted(course.quiz._id) ? (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-success-green">
                        <CheckCircle className="h-4 w-4 text-alabaster" />
                      </div>
                    ) : isLocked(course.quiz._id, course.lessons.length) ? (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-warm-gray">
                        <Lock className="h-4 w-4 text-alabaster" />
                      </div>
                    ) : null}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-charcoal">{course.quiz.title}</h3>
                      <Badge className={getTypeColor("quiz")} variant="secondary">
                        {getTypeIcon("quiz")}
                        <span className="ml-1 capitalize">Quiz</span>
                      </Badge>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {isCompleted(course.quiz._id) ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-transparent border-success-green text-success-green"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Completed
                      </Button>
                    ) : isLocked(course.quiz._id, course.lessons.length) ? (
                      <Button variant="outline" size="sm" disabled className="bg-transparent">
                        <Lock className="h-4 w-4 mr-2" />
                        Locked
                      </Button>
                    ) : (
                      <Link href={`/dashboard/course/${params.id}/quiz/${course.quiz._id}`}>
                        <Button size="sm" className="bg-charcoal hover:bg-charcoal/90 text-alabaster">
                          <Play className="h-4 w-4 mr-2" />
                          Start Quiz
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Celebration Modal */}
      <Dialog open={showCelebration} onOpenChange={setShowCelebration}>
        <DialogContent className="bg-parchment border-warm-gray/20 text-center shadow-2xl">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success-green animate-pulse">
                <CheckCircle className="h-8 w-8 text-alabaster" />
              </div>
            </div>
            <DialogTitle className="text-2xl text-charcoal">Lesson Complete!</DialogTitle>
            <DialogDescription className="text-warm-gray">
              Great job! You've successfully completed this lesson. The next lesson is now unlocked.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  )
}
