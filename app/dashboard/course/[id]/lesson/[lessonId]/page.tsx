'use client';

import { useState, useEffect } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
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
} from 'lucide-react';
import Link from 'next/link';
import { QuizModal } from '@/components/quiz-modal';
import { YouTubeVideo } from '@/components/ui/youtube-video';
import FullPageLoader from '@/components/full-page-loader';
import { Skeleton } from '@/components/ui/skeleton';
import { isYouTubeUrl } from '@/lib/utils';

import { Lesson, Course } from '@/lib/models/Course'; // Use the new interfaces

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizPassed, setQuizPassed] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const fetchCourse = async () => {
      setLoading(true);
      const res = await fetch(`/api/course/${params.id}`);
      if (!res.ok) return setLoading(false);
      const data = await res.json();
      setCourse(data);
      // Find the lesson by lessonId
      const lessonData = data.lessons.find(
        (l: Lesson) => l._id === params.lessonId
      );
      setLesson(lessonData);
      // Calculate progress (number of completed lessons / total lessons)
      // This should be replaced with real progress from assignment if available
      setProgress(0); // Placeholder
      setLoading(false);
    };
    fetchCourse();
  }, [params.id, params.lessonId]);

  const handleQuizComplete = async (
    score: number,
    passed: boolean,
    answers: any[]
  ) => {
    setQuizPassed(passed);
    if (passed) {
      // Call backend to mark lesson as completed
      await fetch(`/api/course/${params.id}/lesson-complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId: params.lessonId,
          quizResult: { score, passed, answers },
        }),
      });
      // Optionally, update progress here
      setProgress((prev) => prev + 1); // Placeholder
    }
    setShowQuiz(false);
  };

  const renderLessonContent = () => {
    if (!lesson) return null;

    // Check if content is a YouTube URL
    if (isYouTubeUrl(lesson.content)) {
      return (
        <div className="space-y-6">
          <YouTubeVideo url={lesson.content} className="mb-6" />
          {lesson.notes && lesson.notes.length > 0 && (
            <div className="prose prose-lg max-w-none">
              <h3 className="text-lg font-semibold text-charcoal mb-4">
                Key Points
              </h3>
              <ul className="space-y-2">
                {lesson.notes.map((note, index) => (
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
      <div className="prose prose-lg max-w-none">
        <div
          className="text-charcoal leading-relaxed"
          dangerouslySetInnerHTML={{
            __html: lesson.content.replace(/\n/g, '<br>'),
          }}
        />
      </div>
    );
  };

  if (loading) return <FullPageLoader placeholder="lesson" />;
  if (!lesson)
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
              {lesson.quiz && (
                <div className="mt-8">
                  <Button
                    onClick={() => setShowQuiz(true)}
                    className="bg-warning-ochre hover:bg-warning-ochre/90 text-alabaster px-8"
                    disabled={quizPassed}
                  >
                    {quizPassed ? 'Quiz Passed' : 'Take Quiz'}
                  </Button>
                  <QuizModal
                    isOpen={showQuiz}
                    onClose={() => setShowQuiz(false)}
                    quiz={{
                      id: lesson._id,
                      title: lesson.quiz.title,
                      description: '',
                      questions: lesson.quiz.questions.map((q, i) => ({
                        id: String(i),
                        type: 'multiple-choice', // or infer from data
                        question: q.question,
                        options: q.options,
                        correctAnswer: q.answer,
                      })),
                      timeLimit: 30,
                      passingScore: 80,
                      maxAttempts: 1,
                    }}
                    onComplete={(score, passed, answers) =>
                      handleQuizComplete(score, passed, answers)
                    }
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
              disabled
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous Lesson
            </Button>
            <div className="flex gap-2">
              <Button
                onClick={() =>
                  router.push(`/dashboard/course/${params.id}/lesson/next`)
                }
                disabled={!quizPassed}
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
          <Card className="bg-card border-warm-gray/20">
            <CardHeader>
              <CardTitle className="text-charcoal flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Key Points
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {lesson.notes.map((note, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg bg-alabaster border border-warm-gray/20"
                >
                  <p className="text-sm text-charcoal">{note}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Personal Notes */}
          <Card className="bg-card border-warm-gray/20">
            <CardHeader>
              <CardTitle className="text-charcoal">My Notes</CardTitle>
              <CardDescription className="text-warm-gray">
                Add your personal notes and thoughts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Write your notes here..."
                value={''} // No user notes in this version
                onChange={(e) => {}}
                rows={6}
                className="bg-alabaster border-warm-gray/30 focus:border-charcoal"
              />
              <Button
                className="w-full mt-3 bg-charcoal hover:bg-charcoal/90 text-alabaster"
                size="sm"
              >
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
                <div className="text-xs text-warm-gray">
                  6 of 8 lessons completed
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
