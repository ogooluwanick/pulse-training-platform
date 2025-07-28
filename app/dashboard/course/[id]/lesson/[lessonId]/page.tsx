'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  Clock,
  AlertTriangle,
  Info,
} from 'lucide-react';
import Link from 'next/link';

import UniversalVideoPlayer from '@/components/culture/UniversalVideoPlayer';
import WYSIWYGContentRenderer from '@/components/wysiwyg-content-renderer';
import FullPageLoader from '@/components/full-page-loader';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import toast from 'react-hot-toast';
import { isYouTubeUrl } from '@/lib/utils';
import { Lesson, Course } from '@/lib/models/Course';
import QuizModal from '@/components/quiz-modal';

interface LessonProgress {
  lessonId: string;
  status: 'not-started' | 'in-progress' | 'completed';
  completedAt?: Date;
  quizResult?: {
    score: number;
    passed: boolean;
    answers: any[];
  };
}

interface CourseAssignment {
  _id: string;
  course: string;
  employee: string;
  status: 'not-started' | 'in-progress' | 'completed';
  lessonProgress: LessonProgress[];
  completedAt?: Date;
  finalQuizResult?: {
    score: number;
    passed: boolean;
    answers: any[];
  };
}

// Extended Lesson interface to include notes
interface ExtendedLesson extends Lesson {
  notes?: string[];
}

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [lesson, setLesson] = useState<ExtendedLesson | null>(null);
  const [assignment, setAssignment] = useState<CourseAssignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizPassed, setQuizPassed] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [attemptCount, setAttemptCount] = useState(0);

  // Fetch course and assignment data
  const fetchCourseData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch course data
      const courseRes = await fetch(`/api/course/${params.id}`);
      if (!courseRes.ok) {
        throw new Error('Failed to fetch course data');
      }
      const courseData = await courseRes.json();
      setCourse(courseData);

      // Find current lesson
      const lessonIndex = courseData.lessons.findIndex(
        (l: ExtendedLesson) => l._id === params.lessonId
      );
      if (lessonIndex === -1) {
        throw new Error('Lesson not found');
      }

      const lessonData = courseData.lessons[lessonIndex];
      setLesson(lessonData);
      setCurrentLessonIndex(lessonIndex);

      // Fetch assignment data
      const assignmentRes = await fetch(`/api/course-assignment/${params.id}`);
      if (assignmentRes.ok) {
        const assignmentData = await assignmentRes.json();
        setAssignment(assignmentData);

        // Check if lesson is completed
        const lessonProgress = assignmentData.lessonProgress?.find(
          (lp: LessonProgress) => lp.lessonId === params.lessonId
        );

        if (lessonProgress?.status === 'completed') {
          setQuizPassed(true);
          setAttemptCount(lessonProgress.quizResult?.attemptCount || 0);
        }

        // Calculate progress
        const completedLessons =
          assignmentData.lessonProgress?.filter(
            (lp: LessonProgress) => lp.status === 'completed'
          ).length || 0;
        const totalLessons = courseData.lessons.length;
        setProgress(Math.round((completedLessons / totalLessons) * 100));
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'An unknown error occurred'
      );
      toast.error('Failed to load lesson data');
    } finally {
      setLoading(false);
    }
  }, [params.id, params.lessonId]);

  useEffect(() => {
    fetchCourseData();
  }, [fetchCourseData]);

  const handleQuizComplete = async (result: any) => {
    const { score, passed, answers } = result;
    setQuizPassed(passed);

    if (passed) {
      try {
        const response = await fetch(
          `/api/course/${params.id}/lesson-complete`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              lessonId: params.lessonId,
              quizResult: {
                score,
                passed,
                answers,
                attemptCount: attemptCount + 1,
                completedAt: new Date().toISOString(),
              },
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message || 'Failed to mark lesson as completed'
          );
        }

        const result = await response.json();
        toast.success('Lesson completed successfully!');

        // Update local state
        setProgress((prev) => {
          const newProgress = Math.round(
            (((prev / 100) * course!.lessons.length + 1) /
              course!.lessons.length) *
              100
          );
          return newProgress;
        });

        // Refresh assignment data
        await fetchCourseData();
      } catch (error) {
        toast.error('Failed to save lesson completion');
        console.error('Error completing lesson:', error);
      }
    } else {
      setAttemptCount((prev) => prev + 1);
      toast.error('Quiz not passed. You can retake it.');
    }

    setShowQuiz(false);
  };

  const navigateToLesson = (direction: 'prev' | 'next') => {
    if (!course) return;

    const newIndex =
      direction === 'next' ? currentLessonIndex + 1 : currentLessonIndex - 1;

    if (newIndex >= 0 && newIndex < course.lessons.length) {
      const nextLesson = course.lessons[newIndex];
      router.push(`/dashboard/course/${params.id}/lesson/${nextLesson._id}`);
    }
  };

  const canNavigateToNext = () => {
    if (!course || !assignment) return false;

    // Can navigate if current lesson is completed or if it's the first lesson
    if (currentLessonIndex === 0) return true;

    const currentLessonProgress = assignment.lessonProgress?.find(
      (lp: LessonProgress) => lp.lessonId === params.lessonId
    );

    return currentLessonProgress?.status === 'completed';
  };

  const canNavigateToPrev = () => {
    return currentLessonIndex > 0;
  };

  const renderLessonContent = () => {
    if (!lesson) return null;

    // Check if content is a video URL (YouTube, Vimeo, or direct video file)
    if (
      isYouTubeUrl(lesson.content) ||
      lesson.content.match(/\.(mp4|webm|ogg|mov)$/i) ||
      lesson.content.includes('vimeo.com')
    ) {
      return (
        <div className="space-y-6">
          <div className="relative">
            <UniversalVideoPlayer
              url={lesson.content}
              className="mb-6"
              width="100%"
              height="400px"
            />
            <div className="absolute top-2 right-2 z-10">
              <Badge className="bg-charcoal/80 text-alabaster">
                <Clock className="h-3 w-3 mr-1" />
                {lesson.duration} min
              </Badge>
            </div>
          </div>
          {lesson.notes && lesson.notes.length > 0 && (
            <div className="prose prose-lg max-w-none">
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

    // Regular text content (WYSIWYG)
    return (
      <WYSIWYGContentRenderer
        content={lesson.content}
        className="prose prose-lg max-w-none"
      />
    );
  };

  if (loading) return <FullPageLoader placeholder="lesson" />;

  if (error) {
    return (
      <div
        className="flex-1 space-y-6 p-6 text-center"
        style={{ backgroundColor: '#f5f4ed' }}
      >
        <Alert className="max-w-md mx-auto">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={fetchCourseData} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div
        className="flex-1 space-y-6 p-6 text-center"
        style={{ backgroundColor: '#f5f4ed' }}
      >
        <Skeleton className="h-10 w-1/4 mx-auto" />
        <Skeleton className="h-24 w-full" />
        <h1 className="text-2xl">Lesson not found.</h1>
      </div>
    );
  }

  const isLessonCompleted = quizPassed;
  const hasQuiz =
    lesson.quiz && lesson.quiz.questions && lesson.quiz.questions.length > 0;

  return (
    <div className="flex-1" style={{ backgroundColor: '#f5f4ed' }}>
      {/* Header */}
      <div className="border-b border-warm-gray/20 bg-parchment/50 backdrop-blur-sm sticky top-16 z-30">
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center gap-4">
            <Link href={`/dashboard/course/${params.id}`}>
              <Button
                variant="outline"
                size="sm"
                className="bg-transparent border-warm-gray/30"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Course
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-charcoal">
                {lesson.title}
              </h1>
              <div className="flex items-center gap-2 text-sm text-warm-gray">
                <Badge
                  className="bg-success-green text-alabaster"
                  variant="secondary"
                >
                  <BookOpen className="h-3 w-3 mr-1" />
                  {lesson.type}
                </Badge>
                <span>{lesson.duration} min</span>
                {isLessonCompleted && (
                  <Badge className="bg-success-green text-alabaster">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Completed
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-sm text-warm-gray">Progress: {progress}%</div>
            <Progress value={progress} className="w-32 h-2" />
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6 p-6">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Lesson Content */}
          <Card className="bg-card border-warm-gray/20">
            <CardContent className="p-8">
              {renderLessonContent()}

              {hasQuiz && (
                <div className="mt-8 p-4 bg-alabaster rounded-lg border border-warm-gray/20">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-charcoal">
                        Lesson Quiz
                      </h3>
                      <p className="text-sm text-warm-gray">
                        Test your understanding of this lesson
                      </p>
                    </div>
                    {isLessonCompleted && (
                      <Badge className="bg-success-green text-alabaster">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Passed
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <Button
                      onClick={() => setShowQuiz(true)}
                      className="bg-warning-ochre hover:bg-warning-ochre/90 text-alabaster px-8"
                      disabled={isLessonCompleted}
                    >
                      {isLessonCompleted ? 'Quiz Passed' : 'Take Quiz'}
                    </Button>

                    {attemptCount > 0 && !isLessonCompleted && (
                      <span className="text-sm text-warm-gray">
                        Attempts: {attemptCount}
                      </span>
                    )}
                  </div>

                  <QuizModal
                    isOpen={showQuiz}
                    onClose={() => setShowQuiz(false)}
                    quiz={{
                      id: lesson._id,
                      title: lesson.quiz!.title,
                      description: 'Test your understanding of this lesson',
                      questions: lesson.quiz!.questions.map((q, i) => ({
                        id: String(i),
                        type: 'multiple-choice',
                        question: q.question,
                        options: q.options,
                        correctAnswer: q.answer,
                        required: true,
                      })),
                      timeLimit: 30,
                      passingScore: 80,
                      maxAttempts: 3,
                      allowRetake: true,
                      showResults: true,
                    }}
                    onComplete={handleQuizComplete}
                    courseId={params.id as string}
                    lessonId={params.lessonId as string}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              className="bg-transparent border-warm-gray/30"
              disabled={!canNavigateToPrev()}
              onClick={() => navigateToLesson('prev')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous Lesson
            </Button>
            <div className="flex gap-2">
              <Button
                onClick={() => navigateToLesson('next')}
                disabled={!canNavigateToNext()}
                className="bg-charcoal text-alabaster"
              >
                Next Lesson <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Lesson Notes */}
          {lesson.notes && lesson.notes.length > 0 && (
            <Card className="bg-card border-warm-gray/20">
              <CardHeader>
                <CardTitle className="text-charcoal flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Key Points
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {lesson.notes.map((note: string, index: number) => (
                  <div
                    key={index}
                    className="p-3 rounded-lg bg-alabaster border border-warm-gray/20"
                  >
                    <p className="text-sm text-charcoal">{note}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Course Progress */}
          <Card className="bg-card border-warm-gray/20">
            <CardHeader>
              <CardTitle className="text-charcoal">Course Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-warm-gray">Overall Progress</span>
                  <span className="text-charcoal font-medium">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
                <div className="text-xs text-warm-gray">
                  {assignment?.lessonProgress?.filter(
                    (lp: LessonProgress) => lp.status === 'completed'
                  ).length || 0}{' '}
                  of {course?.lessons.length || 0} lessons completed
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lesson Info */}
          <Card className="bg-card border-warm-gray/20">
            <CardHeader>
              <CardTitle className="text-charcoal">Lesson Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-warm-gray">Type</span>
                <span className="text-charcoal font-medium capitalize">
                  {lesson.type}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-warm-gray">Duration</span>
                <span className="text-charcoal font-medium">
                  {lesson.duration} min
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-warm-gray">Status</span>
                <span
                  className={`font-medium ${isLessonCompleted ? 'text-success-green' : 'text-warm-gray'}`}
                >
                  {isLessonCompleted ? 'Completed' : 'In Progress'}
                </span>
              </div>
              {hasQuiz && (
                <div className="flex justify-between text-sm">
                  <span className="text-warm-gray">Quiz</span>
                  <span className="text-charcoal font-medium">
                    {lesson.quiz!.questions.length} questions
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
