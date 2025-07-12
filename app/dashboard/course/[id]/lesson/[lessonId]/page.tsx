"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  ArrowLeft,
  ArrowRight,
  Play,
  Pause,
  Volume2,
  Settings,
  BookOpen,
  FileText,
  CheckCircle,
  Award,
} from "lucide-react"
import Link from "next/link"
import { QuizModal } from "@/components/quiz-modal"

interface LessonContent {
  id: string
  title: string
  type: "video" | "reading" | "quiz"
  duration: string
  content: {
    videoUrl?: string
    transcript?: string
    readingContent?: string
    quizQuestions?: QuizQuestion[]
  }
  notes: string[]
  isCompleted: boolean
}

interface QuizQuestion {
  id: string
  question: string
  type: "multiple-choice" | "true-false" | "short-answer"
  options?: string[]
  correctAnswer: string | number
}

const mockLesson: LessonContent = {
  id: "4",
  title: "Privacy Impact Assessments",
  type: "reading",
  duration: "25 min",
  content: {
    readingContent: `
# Privacy Impact Assessments (PIAs)

## Introduction

A Privacy Impact Assessment (PIA) is a systematic process for evaluating the potential effects on privacy of a project, initiative, or proposed system or scheme. PIAs are essential tools for identifying and mitigating privacy risks before they materialize.

## When to Conduct a PIA

PIAs should be conducted when:

- Processing personal data in a new way
- Implementing new technology systems
- Sharing data with third parties
- Processing sensitive or special category data
- Large-scale processing operations
- Systematic monitoring of individuals

## Key Components of a PIA

### 1. Data Flow Mapping
Understanding how personal data moves through your organization and systems.

### 2. Risk Assessment
Identifying potential privacy risks and their likelihood and impact.

### 3. Mitigation Strategies
Developing measures to reduce or eliminate identified risks.

### 4. Stakeholder Consultation
Engaging with relevant parties including data subjects where appropriate.

## Best Practices

1. **Start Early**: Conduct PIAs during the design phase, not after implementation
2. **Be Thorough**: Consider all aspects of data processing
3. **Document Everything**: Maintain detailed records of the assessment process
4. **Regular Reviews**: Update PIAs when circumstances change
5. **Seek Expertise**: Involve privacy professionals and legal counsel

## Conclusion

PIAs are not just compliance exercises but valuable tools for building privacy by design into your operations. They help organizations make informed decisions about privacy risks and demonstrate accountability to regulators and stakeholders.
    `,
  },
  notes: [
    "PIAs are required for high-risk processing under GDPR Article 35",
    "Must be completed before processing begins",
    "Should involve the Data Protection Officer where applicable",
  ],
  isCompleted: false,
}

export default function LessonPage() {
  const params = useParams()
  const router = useRouter()
  const [currentProgress, setCurrentProgress] = useState(45)
  const [userNotes, setUserNotes] = useState("")
  const [isPlaying, setIsPlaying] = useState(false)
  const [showQuiz, setShowQuiz] = useState(false)

  const handleCompleteLesson = () => {
    // Handle lesson completion logic
    router.push(`/dashboard/course/${params.id}`)
  }

  const handleNextLesson = () => {
    // Navigate to next lesson
    router.push(`/dashboard/course/${params.id}/lesson/5`)
  }

  return (
    <div className="flex-1" style={{ backgroundColor: "#f5f4ed" }}>
      {/* Header */}
      <div className="border-b border-warm-gray/20 bg-parchment/50 backdrop-blur-sm sticky top-16 z-30">
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center gap-4">
            <Link href={`/dashboard/course/${params.id}`}>
              <Button variant="outline" size="sm" className="bg-transparent border-warm-gray/30">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Course
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-charcoal">{mockLesson.title}</h1>
              <div className="flex items-center gap-2 text-sm text-warm-gray">
                <Badge className="bg-success-green text-alabaster" variant="secondary">
                  <BookOpen className="h-3 w-3 mr-1" />
                  Reading
                </Badge>
                <span>{mockLesson.duration}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-sm text-warm-gray">Progress: {currentProgress}%</div>
            <Progress value={currentProgress} className="w-32 h-2" />
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6 p-6">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Lesson Content */}
          <Card className="bg-card border-warm-gray/20">
            <CardContent className="p-8">
              {mockLesson.type === "video" && (
                <div className="space-y-4">
                  <div className="aspect-video bg-charcoal rounded-lg flex items-center justify-center">
                    <div className="text-center space-y-4">
                      <Button
                        size="lg"
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="bg-alabaster hover:bg-alabaster/90 text-charcoal rounded-full w-16 h-16"
                      >
                        {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                      </Button>
                      <p className="text-alabaster">Video content would be displayed here</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="bg-transparent border-warm-gray/30">
                        <Volume2 className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="bg-transparent border-warm-gray/30">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="text-sm text-warm-gray">5:23 / 25:00</div>
                  </div>
                </div>
              )}

              {mockLesson.type === "reading" && (
                <div className="prose prose-lg max-w-none">
                  <div
                    className="text-charcoal leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html:
                        mockLesson.content.readingContent
                          ?.replace(/\n/g, "<br>")
                          .replace(/#{1,6}\s/g, '<h3 class="text-xl font-semibold text-charcoal mt-6 mb-3">')
                          .replace(/<h3[^>]*>/g, '<h3 class="text-xl font-semibold text-charcoal mt-6 mb-3">') || "",
                    }}
                  />
                </div>
              )}

              {mockLesson.type === "quiz" && (
                <div className="space-y-6">
                  <div className="text-center space-y-4">
                    <div className="flex justify-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-warning-ochre/10">
                        <Award className="h-8 w-8 text-warning-ochre" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-2xl font-bold text-charcoal">Knowledge Assessment</h2>
                      <p className="text-warm-gray">Test your understanding of the lesson content</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-4 max-w-md mx-auto">
                      <div className="text-center p-4 rounded-lg bg-alabaster border border-warm-gray/20">
                        <div className="text-2xl font-bold text-charcoal">5</div>
                        <div className="text-sm text-warm-gray">Questions</div>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-alabaster border border-warm-gray/20">
                        <div className="text-2xl font-bold text-charcoal">30</div>
                        <div className="text-sm text-warm-gray">Minutes</div>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-alabaster border border-warm-gray/20">
                        <div className="text-2xl font-bold text-charcoal">70%</div>
                        <div className="text-sm text-warm-gray">To Pass</div>
                      </div>
                    </div>
                    <Button
                      onClick={() => setShowQuiz(true)}
                      className="bg-warning-ochre hover:bg-warning-ochre/90 text-alabaster px-8"
                    >
                      Start Assessment
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button variant="outline" className="bg-transparent border-warm-gray/30">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous Lesson
            </Button>
            <div className="flex gap-2">
              <Button
                onClick={handleCompleteLesson}
                className="bg-success-green hover:bg-success-green/90 text-alabaster"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark Complete
              </Button>
              <Button onClick={handleNextLesson} className="bg-charcoal hover:bg-charcoal/90 text-alabaster">
                Next Lesson
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Lesson Notes */}
          <Card className="bg-card border-warm-gray/20">
            <CardHeader>
              <CardTitle className="text-charcoal flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Key Points
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockLesson.notes.map((note, index) => (
                <div key={index} className="p-3 rounded-lg bg-alabaster border border-warm-gray/20">
                  <p className="text-sm text-charcoal">{note}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Personal Notes */}
          <Card className="bg-card border-warm-gray/20">
            <CardHeader>
              <CardTitle className="text-charcoal">My Notes</CardTitle>
              <CardDescription className="text-warm-gray">Add your personal notes and thoughts</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Write your notes here..."
                value={userNotes}
                onChange={(e) => setUserNotes(e.target.value)}
                rows={6}
                className="bg-alabaster border-warm-gray/30 focus:border-charcoal"
              />
              <Button className="w-full mt-3 bg-charcoal hover:bg-charcoal/90 text-alabaster" size="sm">
                Save Notes
              </Button>
            </CardContent>
          </Card>

          {/* Course Progress */}
          <Card className="bg-card border-warm-gray/20">
            <CardHeader>
              <CardTitle className="text-charcoal">Course Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-warm-gray">Overall Progress</span>
                  <span className="text-charcoal font-medium">75%</span>
                </div>
                <Progress value={75} className="h-2" />
                <div className="text-xs text-warm-gray">6 of 8 lessons completed</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      {/* Quiz Modal */}
      <QuizModal
        isOpen={showQuiz}
        onClose={() => setShowQuiz(false)}
        courseTitle="Data Privacy & GDPR Compliance"
        lessonTitle={mockLesson.title}
        questions={[]}
        passingScore={70}
        timeLimit={30}
      />
    </div>
  )
}
