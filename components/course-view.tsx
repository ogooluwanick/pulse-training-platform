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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  BookOpen,
  Lock,
  CheckCircle,
  Award,
  ArrowRight,
  Clock,
  Users,
  Star,
  Search,
  Play,
  AlertTriangle,
  Info,
  Eye,
  EyeOff,
} from 'lucide-react';
import QuizModal from '@/components/quiz-modal';
import UniversalVideoPlayer from '@/components/culture/UniversalVideoPlayer';
import WYSIWYGContentRenderer from '@/components/wysiwyg-content-renderer';
import FullPageLoader from '@/components/full-page-loader';
import { Alert, AlertDescription } from '@/components/ui/alert';
import toast from 'react-hot-toast';
import { isYouTubeUrl } from '@/lib/utils';
import { Course, Lesson } from '@/lib/models/Course';
import CourseRating from '@/components/course-rating';
import CourseCompletionRatingModal from '@/components/course-completion-rating-modal';

interface LessonProgress {
  lessonId: string;
  status: 'not-started' | 'in-progress' | 'completed';
  completedAt?: Date;
  quizResult?: {
    score: number;
    passed: boolean;
    answers: any[];
    attemptCount?: number;
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

interface CoursePageProps {
  mode: 'edit' | 'try-out' | 'view';
  assignment?: CourseAssignment | null;
  course?: Course | null;
}

export default function CourseView({
  mode,
  assignment: initialAssignment,
  course: initialCourse,
}: CoursePageProps) {
  const params = useParams();
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(initialCourse || null);
  const [assignment, setAssignment] = useState<CourseAssignment | null>(
    initialAssignment || null
  );
  const [loading, setLoading] = useState(!initialCourse && !initialAssignment);
  const [error, setError] = useState<string | null>(null);
  const [showFinalQuiz, setShowFinalQuiz] = useState(false);
  const [finalQuizPassed, setFinalQuizPassed] = useState(false);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<number>(0);
  const [showRatingPrompt, setShowRatingPrompt] = useState(false);
  const [courseCompleted, setCourseCompleted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCompletedLessons, setShowCompletedLessons] = useState(true);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [showLessonQuiz, setShowLessonQuiz] = useState(false);
  const [lessonQuizPassed, setLessonQuizPassed] = useState(false);
  const [lessonAttemptCount, setLessonAttemptCount] = useState(0);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [showNextLesson, setShowNextLesson] = useState(false);
  const [nextLesson, setNextLesson] = useState<Lesson | null>(null);
  const [imageError, setImageError] = useState(false);

  // Helper to build modal steps: [lesson0, quiz0, lesson1, quiz1, ..., finalQuiz]
  const buildModalSteps = (course: Course) => {
    const steps: Array<{
      type: 'lesson' | 'quiz' | 'finalQuiz';
      lessonIndex?: number;
    }> = [];
    if (course.lessons) {
      course.lessons.forEach((lesson, idx) => {
        steps.push({ type: 'lesson', lessonIndex: idx });
        if (lesson.quiz) steps.push({ type: 'quiz', lessonIndex: idx });
      });
    }
    if (course.finalQuiz) steps.push({ type: 'finalQuiz' });
    return steps;
  };

  const modalSteps = course ? buildModalSteps(course) : [];
  const currentStep = modalSteps[modalStep];

  // Fetch course and assignment data
  const fetchCourseData = useCallback(async () => {
    if (!params.id || initialCourse) return;

    setLoading(true);
    setError(null);

    try {
      const courseRes = await fetch(`/api/course/${params.id}`);
      if (!courseRes.ok) {
        throw new Error('Failed to fetch course data');
      }
      const courseData = await courseRes.json();
      setCourse(courseData.module || courseData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'An unknown error occurred'
      );
      toast.error('Failed to load course data');
    } finally {
      setLoading(false);
    }
  }, [params.id, initialCourse]);

  useEffect(() => {
    fetchCourseData();
  }, [fetchCourseData]);

  // Update course state when initialCourse prop changes
  useEffect(() => {
    if (initialCourse) {
      setCourse(initialCourse);
      setLoading(false);
    }
  }, [initialCourse]);

  // Update assignment state when initialAssignment prop changes
  useEffect(() => {
    if (initialAssignment) {
      setAssignment(initialAssignment);
      // If assignment has populated course data, use it
      if (
        initialAssignment.course &&
        typeof initialAssignment.course === 'object'
      ) {
        console.log(
          'Using course data from assignment:',
          initialAssignment.course
        );
        setCourse(initialAssignment.course);
        setLoading(false);
      }
    }
  }, [initialAssignment]);

  useEffect(() => {
    if (course && (mode === 'edit' || mode === 'view')) {
      if (assignment) {
        console.log('Processing assignment data:', assignment);
        const completed =
          assignment.lessonProgress
            ?.filter((lp) => lp.status === 'completed')
            .map((lp) => lp.lessonId) || [];
        setCompletedLessons(completed);

        const totalItems = course.lessons?.length || 0;
        const completedCount = completed.length;
        setProgress(
          totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0
        );

        if (assignment.finalQuizResult?.passed) {
          setFinalQuizPassed(true);
        } else {
          setFinalQuizPassed(false);
        }
      } else {
        setCompletedLessons([]);
        setProgress(0);
        setFinalQuizPassed(false);
      }
    } else if (mode === 'try-out') {
      setCompletedLessons([]);
      setProgress(0);
      setFinalQuizPassed(false);
    }
  }, [course, assignment, mode]);

  const isLessonCompleted = (lessonId: string) =>
    completedLessons.includes(lessonId);

  const isLessonLocked = (index: number) => {
    if (mode === 'try-out' || mode === 'view') {
      return false;
    }
    // First lesson is always unlocked
    if (index === 0) return false;

    // Check if previous lesson is completed and quiz was passed
    const previousLesson = course?.lessons[index - 1];
    if (!previousLesson) return false;

    const previousLessonProgress = assignment?.lessonProgress?.find(
      (lp: LessonProgress) => lp.lessonId === previousLesson._id
    );

    // Lesson is locked if previous lesson is not completed
    if (
      !previousLessonProgress ||
      previousLessonProgress.status !== 'completed'
    ) {
      return true;
    }

    // If previous lesson has a quiz, check if it was passed
    if (
      previousLesson.quiz &&
      previousLesson.quiz.questions &&
      previousLesson.quiz.questions.length > 0
    ) {
      return !previousLessonProgress.quizResult?.passed;
    }

    return false;
  };

  const allLessonsCompleted =
    course &&
    course.lessons &&
    course.lessons.every((l) => completedLessons.includes(l._id));

  // Check if course is truly completed (all lessons + final quiz if exists)
  const isCourseCompleted = () => {
    if (!course || !course.lessons) return false;

    const allLessonsDone = course.lessons.every((l) =>
      completedLessons.includes(l._id)
    );

    if (!allLessonsDone) return false;

    if (course.finalQuiz) {
      if (mode === 'edit' || mode === 'view') {
        return assignment?.finalQuizResult?.passed === true;
      } else {
        // 'try-out'
        return finalQuizPassed;
      }
    }

    // No final quiz, so course is complete if all lessons are done
    return true;
  };

  const handleFinalQuizComplete = async (result: any) => {
    setFinalQuizPassed(result.passed);
    setShowFinalQuiz(false);

    if (result.passed) {
      if (mode === 'try-out') {
        toast.success('Congratulations! Course completed successfully!');
        setFinalQuizPassed(true);
        return;
      }
      try {
        const response = await fetch(
          `/api/course/${params.id}/final-quiz-complete`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              finalQuizResult: {
                score: result.score,
                passed: result.passed,
                answers: result.answers,
              },
            }),
          }
        );

        if (!response.ok) {
          throw new Error('Failed to complete course');
        }

        const responseData = await response.json();
        setFinalQuizPassed(true);
        toast.success('Congratulations! Course completed successfully!');

        // Show rating prompt if user hasn't rated yet
        if (responseData.shouldPromptRating) {
          setShowRatingPrompt(true);
        }

        // Refresh data
        await fetchCourseData();
      } catch (error) {
        toast.error('Failed to complete course');
        console.error('Error completing course:', error);
      }
    } else {
      // Don't show error toast here as the quiz modal will handle the failure display
    }
  };

  const handleRatingSubmit = (rating: number) => {
    setShowRatingPrompt(false);
    toast.success('Thank you for your rating!');
    // Optionally refresh course data to show updated rating
    if (course) {
      // Update course state with new rating info if needed
    }
  };

  const handleMarkAsComplete = async () => {
    try {
      if (!currentLesson?._id) {
        console.error('ERROR: currentLesson._id is undefined!');
        toast.error(
          'Error: Lesson ID not found. Please refresh the page and try again.'
        );
        return;
      }

      if (mode === 'try-out') {
        toast.success('Lesson completed successfully!');
        setCompletedLessons([...completedLessons, currentLesson._id]);
        const nextLessonIndex = currentLessonIndex + 1;
        if (
          course &&
          course.lessons &&
          nextLessonIndex < course.lessons.length
        ) {
          const nextLessonData = course.lessons[nextLessonIndex];
          setNextLesson(nextLessonData);
          setShowNextLesson(true);
        } else {
          setShowLessonModal(false);
        }
        return;
      }

      const requestBody = {
        lessonId: currentLesson._id,
      };

      const response = await fetch(`/api/course/${params.id}/lesson-complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error('Failed to mark lesson as completed');
      }

      toast.success('Lesson completed successfully!');

      // Check if there's a next lesson
      const nextLessonIndex = currentLessonIndex + 1;
      if (course && nextLessonIndex < course.lessons.length) {
        const nextLessonData = course.lessons[nextLessonIndex];
        setNextLesson(nextLessonData);
        setShowNextLesson(true);
      } else {
        // No next lesson, check if we should show final quiz
        if (course?.finalQuiz && allLessonsCompleted) {
          setShowLessonModal(false);
          setShowFinalQuiz(true);
        } else {
          setShowLessonModal(false);
        }
      }

      // Refresh course data
      await fetchCourseData();
    } catch (error) {
      toast.error('Failed to save lesson completion');
      console.error('Error completing lesson:', error);
    }
  };

  const handleLessonStart = (lessonId: string) => {
    const lesson = course?.lessons?.find((l) => l._id === lessonId);
    if (!lesson) {
      toast.error('Could not find lesson details. Please refresh.');
      return;
    }

    const lessonIndex =
      course?.lessons?.findIndex((l: any) => l._id === lesson._id) || 0;

    if (isLessonLocked(lessonIndex)) {
      const previousLesson = course?.lessons[lessonIndex - 1];
      if (previousLesson?.quiz) {
        toast.error("You must pass the previous lesson's quiz to continue.");
      } else {
        toast.error('You must complete the previous lesson to continue.');
      }
      return;
    }

    const nextLessonIndex = lessonIndex + 1;
    if (course && course.lessons && nextLessonIndex < course.lessons.length) {
      const nextLessonData = course.lessons[nextLessonIndex];
      setNextLesson(nextLessonData);
    } else {
      setNextLesson(null);
    }

    setCurrentLesson(lesson);
    setShowLessonModal(true);
    setShowLessonQuiz(false);
    setCurrentLessonIndex(lessonIndex);
    setImageError(false);

    // Check if lesson is already completed
    const lessonProgress = assignment?.lessonProgress?.find(
      (lp: LessonProgress) => lp.lessonId === lesson._id
    );

    if (lessonProgress?.status === 'completed') {
      setLessonQuizPassed(lessonProgress.quizResult?.passed || false);
      setLessonAttemptCount(lessonProgress.quizResult?.attemptCount || 0);
    } else {
      setLessonQuizPassed(false);
      setLessonAttemptCount(0);
    }
  };

  const handleLessonQuizComplete = async (result: any) => {
    setLessonQuizPassed(result.passed);

    if (result.passed) {
      if (mode === 'try-out') {
        toast.success('Lesson completed successfully!');
        if (currentLesson) {
          setCompletedLessons([...completedLessons, currentLesson._id]);
        }
        const nextLessonIndex = currentLessonIndex + 1;
        if (
          course &&
          course.lessons &&
          nextLessonIndex < course.lessons.length
        ) {
          const nextLessonData = course.lessons[nextLessonIndex];
          setNextLesson(nextLessonData);
          setShowNextLesson(true);
        } else {
          setShowLessonModal(false);
        }
        setShowLessonQuiz(false);
        return;
      }
      try {
        if (!currentLesson?._id) {
          console.error('ERROR: currentLesson._id is undefined!');
          toast.error(
            'Error: Lesson ID not found. Please refresh the page and try again.'
          );
          return;
        }

        const requestBody = {
          lessonId: currentLesson._id,
          quizResult: {
            score: result.score,
            passed: result.passed,
            answers: result.answers,
            attemptCount: lessonAttemptCount + 1,
            completedAt: new Date().toISOString(),
          },
        };

        const response = await fetch(
          `/api/course/${params.id}/lesson-complete`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
          }
        );

        if (!response.ok) {
          throw new Error('Failed to mark lesson as completed');
        }

        toast.success('Lesson completed successfully!');

        // Check if there's a next lesson
        const nextLessonIndex = currentLessonIndex + 1;
        if (course && nextLessonIndex < course.lessons.length) {
          const nextLessonData = course.lessons[nextLessonIndex];
          setNextLesson(nextLessonData);
          setShowNextLesson(true);
        } else {
          // No next lesson, check if we should show final quiz
          if (course?.finalQuiz && allLessonsCompleted) {
            setShowLessonModal(false);
            setShowFinalQuiz(true);
          } else {
            setShowLessonModal(false);
          }
        }

        // Refresh course data
        await fetchCourseData();
      } catch (error) {
        toast.error('Failed to save lesson completion');
        console.error('Error completing lesson:', error);
      }
    } else {
      setLessonAttemptCount((prev) => prev + 1);
      // Don't show error toast here as the quiz modal will handle the failure display
    }

    setShowLessonQuiz(false);
  };

  const handleContinueToNextLesson = () => {
    if (nextLesson) {
      setCurrentLesson(nextLesson);
      setCurrentLessonIndex(currentLessonIndex + 1);
      setShowNextLesson(false);
      setShowLessonQuiz(false);
      setLessonQuizPassed(false);
      setLessonAttemptCount(0);
      setNextLesson(null);
    }
  };

  const handleSkipToNextLesson = () => {
    if (nextLesson) {
      setCurrentLesson(nextLesson);
      setCurrentLessonIndex(currentLessonIndex + 1);
      setShowNextLesson(false);
      setShowLessonQuiz(false);
      setLessonQuizPassed(false);
      setLessonAttemptCount(0);
      setNextLesson(null);
    }
  };

  const renderLessonContent = (lesson: any) => {
    // Check if lesson type is video or if content is a video URL
    const isVideoLesson =
      lesson.type === 'video' ||
      isYouTubeUrl(lesson.content) ||
      lesson.content.match(/\.(mp4|webm|ogg|mov)$/i) ||
      lesson.content.includes('vimeo.com');

    // Check if lesson type is image or if content is an image URL
    const isImageLesson =
      lesson.type === 'image' ||
      (lesson.content &&
        (lesson.content.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) ||
          lesson.content.includes('cloudinary.com') ||
          lesson.content.includes('images.unsplash.com')));

    if (isVideoLesson) {
      return (
        <div className="space-y-6">
          <UniversalVideoPlayer
            url={lesson.content}
            className="mb-6"
            width="100%"
            height="400px"
          />
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

    if (isImageLesson) {
      return (
        <div className="space-y-6">
          <div className="relative w-full">
            <div className="aspect-video w-full rounded-lg shadow-lg overflow-hidden bg-warm-gray/10">
              {lesson.content && !imageError ? (
                <img
                  src={lesson.content}
                  alt={lesson.title}
                  className="w-full h-full object-contain rounded-lg"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-full h-full bg-warm-gray/20 rounded-lg flex items-center justify-center text-warm-gray">
                  <div className="text-center">
                    <svg
                      className="w-16 h-16 mx-auto mb-4 text-warm-gray/50"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <p className="text-sm">
                      {imageError
                        ? 'Image could not be loaded'
                        : 'No image available'}
                    </p>
                  </div>
                </div>
              )}
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

  const filteredLessons =
    course?.lessons?.filter((lesson) =>
      lesson.title.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  if (loading) {
    return <FullPageLoader />;
  }

  if (error) {
    return (
      <div
        className="flex-1 flex items-center justify-center"
        style={{ backgroundColor: '#f5f4ed' }}
      >
        <div className="text-center space-y-4">
          <Alert className="max-w-md mx-auto">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={fetchCourseData} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div
        className="flex-1 flex items-center justify-center"
        style={{ backgroundColor: '#f5f4ed' }}
      >
        <div className="text-center space-y-4">
          <h1 className="text-2xl text-charcoal">Course not found.</h1>
          <Button onClick={() => router.back()} variant="outline">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const totalItems = course.lessons?.length || 0;
  const completedCount = completedLessons.length;
  const progressPercent = Math.round((completedCount / totalItems) * 100);

  return (
    <div
      className="flex-1 space-y-6 p-6"
      style={{ backgroundColor: '#f5f4ed' }}
    >
      {mode === 'try-out' && (
        <div
          className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4"
          role="alert"
        >
          <p className="font-bold">Try-Out Mode</p>
          <p>Your progress will not be saved.</p>
        </div>
      )}
      {mode === 'view' && (
        <div
          className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4"
          role="alert"
        >
          <p className="font-bold">View Mode</p>
          <p>
            You are viewing an employee's assignment. No changes can be made.
          </p>
        </div>
      )}
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-charcoal">{course.title}</h1>
          <p className="text-warm-gray mt-2">{course.description}</p>
        </div>
        {/* <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-2xl font-bold text-charcoal">
              {progressPercent}%
            </div>
            <div className="text-sm text-warm-gray">Complete</div>
          </div>
          <Progress value={progressPercent} className="w-32 h-2" />
        </div> */}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border-warm-gray/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-charcoal">
              Lessons
            </CardTitle>
            <BookOpen className="h-4 w-4 text-warm-gray" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-charcoal">
              {course.lessons?.length || 0}
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
              {course.lessons?.reduce(
                (acc: number, lesson: Lesson) => acc + lesson.duration,
                0
              ) || 0}{' '}
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
            <Award className="h-4 w-4 text-warm-gray" />
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
          <div className="space-y-4">
            <Progress value={progressPercent} className="h-3" />
            <div className="flex justify-between text-sm text-warm-gray">
              <span>
                {completedCount} of {totalItems} lessons completed
              </span>
              <span>
                {(course.lessons?.length || 0) - completedLessons.length}{' '}
                lessons remaining
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lessons Section */}
      <Card className="bg-card border-warm-gray/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-charcoal">Lessons</CardTitle>
              <CardDescription className="text-warm-gray">
                Complete lessons to progress through the course
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCompletedLessons(!showCompletedLessons)}
                >
                  {showCompletedLessons ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                  {showCompletedLessons ? 'Hide Completed' : 'Show Completed'}
                </Button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-warm-gray" />
                <input
                  type="text"
                  placeholder="Search lessons..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-warm-gray/30 rounded-md bg-alabaster focus:outline-none focus:ring-2 focus:ring-charcoal focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredLessons.map((lesson, index) => {
              const isCompleted = isLessonCompleted(lesson._id);
              const isLocked = isLessonLocked(index);
              const lessonProgress = assignment?.lessonProgress?.find(
                (lp) => lp.lessonId === lesson._id
              );
              const quizResult = lessonProgress?.quizResult;

              // Skip completed lessons if hide option is enabled
              if (isCompleted && !showCompletedLessons) return null;

              return (
                <div
                  key={lesson._id}
                  className={`p-4 rounded-lg border transition-all duration-200 ${
                    isCompleted
                      ? 'bg-success-green/10 border-success-green/30'
                      : isLocked
                        ? 'bg-warm-gray/10 border-warm-gray/30 opacity-50'
                        : 'bg-alabaster border-warm-gray/30 hover:border-charcoal/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        {isCompleted ? (
                          <CheckCircle className="h-6 w-6 text-success-green" />
                        ) : isLocked ? (
                          <Lock className="h-6 w-6 text-warm-gray" />
                        ) : (
                          <BookOpen className="h-6 w-6 text-charcoal" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-charcoal">
                          {lesson.title}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-warm-gray mt-1">
                          <span>{lesson.type}</span>
                          <span>{lesson.duration} min</span>
                          {lesson.quiz && (
                            <Badge variant="outline" className="text-xs">
                              Quiz
                            </Badge>
                          )}
                          {isCompleted && (
                            <Badge className="bg-success-green text-alabaster text-xs">
                              Completed
                            </Badge>
                          )}
                          {quizResult &&
                            typeof quizResult.score === 'number' &&
                            lesson.quiz && (
                              <Badge
                                variant="outline"
                                className="text-xs font-mono"
                              >
                                Score: {quizResult.score.toFixed(0)}%
                              </Badge>
                            )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!isLocked && (
                        <Button
                          onClick={() => handleLessonStart(lesson._id)}
                          className="bg-charcoal hover:bg-charcoal/90 text-alabaster"
                          size="sm"
                          disabled={mode === 'view'}
                        >
                          {isCompleted ? 'Review' : 'Start'}
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Final Quiz Section */}
      {course.finalQuiz && (
        <Card
          className={`bg-card border-warm-gray/20 ${
            (mode === 'try-out' && finalQuizPassed) ||
            assignment?.finalQuizResult?.passed
              ? 'bg-success-green/10 border-success-green/30'
              : ''
          }`}
        >
          <CardHeader>
            <CardTitle className="text-charcoal flex items-center gap-2">
              <Award className="h-5 w-5" />
              Final Quiz
            </CardTitle>
            <CardDescription className="text-warm-gray">
              {!allLessonsCompleted
                ? 'Complete all lessons to unlock the final quiz'
                : (mode === 'try-out' && finalQuizPassed) ||
                    assignment?.finalQuizResult?.passed
                  ? 'You have passed the final quiz. You can retake it if needed.'
                  : 'Complete the final quiz to finish the course'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-alabaster rounded-lg border border-warm-gray/20">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-charcoal">
                    {course.finalQuiz.title}
                  </h3>
                  <p className="text-sm text-warm-gray">
                    Test your knowledge of the entire course
                  </p>
                </div>
                {!allLessonsCompleted ? (
                  <Badge variant="outline" className="text-warm-gray">
                    <Lock className="h-3 w-3 mr-1" />
                    Locked
                  </Badge>
                ) : (mode === 'try-out' && finalQuizPassed) ||
                  assignment?.finalQuizResult?.passed ? (
                  <div className="flex items-center gap-2">
                    <Badge className="bg-success-green text-alabaster">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Passed
                    </Badge>
                    {assignment?.finalQuizResult &&
                      typeof assignment.finalQuizResult.score === 'number' && (
                        <Badge variant="outline" className="font-mono">
                          Score: {assignment.finalQuizResult.score.toFixed(0)}%
                        </Badge>
                      )}
                  </div>
                ) : null}
              </div>
              <Button
                onClick={() => {
                  if (allLessonsCompleted) {
                    setShowFinalQuiz(true);
                  } else {
                    toast.error(
                      'Please complete all lessons before taking the final quiz.'
                    );
                  }
                }}
                disabled={!allLessonsCompleted || mode === 'view'}
                className={`px-4 py-2 rounded-md transition-colors ${
                  allLessonsCompleted
                    ? 'bg-warning-ochre hover:bg-warning-ochre/90 text-alabaster'
                    : 'bg-warm-gray/30 text-warm-gray cursor-not-allowed'
                }`}
              >
                {!allLessonsCompleted
                  ? 'Complete All Lessons First'
                  : (mode === 'try-out' && finalQuizPassed) ||
                      assignment?.finalQuizResult?.passed
                    ? 'Re-take Final Quiz'
                    : 'Take Final Quiz'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Course Completion */}
      {isCourseCompleted() && (
        <Card className="bg-success-green/10 border-success-green/30">
          <CardHeader>
            <CardTitle className="text-charcoal flex items-center gap-2">
              <Award className="h-6 w-6 text-success-green" />
              Course Completed!
            </CardTitle>
            <CardDescription className="text-warm-gray">
              Congratulations! You have successfully completed this course.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="text-3xl font-bold text-success-green">🎉</div>
              <div>
                <p className="text-charcoal font-medium">
                  You've earned your certificate!
                </p>
                <p className="text-sm text-warm-gray">
                  All lessons and quizzes completed successfully.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Final Quiz Modal */}
      {allLessonsCompleted && (
        <QuizModal
          isOpen={showFinalQuiz}
          onClose={() => setShowFinalQuiz(false)}
          quiz={{
            id: 'final-quiz',
            title: course.finalQuiz?.title || 'Final Quiz',
            description: 'Test your knowledge of the entire course',
            questions:
              (course.finalQuiz?.questions || []).map((q, i) => ({
                id: String(i),
                type: 'multiple-choice',
                question: q.question,
                options: q.options,
                correctAnswer: q.answer,
                required: false, // Make questions optional
              })) || [],
            timeLimit: 60,
            passingScore: 80,
            maxAttempts: 3,
            allowRetake: true,
            showResults: true,
          }}
          onComplete={handleFinalQuizComplete}
          courseId={params.id as string}
          lessonId="final-quiz"
          isFinalQuiz={true}
        />
      )}

      {/* Lesson Modal */}
      <Dialog
        open={showLessonModal}
        onOpenChange={(open) => {
          setShowLessonModal(open);
          if (!open) {
            setCurrentLesson(null);
            setShowLessonQuiz(false);
            setLessonQuizPassed(false);
            setLessonAttemptCount(0);
            setShowNextLesson(false);
            setNextLesson(null);
            setImageError(false);
          }
        }}
      >
        <DialogContent className="bg-parchment border-warm-gray/20 shadow-xl max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-charcoal">
              {currentLesson?.title}
            </DialogTitle>
            <DialogDescription className="text-warm-gray">
              {currentLesson?.type} • {currentLesson?.duration} min
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Lesson Content */}
            {currentLesson && !showLessonQuiz && !showNextLesson && (
              <div>
                {renderLessonContent(currentLesson)}

                {/* Quiz Section */}
                {currentLesson.quiz &&
                  currentLesson.quiz.questions &&
                  currentLesson.quiz.questions.length > 0 && (
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
                        {lessonQuizPassed && (
                          <Badge className="bg-success-green text-alabaster">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Passed
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-4">
                        <Button
                          onClick={() => setShowLessonQuiz(true)}
                          className="px-4 py-2 rounded-md bg-warning-ochre hover:bg-warning-ochre/90 text-alabaster transition-colors"
                          disabled={mode === 'view'}
                        >
                          {lessonQuizPassed ? 'Retake Quiz' : 'Take Quiz'}
                        </Button>

                        {lessonQuizPassed && nextLesson && (
                          <Button
                            onClick={handleContinueToNextLesson}
                            className="px-4 py-2 rounded-md bg-charcoal text-white hover:text-white hover:bg-charcoal/90 transition-colors"
                            disabled={mode === 'view'}
                          >
                            Next Lesson
                          </Button>
                        )}

                        {lessonAttemptCount > 0 && !lessonQuizPassed && (
                          <span className="text-sm text-warm-gray">
                            Attempts: {lessonAttemptCount}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                {/* No Quiz Section - Add Next button for completed lessons */}
                {currentLesson &&
                  (!currentLesson.quiz ||
                    !currentLesson.quiz.questions ||
                    currentLesson.quiz.questions.length === 0) &&
                  isLessonCompleted(currentLesson._id) &&
                  nextLesson && (
                    <div className="mt-8 p-4 bg-alabaster rounded-lg border border-warm-gray/20">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-charcoal">
                            Lesson Completed
                          </h3>
                          <p className="text-sm text-warm-gray">
                            This lesson has been completed successfully
                          </p>
                        </div>
                        <Badge className="bg-success-green text-alabaster">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Completed
                        </Badge>
                      </div>
                      <div className="mt-4">
                        <Button
                          onClick={handleContinueToNextLesson}
                          className="px-4 py-2 rounded-md bg-charcoal text-white hover:text-white hover:bg-charcoal/90 transition-colors"
                          disabled={mode === 'view'}
                        >
                          Continue to Next Lesson
                        </Button>
                      </div>
                    </div>
                  )}

                {/* No Quiz Section - Show completion message for last lesson */}
                {currentLesson &&
                  (!currentLesson.quiz ||
                    !currentLesson.quiz.questions ||
                    currentLesson.quiz.questions.length === 0) &&
                  isLessonCompleted(currentLesson._id) &&
                  !nextLesson && (
                    <div className="mt-8 p-4 bg-alabaster rounded-lg border border-warm-gray/20">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-charcoal">
                            Lesson Completed
                          </h3>
                          <p className="text-sm text-warm-gray">
                            This lesson has been completed successfully
                          </p>
                        </div>
                        <Badge className="bg-success-green text-alabaster">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Completed
                        </Badge>
                      </div>
                      <div className="mt-4">
                        <p className="text-sm text-warm-gray">
                          This is the last lesson.{' '}
                          {course?.finalQuiz
                            ? 'Complete the final quiz to finish the course.'
                            : 'Course completed!'}
                        </p>
                      </div>
                    </div>
                  )}

                {/* No Quiz Section */}
                {currentLesson &&
                  (!currentLesson.quiz ||
                    !currentLesson.quiz.questions ||
                    currentLesson.quiz.questions.length === 0) &&
                  !isLessonCompleted(currentLesson._id) && (
                    <div className="mt-8">
                      <Button
                        onClick={handleMarkAsComplete}
                        className="px-4 py-2 rounded-md bg-charcoal text-white hover:text-white hover:bg-charcoal/90 transition-colors"
                        disabled={mode === 'view'}
                      >
                        Mark as Complete
                      </Button>
                    </div>
                  )}
              </div>
            )}

            {/* Next Lesson Prompt */}
            {showNextLesson && nextLesson && (
              <div className="text-center space-y-6">
                <div className="flex items-center justify-center">
                  <CheckCircle className="h-16 w-16 text-success-green" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-charcoal mb-2">
                    Great job! Lesson completed.
                  </h3>
                  <p className="text-warm-gray mb-6">
                    You've successfully completed this lesson and passed the
                    quiz.
                  </p>
                </div>

                <div className="p-4 bg-alabaster rounded-lg border border-warm-gray/20">
                  <h4 className="font-semibold text-charcoal mb-2">
                    Next Lesson: {nextLesson.title}
                  </h4>
                  <p className="text-sm text-warm-gray mb-4">
                    {nextLesson.type} • {nextLesson.duration} min
                  </p>
                  <div className="flex gap-3">
                    <Button
                      onClick={handleContinueToNextLesson}
                      className="px-4 py-2 rounded-md bg-charcoal text-white hover:text-white hover:bg-charcoal/90 transition-colors"
                      disabled={mode === 'view'}
                    >
                      Continue to Next Lesson
                    </Button>
                    <Button
                      onClick={handleSkipToNextLesson}
                      variant="outline"
                      className="px-4 py-2 rounded-md border-warm-gray/30 transition-colors"
                      disabled={mode === 'view'}
                    >
                      Skip for Now
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Quiz Modal */}
            {currentLesson?.quiz && (
              <QuizModal
                isOpen={showLessonQuiz}
                onClose={() => setShowLessonQuiz(false)}
                quiz={{
                  id: currentLesson._id,
                  title: currentLesson.quiz.title,
                  description: 'Test your understanding of this lesson',
                  questions: currentLesson.quiz.questions.map(
                    (q: any, i: number) => ({
                      id: `${currentLesson._id}-${i}`,
                      type: 'multiple-choice',
                      question: q.question,
                      options: q.options,
                      correctAnswer: q.answer,
                      required: false, // Make questions optional
                    })
                  ),
                  timeLimit: 30,
                  passingScore: 80,
                  maxAttempts: 3,
                  allowRetake: true,
                  showResults: true,
                }}
                onComplete={handleLessonQuizComplete}
                courseId={params.id as string}
                lessonId={currentLesson._id}
                isFinalQuiz={false}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Course Completion Rating Modal */}
      <CourseCompletionRatingModal
        isOpen={showRatingPrompt}
        onClose={() => setShowRatingPrompt(false)}
        onRatingSubmit={handleRatingSubmit}
        courseId={params.id as string}
        courseTitle={course?.title || 'Course'}
      />
    </div>
  );
}
