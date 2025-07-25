"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { format } from "date-fns"
import { CheckCircle, Circle, Clock, BookOpen, HelpCircle } from "lucide-react"

interface Assignment {
  _id: string
  course: {
    _id: string
    title: string
    category: "compliance" | "skills" | "culture" | "technical"
    lessons: Array<{
      _id: string
      title: string
      type: 'text' | 'video' | 'image'
      content: string
      duration: number
      quiz?: {
        title: string
        questions: Array<{
          question: string
          options: string[]
          answer: string
        }>
      }
    }>
    finalQuiz?: {
      title: string
      questions: Array<{
        question: string
        options: string[]
        answer: string
      }>
    }
  }
  assignee: {
    _id: string
    name: string
    avatar: string
    department?: string
  }
  status: "completed" | "in-progress" | "not-started"
  endDate?: string
  progress: number
  lessonProgress?: Array<{
    lessonId: string
    status: 'not-started' | 'in-progress' | 'completed'
    completedAt?: string
    quizResult?: {
      score: number
      passed: boolean
      answers: Array<{
        question: string
        answer: any
        correct: boolean
      }>
    }
  }>
  finalQuizResult?: {
    score: number
    passed: boolean
    answers: Array<{
      question: string
      answer: any
      correct: boolean
    }>
  }
  createdAt: string
  updatedAt: string
}

interface Props {
  isOpen: boolean
  onClose: () => void
  assignment: Assignment | null
}

export default function AssignmentDetailsModal({
  isOpen,
  onClose,
  assignment,
}: Props) {
  if (!assignment) return null

  const getStatusColor = (status: Assignment["status"]) => {
    switch (status) {
      case "completed":
        return "bg-success-green text-alabaster"
      case "in-progress":
        return "bg-warning-ochre text-alabaster"
      case "not-started":
        return "bg-charcoal text-alabaster"
      default:
        return "bg-warm-gray text-alabaster"
    }
  }

  const getStatusDisplay = (status: Assignment["status"]) => {
    switch (status) {
      case "not-started":
        return "Not Started"
      case "in-progress":
        return "In Progress"
      case "completed":
        return "Completed"
      default:
        return status
    }
  }

  const getLessonStatus = (lessonId: string) => {
    const lessonProgress = assignment.lessonProgress?.find(
      (lp) => lp.lessonId === lessonId
    )
    return lessonProgress?.status || 'not-started'
  }

  const getLessonQuizResult = (lessonId: string) => {
    const lessonProgress = assignment.lessonProgress?.find(
      (lp) => lp.lessonId === lessonId
    )
    return lessonProgress?.quizResult
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-success-green" />
      case 'in-progress':
        return <Clock className="h-4 w-4 text-warning-ochre" />
      default:
        return <Circle className="h-4 w-4 text-warm-gray" />
    }
  }

  const totalLessons = assignment.course.lessons.length
  const completedLessons = assignment.lessonProgress?.filter(
    (lp) => lp.status === 'completed'
  ).length || 0

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto bg-alabaster">
        <DialogHeader>
          <DialogTitle className="text-2xl text-charcoal">
            {assignment.course.title}
          </DialogTitle>
          <DialogDescription>
            Assigned to{" "}
            <span className="font-semibold text-charcoal">
              {assignment.assignee.name}
            </span>
            {assignment.assignee.department && (
              <span className="text-warm-gray"> • {assignment.assignee.department}</span>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar>
                <AvatarImage
                  src={assignment.assignee.avatar}
                  alt={assignment.assignee.name}
                />
                <AvatarFallback>
                  {assignment.assignee.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">{assignment.assignee.name}</div>
                {assignment.assignee.department && (
                  <div className="text-sm text-warm-gray">
                    {assignment.assignee.department}
                  </div>
                )}
              </div>
            </div>
            <Badge className={getStatusColor(assignment.status)}>
              {getStatusDisplay(assignment.status)}
            </Badge>
          </div>
          
          <Separator />
          
          <div>
            <h3 className="text-lg font-semibold text-charcoal mb-2">
              Overall Progress
            </h3>
            <div className="flex items-center gap-4">
              <Progress value={assignment.progress} className="w-full" />
              <span className="font-semibold">{assignment.progress}%</span>
            </div>
            <div className="text-sm text-warm-gray mt-2">
              {completedLessons} of {totalLessons} lessons completed
            </div>
          </div>
          
          {assignment.endDate && (
            <div className="text-sm text-warm-gray">
              Due on {format(new Date(assignment.endDate), "PPP")}
            </div>
          )}
          
          <Separator />
          
          {/* Course Lessons */}
          <div>
            <h3 className="text-lg font-semibold text-charcoal mb-4">
              Course Lessons
            </h3>
            <div className="space-y-3">
              {assignment.course.lessons.map((lesson, index) => {
                const lessonStatus = getLessonStatus(lesson._id)
                const quizResult = getLessonQuizResult(lesson._id)
                
                return (
                  <Card key={lesson._id} className="bg-background/50">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getStatusIcon(lessonStatus)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium text-charcoal">
                              Lesson {index + 1}: {lesson.title}
                            </h4>
                            <Badge variant="outline" className="text-xs">
                              {lesson.type}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-warm-gray mb-2">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{lesson.duration} min</span>
                            </div>
                            {lesson.quiz && (
                              <div className="flex items-center gap-1">
                                <HelpCircle className="h-3 w-3" />
                                <span>Quiz: {lesson.quiz.questions.length} questions</span>
                              </div>
                            )}
                          </div>
                          
                          {quizResult && (
                            <div className="mt-2 p-2 bg-background rounded-md">
                              <div className="text-sm">
                                <span className="font-medium">Quiz Result: </span>
                                <span className={`${quizResult.passed ? 'text-success-green' : 'text-red-500'}`}>
                                  {quizResult.score}% {quizResult.passed ? '(Passed)' : '(Failed)'}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
          
          {/* Final Quiz */}
          {assignment.course.finalQuiz && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold text-charcoal mb-4">
                  Final Quiz
                </h3>
                <Card className="bg-background/50">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getStatusIcon(assignment.status === 'completed' ? 'completed' : 'not-started')}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-charcoal mb-2">
                          {assignment.course.finalQuiz.title}
                        </h4>
                        <div className="flex items-center gap-1 text-sm text-warm-gray mb-2">
                          <HelpCircle className="h-3 w-3" />
                          <span>{assignment.course.finalQuiz.questions.length} questions</span>
                        </div>
                        
                        {assignment.finalQuizResult && (
                          <div className="mt-2 p-2 bg-background rounded-md">
                            <div className="text-sm">
                              <span className="font-medium">Final Result: </span>
                              <span className={`${assignment.finalQuizResult.passed ? 'text-success-green' : 'text-red-500'}`}>
                                {assignment.finalQuizResult.score}% {assignment.finalQuizResult.passed ? '(Passed)' : '(Failed)'}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
          
          <Separator />
          
          <div className="text-xs text-warm-gray">
            <div>Created: {format(new Date(assignment.createdAt), "PPp")}</div>
            <div>Last Updated: {format(new Date(assignment.updatedAt), "PPp")}</div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
