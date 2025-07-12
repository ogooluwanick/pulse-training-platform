"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ArrowLeft, Play, CheckCircle, Lock, Award, BookOpen } from "lucide-react"
import Link from "next/link"

interface Lesson {
  id: string
  title: string
  description: string
  duration: string
  type: "video" | "reading" | "quiz"
  isCompleted: boolean
  isLocked: boolean
}

interface Course {
  id: string
  title: string
  description: string
  progress: number
  lessons: Lesson[]
}

const mockCourse: Course = {
  id: "1",
  title: "Data Privacy & GDPR Compliance",
  description: "Essential training on data protection regulations and best practices",
  progress: 75,
  lessons: [
    {
      id: "1",
      title: "Introduction to Data Privacy",
      description: "Overview of data privacy concepts and importance",
      duration: "15 min",
      type: "video",
      isCompleted: true,
      isLocked: false,
    },
    {
      id: "2",
      title: "GDPR Fundamentals",
      description: "Understanding the General Data Protection Regulation",
      duration: "20 min",
      type: "reading",
      isCompleted: true,
      isLocked: false,
    },
    {
      id: "3",
      title: "Data Subject Rights",
      description: "Rights of individuals under GDPR",
      duration: "18 min",
      type: "video",
      isCompleted: true,
      isLocked: false,
    },
    {
      id: "4",
      title: "Privacy Impact Assessments",
      description: "When and how to conduct PIAs",
      duration: "25 min",
      type: "reading",
      isCompleted: false,
      isLocked: false,
    },
    {
      id: "5",
      title: "Data Breach Response",
      description: "Procedures for handling data breaches",
      duration: "22 min",
      type: "video",
      isCompleted: false,
      isLocked: true,
    },
    {
      id: "6",
      title: "Final Assessment",
      description: "Test your knowledge of GDPR compliance",
      duration: "30 min",
      type: "quiz",
      isCompleted: false,
      isLocked: true,
    },
  ],
}

export default function CoursePage() {
  const params = useParams()
  const router = useRouter()
  const [showCelebration, setShowCelebration] = useState(false)

  const handleLessonComplete = (lessonId: string) => {
    // Handle lesson completion logic
    setShowCelebration(true)
    setTimeout(() => setShowCelebration(false), 3000)
  }

  const getTypeIcon = (type: Lesson["type"]) => {
    switch (type) {
      case "video":
        return <Play className="h-4 w-4" />
      case "reading":
        return <BookOpen className="h-4 w-4" />
      case "quiz":
        return <Award className="h-4 w-4" />
      default:
        return <Play className="h-4 w-4" />
    }
  }

  const getTypeColor = (type: Lesson["type"]) => {
    switch (type) {
      case "video":
        return "bg-charcoal text-alabaster"
      case "reading":
        return "bg-success-green text-alabaster"
      case "quiz":
        return "bg-warning-ochre text-alabaster"
      default:
        return "bg-warm-gray text-alabaster"
    }
  }

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
          <h1 className="text-3xl font-bold text-charcoal">{mockCourse.title}</h1>
          <p className="text-warm-gray">{mockCourse.description}</p>
        </div>
      </div>

      {/* Course Progress */}
      <Card className="bg-card border-warm-gray/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-charcoal">Course Progress</CardTitle>
              <CardDescription className="text-warm-gray">
                {mockCourse.lessons.filter((l) => l.isCompleted).length} of {mockCourse.lessons.length} lessons
                completed
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-charcoal">{mockCourse.progress}%</div>
              <p className="text-sm text-warm-gray">Complete</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={mockCourse.progress} className="h-3" />
        </CardContent>
      </Card>

      {/* Lessons */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-charcoal">Course Content</h2>
        <div className="space-y-3">
          {mockCourse.lessons.map((lesson, index) => (
            <Card
              key={lesson.id}
              className={`bg-card border-warm-gray/20 transition-soft ${
                lesson.isLocked ? "opacity-60" : "hover:shadow-soft-lg cursor-pointer"
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-parchment text-sm font-medium text-charcoal">
                      {index + 1}
                    </div>
                    {lesson.isCompleted ? (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-success-green">
                        <CheckCircle className="h-4 w-4 text-alabaster" />
                      </div>
                    ) : lesson.isLocked ? (
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
                    <p className="text-sm text-warm-gray">{lesson.description}</p>
                    <p className="text-xs text-warm-gray mt-1">{lesson.duration}</p>
                  </div>

                  <div className="flex gap-2">
                    {lesson.isCompleted ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-transparent border-success-green text-success-green"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Completed
                      </Button>
                    ) : lesson.isLocked ? (
                      <Button variant="outline" size="sm" disabled className="bg-transparent">
                        <Lock className="h-4 w-4 mr-2" />
                        Locked
                      </Button>
                    ) : (
                      <Link href={`/dashboard/course/${params.id}/lesson/${lesson.id}`}>
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
