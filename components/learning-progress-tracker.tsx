'use client';

import { useState, useEffect } from 'react';
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
  TrendingUp,
  Clock,
  Target,
  Award,
  Calendar,
  BookOpen,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Activity,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

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
  assignmentType: 'one-time' | 'interval';
  interval?: 'daily' | 'monthly' | 'yearly';
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface LearningProgressTrackerProps {
  assignment: CourseAssignment | null;
  course: any;
  onRefresh?: () => void;
}

export default function LearningProgressTracker({
  assignment,
  course,
  onRefresh,
}: LearningProgressTrackerProps) {
  const [isLoading, setIsLoading] = useState(false);

  if (!assignment || !course) {
    return (
      <Card className="bg-card border-warm-gray/20">
        <CardHeader>
          <CardTitle className="text-charcoal">Learning Progress</CardTitle>
          <CardDescription className="text-warm-gray">
            No assignment data available
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-warm-gray">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No progress data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const completedLessons = assignment.lessonProgress?.filter(
    (lp) => lp.status === 'completed'
  ) || [];

  const inProgressLessons = assignment.lessonProgress?.filter(
    (lp) => lp.status === 'in-progress'
  ) || [];

  const totalLessons = course.lessons?.length || 0;
  const completedCount = completedLessons.length;
  const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  const averageQuizScore = completedLessons.length > 0
    ? Math.round(
        completedLessons.reduce((acc, lesson) => {
          return acc + (lesson.quizResult?.score || 0);
        }, 0) / completedLessons.length
      )
    : 0;

  const totalAttempts = completedLessons.reduce((acc, lesson) => {
    return acc + (lesson.quizResult?.attemptCount || 1);
  }, 0);

  const averageAttempts = completedLessons.length > 0
    ? Math.round((totalAttempts / completedLessons.length) * 10) / 10
    : 0;

  const getTimeSpent = () => {
    if (!assignment.createdAt) return 'Unknown';
    
    const startDate = new Date(assignment.createdAt);
    const endDate = assignment.completedAt ? new Date(assignment.completedAt) : new Date();
    
    return formatDistanceToNow(startDate, { addSuffix: true });
  };

  const getEstimatedCompletion = () => {
    if (progressPercent === 0) return 'Unknown';
    if (progressPercent === 100) return 'Completed';
    
    const startDate = new Date(assignment.createdAt);
    const now = new Date();
    const elapsedDays = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (elapsedDays === 0) return 'Unknown';
    
    const ratePerDay = completedCount / elapsedDays;
    const remainingLessons = totalLessons - completedCount;
    const estimatedDays = Math.ceil(remainingLessons / ratePerDay);
    
    if (estimatedDays <= 0) return 'Unknown';
    
    const estimatedDate = new Date();
    estimatedDate.setDate(estimatedDate.getDate() + estimatedDays);
    
    return estimatedDate.toLocaleDateString();
  };

  const getProgressStatus = () => {
    if (progressPercent === 100) return 'completed';
    if (progressPercent >= 75) return 'excellent';
    if (progressPercent >= 50) return 'good';
    if (progressPercent >= 25) return 'fair';
    return 'needs-improvement';
  };

  const getProgressColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-success-green';
      case 'excellent':
        return 'text-success-green';
      case 'good':
        return 'text-warning-ochre';
      case 'fair':
        return 'text-warning-ochre';
      case 'needs-improvement':
        return 'text-red-500';
      default:
        return 'text-warm-gray';
    }
  };

  const progressStatus = getProgressStatus();

  return (
    <div className="space-y-6">
      {/* Main Progress Card */}
      <Card className="bg-card border-warm-gray/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-charcoal">Learning Progress</CardTitle>
              <CardDescription className="text-warm-gray">
                Track your course completion and performance
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                className={`${getProgressColor(progressStatus)} border-current`}
                variant="outline"
              >
                {progressStatus.replace('-', ' ').toUpperCase()}
              </Badge>
              {onRefresh && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRefresh}
                  disabled={isLoading}
                >
                  <Activity className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-warm-gray">Overall Progress</span>
                <span className="text-charcoal font-medium">{progressPercent}%</span>
              </div>
              <Progress value={progressPercent} className="h-3" />
              <div className="flex justify-between text-xs text-warm-gray">
                <span>{completedCount} of {totalLessons} lessons completed</span>
                <span>{totalLessons - completedCount} remaining</span>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-alabaster rounded-lg">
                <div className="text-2xl font-bold text-charcoal">{completedCount}</div>
                <div className="text-xs text-warm-gray">Completed</div>
              </div>
              <div className="text-center p-3 bg-alabaster rounded-lg">
                <div className="text-2xl font-bold text-charcoal">{inProgressLessons.length}</div>
                <div className="text-xs text-warm-gray">In Progress</div>
              </div>
              <div className="text-center p-3 bg-alabaster rounded-lg">
                <div className="text-2xl font-bold text-charcoal">{averageQuizScore}%</div>
                <div className="text-xs text-warm-gray">Avg Score</div>
              </div>
              <div className="text-center p-3 bg-alabaster rounded-lg">
                <div className="text-2xl font-bold text-charcoal">{averageAttempts}</div>
                <div className="text-xs text-warm-gray">Avg Attempts</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Performance Metrics */}
        <Card className="bg-card border-warm-gray/20">
          <CardHeader>
            <CardTitle className="text-charcoal flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-warm-gray">Quiz Success Rate</span>
              <span className="text-charcoal font-medium">
                {completedLessons.filter(l => l.quizResult?.passed).length}/{completedLessons.length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-warm-gray">First-Time Pass Rate</span>
              <span className="text-charcoal font-medium">
                {completedLessons.filter(l => l.quizResult?.attemptCount === 1).length}/{completedLessons.length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-warm-gray">Total Quiz Attempts</span>
              <span className="text-charcoal font-medium">{totalAttempts}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-warm-gray">Best Quiz Score</span>
              <span className="text-charcoal font-medium">
                {Math.max(...completedLessons.map(l => l.quizResult?.score || 0))}%
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Time Tracking */}
        <Card className="bg-card border-warm-gray/20">
          <CardHeader>
            <CardTitle className="text-charcoal flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Time Tracking
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-warm-gray">Started</span>
              <span className="text-charcoal font-medium">
                {assignment.createdAt ? new Date(assignment.createdAt).toLocaleDateString() : 'Unknown'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-warm-gray">Time Spent</span>
              <span className="text-charcoal font-medium">{getTimeSpent()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-warm-gray">Estimated Completion</span>
              <span className="text-charcoal font-medium">{getEstimatedCompletion()}</span>
            </div>
            {assignment.completedAt && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-warm-gray">Completed</span>
                <span className="text-charcoal font-medium">
                  {new Date(assignment.completedAt).toLocaleDateString()}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Assignment Details */}
      <Card className="bg-card border-warm-gray/20">
        <CardHeader>
          <CardTitle className="text-charcoal flex items-center gap-2">
            <Target className="h-5 w-5" />
            Assignment Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-warm-gray">Assignment Type</span>
              <Badge variant="outline" className="capitalize">
                {assignment.assignmentType}
              </Badge>
            </div>
            {assignment.interval && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-warm-gray">Interval</span>
                <Badge variant="outline" className="capitalize">
                  {assignment.interval}
                </Badge>
              </div>
            )}
            {assignment.endDate && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-warm-gray">End Date</span>
                <span className="text-charcoal font-medium">
                  {new Date(assignment.endDate).toLocaleDateString()}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-sm text-warm-gray">Status</span>
              <Badge
                className={
                  assignment.status === 'completed'
                    ? 'bg-success-green text-alabaster'
                    : assignment.status === 'in-progress'
                    ? 'bg-warning-ochre text-alabaster'
                    : 'bg-warm-gray text-alabaster'
                }
              >
                {assignment.status.replace('-', ' ').toUpperCase()}
              </Badge>
            </div>
            {assignment.finalQuizResult && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-warm-gray">Final Quiz Score</span>
                <span className="text-charcoal font-medium">
                  {assignment.finalQuizResult.score}%
                </span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-sm text-warm-gray">Last Updated</span>
              <span className="text-charcoal font-medium">
                {new Date(assignment.updatedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Insights */}
      {progressPercent > 0 && (
        <Card className="bg-card border-warm-gray/20">
          <CardHeader>
            <CardTitle className="text-charcoal flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Progress Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {progressPercent === 100 && (
                <div className="flex items-center gap-3 p-3 bg-success-green/10 rounded-lg">
                  <Award className="h-5 w-5 text-success-green" />
                  <div>
                    <p className="text-sm font-medium text-charcoal">Course Completed!</p>
                    <p className="text-xs text-warm-gray">Congratulations on finishing the course</p>
                  </div>
                </div>
              )}
              
              {averageQuizScore >= 90 && (
                <div className="flex items-center gap-3 p-3 bg-success-green/10 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-success-green" />
                  <div>
                    <p className="text-sm font-medium text-charcoal">Excellent Performance</p>
                    <p className="text-xs text-warm-gray">You're scoring very well on quizzes</p>
                  </div>
                </div>
              )}
              
              {averageAttempts <= 1.2 && completedLessons.length > 0 && (
                <div className="flex items-center gap-3 p-3 bg-success-green/10 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-success-green" />
                  <div>
                    <p className="text-sm font-medium text-charcoal">Efficient Learning</p>
                    <p className="text-xs text-warm-gray">You're passing quizzes on first attempts</p>
                  </div>
                </div>
              )}
              
              {progressPercent >= 50 && progressPercent < 100 && (
                <div className="flex items-center gap-3 p-3 bg-warning-ochre/10 rounded-lg">
                  <Target className="h-5 w-5 text-warning-ochre" />
                  <div>
                    <p className="text-sm font-medium text-charcoal">Good Progress</p>
                    <p className="text-xs text-warm-gray">You're more than halfway through the course</p>
                  </div>
                </div>
              )}
              
              {progressPercent < 25 && (
                <div className="flex items-center gap-3 p-3 bg-red-500/10 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="text-sm font-medium text-charcoal">Getting Started</p>
                    <p className="text-xs text-warm-gray">Consider setting aside more time for learning</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 