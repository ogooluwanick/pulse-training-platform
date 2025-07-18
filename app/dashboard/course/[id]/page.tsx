'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  BookOpen,
  Lock,
  CheckCircle,
  Award,
  ArrowRight,
  Clock,
  Users,
  TrendingUp,
} from 'lucide-react';
import { QuizModal } from '@/components/quiz-modal';
import { YouTubeVideo } from '@/components/ui/youtube-video';
import FullPageLoader from '@/components/full-page-loader';
import { Skeleton } from '@/components/ui/skeleton';
import { isYouTubeUrl } from '@/lib/utils';

import { Course } from '@/lib/models/Course';

export default function CoursePage() {
  const params = useParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFinalQuiz, setShowFinalQuiz] = useState(false);
  const [finalQuizPassed, setFinalQuizPassed] = useState(false);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<number>(0); // 0 = first lesson content

  // Helper to build modal steps: [lesson0, quiz0, lesson1, quiz1, ..., finalQuiz]
  const buildModalSteps = (course: Course) => {
    const steps: Array<{
      type: 'lesson' | 'quiz' | 'finalQuiz';
      lessonIndex?: number;
    }> = [];
    course.lessons.forEach((lesson, idx) => {
      steps.push({ type: 'lesson', lessonIndex: idx });
      if (lesson.quiz) steps.push({ type: 'quiz', lessonIndex: idx });
    });
    if (course.finalQuiz) steps.push({ type: 'finalQuiz' });
    return steps;
  };

  const modalSteps = course ? buildModalSteps(course) : [];
  const currentStep = modalSteps[modalStep];

  useEffect(() => {
    const fetchCourse = async () => {
      if (!params.id) return;
      try {
        const response = await fetch(`/api/course/${params.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch course');
        }
        const data = await response.json();
        setCourse(data);
        // TODO: Fetch real completed lessons from assignment
        setCompletedLessons([]); // Placeholder
        setProgress(0); // Placeholder
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'An unknown error occurred'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [params.id]);

  const isLessonCompleted = (lessonId: string) =>
    completedLessons.includes(lessonId);
  const isLessonLocked = (index: number) => {
    // Only unlock the first lesson or if the previous lesson is completed
    if (index === 0) return false;
    const prevLessonId = course?.lessons[index - 1]?._id || '';
    return !completedLessons.includes(prevLessonId);
  };
  const allLessonsCompleted =
    course && course.lessons.every((l) => completedLessons.includes(l._id));

  const handleFinalQuizComplete = async (score: number, passed: boolean) => {
    setFinalQuizPassed(passed);
    setShowFinalQuiz(false);
    if (passed) {
      await fetch(`/api/course/${params.id}/final-quiz-complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          finalQuizResult: { score, passed },
        }),
      });
    }
    // TODO: Optionally update UI to reflect course completion
  };

  const renderLessonContent = (lesson: any) => {
    // Check if content is a YouTube URL
    if (isYouTubeUrl(lesson.content)) {
      return (
        <div className="space-y-6">
          <YouTubeVideo url={lesson.content} className="mb-6" />
          {lesson.notes && lesson.notes.length > 0 && (
            <div className="prose max-w-none">
              <h3 className="text-lg font-semibold text-charcoal mb-4">
                Key Points
              </h3>
              <ul className="space-y-2">
                {lesson.notes.map((note: string, index: number) => (
                  <li key={index} className="text-charcoal">
                    {note}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
    }

    // Regular text content
    return (
      <div
        className="prose max-w-none"
        dangerouslySetInnerHTML={{
          __html: lesson.content.replace(/\n/g, '<br>'),
        }}
      />
    );
  };

  if (loading) {
    return <FullPageLoader placeholder="course" />;
  }
  if (error) {
    return (
      <div
        className="flex-1 space-y-6 p-6 text-center text-warning-ochre"
        style={{ backgroundColor: '#f5f4ed' }}
      >
        <Skeleton className="h-10 w-1/4 mx-auto" />
        <Skeleton className="h-24 w-full" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-1/3 mx-auto" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
        <h1 className="text-2xl">Error: {error}</h1>
      </div>
    );
  }
  if (!course) {
    return (
      <div
        className="flex-1 space-y-6 p-6 text-center"
        style={{ backgroundColor: '#f5f4ed' }}
      >
        <Skeleton className="h-10 w-1/4 mx-auto" />
        <Skeleton className="h-24 w-full" />
        <h1 className="text-2xl">Course not found.</h1>
      </div>
    );
  }

  const totalItems = course.lessons.length + (course.finalQuiz ? 1 : 0);
  const completedCount = completedLessons.length + (finalQuizPassed ? 1 : 0);
  const progressPercent = Math.round((completedCount / totalItems) * 100);

  return (
    <div
      className="flex-1 space-y-6 p-6 min-h-screen"
      style={{ backgroundColor: '#f5f4ed' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-charcoal">{course.title}</h1>
          <p className="text-warm-gray">{course.description}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-2xl font-bold text-charcoal">
              {progressPercent}%
            </div>
            <div className="text-sm text-warm-gray">Complete</div>
          </div>
          <Progress value={progressPercent} className="w-32 h-2" />
        </div>
      </div>

      {/* Course Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border-warm-gray/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-charcoal">
              Total Lessons
            </CardTitle>
            <BookOpen className="h-4 w-4 text-warm-gray" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-charcoal">
              {course.lessons.length}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-warm-gray/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-charcoal">
              Duration
            </CardTitle>
            <Clock className="h-4 w-4 text-warm-gray" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-charcoal">
              {course.lessons.reduce((acc, lesson) => acc + lesson.duration, 0)}{' '}
              min
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-warm-gray/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-charcoal">
              Completed
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-success-green" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-charcoal">
              {completedLessons.length}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-warm-gray/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-charcoal">
              Progress
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-warm-gray" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-charcoal">
              {progressPercent}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Overview */}
      <Card className="bg-card border-warm-gray/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-charcoal">Course Progress</CardTitle>
              <CardDescription className="text-warm-gray">
                Track your learning journey
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-charcoal">
                {progressPercent}%
              </div>
              <p className="text-sm text-warm-gray">Complete</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={progressPercent} className="h-3" />
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
                isLessonLocked(index)
                  ? 'opacity-60'
                  : 'hover:shadow-soft-lg cursor-pointer'
              }`}
              onClick={() => {
                if (!isLessonLocked(index)) {
                  // Find the modal step for this lesson's content
                  const stepIdx = modalSteps.findIndex(
                    (s) => s.type === 'lesson' && s.lessonIndex === index
                  );
                  setModalStep(stepIdx);
                  setModalOpen(true);
                }
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-parchment text-sm font-medium text-charcoal">
                      {index + 1}
                    </div>
                    {isLessonCompleted(lesson._id) ? (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-success-green">
                        <CheckCircle className="h-4 w-4 text-alabaster" />
                      </div>
                    ) : isLessonLocked(index) ? (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-warm-gray">
                        <Lock className="h-4 w-4 text-alabaster" />
                      </div>
                    ) : null}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-charcoal">
                        {lesson.title}
                      </h3>
                      <Badge
                        className="bg-success-green text-alabaster"
                        variant="secondary"
                      >
                        <BookOpen className="h-4 w-4" />
                        <span className="ml-1 capitalize">{lesson.type}</span>
                      </Badge>
                    </div>
                    <p className="text-sm text-warm-gray">
                      {lesson.duration} min
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {isLessonCompleted(lesson._id) ? (
                      <Badge className="bg-success-green text-alabaster">
                        Completed
                      </Badge>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-transparent border-warm-gray/30"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Final Quiz */}
      {course.finalQuiz && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-charcoal">Final Assessment</h2>
          <Card
            className={`bg-card border-warm-gray/20 transition-soft ${allLessonsCompleted ? (finalQuizPassed ? 'opacity-60' : 'hover:shadow-soft-lg') : 'opacity-60'}`}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-parchment text-sm font-medium text-charcoal">
                    {course.lessons.length + 1}
                  </div>
                  {finalQuizPassed ? (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-success-green">
                      <CheckCircle className="h-4 w-4 text-alabaster" />
                    </div>
                  ) : null}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-charcoal">Final Quiz</h3>
                    <Badge
                      className="bg-warning-ochre text-alabaster"
                      variant="secondary"
                    >
                      <Award className="h-4 w-4" />
                      <span className="ml-1 capitalize">Quiz</span>
                    </Badge>
                  </div>
                  {!allLessonsCompleted && (
                    <p className="text-warm-gray text-sm mt-1">
                      Complete all subjects and their quizzes to unlock the
                      final quiz.
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  {finalQuizPassed ? (
                    <Badge className="bg-success-green text-alabaster">
                      Passed
                    </Badge>
                  ) : allLessonsCompleted ? (
                    <Button
                      onClick={() => setShowFinalQuiz(true)}
                      className="bg-warning-ochre hover:bg-warning-ochre/90 text-alabaster"
                    >
                      Take Final Quiz
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-transparent border-warm-gray/30"
                      disabled
                    >
                      <Lock className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lesson/Quiz Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-parchment border-warm-gray/20 shadow-xl max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg p-0">
          <DialogHeader>
            <DialogTitle>
              {currentStep &&
                currentStep.type === 'lesson' &&
                course &&
                course.lessons[currentStep.lessonIndex!].title}
              {currentStep &&
                currentStep.type === 'quiz' &&
                course &&
                'Lesson Quiz'}
              {currentStep &&
                currentStep.type === 'finalQuiz' &&
                course &&
                'Final Quiz'}
            </DialogTitle>
            <DialogDescription />
          </DialogHeader>
          <div className="p-6">
            <div className="transition-all duration-300">
              {currentStep && currentStep.type === 'lesson' && course && (
                <div className="space-y-6">
                  {renderLessonContent(
                    course.lessons[currentStep.lessonIndex!]
                  )}
                  <div className="flex justify-between mt-6">
                    <Button
                      variant="outline"
                      onClick={() => setModalStep((s) => Math.max(0, s - 1))}
                      disabled={modalStep === 0}
                    >
                      Prev
                    </Button>
                    <Button
                      onClick={() => setModalStep((s) => s + 1)}
                      className="px-4 py-2 rounded-md bg-charcoal text-white hover:text-white hover:bg-charcoal/90 transition-colors"
                    >
                      {modalSteps[modalStep + 1]?.type === 'quiz'
                        ? 'Take Quiz'
                        : 'Next'}
                    </Button>
                  </div>
                </div>
              )}
              {currentStep && currentStep.type === 'quiz' && course && (
                <QuizModal
                  isOpen={true}
                  onClose={() => {
                    // Don't close the parent modal, just move to next step
                    setModalStep((s) => s + 1);
                  }}
                  quiz={{
                    id: course.lessons[currentStep.lessonIndex!]._id,
                    title: course.lessons[currentStep.lessonIndex!].quiz!.title,
                    description: '',
                    questions: course.lessons[
                      currentStep.lessonIndex!
                    ].quiz!.questions.map((q, i) => ({
                      id: String(i),
                      type: 'multiple-choice',
                      question: q.question,
                      options: q.options,
                      correctAnswer: q.answer,
                    })),
                    timeLimit: 30,
                    passingScore: 80,
                    maxAttempts: 1,
                  }}
                  onComplete={async (score, passed, answers) => {
                    if (passed) {
                      // Mark lesson as completed in backend
                      await fetch(`/api/course/${params.id}/lesson-complete`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          lessonId:
                            course.lessons[currentStep.lessonIndex!]._id,
                          quizResult: { score, passed, answers },
                        }),
                      });
                      setCompletedLessons((prev) =>
                        Array.from(
                          new Set([
                            ...prev,
                            course.lessons[currentStep.lessonIndex!]._id,
                          ])
                        )
                      );
                      setProgress((prev) => prev + 1); // Optionally recalc
                    }
                    setModalStep((s) => s + 1);
                  }}
                >
                  <div className="flex justify-between mt-6">
                    <Button
                      variant="outline"
                      onClick={() => setModalStep((s) => Math.max(0, s - 1))}
                    >
                      Prev
                    </Button>
                    <Button onClick={() => setModalStep((s) => s + 1)}>
                      Next
                    </Button>
                  </div>
                </QuizModal>
              )}
              {currentStep && currentStep.type === 'finalQuiz' && course && (
                <QuizModal
                  isOpen={true}
                  onClose={() => setModalOpen(false)}
                  quiz={{
                    id: 'final',
                    title: course.finalQuiz!.title,
                    description: '',
                    questions: course.finalQuiz!.questions.map((q, i) => ({
                      id: String(i),
                      type: 'multiple-choice',
                      question: q.question,
                      options: q.options,
                      correctAnswer: q.answer,
                    })),
                    timeLimit: 30,
                    passingScore: 80,
                    maxAttempts: 1,
                  }}
                  onComplete={async (score, passed) => {
                    await handleFinalQuizComplete(score, passed);
                    setModalOpen(false);
                  }}
                >
                  <div className="flex justify-between mt-6">
                    <Button
                      variant="outline"
                      onClick={() => setModalStep((s) => Math.max(0, s - 1))}
                    >
                      Prev
                    </Button>
                  </div>
                </QuizModal>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* Final Quiz Modal (legacy, can be removed) */}
      {course.finalQuiz && (
        <QuizModal
          isOpen={showFinalQuiz}
          onClose={() => setShowFinalQuiz(false)}
          quiz={{
            id: 'final',
            title: course.finalQuiz.title,
            description: '',
            questions: course.finalQuiz.questions.map((q, i) => ({
              id: String(i),
              type: 'multiple-choice',
              question: q.question,
              options: q.options,
              correctAnswer: q.answer,
            })),
            timeLimit: 30,
            passingScore: 80,
            maxAttempts: 1,
          }}
          onComplete={handleFinalQuizComplete}
        />
      )}
    </div>
  );
}
