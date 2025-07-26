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
} from 'lucide-react';
import type { User } from 'next-auth'; // Import the original User type
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDuration } from '@/lib/duration';

// Interface for course data received from the API
interface CourseWithProgress {
  _id: string;
  title: string;
  description: string;
  category: 'compliance' | 'skills' | 'culture' | 'technical' | 'General';
  duration: number;
  progress: number;
  status: 'not-started' | 'in-progress' | 'completed';
  totalLessons: number;
  completedLessons: number;
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  rating?: any[];
  enrolledCount?: number;
  tags?: string[];
  assignedAt?: string; // Added for overdue filter
}

interface ApiResponse {
  courses: CourseWithProgress[];
  timeInvested: number;
  completedCoursesCount: number;
  uncompletedCoursesCount: number;
  averageFinalQuizScore: number;
}

// Define a more specific User type
// Note: courseAssignments on the user prop might not be used as the component fetches fresh data.
interface ExtendedUser extends User {
  courseAssignments?: any[]; // Using any[] to avoid conflict with the new structure.
}

interface EmployeeDashboardProps {
  user: ExtendedUser;
}

const fetchCourseAssignments = async (): Promise<ApiResponse> => {
  const response = await fetch(`/api/employee/courses`);
  if (!response.ok) {
    throw new Error('Failed to fetch course assignments');
  }
  return response.json();
};

export function EmployeeDashboard({ user }: EmployeeDashboardProps) {
  const [activeFilter, setActiveFilter] = useState<
    'all' | 'not-started' | 'in-progress' | 'completed' | 'overdue'
  >('all');

  const { data, isLoading, error } = useQuery<ApiResponse, Error>({
    queryKey: ['courseAssignments', user.id],
    queryFn: fetchCourseAssignments,
    enabled: !!user.id, // Only run the query if the user ID is available
  });

  const courseAssignments = data?.courses || [];
  const timeInvested = data?.timeInvested || 0;
  const completedCoursesCount = data?.completedCoursesCount || 0;
  const uncompletedCoursesCount = data?.uncompletedCoursesCount || 0;
  const averageFinalQuizScore = data?.averageFinalQuizScore || 0;

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

  const getDifficultyColor = (
    difficulty?: CourseWithProgress['difficulty']
  ) => {
    switch (difficulty) {
      case 'Beginner':
        return 'text-success-green';
      case 'Intermediate':
        return 'text-warning-ochre';
      case 'Advanced':
        return 'text-charcoal';
      default:
        return 'text-warm-gray';
    }
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
    (ca: CourseWithProgress & { assignedAt?: string }) => {
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
  const hasOverdue = courseAssignments.some(
    (ca: CourseWithProgress & { assignedAt?: string }) => {
      if (!ca.assignedAt || ca.status === 'completed') return false;
      const assignedDate = new Date(ca.assignedAt);
      const diffDays =
        (now.getTime() - assignedDate.getTime()) / (1000 * 60 * 60 * 24);
      return (
        diffDays > 14 &&
        (ca.status === 'not-started' || ca.status === 'in-progress')
      );
    }
  );

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

      {/* Stats Overview */}
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
              Average Final Quiz Score
            </CardTitle>
            <Award className="h-4 w-4 text-warning-ochre" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-charcoal">
              {averageFinalQuizScore}%
            </div>
            <p className="text-xs text-warm-gray">
              {completedCoursesCount > 0 
                ? `Based on ${completedCoursesCount} completed courses`
                : 'No completed courses yet'
              }
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
            <p className="text-xs text-warm-gray">This quarter</p>
          </CardContent>
        </Card>
      </div>

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
                      <Badge
                        className={`${getStatusColor(assignment.status)} flex items-center gap-1`}
                        variant="secondary"
                      >
                        {getStatusIcon(assignment.status)}
                        {assignment.status === 'not-started' && 'Not Started'}
                        {assignment.status === 'in-progress' && 'In Progress'}
                        {assignment.status === 'completed' && 'Completed'}
                      </Badge>
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
                              ? '[&>div]:bg-charcoal'
                              : '[&>div]:bg-warm-gray'
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
                      {assignment.difficulty && (
                        <div className="flex items-center gap-1">
                          <span>Level:</span>
                          <span
                            className={`font-medium ${getDifficultyColor(assignment.difficulty)}`}
                          >
                            {assignment.difficulty}
                          </span>
                        </div>
                      )}
                      {assignment.duration > 0 && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>
                            {formatDuration(assignment.duration * 60)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Link
                        href={`/dashboard/course/${assignment._id}`}
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
                          {assignment.status === 'completed' ? (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Completed
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4 mr-2" />
                              Continue
                            </>
                          )}
                        </Button>
                      </Link>
                      {assignment.status === 'completed' && (
                        <Button
                          variant="outline"
                          size="icon"
                          className="bg-transparent border-warm-gray/30"
                          title="Download Certificate"
                        >
                          <Award className="h-4 w-4" />
                        </Button>
                      )}
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
