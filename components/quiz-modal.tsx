"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Clock, CheckCircle, XCircle, AlertTriangle, Trophy, RotateCcw, ArrowLeft, ArrowRight } from "lucide-react"

interface QuizQuestion {
  id: string
  type: "multiple-choice" | "multiple-select" | "true-false" | "short-answer"
  question: string
  options?: string[]
  correctAnswer: string | string[]
  explanation?: string
}

interface QuizData {
  id: string
  title: string
  description: string
  questions: QuizQuestion[]
  timeLimit: number // in minutes
  passingScore: number // percentage
  maxAttempts: number
}

interface QuizModalProps {
  isOpen: boolean
  onClose: () => void
  quiz: QuizData
  onComplete: (score: number, passed: boolean) => void
}

interface UserAnswer {
  questionId: string
  answer: string | string[]
}

export function QuizModal({ isOpen, onClose, quiz, onComplete }: QuizModalProps) {
  const [currentStep, setCurrentStep] = useState<"intro" | "quiz" | "results">("intro")
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([])
  const [timeRemaining, setTimeRemaining] = useState(quiz.timeLimit * 60) // in seconds
  const [quizStarted, setQuizStarted] = useState(false)
  const [quizResults, setQuizResults] = useState<{
    score: number
    passed: boolean
    correctAnswers: number
    totalQuestions: number
    answers: { questionId: string; correct: boolean; userAnswer: string | string[]; correctAnswer: string | string[] }[]
  } | null>(null)

  // Timer effect
  useEffect(() => {
    if (quizStarted && currentStep === "quiz" && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleSubmitQuiz()
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [quizStarted, currentStep, timeRemaining])

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const getTimeColor = () => {
    const percentage = (timeRemaining / (quiz.timeLimit * 60)) * 100
    if (percentage <= 10) return "text-red-500"
    if (percentage <= 25) return "text-warning-ochre"
    return "text-charcoal"
  }

  const startQuiz = () => {
    setCurrentStep("quiz")
    setQuizStarted(true)
    setTimeRemaining(quiz.timeLimit * 60)
  }

  const handleAnswerChange = (questionId: string, answer: string | string[]) => {
    setUserAnswers((prev) => {
      const existing = prev.find((a) => a.questionId === questionId)
      if (existing) {
        return prev.map((a) => (a.questionId === questionId ? { ...a, answer } : a))
      }
      return [...prev, { questionId, answer }]
    })
  }

  const getCurrentAnswer = (questionId: string) => {
    return userAnswers.find((a) => a.questionId === questionId)?.answer || ""
  }

  const isQuestionAnswered = (questionId: string) => {
    const answer = getCurrentAnswer(questionId)
    if (Array.isArray(answer)) {
      return answer.length > 0
    }
    return answer !== ""
  }

  const getAnsweredQuestionsCount = () => {
    return quiz.questions.filter((q) => isQuestionAnswered(q.id)).length
  }

  const calculateScore = () => {
    let correctAnswers = 0
    const detailedResults: any[] = []

    quiz.questions.forEach((question) => {
      const userAnswer = getCurrentAnswer(question.id)
      let isCorrect = false

      if (question.type === "multiple-select") {
        const userAnswerArray = Array.isArray(userAnswer) ? userAnswer : []
        const correctAnswerArray = Array.isArray(question.correctAnswer) ? question.correctAnswer : []
        isCorrect =
          userAnswerArray.length === correctAnswerArray.length &&
          userAnswerArray.every((answer) => correctAnswerArray.includes(answer))
      } else {
        isCorrect = userAnswer === question.correctAnswer
      }

      if (isCorrect) correctAnswers++

      detailedResults.push({
        questionId: question.id,
        correct: isCorrect,
        userAnswer,
        correctAnswer: question.correctAnswer,
      })
    })

    const score = Math.round((correctAnswers / quiz.questions.length) * 100)
    const passed = score >= quiz.passingScore

    return {
      score,
      passed,
      correctAnswers,
      totalQuestions: quiz.questions.length,
      answers: detailedResults,
    }
  }

  const handleSubmitQuiz = () => {
    const results = calculateScore()
    setQuizResults(results)
    setCurrentStep("results")
    onComplete(results.score, results.passed)
  }

  const handleRetakeQuiz = () => {
    setCurrentStep("intro")
    setCurrentQuestionIndex(0)
    setUserAnswers([])
    setTimeRemaining(quiz.timeLimit * 60)
    setQuizStarted(false)
    setQuizResults(null)
  }

  const handleCompleteLesson = () => {
    onClose()
  }

  const currentQuestion = quiz.questions[currentQuestionIndex]

  const renderQuestion = (question: QuizQuestion) => {
    const userAnswer = getCurrentAnswer(question.id)

    switch (question.type) {
      case "multiple-choice":
      case "true-false":
        return (
          <RadioGroup
            value={userAnswer as string}
            onValueChange={(value) => handleAnswerChange(question.id, value)}
            className="space-y-3"
          >
            {question.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${question.id}-${index}`} />
                <Label htmlFor={`${question.id}-${index}`} className="text-charcoal cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        )

      case "multiple-select":
        const selectedAnswers = Array.isArray(userAnswer) ? userAnswer : []
        return (
          <div className="space-y-3">
            {question.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Checkbox
                  id={`${question.id}-${index}`}
                  checked={selectedAnswers.includes(option)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      handleAnswerChange(question.id, [...selectedAnswers, option])
                    } else {
                      handleAnswerChange(
                        question.id,
                        selectedAnswers.filter((a) => a !== option),
                      )
                    }
                  }}
                />
                <Label htmlFor={`${question.id}-${index}`} className="text-charcoal cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </div>
        )

      case "short-answer":
        return (
          <Textarea
            value={userAnswer as string}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder="Enter your answer here..."
            className="bg-alabaster border-warm-gray/30 focus:border-charcoal"
            rows={4}
          />
        )

      default:
        return null
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-parchment border-warm-gray/20 shadow-xl max-w-4xl max-h-[90vh] overflow-y-auto">
        {currentStep === "intro" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl text-charcoal">{quiz.title}</DialogTitle>
              <DialogDescription className="text-warm-gray">{quiz.description}</DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-alabaster border-warm-gray/20">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-charcoal">{quiz.questions.length}</div>
                    <div className="text-sm text-warm-gray">Questions</div>
                  </CardContent>
                </Card>
                <Card className="bg-alabaster border-warm-gray/20">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-charcoal">{quiz.timeLimit}</div>
                    <div className="text-sm text-warm-gray">Minutes</div>
                  </CardContent>
                </Card>
                <Card className="bg-alabaster border-warm-gray/20">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-charcoal">{quiz.passingScore}%</div>
                    <div className="text-sm text-warm-gray">Passing Score</div>
                  </CardContent>
                </Card>
                <Card className="bg-alabaster border-warm-gray/20">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-charcoal">{quiz.maxAttempts}</div>
                    <div className="text-sm text-warm-gray">Max Attempts</div>
                  </CardContent>
                </Card>
              </div>
              <div className="p-4 rounded-lg bg-charcoal/10 border border-charcoal/20">
                <h4 className="font-medium text-charcoal mb-2">Instructions:</h4>
                <ul className="text-sm text-warm-gray space-y-1">
                  <li>• Read each question carefully before answering</li>
                  <li>• You can navigate between questions using the Previous/Next buttons</li>
                  <li>• Make sure to answer all questions before submitting</li>
                  <li>• The quiz will auto-submit when time runs out</li>
                </ul>
              </div>
              <Button onClick={startQuiz} className="w-full btn-primary text-lg py-6">
                Start Quiz
              </Button>
            </div>
          </>
        )}

        {currentStep === "quiz" && (
          <>
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="text-xl text-charcoal">{quiz.title}</DialogTitle>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Clock className={`h-4 w-4 ${getTimeColor()}`} />
                    <span className={`font-mono text-lg ${getTimeColor()}`}>{formatTime(timeRemaining)}</span>
                  </div>
                  {timeRemaining <= 60 && (
                    <Badge className="bg-red-500 text-alabaster animate-pulse">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Time Running Out!
                    </Badge>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-warm-gray">
                  <span>
                    Question {currentQuestionIndex + 1} of {quiz.questions.length}
                  </span>
                  <span>
                    {getAnsweredQuestionsCount()} of {quiz.questions.length} answered
                  </span>
                </div>
                <Progress value={((currentQuestionIndex + 1) / quiz.questions.length) * 100} className="h-2" />
              </div>
            </DialogHeader>

            <div className="space-y-6">
              <Card className="bg-alabaster border-warm-gray/20">
                <CardHeader>
                  <CardTitle className="text-lg text-charcoal">{currentQuestion.question}</CardTitle>
                  {currentQuestion.type === "multiple-select" && (
                    <CardDescription className="text-warm-gray">Select all that apply</CardDescription>
                  )}
                </CardHeader>
                <CardContent>{renderQuestion(currentQuestion)}</CardContent>
              </Card>

              {/* Question Navigation */}
              <div className="flex flex-wrap gap-2 p-4 bg-alabaster rounded-lg border border-warm-gray/20">
                <div className="text-sm text-warm-gray mb-2 w-full">Quick Navigation:</div>
                {quiz.questions.map((_, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className={`w-10 h-10 ${
                      index === currentQuestionIndex
                        ? "bg-charcoal text-alabaster border-charcoal"
                        : isQuestionAnswered(quiz.questions[index].id)
                          ? "bg-success-green text-alabaster border-success-green"
                          : "bg-parchment border-warm-gray/30"
                    }`}
                    onClick={() => setCurrentQuestionIndex(index)}
                  >
                    {index + 1}
                  </Button>
                ))}
              </div>

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                  disabled={currentQuestionIndex === 0}
                  className="bg-alabaster border-warm-gray/30"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>

                {currentQuestionIndex === quiz.questions.length - 1 ? (
                  <Button onClick={handleSubmitQuiz} className="btn-primary">
                    Submit Quiz
                  </Button>
                ) : (
                  <Button
                    onClick={() =>
                      setCurrentQuestionIndex(Math.min(quiz.questions.length - 1, currentQuestionIndex + 1))
                    }
                    className="btn-primary"
                  >
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </>
        )}

        {currentStep === "results" && quizResults && (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl text-charcoal flex items-center gap-2">
                {quizResults.passed ? (
                  <Trophy className="h-6 w-6 text-success-green" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-500" />
                )}
                Quiz Results
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <Card
                className={`border-2 ${quizResults.passed ? "border-success-green bg-success-green/10" : "border-red-500 bg-red-500/10"}`}
              >
                <CardContent className="p-6 text-center">
                  <div
                    className="text-6xl font-bold mb-2"
                    style={{ color: quizResults.passed ? "#22c55e" : "#ef4444" }}
                  >
                    {quizResults.score}%
                  </div>
                  <div className="text-xl font-medium text-charcoal mb-2">
                    {quizResults.passed ? "Congratulations! You Passed!" : "Quiz Not Passed"}
                  </div>
                  <div className="text-warm-gray">
                    You answered {quizResults.correctAnswers} out of {quizResults.totalQuestions} questions correctly
                  </div>
                  <div className="text-sm text-warm-gray mt-2">Passing score: {quiz.passingScore}%</div>
                </CardContent>
              </Card>

              <Card className="bg-alabaster border-warm-gray/20">
                <CardHeader>
                  <CardTitle className="text-lg text-charcoal">Question Review</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {quiz.questions.map((question, index) => {
                    const result = quizResults.answers.find((a) => a.questionId === question.id)
                    return (
                      <div key={question.id} className="p-3 rounded-lg bg-parchment border border-warm-gray/20">
                        <div className="flex items-start gap-3">
                          {result?.correct ? (
                            <CheckCircle className="h-5 w-5 text-success-green mt-0.5" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <p className="text-sm font-medium text-charcoal mb-1">
                              Question {index + 1}: {question.question}
                            </p>
                            <div className="text-xs text-warm-gray space-y-1">
                              <p>
                                Your answer:{" "}
                                {Array.isArray(result?.userAnswer) ? result?.userAnswer.join(", ") : result?.userAnswer}
                              </p>
                              <p>
                                Correct answer:{" "}
                                {Array.isArray(result?.correctAnswer)
                                  ? result?.correctAnswer.join(", ")
                                  : result?.correctAnswer}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>

              <div className="flex gap-4">
                {!quizResults.passed && (
                  <Button
                    onClick={handleRetakeQuiz}
                    variant="outline"
                    className="flex-1 bg-alabaster border-warm-gray/30"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Retake Quiz
                  </Button>
                )}
                <Button onClick={handleCompleteLesson} className="flex-1 btn-primary">
                  {quizResults.passed ? "Complete Lesson" : "Continue Learning"}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
