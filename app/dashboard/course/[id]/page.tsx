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
import { Course } from '@/lib/models/Course';
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

export default function CoursePage() {
  const params = useParams();
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [assignment, setAssignment] = useState<CourseAssignment | null>(null);
  const [loading, setLoading] = useState(true);
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
  const [currentLesson, setCurrentLesson] = useState<any>(null);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [showLessonQuiz, setShowLessonQuiz] = useState(false);
  const [lessonQuizPassed, setLessonQuizPassed] = useState(false);
  const [lessonAttemptCount, setLessonAttemptCount] = useState(0);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [showNextLesson, setShowNextLesson] = useState(false);
  const [nextLesson, setNextLesson] = useState<any>(null);

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

  // Fetch course and assignment data
  const fetchCourseData = useCallback(async () => {
    if (!params.id) return;

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

      // Fetch assignment data
      const assignmentRes = await fetch(`/api/course-assignment/${params.id}`);
      if (assignmentRes.ok) {
        const assignmentData = await assignmentRes.json();
        setAssignment(assignmentData);

        // Calculate completed lessons
        const completed =
          assignmentData.lessonProgress
            ?.filter((lp: LessonProgress) => lp.status === 'completed')
            .map((lp: LessonProgress) => lp.lessonId) || [];
        setCompletedLessons(completed);

        // Calculate progress
        const totalItems =
          courseData.lessons.length + (courseData.finalQuiz ? 1 : 0);
        const completedCount =
          completed.length + (assignmentData.status === 'completed' ? 1 : 0);
        setProgress(Math.round((completedCount / totalItems) * 100));

        // Check if course is completed
        if (assignmentData.status === 'completed') {
          setCourseCompleted(true);
          setFinalQuizPassed(true);
        }
      } else {
        // No assignment found, initialize with empty progress
        setCompletedLessons([]);
        setProgress(0);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'An unknown error occurred'
      );
      toast.error('Failed to load course data');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchCourseData();
  }, [fetchCourseData]);

  const isLessonCompleted = (lessonId: string) =>
    completedLessons.includes(lessonId);

  const isLessonLocked = (index: number) => {
    // First lesson is always unlocked
    if (index === 0) return false;

    // Check if previous lesson is completed and quiz was passed
    const previousLesson = course?.lessons[index - 1];
    if (!previousLesson) return false;

    const previousLessonProgress = assignment?.lessonProgress?.find(
      (lp: LessonProgress) => lp.lessonId === previousLesson._id
    );

    // Lesson is locked if previous lesson is not completed OR if previous lesson has a quiz that wasn't passed
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
    course && course.lessons.every((l) => completedLessons.includes(l._id));

  const handleFinalQuizComplete = async (result: any) => {
    setFinalQuizPassed(result.passed);
    setShowFinalQuiz(false);

    if (result.passed) {
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
        setCourseCompleted(true);
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

  const handleLessonStart = (lesson: any) => {
    // Check if lesson is locked (previous quiz not passed)
    const lessonIndex =
      course?.lessons.findIndex((l: any) => l._id === lesson._id) || 0;

    if (isLessonLocked(lessonIndex)) {
      const previousLesson = course?.lessons[lessonIndex - 1];
      if (previousLesson?.quiz) {
        toast.error("You must pass the previous lesson's quiz to continue.");
      } else {
        toast.error('You must complete the previous lesson to continue.');
      }
      return;
    }

    setCurrentLesson(lesson);
    setShowLessonModal(true);
    setShowLessonQuiz(false);
    setCurrentLessonIndex(lessonIndex);

    // Check if lesson is already completed
    const lessonProgress = assignment?.lessonProgress?.find(
      (lp: LessonProgress) => lp.lessonId === lesson._id
    );

    if (lessonProgress?.status === 'completed') {
      setLessonQuizPassed(true);
      setLessonAttemptCount(lessonProgress.quizResult?.attemptCount || 0);
    } else {
      setLessonQuizPassed(false);
      setLessonAttemptCount(0);
    }
  };

  const handleLessonQuizComplete = async (result: any) => {
    setLessonQuizPassed(result.passed);

    if (result.passed) {
      try {
        const response = await fetch(
          `/api/course/${params.id}/lesson-complete`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              lessonId: currentLesson._id,
              quizResult: {
                score: result.score,
                passed: result.passed,
                answers: result.answers,
                attemptCount: lessonAttemptCount + 1,
                completedAt: new Date().toISOString(),
              },
            }),
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
    // Check if content is a video URL (YouTube, Vimeo, or direct video file)
    if (
      isYouTubeUrl(lesson.content) ||
      lesson.content.match(/\.(mp4|webm|ogg|mov)$/i) ||
      lesson.content.includes('vimeo.com')
    ) {
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

    // Regular text content (WYSIWYG)
    return (
      <WYSIWYGContentRenderer
        content={lesson.content}
        className="prose prose-lg max-w-none"
      />
    );
  };

  const filteredLessons =
    course?.lessons.filter((lesson) =>
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

  const totalItems = course.lessons.length + (course.finalQuiz ? 1 : 0);
  const completedCount = completedLessons.length + (finalQuizPassed ? 1 : 0);
  const progressPercent = Math.round((completedCount / totalItems) * 100);

  return (
    <div
      className="flex-1 space-y-6 p-6"
      style={{ backgroundColor: '#f5f4ed' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-charcoal">{course.title}</h1>
          <p className="text-warm-gray mt-2">{course.description}</p>
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
                {completedCount} of {totalItems} items completed
              </span>
              <span>
                {course.lessons.length - completedLessons.length} lessons
                remaining
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
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!isLocked && (
                        <Button
                          onClick={() => handleLessonStart(lesson)}
                          className="bg-charcoal hover:bg-charcoal/90 text-alabaster"
                          size="sm"
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
      {course.finalQuiz && allLessonsCompleted && !courseCompleted && (
        <Card className="bg-card border-warm-gray/20">
          <CardHeader>
            <CardTitle className="text-charcoal flex items-center gap-2">
              <Award className="h-5 w-5" />
              Final Quiz
            </CardTitle>
            <CardDescription className="text-warm-gray">
              Complete the final quiz to finish the course
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
              </div>
              <Button
                onClick={() => setShowFinalQuiz(true)}
                className="bg-warning-ochre hover:bg-warning-ochre/90 text-alabaster px-8"
              >
                Take Final Quiz
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Course Completion */}
      {courseCompleted && (
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
      <QuizModal
        isOpen={showFinalQuiz}
        onClose={() => setShowFinalQuiz(false)}
        quiz={{
          id: 'final-quiz',
          title: course.finalQuiz?.title || 'Final Quiz',
          description: 'Test your knowledge of the entire course',
          questions:
            course.finalQuiz?.questions.map((q, i) => ({
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
                          className="bg-warning-ochre hover:bg-warning-ochre/90 text-alabaster px-8"
                          disabled={lessonQuizPassed}
                        >
                          {lessonQuizPassed ? 'Quiz Passed' : 'Take Quiz'}
                        </Button>

                        {lessonAttemptCount > 0 && !lessonQuizPassed && (
                          <span className="text-sm text-warm-gray">
                            Attempts: {lessonAttemptCount}
                          </span>
                        )}
                      </div>
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
                      className="bg-charcoal hover:bg-charcoal/90 text-alabaster"
                    >
                      Continue to Next Lesson
                    </Button>
                    <Button
                      onClick={handleSkipToNextLesson}
                      variant="outline"
                      className="border-warm-gray/30"
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
                      id: String(i),
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
