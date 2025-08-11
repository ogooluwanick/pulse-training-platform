'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
  BookOpen,
  Clock,
  Award,
  Play,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Users,
  Calendar,
  Target,
} from 'lucide-react';
import type { User } from 'next-auth';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDuration } from '@/lib/duration';

// Updated interface for course data from the API
interface CourseWithProgress {
  _id: string;
  courseId: string;
  title: string;
  description: string;
  category: 'compliance' | 'skills' | 'culture' | 'technical' | 'General';
  duration: number;
  progress: number;
  status: 'not-started' | 'in-progress' | 'completed';
  totalLessons: number;
  completedLessons: number;
  // difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  // rating?: any[];
  enrolledCount?: number;
  tags?: string[];
  assignedAt?: string;
  completedAt?: string;
  assignmentType?: 'one-time' | 'interval';
  interval?: 'daily' | 'monthly' | 'yearly';
  endDate?: string;
}

interface LearningStats {
  totalCourses: number;
  completedCourses: number;
  inProgressCourses: number;
  notStartedCourses: number;
  overdueCourses: number;
  completedThisMonth: number;
  uncompletedCoursesCount: number;
  totalTimeInvested: number;
  certificatesEarned: number;
}

interface SkillProgress {
  [category: string]: {
    total: number;
    completed: number;
    progress: number;
    averageProgress?: number;
  };
}

interface LearningApiResponse {
  courses: CourseWithProgress[];
  stats: LearningStats;
  skillProgress: SkillProgress;
  uncompletedCoursesCount: number;
}

interface CoursesApiResponse {
  courses: CourseWithProgress[];
  timeInvested: number;
  completedCoursesCount: number;
  uncompletedCoursesCount: number;
  averageFinalQuizScore: number;
}

// Define a more specific User type
interface ExtendedUser extends User {
  courseAssignments?: any[];
}

interface EmployeeDashboardProps {
  user: ExtendedUser;
}

const fetchLearningData = async (
  userId: string,
  activeCompanyId: string
): Promise<LearningApiResponse> => {
  console.log('[EmployeeDashboard] fetchLearningData called', {
    userId,
    activeCompanyId,
    timestamp: new Date().toISOString(),
  });

  const response = await fetch(`/api/employee/learning`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  console.log('[EmployeeDashboard] fetchLearningData response', {
    userId,
    activeCompanyId,
    status: response.status,
    ok: response.ok,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    console.error('[EmployeeDashboard] fetchLearningData error', {
      userId,
      activeCompanyId,
      status: response.status,
      errorData,
    });
    throw new Error(errorData?.message || 'Failed to fetch learning data');
  }
  return response.json();
};

const fetchCourseAssignments = async (
  userId: string,
  activeCompanyId: string
): Promise<CoursesApiResponse> => {
  console.log('[EmployeeDashboard] fetchCourseAssignments called', {
    userId,
    activeCompanyId,
    timestamp: new Date().toISOString(),
  });

  const response = await fetch(`/api/employee/courses`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  console.log('[EmployeeDashboard] fetchCourseAssignments response', {
    userId,
    activeCompanyId,
    status: response.status,
    ok: response.ok,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    console.error('[EmployeeDashboard] fetchCourseAssignments error', {
      userId,
      activeCompanyId,
      status: response.status,
      errorData,
    });
    throw new Error(errorData?.message || 'Failed to fetch course assignments');
  }
  return response.json();
};

export function EmployeeDashboard({ user }: EmployeeDashboardProps) {
  const [activeFilter, setActiveFilter] = useState<
    'all' | 'not-started' | 'in-progress' | 'completed' | 'overdue'
  >('all');

  console.log('[EmployeeDashboard] Component rendered', {
    userId: user.id,
    activeCompanyId: user.activeCompanyId,
    timestamp: new Date().toISOString(),
  });

  // Fetch learning data for enhanced stats
  const {
    data: learningData,
    isLoading: isLoadingLearning,
    error: learningError,
  } = useQuery<LearningApiResponse, Error>({
    queryKey: ['learningData', user.id, user.activeCompanyId],
    queryFn: () => fetchLearningData(user.id, user.activeCompanyId || ''),
    enabled: !!user.id && !!user.activeCompanyId,
    staleTime: 0, // Force fresh data
    gcTime: 0, // Don't cache
  });

  // Fetch course assignments for basic course data
  const {
    data: coursesData,
    isLoading: isLoadingCourses,
    error: coursesError,
  } = useQuery<CoursesApiResponse, Error>({
    queryKey: ['courseAssignments', user.id, user.activeCompanyId],
    queryFn: () => fetchCourseAssignments(user.id, user.activeCompanyId || ''),
    enabled: !!user.id && !!user.activeCompanyId,
    staleTime: 0, // Force fresh data
    gcTime: 0, // Don't cache
  });

  const isLoading = isLoadingLearning || isLoadingCourses;
  const error = learningError || coursesError;

  console.log('[EmployeeDashboard] Data fetch status', {
    isLoadingLearning,
    isLoadingCourses,
    hasLearningData: !!learningData,
    hasCoursesData: !!coursesData,
    learningError: learningError?.message,
    coursesError: coursesError?.message,
    userId: user.id,
    activeCompanyId: user.activeCompanyId,
  });

  // Use courses data if available, fallback to learning data
  const courseAssignments = coursesData?.courses || learningData?.courses || [];
  const stats = learningData?.stats;
  const skillProgress = learningData?.skillProgress || {};

  console.log('[EmployeeDashboard] Processed data', {
    courseAssignmentsCount: courseAssignments.length,
    hasStats: !!stats,
    skillProgressCategories: Object.keys(skillProgress),
    userId: user.id,
    activeCompanyId: user.activeCompanyId,
  });

  // Fallback stats from courses data
  const timeInvested =
    learningData?.stats?.totalTimeInvested || coursesData?.timeInvested || 0;
  const completedCoursesCount =
    learningData?.stats?.completedCourses ||
    coursesData?.completedCoursesCount ||
    0;
  const uncompletedCoursesCount =
    learningData?.stats?.uncompletedCoursesCount ||
    coursesData?.uncompletedCoursesCount ||
    0;
  const averageFinalQuizScore = coursesData?.averageFinalQuizScore || 0;

  const getStatusColor = (status: CourseWithProgress['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-success-green text-alabaster border-success-green';
      case 'in-progress':
        return 'bg-charcoal text-alabaster border-charcoal';
      default:
        return 'bg-warm-gray text-alabaster border-warm-gray';
    }
  };

  const getStatusIcon = (status: CourseWithProgress['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-3 w-3" />;
      case 'in-progress':
        return <Play className="h-3 w-3" />;
      default:
        return <BookOpen className="h-3 w-3" />;
    }
  };

  const getCategoryIcon = (category: CourseWithProgress['category']) => {
    switch (category) {
      case 'compliance':
        return <Award className="h-8 w-8 text-warning-ochre" />;
      case 'skills':
        return <TrendingUp className="h-8 w-8 text-charcoal" />;
      case 'culture':
        return <Users className="h-8 w-8 text-success-green" />;
      case 'technical':
        return <BookOpen className="h-8 w-8 text-charcoal" />;
      default:
        return <BookOpen className="h-8 w-8 text-charcoal" />;
    }
  };

  // const getDifficultyColor = (
  //   difficulty?: CourseWithProgress['difficulty']
  // ) => {
  //   switch (difficulty) {
  //     case 'Beginner':
  //       return 'text-success-green';
  //     case 'Intermediate':
  //       return 'text-warning-ochre';
  //     case 'Advanced':
  //       return 'text-charcoal';
  //     default:
  //       return 'text-warm-gray';
  //   }
  // };

  const getAssignmentTypeBadge = (assignment: CourseWithProgress) => {
    if (assignment.assignmentType === 'interval' && assignment.interval) {
      return (
        <Badge
          variant="outline"
          className="text-xs bg-alabaster border-warm-gray/30"
        >
          <Calendar className="h-3 w-3 mr-1" />
          {assignment.interval}
        </Badge>
      );
    }
    return null;
  };

  // Calculate stats based on courseAssignments
  const assignedCoursesCount = courseAssignments?.length || 0;

  const totalProgress =
    courseAssignments?.reduce(
      (acc: number, ca: CourseWithProgress) => acc + (ca.progress || 0),
      0
    ) || 0;
  const overallProgress =
    assignedCoursesCount > 0
      ? Math.round(totalProgress / assignedCoursesCount)
      : 0;

  const formattedTotalTimeInvested = formatDuration(timeInvested);

  // Filter courses for the "My Courses" section
  const now = new Date();
  const filteredUserCourses = (courseAssignments || []).filter(
    (ca: CourseWithProgress) => {
      if (activeFilter === 'not-started') {
        return ca.status === 'not-started';
      }
      if (activeFilter === 'in-progress') {
        return ca.status === 'in-progress';
      }
      if (activeFilter === 'completed') {
        return ca.status === 'completed';
      }
      if (activeFilter === 'overdue') {
        if (!ca.assignedAt || ca.status === 'completed') return false;
        const assignedDate = new Date(ca.assignedAt);
        const diffDays =
          (now.getTime() - assignedDate.getTime()) / (1000 * 60 * 60 * 24);
        return (
          diffDays > 14 &&
          (ca.status === 'not-started' || ca.status === 'in-progress')
        );
      }
      return true;
    }
  );

  // Overdue logic for badge
  const hasOverdue = courseAssignments.some((ca: CourseWithProgress) => {
    if (!ca.assignedAt || ca.status === 'completed') return false;
    const assignedDate = new Date(ca.assignedAt);
    const diffDays =
      (now.getTime() - assignedDate.getTime()) / (1000 * 60 * 60 * 24);
    return (
      diffDays > 14 &&
      (ca.status === 'not-started' || ca.status === 'in-progress')
    );
  });

  return (
    <div
      className="flex-1 space-y-6 p-6 min-h-screen"
      style={{ backgroundColor: '#f5f4ed' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-charcoal">
              Welcome back,{' '}
              <span className="capitalize">
                {user.firstName
                  ? user.firstName
                  : user.name
                    ? user.name.split(' ')[0]
                    : ''}
              </span>
            </h1>
            <p className="text-warm-gray">Continue your learning journey</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasOverdue ? (
            <Badge className="bg-warning-ochre text-alabaster">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Overdue
            </Badge>
          ) : (
            <Badge className="bg-success-green text-alabaster">
              <CheckCircle className="h-3 w-3 mr-1" />
              On Track
            </Badge>
          )}
        </div>
      </div>

      {/* Enhanced Stats Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card border-warm-gray/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-warm-gray">
              Assigned Courses
            </CardTitle>
            <BookOpen className="h-4 w-4 text-charcoal" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-charcoal">
              {assignedCoursesCount}
            </div>
            <p className="text-xs text-warm-gray">
              {completedCoursesCount} completed, {uncompletedCoursesCount}{' '}
              uncompleted
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-warm-gray/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-warm-gray">
              Overall Progress
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-success-green" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-charcoal">{`${overallProgress}%`}</div>
            <p className="text-xs text-warm-gray">Average completion</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-warm-gray/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-warm-gray">
              {stats?.completedThisMonth ? 'This Month' : 'Average Quiz Score'}
            </CardTitle>
            {stats?.completedThisMonth ? (
              <Target className="h-4 w-4 text-warning-ochre" />
            ) : (
              <Award className="h-4 w-4 text-warning-ochre" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-charcoal">
              {stats?.completedThisMonth || averageFinalQuizScore}
              {stats?.completedThisMonth ? '' : '%'}
            </div>
            <p className="text-xs text-warm-gray">
              {stats?.completedThisMonth
                ? 'Courses completed this month'
                : completedCoursesCount > 0
                  ? `Based on ${completedCoursesCount} completed courses`
                  : 'No completed courses yet'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-warm-gray/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-warm-gray">
              Time Invested
            </CardTitle>
            <Clock className="h-4 w-4 text-charcoal" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-charcoal">
              {formattedTotalTimeInvested}
            </div>
            <p className="text-xs text-warm-gray">
              {stats?.certificatesEarned
                ? `${stats.certificatesEarned} certificates earned`
                : 'This quarter'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Skill Progress Section - Only show if we have skill progress data */}
      {Object.keys(skillProgress).length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-charcoal">Skill Development</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(skillProgress).map(([category, data]) => (
              <Card key={category} className="bg-card border-warm-gray/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-charcoal capitalize">
                    {category} Skills
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-warm-gray">Progress</span>
                      <span className="text-charcoal font-medium">
                        {((data?.completed / data?.total) * 100).toFixed(1) ||
                          0}
                        %
                      </span>
                    </div>
                    <Progress
                      value={(data?.completed / data?.total) * 100 || 0}
                      className="h-2"
                    />
                    <div className="flex justify-between text-xs text-warm-gray">
                      <span>
                        {data.completed} of {data.total} completed
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Course Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-charcoal">My Courses</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className={
                activeFilter === 'all'
                  ? 'bg-charcoal text-white'
                  : 'bg-transparent border-warm-gray/30'
              }
              onClick={() => setActiveFilter('all')}
            >
              All Courses
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={
                activeFilter === 'not-started'
                  ? 'bg-charcoal text-white'
                  : 'bg-transparent border-warm-gray/30'
              }
              onClick={() => setActiveFilter('not-started')}
            >
              Not Started
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={
                activeFilter === 'in-progress'
                  ? 'bg-charcoal text-white'
                  : 'bg-transparent border-warm-gray/30'
              }
              onClick={() => setActiveFilter('in-progress')}
            >
              In Progress
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={
                activeFilter === 'completed'
                  ? 'bg-charcoal text-white'
                  : 'bg-transparent border-warm-gray/30'
              }
              onClick={() => setActiveFilter('completed')}
            >
              Completed
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={
                activeFilter === 'overdue'
                  ? 'bg-warning-ochre text-white'
                  : 'bg-transparent border-warm-gray/30'
              }
              onClick={() => setActiveFilter('overdue')}
            >
              Overdue
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <Card
                key={index}
                className="bg-card border-warm-gray/20 shadow-soft"
              >
                <CardHeader className="space-y-4">
                  <div className="flex items-start justify-between">
                    <Skeleton className="h-12 w-12 rounded-lg bg-gray-300" />
                    <Skeleton className="h-6 w-24 rounded-full bg-gray-300" />
                  </div>
                  <div>
                    <Skeleton className="h-6 w-3/4 bg-gray-300" />
                    <Skeleton className="h-4 w-full mt-2 bg-gray-300" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-1/4 bg-gray-300" />
                      <Skeleton className="h-4 w-1/4 bg-gray-300" />
                    </div>
                    <Skeleton className="h-2 w-full bg-gray-300" />
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-3 w-1/3 bg-gray-300" />
                      <Skeleton className="h-3 w-1/4 bg-gray-300" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-1/2 bg-gray-300" />
                    <Skeleton className="h-3 w-1/3 bg-gray-300" />
                    <Skeleton className="h-3 w-1/4 bg-gray-300" />
                  </div>
                  <Skeleton className="h-10 w-full bg-gray-300" />
                </CardContent>
              </Card>
            ))
          ) : error ? (
            <div className="col-span-full text-center text-warning-ochre">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
              <p>Error loading courses: {error.message}</p>
              <Button
                onClick={() => window.location.reload()}
                className="mt-4 bg-charcoal text-white hover:bg-charcoal/90"
              >
                Try Again
              </Button>
            </div>
          ) : filteredUserCourses.length > 0 ? (
            filteredUserCourses.map((assignment) => {
              const totalLessons = assignment.totalLessons || 0;
              const completedLessons = assignment.completedLessons || 0;
              return (
                <Card
                  key={assignment._id}
                  className={`bg-card border-warm-gray/20 shadow-soft hover:shadow-soft-lg transition-soft cursor-pointer group`}
                >
                  <CardHeader className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-alabaster border border-warm-gray/20">
                        {getCategoryIcon(assignment.category)}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge
                          className={`${getStatusColor(assignment.status)} flex items-center gap-1`}
                          variant="secondary"
                        >
                          {getStatusIcon(assignment.status)}
                          {assignment.status === 'not-started' && 'Not Started'}
                          {assignment.status === 'in-progress' && 'In Progress'}
                          {assignment.status === 'completed' && 'Completed'}
                        </Badge>
                        {getAssignmentTypeBadge(assignment)}
                      </div>
                    </div>
                    <div>
                      <CardTitle className="text-lg text-charcoal group-hover:text-charcoal/80 transition-soft">
                        {assignment.title}
                      </CardTitle>
                      <CardDescription className="text-warm-gray mt-2">
                        {assignment.description}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-warm-gray">Progress</span>
                        <span className="text-charcoal font-medium">
                          {assignment.progress}%
                        </span>
                      </div>
                      <Progress
                        value={assignment.progress}
                        className={`h-2 ${
                          assignment.progress === 100
                            ? '[&>div]:bg-success-green'
                            : assignment.progress > 50
                              ? ''
                              : ''
                        }`}
                      />
                      <div className="flex items-center justify-between text-xs text-warm-gray">
                        <span>
                          {completedLessons} of {totalLessons} lessons
                        </span>
                      </div>
                    </div>

                    {/* Course details */}
                    <div className="space-y-2 text-xs text-warm-gray">
                      {/* {assignment.difficulty && (
                        <div className="flex items-center gap-1">
                          <span>Level:</span>
                          <span
                            className={`font-medium ${getDifficultyColor(assignment.difficulty)}`}
                          >
                            {assignment.difficulty}
                          </span>
                        </div>
                      )} */}
                      {assignment.duration > 0 && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatDuration(assignment.duration)}</span>
                        </div>
                      )}
                      {assignment.assignedAt && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>
                            Assigned:{' '}
                            {new Date(
                              assignment.assignedAt
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Link
                        href={`/dashboard/assignment/${assignment._id}`}
                        className="flex-1"
                      >
                        <Button
                          className={`px-4 py-2 rounded-md transition-colors w-full ${
                            assignment.status === 'completed'
                              ? 'bg-success-green text-white hover:bg-success-green/90'
                              : 'bg-charcoal text-white hover:bg-charcoal/90'
                          }`}
                          disabled={assignment.status === 'completed'}
                        >
                          {(() => {
                            return assignment.status === 'completed' ? (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Completed
                              </>
                            ) : (
                              <>
                                <Play className="h-4 w-4 mr-2" />
                                Continue
                              </>
                            );
                          })()}
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <div className="col-span-full text-center text-warm-gray min-h-[200px] flex flex-col items-center justify-center">
              <BookOpen className="h-8 w-8 mx-auto mb-2" />
              <p className="text-lg font-medium mb-2">
                {activeFilter === 'all'
                  ? 'No courses assigned yet'
                  : activeFilter === 'not-started'
                    ? 'No courses not started'
                    : activeFilter === 'in-progress'
                      ? 'No courses in progress'
                      : activeFilter === 'completed'
                        ? 'No completed courses'
                        : 'No overdue courses'}
              </p>
              <p className="text-sm text-warm-gray/70">
                {activeFilter === 'all'
                  ? 'Your assigned courses will appear here once they are assigned by your administrator.'
                  : activeFilter === 'not-started'
                    ? 'All your assigned courses have been started.'
                    : activeFilter === 'in-progress'
                      ? 'Start a course to see it in your progress list.'
                      : activeFilter === 'completed'
                        ? 'Complete courses to see them in your completed list.'
                        : 'Courses that have not been completed after 2 weeks will appear here.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
