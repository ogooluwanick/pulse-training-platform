'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Trophy,
  RotateCcw,
  ArrowLeft,
  ArrowRight,
  Save,
  AlertCircle,
  Info,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import toast from 'react-hot-toast';

interface QuizQuestion {
  id: string;
  type: 'multiple-choice' | 'multiple-select' | 'true-false' | 'short-answer';
  question: string;
  options?: string[];
  correctAnswer: string | string[];
  explanation?: string;
  required?: boolean;
}

interface QuizData {
  id: string;
  title: string;
  description: string;
  questions: QuizQuestion[];
  timeLimit: number; // in minutes
  passingScore: number; // percentage
  maxAttempts: number;
  allowRetake?: boolean;
  showResults?: boolean;
}

interface QuizResult {
  score: number;
  passed: boolean;
  correctAnswers: number;
  totalQuestions: number;
  answers: {
    questionId: string;
    correct: boolean;
    userAnswer: string | string[];
    correctAnswer: string | string[];
  }[];
}

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  quiz: QuizData;
  onComplete: (result: QuizResult) => void;
  courseId: string;
  lessonId?: string;
  isFinalQuiz?: boolean;
  onNavigateNext?: () => void; // New prop for navigation
}

export default function QuizModal({
  isOpen,
  onClose,
  quiz,
  onComplete,
  courseId,
  lessonId,
  isFinalQuiz = false,
  onNavigateNext,
}: QuizModalProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [showFailurePage, setShowFailurePage] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [quizResults, setQuizResults] = useState<QuizResult | null>(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);

  // Auto-save functionality
  const saveSession = useCallback(() => {
    if (!session) return;

    const sessionData = {
      ...session,
      answers: answers,
      currentQuestionIndex,
      lastSaveTime: Date.now(),
    };

    try {
      const sessionKey = lessonId
        ? `quiz-session-${courseId}-${lessonId}`
        : `quiz-session-${quiz.id}`;
      localStorage.setItem(sessionKey, JSON.stringify(sessionData));
      setSession(sessionData);
    } catch (error) {
      console.error('Failed to save quiz session:', error);
    }
  }, [session, answers, currentQuestionIndex, quiz.id, courseId, lessonId]);

  // Auto-save every 30 seconds
  useEffect(() => {
    if (isOpen && autoSaveEnabled) {
      const interval = setInterval(saveSession, 30000);
      return () => clearInterval(interval);
    }
  }, [isOpen, autoSaveEnabled, saveSession]);

  // Load saved session on mount
  useEffect(() => {
    if (isOpen && !session) {
      try {
        const sessionKey = lessonId
          ? `quiz-session-${courseId}-${lessonId}`
          : `quiz-session-${quiz.id}`;
        const savedSession = localStorage.getItem(sessionKey);
        if (savedSession) {
          const parsedSession = JSON.parse(savedSession);
          // Only restore if session is less than 24 hours old
          if (Date.now() - parsedSession.startTime < 24 * 60 * 60 * 1000) {
            setSession(parsedSession);
            setAnswers(parsedSession.answers || {});
            setCurrentQuestionIndex(parsedSession.currentQuestionIndex || 0);
            setShowWarning(true);
          } else {
            localStorage.removeItem(sessionKey);
          }
        }
      } catch (error) {
        console.error('Failed to load quiz session:', error);
      }
    }
  }, [isOpen, session, quiz.id, courseId, lessonId]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentQuestionIndex(0);
      setAnswers({});
      setShowResults(false);
      setShowFailurePage(false);
      setQuizResults(null);
      setSession(null);
      setShowWarning(false);
      setIsSubmitting(false);
      setFailedAttempts(0);
    }
  }, [isOpen]);

  const handleAnswerChange = (
    questionId: string,
    answer: string | string[]
  ) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const getCurrentAnswer = (questionId: string) => {
    return answers[questionId] || '';
  };

  const isQuestionAnswered = (questionId: string) => {
    const answer = getCurrentAnswer(questionId);
    if (Array.isArray(answer)) {
      return answer.length > 0;
    }
    return answer !== '';
  };

  const getAnsweredQuestionsCount = () => {
    return quiz.questions.filter((q) => isQuestionAnswered(q.id)).length;
  };

  const validateQuizSubmission = () => {
    // Allow submission even if not all questions are answered
    // Only check if at least one question is answered
    const answeredQuestions = quiz.questions.filter((q) =>
      isQuestionAnswered(q.id)
    );

    if (answeredQuestions.length === 0) {
      toast.error('Please answer at least one question before submitting.');
      return false;
    }

    return true;
  };

  const calculateScore = () => {
    let correctAnswers = 0;
    const detailedResults: any[] = [];

    quiz.questions.forEach((question) => {
      const userAnswer = getCurrentAnswer(question.id);
      let isCorrect = false;

      if (question.type === 'multiple-select') {
        const userAnswerArray = Array.isArray(userAnswer) ? userAnswer : [];
        const correctAnswerArray = Array.isArray(question.correctAnswer)
          ? question.correctAnswer
          : [];
        isCorrect =
          userAnswerArray.length === correctAnswerArray.length &&
          userAnswerArray.every((answer) =>
            correctAnswerArray.includes(answer)
          );
      } else {
        isCorrect = userAnswer === question.correctAnswer;
      }

      if (isCorrect) correctAnswers++;

      detailedResults.push({
        questionId: question.id,
        correct: isCorrect,
        userAnswer,
        correctAnswer: question.correctAnswer,
      });
    });

    const score = Math.round((correctAnswers / quiz.questions.length) * 100);
    const passed = score >= quiz.passingScore;

    return {
      score,
      passed,
      correctAnswers,
      totalQuestions: quiz.questions.length,
      answers: detailedResults,
    };
  };

  const handleSubmitQuiz = async () => {
    if (!validateQuizSubmission()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const result = calculateScore();
      setQuizResults(result);

      // Check if user passed the quiz
      const passed = result.score >= quiz.passingScore;

      if (passed) {
        // User passed - show results first, don't call onComplete yet
        setShowResults(true);
        // Don't call onComplete here - wait for user to click continue button
        toast.success('Quiz passed successfully! Review your results below.');

        // Clear session data on successful completion
        if (lessonId) {
          localStorage.removeItem(`quiz-session-${courseId}-${lessonId}`);
        }
      } else {
        // User failed - show failure page
        setFailedAttempts((prev) => prev + 1);
        setShowFailurePage(true);

        // Save failed attempt to session
        if (lessonId) {
          const sessionKey = `quiz-session-${courseId}-${lessonId}`;
          const currentSession = JSON.parse(
            localStorage.getItem(sessionKey) || '{}'
          );
          currentSession.failedAttempts =
            (currentSession.failedAttempts || 0) + 1;
          currentSession.lastFailedAt = new Date().toISOString();
          localStorage.setItem(sessionKey, JSON.stringify(currentSession));
        }
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast.error('Failed to submit quiz. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetakeQuiz = () => {
    setShowFailurePage(false);
    setShowResults(false);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setSession(null);
    setQuizResults(null);
  };

  const handleCloseModal = () => {
    if (showFailurePage) {
      // Don't allow closing if user failed - they must retry or stay on failure page
      toast.error('You must pass this quiz to continue. Please retry.');
      return;
    }
    onClose();
  };

  const renderQuestion = (question: QuizQuestion) => {
    const userAnswer = getCurrentAnswer(question.id);

    switch (question.type) {
      case 'multiple-choice':
      case 'true-false':
        return (
          <RadioGroup
            value={userAnswer as string}
            onValueChange={(value) => handleAnswerChange(question.id, value)}
            className="space-y-3"
          >
            {question.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${question.id}-${index}`} />
                <Label
                  htmlFor={`${question.id}-${index}`}
                  className="text-charcoal cursor-pointer"
                >
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'multiple-select':
        const selectedAnswers = Array.isArray(userAnswer) ? userAnswer : [];
        return (
          <div className="space-y-3">
            {question.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Checkbox
                  id={`${question.id}-${index}`}
                  checked={selectedAnswers.includes(option)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      handleAnswerChange(question.id, [
                        ...selectedAnswers,
                        option,
                      ]);
                    } else {
                      handleAnswerChange(
                        question.id,
                        selectedAnswers.filter((a) => a !== option)
                      );
                    }
                  }}
                />
                <Label
                  htmlFor={`${question.id}-${index}`}
                  className="text-charcoal cursor-pointer"
                >
                  {option}
                </Label>
              </div>
            ))}
          </div>
        );

      case 'short-answer':
        return (
          <Textarea
            value={userAnswer as string}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder="Enter your answer here..."
            className="bg-alabaster border-warm-gray/30 focus:border-charcoal"
            rows={4}
          />
        );

      default:
        return null;
    }
  };

  const currentQuestion = quiz.questions[currentQuestionIndex];

  // Debug logging
  console.log('=== QUIZ MODAL DEBUG ===');
  console.log('quiz:', quiz);
  console.log('quiz.questions:', quiz.questions);
  console.log('quiz.questions.length:', quiz.questions?.length);
  console.log('currentQuestionIndex:', currentQuestionIndex);
  console.log('currentQuestion:', currentQuestion);

  if (!currentQuestion) {
    console.error('ERROR: currentQuestion is undefined!');
    console.error('quiz.questions:', quiz.questions);
    console.error('currentQuestionIndex:', currentQuestionIndex);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleCloseModal}>
      <DialogContent className="bg-parchment border-warm-gray/20 shadow-xl max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-charcoal">
            {showFailurePage ? 'Quiz Failed' : quiz.title}
          </DialogTitle>
          {!showFailurePage && (
            <DialogDescription className="text-warm-gray">
              {quiz.description}
            </DialogDescription>
          )}
        </DialogHeader>

        {showFailurePage ? (
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-6xl mb-4">❌</div>
              <h3 className="text-xl font-semibold text-red-600 mb-2">
                Quiz Failed
              </h3>
              <p className="text-warm-gray mb-4">
                You need to score at least {quiz.passingScore}% to pass this
                quiz.
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-red-800 mb-2">
                  Your Results:
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-warm-gray">Score:</span>
                    <span className="ml-2 font-semibold text-red-600">
                      {quizResults ? quizResults.score : 0}%
                    </span>
                  </div>
                  <div>
                    <span className="text-warm-gray">Required:</span>
                    <span className="ml-2 font-semibold">
                      {quiz.passingScore}%
                    </span>
                  </div>
                  <div>
                    <span className="text-warm-gray">Attempts:</span>
                    <span className="ml-2 font-semibold">{failedAttempts}</span>
                  </div>
                  <div>
                    <span className="text-warm-gray">Questions:</span>
                    <span className="ml-2 font-semibold">
                      {quiz.questions.length}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center space-x-4">
              <Button
                onClick={handleRetakeQuiz}
                className="bg-charcoal text-parchment hover:bg-warm-gray"
              >
                Retry Quiz
              </Button>
            </div>
          </div>
        ) : showResults && quizResults ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-3xl font-bold text-charcoal flex items-center gap-2">
                {quizResults.passed ? (
                  <Trophy className="h-8 w-8 text-success-green" />
                ) : (
                  <XCircle className="h-8 w-8 text-red-500" />
                )}
                Quiz Results
              </DialogTitle>
            </DialogHeader>
            <div className="p-6 space-y-6">
              <Card
                className={`border-4 ${quizResults.passed ? 'border-success-green bg-success-green/10' : 'border-red-500 bg-red-500/10'}`}
              >
                <CardContent className="p-6 text-center">
                  <div
                    className="text-6xl font-bold mb-2"
                    style={{
                      color: quizResults.passed ? '#22c55e' : '#ef4444',
                    }}
                  >
                    {quizResults.score}%
                  </div>
                  <div className="text-xl font-medium text-charcoal mb-2">
                    {quizResults.passed
                      ? '🎉 Congratulations! You Passed! 🎉'
                      : 'Quiz Not Passed'}
                  </div>
                  <div className="text-warm-gray">
                    You answered {quizResults.correctAnswers} out of{' '}
                    {quizResults.totalQuestions} questions correctly
                  </div>
                  <div className="text-sm text-warm-gray mt-2">
                    Passing score: {quiz.passingScore}%
                  </div>
                </CardContent>
              </Card>

              {quiz.showResults !== false && (
                <Card className="bg-alabaster border-warm-gray/20">
                  <CardHeader>
                    <CardTitle className="text-lg text-charcoal">
                      Question Review
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {quiz.questions.map((question, index) => {
                      const result = quizResults.answers.find(
                        (a) => a.questionId === question.id
                      );
                      return (
                        <div
                          key={question.id}
                          className="p-3 rounded-lg bg-parchment border border-warm-gray/20"
                        >
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
                                  Your answer:{' '}
                                  {Array.isArray(result?.userAnswer)
                                    ? result?.userAnswer.join(', ')
                                    : result?.userAnswer}
                                </p>
                                <p>
                                  Correct answer:{' '}
                                  {Array.isArray(result?.correctAnswer)
                                    ? result?.correctAnswer.join(', ')
                                    : result?.correctAnswer}
                                </p>
                                {question.explanation && (
                                  <p className="text-xs text-blue-600 mt-1">
                                    <strong>Explanation:</strong>{' '}
                                    {question.explanation}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}

              <div className="flex gap-4">
                {!quizResults.passed && quiz.allowRetake !== false && (
                  <Button
                    onClick={handleRetakeQuiz}
                    variant="outline"
                    className="flex-1 bg-alabaster border-warm-gray/30"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Retake Quiz
                  </Button>
                )}
                <Button
                  onClick={() => {
                    if (quizResults.passed) {
                      // Call onComplete when user clicks continue
                      onComplete(quizResults);
                      if (onNavigateNext) {
                        onNavigateNext();
                      }
                    } else {
                      onClose();
                    }
                  }}
                  className="flex-1 bg-success-green hover:bg-success-green/90 text-alabaster"
                >
                  {quizResults.passed
                    ? isFinalQuiz
                      ? 'Course Completed'
                      : 'Continue to Next Lesson'
                    : 'Continue Learning'}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-6">
            {showWarning && (
              <Alert className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  We found a previous quiz session. Your answers have been
                  restored. You can continue where you left off or start fresh.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <div className="flex justify-between text-sm text-warm-gray">
                <span>
                  Question {currentQuestionIndex + 1} of {quiz.questions.length}
                </span>
                <span>
                  {getAnsweredQuestionsCount()} of {quiz.questions.length}{' '}
                  answered
                </span>
              </div>
              <Progress
                value={
                  ((currentQuestionIndex + 1) / quiz.questions.length) * 100
                }
                className="h-2"
              />
            </div>

            {currentQuestion ? (
              <Card className="bg-alabaster border-warm-gray/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-charcoal">
                      {currentQuestion.question}
                    </CardTitle>
                    {currentQuestion.required !== false && (
                      <Badge className="bg-red-500 text-alabaster text-xs">
                        Required
                      </Badge>
                    )}
                  </div>
                  {currentQuestion.type === 'multiple-select' && (
                    <CardDescription className="text-warm-gray">
                      Select all that apply
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>{renderQuestion(currentQuestion)}</CardContent>
              </Card>
            ) : (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Error: Quiz question not found. Please refresh the page and
                  try again.
                </AlertDescription>
              </Alert>
            )}

            {/* Question Navigation */}
            <div className="flex flex-wrap gap-2 p-4 bg-alabaster rounded-lg border border-warm-gray/20">
              <div className="text-sm text-warm-gray mb-2 w-full">
                Quick Navigation:
              </div>
              {quiz.questions.map((_, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className={`w-10 h-10 ${
                    index === currentQuestionIndex
                      ? 'bg-charcoal text-alabaster border-charcoal'
                      : isQuestionAnswered(quiz.questions[index].id)
                        ? 'bg-success-green text-alabaster border-success-green'
                        : 'bg-parchment border-warm-gray/30'
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
                onClick={() =>
                  setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))
                }
                disabled={currentQuestionIndex === 0}
                className="bg-alabaster border-warm-gray/30"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  setCurrentQuestionIndex(
                    Math.min(
                      quiz.questions.length - 1,
                      currentQuestionIndex + 1
                    )
                  )
                }
                disabled={currentQuestionIndex === quiz.questions.length - 1}
                className="bg-alabaster border-warm-gray/30"
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        <DialogFooter className="flex justify-between">
          {!showFailurePage && !showResults && (
            <>
              <div className="flex items-center space-x-2">
                {autoSaveEnabled && (
                  <Badge variant="outline" className="text-xs">
                    Auto-save enabled
                  </Badge>
                )}
                {session && (
                  <Badge variant="secondary" className="text-xs">
                    Session restored
                  </Badge>
                )}
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={handleCloseModal}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitQuiz}
                  disabled={isSubmitting}
                  className="bg-charcoal text-parchment hover:bg-warm-gray"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
                </Button>
              </div>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
